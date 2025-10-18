const User = require('../models/user.model');
const Appointment = require('../models/appointment.model');
const Transaction = require('../models/transaction.model');
const Wallet = require('../models/wallet.model');
const Provider = require('../models/provider.model');
const MedicalRecord = require('../models/medicalRecord.model');

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
