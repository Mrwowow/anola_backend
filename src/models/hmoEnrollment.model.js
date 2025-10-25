const mongoose = require('mongoose');

const hmoEnrollmentSchema = new mongoose.Schema({
  // User Information
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Plan Information
  planId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'HMOPlan',
    required: true,
    index: true
  },

  // Enrollment Details
  enrollmentType: {
    type: String,
    enum: ['individual', 'family', 'corporate', 'group'],
    required: true
  },
  enrollmentNumber: {
    type: String,
    unique: true,
    required: true
  },
  membershipCardNumber: {
    type: String,
    unique: true,
    sparse: true
  },

  // Dependents (for family plans)
  dependents: [{
    firstName: String,
    lastName: String,
    dateOfBirth: Date,
    gender: String,
    relationship: {
      type: String,
      enum: ['spouse', 'child', 'parent', 'other']
    },
    nationalId: String,
    memberCardNumber: String
  }],

  // Payment Information
  payment: {
    plan: {
      type: String,
      enum: ['monthly', 'quarterly', 'annual'],
      default: 'monthly'
    },
    amount: {
      type: Number,
      required: true
    },
    nextPaymentDate: Date,
    lastPaymentDate: Date,
    paymentMethod: {
      type: String,
      enum: ['card', 'bank_transfer', 'wallet', 'employer']
    },
    autoRenewal: {
      type: Boolean,
      default: true
    }
  },

  // Coverage Details
  coverageStartDate: {
    type: Date,
    required: true
  },
  coverageEndDate: {
    type: Date,
    required: true
  },
  renewalDate: Date,

  // Status
  status: {
    type: String,
    enum: ['pending', 'active', 'suspended', 'cancelled', 'expired', 'grace_period'],
    default: 'pending',
    index: true
  },
  statusHistory: [{
    status: String,
    reason: String,
    changedAt: Date,
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],

  // Primary Care Provider (if applicable)
  primaryCareProvider: {
    providerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    name: String,
    specialty: String,
    assignedDate: Date
  },

  // Utilization Tracking
  utilization: {
    appointmentsUsed: { type: Number, default: 0 },
    prescriptionsUsed: { type: Number, default: 0 },
    claimsSubmitted: { type: Number, default: 0 },
    claimsApproved: { type: Number, default: 0 },
    claimsDenied: { type: Number, default: 0 },
    totalClaimsAmount: { type: Number, default: 0 },
    totalPaidAmount: { type: Number, default: 0 }
  },

  // Financial Limits (copied from plan at enrollment)
  limits: {
    annualMaximum: Number,
    remainingAnnual: Number,
    lifetimeMaximum: Number,
    remainingLifetime: Number,
    deductible: Number,
    deductibleMet: { type: Number, default: 0 },
    maxOutOfPocket: Number,
    outOfPocketMet: { type: Number, default: 0 }
  },

  // Documents
  documents: [{
    type: {
      type: String,
      enum: ['enrollment_form', 'id_proof', 'payment_proof', 'medical_records', 'other']
    },
    name: String,
    url: String,
    uploadedAt: Date
  }],

  // Employer/Sponsor Information (for corporate plans)
  employer: {
    name: String,
    employeeId: String,
    department: String,
    contributionPercentage: Number
  },

  // Cancellation Details
  cancellation: {
    requestedAt: Date,
    effectiveDate: Date,
    reason: String,
    refundAmount: Number,
    refundStatus: {
      type: String,
      enum: ['pending', 'processed', 'denied']
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },

  // Beneficiary Information
  beneficiary: {
    name: String,
    relationship: String,
    phone: String,
    email: String,
    address: String
  },

  // Notes
  notes: String,
  internalNotes: String,

  // Metadata
  enrolledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  enrollmentSource: {
    type: String,
    enum: ['web', 'mobile', 'agent', 'employer', 'admin'],
    default: 'web'
  }

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
hmoEnrollmentSchema.index({ userId: 1, status: 1 });
hmoEnrollmentSchema.index({ planId: 1, status: 1 });
hmoEnrollmentSchema.index({ enrollmentNumber: 1 });
hmoEnrollmentSchema.index({ coverageEndDate: 1 });
hmoEnrollmentSchema.index({ 'payment.nextPaymentDate': 1 });
hmoEnrollmentSchema.index({ createdAt: -1 });

// Virtual for active coverage
hmoEnrollmentSchema.virtual('isActive').get(function() {
  const now = new Date();
  return (
    this.status === 'active' &&
    this.coverageStartDate <= now &&
    this.coverageEndDate >= now
  );
});

// Virtual for coverage status
hmoEnrollmentSchema.virtual('coverageStatus').get(function() {
  const now = new Date();

  if (this.status !== 'active') {
    return this.status;
  }

  if (this.coverageStartDate > now) {
    return 'pending_start';
  }

  if (this.coverageEndDate < now) {
    return 'expired';
  }

  // Check if in grace period (within 30 days of end)
  const daysUntilExpiry = Math.ceil((this.coverageEndDate - now) / (1000 * 60 * 60 * 24));
  if (daysUntilExpiry <= 30) {
    return 'expiring_soon';
  }

  return 'active';
});

// Virtual for total dependents
hmoEnrollmentSchema.virtual('totalDependents').get(function() {
  return this.dependents ? this.dependents.length : 0;
});

// Generate enrollment number
hmoEnrollmentSchema.methods.generateEnrollmentNumber = function() {
  const prefix = 'ENR';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  this.enrollmentNumber = `${prefix}-${timestamp}-${random}`;
  return this.enrollmentNumber;
};

// Generate membership card number
hmoEnrollmentSchema.methods.generateMembershipCardNumber = function() {
  const prefix = 'HMO';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  this.membershipCardNumber = `${prefix}-${timestamp}-${random}`;
  return this.membershipCardNumber;
};

// Calculate coverage dates
hmoEnrollmentSchema.methods.calculateCoverageDates = function(startDate, plan) {
  this.coverageStartDate = startDate || new Date();

  // Calculate end date (1 year from start)
  const endDate = new Date(this.coverageStartDate);
  endDate.setFullYear(endDate.getFullYear() + 1);
  this.coverageEndDate = endDate;

  // Calculate renewal date (30 days before end)
  const renewalDate = new Date(endDate);
  renewalDate.setDate(renewalDate.getDate() - 30);
  this.renewalDate = renewalDate;

  return {
    start: this.coverageStartDate,
    end: this.coverageEndDate,
    renewal: this.renewalDate
  };
};

// Initialize limits from plan
hmoEnrollmentSchema.methods.initializeLimits = function(plan) {
  this.limits = {
    annualMaximum: plan.limits?.annualMaximum || 0,
    remainingAnnual: plan.limits?.annualMaximum || 0,
    lifetimeMaximum: plan.limits?.lifetimeMaximum || 0,
    remainingLifetime: plan.limits?.lifetimeMaximum || 0,
    deductible: plan.pricing?.deductible?.[this.enrollmentType] || 0,
    deductibleMet: 0,
    maxOutOfPocket: plan.pricing?.maxOutOfPocket?.[this.enrollmentType] || 0,
    outOfPocketMet: 0
  };
};

// Update utilization
hmoEnrollmentSchema.methods.updateUtilization = function(type, amount = 0) {
  if (type === 'appointment') {
    this.utilization.appointmentsUsed += 1;
  } else if (type === 'prescription') {
    this.utilization.prescriptionsUsed += 1;
  } else if (type === 'claim') {
    this.utilization.claimsSubmitted += 1;
    this.utilization.totalClaimsAmount += amount;
  } else if (type === 'claim_approved') {
    this.utilization.claimsApproved += 1;
    this.utilization.totalPaidAmount += amount;

    // Update limits
    if (this.limits.remainingAnnual) {
      this.limits.remainingAnnual -= amount;
    }
    if (this.limits.remainingLifetime) {
      this.limits.remainingLifetime -= amount;
    }
  } else if (type === 'claim_denied') {
    this.utilization.claimsDenied += 1;
  }

  return this.save();
};

// Check if enrollment can be cancelled
hmoEnrollmentSchema.methods.canBeCancelled = function() {
  return ['active', 'pending', 'suspended'].includes(this.status);
};

// Check if enrollment can be renewed
hmoEnrollmentSchema.methods.canBeRenewed = function() {
  const now = new Date();
  const daysUntilExpiry = Math.ceil((this.coverageEndDate - now) / (1000 * 60 * 60 * 24));

  return (
    this.status === 'active' &&
    daysUntilExpiry <= 60 && // Can renew within 60 days of expiry
    daysUntilExpiry >= 0
  );
};

// Pre-save middleware
hmoEnrollmentSchema.pre('save', function(next) {
  // Generate enrollment number if not exists
  if (!this.enrollmentNumber) {
    this.generateEnrollmentNumber();
  }

  // Generate membership card number if status is active and not exists
  if (this.status === 'active' && !this.membershipCardNumber) {
    this.generateMembershipCardNumber();
  }

  next();
});

// Static methods
hmoEnrollmentSchema.statics.findActiveEnrollments = function(userId) {
  return this.find({
    userId,
    status: 'active',
    coverageStartDate: { $lte: new Date() },
    coverageEndDate: { $gte: new Date() }
  }).populate('planId');
};

hmoEnrollmentSchema.statics.findExpiringEnrollments = function(days = 30) {
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + days);

  return this.find({
    status: 'active',
    coverageEndDate: { $gte: startDate, $lte: endDate }
  }).populate('userId planId');
};

hmoEnrollmentSchema.statics.findByEnrollmentNumber = function(enrollmentNumber) {
  return this.findOne({ enrollmentNumber }).populate('userId planId');
};

module.exports = mongoose.model('HMOEnrollment', hmoEnrollmentSchema);
