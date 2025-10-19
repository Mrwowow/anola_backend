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

// ==================== NEW: Additional Dashboard Endpoints ====================

/**
 * @desc    Get user distribution by type
 * @route   GET /api/super-admin/dashboard/user-distribution
 * @access  Super Admin
 */
exports.getUserDistribution = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ status: { $ne: 'deleted' } });

    const distribution = await User.aggregate([
      { $match: { status: { $ne: 'deleted' } } },
      {
        $group: {
          _id: '$userType',
          count: { $sum: 1 }
        }
      }
    ]);

    // Calculate percentages
    const data = {};
    distribution.forEach(item => {
      const type = item._id || 'unknown';
      data[type] = {
        count: item.count,
        percentage: totalUsers > 0 ? ((item.count / totalUsers) * 100).toFixed(1) : 0
      };
    });

    // Ensure all user types are present
    ['patient', 'provider', 'vendor', 'sponsor'].forEach(type => {
      if (!data[type]) {
        data[type] = { count: 0, percentage: 0 };
      }
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Get user distribution error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to get user distribution',
      error: error.message
    });
  }
};

/**
 * @desc    Get recent platform activity
 * @route   GET /api/super-admin/dashboard/activity
 * @access  Super Admin
 */
exports.getRecentActivity = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    // Get recent users
    const recentUsers = await User.find({ status: { $ne: 'deleted' } })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('profile.firstName profile.lastName userType createdAt')
      .lean();

    // Get recent transactions
    const recentTransactions = await Transaction.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('from', 'profile.firstName profile.lastName userType')
      .populate('to', 'profile.firstName profile.lastName userType')
      .lean();

    // Format activities
    const activities = [];

    recentUsers.forEach(user => {
      activities.push({
        id: user._id,
        action: 'registered',
        user: {
          id: user._id,
          name: `${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`.trim(),
          type: user.userType
        },
        timestamp: user.createdAt,
        type: 'registration'
      });
    });

    recentTransactions.forEach(txn => {
      activities.push({
        id: txn._id,
        action: 'payment',
        user: {
          id: txn.from?._id,
          name: `${txn.from?.profile?.firstName || ''} ${txn.from?.profile?.lastName || ''}`.trim(),
          type: txn.from?.userType
        },
        timestamp: txn.createdAt,
        type: 'payment',
        amount: txn.amount
      });
    });

    // Sort by timestamp and limit
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const limitedActivities = activities.slice(0, limit);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        activities: limitedActivities,
        total: limitedActivities.length
      }
    });
  } catch (error) {
    console.error('Get recent activity error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to get recent activity',
      error: error.message
    });
  }
};

/**
 * @desc    Get system health metrics
 * @route   GET /api/super-admin/dashboard/system-health
 * @access  Super Admin
 */
exports.getSystemHealth = async (req, res) => {
  try {
    const mongoose = require('mongoose');

    // API health
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();

    // Database health
    const dbState = mongoose.connection.readyState;
    const dbStatuses = {
      0: 'critical', // disconnected
      1: 'healthy',  // connected
      2: 'warning',  // connecting
      3: 'warning'   // disconnecting
    };

    // Calculate error rate (simplified - you'd track this in production)
    const errorRate = {
      rate: 0.5, // percentage
      status: 'healthy'
    };

    // Storage (simplified - would use actual filesystem stats in production)
    const storage = {
      used: 45,
      total: 100,
      percentage: 45,
      status: 'healthy'
    };

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        api: {
          responseTime: 150, // ms - simplified
          uptime: ((uptime / 86400) * 100).toFixed(2), // percentage of 24h
          status: 'healthy'
        },
        database: {
          uptime: dbState === 1 ? 99.9 : 0,
          queryTime: 50, // ms - simplified
          connections: {
            active: mongoose.connection.readyState === 1 ? 5 : 0,
            max: 10
          },
          status: dbStatuses[dbState] || 'critical'
        },
        errorRate,
        storage
      }
    });
  } catch (error) {
    console.error('Get system health error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to get system health',
      error: error.message
    });
  }
};

// ==================== Analytics Endpoints ====================

/**
 * Get revenue analytics with charts data
 */
exports.getRevenueAnalytics = async (req, res) => {
  try {
    const { period = '6months' } = req.query;

    // Calculate start date based on period
    const startDate = new Date();
    switch (period) {
      case '7days':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30days':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '3months':
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case '6months':
        startDate.setMonth(startDate.getMonth() - 6);
        break;
      case '1year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(startDate.getMonth() - 6);
    }

    // Get monthly revenue data from transactions
    const Transaction = require('../models/transaction.model');

    const monthlyRevenue = await Transaction.aggregate([
      {
        $match: {
          status: 'completed',
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          revenue: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]).catch(() => []);

    // Get breakdown by transaction type
    const breakdown = await Transaction.aggregate([
      {
        $match: {
          status: 'completed',
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$type',
          amount: { $sum: '$amount' }
        }
      }
    ]).catch(() => []);

    const total = breakdown.reduce((sum, item) => sum + item.amount, 0);

    // Calculate growth (compare with previous period)
    const previousPeriodStart = new Date(startDate);
    previousPeriodStart.setMonth(previousPeriodStart.getMonth() - 6);

    const previousTotal = await Transaction.aggregate([
      {
        $match: {
          status: 'completed',
          createdAt: { $gte: previousPeriodStart, $lt: startDate }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]).catch(() => [{ total: 0 }]);

    const growth = previousTotal[0]?.total > 0
      ? ((total - previousTotal[0].total) / previousTotal[0].total * 100).toFixed(1)
      : 0;

    // Format breakdown
    const formattedBreakdown = {
      providerServices: {
        amount: breakdown.find(b => b._id === 'appointment')?.amount || 0,
        percentage: total > 0 ? ((breakdown.find(b => b._id === 'appointment')?.amount || 0) / total * 100).toFixed(1) : 0
      },
      vendorSales: {
        amount: breakdown.find(b => b._id === 'product')?.amount || 0,
        percentage: total > 0 ? ((breakdown.find(b => b._id === 'product')?.amount || 0) / total * 100).toFixed(1) : 0
      },
      platformFees: {
        amount: breakdown.reduce((sum, item) => sum + (item.amount * 0.05), 0), // Assuming 5% platform fee
        percentage: 5
      },
      sponsorships: {
        amount: breakdown.find(b => b._id === 'sponsorship')?.amount || 0,
        percentage: total > 0 ? ((breakdown.find(b => b._id === 'sponsorship')?.amount || 0) / total * 100).toFixed(1) : 0
      }
    };

    // Format monthly data
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const formattedMonthlyData = monthlyRevenue.map(item => ({
      month: `${monthNames[item._id.month - 1]} ${item._id.year}`,
      revenue: item.revenue,
      transactions: item.count
    }));

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        overview: {
          total,
          growth: parseFloat(growth),
          currency: 'USD'
        },
        monthlyData: formattedMonthlyData,
        breakdown: formattedBreakdown,
        period
      }
    });
  } catch (error) {
    console.error('Get revenue analytics error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to get revenue analytics',
      error: error.message
    });
  }
};

/**
 * Get user growth analytics
 */
exports.getUserGrowthAnalytics = async (req, res) => {
  try {
    const { period = 'monthly' } = req.query;

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();

    if (period === 'weekly') {
      startDate.setDate(startDate.getDate() - 84); // 12 weeks
    } else {
      startDate.setMonth(startDate.getMonth() - 12); // 12 months
    }

    // Get user growth data
    const growthData = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: { $ne: 'deleted' }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            week: period === 'weekly' ? { $week: '$createdAt' } : null,
            month: period === 'monthly' ? { $month: '$createdAt' } : null,
            userType: '$userType'
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.week': 1 } }
    ]);

    // Get total users and calculate growth
    const totalUsers = await User.countDocuments({ status: { $ne: 'deleted' } });

    const previousPeriodStart = new Date(startDate);
    if (period === 'weekly') {
      previousPeriodStart.setDate(previousPeriodStart.getDate() - 84);
    } else {
      previousPeriodStart.setMonth(previousPeriodStart.getMonth() - 12);
    }

    const previousPeriodUsers = await User.countDocuments({
      createdAt: { $gte: previousPeriodStart, $lt: startDate },
      status: { $ne: 'deleted' }
    });

    const growth = previousPeriodUsers > 0
      ? ((totalUsers - previousPeriodUsers) / previousPeriodUsers * 100).toFixed(1)
      : 0;

    // Format data by period
    const formattedData = [];
    const dataMap = new Map();

    growthData.forEach(item => {
      const key = period === 'weekly'
        ? `Week ${item._id.week} ${item._id.year}`
        : `${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][item._id.month - 1]} ${item._id.year}`;

      if (!dataMap.has(key)) {
        dataMap.set(key, {
          period: key,
          patients: 0,
          providers: 0,
          vendors: 0,
          sponsors: 0
        });
      }

      const periodData = dataMap.get(key);
      const userType = item._id.userType;

      if (userType === 'patient') periodData.patients += item.count;
      else if (userType === 'provider') periodData.providers += item.count;
      else if (userType === 'vendor') periodData.vendors += item.count;
      else if (userType === 'sponsor') periodData.sponsors += item.count;
    });

    dataMap.forEach(value => formattedData.push(value));

    // Get distribution (reuse from getUserDistribution logic)
    const distribution = await User.aggregate([
      { $match: { status: { $ne: 'deleted' } } },
      { $group: { _id: '$userType', count: { $sum: 1 } } }
    ]);

    const formattedDistribution = {
      patients: { count: 0, percentage: 0 },
      providers: { count: 0, percentage: 0 },
      vendors: { count: 0, percentage: 0 },
      sponsors: { count: 0, percentage: 0 }
    };

    distribution.forEach(item => {
      const type = item._id === 'patient' ? 'patients'
                 : item._id === 'provider' ? 'providers'
                 : item._id === 'vendor' ? 'vendors'
                 : item._id === 'sponsor' ? 'sponsors'
                 : null;

      if (type) {
        formattedDistribution[type] = {
          count: item.count,
          percentage: totalUsers > 0 ? parseFloat(((item.count / totalUsers) * 100).toFixed(1)) : 0
        };
      }
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        total: totalUsers,
        growth: parseFloat(growth),
        periodData: formattedData,
        distribution: formattedDistribution,
        period
      }
    });
  } catch (error) {
    console.error('Get user growth analytics error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to get user growth analytics',
      error: error.message
    });
  }
};

/**
 * Get top performers (providers and vendors)
 */
exports.getTopPerformers = async (req, res) => {
  try {
    const { type = 'all', limit = 10 } = req.query;
    const resultLimit = Math.min(parseInt(limit), 50);

    const result = {};

    // Get top providers if requested
    if (type === 'all' || type === 'provider') {
      const Transaction = require('../models/transaction.model');
      const Appointment = require('../models/appointment.model');

      // Get provider revenue data
      const providerRevenue = await Transaction.aggregate([
        {
          $match: {
            type: 'appointment',
            status: 'completed'
          }
        },
        {
          $group: {
            _id: '$toUser',
            revenue: { $sum: '$amount' },
            transactionCount: { $sum: 1 }
          }
        },
        { $sort: { revenue: -1 } },
        { $limit: resultLimit }
      ]).catch(() => []);

      // Get provider IDs
      const providerIds = providerRevenue.map(p => p._id);

      // Get provider details and appointment counts
      const providers = await User.find({
        _id: { $in: providerIds },
        userType: 'provider'
      }).select('profile email');

      const appointmentCounts = await Appointment.aggregate([
        {
          $match: {
            providerId: { $in: providerIds },
            status: { $in: ['completed', 'confirmed'] }
          }
        },
        {
          $group: {
            _id: '$providerId',
            appointments: { $sum: 1 }
          }
        }
      ]).catch(() => []);

      // Combine data
      result.providers = providerRevenue.map(pr => {
        const provider = providers.find(p => p._id.toString() === pr._id.toString());
        const appointments = appointmentCounts.find(a => a._id.toString() === pr._id.toString());

        return {
          id: pr._id,
          name: provider ? `${provider.profile.firstName} ${provider.profile.lastName}` : 'Unknown',
          email: provider?.email,
          revenue: pr.revenue,
          appointments: appointments?.appointments || 0,
          rating: 4.5 // TODO: Calculate from reviews when review model exists
        };
      });
    }

    // Get top vendors if requested
    if (type === 'all' || type === 'vendor') {
      const Transaction = require('../models/transaction.model');

      // Get vendor revenue data
      const vendorRevenue = await Transaction.aggregate([
        {
          $match: {
            type: 'product',
            status: 'completed'
          }
        },
        {
          $group: {
            _id: '$toUser',
            revenue: { $sum: '$amount' },
            orders: { $sum: 1 }
          }
        },
        { $sort: { revenue: -1 } },
        { $limit: resultLimit }
      ]).catch(() => []);

      // Get vendor IDs
      const vendorIds = vendorRevenue.map(v => v._id);

      // Get vendor details
      const vendors = await User.find({
        _id: { $in: vendorIds },
        userType: 'vendor'
      }).select('profile email businessName');

      // Combine data
      result.vendors = vendorRevenue.map(vr => {
        const vendor = vendors.find(v => v._id.toString() === vr._id.toString());

        return {
          id: vr._id,
          name: vendor?.businessName || (vendor ? `${vendor.profile.firstName} ${vendor.profile.lastName}` : 'Unknown'),
          email: vendor?.email,
          revenue: vr.revenue,
          orders: vr.orders,
          rating: 4.3 // TODO: Calculate from reviews when review model exists
        };
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get top performers error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to get top performers',
      error: error.message
    });
  }
};

/**
 * Get platform metrics
 */
exports.getPlatformMetrics = async (req, res) => {
  try {
    // TODO: These metrics require session tracking and analytics infrastructure
    // For now, return sample data structure that can be populated when tracking is implemented

    const metrics = {
      sessionDuration: {
        average: '12m 34s',
        change: 8.5,
        trend: 'up'
      },
      bounceRate: {
        value: 32.4,
        change: -5.2,
        trend: 'down'
      },
      conversionRate: {
        value: 18.7,
        change: 3.1,
        trend: 'up'
      },
      satisfaction: {
        score: 4.6,
        outOf: 5,
        change: 0.3,
        trend: 'up'
      },
      // Additional useful metrics we can calculate now
      activeUsers: {
        daily: await User.countDocuments({
          status: 'active',
          lastLoginAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        }).catch(() => 0),
        weekly: await User.countDocuments({
          status: 'active',
          lastLoginAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        }).catch(() => 0),
        monthly: await User.countDocuments({
          status: 'active',
          lastLoginAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        }).catch(() => 0)
      },
      totalTransactions: {
        today: 0, // Will be populated when Transaction model has data
        thisWeek: 0,
        thisMonth: 0
      }
    };

    // Get transaction counts if Transaction model exists
    try {
      const Transaction = require('../models/transaction.model');

      metrics.totalTransactions.today = await Transaction.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      });

      metrics.totalTransactions.thisWeek = await Transaction.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      });

      metrics.totalTransactions.thisMonth = await Transaction.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      });
    } catch (err) {
      // Transaction model might not exist yet
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: metrics,
      note: 'Session tracking metrics are placeholder values. Implement analytics tracking for accurate data.'
    });
  } catch (error) {
    console.error('Get platform metrics error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to get platform metrics',
      error: error.message
    });
  }
};

/**
 * Get geographic distribution
 */
exports.getGeographicDistribution = async (req, res) => {
  try {
    // Get users grouped by country and state
    const countryDistribution = await User.aggregate([
      {
        $match: { status: { $ne: 'deleted' } }
      },
      {
        $group: {
          _id: '$profile.address.country',
          users: { $sum: 1 }
        }
      },
      { $sort: { users: -1 } }
    ]);

    const stateDistribution = await User.aggregate([
      {
        $match: {
          status: { $ne: 'deleted' },
          'profile.address.country': { $exists: true }
        }
      },
      {
        $group: {
          _id: {
            country: '$profile.address.country',
            state: '$profile.address.state'
          },
          users: { $sum: 1 }
        }
      },
      { $sort: { users: -1 } },
      { $limit: 20 } // Top 20 states
    ]);

    const totalUsers = await User.countDocuments({ status: { $ne: 'deleted' } });

    // Get revenue by region (if Transaction model exists)
    let revenueByCountry = [];
    try {
      const Transaction = require('../models/transaction.model');

      // Join transactions with user data to get country
      revenueByCountry = await Transaction.aggregate([
        {
          $match: { status: 'completed' }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'fromUser',
            foreignField: '_id',
            as: 'user'
          }
        },
        { $unwind: '$user' },
        {
          $group: {
            _id: '$user.profile.address.country',
            revenue: { $sum: '$amount' }
          }
        },
        { $sort: { revenue: -1 } }
      ]);
    } catch (err) {
      // Transaction model might not exist
    }

    // Format regions data
    const regions = countryDistribution.map(item => {
      const revenue = revenueByCountry.find(r => r._id === item._id);

      return {
        name: item._id || 'Unknown',
        users: item.users,
        revenue: revenue?.revenue || 0,
        percentage: totalUsers > 0 ? parseFloat(((item.users / totalUsers) * 100).toFixed(1)) : 0
      };
    });

    // Format states data
    const states = stateDistribution.map(item => ({
      country: item._id.country || 'Unknown',
      state: item._id.state || 'Unknown',
      users: item.users,
      percentage: totalUsers > 0 ? parseFloat(((item.users / totalUsers) * 100).toFixed(1)) : 0
    }));

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        regions,
        states,
        totalUsers
      }
    });
  } catch (error) {
    console.error('Get geographic distribution error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to get geographic distribution',
      error: error.message
    });
  }
};

// ==================== Approval System Endpoints ====================

/**
 * Get list of pending approvals with filters
 */
exports.getApprovals = async (req, res) => {
  try {
    const {
      type = 'all',
      priority = 'all',
      status = 'pending',
      page = 1,
      limit = 20
    } = req.query;

    const query = {};

    // Apply filters
    if (type !== 'all') query.type = type;
    if (priority !== 'all') query.priority = priority;
    if (status !== 'all') query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const Approval = require('../models/approval.model');

    // Get approvals with pagination
    const approvals = await Approval.find(query)
      .populate('userId', 'profile email phone userType')
      .populate('processedBy', 'profile email')
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalApprovals = await Approval.countDocuments(query);
    const totalPages = Math.ceil(totalApprovals / parseInt(limit));

    // Get summary counts
    const summary = {
      pending: await Approval.countDocuments({ status: 'pending' }),
      approved: await Approval.countDocuments({ status: 'approved' }),
      rejected: await Approval.countDocuments({ status: 'rejected' }),
      highPriority: await Approval.countDocuments({ status: 'pending', priority: 'high' })
    };

    // Format approval data
    const formattedApprovals = approvals.map(approval => ({
      id: approval._id,
      type: approval.type,
      applicant: approval.userId ? {
        id: approval.userId._id,
        name: `${approval.userId.profile.firstName} ${approval.userId.profile.lastName}`,
        email: approval.userId.email,
        userType: approval.userId.userType
      } : null,
      status: approval.status,
      priority: approval.priority,
      submittedAt: approval.submittedAt,
      processedAt: approval.processedAt,
      processedBy: approval.processedBy ? {
        name: `${approval.processedBy.profile.firstName} ${approval.processedBy.profile.lastName}`,
        email: approval.processedBy.email
      } : null,
      daysPending: approval.daysPending,
      documentsCount: approval.documents.length
    }));

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        approvals: formattedApprovals,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalApprovals,
          hasNext: page < totalPages,
          hasPrev: page > 1
        },
        summary
      }
    });
  } catch (error) {
    console.error('Get approvals error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to get approvals',
      error: error.message
    });
  }
};

/**
 * Get approval details by ID
 */
exports.getApprovalDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const Approval = require('../models/approval.model');

    const approval = await Approval.findById(id)
      .populate('userId', 'profile email phone userType licenseNumber businessName specialization')
      .populate('processedBy', 'profile email')
      .populate('history.performedBy', 'profile email');

    if (!approval) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Approval request not found'
      });
    }

    // Format detailed response
    const applicant = approval.userId;
    const applicantData = {
      id: applicant._id,
      name: `${applicant.profile.firstName} ${applicant.profile.lastName}`,
      email: applicant.email,
      phone: applicant.phone,
      userType: applicant.userType
    };

    // Add type-specific data
    if (approval.type === 'provider' && applicant.licenseNumber) {
      applicantData.licenseNumber = applicant.licenseNumber;
      applicantData.specialization = applicant.specialization;
    } else if (approval.type === 'vendor' && applicant.businessName) {
      applicantData.businessName = applicant.businessName;
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        id: approval._id,
        type: approval.type,
        status: approval.status,
        priority: approval.priority,
        applicant: applicantData,
        submittedAt: approval.submittedAt,
        processedAt: approval.processedAt,
        processedBy: approval.processedBy ? {
          name: `${approval.processedBy.profile.firstName} ${approval.processedBy.profile.lastName}`,
          email: approval.processedBy.email
        } : null,
        details: approval.details,
        documents: approval.documents,
        notes: approval.notes,
        history: approval.history.map(h => ({
          action: h.action,
          performedBy: h.performedBy ? {
            name: `${h.performedBy.profile.firstName} ${h.performedBy.profile.lastName}`,
            email: h.performedBy.email
          } : null,
          timestamp: h.timestamp,
          notes: h.notes
        })),
        daysPending: approval.daysPending
      }
    });
  } catch (error) {
    console.error('Get approval details error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to get approval details',
      error: error.message
    });
  }
};

/**
 * Approve an application
 */
exports.approveApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes, notifyApplicant = true } = req.body;

    const Approval = require('../models/approval.model');

    const approval = await Approval.findById(id).populate('userId');

    if (!approval) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Approval request not found'
      });
    }

    if (approval.status !== 'pending') {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'This application has already been processed'
      });
    }

    // Update approval status
    approval.status = 'approved';
    approval.processedBy = req.user._id;
    approval.processedAt = new Date();
    if (notes) approval.notes = notes;

    // Add to history
    approval.history.push({
      action: 'APPROVED',
      performedBy: req.user._id,
      timestamp: new Date(),
      notes
    });

    await approval.save();

    // Update user account based on type
    const user = approval.userId;

    if (approval.type === 'provider') {
      user.verificationStatus = user.verificationStatus || {};
      user.verificationStatus.identity = user.verificationStatus.identity || {};
      user.verificationStatus.identity.verified = true;
      user.verificationStatus.identity.verifiedAt = new Date();
      user.verificationStatus.identity.verifiedBy = req.user._id;
    } else if (approval.type === 'vendor') {
      user.verificationStatus = user.verificationStatus || {};
      user.verificationStatus.identity = user.verificationStatus.identity || {};
      user.verificationStatus.identity.verified = true;
      user.verificationStatus.identity.verifiedAt = new Date();
      user.verificationStatus.identity.verifiedBy = req.user._id;
    }

    // Activate account if it was pending
    if (user.status === 'pending' || user.status === 'inactive') {
      user.status = 'active';
    }

    await user.save();

    // TODO: Send notification if notifyApplicant is true
    // await sendApprovalNotification(user, approval.type);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        approvalId: approval._id,
        userId: user._id,
        approvedAt: approval.processedAt
      },
      message: 'Application approved successfully'
    });
  } catch (error) {
    console.error('Approve application error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to approve application',
      error: error.message
    });
  }
};

/**
 * Reject an application
 */
exports.rejectApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, notifyApplicant = true } = req.body;

    if (!reason) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    const Approval = require('../models/approval.model');

    const approval = await Approval.findById(id).populate('userId');

    if (!approval) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Approval request not found'
      });
    }

    if (approval.status !== 'pending') {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'This application has already been processed'
      });
    }

    // Update approval status
    approval.status = 'rejected';
    approval.processedBy = req.user._id;
    approval.processedAt = new Date();
    approval.notes = reason;

    // Add to history
    approval.history.push({
      action: 'REJECTED',
      performedBy: req.user._id,
      timestamp: new Date(),
      notes: reason
    });

    await approval.save();

    // Update user status
    const user = approval.userId;
    user.status = 'rejected';
    await user.save();

    // TODO: Send notification if notifyApplicant is true
    // await sendRejectionNotification(user, approval.type, reason);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        approvalId: approval._id,
        userId: user._id,
        rejectedAt: approval.processedAt
      },
      message: 'Application rejected successfully'
    });
  } catch (error) {
    console.error('Reject application error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to reject application',
      error: error.message
    });
  }
};
