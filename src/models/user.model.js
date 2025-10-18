const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { USER_TYPES, ACCOUNT_STATUS, GENDER_OPTIONS } = require('../utils/constants');

const userSchema = new mongoose.Schema({
  // Basic Information
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true,
    match: [/^[+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/, 'Please enter a valid phone number']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false
  },
  
  // User Type
  userType: {
    type: String,
    enum: Object.values(USER_TYPES),
    required: true
  },
  
  // Profile Information
  profile: {
    firstName: {
      type: String,
      required: true,
      trim: true
    },
    lastName: {
      type: String,
      required: true,
      trim: true
    },
    middleName: String,
    dateOfBirth: {
      type: Date,
      required: true
    },
    gender: {
      type: String,
      enum: GENDER_OPTIONS
    },
    avatar: {
      url: String,
      publicId: String
    },
    nationalId: {
      type: String,
      required: true,
      unique: true
    },
    address: {
      street: String,
      city: String,
      state: String,
      country: {
        type: String,
        required: true
      },
      zipCode: String,
      coordinates: {
        lat: Number,
        lng: Number
      }
    }
  },
  
  // Anola Health Card
  healthCardId: {
    type: String,
    unique: true,
    sparse: true
  },
  qrCode: {
    data: String,
    imageUrl: String
  },
  
  // Account Status
  status: {
    type: String,
    enum: Object.values(ACCOUNT_STATUS),
    default: ACCOUNT_STATUS.PENDING
  },
  verificationStatus: {
    identity: {
      verified: { type: Boolean, default: false },
      verifiedAt: Date,
      documents: [{
        type: String,
        url: String,
        uploadedAt: Date
      }]
    },
    email: {
      verified: { type: Boolean, default: false },
      verifiedAt: Date,
      token: String,
      tokenExpires: Date
    },
    phone: {
      verified: { type: Boolean, default: false },
      verifiedAt: Date,
      otp: String,
      otpExpires: Date
    }
  },
  
  // Security
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  twoFactorSecret: {
    type: String,
    select: false
  },
  passwordResetToken: String,
  passwordResetExpires: Date,
  passwordChangedAt: Date,
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date,
  
  // Session Management
  refreshTokens: [{
    token: String,
    device: String,
    deviceType: String,
    ip: String,
    location: String,
    userAgent: String,
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 604800 // 7 days
    }
  }],
  
  // Preferences
  preferences: {
    language: {
      type: String,
      default: 'en'
    },
    currency: {
      type: String,
      default: 'USD'
    },
    timezone: {
      type: String,
      default: 'UTC'
    },
    notifications: {
      appointments: { type: Boolean, default: true },
      payments: { type: Boolean, default: true },
      medicalRecords: { type: Boolean, default: true },
      promotions: { type: Boolean, default: false },
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      sms: { type: Boolean, default: true }
    }
  },
  
  // Compliance
  termsAcceptedAt: Date,
  privacyAcceptedAt: Date,
  dataProcessingConsent: {
    given: Boolean,
    date: Date
  },
  
  // Metadata
  lastLogin: Date,
  lastActivity: Date,
  loginHistory: [{
    timestamp: Date,
    ip: String,
    location: String,
    device: String
  }],
  deactivatedAt: Date,
  deactivationReason: String
}, {
  timestamps: true,
  discriminatorKey: 'userType',
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.passwordResetToken;
      delete ret.refreshTokens;
      delete ret.twoFactorSecret;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// Indexes
// Note: email, phone, healthCardId, and profile.nationalId already have unique indexes
// from their field definitions, so we don't need to create them again here
userSchema.index({ userType: 1, status: 1 });
userSchema.index({ 'profile.address.coordinates': '2dsphere' });
userSchema.index({ createdAt: -1 });

// Virtual for account lock status
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Generate Health Card ID
userSchema.methods.generateHealthCardId = function() {
  const prefix = 'AH';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();
  this.healthCardId = `${prefix}-${timestamp}-${random}`;
  return this.healthCardId;
};

// Virtual fields
userSchema.virtual('fullName').get(function() {
  return `${this.profile.firstName} ${this.profile.middleName || ''} ${this.profile.lastName}`.trim();
});

userSchema.virtual('age').get(function() {
  if (!this.profile.dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(this.profile.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
});

// Methods
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.passwordResetExpires = Date.now() + 30 * 60 * 1000; // 30 minutes
  return resetToken;
};

userSchema.methods.incrementLoginAttempts = function() {
  // Reset attempts if lock has expired
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }

  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock account after 5 attempts for 2 hours
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 };
  }
  
  return this.updateOne(updates);
};

userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 }
  });
};

// Middleware
userSchema.pre('save', async function(next) {
  // Only hash password if it has been modified
  if (!this.isModified('password')) return next();
  
  // Hash password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.pre('save', function(next) {
  // Generate health card ID if not exists
  if (!this.healthCardId && this.status === ACCOUNT_STATUS.ACTIVE) {
    this.generateHealthCardId();
  }
  next();
});

// Static methods
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

userSchema.statics.findByPhone = function(phone) {
  return this.findOne({ phone });
};

userSchema.statics.findByHealthCardId = function(healthCardId) {
  return this.findOne({ healthCardId });
};

module.exports = mongoose.model('User', userSchema);