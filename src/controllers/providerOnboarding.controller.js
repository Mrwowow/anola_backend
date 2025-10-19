const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const ProviderOnboardingSession = require('../models/providerOnboardingSession.model');
const User = require('../models/user.model');
const config = require('../config/config');

const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500
};

/**
 * Initialize provider onboarding session
 */
exports.initializeOnboarding = async (req, res) => {
  try {
    const { referralCode } = req.body;

    // Generate unique session token
    const sessionToken = crypto.randomBytes(32).toString('hex');

    // Set expiration to 30 minutes
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    // Create onboarding session
    const session = await ProviderOnboardingSession.create({
      token: sessionToken,
      expiresAt,
      step: 0,
      data: {},
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      referralCode: referralCode || null
    });

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      sessionToken,
      sessionId: session._id,
      expiresAt
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
 * Submit Basic Information (Step 1)
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

    // Find active session
    const session = await ProviderOnboardingSession.findOne({
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
      providerType,
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      gender,
      address
    } = req.body;

    // Validate required fields
    if (!providerType || !firstName || !lastName || !email || !phone || !dateOfBirth || !gender) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Validate provider type
    const validProviderTypes = ['doctor', 'nurse', 'therapist', 'specialist', 'other'];
    if (!validProviderTypes.includes(providerType)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Invalid provider type'
      });
    }

    // Validate phone number format (international format)
    const phoneRegex = /^[+]?[0-9]{1,4}?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Please enter a valid phone number (e.g., +1234567890, +2348100853150, or 123-456-7890)'
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

    // Check if phone already exists
    const existingPhone = await User.findOne({ phone });
    if (existingPhone) {
      return res.status(HTTP_STATUS.CONFLICT).json({
        success: false,
        message: 'Phone number already registered'
      });
    }

    // Validate age (must be 21+ for providers)
    const dob = new Date(dateOfBirth);
    const age = Math.floor((new Date() - dob) / (365.25 * 24 * 60 * 60 * 1000));
    if (age < 21) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Providers must be 21 years or older'
      });
    }

    // Generate temporary provider ID
    const temporaryProviderId = `temp_provider_${crypto.randomBytes(8).toString('hex')}`;

    // Update session
    session.step = 1;
    session.temporaryProviderId = temporaryProviderId;
    session.data.step1 = {
      providerType,
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      gender,
      address
    };
    session.completedSteps.push(1);
    await session.save();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Basic information saved',
      temporaryProviderId
    });

  } catch (error) {
    console.error('Submit step 1 error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to save basic information',
      error: error.message
    });
  }
};

/**
 * Submit Professional Information (Step 2)
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

    const session = await ProviderOnboardingSession.findOne({
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
      specialization,
      subSpecialties,
      licenseNumber,
      licenseState,
      licenseExpiry,
      yearsOfExperience,
      npiNumber,
      deaNumber,
      education,
      certifications
    } = req.body;

    // Validate required fields
    if (!specialization || !licenseNumber || !yearsOfExperience) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Missing required professional information'
      });
    }

    // Update session
    session.step = 2;
    session.data.step2 = {
      specialization,
      subSpecialties: subSpecialties || [],
      licenseNumber,
      licenseState,
      licenseExpiry,
      yearsOfExperience,
      npiNumber,
      deaNumber,
      education: education || [],
      certifications: certifications || []
    };
    session.completedSteps.push(2);
    await session.save();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Professional information saved'
    });

  } catch (error) {
    console.error('Submit step 2 error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to save professional information',
      error: error.message
    });
  }
};

/**
 * Submit Practice Information (Step 3)
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

    const session = await ProviderOnboardingSession.findOne({
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
        message: 'Complete previous steps first'
      });
    }

    const {
      practiceType,
      practiceName,
      practiceAddress,
      practicePhone,
      practiceEmail,
      acceptsInsurance,
      insuranceProviders,
      languages,
      consultationModes,
      servicesOffered
    } = req.body;

    // Validate required fields
    if (!practiceType || !practiceName || !consultationModes || consultationModes.length === 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Missing required practice information'
      });
    }

    // Validate practice type
    const validPracticeTypes = ['hospital', 'clinic', 'private', 'telehealth', 'other'];
    if (!validPracticeTypes.includes(practiceType)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Invalid practice type'
      });
    }

    // Update session
    session.step = 3;
    session.data.step3 = {
      practiceType,
      practiceName,
      practiceAddress,
      practicePhone,
      practiceEmail,
      acceptsInsurance: acceptsInsurance !== undefined ? acceptsInsurance : true,
      insuranceProviders: insuranceProviders || [],
      languages: languages || ['English'],
      consultationModes,
      servicesOffered: servicesOffered || []
    };
    session.completedSteps.push(3);
    await session.save();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Practice information saved'
    });

  } catch (error) {
    console.error('Submit step 3 error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to save practice information',
      error: error.message
    });
  }
};

/**
 * Complete provider registration (Step 4)
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

    const session = await ProviderOnboardingSession.findOne({
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
        message: 'Complete all previous steps first'
      });
    }

    const {
      username,
      password,
      confirmPassword,
      termsAccepted,
      privacyPolicyAccepted,
      hipaaComplianceAccepted,
      profilePhoto
    } = req.body;

    // Validate passwords
    if (!password || !confirmPassword) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Password required'
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

    if (!termsAccepted || !privacyPolicyAccepted || !hipaaComplianceAccepted) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Must accept terms, privacy policy, and HIPAA compliance'
      });
    }

    // Get session data
    const step1 = session.data.step1;
    const step2 = session.data.step2;
    const step3 = session.data.step3;

    // Generate provider code
    const providerCode = `PROV-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    // Create provider user account
    const provider = await User.create({
      email: step1.email,
      phone: step1.phone,
      password: password,  // Will be hashed by pre-save hook
      userType: 'provider',
      username: username || step1.email.split('@')[0],

      // Provider-specific fields
      providerCode,
      providerType: step1.providerType,

      profile: {
        firstName: step1.firstName,
        lastName: step1.lastName,
        dateOfBirth: step1.dateOfBirth,
        gender: step1.gender,
        avatar: profilePhoto || null,
        address: step1.address,
        nationalId: `PROV-${crypto.randomBytes(6).toString('hex').toUpperCase()}`  // Placeholder
      },

      // Professional Information
      professionalInfo: {
        specialization: step2.specialization,
        subSpecialties: step2.subSpecialties,
        licenseNumber: step2.licenseNumber,
        licenseState: step2.licenseState,
        licenseExpiry: step2.licenseExpiry,
        yearsOfExperience: step2.yearsOfExperience,
        npiNumber: step2.npiNumber,
        deaNumber: step2.deaNumber,
        education: step2.education,
        certifications: step2.certifications
      },

      // Practice Information
      practiceInfo: {
        practiceType: step3.practiceType,
        practiceName: step3.practiceName,
        practiceAddress: step3.practiceAddress,
        practicePhone: step3.practicePhone,
        practiceEmail: step3.practiceEmail,
        acceptsInsurance: step3.acceptsInsurance,
        insuranceProviders: step3.insuranceProviders,
        languages: step3.languages,
        consultationModes: step3.consultationModes
      },

      // Services
      services: step3.servicesOffered.map(service => ({
        serviceId: `SRV-${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
        name: service.serviceName,
        duration: service.duration,
        price: service.price,
        description: service.description,
        isActive: true,
        totalBookings: 0,
        createdAt: new Date()
      })),

      // Compliance
      termsAcceptedAt: new Date(),
      privacyPolicyAcceptedAt: new Date(),
      hipaaComplianceAcceptedAt: new Date(),

      status: 'pending' // Pending admin verification
    });

    // Generate auth tokens
    const accessToken = jwt.sign(
      { userId: provider._id, role: provider.userType },
      config.jwtSecret,
      { expiresIn: config.jwtExpire }
    );

    const refreshToken = jwt.sign(
      { userId: provider._id },
      config.refreshSecret,
      { expiresIn: config.refreshExpire }
    );

    // Delete onboarding session
    await ProviderOnboardingSession.deleteOne({ _id: session._id });

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Provider registration completed successfully',
      provider: {
        providerId: provider._id,
        providerCode: provider.providerCode,
        email: provider.email,
        status: provider.status,
        createdAt: provider.createdAt
      },
      accessToken,
      refreshToken,
      redirectUrl: '/dashboard/provider'
    });

  } catch (error) {
    console.error('Complete onboarding error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to complete registration',
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

    const session = await ProviderOnboardingSession.findOne({
      token: sessionToken,
      expiresAt: { $gt: new Date() }
    });

    if (!session) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Session not found or expired'
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      session: {
        currentStep: session.step,
        completedSteps: session.completedSteps,
        temporaryProviderId: session.temporaryProviderId,
        expiresAt: session.expiresAt,
        data: {
          step1: session.data.step1 || null,
          step2: session.data.step2 || null,
          step3: session.data.step3 || null
        }
      }
    });

  } catch (error) {
    console.error('Get status error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to get session status',
      error: error.message
    });
  }
};

/**
 * Upload profile photo
 */
exports.uploadProfilePhoto = async (req, res) => {
  try {
    const sessionToken = req.headers.authorization?.replace('Bearer ', '');

    if (!sessionToken) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'Session token required'
      });
    }

    const session = await ProviderOnboardingSession.findOne({
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

    // In production, upload to cloud storage (Cloudinary/S3)
    // For now, use placeholder URL
    const photoUrl = `https://cdn.anola.com/providers/${session.temporaryProviderId}/avatar.jpg`;

    session.data.profilePhotoUrl = photoUrl;
    await session.save();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Profile photo uploaded successfully',
      photoUrl
    });

  } catch (error) {
    console.error('Upload photo error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to upload photo',
      error: error.message
    });
  }
};
