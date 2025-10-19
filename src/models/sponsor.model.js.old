const mongoose = require('mongoose');
const User = require('./user.model');

const sponsorSchema = new mongoose.Schema({
  // Organization Information (for organizational sponsors)
  organization: {
    name: String,
    type: {
      type: String,
      enum: ['individual', 'corporate', 'ngo', 'government', 'foundation', 'religious']
    },
    registrationNumber: String,
    taxId: String,
    website: String,
    logo: {
      url: String,
      publicId: String
    },
    description: String,
    mission: String
  },
  
  // Sponsorship Settings
  sponsorshipSettings: {
    budget: {
      total: Number,
      allocated: Number,
      spent: Number,
      currency: String
    },
    frequency: {
      type: String,
      enum: ['one-time', 'monthly', 'quarterly', 'annual']
    },
    preferences: {
      targetCountries: [String],
      targetDemographics: {
        ageGroups: [String],
        genders: [String],
        conditions: [String]
      },
      healthcareTypes: [{
        type: String,
        enum: ['preventive', 'emergency', 'chronic', 'maternal', 'pediatric', 'general']
      }],
      maxAmountPerPatient: Number,
      requiresApproval: Boolean
    },
    anonymousSponsorship: {
      type: Boolean,
      default: false
    }
  },
  
  // Global Wallet
  globalWallet: {
    type: mongoose.Schema.ObjectId,
    ref: 'Wallet'
  },
  
  // Sponsorships
  activeSponsorships: [{
    patient: {
      type: mongoose.Schema.ObjectId,
      ref: 'Patient'
    },
    amount: Number,
    startDate: Date,
    endDate: Date,
    purpose: String,
    status: {
      type: String,
      enum: ['active', 'paused', 'completed', 'cancelled']
    },
    utilizationReports: [{
      date: Date,
      amountUsed: Number,
      service: String,
      provider: {
        type: mongoose.Schema.ObjectId,
        ref: 'Provider'
      }
    }]
  }],
  
  // Impact Metrics
  impact: {
    totalPatientsSponsored: { type: Number, default: 0 },
    totalAmountDonated: { type: Number, default: 0 },
    livesImpacted: { type: Number, default: 0 },
    treatmentsFunded: {
      preventive: { type: Number, default: 0 },
      emergency: { type: Number, default: 0 },
      chronic: { type: Number, default: 0 },
      surgical: { type: Number, default: 0 },
      medication: { type: Number, default: 0 }
    },
    countriesReached: [String],
    successStories: [{
      patient: {
        type: mongoose.Schema.ObjectId,
        ref: 'Patient'
      },
      story: String,
      date: Date,
      isPublic: Boolean
    }]
  },
  
  // Tax and Compliance
  taxBenefits: {
    eligible: Boolean,
    receipts: [{
      year: Number,
      amount: Number,
      documentUrl: String,
      issuedDate: Date
    }]
  },
  
  // Communication
  reports: {
    frequency: {
      type: String,
      enum: ['weekly', 'monthly', 'quarterly', 'annual']
    },
    lastSent: Date,
    preferences: {
      detailedReports: Boolean,
      anonymizedData: Boolean,
      successStories: Boolean,
      financialBreakdown: Boolean
    }
  },
  
  // Recognition
  recognition: {
    tier: {
      type: String,
      enum: ['bronze', 'silver', 'gold', 'platinum', 'diamond']
    },
    badges: [{
      name: String,
      description: String,
      awardedDate: Date,
      imageUrl: String
    }],
    publicProfile: {
      isPublic: Boolean,
      displayName: String,
      bio: String
    }
  }
});

// Indexes
sponsorSchema.index({ 'organization.type': 1 });
sponsorSchema.index({ 'sponsorshipSettings.preferences.targetCountries': 1 });
sponsorSchema.index({ 'impact.totalAmountDonated': -1 });
sponsorSchema.index({ globalWallet: 1 });

// Methods
sponsorSchema.methods.addSponsorship = function(sponsorshipData) {
  this.activeSponsorships.push(sponsorshipData);
  this.impact.totalPatientsSponsored += 1;
  this.impact.totalAmountDonated += sponsorshipData.amount;
  
  // Update budget
  this.sponsorshipSettings.budget.allocated += sponsorshipData.amount;
  
  return this.save();
};

sponsorSchema.methods.updateImpact = function(treatmentType, amount) {
  if (this.impact.treatmentsFunded[treatmentType] !== undefined) {
    this.impact.treatmentsFunded[treatmentType] += 1;
  }
  
  this.sponsorshipSettings.budget.spent += amount;
  this.impact.livesImpacted += 1;
  
  return this.save();
};

sponsorSchema.methods.calculateTier = function() {
  const totalDonated = this.impact.totalAmountDonated;
  
  if (totalDonated >= 100000) return 'diamond';
  if (totalDonated >= 50000) return 'platinum';
  if (totalDonated >= 25000) return 'gold';
  if (totalDonated >= 10000) return 'silver';
  return 'bronze';
};

sponsorSchema.methods.generateTaxReceipt = function(year, amount) {
  this.taxBenefits.receipts.push({
    year,
    amount,
    issuedDate: new Date()
  });
  
  return this.save();
};

// Pre-save middleware to update tier
sponsorSchema.pre('save', function(next) {
  if (this.isModified('impact.totalAmountDonated')) {
    this.recognition.tier = this.calculateTier();
  }
  next();
});

const Sponsor = User.discriminator('sponsor', sponsorSchema);
module.exports = Sponsor;