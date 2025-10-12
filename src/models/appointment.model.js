const mongoose = require('mongoose');
const { APPOINTMENT_STATUS } = require('../utils/constants');

const appointmentSchema = new mongoose.Schema({
  // Reference Information
  appointmentId: {
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
  
  // Appointment Details
  type: {
    type: String,
    enum: ['consultation', 'follow-up', 'emergency', 'routine-checkup', 'vaccination', 'lab-test', 'surgery', 'therapy'],
    required: true
  },
  mode: {
    type: String,
    enum: ['in-person', 'video', 'audio', 'chat'],
    default: 'in-person'
  },
  specialization: String,
  reason: {
    type: String,
    required: true
  },
  symptoms: [String],
  urgency: {
    type: String,
    enum: ['routine', 'urgent', 'emergency'],
    default: 'routine'
  },
  
  // Schedule
  scheduledDate: {
    type: Date,
    required: true
  },
  scheduledTime: {
    startTime: {
      type: String,
      required: true
    },
    endTime: String,
    duration: Number // in minutes
  },
  timeZone: String,
  
  // Status
  status: {
    type: String,
    enum: Object.values(APPOINTMENT_STATUS),
    default: APPOINTMENT_STATUS.SCHEDULED
  },
  confirmationStatus: {
    patient: {
      confirmed: { type: Boolean, default: false },
      confirmedAt: Date
    },
    provider: {
      confirmed: { type: Boolean, default: false },
      confirmedAt: Date
    }
  },
  
  // Location
  location: {
    type: {
      type: String,
      enum: ['clinic', 'hospital', 'home', 'virtual'],
      default: 'clinic'
    },
    facility: {
      name: String,
      address: {
        street: String,
        city: String,
        state: String,
        country: String,
        zipCode: String
      },
      room: String,
      floor: String
    },
    virtualMeetingLink: String
  },
  
  // Payment Information
  payment: {
    method: {
      type: String,
      enum: ['personal_wallet', 'sponsored_wallet', 'insurance', 'cash', 'card', 'mixed'],
      required: true
    },
    amount: {
      consultation: Number,
      procedures: Number,
      medications: Number,
      total: Number,
      currency: String
    },
    sponsorship: {
      isSponsored: Boolean,
      sponsor: {
        type: mongoose.Schema.ObjectId,
        ref: 'Sponsor'
      },
      amountCovered: Number
    },
    insurance: {
      provider: String,
      policyNumber: String,
      amountCovered: Number,
      claimStatus: String
    },
    status: {
      type: String,
      enum: ['pending', 'partial', 'completed', 'failed', 'refunded'],
      default: 'pending'
    },
    transactionId: String
  },
  
  // Pre-Appointment
  preAppointment: {
    forms: [{
      type: String,
      completedAt: Date,
      data: Map
    }],
    vitals: {
      bloodPressure: String,
      temperature: Number,
      pulse: Number,
      weight: Number,
      height: Number
    },
    preparationInstructions: String,
    documentsRequired: [String]
  },
  
  // Consultation Notes
  consultation: {
    startTime: Date,
    endTime: Date,
    chiefComplaint: String,
    diagnosis: [{
      code: String,
      description: String,
      type: String
    }],
    treatmentPlan: String,
    notes: String,
    privateNotes: String, // Provider's private notes
    attachments: [{
      type: String,
      url: String,
      uploadedAt: Date
    }]
  },
  
  // Prescriptions
  prescriptions: [{
    medication: String,
    dosage: String,
    frequency: String,
    duration: String,
    instructions: String,
    refills: Number,
    prescribedAt: Date
  }],
  
  // Follow-up
  followUp: {
    required: Boolean,
    scheduledDate: Date,
    reason: String,
    instructions: String
  },
  
  // Reminders
  reminders: [{
    type: {
      type: String,
      enum: ['sms', 'email', 'push', 'call']
    },
    scheduledFor: Date,
    sent: Boolean,
    sentAt: Date,
    response: String
  }],
  
  // Cancellation/Rescheduling
  cancellation: {
    cancelledBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    cancelledAt: Date,
    reason: String,
    fee: Number
  },
  rescheduling: {
    rescheduledFrom: Date,
    rescheduledBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    rescheduledAt: Date,
    reason: String
  },
  
  // Feedback
  feedback: {
    patient: {
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      comment: String,
      submittedAt: Date
    },
    provider: {
      notes: String,
      flagged: Boolean,
      flagReason: String
    }
  },
  
  // Metadata
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  lastModifiedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
appointmentSchema.index({ patient: 1, scheduledDate: -1 });
appointmentSchema.index({ provider: 1, scheduledDate: -1 });
appointmentSchema.index({ status: 1 });
appointmentSchema.index({ scheduledDate: 1, 'scheduledTime.startTime': 1 });
appointmentSchema.index({ appointmentId: 1 });

// Virtual for appointment duration
appointmentSchema.virtual('totalDuration').get(function() {
  if (this.consultation.startTime && this.consultation.endTime) {
    return Math.round((this.consultation.endTime - this.consultation.startTime) / (1000 * 60)); // in minutes
  }
  return this.scheduledTime.duration || 30; // default 30 minutes
});

// Virtual for confirmation status
appointmentSchema.virtual('isFullyConfirmed').get(function() {
  return this.confirmationStatus.patient.confirmed && this.confirmationStatus.provider.confirmed;
});

// Methods
appointmentSchema.methods.confirm = function(userType) {
  if (userType === 'patient') {
    this.confirmationStatus.patient.confirmed = true;
    this.confirmationStatus.patient.confirmedAt = new Date();
  } else if (userType === 'provider') {
    this.confirmationStatus.provider.confirmed = true;
    this.confirmationStatus.provider.confirmedAt = new Date();
  }
  
  if (this.isFullyConfirmed) {
    this.status = APPOINTMENT_STATUS.CONFIRMED;
  }
  
  return this.save();
};

appointmentSchema.methods.cancel = function(cancelledBy, reason, fee = 0) {
  this.status = APPOINTMENT_STATUS.CANCELLED;
  this.cancellation = {
    cancelledBy,
    cancelledAt: new Date(),
    reason,
    fee
  };
  
  return this.save();
};

appointmentSchema.methods.reschedule = function(newDate, newTime, rescheduledBy, reason) {
  this.rescheduling = {
    rescheduledFrom: this.scheduledDate,
    rescheduledBy,
    rescheduledAt: new Date(),
    reason
  };
  
  this.scheduledDate = newDate;
  this.scheduledTime = newTime;
  this.status = APPOINTMENT_STATUS.RESCHEDULED;
  
  return this.save();
};

appointmentSchema.methods.startConsultation = function() {
  this.status = APPOINTMENT_STATUS.IN_PROGRESS;
  this.consultation.startTime = new Date();
  return this.save();
};

appointmentSchema.methods.completeConsultation = function(consultationData) {
  this.status = APPOINTMENT_STATUS.COMPLETED;
  this.consultation.endTime = new Date();
  
  if (consultationData) {
    Object.assign(this.consultation, consultationData);
  }
  
  return this.save();
};

appointmentSchema.methods.addPrescription = function(prescriptionData) {
  this.prescriptions.push({
    ...prescriptionData,
    prescribedAt: new Date()
  });
  
  return this.save();
};

appointmentSchema.methods.addReminder = function(reminderData) {
  this.reminders.push(reminderData);
  return this.save();
};

appointmentSchema.methods.provideFeedback = function(userType, feedbackData) {
  if (userType === 'patient') {
    this.feedback.patient = {
      ...feedbackData,
      submittedAt: new Date()
    };
  } else if (userType === 'provider') {
    this.feedback.provider = feedbackData;
  }
  
  return this.save();
};

// Generate appointment ID
appointmentSchema.pre('save', async function(next) {
  if (!this.appointmentId) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.appointmentId = `APT-${year}${month}${day}-${random}`;
  }
  next();
});

// Static methods
appointmentSchema.statics.findByDateRange = function(startDate, endDate, providerId = null) {
  const query = {
    scheduledDate: {
      $gte: startDate,
      $lte: endDate
    }
  };
  
  if (providerId) {
    query.provider = providerId;
  }
  
  return this.find(query).sort({ scheduledDate: 1, 'scheduledTime.startTime': 1 });
};

appointmentSchema.statics.findUpcoming = function(userId, userType, limit = 10) {
  const query = {
    scheduledDate: { $gte: new Date() },
    status: { $in: [APPOINTMENT_STATUS.SCHEDULED, APPOINTMENT_STATUS.CONFIRMED] }
  };
  
  query[userType] = userId;
  
  return this.find(query)
    .limit(limit)
    .sort({ scheduledDate: 1, 'scheduledTime.startTime': 1 })
    .populate('patient provider');
};

module.exports = mongoose.model('Appointment', appointmentSchema);