const User = require('../models/user.model');
const SuperAdmin = require('../models/superAdmin.model');
const Patient = require('../models/patient.model');
const Provider = require('../models/provider.model');
const Sponsor = require('../models/sponsor.model');
const Vendor = require('../models/vendor.model');
const Appointment = require('../models/appointment.model');
const Transaction = require('../models/transaction.model');
const MedicalRecord = require('../models/medicalRecord.model');
const Sponsorship = require('../models/sponsorship.model');
const Wallet = require('../models/wallet.model');
const { HTTP_STATUS, ACCOUNT_STATUS, USER_TYPES } = require('../utils/constants');

// ==================== Dashboard & Analytics ====================

/**
 * @desc    Get platform analytics and statistics
 * @route   GET /api/v1/super-admin/dashboard
 * @access  Super Admin
 */
exports.getDashboard = async (req, res) => {
  try {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    // User statistics
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ status: ACCOUNT_STATUS.ACTIVE });
    const newUsersThisMonth = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    // User type breakdown
    const usersByType = await User.aggregate([
      { $group: { _id: '$userType', count: { $sum: 1 } } }
    ]);

    // Appointment statistics
    const totalAppointments = await Appointment.countDocuments();
    const appointmentsThisMonth = await Appointment.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });
    const appointmentsByStatus = await Appointment.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Transaction statistics
    const transactionStats = await Transaction.aggregate([
      {
        $group: {
          _id: null,
          totalTransactions: { $sum: 1 },
          totalVolume: { $sum: '$amount.value' },
          totalFees: { $sum: '$fees.total' }
        }
      }
    ]);

    const transactionsThisMonth = await Transaction.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    // Sponsorship statistics
    const totalSponsorships = await Sponsorship.countDocuments();
    const activeSponsorships = await Sponsorship.countDocuments({ status: 'active' });
    const sponsorshipStats = await Sponsorship.aggregate([
      {
        $group: {
          _id: null,
          totalAllocated: { $sum: '$amount.allocated' },
          totalUsed: { $sum: '$amount.used' },
          totalRemaining: { $sum: '$amount.remaining' }
        }
      }
    ]);

    // Wallet statistics
    const walletStats = await Wallet.aggregate([
      {
        $group: {
          _id: null,
          totalBalance: { $sum: '$balance.available' },
          totalPending: { $sum: '$balance.pending' },
          totalReserved: { $sum: '$balance.reserved' }
        }
      }
    ]);

    // Medical records count
    const totalMedicalRecords = await MedicalRecord.countDocuments();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          active: activeUsers,
          newThisMonth: newUsersThisMonth,
          byType: usersByType
        },
        appointments: {
          total: totalAppointments,
          thisMonth: appointmentsThisMonth,
          byStatus: appointmentsByStatus
        },
        transactions: {
          total: transactionStats[0]?.totalTransactions || 0,
          thisMonth: transactionsThisMonth,
          totalVolume: transactionStats[0]?.totalVolume || 0,
          totalFees: transactionStats[0]?.totalFees || 0
        },
        sponsorships: {
          total: totalSponsorships,
          active: activeSponsorships,
          totalAllocated: sponsorshipStats[0]?.totalAllocated || 0,
          totalUsed: sponsorshipStats[0]?.totalUsed || 0,
          totalRemaining: sponsorshipStats[0]?.totalRemaining || 0
        },
        wallets: {
          totalBalance: walletStats[0]?.totalBalance || 0,
          totalPending: walletStats[0]?.totalPending || 0,
          totalReserved: walletStats[0]?.totalReserved || 0
        },
        medicalRecords: {
          total: totalMedicalRecords
        }
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to fetch dashboard data',
      error: error.message
    });
  }
};

// ==================== User Management ====================

/**
 * @desc    Get all users with filters
 * @route   GET /api/v1/super-admin/users
 * @access  Super Admin
 */
exports.getAllUsers = async (req, res) => {
  try {
    const { userType, status, search, page = 1, limit = 50 } = req.query;

    const query = {};
    if (userType) query.userType = userType;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { 'profile.firstName': { $regex: search, $options: 'i' } },
        { 'profile.lastName': { $regex: search, $options: 'i' } },
        { healthCardId: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password -refreshTokens -twoFactorSecret')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await User.countDocuments(query);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: users,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message
    });
  }
};

/**
 * @desc    Get user by ID
 * @route   GET /api/v1/super-admin/users/:id
 * @access  Super Admin
 */
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -refreshTokens -twoFactorSecret');

    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to fetch user',
      error: error.message
    });
  }
};

/**
 * @desc    Update user status
 * @route   PATCH /api/v1/super-admin/users/:id/status
 * @access  Super Admin
 */
exports.updateUserStatus = async (req, res) => {
  try {
    const { status, reason } = req.body;

    if (!Object.values(ACCOUNT_STATUS).includes(status)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Invalid status value'
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'User not found'
      });
    }

    user.status = status;

    if (status === ACCOUNT_STATUS.SUSPENDED || status === ACCOUNT_STATUS.DELETED) {
      user.deactivatedAt = new Date();
      user.deactivationReason = reason;
    }

    await user.save();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: `User status updated to ${status}`,
      data: user
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to update user status',
      error: error.message
    });
  }
};

/**
 * @desc    Delete user permanently
 * @route   DELETE /api/v1/super-admin/users/:id
 * @access  Master Admin
 */
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'User permanently deleted'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to delete user',
      error: error.message
    });
  }
};

/**
 * @desc    Verify user identity
 * @route   POST /api/v1/super-admin/users/:id/verify
 * @access  Super Admin
 */
exports.verifyUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'User not found'
      });
    }

    user.verificationStatus.identity.verified = true;
    user.verificationStatus.identity.verifiedAt = new Date();
    user.status = ACCOUNT_STATUS.ACTIVE;

    await user.save();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'User verified successfully',
      data: user
    });
  } catch (error) {
    console.error('Verify user error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to verify user',
      error: error.message
    });
  }
};

// ==================== Provider Management ====================

/**
 * @desc    Get all providers
 * @route   GET /api/v1/super-admin/providers
 * @access  Super Admin
 */
exports.getAllProviders = async (req, res) => {
  try {
    const { verified, status, search, page = 1, limit = 50 } = req.query;

    const query = { userType: USER_TYPES.PROVIDER };
    if (verified !== undefined) query['verification.isVerified'] = verified === 'true';
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { 'practice.name': { $regex: search, $options: 'i' } },
        { 'professionalInfo.licenseNumber': { $regex: search, $options: 'i' } },
        { 'profile.firstName': { $regex: search, $options: 'i' } },
        { 'profile.lastName': { $regex: search, $options: 'i' } }
      ];
    }

    const providers = await Provider.find(query)
      .select('-password -refreshTokens')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await Provider.countDocuments(query);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: providers,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get providers error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to fetch providers',
      error: error.message
    });
  }
};

/**
 * @desc    Verify provider
 * @route   POST /api/v1/super-admin/providers/:id/verify
 * @access  Super Admin
 */
exports.verifyProvider = async (req, res) => {
  try {
    const provider = await Provider.findById(req.params.id);

    if (!provider) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Provider not found'
      });
    }

    provider.verification.isVerified = true;
    provider.verification.verifiedAt = new Date();
    provider.verification.verifiedBy = req.superAdmin._id;
    provider.status = ACCOUNT_STATUS.ACTIVE;

    await provider.save();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Provider verified successfully',
      data: provider
    });
  } catch (error) {
    console.error('Verify provider error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to verify provider',
      error: error.message
    });
  }
};

// ==================== Transaction Management ====================

/**
 * @desc    Get all transactions
 * @route   GET /api/v1/super-admin/transactions
 * @access  Super Admin
 */
exports.getAllTransactions = async (req, res) => {
  try {
    const { status, type, startDate, endDate, page = 1, limit = 50 } = req.query;

    const query = {};
    if (status) query.status = status;
    if (type) query.type = type;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const transactions = await Transaction.find(query)
      .populate('from.user', 'email profile.firstName profile.lastName')
      .populate('to.user', 'email profile.firstName profile.lastName')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await Transaction.countDocuments(query);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: transactions,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to fetch transactions',
      error: error.message
    });
  }
};

/**
 * @desc    Reverse a transaction
 * @route   POST /api/v1/super-admin/transactions/:id/reverse
 * @access  Super Admin
 */
exports.reverseTransaction = async (req, res) => {
  try {
    const { reason } = req.body;
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    await transaction.reverse(reason);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Transaction reversed successfully',
      data: transaction
    });
  } catch (error) {
    console.error('Reverse transaction error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || 'Failed to reverse transaction',
      error: error.message
    });
  }
};

// ==================== Sponsorship Management ====================

/**
 * @desc    Get all sponsorships
 * @route   GET /api/v1/super-admin/sponsorships
 * @access  Super Admin
 */
exports.getAllSponsorships = async (req, res) => {
  try {
    const { status, type, page = 1, limit = 50 } = req.query;

    const query = {};
    if (status) query.status = status;
    if (type) query.type = type;

    const sponsorships = await Sponsorship.find(query)
      .populate('sponsor', 'profile.firstName profile.lastName email')
      .populate('beneficiary', 'profile.firstName profile.lastName email healthCardId')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await Sponsorship.countDocuments(query);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: sponsorships,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get sponsorships error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to fetch sponsorships',
      error: error.message
    });
  }
};

// ==================== System Settings & Audit ====================

/**
 * @desc    Get audit logs
 * @route   GET /api/v1/super-admin/audit-logs
 * @access  Super Admin
 */
exports.getAuditLogs = async (req, res) => {
  try {
    const { adminId, action, startDate, endDate, page = 1, limit = 100 } = req.query;

    const query = { userType: USER_TYPES.SUPER_ADMIN };
    if (adminId) query._id = adminId;

    const admins = await SuperAdmin.find(query);

    let allLogs = [];
    admins.forEach(admin => {
      const logs = admin.actionsLog.map(log => ({
        ...log.toObject(),
        adminId: admin._id,
        adminName: admin.profile.firstName + ' ' + admin.profile.lastName,
        adminEmail: admin.email
      }));
      allLogs = allLogs.concat(logs);
    });

    // Filter logs
    if (action) {
      allLogs = allLogs.filter(log => log.action.includes(action));
    }
    if (startDate || endDate) {
      allLogs = allLogs.filter(log => {
        const logDate = new Date(log.timestamp);
        if (startDate && logDate < new Date(startDate)) return false;
        if (endDate && logDate > new Date(endDate)) return false;
        return true;
      });
    }

    // Sort by timestamp
    allLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Paginate
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedLogs = allLogs.slice(startIndex, endIndex);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: paginatedLogs,
      pagination: {
        total: allLogs.length,
        page: parseInt(page),
        pages: Math.ceil(allLogs.length / limit)
      }
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to fetch audit logs',
      error: error.message
    });
  }
};

/**
 * @desc    Get platform statistics
 * @route   GET /api/v1/super-admin/statistics
 * @access  Super Admin
 */
exports.getStatistics = async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;

    const dateQuery = {};
    if (startDate) dateQuery.$gte = new Date(startDate);
    if (endDate) dateQuery.$lte = new Date(endDate);

    // User registration trends
    const userTrends = await User.aggregate([
      ...(Object.keys(dateQuery).length ? [{ $match: { createdAt: dateQuery } }] : []),
      {
        $group: {
          _id: {
            $dateToString: {
              format: groupBy === 'month' ? '%Y-%m' : '%Y-%m-%d',
              date: '$createdAt'
            }
          },
          count: { $sum: 1 },
          byType: { $push: '$userType' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Revenue trends
    const revenueTrends = await Transaction.aggregate([
      { $match: { status: 'completed', ...(Object.keys(dateQuery).length ? { createdAt: dateQuery } : {}) } },
      {
        $group: {
          _id: {
            $dateToString: {
              format: groupBy === 'month' ? '%Y-%m' : '%Y-%m-%d',
              date: '$createdAt'
            }
          },
          totalVolume: { $sum: '$amount.value' },
          totalFees: { $sum: '$fees.total' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        userTrends,
        revenueTrends
      }
    });
  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
};

// ==================== Admin Management ====================

/**
 * @desc    Create new super admin
 * @route   POST /api/v1/super-admin/admins
 * @access  Master Admin
 */
exports.createSuperAdmin = async (req, res) => {
  try {
    const { email, password, profile, permissions, adminLevel, department, employeeId } = req.body;

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email });
    if (existingAdmin) {
      return res.status(HTTP_STATUS.CONFLICT).json({
        success: false,
        message: 'Admin with this email already exists'
      });
    }

    // Create super admin
    const superAdmin = await SuperAdmin.create({
      email,
      password,
      phone: req.body.phone,
      userType: USER_TYPES.SUPER_ADMIN,
      profile,
      adminLevel: adminLevel || 'super',
      permissions: permissions || {},
      department,
      employeeId,
      status: ACCOUNT_STATUS.ACTIVE,
      createdBy: req.superAdmin._id
    });

    // Remove sensitive data
    superAdmin.password = undefined;

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Super admin created successfully',
      data: superAdmin
    });
  } catch (error) {
    console.error('Create super admin error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to create super admin',
      error: error.message
    });
  }
};

/**
 * @desc    Get all super admins
 * @route   GET /api/v1/super-admin/admins
 * @access  Master Admin
 */
exports.getAllSuperAdmins = async (req, res) => {
  try {
    const superAdmins = await SuperAdmin.find()
      .select('-password -refreshTokens -twoFactorSecret')
      .sort({ createdAt: -1 });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: superAdmins
    });
  } catch (error) {
    console.error('Get super admins error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to fetch super admins',
      error: error.message
    });
  }
};

/**
 * @desc    Update super admin permissions
 * @route   PATCH /api/v1/super-admin/admins/:id/permissions
 * @access  Master Admin
 */
exports.updateAdminPermissions = async (req, res) => {
  try {
    const { permissions } = req.body;

    const admin = await SuperAdmin.findById(req.params.id);
    if (!admin) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Admin not found'
      });
    }

    admin.permissions = { ...admin.permissions, ...permissions };
    await admin.save();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Permissions updated successfully',
      data: admin
    });
  } catch (error) {
    console.error('Update permissions error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to update permissions',
      error: error.message
    });
  }
};
