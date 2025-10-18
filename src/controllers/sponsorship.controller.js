const Sponsorship = require('../models/sponsorship.model');
const Wallet = require('../models/wallet.model');
const User = require('../models/user.model');
const crypto = require('crypto');

// Create sponsorship
exports.create = async (req, res) => {
  try {
    const { beneficiaryId, amount, duration, conditions, description } = req.body;
    const sponsorId = req.user._id;

    // Only sponsors can create sponsorships
    if (req.user.userType !== 'sponsor') {
      return res.status(403).json({
        success: false,
        message: 'Only sponsors can create sponsorships'
      });
    }

    if (!beneficiaryId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Beneficiary and amount are required'
      });
    }

    // Check if beneficiary exists
    const beneficiary = await User.findById(beneficiaryId);
    if (!beneficiary) {
      return res.status(404).json({
        success: false,
        message: 'Beneficiary not found'
      });
    }

    const sponsorship = await Sponsorship.create({
      sponsor: sponsorId,
      beneficiary: beneficiaryId,
      amount: {
        total: parseFloat(amount),
        used: 0,
        remaining: parseFloat(amount),
        currency: 'USD'
      },
      duration: duration || {
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year default
      },
      conditions: conditions || {},
      description,
      status: 'active'
    });

    // Create or update sponsored wallet for beneficiary
    let sponsoredWallet = await Wallet.findOne({
      owner: beneficiaryId,
      type: 'sponsored'
    });

    if (!sponsoredWallet) {
      sponsoredWallet = await Wallet.create({
        walletId: `WALLET-${crypto.randomBytes(8).toString('hex').toUpperCase()}`,
        owner: beneficiaryId,
        type: 'sponsored',
        balance: {
          available: parseFloat(amount),
          pending: 0,
          reserved: 0,
          currency: 'USD'
        },
        sponsorship: {
          sponsor: sponsorId,
          allocatedAmount: parseFloat(amount),
          usedAmount: 0
        }
      });
    } else {
      sponsoredWallet.balance.available += parseFloat(amount);
      if (!sponsoredWallet.sponsorship) {
        sponsoredWallet.sponsorship = {
          sponsor: sponsorId,
          allocatedAmount: parseFloat(amount),
          usedAmount: 0
        };
      } else {
        sponsoredWallet.sponsorship.allocatedAmount += parseFloat(amount);
      }
      await sponsoredWallet.save();
    }

    res.status(201).json({
      success: true,
      data: sponsorship,
      message: 'Sponsorship created successfully'
    });
  } catch (error) {
    console.error('Create sponsorship error:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to create sponsorship',
      error: error.message
    });
  }
};

// Get sponsorships
exports.getAll = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const userId = req.user._id;

    let query = {};

    // Sponsors see sponsorships they created
    if (req.user.userType === 'sponsor') {
      query.sponsor = userId;
    }
    // Patients see sponsorships they received
    else if (req.user.userType === 'patient') {
      query.beneficiary = userId;
    }

    if (status) query.status = status;

    const skip = (page - 1) * limit;

    const sponsorships = await Sponsorship.find(query)
      .populate('sponsor', 'profile.firstName profile.lastName email organizationInfo')
      .populate('beneficiary', 'profile.firstName profile.lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Sponsorship.countDocuments(query);

    res.status(200).json({
      success: true,
      data: sponsorships,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get sponsorships error:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to get sponsorships',
      error: error.message
    });
  }
};

// Get sponsorship by ID
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const sponsorship = await Sponsorship.findById(id)
      .populate('sponsor', 'profile.firstName profile.lastName email organizationInfo')
      .populate('beneficiary', 'profile.firstName profile.lastName email');

    if (!sponsorship) {
      return res.status(404).json({
        success: false,
        message: 'Sponsorship not found'
      });
    }

    // Check access permissions
    const isSponsor = sponsorship.sponsor._id.toString() === userId.toString();
    const isBeneficiary = sponsorship.beneficiary._id.toString() === userId.toString();

    if (!isSponsor && !isBeneficiary) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.status(200).json({
      success: true,
      data: sponsorship
    });
  } catch (error) {
    console.error('Get sponsorship error:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to get sponsorship',
      error: error.message
    });
  }
};
