# Anola Health - MongoDB Express API Backend and Database Design Guide

## Table of Contents
1. [Project Overview](#project-overview)
2. [Project Structure](#project-structure)
3. [Setting Up Express](#setting-up-express)
4. [MongoDB Database Design & Schemas](#mongodb-database-design--schemas)
5. [API Architecture](#api-architecture)
6. [Authentication & Authorization](#authentication--authorization)
7. [Error Handling](#error-handling)
8. [MongoDB Best Practices](#mongodb-best-practices)
9. [Advanced MongoDB Features](#advanced-mongodb-features)

## Project Overview

Anola Health is a comprehensive healthcare platform that connects four key stakeholders:
- **Patients**: Access healthcare services, manage medical records, and receive sponsorship
- **Healthcare Providers**: Offer services, manage appointments, and receive payments
- **Sponsors**: Fund healthcare for underserved populations globally
- **Vendors**: Supply medical products and services

Key Features:
- Dual wallet system (personal & sponsored funding)
- Smart Health Card with QR code integration
- Appointment booking and management
- Medical records management
- Secure payment processing
- Global sponsorship system

## Project Structure

```
anola-backend/
├── src/
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── patient.controller.js
│   │   ├── provider.controller.js
│   │   ├── sponsor.controller.js
│   │   ├── vendor.controller.js
│   │   ├── appointment.controller.js
│   │   ├── wallet.controller.js
│   │   ├── healthCard.controller.js
│   │   └── medicalRecord.controller.js
│   ├── models/
│   │   ├── user.model.js
│   │   ├── patient.model.js
│   │   ├── provider.model.js
│   │   ├── sponsor.model.js
│   │   ├── vendor.model.js
│   │   ├── appointment.model.js
│   │   ├── wallet.model.js
│   │   ├── transaction.model.js
│   │   ├── healthCard.model.js
│   │   ├── medicalRecord.model.js
│   │   └── sponsorship.model.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── patient.routes.js
│   │   ├── provider.routes.js
│   │   ├── sponsor.routes.js
│   │   ├── vendor.routes.js
│   │   ├── appointment.routes.js
│   │   ├── wallet.routes.js
│   │   └── medicalRecord.routes.js
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   ├── roleAuth.middleware.js
│   │   ├── validation.middleware.js
│   │   └── error.middleware.js
│   ├── services/
│   │   ├── auth.service.js
│   │   ├── wallet.service.js
│   │   ├── notification.service.js
│   │   ├── qrCode.service.js
│   │   └── email.service.js
│   ├── utils/
│   │   ├── database.js
│   │   ├── constants.js
│   │   └── helpers.js
│   ├── config/
│   │   └── config.js
│   └── app.js
├── tests/
├── .env
├── .gitignore
├── package.json
└── server.js
```

## Setting Up Express

### Installation
```bash
npm init -y
npm install express cors helmet morgan compression dotenv
npm install mongoose bcryptjs jsonwebtoken
npm install express-validator express-rate-limit
npm install qrcode stripe twilio @sendgrid/mail
npm install multer cloudinary socket.io
npm install -D nodemon jest supertest
```

### Basic Server Setup
```javascript
// server.js
const app = require('./src/app');
const config = require('./src/config/config');

const PORT = config.port || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

```javascript
// src/app.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/products', require('./routes/product.routes'));

// Error handling
app.use(require('./middleware/error.middleware'));

module.exports = app;
```

## MongoDB Database Design & Schemas

### Database Connection
```javascript
// src/config/database.js
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    };
    
    await mongoose.connect(process.env.MONGO_URI, options);
    
    console.log('MongoDB Connected Successfully');
    
    // Connection event handlers
    mongoose.connection.on('error', err => {
      console.error('MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });
    
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
};

module.exports = connectDB;
```

### Complete Database Schemas for Anola Health

#### Base User Schema (Parent for all user types)
```javascript
// src/models/user.model.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

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
    enum: ['patient', 'provider', 'sponsor', 'vendor', 'admin'],
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
      enum: ['male', 'female', 'other', 'prefer_not_to_say']
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
    enum: ['pending', 'active', 'inactive', 'suspended', 'deleted'],
    default: 'pending'
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
  discriminatorKey: 'userType'
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });
userSchema.index({ healthCardId: 1 });
userSchema.index({ 'profile.nationalId': 1 });
userSchema.index({ userType: 1, status: 1 });
userSchema.index({ 'address.coordinates': '2dsphere' });
userSchema.index({ createdAt: -1 });

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

// Middleware
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

module.exports = mongoose.model('User', userSchema);
```

#### Patient Schema (extends User)
```javascript
// src/models/patient.model.js
const mongoose = require('mongoose');
const User = require('./user.model');

const patientSchema = new mongoose.Schema({
  // Medical Information
  medicalInfo: {
    bloodType: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
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

const Patient = User.discriminator('patient', patientSchema);
module.exports = Patient;
```

#### Healthcare Provider Schema (extends User)
```javascript
// src/models/provider.model.js
const mongoose = require('mongoose');
const User = require('./user.model');

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
      enum: ['hospital', 'clinic', 'private_practice', 'telemedicine', 'home_care']
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
providerSchema.index({ 'professionalInfo.licenseNumber': 1 });
providerSchema.index({ 'professionalInfo.specializations.name': 1 });
providerSchema.index({ 'practice.facilities.coordinates': '2dsphere' });
providerSchema.index({ 'ratings.average': -1 });
providerSchema.index({ 'verification.isVerified': 1 });

const Provider = User.discriminator('provider', providerSchema);
module.exports = Provider;
```

#### Sponsor Schema (extends User)
```javascript
// src/models/sponsor.model.js
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
    totalPatientsSpon sored: { type: Number, default: 0 },
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

const Sponsor = User.discriminator('sponsor', sponsorSchema);
module.exports = Sponsor;
```

#### Vendor Schema (extends User)
```javascript
// src/models/vendor.model.js
const mongoose = require('mongoose');
const User = require('./user.model');

const vendorSchema = new mongoose.Schema({
  // Business Information
  business: {
    name: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['pharmacy', 'laboratory', 'medical_equipment', 'medical_supplies', 'ambulance', 'other'],
      required: true
    },
    registrationNumber: String,
    taxId: String,
    licenses: [{
      type: String,
      number: String,
      issuingAuthority: String,
      validUntil: Date
    }],
    description: String,
    website: String,
    logo: {
      url: String,
      publicId: String
    }
  },
  
  // Locations
  locations: [{
    isPrimary: Boolean,
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
    email: String,
    operatingHours: [{
      day: String,
      openTime: String,
      closeTime: String,
      isOpen: Boolean
    }],
    services: [String],
    deliveryRadius: Number // in km
  }],
  
  // Products/Services Catalog
  catalog: [{
    name: String,
    category: String,
    description: String,
    sku: String,
    price: {
      amount: Number,
      currency: String,
      discountForBulk: Number,
      discountForSponsored: Number
    },
    availability: {
      inStock: Boolean,
      quantity: Number,
      restockDate: Date
    },
    images: [{
      url: String,
      publicId: String
    }],
    requiresPrescription: Boolean,
    manufacturer: String,
    expiryDate: Date
  }],
  
  // Service Capabilities
  serviceCapabilities: {
    delivery: {
      available: Boolean,
      sameDay: Boolean,
      nextDay: Boolean,
      standard: Boolean,
      charges: {
        sameDay: Number,
        nextDay: Number,
        standard: Number,
        freeAbove: Number
      }
    },
    homeService: {
      available: Boolean,
      services: [String],
      charges: Number
    },
    insurance: {
      accepted: Boolean,
      providers: [String]
    },
    emergency: {
      available: Boolean,
      responseTime: Number // in minutes
    }
  },
  
  // Financial
  wallet: {
    type: mongoose.Schema.ObjectId,
    ref: 'Wallet'
  },
  paymentMethods: {
    cash: Boolean,
    card: Boolean,
    mobileMoney: Boolean,
    insurance: Boolean,
    sponsoredWallet: Boolean
  },
  
  // Partnerships
  partnerships: [{
    partner: {
      type: mongoose.Schema.ObjectId,
      ref: 'Provider'
    },
    type: String,
    since: Date,
    terms: String,
    discount: Number
  }],
  
  // Quality & Compliance
  certifications: [{
    name: String,
    issuingBody: String,
    validFrom: Date,
    validUntil: Date,
    documentUrl: String
  }],
  qualityMetrics: {
    orderAccuracy: Number,
    deliveryTime: Number,
    customerSatisfaction: Number
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
    categories: {
      quality: { type: Number, default: 0 },
      service: { type: Number, default: 0 },
      delivery: { type: Number, default: 0 },
      pricing: { type: Number, default: 0 }
    }
  },
  
  // Statistics
  statistics: {
    totalOrders: { type: Number, default: 0 },
    completedOrders: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    averageOrderValue: { type: Number, default: 0 },
    repeatCustomers: { type: Number, default: 0 }
  }
});

// Indexes
vendorSchema.index({ 'business.type': 1 });
vendorSchema.index({ 'locations.coordinates': '2dsphere' });
vendorSchema.index({ 'catalog.category': 1 });
vendorSchema.index({ 'catalog.name': 'text', 'catalog.description': 'text' });
vendorSchema.index({ 'ratings.average': -1 });

const Vendor = User.discriminator('vendor', vendorSchema);
module.exports = Vendor;
```

#### Appointment Schema
```javascript
// src/models/appointment.model.js
const mongoose = require('mongoose');

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
    enum: ['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show', 'rescheduled'],
    default: 'scheduled'
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

module.exports = mongoose.model('Appointment', appointmentSchema);
```

#### Wallet Schema
```javascript
// src/models/wallet.model.js
const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
  walletId: {
    type: String,
    unique: true,
    required: true
  },
  owner: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['personal', 'sponsored', 'global', 'provider', 'vendor'],
    required: true
  },
  
  // Balance Information
  balance: {
    available: {
      type: Number,
      default: 0,
      min: 0
    },
    pending: {
      type: Number,
      default: 0
    },
    reserved: {
      type: Number,
      default: 0
    },
    currency: {
      type: String,
      default: 'USD'
    }
  },
  
  // Sponsorship Details (for sponsored wallets)
  sponsorship: {
    sponsor: {
      type: mongoose.Schema.ObjectId,
      ref: 'Sponsor'
    },
    allocatedAmount: Number,
    usedAmount: Number,
    validFrom: Date,
    validUntil: Date,
    conditions: {
      maxPerTransaction: Number,
      allowedServices: [String],
      allowedProviders: [{
        type: mongoose.Schema.ObjectId,
        ref: 'Provider'
      }],
      requiresApproval: Boolean
    }
  },
  
  // Transaction History
  transactions: [{
    type: mongoose.Schema.ObjectId,
    ref: 'Transaction'
  }],
  
  // Funding Sources
  fundingSources: [{
    type: {
      type: String,
      enum: ['card', 'bank', 'mobile_money', 'sponsor']
    },
    details: {
      last4: String,
      brand: String,
      bankName: String,
      accountName: String
    },
    isDefault: Boolean,
    addedAt: Date
  }],
  
  // Withdrawal Settings
  withdrawal: {
    method: {
      type: String,
      enum: ['bank', 'mobile_money', 'card']
    },
    details: {
      bankName: String,
      accountNumber: String,
      accountName: String,
      swiftCode: String,
      iban: String,
      mobileNumber: String
    },
    minimumAmount: Number,
    lastWithdrawal: Date
  },
  
  // Security
  pin: {
    type: String,
    select: false
  },
  pinAttempts: {
    type: Number,
    default: 0
  },
  isLocked: {
    type: Boolean,
    default: false
  },
  lockedUntil: Date,
  
  // Limits
  limits: {
    daily: {
      amount: Number,
      transactions: Number
    },
    monthly: {
      amount: Number,
      transactions: Number
    },
    perTransaction: Number
  },
  
  // Statistics
  statistics: {
    totalReceived: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    totalWithdrawn: { type: Number, default: 0 },
    transactionCount: { type: Number, default: 0 },
    lastTransactionDate: Date
  },
  
  // Status
  status: {
    type: String,
    enum: ['active', 'suspended', 'closed'],
    default: 'active'
  },
  suspensionReason: String,
  closedAt: Date
}, {
  timestamps: true
});

// Indexes
walletSchema.index({ owner: 1, type: 1 });
walletSchema.index({ walletId: 1 });
walletSchema.index({ status: 1 });
walletSchema.index({ 'sponsorship.sponsor': 1 });

// Generate wallet ID
walletSchema.pre('save', function(next) {
  if (!this.walletId) {
    const prefix = this.type === 'personal' ? 'PW' : 
                   this.type === 'sponsored' ? 'SW' :
                   this.type === 'global' ? 'GW' :
                   this.type === 'provider' ? 'PRW' : 'VW';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.walletId = `${prefix}-${timestamp}-${random}`;
  }
  next();
});

module.exports = mongoose.model('Wallet', walletSchema);
```

#### Transaction Schema
```javascript
// src/models/transaction.model.js
const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    unique: true,
    required: true
  },
  
  // Transaction Type
  type: {
    type: String,
    enum: ['payment', 'refund', 'deposit', 'withdrawal', 'transfer', 'sponsorship'],
    required: true
  },
  category: {
    type: String,
    enum: ['consultation', 'medication', 'lab_test', 'procedure', 'emergency', 'subscription', 'donation'],
    required: true
  },
  
  // Parties Involved
  from: {
    wallet: {
      type: mongoose.Schema.ObjectId,
      ref: 'Wallet'
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    type: String
  },
  to: {
    wallet: {
      type: mongoose.Schema.ObjectId,
      ref: 'Wallet'
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    type: String
  },
  
  // Amount Details
  amount: {
    value: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'USD'
    },
    exchangeRate: Number,
    originalAmount: Number,
    originalCurrency: String
  },
  
  // Fees
  fees: {
    platform: {
      type: Number,
      default: 0
    },
    payment: {
      type: Number,
      default: 0
    },
    tax: {
      type: Number,
      default: 0
    },
    total: {
      type: Number,
      default: 0
    }
  },
  
  // Reference
  reference: {
    type: {
      type: String,
      enum: ['appointment', 'prescription', 'order', 'subscription', 'donation']
    },
    id: mongoose.Schema.Types.Mixed,
    details: String
  },
  
  // Payment Method
  paymentMethod: {
    type: {
      type: String,
      enum: ['wallet', 'card', 'bank', 'mobile_money', 'cash', 'insurance', 'sponsor']
    },
    details: {
      last4: String,
      brand: String,
      bankName: String
    }
  },
  
  // Status
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'reversed'],
    default: 'pending'
  },
  statusHistory: [{
    status: String,
    timestamp: Date,
    reason: String
  }],
  
  // Processing Information
  processor: {
    name: String,
    transactionId: String,
    responseCode: String,
    responseMessage: String
  },
  
  // Metadata
  metadata: {
    ip: String,
    userAgent: String,
    location: String,
    device: String
  },
  
  // Timestamps
  initiatedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date,
  failedAt: Date,
  reversedAt: Date,
  
  // Notes
  description: String,
  internalNotes: String,
  failureReason: String
}, {
  timestamps: true
});

// Indexes
transactionSchema.index({ transactionId: 1 });
transactionSchema.index({ 'from.wallet': 1, createdAt: -1 });
transactionSchema.index({ 'to.wallet': 1, createdAt: -1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ type: 1, category: 1 });
transactionSchema.index({ initiatedAt: -1 });

// Generate transaction ID
transactionSchema.pre('save', function(next) {
  if (!this.transactionId) {
    const date = new Date();
    const timestamp = date.getTime().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 7).toUpperCase();
    this.transactionId = `TXN-${timestamp}-${random}`;
  }
  next();
});

module.exports = mongoose.model('Transaction', transactionSchema);
```

#### Medical Record Schema
```javascript
// src/models/medicalRecord.model.js
const mongoose = require('mongoose');

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
    enum: ['consultation', 'lab_result', 'imaging', 'prescription', 'vaccination', 'surgery', 'discharge_summary', 'referral'],
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
medicalRecordSchema.index({ patient: 1, createdAt: -1 });
medicalRecordSchema.index({ provider: 1, createdAt: -1 });
medicalRecordSchema.index({ recordId: 1 });
medicalRecordSchema.index({ type: 1 });
medicalRecordSchema.index({ 'clinical.diagnoses.code': 1 });
medicalRecordSchema.index({ tags: 1 });

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

module.exports = mongoose.model('MedicalRecord', medicalRecordSchema);
```

#### Sponsorship Schema
```javascript
// src/models/sponsorship.model.js
const mongoose = require('mongoose');

const sponsorshipSchema = new mongoose.Schema({
  sponsorshipId: {
    type: String,
    unique: true,
    required: true
  },
  
  // Parties
  sponsor: {
    type: mongoose.Schema.ObjectId,
    ref: 'Sponsor',
    required: true
  },
  beneficiary: {
    type: mongoose.Schema.ObjectId,
    ref: 'Patient',
    required: true
  },
  
  // Sponsorship Details
  type: {
    type: String,
    enum: ['full', 'partial', 'emergency', 'chronic_care', 'preventive', 'medication'],
    required: true
  },
  
  // Financial
  amount: {
    allocated: {
      type: Number,
      required: true
    },
    used: {
      type: Number,
      default: 0
    },
    remaining: Number,
    currency: {
      type: String,
      default: 'USD'
    }
  },
  
  // Duration
  duration: {
    startDate: {
      type: Date,
      required: true
    },
    endDate: Date,
    isRecurring: Boolean,
    renewalDate: Date
  },
  
  // Coverage
  coverage: {
    services: [{
      type: String,
      enum: ['consultation', 'medication', 'lab_tests', 'imaging', 'surgery', 'emergency', 'all']
    }],
    providers: [{
      type: mongoose.Schema.ObjectId,
      ref: 'Provider'
    }], // Empty array means all providers
    conditions: [String], // Specific conditions covered
    excludedServices: [String],
    requiresPreApproval: Boolean,
    approvalThreshold: Number // Amount above which approval is needed
  },
  
  // Utilization
  utilization: [{
    date: Date,
    service: String,
    provider: {
      type: mongoose.Schema.ObjectId,
      ref: 'Provider'
    },
    amount: Number,
    appointment: {
      type: mongoose.Schema.ObjectId,
      ref: 'Appointment'
    },
    transaction: {
      type: mongoose.Schema.ObjectId,
      ref: 'Transaction'
    },
    approved: Boolean,
    approvedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    notes: String
  }],
  
  // Status
  status: {
    type: String,
    enum: ['pending', 'active', 'paused', 'expired', 'terminated', 'completed'],
    default: 'pending'
  },
  statusHistory: [{
    status: String,
    changedAt: Date,
    changedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    reason: String
  }],
  
  // Approval
  approval: {
    required: Boolean,
    approvedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    approvedAt: Date,
    comments: String
  },
  
  // Impact Tracking
  impact: {
    healthOutcomes: [{
      metric: String,
      baseline: String,
      current: String,
      improvement: Number,
      measuredAt: Date
    }],
    servicesReceived: {
      consultations: { type: Number, default: 0 },
      medications: { type: Number, default: 0 },
      labTests: { type: Number, default: 0 },
      procedures: { type: Number, default: 0 },
      emergencyVisits: { type: Number, default: 0 }
    },
    testimonial: {
      text: String,
      submittedAt: Date,
      isPublic: Boolean
    }
  },
  
  // Communication
  communications: [{
    type: {
      type: String,
      enum: ['welcome', 'update', 'expiry_reminder', 'thank_you', 'report']
    },
    sentTo: {
      type: String,
      enum: ['sponsor', 'beneficiary', 'both']
    },
    sentAt: Date,
    subject: String,
    content: String
  }],
  
  // Notes
  notes: {
    sponsor: String,
    internal: String,
    beneficiary: String
  },
  
  // Renewal
  renewal: {
    isEligible: Boolean,
    requestedAt: Date,
    requestedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    reviewedAt: Date,
    decision: {
      type: String,
      enum: ['approved', 'rejected', 'pending']
    },
    newAmount: Number,
    newDuration: {
      startDate: Date,
      endDate: Date
    }
  }
}, {
  timestamps: true
});

// Indexes
sponsorshipSchema.index({ sponsor: 1, status: 1 });
sponsorshipSchema.index({ beneficiary: 1, status: 1 });
sponsorshipSchema.index({ sponsorshipId: 1 });
sponsorshipSchema.index({ 'duration.startDate': 1, 'duration.endDate': 1 });
sponsorshipSchema.index({ status: 1 });

// Calculate remaining amount
sponsorshipSchema.pre('save', function(next) {
  this.amount.remaining = this.amount.allocated - this.amount.used;
  
  // Generate sponsorship ID if not exists
  if (!this.sponsorshipId) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.sponsorshipId = `SP-${timestamp}-${random}`;
  }
  
  next();
});

module.exports = mongoose.model('Sponsorship', sponsorshipSchema);
```

#### Order Schema
```javascript
// src/models/order.model.js
const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  // Order Information
  orderNumber: {
    type: String,
    unique: true,
    required: true
  },
  customer: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Items
  items: [{
    product: {
      type: mongoose.Schema.ObjectId,
      ref: 'Product',
      required: true
    },
    variant: String,
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1']
    },
    price: {
      type: Number,
      required: true
    },
    discount: {
      amount: Number,
      percentage: Number
    },
    subtotal: Number
  }],
  
  // Pricing
  pricing: {
    subtotal: {
      type: Number,
      required: true
    },
    tax: {
      amount: Number,
      rate: Number
    },
    shipping: {
      amount: Number,
      method: String,
      carrier: String,
      trackingNumber: String
    },
    discount: {
      code: String,
      amount: Number,
      type: {
        type: String,
        enum: ['fixed', 'percentage']
      }
    },
    total: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'USD'
    }
  },
  
  // Addresses
  shippingAddress: {
    firstName: String,
    lastName: String,
    company: String,
    street1: String,
    street2: String,
    city: String,
    state: String,
    country: String,
    zipCode: String,
    phone: String
  },
  billingAddress: {
    firstName: String,
    lastName: String,
    company: String,
    street1: String,
    street2: String,
    city: String,
    state: String,
    country: String,
    zipCode: String,
    phone: String
  },
  
  // Payment
  payment: {
    method: {
      type: String,
      enum: ['card', 'paypal', 'stripe', 'cash', 'bank_transfer'],
      required: true
    },
    transactionId: String,
    status: {
      type: String,
      enum: ['pending', 'processing', 'paid', 'failed', 'refunded', 'partial_refund'],
      default: 'pending'
    },
    paidAt: Date,
    refunds: [{
      amount: Number,
      reason: String,
      date: Date,
      transactionId: String
    }]
  },
  
  // Status
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
    default: 'pending'
  },
  statusHistory: [{
    status: String,
    note: String,
    changedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    changedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Fulfillment
  fulfillment: {
    type: String,
    enum: ['unfulfilled', 'partial', 'fulfilled'],
    default: 'unfulfilled'
  },
  
  // Dates
  dates: {
    placedAt: {
      type: Date,
      default: Date.now
    },
    confirmedAt: Date,
    shippedAt: Date,
    deliveredAt: Date,
    cancelledAt: Date
  },
  
  // Notes
  customerNote: String,
  internalNotes: [{
    note: String,
    addedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Metadata
  source: {
    type: String,
    enum: ['web', 'mobile', 'pos', 'manual'],
    default: 'web'
  },
  ip: String,
  userAgent: String
}, {
  timestamps: true
});

// Indexes
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ customer: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ 'payment.status': 1 });
orderSchema.index({ 'dates.placedAt': -1 });

// Generate order number
orderSchema.pre('save', async function(next) {
  if (!this.orderNumber) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.orderNumber = `ORD-${year}${month}-${random}`;
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
```

#### Category Schema
```javascript
// src/models/category.model.js
const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    unique: true
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  description: String,
  parent: {
    type: mongoose.Schema.ObjectId,
    ref: 'Category',
    default: null
  },
  ancestors: [{
    type: mongoose.Schema.ObjectId,
    ref: 'Category'
  }],
  image: {
    url: String,
    publicId: String
  },
  icon: String,
  order: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  productCount: {
    type: Number,
    default: 0
  },
  seo: {
    metaTitle: String,
    metaDescription: String,
    keywords: [String]
  }
}, {
  timestamps: true
});

// Indexes
categorySchema.index({ slug: 1 });
categorySchema.index({ parent: 1 });
categorySchema.index({ ancestors: 1 });

module.exports = mongoose.model('Category', categorySchema);
```

#### Review Schema
```javascript
// src/models/review.model.js
const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.ObjectId,
    ref: 'Product',
    required: true
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  order: {
    type: mongoose.Schema.ObjectId,
    ref: 'Order'
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5']
  },
  title: {
    type: String,
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  comment: {
    type: String,
    required: [true, 'Review comment is required'],
    maxlength: [1000, 'Comment cannot exceed 1000 characters']
  },
  images: [{
    url: String,
    publicId: String
  }],
  helpful: {
    yes: {
      type: Number,
      default: 0
    },
    no: {
      type: Number,
      default: 0
    }
  },
  verified: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  reply: {
    comment: String,
    repliedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    repliedAt: Date
  }
}, {
  timestamps: true
});

// Indexes
reviewSchema.index({ product: 1, user: 1 }, { unique: true });
reviewSchema.index({ product: 1, rating: -1 });
reviewSchema.index({ status: 1 });

module.exports = mongoose.model('Review', reviewSchema);
```

#### Cart Schema
```javascript
// src/models/cart.model.js
const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  items: [{
    product: {
      type: mongoose.Schema.ObjectId,
      ref: 'Product',
      required: true
    },
    variant: String,
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1']
    },
    price: Number,
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  coupon: {
    code: String,
    discount: Number,
    type: {
      type: String,
      enum: ['fixed', 'percentage']
    }
  },
  totals: {
    subtotal: {
      type: Number,
      default: 0
    },
    discount: {
      type: Number,
      default: 0
    },
    tax: {
      type: Number,
      default: 0
    },
    shipping: {
      type: Number,
      default: 0
    },
    total: {
      type: Number,
      default: 0
    }
  },
  expiresAt: {
    type: Date,
    default: Date.now,
    expires: 2592000 // 30 days
  }
}, {
  timestamps: true
});

// Indexes
cartSchema.index({ user: 1 });
cartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Calculate totals
cartSchema.methods.calculateTotals = async function() {
  let subtotal = 0;
  
  for (const item of this.items) {
    subtotal += item.price * item.quantity;
  }
  
  this.totals.subtotal = subtotal;
  
  if (this.coupon) {
    if (this.coupon.type === 'fixed') {
      this.totals.discount = this.coupon.discount;
    } else {
      this.totals.discount = (subtotal * this.coupon.discount) / 100;
    }
  }
  
  this.totals.total = subtotal - this.totals.discount + this.totals.tax + this.totals.shipping;
  
  return this.save();
};

module.exports = mongoose.model('Cart', cartSchema);
```

#### Notification Schema
```javascript
// src/models/notification.model.js
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['order', 'product', 'review', 'system', 'promotion'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  data: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  read: {
    type: Boolean,
    default: false
  },
  readAt: Date,
  actionUrl: String,
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  expiresAt: Date
}, {
  timestamps: true
});

// Indexes
notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Notification', notificationSchema);
```

## API Architecture

### RESTful Routes Design
```javascript
// src/routes/product.routes.js
const router = require('express').Router();
const productController = require('../controllers/product.controller');
const auth = require('../middleware/auth.middleware');
const validate = require('../middleware/validation.middleware');

// GET /api/products - Get all products
router.get('/', productController.getProducts);

// GET /api/products/:id - Get single product
router.get('/:id', validate.productId, productController.getProduct);

// POST /api/products - Create product (protected)
router.post('/', 
  auth.authenticate, 
  auth.authorize('admin'),
  validate.createProduct,
  productController.createProduct
);

// PUT /api/products/:id - Update product
router.put('/:id',
  auth.authenticate,
  auth.authorize('admin'),
  validate.updateProduct,
  productController.updateProduct
);

// DELETE /api/products/:id - Delete product
router.delete('/:id',
  auth.authenticate,
  auth.authorize('admin'),
  productController.deleteProduct
);

module.exports = router;
```

### Controller Pattern
```javascript
// src/controllers/product.controller.js
const Product = require('../models/product.model');
const asyncHandler = require('../utils/asyncHandler');

exports.getProducts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, sort = '-createdAt', ...filters } = req.query;
  
  const products = await Product.find(filters)
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .sort(sort);
    
  const count = await Product.countDocuments(filters);
  
  res.json({
    products,
    totalPages: Math.ceil(count / limit),
    currentPage: page,
    total: count
  });
});

exports.createProduct = asyncHandler(async (req, res) => {
  const product = await Product.create({
    ...req.body,
    createdBy: req.user.id
  });
  
  res.status(201).json({
    success: true,
    data: product
  });
});
```

## Authentication & Authorization

### JWT Implementation
```javascript
// src/services/auth.service.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/user.model');
const config = require('../config/config');

class AuthService {
  generateTokens(userId) {
    const accessToken = jwt.sign(
      { userId },
      config.jwtSecret,
      { expiresIn: '15m' }
    );
    
    const refreshToken = jwt.sign(
      { userId },
      config.refreshSecret,
      { expiresIn: '7d' }
    );
    
    return { accessToken, refreshToken };
  }
  
  async login(email, password) {
    const user = await User.findOne({ email }).select('+password');
    
    if (!user || !await bcrypt.compare(password, user.password)) {
      throw new Error('Invalid credentials');
    }
    
    const tokens = this.generateTokens(user.id);
    
    // Save refresh token to database
    user.refreshTokens.push({ token: tokens.refreshToken });
    await user.save();
    
    return {
      user: user.toJSON(),
      ...tokens
    };
  }
  
  async refreshToken(refreshToken) {
    const decoded = jwt.verify(refreshToken, config.refreshSecret);
    const user = await User.findById(decoded.userId);
    
    if (!user || !user.refreshTokens.some(t => t.token === refreshToken)) {
      throw new Error('Invalid refresh token');
    }
    
    return this.generateTokens(user.id);
  }
}

module.exports = new AuthService();
```

### Auth Middleware
```javascript
// src/middleware/auth.middleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const config = require('../config/config');

exports.authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const decoded = jwt.verify(token, config.jwtSecret);
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};
```

## Error Handling

### Global Error Handler
```javascript
// src/middleware/error.middleware.js
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  
  // Log error
  console.error(err);
  
  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = { message, statusCode: 404 };
  }
  
  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `Duplicate field value: ${field}`;
    error = { message, statusCode: 400 };
  }
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = { message, statusCode: 400 };
  }
  
  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Server Error'
  });
};

module.exports = errorHandler;
```

### Async Handler Wrapper
```javascript
// src/utils/asyncHandler.js
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
```

## MongoDB Best Practices

### 1. Environment Variables
```bash
# .env
NODE_ENV=development
PORT=3000
MONGO_URI=mongodb://localhost:27017/myapp
JWT_SECRET=your-secret-key
REFRESH_SECRET=your-refresh-secret
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=your-email
EMAIL_PASS=your-password
REDIS_URL=redis://localhost:6379
```

### 2. Input Validation
```javascript
// Using Joi
npm install joi

// src/middleware/validation.middleware.js
const Joi = require('joi');

exports.validateBody = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    next();
  };
};

// Validation schemas
exports.createProductSchema = Joi.object({
  name: Joi.string().required().min(3).max(100),
  price: Joi.number().required().positive(),
  description: Joi.string().max(500),
  category: Joi.string().required(),
  stock: Joi.number().integer().min(0)
});
```

### 3. Rate Limiting
```javascript
npm install express-rate-limit

// src/middleware/rateLimiter.js
const rateLimit = require('express-rate-limit');

exports.apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});

exports.authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Limit login attempts
  skipSuccessfulRequests: true
});
```

### 4. MongoDB Performance Optimization

#### Indexing Strategies
```javascript
// Compound Indexes (order matters!)
productSchema.index({ category: 1, price: -1, createdAt: -1 });

// Text Search Index
productSchema.index({ 
  name: 'text', 
  description: 'text', 
  tags: 'text' 
}, {
  weights: {
    name: 10,
    tags: 5,
    description: 1
  }
});

// Partial Indexes (save space)
orderSchema.index(
  { customer: 1, createdAt: -1 },
  { partialFilterExpression: { status: { $in: ['pending', 'processing'] } } }
);

// TTL Index for automatic document expiration
notificationSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }
);

// Unique Sparse Index
userSchema.index(
  { email: 1 },
  { unique: true, sparse: true }
);
```

#### Query Optimization
```javascript
// 1. Use projection to limit fields
const users = await User.find({}, 'name email createdAt');

// 2. Use lean() for read-only operations (5x faster)
const products = await Product.find().lean();

// 3. Use cursor for large datasets
const cursor = Product.find().cursor();
cursor.on('data', (doc) => {
  // Process document
});

// 4. Aggregation Pipeline Optimization
const stats = await Order.aggregate([
  // Use $match early to reduce documents
  { $match: { 
    status: 'completed',
    createdAt: { $gte: new Date('2024-01-01') }
  }},
  
  // Use $project to reduce data size
  { $project: {
    productId: 1,
    quantity: 1,
    total: 1
  }},
  
  // Group and calculate
  { $group: {
    _id: '$productId',
    totalSales: { $sum: '$quantity' },
    revenue: { $sum: '$total' }
  }},
  
  // Sort and limit
  { $sort: { revenue: -1 }},
  { $limit: 10 }
]);

// 5. Use explain() to analyze queries
const explanation = await Product.find({ category: 'electronics' })
  .explain('executionStats');
```

#### Connection Pooling
```javascript
// Optimal connection settings
mongoose.connect(uri, {
  maxPoolSize: 10, // Maximum number of connections
  minPoolSize: 2,  // Minimum number of connections
  maxIdleTimeMS: 10000, // Close idle connections after 10s
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
});
```

### 5. Caching Strategy
```javascript
npm install redis

// src/utils/cache.js
const redis = require('redis');
const { promisify } = require('util');

const client = redis.createClient(process.env.REDIS_URL);
const getAsync = promisify(client.get).bind(client);
const setAsync = promisify(client.setex).bind(client);

exports.cache = (key, ttl = 3600) => {
  return async (req, res, next) => {
    try {
      const cached = await getAsync(key);
      if (cached) {
        return res.json(JSON.parse(cached));
      }
      
      res.sendResponse = res.json;
      res.json = (body) => {
        setAsync(key, ttl, JSON.stringify(body));
        res.sendResponse(body);
      };
      
      next();
    } catch (error) {
      next();
    }
  };
};
```

### 6. API Documentation
```javascript
npm install swagger-ui-express swagger-jsdoc

// src/utils/swagger.js
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'My API',
      version: '1.0.0',
      description: 'API documentation'
    },
    servers: [
      { url: 'http://localhost:3000/api' }
    ]
  },
  apis: ['./src/routes/*.js']
};

const specs = swaggerJsdoc(options);

module.exports = (app) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
};
```

### 7. Testing
```javascript
npm install -D jest supertest

// tests/auth.test.js
const request = require('supertest');
const app = require('../src/app');

describe('Auth Endpoints', () => {
  test('POST /api/auth/register', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });
    
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('token');
  });
});
```

### 8. MongoDB Security Best Practices
- ✅ Enable MongoDB authentication
- ✅ Use connection string with credentials
- ✅ Implement field-level encryption for sensitive data
- ✅ Use MongoDB Atlas IP whitelisting
- ✅ Enable audit logging
- ✅ Regular backups with point-in-time recovery
- ✅ Use read/write concerns for data consistency
- ✅ Implement schema validation
- ✅ Sanitize inputs to prevent NoSQL injection
- ✅ Use projection to limit exposed fields
- ✅ Enable TLS/SSL for connections
- ✅ Implement role-based access control (RBAC)

### 9. Deployment Considerations
- Use PM2 for process management
- Set up CI/CD pipeline
- Configure reverse proxy (Nginx)
- Database backups and migrations
- Health check endpoints
- Graceful shutdown handling
- Container orchestration (Docker/Kubernetes)

## Advanced MongoDB Features

### Transactions
```javascript
// Multi-document ACID transactions
const session = await mongoose.startSession();
session.startTransaction();

try {
  const order = await Order.create([{ ...orderData }], { session });
  
  // Update product inventory
  for (const item of orderData.items) {
    await Product.findByIdAndUpdate(
      item.product,
      { $inc: { 'inventory.quantity': -item.quantity } },
      { session }
    );
  }
  
  // Clear user's cart
  await Cart.findOneAndDelete({ user: userId }, { session });
  
  await session.commitTransaction();
  return order;
} catch (error) {
  await session.abortTransaction();
  throw error;
} finally {
  session.endSession();
}
```

### Change Streams (Real-time)
```javascript
// Watch for changes in real-time
const changeStream = Product.watch(
  [{ $match: { operationType: { $in: ['insert', 'update'] } } }],
  { fullDocument: 'updateLookup' }
);

changeStream.on('change', (change) => {
  console.log('Product changed:', change);
  // Send websocket notification
  io.emit('productUpdate', change.fullDocument);
});
```

### Aggregation Pipelines
```javascript
// Complex analytics query
const salesReport = await Order.aggregate([
  // Stage 1: Match date range
  { $match: {
    'dates.placedAt': {
      $gte: new Date('2024-01-01'),
      $lte: new Date('2024-12-31')
    },
    status: { $ne: 'cancelled' }
  }},
  
  // Stage 2: Lookup customer details
  { $lookup: {
    from: 'users',
    localField: 'customer',
    foreignField: '_id',
    as: 'customerInfo'
  }},
  
  // Stage 3: Unwind items array
  { $unwind: '$items' },
  
  // Stage 4: Lookup product details
  { $lookup: {
    from: 'products',
    localField: 'items.product',
    foreignField: '_id',
    as: 'productInfo'
  }},
  
  // Stage 5: Group by category
  { $group: {
    _id: { $arrayElemAt: ['$productInfo.category', 0] },
    totalRevenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } },
    totalOrders: { $addToSet: '$_id' },
    avgOrderValue: { $avg: '$pricing.total' },
    topProducts: { 
      $push: {
        name: { $arrayElemAt: ['$productInfo.name', 0] },
        quantity: '$items.quantity'
      }
    }
  }},
  
  // Stage 6: Sort by revenue
  { $sort: { totalRevenue: -1 }},
  
  // Stage 7: Format output
  { $project: {
    category: '$_id',
    revenue: { $round: ['$totalRevenue', 2] },
    orderCount: { $size: '$totalOrders' },
    avgOrderValue: { $round: ['$avgOrderValue', 2] },
    topProducts: { $slice: ['$topProducts', 5] }
  }}
]);
```

### Geospatial Queries
```javascript
// Find nearby stores
const nearbyStores = await Store.find({
  location: {
    $near: {
      $geometry: {
        type: 'Point',
        coordinates: [longitude, latitude]
      },
      $maxDistance: 5000 // 5km radius
    }
  }
});

// Find stores within polygon area
const storesInArea = await Store.find({
  location: {
    $geoWithin: {
      $polygon: [
        [lng1, lat1],
        [lng2, lat2],
        [lng3, lat3],
        [lng1, lat1] // Close the polygon
      ]
    }
  }
});
```

### Schema Validation
```javascript
// MongoDB native validation
db.createCollection('products', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name', 'price', 'category'],
      properties: {
        name: {
          bsonType: 'string',
          description: 'must be a string and is required'
        },
        price: {
          bsonType: 'number',
          minimum: 0,
          description: 'must be a positive number and is required'
        },
        category: {
          enum: ['electronics', 'clothing', 'books', 'food'],
          description: 'must be a valid category'
        }
      }
    }
  },
  validationLevel: 'strict',
  validationAction: 'error'
});
```

### Bulk Operations
```javascript
// Efficient bulk writes
const bulkOps = products.map(product => ({
  updateOne: {
    filter: { sku: product.sku },
    update: { $set: product },
    upsert: true
  }
}));

const result = await Product.bulkWrite(bulkOps, { ordered: false });
console.log(`Modified: ${result.modifiedCount}, Inserted: ${result.insertedCount}`);
```

## MongoDB Atlas Features

### Atlas Search (Lucene-based)
```javascript
// Advanced text search with Atlas Search
const searchResults = await Product.aggregate([
  {
    $search: {
      index: 'product_search',
      compound: {
        must: [{
          text: {
            query: 'laptop',
            path: ['name', 'description']
          }
        }],
        filter: [{
          range: {
            path: 'price.regular',
            gte: 500,
            lte: 2000
          }
        }]
      }
    }
  },
  {
    $project: {
      name: 1,
      price: 1,
      score: { $meta: 'searchScore' }
    }
  },
  { $limit: 10 }
]);
```

### Data Tiering
```javascript
// Archive old data to cheaper storage
const archiveOldOrders = async () => {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  
  await Order.updateMany(
    { 'dates.placedAt': { $lt: sixMonthsAgo } },
    { $set: { _tier: 'archive' } }
  );
};
```

## Conclusion
This guide provides a comprehensive approach to building production-ready MongoDB-backed Node.js Express APIs. The schemas and patterns presented here can be adapted to various use cases while maintaining scalability, performance, and security. Remember to monitor your database performance, implement proper indexing strategies, and regularly review your schema design as your application evolves.