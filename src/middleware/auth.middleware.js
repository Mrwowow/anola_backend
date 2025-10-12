const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const config = require('../config/config');
const { HTTP_STATUS, ERROR_MESSAGES, USER_TYPES } = require('../utils/constants');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Authentication middleware - verify JWT token
 */
const authenticate = asyncHandler(async (req, res, next) => {
  let token;
  
  // Get token from header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  
  if (!token) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      error: ERROR_MESSAGES.UNAUTHORIZED
    });
  }
  
  try {
    // Verify token
    const decoded = jwt.verify(token, config.jwtSecret);
    
    // Get user from token
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Check if user account is active
    if (user.status !== 'active') {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: 'Account is not active'
      });
    }
    
    // Check if password was changed after token was issued
    if (user.passwordChangedAt && decoded.iat < parseInt(user.passwordChangedAt / 1000, 10)) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: 'Password recently changed. Please log in again'
      });
    }
    
    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      error: 'Invalid token'
    });
  }
});

/**
 * Authorization middleware - check user roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: ERROR_MESSAGES.UNAUTHORIZED
      });
    }
    
    if (!roles.includes(req.user.userType)) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        error: ERROR_MESSAGES.FORBIDDEN
      });
    }
    
    next();
  };
};

/**
 * Check if user is the owner of the resource or has admin privileges
 */
const authorizeOwnership = (resourceUserField = 'user') => {
  return asyncHandler(async (req, res, next) => {
    const resourceId = req.params.id;
    
    // Admin can access all resources
    if (req.user.userType === USER_TYPES.ADMIN) {
      return next();
    }
    
    // For user-specific resources, check ownership
    if (resourceUserField === 'user' && resourceId === req.user._id.toString()) {
      return next();
    }
    
    // For other resources, you might need to fetch the resource and check ownership
    // This is a simplified implementation
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      error: 'Access denied: insufficient permissions'
    });
  });
};

/**
 * Check if user's email is verified
 */
const requireEmailVerification = (req, res, next) => {
  if (!req.user.verificationStatus.email.verified) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      error: 'Email verification required'
    });
  }
  
  next();
};

/**
 * Check if user's identity is verified
 */
const requireIdentityVerification = (req, res, next) => {
  if (!req.user.verificationStatus.identity.verified) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      error: 'Identity verification required'
    });
  }
  
  next();
};

/**
 * Check if provider is verified (for provider-specific actions)
 */
const requireProviderVerification = asyncHandler(async (req, res, next) => {
  if (req.user.userType !== USER_TYPES.PROVIDER) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      error: 'Provider access required'
    });
  }
  
  // For providers, check additional verification
  const Provider = require('../models/provider.model');
  const provider = await Provider.findById(req.user._id);
  
  if (!provider || !provider.verification.isVerified) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      error: 'Provider verification required'
    });
  }
  
  next();
});

/**
 * Optional authentication - doesn't fail if no token provided
 */
const optionalAuth = asyncHandler(async (req, res, next) => {
  let token;
  
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  
  if (token) {
    try {
      const decoded = jwt.verify(token, config.jwtSecret);
      const user = await User.findById(decoded.userId);
      
      if (user && user.status === 'active') {
        req.user = user;
      }
    } catch (error) {
      // Continue without authentication
    }
  }
  
  next();
});

/**
 * Rate limiting for authentication endpoints
 */
const authRateLimit = require('express-rate-limit')({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    error: 'Too many authentication attempts, please try again later'
  },
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Check if user has specific permissions
 */
const hasPermission = (permission) => {
  return (req, res, next) => {
    // This is a simplified permission system
    // In a real application, you might have a more complex permission system
    
    const userPermissions = {
      [USER_TYPES.ADMIN]: ['*'], // Admin has all permissions
      [USER_TYPES.PROVIDER]: ['read:appointments', 'write:appointments', 'read:medical-records', 'write:medical-records'],
      [USER_TYPES.PATIENT]: ['read:own-appointments', 'read:own-medical-records'],
      [USER_TYPES.SPONSOR]: ['read:sponsorships', 'write:sponsorships'],
      [USER_TYPES.VENDOR]: ['read:orders', 'write:orders']
    };
    
    const userRolePermissions = userPermissions[req.user.userType] || [];
    
    if (userRolePermissions.includes('*') || userRolePermissions.includes(permission)) {
      return next();
    }
    
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      error: `Permission '${permission}' required`
    });
  };
};

/**
 * Middleware to log user activity
 */
const logActivity = asyncHandler(async (req, res, next) => {
  if (req.user) {
    // Update last activity
    req.user.lastActivity = new Date();
    await req.user.save({ validateBeforeSave: false });
  }
  
  next();
});

module.exports = {
  authenticate,
  authorize,
  authorizeOwnership,
  requireEmailVerification,
  requireIdentityVerification,
  requireProviderVerification,
  optionalAuth,
  authRateLimit,
  hasPermission,
  logActivity
};