const mongoose = require('mongoose');
const { SPONSORSHIP_TYPES } = require('../utils/constants');

const sponsorshipSchema = new mongoose.Schema({
  sponsorshipId: {
    type: String,
    unique: true,
    required: true
  },
  
  // Parties
  sponsor: {
    type: mongoose.Schema.ObjectId,
    ref: 'Sponsor',
    required: true
  },
  beneficiary: {
    type: mongoose.Schema.ObjectId,
    ref: 'Patient',
    required: true
  },
  
  // Sponsorship Details
  type: {
    type: String,
    enum: Object.values(SPONSORSHIP_TYPES),
    required: true
  },
  
  // Financial
  amount: {
    allocated: {
      type: Number,
      required: true
    },
    used: {
      type: Number,
      default: 0
    },
    remaining: Number,
    currency: {
      type: String,
      default: 'USD'
    }
  },
  
  // Duration
  duration: {
    startDate: {
      type: Date,
      required: true
    },
    endDate: Date,
    isRecurring: Boolean,
    renewalDate: Date
  },
  
  // Coverage
  coverage: {
    services: [{
      type: String,
      enum: ['consultation', 'medication', 'lab_tests', 'imaging', 'surgery', 'emergency', 'all']
    }],
    providers: [{
      type: mongoose.Schema.ObjectId,
      ref: 'Provider'
    }], // Empty array means all providers
    conditions: [String], // Specific conditions covered
    excludedServices: [String],
    requiresPreApproval: Boolean,
    approvalThreshold: Number // Amount above which approval is needed
  },
  
  // Utilization
  utilization: [{
    date: Date,
    service: String,
    provider: {
      type: mongoose.Schema.ObjectId,
      ref: 'Provider'
    },
    amount: Number,
    appointment: {
      type: mongoose.Schema.ObjectId,
      ref: 'Appointment'
    },
    transaction: {
      type: mongoose.Schema.ObjectId,
      ref: 'Transaction'
    },
    approved: Boolean,
    approvedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    notes: String
  }],
  
  // Status
  status: {
    type: String,
    enum: ['pending', 'active', 'paused', 'expired', 'terminated', 'completed'],
    default: 'pending'
  },
  statusHistory: [{
    status: String,
    changedAt: Date,
    changedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    reason: String
  }],
  
  // Approval
  approval: {
    required: Boolean,
    approvedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    approvedAt: Date,
    comments: String
  },
  
  // Impact Tracking
  impact: {
    healthOutcomes: [{
      metric: String,
      baseline: String,
      current: String,
      improvement: Number,
      measuredAt: Date
    }],
    servicesReceived: {
      consultations: { type: Number, default: 0 },
      medications: { type: Number, default: 0 },
      labTests: { type: Number, default: 0 },
      procedures: { type: Number, default: 0 },
      emergencyVisits: { type: Number, default: 0 }
    },
    testimonial: {
      text: String,
      submittedAt: Date,
      isPublic: Boolean
    }
  },
  
  // Communication
  communications: [{
    type: {
      type: String,
      enum: ['welcome', 'update', 'expiry_reminder', 'thank_you', 'report']
    },
    sentTo: {
      type: String,
      enum: ['sponsor', 'beneficiary', 'both']
    },
    sentAt: Date,
    subject: String,
    content: String
  }],
  
  // Notes
  notes: {
    sponsor: String,
    internal: String,
    beneficiary: String
  },
  
  // Renewal
  renewal: {
    isEligible: Boolean,
    requestedAt: Date,
    requestedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    reviewedAt: Date,
    decision: {
      type: String,
      enum: ['approved', 'rejected', 'pending']
    },
    newAmount: Number,
    newDuration: {
      startDate: Date,
      endDate: Date
    }
  }
}, {
  timestamps: true
});

// Indexes
sponsorshipSchema.index({ sponsor: 1, status: 1 });
sponsorshipSchema.index({ beneficiary: 1, status: 1 });
sponsorshipSchema.index({ sponsorshipId: 1 });
sponsorshipSchema.index({ 'duration.startDate': 1, 'duration.endDate': 1 });
sponsorshipSchema.index({ status: 1 });

// Virtual for utilization rate
sponsorshipSchema.virtual('utilizationRate').get(function() {
  if (this.amount.allocated === 0) return 0;
  return (this.amount.used / this.amount.allocated) * 100;
});

// Virtual for days remaining
sponsorshipSchema.virtual('daysRemaining').get(function() {
  if (!this.duration.endDate) return null;
  const today = new Date();
  const endDate = new Date(this.duration.endDate);
  const diffTime = endDate - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Methods
sponsorshipSchema.methods.utilize = function(utilizationData) {
  // Check if amount is available
  if (this.amount.remaining < utilizationData.amount) {
    throw new Error('Insufficient sponsorship funds');
  }
  
  // Check if pre-approval is required
  if (this.coverage.requiresPreApproval && 
      utilizationData.amount > this.coverage.approvalThreshold &&
      !utilizationData.approved) {
    throw new Error('Pre-approval required for this amount');
  }
  
  // Add utilization record
  this.utilization.push({
    ...utilizationData,
    date: new Date()
  });
  
  // Update amounts
  this.amount.used += utilizationData.amount;
  this.amount.remaining = this.amount.allocated - this.amount.used;
  
  // Update service counts
  const serviceType = utilizationData.service.toLowerCase();
  if (this.impact.servicesReceived[serviceType] !== undefined) {
    this.impact.servicesReceived[serviceType] += 1;
  }
  
  return this.save();
};

sponsorshipSchema.methods.approve = function(approvedBy, comments = '') {
  this.approval.approvedBy = approvedBy;
  this.approval.approvedAt = new Date();
  this.approval.comments = comments;
  this.status = 'active';
  
  this.statusHistory.push({
    status: 'active',
    changedAt: new Date(),
    changedBy: approvedBy,
    reason: 'Approved'
  });
  
  return this.save();
};

sponsorshipSchema.methods.pause = function(pausedBy, reason) {
  this.status = 'paused';
  
  this.statusHistory.push({
    status: 'paused',
    changedAt: new Date(),
    changedBy: pausedBy,
    reason
  });
  
  return this.save();
};

sponsorshipSchema.methods.resume = function(resumedBy) {
  this.status = 'active';
  
  this.statusHistory.push({
    status: 'active',
    changedAt: new Date(),
    changedBy: resumedBy,
    reason: 'Resumed'
  });
  
  return this.save();
};

sponsorshipSchema.methods.terminate = function(terminatedBy, reason) {
  this.status = 'terminated';
  
  this.statusHistory.push({
    status: 'terminated',
    changedAt: new Date(),
    changedBy: terminatedBy,
    reason
  });
  
  return this.save();
};

sponsorshipSchema.methods.addCommunication = function(communicationData) {
  this.communications.push({
    ...communicationData,
    sentAt: new Date()
  });
  
  return this.save();
};

sponsorshipSchema.methods.requestRenewal = function(requestedBy, renewalData) {
  this.renewal = {
    isEligible: true,
    requestedAt: new Date(),
    requestedBy,
    decision: 'pending',
    ...renewalData
  };
  
  return this.save();
};

sponsorshipSchema.methods.processRenewal = function(reviewedBy, decision, renewalData = {}) {
  this.renewal.reviewedAt = new Date();
  this.renewal.decision = decision;
  
  if (decision === 'approved' && renewalData) {
    Object.assign(this.renewal, renewalData);
    
    // Create new sponsorship or update current one
    if (renewalData.newAmount) {
      this.amount.allocated = renewalData.newAmount;
      this.amount.remaining = renewalData.newAmount - this.amount.used;
    }
    
    if (renewalData.newDuration) {
      this.duration.startDate = renewalData.newDuration.startDate;
      this.duration.endDate = renewalData.newDuration.endDate;
    }
  }
  
  return this.save();
};

sponsorshipSchema.methods.addHealthOutcome = function(outcomeData) {
  this.impact.healthOutcomes.push({
    ...outcomeData,
    measuredAt: new Date()
  });
  
  return this.save();
};

sponsorshipSchema.methods.addTestimonial = function(testimonialText, isPublic = false) {
  this.impact.testimonial = {
    text: testimonialText,
    submittedAt: new Date(),
    isPublic
  };
  
  return this.save();
};

// Calculate remaining amount
sponsorshipSchema.pre('save', function(next) {
  this.amount.remaining = this.amount.allocated - this.amount.used;
  
  // Generate sponsorship ID if not exists
  if (!this.sponsorshipId) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.sponsorshipId = `SP-${timestamp}-${random}`;
  }
  
  // Check if sponsorship has expired
  if (this.duration.endDate && this.duration.endDate < new Date() && this.status === 'active') {
    this.status = 'expired';
  }
  
  next();
});

// Static methods
sponsorshipSchema.statics.findBySponsor = function(sponsorId, status = null) {
  const query = { sponsor: sponsorId };
  if (status) query.status = status;
  return this.find(query).sort({ createdAt: -1 });
};

sponsorshipSchema.statics.findByBeneficiary = function(beneficiaryId, status = null) {
  const query = { beneficiary: beneficiaryId };
  if (status) query.status = status;
  return this.find(query).sort({ createdAt: -1 });
};

sponsorshipSchema.statics.findExpiring = function(daysAhead = 30) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);
  
  return this.find({
    status: 'active',
    'duration.endDate': {
      $lte: futureDate,
      $gte: new Date()
    }
  });
};

module.exports = mongoose.model('Sponsorship', sponsorshipSchema);