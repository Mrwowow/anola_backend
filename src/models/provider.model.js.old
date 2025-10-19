const mongoose = require('mongoose');
const User = require('./user.model');
const { PROVIDER_TYPES } = require('../utils/constants');

const providerSchema = new mongoose.Schema({
  // Professional Information
  professionalInfo: {
    licenseNumber: {
      type: String,
      required: true,
      unique: true
    },
    specializations: [{
      name: String,
      certified: Boolean,
      certificationDate: Date,
      certifyingBody: String
    }],
    qualifications: [{
      degree: String,
      institution: String,
      year: Number,
      country: String
    }],
    experience: {
      years: Number,
      summary: String
    },
    languages: [String],
    registrationBody: String,
    registrationNumber: String
  },
  
  // Practice Information
  practice: {
    name: String,
    type: {
      type: String,
      enum: Object.values(PROVIDER_TYPES)
    },
    facilities: [{
      name: String,
      address: {
        street: String,
        city: String,
        state: String,
        country: String,
        zipCode: String,
        coordinates: {
          lat: Number,
          lng: Number
        }
      },
      phone: String,
      operatingHours: [{
        day: String,
        openTime: String,
        closeTime: String,
        isOpen: Boolean
      }]
    }]
  },
  
  // Services Offered
  services: [{
    name: String,
    description: String,
    category: String,
    price: {
      amount: Number,
      currency: String,
      discountForSponsored: Number
    },
    duration: Number, // in minutes
    available: {
      type: Boolean,
      default: true
    }
  }],
  
  // Availability
  availability: {
    schedule: [{
      day: String,
      slots: [{
        startTime: String,
        endTime: String,
        isAvailable: Boolean
      }]
    }],
    vacations: [{
      startDate: Date,
      endDate: Date,
      reason: String
    }],
    consultationModes: [{
      type: {
        type: String,
        enum: ['in-person', 'video', 'audio', 'chat']
      },
      isAvailable: Boolean,
      pricing: {
        amount: Number,
        currency: String
      }
    }]
  },
  
  // Financial
  wallet: {
    type: mongoose.Schema.ObjectId,
    ref: 'Wallet'
  },
  bankAccount: {
    accountName: String,
    accountNumber: String,
    bankName: String,
    swiftCode: String,
    iban: String
  },
  paymentSettings: {
    acceptsCash: Boolean,
    acceptsCard: Boolean,
    acceptsInsurance: Boolean,
    acceptsWallet: Boolean,
    acceptsSponsorship: Boolean
  },
  
  // Ratings and Reviews
  ratings: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    },
    distribution: {
      1: { type: Number, default: 0 },
      2: { type: Number, default: 0 },
      3: { type: Number, default: 0 },
      4: { type: Number, default: 0 },
      5: { type: Number, default: 0 }
    }
  },
  
  // Patients
  patients: [{
    patient: {
      type: mongoose.Schema.ObjectId,
      ref: 'Patient'
    },
    since: Date,
    lastVisit: Date,
    visitCount: Number
  }],
  
  // Statistics
  statistics: {
    totalPatients: { type: Number, default: 0 },
    totalAppointments: { type: Number, default: 0 },
    completedAppointments: { type: Number, default: 0 },
    cancelledAppointments: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    responseTime: { type: Number, default: 0 } // in minutes
  },
  
  // Verification
  verification: {
    isVerified: { type: Boolean, default: false },
    verifiedAt: Date,
    verifiedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    documents: [{
      type: String,
      name: String,
      url: String,
      uploadedAt: Date,
      verifiedAt: Date
    }]
  }
});

// Indexes
// Note: professionalInfo.licenseNumber already has a unique index from field definition
providerSchema.index({ 'professionalInfo.specializations.name': 1 });
providerSchema.index({ 'practice.facilities.address.coordinates': '2dsphere' });
providerSchema.index({ 'ratings.average': -1 });
providerSchema.index({ 'verification.isVerified': 1 });

// Methods
providerSchema.methods.addPatient = function(patientId) {
  const existingPatient = this.patients.find(p => p.patient.toString() === patientId.toString());
  
  if (!existingPatient) {
    this.patients.push({
      patient: patientId,
      since: new Date(),
      visitCount: 1
    });
    this.statistics.totalPatients += 1;
  } else {
    existingPatient.visitCount += 1;
    existingPatient.lastVisit = new Date();
  }
  
  return this.save();
};

providerSchema.methods.updateRating = function(newRating) {
  const oldCount = this.ratings.count;
  const oldAverage = this.ratings.average;
  
  // Update distribution
  this.ratings.distribution[newRating] += 1;
  this.ratings.count += 1;
  
  // Calculate new average
  this.ratings.average = ((oldAverage * oldCount) + newRating) / this.ratings.count;
  this.statistics.averageRating = this.ratings.average;
  
  return this.save();
};

providerSchema.methods.isAvailable = function(date, time) {
  const dayOfWeek = new Date(date).toLocaleLowerCase().substring(0, 3);
  const schedule = this.availability.schedule.find(s => s.day === dayOfWeek);
  
  if (!schedule) return false;
  
  return schedule.slots.some(slot => 
    slot.isAvailable && 
    time >= slot.startTime && 
    time <= slot.endTime
  );
};

const Provider = User.discriminator('provider', providerSchema);
module.exports = Provider;