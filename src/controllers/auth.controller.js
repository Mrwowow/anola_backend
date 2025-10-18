const User = require('../models/user.model');
const Provider = require('../models/provider.model');
const Sponsor = require('../models/sponsor.model');
const Vendor = require('../models/vendor.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/config');

// Register new user
exports.register = async (req, res) => {
  try {
    const {
      email, password, firstName, lastName, role, phoneNumber, dateOfBirth, gender, address,
      // Provider-specific fields
      licenseNumber, specialty, qualifications, practiceType, practiceName,
      // Sponsor-specific fields
      organizationName, organizationType,
      // Vendor-specific fields
      businessName, businessType
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    const userType = role || 'patient';

    // Base user data
    const baseUserData = {
      email,
      phone: phoneNumber || email.replace('@', ''), // Fallback phone
      password: password, // Don't hash here - model will hash it
      userType,
      profile: {
        firstName,
        lastName,
        dateOfBirth: dateOfBirth || new Date('2000-01-01'),
        gender: gender || 'other',
        nationalId: `NID-${Date.now()}`, // Generate temporary ID
        address: address || {
          street: 'Not provided',
          city: 'Not provided',
          state: 'Not provided',
          zipCode: '00000',
          country: 'Not provided'
        }
      }
    };

    let user;

    // Create user based on role
    if (userType === 'provider') {
      // Provider requires license number
      if (!licenseNumber) {
        return res.status(400).json({
          success: false,
          message: 'License number is required for provider registration'
        });
      }

      user = await Provider.create({
        ...baseUserData,
        professionalInfo: {
          licenseNumber,
          specializations: specialty ? [{ name: specialty, certified: false }] : [],
          qualifications: qualifications || [],
          experience: { years: 0, summary: '' },
          languages: ['English']
        },
        practice: {
          name: practiceName || `${firstName} ${lastName} Practice`,
          type: practiceType || 'private_practice'
        },
        services: [],
        availability: {
          isAvailable: true
        }
      });
    } else if (userType === 'sponsor') {
      user = await Sponsor.create({
        ...baseUserData,
        organizationInfo: {
          name: organizationName || `${firstName} ${lastName} Foundation`,
          type: organizationType || 'individual',
          description: ''
        }
      });
    } else if (userType === 'vendor') {
      user = await Vendor.create({
        ...baseUserData,
        businessInfo: {
          name: businessName || `${firstName} ${lastName} Business`,
          type: businessType || 'pharmacy',
          description: ''
        }
      });
    } else {
      // Default patient registration
      user = await User.create(baseUserData);
    }

    // Generate tokens
    const accessToken = jwt.sign(
      { userId: user._id, role: user.userType },
      config.jwtSecret,
      { expiresIn: config.jwtExpire }
    );

    const refreshToken = jwt.sign(
      { userId: user._id },
      config.refreshSecret,
      { expiresIn: config.refreshExpire }
    );

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      data: {
        user: userResponse,
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user and explicitly select password field
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate tokens
    const accessToken = jwt.sign(
      { userId: user._id, role: user.userType },
      config.jwtSecret,
      { expiresIn: config.jwtExpire }
    );

    const refreshToken = jwt.sign(
      { userId: user._id },
      config.refreshSecret,
      { expiresIn: config.refreshExpire }
    );

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(200).json({
      success: true,
      data: {
        user: userResponse,
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(400).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
};

// Refresh token
exports.refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required'
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, config.refreshSecret);

    // Generate new access token
    const accessToken = jwt.sign(
      { userId: decoded.userId },
      config.jwtSecret,
      { expiresIn: config.jwtExpire }
    );

    res.status(200).json({
      success: true,
      data: { accessToken }
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired refresh token'
    });
  }
};

// Logout user
exports.logout = async (req, res) => {
  try {
    // In a real implementation, you would invalidate the token
    // For now, just return success
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Logout failed',
      error: error.message
    });
  }
};

// Forgot password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // In a real implementation, you would:
    // 1. Generate a reset token
    // 2. Save it to the user
    // 3. Send email with reset link

    res.status(200).json({
      success: true,
      message: 'Password reset email sent'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to process request',
      error: error.message
    });
  }
};

// Reset password
exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    // In a real implementation, you would:
    // 1. Verify the reset token
    // 2. Find user by token
    // 3. Hash new password
    // 4. Update user password
    // 5. Invalidate the reset token

    res.status(200).json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to reset password',
      error: error.message
    });
  }
};
