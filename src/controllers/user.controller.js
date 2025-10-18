const User = require('../models/user.model');
const crypto = require('crypto');

// Get user profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to get profile',
      error: error.message
    });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      middleName,
      phoneNumber,
      dateOfBirth,
      gender,
      address,
      preferences
    } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update profile fields
    if (firstName) user.profile.firstName = firstName;
    if (lastName) user.profile.lastName = lastName;
    if (middleName !== undefined) user.profile.middleName = middleName;
    if (dateOfBirth) user.profile.dateOfBirth = dateOfBirth;
    if (gender) user.profile.gender = gender;

    // Update phone if provided
    if (phoneNumber) user.phone = phoneNumber;

    // Update address
    if (address) {
      user.profile.address = {
        ...user.profile.address,
        ...address
      };
    }

    // Update preferences
    if (preferences) {
      user.preferences = {
        ...user.preferences,
        ...preferences
      };
    }

    await user.save();

    res.status(200).json({
      success: true,
      data: user,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
};

// Verify email
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Verification token is required'
      });
    }

    // Find user with matching token
    const user = await User.findOne({
      'verificationStatus.email.token': token,
      'verificationStatus.email.tokenExpires': { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token'
      });
    }

    // Mark email as verified
    user.verificationStatus.email.verified = true;
    user.verificationStatus.email.verifiedAt = new Date();
    user.verificationStatus.email.token = undefined;
    user.verificationStatus.email.tokenExpires = undefined;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Email verified successfully'
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to verify email',
      error: error.message
    });
  }
};

// Send email verification
exports.sendEmailVerification = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.verificationStatus.email.verified) {
      return res.status(400).json({
        success: false,
        message: 'Email already verified'
      });
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    user.verificationStatus.email.token = verificationToken;
    user.verificationStatus.email.tokenExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    await user.save();

    // TODO: Send email with verification link
    // For now, just return the token (in production, this should be sent via email)

    res.status(200).json({
      success: true,
      message: 'Verification email sent',
      // Remove this in production - only for testing
      data: {
        verificationToken
      }
    });
  } catch (error) {
    console.error('Send verification email error:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to send verification email',
      error: error.message
    });
  }
};
