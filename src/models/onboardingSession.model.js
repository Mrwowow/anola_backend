const mongoose = require('mongoose');

const onboardingSessionSchema = new mongoose.Schema({
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
    step1: {
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
    step2: {
      medicalConditions: [mongoose.Schema.Types.Mixed],
      allergies: [mongoose.Schema.Types.Mixed],
      currentMedications: [mongoose.Schema.Types.Mixed],
      emergencyContact: mongoose.Schema.Types.Mixed,
      bloodType: String,
      height: mongoose.Schema.Types.Mixed,
      weight: mongoose.Schema.Types.Mixed
    },
    step3: {
      activateWallet: Boolean,
      initialDeposit: mongoose.Schema.Types.Mixed,
      insurance: mongoose.Schema.Types.Mixed
    },
    profilePictureUrl: String
  },
  temporaryUserId: String,
  ipAddress: String,
  userAgent: String,
  referralCode: String,
  completedSteps: {
    type: [Number],
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// TTL index - auto-delete expired sessions
onboardingSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Update timestamp on save
onboardingSessionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const OnboardingSession = mongoose.model('OnboardingSession', onboardingSessionSchema);

module.exports = OnboardingSession;
