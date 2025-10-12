const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/user.model');
const config = require('../config/config');
const { HTTP_STATUS, ERROR_MESSAGES, SUCCESS_MESSAGES } = require('../utils/constants');

class AuthService {
  /**
   * Generate JWT tokens
   */
  generateTokens(userId) {
    const accessToken = jwt.sign(
      { userId },
      config.jwtSecret,
      { expiresIn: config.jwtExpire }
    );
    
    const refreshToken = jwt.sign(
      { userId },
      config.refreshSecret,
      { expiresIn: config.refreshExpire }
    );
    
    return { accessToken, refreshToken };
  }

  /**
   * Register new user
   */
  async register(userData, req) {
    const { email, password, userType, ...profileData } = userData;
    
    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { email },
        { phone: profileData.phone },
        { 'profile.nationalId': profileData.profile?.nationalId }
      ]
    });
    
    if (existingUser) {
      throw new Error('User already exists with this email, phone, or national ID');
    }
    
    // Create user
    const user = await User.create({
      email,
      password,
      userType,
      ...profileData
    });
    
    // Generate tokens
    const tokens = this.generateTokens(user._id);
    
    // Save refresh token to database
    user.refreshTokens.push({
      token: tokens.refreshToken,
      device: req.get('User-Agent') || 'Unknown',
      ip: req.ip,
      location: req.get('CF-IPCountry') || 'Unknown'
    });
    
    await user.save();
    
    // Send welcome email (implement email service)
    // await this.sendWelcomeEmail(user);
    
    return {
      user: user.toJSON(),
      ...tokens
    };
  }

  /**
   * Login user
   */
  async login(email, password, req) {
    // Find user with password field
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      throw new Error(ERROR_MESSAGES.INVALID_CREDENTIALS);
    }
    
    // Check if account is locked
    if (user.isLocked) {
      throw new Error('Account is temporarily locked due to too many failed login attempts');
    }
    
    // Verify password
    const isValidPassword = await user.comparePassword(password);
    
    if (!isValidPassword) {
      await user.incrementLoginAttempts();
      throw new Error(ERROR_MESSAGES.INVALID_CREDENTIALS);
    }
    
    // Reset login attempts on successful login
    if (user.loginAttempts > 0) {
      await user.resetLoginAttempts();
    }
    
    // Generate tokens
    const tokens = this.generateTokens(user._id);
    
    // Save refresh token
    user.refreshTokens.push({
      token: tokens.refreshToken,
      device: req.get('User-Agent') || 'Unknown',
      deviceType: this.detectDeviceType(req.get('User-Agent')),
      ip: req.ip,
      location: req.get('CF-IPCountry') || 'Unknown',
      userAgent: req.get('User-Agent')
    });
    
    // Update login info
    user.lastLogin = new Date();
    user.loginHistory.push({
      timestamp: new Date(),
      ip: req.ip,
      location: req.get('CF-IPCountry') || 'Unknown',
      device: req.get('User-Agent') || 'Unknown'
    });
    
    // Keep only last 10 login history entries
    if (user.loginHistory.length > 10) {
      user.loginHistory = user.loginHistory.slice(-10);
    }
    
    await user.save();
    
    return {
      user: user.toJSON(),
      ...tokens
    };
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, config.refreshSecret);
      const user = await User.findById(decoded.userId);
      
      if (!user) {
        throw new Error('User not found');
      }
      
      // Check if refresh token exists in user's tokens
      const tokenExists = user.refreshTokens.some(t => t.token === refreshToken);
      
      if (!tokenExists) {
        throw new Error('Invalid refresh token');
      }
      
      // Generate new tokens
      const tokens = this.generateTokens(user._id);
      
      // Remove old refresh token and add new one
      user.refreshTokens = user.refreshTokens.filter(t => t.token !== refreshToken);
      user.refreshTokens.push({
        token: tokens.refreshToken,
        device: 'Token Refresh',
        ip: 'Unknown'
      });
      
      await user.save();
      
      return {
        user: user.toJSON(),
        ...tokens
      };
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  /**
   * Logout user
   */
  async logout(userId, refreshToken) {
    const user = await User.findById(userId);
    
    if (user && refreshToken) {
      // Remove specific refresh token
      user.refreshTokens = user.refreshTokens.filter(t => t.token !== refreshToken);
      await user.save();
    }
    
    return { message: SUCCESS_MESSAGES.LOGOUT_SUCCESS };
  }

  /**
   * Logout from all devices
   */
  async logoutAll(userId) {
    const user = await User.findById(userId);
    
    if (user) {
      user.refreshTokens = [];
      await user.save();
    }
    
    return { message: 'Logged out from all devices successfully' };
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email) {
    const user = await User.findOne({ email });
    
    if (!user) {
      // Don't reveal if email exists or not
      return { message: 'If an account with that email exists, a reset link has been sent' };
    }
    
    // Generate reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });
    
    // Send reset email (implement email service)
    // await this.sendPasswordResetEmail(user, resetToken);
    
    return { message: 'Password reset email sent' };
  }

  /**
   * Reset password
   */
  async resetPassword(token, newPassword) {
    // Hash the token to compare with database
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');
    
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });
    
    if (!user) {
      throw new Error('Token is invalid or has expired');
    }
    
    // Set new password
    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.passwordChangedAt = Date.now();
    
    await user.save();
    
    return { message: SUCCESS_MESSAGES.PASSWORD_RESET };
  }

  /**
   * Change password
   */
  async changePassword(userId, currentPassword, newPassword) {
    const user = await User.findById(userId).select('+password');
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Verify current password
    const isValidPassword = await user.comparePassword(currentPassword);
    
    if (!isValidPassword) {
      throw new Error('Current password is incorrect');
    }
    
    // Set new password
    user.password = newPassword;
    user.passwordChangedAt = Date.now();
    
    await user.save();
    
    return { message: 'Password changed successfully' };
  }

  /**
   * Verify email
   */
  async verifyEmail(userId, token) {
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    if (user.verificationStatus.email.token !== token || 
        user.verificationStatus.email.tokenExpires < Date.now()) {
      throw new Error('Invalid or expired verification token');
    }
    
    user.verificationStatus.email.verified = true;
    user.verificationStatus.email.verifiedAt = new Date();
    user.verificationStatus.email.token = undefined;
    user.verificationStatus.email.tokenExpires = undefined;
    
    await user.save();
    
    return { message: 'Email verified successfully' };
  }

  /**
   * Send email verification
   */
  async sendEmailVerification(userId) {
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    if (user.verificationStatus.email.verified) {
      throw new Error('Email is already verified');
    }
    
    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    user.verificationStatus.email.token = verificationToken;
    user.verificationStatus.email.tokenExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    
    await user.save();
    
    // Send verification email (implement email service)
    // await this.sendVerificationEmail(user, verificationToken);
    
    return { message: 'Verification email sent' };
  }

  /**
   * Detect device type from user agent
   */
  detectDeviceType(userAgent) {
    if (!userAgent) return 'unknown';
    
    if (/mobile/i.test(userAgent)) return 'mobile';
    if (/tablet/i.test(userAgent)) return 'tablet';
    return 'desktop';
  }

  /**
   * Validate JWT token
   */
  verifyToken(token) {
    try {
      return jwt.verify(token, config.jwtSecret);
    } catch (error) {
      throw new Error('Invalid token');
    }
  }
}

module.exports = new AuthService();