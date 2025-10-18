const { USER_TYPES, HTTP_STATUS, ERROR_MESSAGES } = require('../utils/constants');
const SuperAdmin = require('../models/superAdmin.model');

/**
 * Middleware to verify user is a super admin
 */
exports.isSuperAdmin = async (req, res, next) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: ERROR_MESSAGES.UNAUTHORIZED
      });
    }

    // Check if user type is super_admin
    if (req.user.userType !== USER_TYPES.SUPER_ADMIN) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'Super admin access required'
      });
    }

    // Fetch full super admin data with permissions
    const superAdmin = await SuperAdmin.findById(req.user._id);

    if (!superAdmin) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'Super admin profile not found'
      });
    }

    // Check IP whitelist if configured
    const clientIP = req.ip || req.connection.remoteAddress;
    if (!superAdmin.isIPAllowed(clientIP)) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'Access denied from this IP address'
      });
    }

    // Attach super admin to request
    req.superAdmin = superAdmin;
    next();
  } catch (error) {
    console.error('Super admin middleware error:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.INTERNAL_ERROR
    });
  }
};

/**
 * Middleware to check specific permission
 */
exports.hasPermission = (permission) => {
  return async (req, res, next) => {
    try {
      if (!req.superAdmin) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: 'Super admin access required'
        });
      }

      if (!req.superAdmin.hasPermission(permission)) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: `Permission denied: ${permission} required`
        });
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: ERROR_MESSAGES.INTERNAL_ERROR
      });
    }
  };
};

/**
 * Middleware to verify master admin level
 */
exports.isMasterAdmin = async (req, res, next) => {
  try {
    if (!req.superAdmin) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'Super admin access required'
      });
    }

    if (req.superAdmin.adminLevel !== 'master') {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'Master admin access required'
      });
    }

    next();
  } catch (error) {
    console.error('Master admin check error:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.INTERNAL_ERROR
    });
  }
};

/**
 * Middleware to log super admin actions
 */
exports.logAction = (action, targetModel) => {
  return async (req, res, next) => {
    const originalSend = res.send;

    res.send = function(data) {
      // Only log successful operations (2xx status codes)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const targetId = req.params.id || req.body._id || null;
        const description = `${action} on ${targetModel}`;
        const ip = req.ip || req.connection.remoteAddress;

        if (req.superAdmin) {
          req.superAdmin.logAction(action, targetModel, targetId, description, ip)
            .catch(err => console.error('Failed to log admin action:', err));
        }
      }

      originalSend.call(this, data);
    };

    next();
  };
};
