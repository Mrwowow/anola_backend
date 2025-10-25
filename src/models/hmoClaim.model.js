const mongoose = require('mongoose');

const hmoClaimSchema = new mongoose.Schema({
  // Claim Identification
  claimNumber: {
    type: String,
    unique: true,
    required: true,
    uppercase: true
  },

  // Related Documents
  enrollmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'HMOEnrollment',
    required: true,
    index: true
  },
  planId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'HMOPlan',
    required: true,
    index: true
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Provider/Vendor Information
  claimantType: {
    type: String,
    enum: ['provider', 'vendor', 'patient'],
    required: true
  },
  claimantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  claimantDetails: {
    name: String,
    facilityName: String,
    licenseNumber: String,
    specialty: String,
    location: String,
    contactPhone: String,
    contactEmail: String
  },

  // Service Information
  serviceType: {
    type: String,
    enum: [
      'outpatient',
      'inpatient',
      'emergency',
      'surgery',
      'maternity',
      'prescription',
      'diagnostic',
      'dental',
      'vision',
      'mental_health',
      'preventive',
      'specialist_consultation',
      'other'
    ],
    required: true
  },
  serviceDate: {
    type: Date,
    required: true
  },
  dischargeDate: Date, // For inpatient services

  // Diagnosis and Treatment
  diagnosis: {
    code: String, // ICD-10 code
    description: String,
    primary: Boolean
  },
  secondaryDiagnosis: [{
    code: String,
    description: String
  }],
  procedure: {
    code: String, // CPT code
    description: String
  },
  additionalProcedures: [{
    code: String,
    description: String
  }],

  // Treatment Details
  treatmentDetails: {
    description: String,
    prescriptions: [{
      drugName: String,
      dosage: String,
      quantity: Number,
      daysSupply: Number
    }],
    diagnosticTests: [{
      testName: String,
      result: String,
      date: Date
    }],
    admissionType: {
      type: String,
      enum: ['emergency', 'elective', 'urgent']
    },
    lengthOfStay: Number // Days
  },

  // Financial Information
  billing: {
    totalBilled: {
      type: Number,
      required: true,
      min: 0
    },
    breakdown: [{
      item: String,
      quantity: Number,
      unitPrice: Number,
      totalPrice: Number
    }],

    // Coverage Calculation
    coveragePercentage: Number,
    coveredAmount: Number,
    patientResponsibility: {
      copayment: { type: Number, default: 0 },
      coinsurance: { type: Number, default: 0 },
      deductible: { type: Number, default: 0 },
      total: { type: Number, default: 0 }
    },

    // Approved Amount
    approvedAmount: Number,
    rejectedAmount: Number,

    // Payment Details
    amountPaid: { type: Number, default: 0 },
    paymentDate: Date,
    paymentMethod: String,
    paymentReference: String,

    currency: {
      type: String,
      default: 'USD'
    }
  },

  // Supporting Documents
  documents: [{
    type: {
      type: String,
      enum: ['prescription', 'lab_report', 'invoice', 'discharge_summary', 'medical_report', 'receipt', 'other']
    },
    url: String,
    fileName: String,
    uploadedAt: Date
  }],

  // Claim Status
  status: {
    type: String,
    enum: ['submitted', 'under_review', 'approved', 'partially_approved', 'rejected', 'paid', 'appealed', 'cancelled'],
    default: 'submitted',
    index: true
  },
  statusHistory: [{
    status: String,
    reason: String,
    notes: String,
    changedAt: Date,
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],

  // Review Information
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: Date,
  reviewNotes: String,
  rejectionReason: String,

  // Appeal Information
  appeal: {
    submitted: { type: Boolean, default: false },
    submittedAt: Date,
    reason: String,
    documents: [{
      url: String,
      fileName: String
    }],
    status: {
      type: String,
      enum: ['pending', 'under_review', 'approved', 'rejected']
    },
    reviewedAt: Date,
    reviewNotes: String
  },

  // Utilization Tracking
  utilizationImpact: {
    appointmentCount: { type: Number, default: 0 },
    prescriptionCount: { type: Number, default: 0 },
    affectsAnnualLimit: { type: Boolean, default: true },
    affectsDeductible: { type: Boolean, default: true }
  },

  // Fraud Detection
  fraudCheck: {
    flagged: { type: Boolean, default: false },
    flags: [{
      type: String,
      severity: { type: String, enum: ['low', 'medium', 'high'] },
      description: String,
      detectedAt: Date
    }],
    verifiedAt: Date,
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },

  // Processing Timeline
  processing: {
    submittedAt: Date,
    receivedAt: Date,
    assignedAt: Date,
    reviewStartedAt: Date,
    reviewCompletedAt: Date,
    paymentInitiatedAt: Date,
    completedAt: Date,

    processingTimeHours: Number,
    slaCompliant: Boolean
  },

  // Notes and Comments
  notes: String,
  internalNotes: String, // Only visible to admin

  // Metadata
  submittedVia: {
    type: String,
    enum: ['web', 'mobile', 'api', 'admin_portal'],
    default: 'web'
  },
  ipAddress: String

}, {
  timestamps: true
});

// Indexes for efficient querying
hmoClaimSchema.index({ claimNumber: 1 });
hmoClaimSchema.index({ enrollmentId: 1, status: 1 });
hmoClaimSchema.index({ patientId: 1, status: 1 });
hmoClaimSchema.index({ claimantId: 1, status: 1 });
hmoClaimSchema.index({ planId: 1, status: 1 });
hmoClaimSchema.index({ serviceDate: -1 });
hmoClaimSchema.index({ 'billing.totalBilled': -1 });
hmoClaimSchema.index({ createdAt: -1 });
hmoClaimSchema.index({ status: 1, createdAt: -1 });

// Generate unique claim number
hmoClaimSchema.pre('save', async function(next) {
  if (this.isNew && !this.claimNumber) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.claimNumber = `CLM-${timestamp}-${random}`;
  }
  next();
});

// Virtual for claim age
hmoClaimSchema.virtual('ageInDays').get(function() {
  if (!this.createdAt) return 0;
  const diffTime = Date.now() - this.createdAt.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
});

// Method to calculate coverage
hmoClaimSchema.methods.calculateCoverage = async function(plan) {
  const serviceType = this.serviceType;
  const coverage = plan.coverage[serviceType + 'Care'] || plan.coverage.outpatientCare;

  if (!coverage || !coverage.covered) {
    this.billing.coveredAmount = 0;
    this.billing.patientResponsibility.total = this.billing.totalBilled;
    return;
  }

  const coveragePercentage = coverage.coveragePercentage || 80;
  const copayment = coverage.copayment || 0;

  // Calculate covered amount
  const coveredAmount = (this.billing.totalBilled - copayment) * (coveragePercentage / 100);

  // Calculate patient responsibility
  const coinsurance = this.billing.totalBilled - copayment - coveredAmount;

  this.billing.coveragePercentage = coveragePercentage;
  this.billing.coveredAmount = Math.max(0, coveredAmount);
  this.billing.patientResponsibility.copayment = copayment;
  this.billing.patientResponsibility.coinsurance = coinsurance;
  this.billing.patientResponsibility.total = copayment + coinsurance;
};

// Method to approve claim
hmoClaimSchema.methods.approve = function(adminId, approvedAmount, notes) {
  this.status = 'approved';
  this.reviewedBy = adminId;
  this.reviewedAt = new Date();
  this.reviewNotes = notes;
  this.billing.approvedAmount = approvedAmount || this.billing.coveredAmount;

  this.statusHistory.push({
    status: 'approved',
    notes,
    changedAt: new Date(),
    changedBy: adminId
  });

  this.processing.reviewCompletedAt = new Date();
};

// Method to reject claim
hmoClaimSchema.methods.reject = function(adminId, reason, notes) {
  this.status = 'rejected';
  this.reviewedBy = adminId;
  this.reviewedAt = new Date();
  this.rejectionReason = reason;
  this.reviewNotes = notes;
  this.billing.approvedAmount = 0;
  this.billing.rejectedAmount = this.billing.totalBilled;

  this.statusHistory.push({
    status: 'rejected',
    reason,
    notes,
    changedAt: new Date(),
    changedBy: adminId
  });

  this.processing.reviewCompletedAt = new Date();
};

// Method to mark as paid
hmoClaimSchema.methods.markAsPaid = function(paymentDetails) {
  this.status = 'paid';
  this.billing.amountPaid = paymentDetails.amount;
  this.billing.paymentDate = new Date();
  this.billing.paymentMethod = paymentDetails.method;
  this.billing.paymentReference = paymentDetails.reference;

  this.statusHistory.push({
    status: 'paid',
    notes: `Payment processed: ${paymentDetails.reference}`,
    changedAt: new Date()
  });

  this.processing.paymentInitiatedAt = new Date();
  this.processing.completedAt = new Date();
};

// Statics
hmoClaimSchema.statics.getClaimsByStatus = function(status) {
  return this.find({ status })
    .populate('enrollmentId')
    .populate('planId')
    .populate('patientId', 'profile.firstName profile.lastName email')
    .populate('claimantId', 'profile.firstName profile.lastName email userType')
    .sort({ createdAt: -1 });
};

hmoClaimSchema.statics.getPendingClaims = function() {
  return this.find({ status: { $in: ['submitted', 'under_review'] } })
    .populate('enrollmentId')
    .populate('planId')
    .populate('patientId', 'profile.firstName profile.lastName email')
    .populate('claimantId', 'profile.firstName profile.lastName email userType')
    .sort({ createdAt: 1 });
};

const HMOClaim = mongoose.model('HMOClaim', hmoClaimSchema);

module.exports = HMOClaim;
