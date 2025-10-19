const mongoose = require('mongoose');

const providerOnboardingSessionSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true,
    index: true
  },

  step: {
    type: Number,
    default: 0,
    min: 0,
    max: 4
  },

  expiresAt: {
    type: Date,
    required: true,
    index: true
  },

  data: {
    // Step 1: Basic Information
    step1: {
      providerType: String,  // doctor, nurse, therapist, specialist, other
      firstName: String,
      lastName: String,
      email: String,
      phone: String,
      dateOfBirth: Date,
      gender: String,
      address: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: String
      }
    },

    // Step 2: Professional Information
    step2: {
      specialization: String,
      subSpecialties: [String],
      licenseNumber: String,
      licenseState: String,
      licenseExpiry: Date,
      yearsOfExperience: Number,
      npiNumber: String,
      deaNumber: String,
      education: [{
        degree: String,
        institution: String,
        year: Number,
        field: String
      }],
      certifications: [{
        name: String,
        issuer: String,
        issueDate: Date,
        expiryDate: Date,
        certificateNumber: String
      }]
    },

    // Step 3: Practice Information
    step3: {
      practiceType: String,  // hospital, clinic, private, telehealth, other
      practiceName: String,
      practiceAddress: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: String
      },
      practicePhone: String,
      practiceEmail: String,
      acceptsInsurance: Boolean,
      insuranceProviders: [String],
      languages: [String],
      consultationModes: [String],  // in-person, video, phone, chat
      servicesOffered: [{
        serviceName: String,
        duration: Number,
        price: Number,
        description: String
      }]
    },

    // Profile Photo
    profilePhotoUrl: String
  },

  temporaryProviderId: String,

  completedSteps: {
    type: [Number],
    default: []
  },

  // Tracking
  ipAddress: String,
  userAgent: String,
  referralCode: String

}, {
  timestamps: true
});

// TTL index - automatically delete expired sessions
providerOnboardingSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Indexes for performance
providerOnboardingSessionSchema.index({ temporaryProviderId: 1 });
providerOnboardingSessionSchema.index({ 'data.step1.email': 1 });

module.exports = mongoose.model('ProviderOnboardingSession', providerOnboardingSessionSchema);
