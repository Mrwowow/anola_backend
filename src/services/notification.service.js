const sgMail = require('@sendgrid/mail');
const twilio = require('twilio');
const User = require('../models/user.model');
const Notification = require('../models/notification.model');

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY && process.env.SENDGRID_API_KEY.startsWith('SG.')) {
  try {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  } catch (error) {
    console.warn('SendGrid initialization failed:', error.message);
  }
}

// Initialize Twilio
let twilioClient;
if (
  process.env.TWILIO_ACCOUNT_SID &&
  process.env.TWILIO_AUTH_TOKEN &&
  process.env.TWILIO_ACCOUNT_SID.startsWith('AC')
) {
  try {
    twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
  } catch (error) {
    console.warn('Twilio initialization failed:', error.message);
  }
}

class NotificationService {
  /**
   * Send email notification
   */
  async sendEmail({ to, subject, message, htmlContent, from = null }) {
    try {
      if (!process.env.SENDGRID_API_KEY) {
        console.warn('SendGrid API key not configured');
        return { success: false, error: 'Email service not configured' };
      }

      const msg = {
        to,
        from: from || process.env.SENDGRID_FROM_EMAIL || 'noreply@anolahealth.com',
        subject,
        text: message,
        html: htmlContent || `<p>${message.replace(/\n/g, '<br>')}</p>`
      };

      const response = await sgMail.send(msg);

      return {
        success: true,
        messageId: response[0].headers['x-message-id'],
        status: 'sent'
      };
    } catch (error) {
      console.error('Email send error:', error.response?.body || error);
      return {
        success: false,
        error: error.message,
        details: error.response?.body?.errors
      };
    }
  }

  /**
   * Send SMS notification
   */
  async sendSMS({ to, message }) {
    try {
      if (!twilioClient) {
        console.warn('Twilio not configured');
        return { success: false, error: 'SMS service not configured' };
      }

      // Format phone number for Twilio (ensure it starts with +)
      let formattedPhone = to;
      if (!formattedPhone.startsWith('+')) {
        // Assume Nigerian number if no country code
        formattedPhone = '+234' + formattedPhone.replace(/^0+/, '');
      }

      const response = await twilioClient.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: formattedPhone
      });

      return {
        success: true,
        messageId: response.sid,
        status: response.status
      };
    } catch (error) {
      console.error('SMS send error:', error);
      return {
        success: false,
        error: error.message,
        code: error.code
      };
    }
  }

  /**
   * Send push notification (Firebase Cloud Messaging)
   * Note: This is a placeholder - implement based on your FCM setup
   */
  async sendPushNotification({ deviceToken, title, message, data = {} }) {
    try {
      // TODO: Implement FCM integration
      // For now, return a placeholder response
      console.log('Push notification:', { deviceToken, title, message, data });

      return {
        success: true,
        messageId: `push_${Date.now()}`,
        status: 'sent',
        note: 'Push notification placeholder - implement FCM integration'
      };
    } catch (error) {
      console.error('Push notification error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send notification based on type
   */
  async sendNotification({ type, recipient, subject, message, htmlContent, deviceToken }) {
    switch (type) {
      case 'email':
        return await this.sendEmail({
          to: recipient.email,
          subject,
          message,
          htmlContent
        });

      case 'sms':
        return await this.sendSMS({
          to: recipient.phone,
          message
        });

      case 'push':
        return await this.sendPushNotification({
          deviceToken: deviceToken || recipient.deviceToken,
          title: subject,
          message
        });

      default:
        return {
          success: false,
          error: `Unsupported notification type: ${type}`
        };
    }
  }

  /**
   * Send bulk notifications
   */
  async sendBulkNotifications({
    type,
    recipients,
    subject,
    message,
    htmlContent,
    senderId,
    senderType,
    category = 'general',
    priority = 'normal'
  }) {
    try {
      // Create notification record
      const notification = await Notification.create({
        type,
        sender: {
          userId: senderId,
          userType: senderType
        },
        recipients: recipients.map(r => ({
          userId: r._id,
          email: r.email,
          phone: r.phone,
          deviceToken: r.deviceToken,
          status: 'pending'
        })),
        subject,
        message,
        htmlContent,
        targeting: {
          type: 'bulk'
        },
        category,
        priority,
        status: 'sending',
        totalRecipients: recipients.length
      });

      // Send to each recipient
      const results = [];
      for (const recipient of recipients) {
        const result = await this.sendNotification({
          type,
          recipient,
          subject,
          message,
          htmlContent
        });

        // Find the recipient in the notification document
        const recipientDoc = notification.recipients.find(
          r => r.userId.toString() === recipient._id.toString()
        );

        if (result.success) {
          await notification.updateRecipientStatus(
            recipientDoc._id,
            'sent',
            { messageId: result.messageId }
          );
        } else {
          await notification.updateRecipientStatus(
            recipientDoc._id,
            'failed',
            { reason: result.error }
          );
        }

        results.push({
          recipientId: recipient._id,
          success: result.success,
          error: result.error
        });
      }

      // Mark notification as complete
      const updatedNotification = await notification.markAsComplete();

      return {
        success: true,
        notificationId: updatedNotification._id,
        totalRecipients: recipients.length,
        successCount: updatedNotification.successCount,
        failureCount: updatedNotification.failureCount,
        results
      };
    } catch (error) {
      console.error('Bulk notification error:', error);
      throw error;
    }
  }

  /**
   * Get recipients based on targeting criteria
   */
  async getRecipients({ targetType, targetRoles, targetUserIds, filters = {} }) {
    try {
      let query = {};

      if (targetType === 'individual' && targetUserIds) {
        query._id = { $in: targetUserIds };
      } else if (targetType === 'role-based' && targetRoles?.length > 0) {
        query.userType = { $in: targetRoles };
      } else if (targetType === 'all-users') {
        query.status = 'active'; // Only active users
      }

      // Apply additional filters
      if (filters.userType) {
        query.userType = filters.userType;
      }
      if (filters.status) {
        query.status = filters.status;
      }

      const recipients = await User.find(query)
        .select('_id email phone profile.firstName profile.lastName userType deviceToken')
        .lean();

      return recipients;
    } catch (error) {
      console.error('Get recipients error:', error);
      throw error;
    }
  }

  /**
   * Send scheduled notifications (to be called by a cron job)
   */
  async sendScheduledNotifications() {
    try {
      const now = new Date();
      const scheduledNotifications = await Notification.find({
        status: 'scheduled',
        scheduledFor: { $lte: now }
      }).populate('recipients.userId');

      for (const notification of scheduledNotifications) {
        await this.sendBulkNotifications({
          type: notification.type,
          recipients: notification.recipients.map(r => r.userId),
          subject: notification.subject,
          message: notification.message,
          htmlContent: notification.htmlContent,
          senderId: notification.sender.userId,
          senderType: notification.sender.userType,
          category: notification.category,
          priority: notification.priority
        });
      }

      return {
        success: true,
        processedCount: scheduledNotifications.length
      };
    } catch (error) {
      console.error('Scheduled notifications error:', error);
      throw error;
    }
  }
}

module.exports = new NotificationService();
