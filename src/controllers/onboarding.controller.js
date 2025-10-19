const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const QRCode = require('qrcode');
const OnboardingSession = require('../models/onboardingSession.model');
const User = require('../models/user.model');
const Wallet = require('../models/wallet.model');
const config = require('../config/config');

const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500
};

/**
 * Initialize onboarding session
 */
exports.initializeOnboarding = async (req, res) => {
  try {
    const { referralCode } = req.body;

    // Generate session token
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    // Create onboarding session
    const session = await OnboardingSession.create({
      token: sessionToken,
      expiresAt,
      step: 0,
      data: {},
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
      referralCode: referralCode || null
    });

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      sessionToken,
      expiresAt,
      message: 'Onboarding session initialized'
    });
  } catch (error) {
    console.error('Initialize onboarding error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to initialize onboarding',
      error: error.message
    });
  }
};

/**
 * Submit Step 1 - Personal Information
 */
exports.submitStep1 = async (req, res) => {
  try {
    const sessionToken = req.headers.authorization?.replace('Bearer ', '');

    if (!sessionToken) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'Session token required'
      });
    }

    const session = await OnboardingSession.findOne({
      token: sessionToken,
      expiresAt: { $gt: new Date() }
    });

    if (!session) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'Invalid or expired session'
      });
    }

    const {
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      gender,
      address
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !phone || !dateOfBirth || !gender) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(HTTP_STATUS.CONFLICT).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Validate age (must be 18+)
    const dob = new Date(dateOfBirth);
    const age = Math.floor((new Date() - dob) / (365.25 * 24 * 60 * 60 * 1000));
    if (age < 18) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Must be 18 years or older'
      });
    }

    // Validate gender
    if (!['male', 'female', 'other', 'prefer_not_to_say'].includes(gender)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Invalid gender value'
      });
    }

    // Generate temporary user ID
    const temporaryUserId = `temp_${crypto.randomBytes(8).toString('hex')}`;

    // Update session
    session.step = 1;
    session.temporaryUserId = temporaryUserId;
    session.data.step1 = {
      firstName,
      lastName,
      email: email.toLowerCase(),
      phone,
      dateOfBirth: dob,
      gender,
      address
    };
    session.completedSteps.push(1);
    await session.save();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Personal information saved',
      nextStep: 2,
      temporaryUserId
    });
  } catch (error) {
    console.error('Submit step 1 error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to save personal information',
      error: error.message
    });
  }
};

/**
 * Submit Step 2 - Medical Information
 */
exports.submitStep2 = async (req, res) => {
  try {
    const sessionToken = req.headers.authorization?.replace('Bearer ', '');

    if (!sessionToken) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'Session token required'
      });
    }

    const session = await OnboardingSession.findOne({
      token: sessionToken,
      expiresAt: { $gt: new Date() }
    });

    if (!session) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'Invalid or expired session'
      });
    }

    if (session.step < 1) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Complete step 1 first'
      });
    }

    const {
      medicalConditions = [],
      allergies = [],
      currentMedications = [],
      emergencyContact,
      bloodType,
      height,
      weight
    } = req.body;

    // Validate blood type if provided
    const validBloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    if (bloodType && !validBloodTypes.includes(bloodType)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Invalid blood type'
      });
    }

    // Validate emergency contact
    if (emergencyContact && !emergencyContact.phone) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Emergency contact phone is required'
      });
    }

    // Generate medical record ID
    const medicalRecordId = `MR-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;

    // Update session
    session.step = 2;
    session.data.step2 = {
      medicalConditions,
      allergies,
      currentMedications,
      emergencyContact,
      bloodType,
      height,
      weight
    };
    if (!session.completedSteps.includes(2)) {
      session.completedSteps.push(2);
    }
    await session.save();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Medical information saved',
      nextStep: 3,
      medicalRecordId
    });
  } catch (error) {
    console.error('Submit step 2 error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to save medical information',
      error: error.message
    });
  }
};

/**
 * Submit Step 3 - Wallet Setup
 */
exports.submitStep3 = async (req, res) => {
  try {
    const sessionToken = req.headers.authorization?.replace('Bearer ', '');

    if (!sessionToken) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'Session token required'
      });
    }

    const session = await OnboardingSession.findOne({
      token: sessionToken,
      expiresAt: { $gt: new Date() }
    });

    if (!session) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'Invalid or expired session'
      });
    }

    if (session.step < 2) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Complete step 2 first'
      });
    }

    const {
      activateWallet = false,
      initialDeposit,
      insurance
    } = req.body;

    // Validate initial deposit if provided
    if (initialDeposit && initialDeposit.amount < 10) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Minimum initial deposit is $10.00'
      });
    }

    // Validate insurance if provided
    if (insurance && insurance.hasInsurance && !insurance.policyNumber) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Policy number required when insurance is selected'
      });
    }

    // Update session
    session.step = 3;
    session.data.step3 = {
      activateWallet,
      initialDeposit,
      insurance
    };
    if (!session.completedSteps.includes(3)) {
      session.completedSteps.push(3);
    }
    await session.save();

    // Prepare wallet response
    const walletResponse = activateWallet ? {
      walletId: `WLT-${crypto.randomBytes(6).toString('hex').toUpperCase()}`,
      balance: initialDeposit?.amount || 0,
      currency: initialDeposit?.currency || 'USD',
      status: 'pending' // Will be activated on completion
    } : null;

    // Prepare insurance response
    const insuranceResponse = insurance && insurance.hasInsurance ? {
      insuranceId: `INS-${crypto.randomBytes(6).toString('hex').toUpperCase()}`,
      status: 'pending_verification',
      verificationRequired: true
    } : null;

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Wallet configured successfully',
      nextStep: 4,
      wallet: walletResponse,
      insurance: insuranceResponse
    });
  } catch (error) {
    console.error('Submit step 3 error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to configure wallet',
      error: error.message
    });
  }
};

/**
 * Complete Onboarding - Create User Account & Health Card
 */
exports.completeOnboarding = async (req, res) => {
  try {
    const sessionToken = req.headers.authorization?.replace('Bearer ', '');

    if (!sessionToken) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'Session token required'
      });
    }

    const session = await OnboardingSession.findOne({
      token: sessionToken,
      expiresAt: { $gt: new Date() }
    });

    if (!session) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'Invalid or expired session'
      });
    }

    if (session.step < 3) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Complete previous steps first'
      });
    }

    const {
      password,
      confirmPassword,
      termsAccepted,
      privacyPolicyAccepted,
      consentToDataSharing = false,
      preferredLanguage = 'en',
      notificationPreferences
    } = req.body;

    // Validate required fields
    if (!password || !confirmPassword) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Password and confirmation required'
      });
    }

    if (password !== confirmPassword) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Passwords do not match'
      });
    }

    // Validate password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character'
      });
    }

    if (!termsAccepted || !privacyPolicyAccepted) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Must accept terms and privacy policy'
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Generate health card ID
    const healthCardId = `AH-${crypto.randomBytes(4).toString('hex').toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    // Create user account
    const step1 = session.data.step1;
    const step2 = session.data.step2;
    const step3 = session.data.step3;

    const user = await User.create({
      email: step1.email,
      password: passwordHash,
      userType: 'patient',
      healthCardId,
      profile: {
        firstName: step1.firstName,
        lastName: step1.lastName,
        dateOfBirth: step1.dateOfBirth,
        gender: step1.gender,
        avatar: session.data.profilePictureUrl || null,
        address: step1.address,
        nationalId: `P-${crypto.randomBytes(6).toString('hex').toUpperCase()}` // Generate placeholder
      },
      phone: step1.phone,
      medicalHistory: {
        bloodType: step2.bloodType,
        allergies: step2.allergies || [],
        chronicConditions: step2.medicalConditions || [],
        currentMedications: step2.currentMedications || []
      },
      emergencyContact: step2.emergencyContact,
      preferences: {
        language: preferredLanguage,
        currency: step3.initialDeposit?.currency || 'USD',
        notifications: notificationPreferences || {
          appointments: true,
          payments: true,
          medicalRecords: true,
          promotions: false,
          email: true,
          push: true,
          sms: true
        }
      },
      consentToDataSharing,
      termsAcceptedAt: new Date(),
      privacyPolicyAcceptedAt: new Date(),
      status: 'active'
    });

    // Create wallet if requested
    if (step3.activateWallet) {
      // Generate wallet ID
      const timestamp = Date.now().toString(36).toUpperCase();
      const random = Math.random().toString(36).substring(2, 8).toUpperCase();
      const walletId = `PW-${timestamp}-${random}`;

      const wallet = await Wallet.create({
        walletId,
        owner: user._id,
        type: 'personal',
        balance: {
          available: step3.initialDeposit?.amount || 0,
          pending: 0,
          reserved: 0,
          currency: step3.initialDeposit?.currency || 'USD'
        },
        status: 'active',
        statistics: {
          totalReceived: step3.initialDeposit?.amount || 0,
          totalSpent: 0,
          totalWithdrawn: 0,
          transactionCount: step3.initialDeposit ? 1 : 0,
          lastTransactionDate: step3.initialDeposit ? new Date() : null
        }
      });

      // Note: If actual transaction record is needed, create it separately
      // and add its ID to wallet.transactions array
    }

    // Generate QR code for health card
    const qrCodeData = `ANOLA-HEALTH-${healthCardId}`;
    const qrCodeBase64 = await QRCode.toDataURL(qrCodeData);

    // Generate auth tokens
    const accessToken = jwt.sign(
      { userId: user._id, role: user.userType },
      config.jwtSecret,
      { expiresIn: config.jwtExpire }
    );

    const refreshToken = jwt.sign(
      { userId: user._id },
      config.refreshSecret,
      { expiresIn: config.refreshExpire }
    );

    // Mark session as complete and delete
    await OnboardingSession.deleteOne({ _id: session._id });

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Onboarding completed successfully',
      user: {
        userId: user._id,
        healthCardId: user.healthCardId,
        qrCode: qrCodeBase64,
        qrCodeUrl: `https://anola-backend.vercel.app/health-card/${healthCardId}.png`,
        status: user.status,
        createdAt: user.createdAt
      },
      accessToken,
      refreshToken,
      redirectUrl: '/dashboard/patient'
    });
  } catch (error) {
    console.error('Complete onboarding error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to complete onboarding',
      error: error.message
    });
  }
};

/**
 * Get onboarding session status
 */
exports.getOnboardingStatus = async (req, res) => {
  try {
    const sessionToken = req.headers.authorization?.replace('Bearer ', '');

    if (!sessionToken) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'Session token required'
      });
    }

    const session = await OnboardingSession.findOne({
      token: sessionToken,
      expiresAt: { $gt: new Date() }
    });

    if (!session) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'Invalid or expired session'
      });
    }

    // Return safe data (no sensitive info)
    const safeData = {
      step1: session.data.step1 ? {
        firstName: session.data.step1.firstName,
        lastName: session.data.step1.lastName,
        email: session.data.step1.email,
        phone: session.data.step1.phone,
        dateOfBirth: session.data.step1.dateOfBirth,
        gender: session.data.step1.gender,
        address: session.data.step1.address
      } : null,
      step2: session.data.step2 ? {
        hasmedicalConditions: (session.data.step2.medicalConditions || []).length > 0,
        hasAllergies: (session.data.step2.allergies || []).length > 0,
        hasMedications: (session.data.step2.currentMedications || []).length > 0,
        hasEmergencyContact: !!session.data.step2.emergencyContact
      } : null,
      step3: session.data.step3 ? {
        activateWallet: session.data.step3.activateWallet,
        hasInsurance: session.data.step3.insurance?.hasInsurance || false
      } : null
    };

    res.status(HTTP_STATUS.OK).json({
      success: true,
      currentStep: session.step,
      completedSteps: session.completedSteps,
      expiresAt: session.expiresAt,
      data: safeData
    });
  } catch (error) {
    console.error('Get onboarding status error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to get onboarding status',
      error: error.message
    });
  }
};

/**
 * Upload profile picture
 */
exports.uploadProfilePicture = async (req, res) => {
  try {
    const sessionToken = req.headers.authorization?.replace('Bearer ', '');

    if (!sessionToken) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'Session token required'
      });
    }

    const session = await OnboardingSession.findOne({
      token: sessionToken,
      expiresAt: { $gt: new Date() }
    });

    if (!session) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'Invalid or expired session'
      });
    }

    if (!req.file) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // TODO: Upload to cloud storage (S3, Cloudinary, etc.)
    // For now, return placeholder URL
    const profilePictureUrl = `https://anola-backend.vercel.app/uploads/profiles/${session.temporaryUserId}_${Date.now()}.jpg`;
    const thumbnailUrl = `https://anola-backend.vercel.app/uploads/profiles/${session.temporaryUserId}_${Date.now()}_thumb.jpg`;

    // Update session
    session.data.profilePictureUrl = profilePictureUrl;
    await session.save();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      profilePictureUrl,
      thumbnailUrl,
      message: 'Profile picture uploaded successfully'
    });
  } catch (error) {
    console.error('Upload profile picture error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to upload profile picture',
      error: error.message
    });
  }
};
