const crypto = require('crypto');
const QRCode = require('qrcode');
const User = require('../models/user.model');
const Appointment = require('../models/appointment.model');
const Transaction = require('../models/transaction.model');
const Wallet = require('../models/wallet.model');
const MedicalRecord = require('../models/medicalRecord.model');

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

// Get patient dashboard
exports.getDashboard = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get upcoming appointments
    const upcomingAppointments = await Appointment.find({
      patient: userId,
      date: { $gte: new Date() },
      status: { $in: ['scheduled', 'confirmed'] }
    })
      .populate('provider', 'profile.firstName profile.lastName specialization')
      .sort({ date: 1 })
      .limit(5);

    // Get recent transactions
    const recentTransactions = await Transaction.find({
      user: userId
    })
      .sort({ createdAt: -1 })
      .limit(10);

    // Get wallet balances
    const personalWallet = await Wallet.findOne({
      user: userId,
      walletType: 'personal'
    });

    const sponsoredWallet = await Wallet.findOne({
      user: userId,
      walletType: 'sponsored'
    });

    const walletBalance = {
      personal: personalWallet ? personalWallet.balance : 0,
      sponsored: sponsoredWallet ? sponsoredWallet.balance : 0
    };

    res.status(200).json({
      success: true,
      data: {
        upcomingAppointments,
        recentTransactions,
        walletBalance,
        healthCardId: req.user.healthCardId || 'Not generated'
      }
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to get dashboard',
      error: error.message
    });
  }
};

// Get patient health card
exports.getHealthCard = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Generate health card ID if not exists
    if (!user.healthCardId) {
      user.generateHealthCardId();
      await user.save();
    }

    // In a real implementation, you would generate a QR code here
    // For now, we'll return basic info
    const healthCard = {
      cardId: user.healthCardId,
      qrCode: user.qrCode?.imageUrl || null,
      patientInfo: {
        name: user.fullName,
        dateOfBirth: user.profile.dateOfBirth,
        bloodType: user.medicalInfo?.bloodType || 'Not specified',
        allergies: user.medicalInfo?.allergies?.map(a => a.allergen) || []
      },
      emergencyContact: user.medicalInfo?.emergencyContact || null
    };

    res.status(200).json({
      success: true,
      data: healthCard
    });
  } catch (error) {
    console.error('Get health card error:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to get health card',
      error: error.message
    });
  }
};

// Get medical history
exports.getMedicalHistory = async (req, res) => {
  try {
    const { startDate, endDate, page = 1, limit = 20 } = req.query;
    const userId = req.user._id;

    const query = { patient: userId };

    // Add date filters if provided
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;

    const medicalRecords = await MedicalRecord.find(query)
      .populate('provider', 'profile.firstName profile.lastName specialization')
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await MedicalRecord.countDocuments(query);

    res.status(200).json({
      success: true,
      data: medicalRecords,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get medical history error:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to get medical history',
      error: error.message
    });
  }
};

// Find healthcare providers
exports.findProviders = async (req, res) => {
  try {
    const { specialty, location, available, page = 1, limit = 10 } = req.query;

    const query = { userType: 'provider' };

    // Add specialty filter
    if (specialty) {
      query['specialization.primary'] = new RegExp(specialty, 'i');
    }

    // Add location filter
    if (location) {
      query['$or'] = [
        { 'profile.address.city': new RegExp(location, 'i') },
        { 'profile.address.state': new RegExp(location, 'i') }
      ];
    }

    // Add availability filter
    if (available === 'true') {
      query['availability.isAvailable'] = true;
    }

    const skip = (page - 1) * limit;

    const providers = await Provider.find(query)
      .select('profile.firstName profile.lastName specialization profile.address rating availability')
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Provider.countDocuments(query);

    // Format response
    const formattedProviders = providers.map(provider => ({
      _id: provider._id,
      name: `${provider.profile?.firstName || ''} ${provider.profile?.lastName || ''}`.trim(),
      specialty: provider.specialization?.primary || 'General',
      location: `${provider.profile?.address?.city || ''}, ${provider.profile?.address?.state || ''}`.trim(),
      rating: provider.rating?.average || 0,
      availableSlots: provider.availability?.isAvailable ? 'Available' : 'Not available'
    }));

    res.status(200).json({
      success: true,
      data: formattedProviders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Find providers error:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to find providers',
      error: error.message
    });
  }
};

/**
 * Add a new patient (Provider, Vendor, or Sponsor)
 * This allows healthcare providers, vendors, and sponsors to register patients
 */
exports.addPatient = async (req, res) => {
  try {
    const {
      // Required fields
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      gender,

      // Optional fields
      middleName,
      address,
      bloodType,
      allergies,
      chronicConditions,
      currentMedications,
      emergencyContact,
      insuranceInfo,
      createWallet = false,
      initialDeposit = 0,
      sendCredentials = true
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !phone || !dateOfBirth || !gender) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Missing required fields: firstName, lastName, email, phone, dateOfBirth, gender'
      });
    }

    // Validate email format
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Validate phone format
    const phoneRegex = /^[+]?[0-9]{1,4}?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Invalid phone number format'
      });
    }

    // Validate gender
    const validGenders = ['male', 'female', 'other', 'prefer-not-to-say'];
    if (!validGenders.includes(gender)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Invalid gender. Must be one of: male, female, other, prefer-not-to-say'
      });
    }

    // Check if email already exists
    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
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

    // Generate temporary password
    const tempPassword = crypto.randomBytes(8).toString('hex');

    // Generate health card ID
    const healthCardId = `AH-${crypto.randomBytes(4).toString('hex').toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    // Generate national ID placeholder
    const nationalId = `P-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;

    // Prepare medical history
    const medicalHistory = {
      bloodType: bloodType || undefined,
      allergies: allergies || [],
      chronicConditions: chronicConditions || [],
      currentMedications: currentMedications || [],
      familyHistory: {
        otherConditions: []
      },
      surgeries: []
    };

    // Create user account
    const patient = await User.create({
      email: email.toLowerCase(),
      password: tempPassword,
      userType: 'patient',
      healthCardId,
      phone,
      profile: {
        firstName,
        lastName,
        middleName: middleName || undefined,
        dateOfBirth: new Date(dateOfBirth),
        gender,
        nationalId,
        address: address || {
          country: 'Nigeria'
        }
      },
      medicalHistory,
      emergencyContact: emergencyContact || undefined,
      insuranceInfo: insuranceInfo || undefined,
      status: 'active',
      termsAcceptedAt: new Date(),
      privacyPolicyAcceptedAt: new Date(),
      preferences: {
        language: 'en',
        currency: 'NGN',
        notifications: {
          appointments: true,
          payments: true,
          medicalRecords: true,
          promotions: false,
          email: true,
          push: true,
          sms: true
        }
      },
      metadata: {
        addedBy: req.user?.userType,
        addedById: req.user?._id,
        addedAt: new Date()
      }
    });

    // Generate QR code for health card
    const qrData = JSON.stringify({
      healthCardId,
      patientId: patient._id.toString(),
      name: `${firstName} ${lastName}`,
      email,
      phone
    });

    const qrCodeImage = await QRCode.toDataURL(qrData);

    patient.qrCode = {
      data: qrData,
      imageUrl: qrCodeImage
    };
    await patient.save();

    // Create wallet if requested
    let wallet = null;
    if (createWallet) {
      const timestamp = Date.now().toString(36).toUpperCase();
      const random = Math.random().toString(36).substring(2, 8).toUpperCase();
      const walletId = `PW-${timestamp}-${random}`;

      wallet = await Wallet.create({
        walletId,
        owner: patient._id,
        type: 'personal',
        balance: {
          available: initialDeposit || 0,
          pending: 0,
          reserved: 0,
          currency: 'NGN'
        },
        status: 'active',
        statistics: {
          totalReceived: initialDeposit || 0,
          totalSpent: 0,
          totalWithdrawn: 0,
          transactionCount: initialDeposit > 0 ? 1 : 0,
          lastTransactionDate: initialDeposit > 0 ? new Date() : null
        }
      });
    }

    // Prepare response
    const response = {
      success: true,
      message: 'Patient added successfully',
      patient: {
        id: patient._id,
        healthCardId: patient.healthCardId,
        email: patient.email,
        phone: patient.phone,
        fullName: `${patient.profile.firstName} ${patient.profile.lastName}`,
        dateOfBirth: patient.profile.dateOfBirth,
        gender: patient.profile.gender,
        qrCode: patient.qrCode?.imageUrl
      }
    };

    // Include wallet info if created
    if (wallet) {
      response.wallet = {
        walletId: wallet.walletId,
        balance: wallet.balance.available,
        currency: wallet.balance.currency
      };
    }

    // Include temporary password if credentials should be sent
    if (sendCredentials) {
      response.credentials = {
        email: patient.email,
        tempPassword: tempPassword,
        message: 'Please ask the patient to change this password on first login'
      };
    }

    res.status(HTTP_STATUS.CREATED).json(response);

  } catch (error) {
    console.error('Add patient error:', error);

    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(HTTP_STATUS.CONFLICT).json({
        success: false,
        message: `${field} already exists`
      });
    }

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to add patient',
      error: error.message
    });
  }
};

/**
 * Get all patients added by a provider/vendor/sponsor
 */
exports.getMyPatients = async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;

    const query = {
      userType: 'patient',
      'metadata.addedById': req.user._id
    };

    // Add search functionality
    if (search) {
      query.$or = [
        { 'profile.firstName': new RegExp(search, 'i') },
        { 'profile.lastName': new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
        { phone: new RegExp(search, 'i') },
        { healthCardId: new RegExp(search, 'i') }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const patients = await User.find(query)
      .select('healthCardId email phone profile status createdAt metadata')
      .limit(parseInt(limit))
      .skip(skip)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      patients: patients.map(p => ({
        id: p._id,
        healthCardId: p.healthCardId,
        fullName: `${p.profile.firstName} ${p.profile.lastName}`,
        email: p.email,
        phone: p.phone,
        gender: p.profile.gender,
        dateOfBirth: p.profile.dateOfBirth,
        status: p.status,
        addedAt: p.metadata?.addedAt || p.createdAt
      })),
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalPatients: total,
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get patients error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to get patients',
      error: error.message
    });
  }
};

/**
 * Get single patient details
 */
exports.getPatientById = async (req, res) => {
  try {
    const { patientId } = req.params;

    const patient = await User.findById(patientId)
      .select('-password -passwordResetToken -refreshTokens -twoFactorSecret');

    if (!patient || patient.userType !== 'patient') {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Patient not found'
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      patient
    });

  } catch (error) {
    console.error('Get patient error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to get patient',
      error: error.message
    });
  }
};
