const mongoose = require('mongoose');
const User = require('./user.model');
const { BLOOD_TYPES } = require('../utils/constants');

const patientSchema = new mongoose.Schema({
  // Medical Information
  medicalInfo: {
    bloodType: {
      type: String,
      enum: BLOOD_TYPES
    },
    allergies: [{
      allergen: String,
      severity: {
        type: String,
        enum: ['mild', 'moderate', 'severe', 'life-threatening']
      },
      notes: String
    }],
    chronicConditions: [{
      condition: String,
      diagnosedDate: Date,
      status: {
        type: String,
        enum: ['active', 'managed', 'resolved']
      },
      medications: [String]
    }],
    emergencyContact: {
      name: String,
      relationship: String,
      phone: String,
      alternatePhone: String
    },
    insuranceInfo: [{
      provider: String,
      policyNumber: String,
      groupNumber: String,
      validUntil: Date,
      coverageType: String
    }]
  },
  
  // Wallet Information
  wallets: {
    personal: {
      type: mongoose.Schema.ObjectId,
      ref: 'Wallet'
    },
    sponsored: {
      type: mongoose.Schema.ObjectId,
      ref: 'Wallet'
    }
  },
  
  // Sponsorship Details
  sponsorship: {
    isSponsored: {
      type: Boolean,
      default: false
    },
    sponsors: [{
      sponsor: {
        type: mongoose.Schema.ObjectId,
        ref: 'Sponsor'
      },
      amount: Number,
      startDate: Date,
      endDate: Date,
      status: {
        type: String,
        enum: ['active', 'paused', 'ended']
      }
    }],
    eligibilityScore: {
      type: Number,
      min: 0,
      max: 100
    }
  },
  
  // Healthcare Providers
  primaryProvider: {
    type: mongoose.Schema.ObjectId,
    ref: 'Provider'
  },
  providers: [{
    provider: {
      type: mongoose.Schema.ObjectId,
      ref: 'Provider'
    },
    relationship: String,
    since: Date
  }],
  
  // Medical History
  medicalRecords: [{
    type: mongoose.Schema.ObjectId,
    ref: 'MedicalRecord'
  }],
  appointments: [{
    type: mongoose.Schema.ObjectId,
    ref: 'Appointment'
  }],
  prescriptions: [{
    type: mongoose.Schema.ObjectId,
    ref: 'Prescription'
  }],
  
  // Health Metrics
  healthMetrics: {
    height: Number, // in cm
    weight: Number, // in kg
    bmi: Number,
    lastUpdated: Date
  },
  
  // Preferences
  healthGoals: [String],
  preferredPharmacy: {
    type: mongoose.Schema.ObjectId,
    ref: 'Vendor'
  },
  preferredLab: {
    type: mongoose.Schema.ObjectId,
    ref: 'Vendor'
  }
});

// Indexes
patientSchema.index({ 'wallets.personal': 1 });
patientSchema.index({ 'wallets.sponsored': 1 });
patientSchema.index({ 'sponsorship.isSponsored': 1 });
patientSchema.index({ primaryProvider: 1 });

// Virtual for BMI calculation
patientSchema.virtual('calculatedBMI').get(function() {
  if (this.healthMetrics?.height && this.healthMetrics?.weight) {
    const heightInM = this.healthMetrics.height / 100;
    return (this.healthMetrics.weight / (heightInM * heightInM)).toFixed(1);
  }
  return null;
});

// Methods
patientSchema.methods.updateBMI = function() {
  if (this.healthMetrics?.height && this.healthMetrics?.weight) {
    const heightInM = this.healthMetrics.height / 100;
    this.healthMetrics.bmi = this.healthMetrics.weight / (heightInM * heightInM);
    this.healthMetrics.lastUpdated = new Date();
  }
};

patientSchema.methods.addMedicalRecord = function(recordId) {
  if (!this.medicalRecords.includes(recordId)) {
    this.medicalRecords.push(recordId);
  }
  return this.save();
};

patientSchema.methods.addAppointment = function(appointmentId) {
  if (!this.appointments.includes(appointmentId)) {
    this.appointments.push(appointmentId);
  }
  return this.save();
};

// Pre-save middleware to calculate BMI
patientSchema.pre('save', function(next) {
  if (this.isModified('healthMetrics.height') || this.isModified('healthMetrics.weight')) {
    this.updateBMI();
  }
  next();
});

const Patient = User.discriminator('patient', patientSchema);
module.exports = Patient;