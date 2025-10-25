const mongoose = require('mongoose');

const hmoPlanSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'HMO plan name is required'],
    trim: true,
    unique: true
  },
  planCode: {
    type: String,
    required: [true, 'Plan code is required'],
    unique: true,
    uppercase: true,
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true
  },

  // Provider Details
  provider: {
    name: {
      type: String,
      required: [true, 'Provider name is required']
    },
    contactPerson: String,
    email: {
      type: String,
      required: [true, 'Provider email is required'],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
    },
    phone: {
      type: String,
      required: [true, 'Provider phone is required']
    },
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      zipCode: String
    },
    website: String,
    licenseNumber: String
  },

  // Plan Details
  planType: {
    type: String,
    enum: ['individual', 'family', 'corporate', 'group'],
    required: true,
    default: 'individual'
  },
  category: {
    type: String,
    enum: ['basic', 'standard', 'premium', 'platinum'],
    required: true,
    default: 'standard'
  },

  // Coverage Information
  coverage: {
    // Medical Services
    outpatientCare: {
      covered: { type: Boolean, default: true },
      copayment: Number,
      coveragePercentage: Number,
      limit: {
        amount: Number,
        period: { type: String, enum: ['visit', 'month', 'year', 'lifetime'] }
      }
    },
    inpatientCare: {
      covered: { type: Boolean, default: true },
      copayment: Number,
      coveragePercentage: Number,
      limit: {
        amount: Number,
        period: { type: String, enum: ['visit', 'month', 'year', 'lifetime'] }
      }
    },
    emergencyCare: {
      covered: { type: Boolean, default: true },
      copayment: Number,
      coveragePercentage: Number,
      limit: {
        amount: Number,
        period: { type: String, enum: ['visit', 'month', 'year', 'lifetime'] }
      }
    },
    surgery: {
      covered: { type: Boolean, default: true },
      copayment: Number,
      coveragePercentage: Number,
      limit: {
        amount: Number,
        period: { type: String, enum: ['procedure', 'year', 'lifetime'] }
      }
    },
    maternityAndChildbirth: {
      covered: { type: Boolean, default: false },
      copayment: Number,
      coveragePercentage: Number,
      limit: {
        amount: Number,
        period: { type: String, enum: ['pregnancy', 'year'] }
      }
    },
    prescriptionDrugs: {
      covered: { type: Boolean, default: true },
      copayment: Number,
      coveragePercentage: Number,
      limit: {
        amount: Number,
        period: { type: String, enum: ['prescription', 'month', 'year'] }
      }
    },
    diagnosticTests: {
      covered: { type: Boolean, default: true },
      copayment: Number,
      coveragePercentage: Number,
      limit: {
        amount: Number,
        period: { type: String, enum: ['test', 'month', 'year'] }
      }
    },
    dentalCare: {
      covered: { type: Boolean, default: false },
      copayment: Number,
      coveragePercentage: Number,
      limit: {
        amount: Number,
        period: { type: String, enum: ['visit', 'year'] }
      }
    },
    visionCare: {
      covered: { type: Boolean, default: false },
      copayment: Number,
      coveragePercentage: Number,
      limit: {
        amount: Number,
        period: { type: String, enum: ['visit', 'year'] }
      }
    },
    mentalHealth: {
      covered: { type: Boolean, default: false },
      copayment: Number,
      coveragePercentage: Number,
      limit: {
        amount: Number,
        period: { type: String, enum: ['session', 'month', 'year'] }
      }
    },
    preventiveCare: {
      covered: { type: Boolean, default: true },
      copayment: Number,
      coveragePercentage: Number,
      limit: {
        amount: Number,
        period: { type: String, enum: ['visit', 'year'] }
      }
    },
    specialistConsultation: {
      covered: { type: Boolean, default: true },
      copayment: Number,
      coveragePercentage: Number,
      requiresReferral: { type: Boolean, default: false },
      limit: {
        amount: Number,
        period: { type: String, enum: ['visit', 'month', 'year'] }
      }
    }
  },

  // Financial Details
  pricing: {
    monthlyPremium: {
      individual: { type: Number, required: true },
      family: Number,
      corporate: Number
    },
    annualPremium: {
      individual: Number,
      family: Number,
      corporate: Number
    },
    registrationFee: Number,
    deductible: {
      individual: Number,
      family: Number
    },
    maxOutOfPocket: {
      individual: Number,
      family: Number
    },
    currency: {
      type: String,
      default: 'USD'
    }
  },

  // Plan Limits
  limits: {
    annualMaximum: Number,
    lifetimeMaximum: Number,
    dependentsAllowed: {
      type: Number,
      default: 0
    },
    ageLimit: {
      min: { type: Number, default: 0 },
      max: { type: Number, default: 100 }
    }
  },

  // Exclusions and Conditions
  exclusions: [{
    category: String,
    description: String
  }],
  preExistingConditions: {
    covered: { type: Boolean, default: false },
    waitingPeriod: {
      duration: Number,
      unit: { type: String, enum: ['days', 'months', 'years'] }
    }
  },

  // Network Information
  network: {
    type: { type: String, enum: ['PPO', 'HMO', 'EPO', 'POS'], default: 'HMO' },
    providers: [{
      providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      name: String,
      specialty: String,
      location: String
    }],
    hospitals: [String],
    pharmacies: [String],
    clinics: [String]
  },

  // Enrollment Details
  enrollment: {
    openEnrollment: {
      startDate: Date,
      endDate: Date
    },
    minimumMembers: {
      type: Number,
      default: 1
    },
    autoRenewal: {
      type: Boolean,
      default: true
    },
    gracePeriod: {
      type: Number,
      default: 30 // days
    }
  },

  // Plan Status
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'discontinued'],
    default: 'active'
  },
  isAvailableForNewEnrollment: {
    type: Boolean,
    default: true
  },

  // Compliance & Documentation
  documents: [{
    name: String,
    type: { type: String, enum: ['policy', 'terms', 'brochure', 'claim_form', 'other'] },
    url: String,
    uploadedAt: Date
  }],
  regulatoryApprovals: [{
    authority: String,
    approvalNumber: String,
    approvedAt: Date,
    expiresAt: Date,
    document: String
  }],

  // Benefits Summary
  keyBenefits: [String],
  additionalBenefits: [{
    name: String,
    description: String,
    value: String
  }],

  // Statistics & Tracking
  statistics: {
    totalEnrollments: { type: Number, default: 0 },
    activeMembers: { type: Number, default: 0 },
    totalClaimsPaid: { type: Number, default: 0 },
    totalClaimsAmount: { type: Number, default: 0 },
    averageClaimProcessingTime: Number, // in days
    customerSatisfactionRating: { type: Number, min: 0, max: 5, default: 0 }
  },

  // Terms & Conditions
  terms: {
    claimSubmissionDeadline: {
      duration: Number,
      unit: { type: String, enum: ['days', 'months'] }
    },
    claimProcessingTime: {
      duration: Number,
      unit: { type: String, enum: ['days', 'weeks'] }
    },
    cancellationPolicy: String,
    refundPolicy: String
  },

  // Administrative
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  notes: String,
  internalNotes: String

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
hmoPlanSchema.index({ planCode: 1 });
hmoPlanSchema.index({ status: 1, isAvailableForNewEnrollment: 1 });
hmoPlanSchema.index({ 'provider.name': 1 });
hmoPlanSchema.index({ category: 1, planType: 1 });
hmoPlanSchema.index({ createdAt: -1 });

// Virtual for enrollment availability
hmoPlanSchema.virtual('isEnrollmentOpen').get(function() {
  if (!this.enrollment.openEnrollment) return true;

  const now = new Date();
  const { startDate, endDate } = this.enrollment.openEnrollment;

  if (!startDate || !endDate) return true;

  return now >= new Date(startDate) && now <= new Date(endDate);
});

// Pre-save middleware to calculate annual premium from monthly
hmoPlanSchema.pre('save', function(next) {
  if (this.pricing.monthlyPremium) {
    if (this.pricing.monthlyPremium.individual && !this.pricing.annualPremium.individual) {
      this.pricing.annualPremium = this.pricing.annualPremium || {};
      this.pricing.annualPremium.individual = this.pricing.monthlyPremium.individual * 12;
    }
    if (this.pricing.monthlyPremium.family && !this.pricing.annualPremium.family) {
      this.pricing.annualPremium = this.pricing.annualPremium || {};
      this.pricing.annualPremium.family = this.pricing.monthlyPremium.family * 12;
    }
    if (this.pricing.monthlyPremium.corporate && !this.pricing.annualPremium.corporate) {
      this.pricing.annualPremium = this.pricing.annualPremium || {};
      this.pricing.annualPremium.corporate = this.pricing.monthlyPremium.corporate * 12;
    }
  }
  next();
});

// Static methods
hmoPlanSchema.statics.findActiveHMOPlans = function() {
  return this.find({
    status: 'active',
    isAvailableForNewEnrollment: true
  }).sort({ 'pricing.monthlyPremium.individual': 1 });
};

hmoPlanSchema.statics.findByPlanCode = function(planCode) {
  return this.findOne({ planCode: planCode.toUpperCase() });
};

hmoPlanSchema.statics.findByCategory = function(category) {
  return this.find({ category, status: 'active' });
};

// Instance methods
hmoPlanSchema.methods.incrementEnrollment = function() {
  this.statistics.totalEnrollments += 1;
  this.statistics.activeMembers += 1;
  return this.save();
};

hmoPlanSchema.methods.decrementEnrollment = function() {
  if (this.statistics.activeMembers > 0) {
    this.statistics.activeMembers -= 1;
  }
  return this.save();
};

hmoPlanSchema.methods.updateClaimStatistics = function(claimAmount, processingDays) {
  this.statistics.totalClaimsPaid += 1;
  this.statistics.totalClaimsAmount += claimAmount;

  // Calculate new average processing time
  if (this.statistics.averageClaimProcessingTime) {
    this.statistics.averageClaimProcessingTime =
      (this.statistics.averageClaimProcessingTime * (this.statistics.totalClaimsPaid - 1) + processingDays) /
      this.statistics.totalClaimsPaid;
  } else {
    this.statistics.averageClaimProcessingTime = processingDays;
  }

  return this.save();
};

module.exports = mongoose.model('HMOPlan', hmoPlanSchema);
