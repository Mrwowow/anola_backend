const mongoose = require('mongoose');
const User = require('./user.model');

const superAdminSchema = new mongoose.Schema({
  // Super Admin Specific Information
  adminLevel: {
    type: String,
    enum: ['super', 'master'],
    default: 'super'
  },

  // Permissions
  permissions: {
    manageUsers: { type: Boolean, default: true },
    manageProviders: { type: Boolean, default: true },
    managePatients: { type: Boolean, default: true },
    manageSponsors: { type: Boolean, default: true },
    manageVendors: { type: Boolean, default: true },
    manageTransactions: { type: Boolean, default: true },
    manageAppointments: { type: Boolean, default: true },
    manageMedicalRecords: { type: Boolean, default: true },
    manageSponsorships: { type: Boolean, default: true },
    manageWallets: { type: Boolean, default: true },
    viewAnalytics: { type: Boolean, default: true },
    systemSettings: { type: Boolean, default: true },
    auditLogs: { type: Boolean, default: true },
    createAdmins: { type: Boolean, default: false } // Only master admins
  },

  // Activity Tracking
  lastLogin: Date,
  loginHistory: [{
    timestamp: Date,
    ip: String,
    userAgent: String,
    location: String,
    success: Boolean
  }],

  // Actions Log
  actionsLog: [{
    action: String,
    targetModel: String,
    targetId: mongoose.Schema.Types.ObjectId,
    description: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    ip: String
  }],

  // Security
  twoFactorRequired: {
    type: Boolean,
    default: true
  },
  allowedIPs: [String],

  // Metadata
  department: String,
  employeeId: String,
  notes: String,
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  }
});

// Indexes
superAdminSchema.index({ employeeId: 1 });
superAdminSchema.index({ adminLevel: 1 });

// Methods
superAdminSchema.methods.logAction = function(action, targetModel, targetId, description, ip) {
  this.actionsLog.push({
    action,
    targetModel,
    targetId,
    description,
    timestamp: new Date(),
    ip
  });

  return this.save();
};

superAdminSchema.methods.recordLogin = function(ip, userAgent, location, success = true) {
  this.loginHistory.push({
    timestamp: new Date(),
    ip,
    userAgent,
    location,
    success
  });

  if (success) {
    this.lastLogin = new Date();
  }

  // Keep only last 50 login records
  if (this.loginHistory.length > 50) {
    this.loginHistory = this.loginHistory.slice(-50);
  }

  return this.save();
};

superAdminSchema.methods.hasPermission = function(permission) {
  return this.permissions[permission] === true;
};

superAdminSchema.methods.canManageAdmins = function() {
  return this.adminLevel === 'master' && this.permissions.createAdmins;
};

// Check IP whitelist
superAdminSchema.methods.isIPAllowed = function(ip) {
  if (!this.allowedIPs || this.allowedIPs.length === 0) {
    return true; // No IP restrictions
  }
  return this.allowedIPs.includes(ip);
};

const SuperAdmin = User.discriminator('super_admin', superAdminSchema);
module.exports = SuperAdmin;
