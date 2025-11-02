const notificationService = require('../services/notification.service');
const Notification = require('../models/notification.model');
const User = require('../models/user.model');

const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500
};

/**
 * Send individual notification
 * POST /api/messages/send
 */
exports.sendIndividualMessage = async (req, res) => {
  try {
    const {
      recipientId,
      type, // 'sms', 'email', 'push'
      subject,
      message,
      htmlContent,
      category = 'general',
      priority = 'normal'
    } = req.body;

    // Validate required fields
    if (!recipientId || !type || !message) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Missing required fields: recipientId, type, message'
      });
    }

    // Validate notification type
    const validTypes = ['sms', 'email', 'push'];
    if (!validTypes.includes(type)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: `Invalid type. Must be one of: ${validTypes.join(', ')}`
      });
    }

    // Email requires subject
    if (type === 'email' && !subject) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Subject is required for email notifications'
      });
    }

    // Get recipient
    const recipient = await User.findById(recipientId)
      .select('email phone profile.firstName profile.lastName userType deviceToken');

    if (!recipient) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Recipient not found'
      });
    }

    // Check authorization - providers can only message their patients
    if (req.user.userType === 'provider') {
      const isAuthorized = await checkProviderPatientRelationship(req.user._id, recipientId);
      if (!isAuthorized) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: 'You can only message your own patients'
        });
      }
    }

    // Create notification record
    const notification = await Notification.create({
      type,
      sender: {
        userId: req.user._id,
        userType: req.user.userType
      },
      recipients: [{
        userId: recipient._id,
        email: recipient.email,
        phone: recipient.phone,
        deviceToken: recipient.deviceToken,
        status: 'pending'
      }],
      subject,
      message,
      htmlContent,
      targeting: {
        type: 'individual'
      },
      category,
      priority,
      status: 'sending',
      totalRecipients: 1
    });

    // Send notification
    const result = await notificationService.sendNotification({
      type,
      recipient,
      subject,
      message,
      htmlContent
    });

    // Update notification status
    const recipientDoc = notification.recipients[0];
    if (result.success) {
      await notification.updateRecipientStatus(recipientDoc._id, 'sent', {
        messageId: result.messageId
      });
    } else {
      await notification.updateRecipientStatus(recipientDoc._id, 'failed', {
        reason: result.error
      });
    }

    await notification.markAsComplete();

    if (!result.success) {
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to send notification',
        error: result.error
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Notification sent successfully',
      data: {
        notificationId: notification._id,
        type,
        recipient: {
          id: recipient._id,
          name: `${recipient.profile.firstName} ${recipient.profile.lastName}`,
          userType: recipient.userType
        },
        status: 'sent',
        sentAt: new Date()
      }
    });
  } catch (error) {
    console.error('Send individual message error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to send notification',
      error: error.message
    });
  }
};

/**
 * Send bulk notifications
 * POST /api/messages/send-bulk
 */
exports.sendBulkMessage = async (req, res) => {
  try {
    const {
      recipientIds, // Array of user IDs for individual targeting
      targetType, // 'individual', 'role-based', 'all-users'
      targetRoles, // Array of roles: ['provider', 'patient', etc.]
      type, // 'sms', 'email', 'push'
      subject,
      message,
      htmlContent,
      category = 'general',
      priority = 'normal',
      filters = {}
    } = req.body;

    // Validate required fields
    if (!targetType || !type || !message) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Missing required fields: targetType, type, message'
      });
    }

    // Validate notification type
    const validTypes = ['sms', 'email', 'push'];
    if (!validTypes.includes(type)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: `Invalid type. Must be one of: ${validTypes.join(', ')}`
      });
    }

    // Email requires subject
    if (type === 'email' && !subject) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Subject is required for email notifications'
      });
    }

    // Validate targetType
    const validTargetTypes = ['individual', 'role-based', 'all-users'];
    if (!validTargetTypes.includes(targetType)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: `Invalid targetType. Must be one of: ${validTargetTypes.join(', ')}`
      });
    }

    // Check authorization
    if (req.user.userType === 'provider') {
      // Providers can only send to their patients
      if (targetType !== 'individual' || !recipientIds) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: 'Providers can only send individual messages to their patients'
        });
      }
    } else if (req.user.userType !== 'super_admin' && req.user.userType !== 'admin') {
      // Only super_admin and admin can send bulk/role-based messages
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'Only administrators can send bulk or role-based notifications'
      });
    }

    // Get recipients
    const recipients = await notificationService.getRecipients({
      targetType,
      targetRoles,
      targetUserIds: recipientIds,
      filters
    });

    if (recipients.length === 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'No recipients found matching the criteria'
      });
    }

    // For providers, verify all recipients are their patients
    if (req.user.userType === 'provider') {
      const allAuthorized = await checkProviderPatientsRelationship(
        req.user._id,
        recipients.map(r => r._id)
      );
      if (!allAuthorized) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: 'You can only message your own patients'
        });
      }
    }

    // Send bulk notifications
    const result = await notificationService.sendBulkNotifications({
      type,
      recipients,
      subject,
      message,
      htmlContent,
      senderId: req.user._id,
      senderType: req.user.userType,
      category,
      priority
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Bulk notifications sent',
      data: {
        notificationId: result.notificationId,
        targetType,
        totalRecipients: result.totalRecipients,
        successCount: result.successCount,
        failureCount: result.failureCount,
        sentAt: new Date()
      }
    });
  } catch (error) {
    console.error('Send bulk message error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to send bulk notifications',
      error: error.message
    });
  }
};

/**
 * Get notification history
 * GET /api/messages/history
 */
exports.getNotificationHistory = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      type,
      status,
      category,
      startDate,
      endDate
    } = req.query;

    const query = {};

    // Filter by sender (users see their own sent messages)
    if (req.user.userType !== 'super_admin') {
      query['sender.userId'] = req.user._id;
    }

    // Apply filters
    if (type) query.type = type;
    if (status) query.status = status;
    if (category) query.category = category;

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      Notification.find(query)
        .populate('sender.userId', 'profile.firstName profile.lastName email userType')
        .populate('recipients.userId', 'profile.firstName profile.lastName email userType')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Notification.countDocuments(query)
    ]);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        notifications,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get notification history error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to fetch notification history',
      error: error.message
    });
  }
};

/**
 * Get received notifications for a user
 * GET /api/messages/received
 */
exports.getReceivedNotifications = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      type,
      status,
      category,
      unreadOnly = false
    } = req.query;

    const query = {
      'recipients.userId': req.user._id
    };

    // Apply filters
    if (type) query.type = type;
    if (category) query.category = category;
    if (unreadOnly === 'true') {
      query['recipients.status'] = { $ne: 'read' };
    }
    if (status) {
      query['recipients.status'] = status;
    }

    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      Notification.find(query)
        .populate('sender.userId', 'profile.firstName profile.lastName email userType')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Notification.countDocuments(query)
    ]);

    // Filter recipients to only show current user's data
    const enrichedNotifications = notifications.map(notification => {
      const userRecipient = notification.recipients.find(
        r => r.userId._id.toString() === req.user._id.toString()
      );

      return {
        ...notification,
        recipientStatus: userRecipient?.status,
        sentAt: userRecipient?.sentAt,
        readAt: userRecipient?.readAt,
        recipients: undefined // Remove full recipients list for privacy
      };
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        notifications: enrichedNotifications,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get received notifications error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: error.message
    });
  }
};

/**
 * Mark notification as read
 * PATCH /api/messages/:notificationId/read
 */
exports.markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findById(notificationId);

    if (!notification) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Find the recipient record for this user
    const recipientDoc = notification.recipients.find(
      r => r.userId.toString() === req.user._id.toString()
    );

    if (!recipientDoc) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'You are not a recipient of this notification'
      });
    }

    // Update recipient status
    await notification.updateRecipientStatus(recipientDoc._id, 'read');

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Notification marked as read',
      data: {
        notificationId: notification._id,
        readAt: new Date()
      }
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to update notification',
      error: error.message
    });
  }
};

/**
 * Get notification statistics
 * GET /api/messages/stats
 */
exports.getNotificationStats = async (req, res) => {
  try {
    const query = {};

    // Non-admins only see their own stats
    if (req.user.userType !== 'super_admin' && req.user.userType !== 'admin') {
      query['sender.userId'] = req.user._id;
    }

    const stats = await Notification.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalNotifications: { $sum: 1 },
          totalRecipients: { $sum: '$totalRecipients' },
          totalSuccess: { $sum: '$successCount' },
          totalFailures: { $sum: '$failureCount' },
          byType: {
            $push: {
              type: '$type',
              count: 1
            }
          },
          byCategory: {
            $push: {
              category: '$category',
              count: 1
            }
          }
        }
      }
    ]);

    // Count by type
    const typeStats = await Notification.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          successCount: { $sum: '$successCount' },
          failureCount: { $sum: '$failureCount' }
        }
      }
    ]);

    // Count by category
    const categoryStats = await Notification.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        overall: stats[0] || {
          totalNotifications: 0,
          totalRecipients: 0,
          totalSuccess: 0,
          totalFailures: 0
        },
        byType: typeStats,
        byCategory: categoryStats,
        successRate: stats[0]
          ? ((stats[0].totalSuccess / stats[0].totalRecipients) * 100).toFixed(2)
          : 0
      }
    });
  } catch (error) {
    console.error('Get notification stats error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
};

// Helper functions
async function checkProviderPatientRelationship(providerId, patientId) {
  const Appointment = require('../models/appointment.model');

  // Check if patient was registered by provider
  const patientRegisteredByProvider = await User.findOne({
    _id: patientId,
    'metadata.addedById': providerId
  });

  if (patientRegisteredByProvider) return true;

  // Check if patient has appointments with provider
  const hasAppointment = await Appointment.findOne({
    provider: providerId,
    patient: patientId
  });

  return !!hasAppointment;
}

async function checkProviderPatientsRelationship(providerId, patientIds) {
  const Appointment = require('../models/appointment.model');

  // Get all patients registered by provider
  const registeredPatients = await User.find({
    _id: { $in: patientIds },
    'metadata.addedById': providerId
  }).distinct('_id');

  // Get all patients with appointments
  const appointmentPatients = await Appointment.find({
    provider: providerId,
    patient: { $in: patientIds }
  }).distinct('patient');

  // Combine both sets
  const authorizedPatients = new Set([
    ...registeredPatients.map(id => id.toString()),
    ...appointmentPatients.map(id => id.toString())
  ]);

  // Check if all requested patients are in the authorized set
  return patientIds.every(id => authorizedPatients.has(id.toString()));
}

module.exports = {
  sendIndividualMessage: exports.sendIndividualMessage,
  sendBulkMessage: exports.sendBulkMessage,
  getNotificationHistory: exports.getNotificationHistory,
  getReceivedNotifications: exports.getReceivedNotifications,
  markAsRead: exports.markAsRead,
  getNotificationStats: exports.getNotificationStats
};
