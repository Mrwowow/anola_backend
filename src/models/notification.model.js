const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  // Notification details
  type: {
    type: String,
    enum: ['sms', 'email', 'push', 'in-app'],
    required: true
  },

  // Sender information
  sender: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    userType: {
      type: String,
      enum: ['super_admin', 'admin', 'provider', 'vendor', 'sponsor', 'patient'],
      required: true
    }
  },

  // Recipient information
  recipients: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    email: String,
    phone: String,
    deviceToken: String,
    status: {
      type: String,
      enum: ['pending', 'sent', 'delivered', 'failed', 'read'],
      default: 'pending'
    },
    sentAt: Date,
    deliveredAt: Date,
    readAt: Date,
    failureReason: String
  }],

  // Message content
  subject: {
    type: String,
    required: function() {
      return this.type === 'email';
    }
  },
  message: {
    type: String,
    required: true,
    maxlength: 5000
  },
  htmlContent: {
    type: String // For rich email content
  },

  // Targeting
  targeting: {
    type: {
      type: String,
      enum: ['individual', 'bulk', 'role-based', 'all-users'],
      required: true
    },
    targetRoles: [{
      type: String,
      enum: ['admin', 'provider', 'vendor', 'sponsor', 'patient']
    }],
    filters: {
      userType: String,
      status: String,
      location: String
    }
  },

  // Metadata
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  category: {
    type: String,
    enum: ['appointment', 'payment', 'system', 'marketing', 'alert', 'general'],
    default: 'general'
  },
  scheduledFor: {
    type: Date,
    default: null // null means send immediately
  },

  // Delivery tracking
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'sending', 'sent', 'partially-sent', 'failed'],
    default: 'draft'
  },
  totalRecipients: {
    type: Number,
    default: 0
  },
  successCount: {
    type: Number,
    default: 0
  },
  failureCount: {
    type: Number,
    default: 0
  },

  // External service references
  externalReferences: {
    twilioMessageSid: String,
    sendGridMessageId: String,
    fcmMessageId: String
  },

  // Statistics
  statistics: {
    sentAt: Date,
    completedAt: Date,
    openRate: Number,
    clickRate: Number
  }
}, {
  timestamps: true
});

// Indexes
notificationSchema.index({ 'sender.userId': 1, createdAt: -1 });
notificationSchema.index({ 'recipients.userId': 1, createdAt: -1 });
notificationSchema.index({ type: 1, status: 1 });
notificationSchema.index({ category: 1, createdAt: -1 });
notificationSchema.index({ scheduledFor: 1 });

// Methods
notificationSchema.methods.updateRecipientStatus = function(recipientId, status, metadata = {}) {
  const recipient = this.recipients.id(recipientId);
  if (recipient) {
    recipient.status = status;

    if (status === 'sent' && !recipient.sentAt) {
      recipient.sentAt = new Date();
      this.successCount++;
    }
    if (status === 'delivered') {
      recipient.deliveredAt = new Date();
    }
    if (status === 'read') {
      recipient.readAt = new Date();
    }
    if (status === 'failed') {
      recipient.failureReason = metadata.reason;
      this.failureCount++;
    }

    return this.save();
  }
};

notificationSchema.methods.markAsComplete = function() {
  this.status = 'sent';
  this.statistics.completedAt = new Date();
  return this.save();
};

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
