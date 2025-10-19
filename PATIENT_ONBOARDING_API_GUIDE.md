# Patient Onboarding API Backend Integration Guide

## Overview

This guide provides complete backend API specifications for the Àñola Health patient onboarding system. The onboarding process consists of 4 steps that collect patient information, medical history, wallet setup, and digital health card creation.

---

## Table of Contents

1. [Authentication](#authentication)
2. [Onboarding Flow](#onboarding-flow)
3. [API Endpoints](#api-endpoints)
4. [Database Schemas](#database-schemas)
5. [Security & Validation](#security--validation)
6. [Error Handling](#error-handling)
7. [Implementation Examples](#implementation-examples)
8. [Testing](#testing)

---

## Authentication

### Session Management

Patient onboarding requires a temporary session token before full authentication.

```typescript
// Frontend: Initialize onboarding session
const initializeOnboarding = async () => {
  const response = await fetch('/api/onboarding/init', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  const { sessionToken, expiresAt } = await response.json();
  // Store in sessionStorage
  sessionStorage.setItem('onboardingToken', sessionToken);
  return sessionToken;
};
```

**Backend Endpoint:**
```javascript
// POST /api/onboarding/init
router.post('/init', async (req, res) => {
  const sessionToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

  await OnboardingSession.create({
    token: sessionToken,
    expiresAt,
    step: 0,
    data: {}
  });

  res.json({ sessionToken, expiresAt });
});
```

---

## Onboarding Flow

### Step 1: Personal Information
Collects basic patient demographics and contact information.

### Step 2: Medical History
Gathers medical conditions, allergies, medications, and emergency contacts.

### Step 3: Wallet Setup
Configures individual wallet and optional insurance linkage.

### Step 4: Digital Health Card
Generates unique health ID and QR code for patient identification.

---

## API Endpoints

### 1. Initialize Onboarding Session

**Endpoint:** `POST /api/onboarding/init`

**Description:** Creates a temporary onboarding session.

**Request:**
```json
{
  "referralCode": "ANOLA2024" // Optional
}
```

**Response:**
```json
{
  "success": true,
  "sessionToken": "abc123...",
  "expiresAt": "2024-01-15T10:30:00Z"
}
```

---

### 2. Submit Step 1 - Personal Information

**Endpoint:** `POST /api/onboarding/step1`

**Headers:**
```
Authorization: Bearer {sessionToken}
Content-Type: application/json
```

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@email.com",
  "phone": "+1234567890",
  "dateOfBirth": "1990-05-15",
  "gender": "male",
  "address": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "USA"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Personal information saved",
  "nextStep": 2,
  "temporaryUserId": "temp_user_123abc"
}
```

**Validation Rules:**
- `firstName`: Required, 2-50 characters, letters only
- `lastName`: Required, 2-50 characters, letters only
- `email`: Required, valid email format, unique in system
- `phone`: Required, valid phone format
- `dateOfBirth`: Required, must be 18+ years old
- `gender`: Required, one of: male, female, other, prefer_not_to_say

---

### 3. Submit Step 2 - Medical Information

**Endpoint:** `POST /api/onboarding/step2`

**Headers:**
```
Authorization: Bearer {sessionToken}
Content-Type: application/json
```

**Request Body:**
```json
{
  "medicalConditions": [
    {
      "condition": "Hypertension",
      "diagnosedDate": "2020-03-15",
      "severity": "moderate",
      "notes": "Controlled with medication"
    }
  ],
  "allergies": [
    {
      "allergen": "Penicillin",
      "reaction": "Severe rash",
      "severity": "high"
    },
    {
      "allergen": "Peanuts",
      "reaction": "Anaphylaxis",
      "severity": "critical"
    }
  ],
  "currentMedications": [
    {
      "name": "Lisinopril",
      "dosage": "10mg",
      "frequency": "once daily",
      "prescribedBy": "Dr. Smith"
    }
  ],
  "emergencyContact": {
    "name": "Jane Doe",
    "relationship": "Spouse",
    "phone": "+1234567891",
    "email": "jane.doe@email.com"
  },
  "bloodType": "A+",
  "height": {
    "value": 175,
    "unit": "cm"
  },
  "weight": {
    "value": 75,
    "unit": "kg"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Medical information saved",
  "nextStep": 3,
  "medicalRecordId": "MR-123456"
}
```

**Validation Rules:**
- All arrays can be empty but must be present
- `severity` for conditions/allergies: low, moderate, high, critical
- `emergencyContact.phone`: Required, valid phone format
- `bloodType`: Optional, valid blood type (A+, A-, B+, B-, AB+, AB-, O+, O-)

---

### 4. Submit Step 3 - Wallet Setup

**Endpoint:** `POST /api/onboarding/step3`

**Headers:**
```
Authorization: Bearer {sessionToken}
Content-Type: application/json
```

**Request Body:**
```json
{
  "activateWallet": true,
  "initialDeposit": {
    "amount": 100.00,
    "currency": "USD",
    "paymentMethod": "credit_card",
    "paymentDetails": {
      "cardToken": "tok_visa_4242",
      "last4": "4242"
    }
  },
  "insurance": {
    "hasInsurance": true,
    "provider": "Blue Cross Blue Shield",
    "policyNumber": "BCBS123456789",
    "groupNumber": "GRP789",
    "subscriberName": "John Doe",
    "subscriberDOB": "1990-05-15",
    "effectiveDate": "2023-01-01",
    "coverageType": "family"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Wallet configured successfully",
  "nextStep": 4,
  "wallet": {
    "walletId": "WLT-123456",
    "balance": 100.00,
    "currency": "USD",
    "status": "active"
  },
  "insurance": {
    "insuranceId": "INS-789012",
    "status": "pending_verification",
    "verificationRequired": true
  }
}
```

**Validation Rules:**
- `activateWallet`: Required boolean
- `initialDeposit`: Optional, minimum $10.00
- `insurance.policyNumber`: Required if hasInsurance is true
- Payment processing via Stripe/PayPal integration

---

### 5. Submit Step 4 - Complete Onboarding & Generate Health Card

**Endpoint:** `POST /api/onboarding/complete`

**Headers:**
```
Authorization: Bearer {sessionToken}
Content-Type: application/json
```

**Request Body:**
```json
{
  "password": "SecureP@ssw0rd123",
  "confirmPassword": "SecureP@ssw0rd123",
  "termsAccepted": true,
  "privacyPolicyAccepted": true,
  "consentToDataSharing": false,
  "preferredLanguage": "en",
  "notificationPreferences": {
    "email": true,
    "sms": true,
    "push": true,
    "appointmentReminders": true,
    "healthTips": false,
    "promotions": false
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Onboarding completed successfully",
  "user": {
    "userId": "USR-123456",
    "healthCardId": "AH-1234567",
    "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANS...",
    "qrCodeUrl": "https://api.anola.health/qr/AH-1234567.png",
    "status": "active",
    "createdAt": "2024-01-15T10:00:00Z"
  },
  "authToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "refresh_abc123...",
  "redirectUrl": "/dashboard/patient"
}
```

**Validation Rules:**
- `password`: Minimum 8 characters, at least 1 uppercase, 1 lowercase, 1 number, 1 special character
- `termsAccepted`: Must be true
- `privacyPolicyAccepted`: Must be true

---

### 6. Resume Onboarding Session

**Endpoint:** `GET /api/onboarding/status`

**Headers:**
```
Authorization: Bearer {sessionToken}
```

**Response:**
```json
{
  "success": true,
  "currentStep": 2,
  "completedSteps": [1],
  "expiresAt": "2024-01-15T10:30:00Z",
  "data": {
    "step1": {
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@email.com"
    }
  }
}
```

---

### 7. Upload Profile Picture

**Endpoint:** `POST /api/onboarding/profile-picture`

**Headers:**
```
Authorization: Bearer {sessionToken}
Content-Type: multipart/form-data
```

**Request:**
```
FormData:
  - file: [image file]
  - crop: { x: 0, y: 0, width: 200, height: 200 }
```

**Response:**
```json
{
  "success": true,
  "profilePictureUrl": "https://cdn.anola.health/profiles/USR-123456.jpg",
  "thumbnailUrl": "https://cdn.anola.health/profiles/USR-123456_thumb.jpg"
}
```

---

## Database Schemas

### OnboardingSession Schema (MongoDB)

```javascript
const OnboardingSessionSchema = new mongoose.Schema({
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
    index: { expireAfterSeconds: 0 } // Auto-delete expired sessions
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
    }
  },
  temporaryUserId: String,
  ipAddress: String,
  userAgent: String,
  referralCode: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});
```

---

### Patient Schema (MongoDB)

```javascript
const PatientSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  healthCardId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    index: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  profile: {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    phone: { type: String, required: true },
    dateOfBirth: { type: Date, required: true },
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer_not_to_say'],
      required: true
    },
    profilePicture: String,
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    }
  },
  medicalInfo: {
    bloodType: String,
    height: { value: Number, unit: String },
    weight: { value: Number, unit: String },
    medicalConditions: [{
      condition: String,
      diagnosedDate: Date,
      severity: String,
      notes: String
    }],
    allergies: [{
      allergen: String,
      reaction: String,
      severity: String
    }],
    currentMedications: [{
      name: String,
      dosage: String,
      frequency: String,
      prescribedBy: String,
      startDate: Date
    }]
  },
  emergencyContact: {
    name: String,
    relationship: String,
    phone: String,
    email: String
  },
  wallet: {
    walletId: String,
    balance: { type: Number, default: 0 },
    currency: { type: String, default: 'USD' },
    status: {
      type: String,
      enum: ['active', 'suspended', 'closed'],
      default: 'active'
    }
  },
  insurance: {
    hasInsurance: { type: Boolean, default: false },
    provider: String,
    policyNumber: String,
    groupNumber: String,
    subscriberName: String,
    subscriberDOB: Date,
    effectiveDate: Date,
    coverageType: String,
    status: {
      type: String,
      enum: ['active', 'pending_verification', 'inactive'],
      default: 'pending_verification'
    }
  },
  qrCode: {
    data: String, // Base64 encoded QR code
    url: String,  // CDN URL
    generatedAt: Date
  },
  preferences: {
    language: { type: String, default: 'en' },
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      appointmentReminders: { type: Boolean, default: true },
      healthTips: { type: Boolean, default: false },
      promotions: { type: Boolean, default: false }
    }
  },
  consent: {
    termsAccepted: { type: Boolean, required: true },
    privacyPolicyAccepted: { type: Boolean, required: true },
    dataSharing: { type: Boolean, default: false },
    acceptedAt: Date
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'suspended', 'inactive'],
    default: 'active'
  },
  onboardingCompletedAt: Date,
  lastLoginAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for performance
PatientSchema.index({ email: 1 });
PatientSchema.index({ healthCardId: 1 });
PatientSchema.index({ 'profile.phone': 1 });
PatientSchema.index({ status: 1, createdAt: -1 });
```

---

### Wallet Schema (MongoDB)

```javascript
const WalletSchema = new mongoose.Schema({
  walletId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  userId: {
    type: String,
    required: true,
    ref: 'Patient',
    index: true
  },
  type: {
    type: String,
    enum: ['individual', 'sponsored'],
    default: 'individual'
  },
  balance: {
    type: Number,
    default: 0,
    min: 0
  },
  currency: {
    type: String,
    default: 'USD'
  },
  status: {
    type: String,
    enum: ['active', 'suspended', 'closed'],
    default: 'active'
  },
  transactions: [{
    transactionId: String,
    type: {
      type: String,
      enum: ['deposit', 'withdrawal', 'payment', 'refund']
    },
    amount: Number,
    description: String,
    status: String,
    createdAt: Date
  }],
  paymentMethods: [{
    methodId: String,
    type: String, // credit_card, debit_card, bank_account
    provider: String, // stripe, paypal
    last4: String,
    expiryDate: String,
    isDefault: Boolean,
    createdAt: Date
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});
```

---

## Security & Validation

### Password Requirements

```javascript
const passwordSchema = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecialChar: true,
  specialChars: '!@#$%^&*()_+-=[]{}|;:,.<>?'
};

function validatePassword(password) {
  const errors = [];

  if (password.length < passwordSchema.minLength) {
    errors.push(`Password must be at least ${passwordSchema.minLength} characters`);
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
```

---

### Email Verification

```javascript
// Send verification email after step 1
router.post('/step1', async (req, res) => {
  // ... save data ...

  // Generate verification token
  const verificationToken = crypto.randomBytes(32).toString('hex');

  await EmailVerification.create({
    email: req.body.email,
    token: verificationToken,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
  });

  // Send email
  await sendVerificationEmail({
    to: req.body.email,
    token: verificationToken,
    name: req.body.firstName
  });

  res.json({ success: true, nextStep: 2 });
});

// Verify email endpoint
router.get('/verify-email/:token', async (req, res) => {
  const verification = await EmailVerification.findOne({
    token: req.params.token,
    expiresAt: { $gt: new Date() }
  });

  if (!verification) {
    return res.status(400).json({ error: 'Invalid or expired token' });
  }

  await Patient.updateOne(
    { email: verification.email },
    { $set: { 'profile.emailVerified': true } }
  );

  await verification.remove();

  res.json({ success: true, message: 'Email verified successfully' });
});
```

---

### Rate Limiting

```javascript
const rateLimit = require('express-rate-limit');

const onboardingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many onboarding attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/init', onboardingLimiter, async (req, res) => {
  // ...
});
```

---

### Data Sanitization

```javascript
const validator = require('validator');

function sanitizeInput(data) {
  return {
    firstName: validator.escape(data.firstName?.trim() || ''),
    lastName: validator.escape(data.lastName?.trim() || ''),
    email: validator.normalizeEmail(data.email || ''),
    phone: data.phone?.replace(/[^0-9+]/g, '') || '',
    // ... other fields
  };
}
```

---

## Error Handling

### Standard Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Email is already registered"
      },
      {
        "field": "password",
        "message": "Password must contain at least one uppercase letter"
      }
    ]
  }
}
```

### Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `VALIDATION_ERROR` | Input validation failed | 400 |
| `SESSION_EXPIRED` | Onboarding session expired | 401 |
| `DUPLICATE_EMAIL` | Email already exists | 409 |
| `DUPLICATE_PHONE` | Phone number already exists | 409 |
| `PAYMENT_FAILED` | Payment processing failed | 402 |
| `INSURANCE_VERIFICATION_FAILED` | Insurance verification failed | 422 |
| `RATE_LIMIT_EXCEEDED` | Too many requests | 429 |
| `INTERNAL_ERROR` | Server error | 500 |

---

## Implementation Examples

### Express.js Backend Implementation

```javascript
// server.js
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const QRCode = require('qrcode');
const crypto = require('crypto');

const app = express();
app.use(express.json());

// Middleware: Verify onboarding session
const verifyOnboardingSession = async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({
      success: false,
      error: { code: 'NO_TOKEN', message: 'Session token required' }
    });
  }

  const session = await OnboardingSession.findOne({
    token,
    expiresAt: { $gt: new Date() }
  });

  if (!session) {
    return res.status(401).json({
      success: false,
      error: { code: 'SESSION_EXPIRED', message: 'Session expired or invalid' }
    });
  }

  req.session = session;
  next();
};

// POST /api/onboarding/step1
router.post('/step1', verifyOnboardingSession, async (req, res) => {
  try {
    const { firstName, lastName, email, phone, dateOfBirth, gender, address } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !phone || !dateOfBirth || !gender) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Missing required fields',
          details: []
        }
      });
    }

    // Check if email already exists
    const existingUser = await Patient.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'DUPLICATE_EMAIL',
          message: 'Email already registered'
        }
      });
    }

    // Validate age (must be 18+)
    const age = new Date().getFullYear() - new Date(dateOfBirth).getFullYear();
    if (age < 18) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Must be 18 years or older'
        }
      });
    }

    // Save to session
    req.session.step = 1;
    req.session.data.step1 = {
      firstName,
      lastName,
      email: email.toLowerCase(),
      phone,
      dateOfBirth: new Date(dateOfBirth),
      gender,
      address
    };

    // Generate temporary user ID
    const temporaryUserId = `temp_${crypto.randomBytes(8).toString('hex')}`;
    req.session.temporaryUserId = temporaryUserId;

    await req.session.save();

    res.json({
      success: true,
      message: 'Personal information saved',
      nextStep: 2,
      temporaryUserId
    });

  } catch (error) {
    console.error('Step 1 error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred'
      }
    });
  }
});

// POST /api/onboarding/complete
router.post('/complete', verifyOnboardingSession, async (req, res) => {
  try {
    const { password, termsAccepted, privacyPolicyAccepted, notificationPreferences } = req.body;

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Password validation failed',
          details: passwordValidation.errors.map(err => ({ field: 'password', message: err }))
        }
      });
    }

    // Verify all steps completed
    if (req.session.step < 3) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INCOMPLETE_ONBOARDING',
          message: 'Please complete all previous steps'
        }
      });
    }

    // Generate unique IDs
    const userId = `USR-${Date.now()}${Math.random().toString(36).substr(2, 5)}`;
    const healthCardId = `AH-${Date.now()}${Math.random().toString(36).substr(2, 7)}`;
    const walletId = `WLT-${Date.now()}${Math.random().toString(36).substr(2, 6)}`;

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Generate QR code
    const qrCodeData = JSON.stringify({
      healthCardId,
      userId,
      type: 'patient',
      issuedAt: new Date().toISOString()
    });
    const qrCodeImage = await QRCode.toDataURL(qrCodeData);

    // Create patient record
    const patient = await Patient.create({
      userId,
      healthCardId,
      email: req.session.data.step1.email,
      passwordHash,
      profile: {
        ...req.session.data.step1,
        emailVerified: false
      },
      medicalInfo: req.session.data.step2 || {},
      emergencyContact: req.session.data.step2?.emergencyContact,
      wallet: {
        walletId,
        balance: req.session.data.step3?.initialDeposit?.amount || 0,
        currency: 'USD',
        status: 'active'
      },
      insurance: req.session.data.step3?.insurance || { hasInsurance: false },
      qrCode: {
        data: qrCodeImage,
        url: `https://cdn.anola.health/qr/${healthCardId}.png`,
        generatedAt: new Date()
      },
      preferences: {
        language: req.body.preferredLanguage || 'en',
        notifications: notificationPreferences
      },
      consent: {
        termsAccepted,
        privacyPolicyAccepted,
        dataSharing: req.body.consentToDataSharing || false,
        acceptedAt: new Date()
      },
      onboardingCompletedAt: new Date()
    });

    // Create wallet record
    if (req.session.data.step3?.activateWallet) {
      await Wallet.create({
        walletId,
        userId,
        type: 'individual',
        balance: req.session.data.step3.initialDeposit?.amount || 0,
        currency: 'USD',
        status: 'active',
        transactions: req.session.data.step3.initialDeposit ? [{
          transactionId: `TXN-${Date.now()}`,
          type: 'deposit',
          amount: req.session.data.step3.initialDeposit.amount,
          description: 'Initial deposit',
          status: 'completed',
          createdAt: new Date()
        }] : []
      });
    }

    // Generate JWT tokens
    const authToken = jwt.sign(
      { userId, email: patient.email, userType: 'patient' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const refreshToken = jwt.sign(
      { userId, type: 'refresh' },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '30d' }
    );

    // Delete onboarding session
    await req.session.remove();

    // Send welcome email
    await sendWelcomeEmail({
      to: patient.email,
      name: patient.profile.firstName,
      healthCardId
    });

    res.json({
      success: true,
      message: 'Onboarding completed successfully',
      user: {
        userId,
        healthCardId,
        qrCode: qrCodeImage,
        qrCodeUrl: `https://cdn.anola.health/qr/${healthCardId}.png`,
        status: 'active',
        createdAt: patient.createdAt
      },
      authToken,
      refreshToken,
      redirectUrl: '/dashboard/patient'
    });

  } catch (error) {
    console.error('Complete onboarding error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while completing onboarding'
      }
    });
  }
});

module.exports = router;
```

---

### Frontend Integration Example

```typescript
// src/services/onboarding.service.ts
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

class OnboardingService {
  private sessionToken: string | null = null;

  async initSession(): Promise<string> {
    const response = await axios.post(`${API_BASE_URL}/onboarding/init`);
    this.sessionToken = response.data.sessionToken;
    sessionStorage.setItem('onboardingToken', this.sessionToken);
    return this.sessionToken;
  }

  private getHeaders() {
    const token = this.sessionToken || sessionStorage.getItem('onboardingToken');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  async submitStep1(data: Step1Data) {
    const response = await axios.post(
      `${API_BASE_URL}/onboarding/step1`,
      data,
      { headers: this.getHeaders() }
    );
    return response.data;
  }

  async submitStep2(data: Step2Data) {
    const response = await axios.post(
      `${API_BASE_URL}/onboarding/step2`,
      data,
      { headers: this.getHeaders() }
    );
    return response.data;
  }

  async submitStep3(data: Step3Data) {
    const response = await axios.post(
      `${API_BASE_URL}/onboarding/step3`,
      data,
      { headers: this.getHeaders() }
    );
    return response.data;
  }

  async complete(data: CompleteData) {
    const response = await axios.post(
      `${API_BASE_URL}/onboarding/complete`,
      data,
      { headers: this.getHeaders() }
    );

    // Store auth tokens
    if (response.data.authToken) {
      localStorage.setItem('authToken', response.data.authToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      sessionStorage.removeItem('onboardingToken');
    }

    return response.data;
  }

  async getStatus() {
    const response = await axios.get(
      `${API_BASE_URL}/onboarding/status`,
      { headers: this.getHeaders() }
    );
    return response.data;
  }
}

export default new OnboardingService();
```

---

## Testing

### Unit Tests (Jest)

```javascript
// __tests__/onboarding.test.js
const request = require('supertest');
const app = require('../app');
const mongoose = require('mongoose');

describe('Patient Onboarding API', () => {
  let sessionToken;

  beforeAll(async () => {
    await mongoose.connect(process.env.TEST_DB_URL);
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Initialize session
    const response = await request(app)
      .post('/api/onboarding/init')
      .send({});

    sessionToken = response.body.sessionToken;
  });

  describe('POST /api/onboarding/step1', () => {
    it('should save personal information', async () => {
      const response = await request(app)
        .post('/api/onboarding/step1')
        .set('Authorization', `Bearer ${sessionToken}`)
        .send({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@test.com',
          phone: '+1234567890',
          dateOfBirth: '1990-01-01',
          gender: 'male'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.nextStep).toBe(2);
    });

    it('should reject duplicate email', async () => {
      // Create existing user first
      await Patient.create({
        userId: 'USR-123',
        healthCardId: 'AH-123',
        email: 'existing@test.com',
        passwordHash: 'hash',
        profile: { firstName: 'Existing', lastName: 'User' }
      });

      const response = await request(app)
        .post('/api/onboarding/step1')
        .set('Authorization', `Bearer ${sessionToken}`)
        .send({
          firstName: 'John',
          lastName: 'Doe',
          email: 'existing@test.com',
          phone: '+1234567890',
          dateOfBirth: '1990-01-01',
          gender: 'male'
        });

      expect(response.status).toBe(409);
      expect(response.body.error.code).toBe('DUPLICATE_EMAIL');
    });

    it('should reject users under 18', async () => {
      const today = new Date();
      const recentDate = new Date(today.getFullYear() - 17, today.getMonth(), today.getDate());

      const response = await request(app)
        .post('/api/onboarding/step1')
        .set('Authorization', `Bearer ${sessionToken}`)
        .send({
          firstName: 'Young',
          lastName: 'User',
          email: 'young@test.com',
          phone: '+1234567890',
          dateOfBirth: recentDate.toISOString(),
          gender: 'male'
        });

      expect(response.status).toBe(400);
      expect(response.body.error.message).toContain('18 years');
    });
  });

  describe('POST /api/onboarding/complete', () => {
    beforeEach(async () => {
      // Complete steps 1-3 first
      await request(app)
        .post('/api/onboarding/step1')
        .set('Authorization', `Bearer ${sessionToken}`)
        .send(validStep1Data);

      await request(app)
        .post('/api/onboarding/step2')
        .set('Authorization', `Bearer ${sessionToken}`)
        .send(validStep2Data);

      await request(app)
        .post('/api/onboarding/step3')
        .set('Authorization', `Bearer ${sessionToken}`)
        .send(validStep3Data);
    });

    it('should complete onboarding and return auth tokens', async () => {
      const response = await request(app)
        .post('/api/onboarding/complete')
        .set('Authorization', `Bearer ${sessionToken}`)
        .send({
          password: 'SecureP@ssw0rd123',
          confirmPassword: 'SecureP@ssw0rd123',
          termsAccepted: true,
          privacyPolicyAccepted: true
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.authToken).toBeDefined();
      expect(response.body.user.healthCardId).toBeDefined();
      expect(response.body.user.qrCode).toBeDefined();
    });

    it('should reject weak passwords', async () => {
      const response = await request(app)
        .post('/api/onboarding/complete')
        .set('Authorization', `Bearer ${sessionToken}`)
        .send({
          password: 'weak',
          confirmPassword: 'weak',
          termsAccepted: true,
          privacyPolicyAccepted: true
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });
});
```

---

## Environment Variables

```env
# .env
NODE_ENV=development
PORT=4000

# Database
MONGODB_URI=mongodb://localhost:27017/anola_health
MONGODB_TEST_URI=mongodb://localhost:27017/anola_health_test

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production

# Session
SESSION_TIMEOUT_MINUTES=30

# Email Service (SendGrid/AWS SES)
EMAIL_SERVICE=sendgrid
SENDGRID_API_KEY=your-sendgrid-api-key
FROM_EMAIL=noreply@anola.health

# Payment Processing (Stripe)
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-publishable-key

# File Upload (AWS S3)
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_S3_BUCKET=anola-health-uploads
AWS_REGION=us-east-1

# CDN
CDN_BASE_URL=https://cdn.anola.health

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=5

# CORS
CORS_ORIGIN=http://localhost:3000
```

---

## Deployment Checklist

- [ ] Set up production MongoDB database with replica set
- [ ] Configure production environment variables
- [ ] Set up SSL/TLS certificates
- [ ] Configure CDN for static assets (QR codes, profile pictures)
- [ ] Set up email service (SendGrid/AWS SES)
- [ ] Configure payment gateway (Stripe/PayPal)
- [ ] Set up logging and monitoring (Winston/Sentry)
- [ ] Configure backup strategy
- [ ] Set up rate limiting and DDoS protection
- [ ] Enable CORS for production domain
- [ ] Set up health check endpoints
- [ ] Configure auto-scaling
- [ ] Set up CI/CD pipeline
- [ ] Perform security audit
- [ ] Load testing
- [ ] Documentation for support team

---

## Support & Maintenance

### Health Check Endpoint

```javascript
router.get('/health', async (req, res) => {
  try {
    // Check database connection
    const dbStatus = mongoose.connection.readyState === 1 ? 'healthy' : 'unhealthy';

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        database: dbStatus,
        email: 'healthy',
        payment: 'healthy'
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});
```

---

## Additional Resources

- [Stripe Payment Integration](https://stripe.com/docs/api)
- [MongoDB Best Practices](https://docs.mongodb.com/manual/administration/production-notes/)
- [JWT Authentication](https://jwt.io/introduction)
- [QR Code Generation](https://www.npmjs.com/package/qrcode)
- [Express.js Security](https://expressjs.com/en/advanced/best-practice-security.html)

---

**Last Updated:** January 2024
**Version:** 1.0.0
**Contact:** dev@anola.health

