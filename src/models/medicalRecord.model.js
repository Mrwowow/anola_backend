const mongoose = require('mongoose');
const { MEDICAL_RECORD_TYPES } = require('../utils/constants');

const medicalRecordSchema = new mongoose.Schema({
  recordId: {
    type: String,
    unique: true,
    required: true
  },
  patient: {
    type: mongoose.Schema.ObjectId,
    ref: 'Patient',
    required: true
  },
  provider: {
    type: mongoose.Schema.ObjectId,
    ref: 'Provider',
    required: true
  },
  appointment: {
    type: mongoose.Schema.ObjectId,
    ref: 'Appointment'
  },
  
  // Record Type
  type: {
    type: String,
    enum: Object.values(MEDICAL_RECORD_TYPES),
    required: true
  },
  
  // Clinical Information
  clinical: {
    chiefComplaint: String,
    presentIllness: String,
    pastMedicalHistory: String,
    familyHistory: String,
    socialHistory: String,
    reviewOfSystems: String,
    
    // Physical Examination
    physicalExam: {
      general: String,
      vitals: {
        bloodPressure: String,
        heartRate: Number,
        temperature: Number,
        respiratoryRate: Number,
        oxygenSaturation: Number,
        weight: Number,
        height: Number,
        bmi: Number
      },
      systems: Map // Flexible key-value for different body systems
    },
    
    // Assessment & Plan
    assessment: String,
    diagnoses: [{
      code: String,
      description: String,
      type: {
        type: String,
        enum: ['primary', 'secondary', 'differential']
      },
      status: {
        type: String,
        enum: ['confirmed', 'provisional', 'ruled_out']
      }
    }],
    plan: String,
    
    // Orders
    orders: {
      labs: [{
        test: String,
        reason: String,
        urgent: Boolean,
        orderedAt: Date
      }],
      imaging: [{
        type: String,
        bodyPart: String,
        reason: String,
        urgent: Boolean,
        orderedAt: Date
      }],
      medications: [{
        name: String,
        dosage: String,
        route: String,
        frequency: String,
        duration: String,
        instructions: String
      }],
      procedures: [{
        name: String,
        reason: String,
        scheduledDate: Date
      }]
    }
  },
  
  // Lab Results
  labResults: [{
    test: String,
    result: String,
    unit: String,
    referenceRange: String,
    flag: {
      type: String,
      enum: ['normal', 'high', 'low', 'critical']
    },
    performedAt: Date,
    verifiedBy: String
  }],
  
  // Imaging Results
  imagingResults: [{
    type: String,
    findings: String,
    impression: String,
    radiologist: String,
    performedAt: Date,
    images: [{
      url: String,
      description: String
    }]
  }],
  
  // Attachments
  attachments: [{
    type: {
      type: String,
      enum: ['document', 'image', 'report', 'other']
    },
    name: String,
    url: String,
    size: Number,
    mimeType: String,
    uploadedAt: Date,
    uploadedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    }
  }],
  
  // Access Control
  access: {
    sharedWith: [{
      user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
      },
      permission: {
        type: String,
        enum: ['view', 'edit'],
        default: 'view'
      },
      sharedAt: Date,
      expiresAt: Date
    }],
    isPublic: {
      type: Boolean,
      default: false
    },
    requiresConsent: {
      type: Boolean,
      default: true
    }
  },
  
  // Audit Trail
  audit: [{
    action: {
      type: String,
      enum: ['created', 'viewed', 'updated', 'shared', 'downloaded', 'printed']
    },
    performedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    timestamp: Date,
    ip: String,
    details: String
  }],
  
  // Metadata
  tags: [String],
  notes: String,
  isEmergency: Boolean,
  confidentiality: {
    type: String,
    enum: ['normal', 'restricted', 'confidential'],
    default: 'normal'
  },
  
  // Compliance
  consent: {
    given: Boolean,
    givenAt: Date,
    withdrawnAt: Date
  },
  retention: {
    policy: String,
    deleteAfter: Date
  }
}, {
  timestamps: true
});

// Indexes
// Note: recordId already has a unique index from field definition
medicalRecordSchema.index({ patient: 1, createdAt: -1 });
medicalRecordSchema.index({ provider: 1, createdAt: -1 });
medicalRecordSchema.index({ type: 1 });
medicalRecordSchema.index({ 'clinical.diagnoses.code': 1 });
medicalRecordSchema.index({ tags: 1 });

// Virtual for summary
medicalRecordSchema.virtual('summary').get(function() {
  if (this.clinical.chiefComplaint) {
    return this.clinical.chiefComplaint.substring(0, 100);
  }
  return `${this.type} - ${this.createdAt.toDateString()}`;
});

// Methods
medicalRecordSchema.methods.addAuditEntry = function(action, performedBy, ip, details = '') {
  this.audit.push({
    action,
    performedBy,
    timestamp: new Date(),
    ip,
    details
  });
  
  return this.save();
};

medicalRecordSchema.methods.shareWith = function(userId, permission = 'view', expiresAt = null) {
  // Remove existing share if any
  this.access.sharedWith = this.access.sharedWith.filter(
    share => share.user.toString() !== userId.toString()
  );
  
  // Add new share
  this.access.sharedWith.push({
    user: userId,
    permission,
    sharedAt: new Date(),
    expiresAt
  });
  
  return this.save();
};

medicalRecordSchema.methods.revokeAccess = function(userId) {
  this.access.sharedWith = this.access.sharedWith.filter(
    share => share.user.toString() !== userId.toString()
  );
  
  return this.save();
};

medicalRecordSchema.methods.addLabResult = function(labData) {
  this.labResults.push({
    ...labData,
    performedAt: labData.performedAt || new Date()
  });
  
  return this.save();
};

medicalRecordSchema.methods.addImagingResult = function(imagingData) {
  this.imagingResults.push({
    ...imagingData,
    performedAt: imagingData.performedAt || new Date()
  });
  
  return this.save();
};

medicalRecordSchema.methods.addAttachment = function(attachmentData, uploadedBy) {
  this.attachments.push({
    ...attachmentData,
    uploadedAt: new Date(),
    uploadedBy
  });
  
  return this.save();
};

medicalRecordSchema.methods.hasAccess = function(userId, requiredPermission = 'view') {
  // Patient always has access to their own records
  if (this.patient.toString() === userId.toString()) {
    return true;
  }
  
  // Provider who created the record has access
  if (this.provider.toString() === userId.toString()) {
    return true;
  }
  
  // Check shared access
  const sharedAccess = this.access.sharedWith.find(share => {
    if (share.user.toString() !== userId.toString()) return false;
    if (share.expiresAt && share.expiresAt < new Date()) return false;
    
    if (requiredPermission === 'edit') {
      return share.permission === 'edit';
    }
    
    return true; // view access
  });
  
  return !!sharedAccess;
};

// Generate record ID
medicalRecordSchema.pre('save', function(next) {
  if (!this.recordId) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.recordId = `MR-${year}${month}-${random}`;
  }
  next();
});

// Static methods
medicalRecordSchema.statics.findByPatient = function(patientId, startDate = null, endDate = null) {
  const query = { patient: patientId };
  
  if (startDate && endDate) {
    query.createdAt = { $gte: startDate, $lte: endDate };
  }
  
  return this.find(query).sort({ createdAt: -1 });
};

medicalRecordSchema.statics.findByProvider = function(providerId, startDate = null, endDate = null) {
  const query = { provider: providerId };
  
  if (startDate && endDate) {
    query.createdAt = { $gte: startDate, $lte: endDate };
  }
  
  return this.find(query).sort({ createdAt: -1 });
};

medicalRecordSchema.statics.searchByDiagnosis = function(diagnosisCode) {
  return this.find({
    'clinical.diagnoses.code': diagnosisCode
  });
};

module.exports = mongoose.model('MedicalRecord', medicalRecordSchema);