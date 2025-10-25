const HMOPlan = require('../models/hmoPlan.model');
const User = require('../models/user.model');

/**
 * @desc    Get all HMO plans with filters and pagination
 * @route   GET /api/super-admin/hmo-plans
 * @access  Super Admin
 */
exports.getAllHMOPlans = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status = 'all',
      category = 'all',
      planType = 'all',
      search = '',
      sortBy = 'createdAt',
      sortOrder = 'desc',
      isAvailableForNewEnrollment
    } = req.query;

    // Build query
    const query = {};

    if (status !== 'all') {
      query.status = status;
    }

    if (category !== 'all') {
      query.category = category;
    }

    if (planType !== 'all') {
      query.planType = planType;
    }

    if (isAvailableForNewEnrollment !== undefined) {
      query.isAvailableForNewEnrollment = isAvailableForNewEnrollment === 'true';
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { planCode: { $regex: search, $options: 'i' } },
        { 'provider.name': { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Count total documents
    const total = await HMOPlan.countDocuments(query);

    // Fetch HMO plans with pagination
    const hmoPlans = await HMOPlan.find(query)
      .populate('createdBy', 'profile.firstName profile.lastName email')
      .populate('lastModifiedBy', 'profile.firstName profile.lastName email')
      .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    // Get summary statistics
    const summary = await HMOPlan.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const summaryData = {
      total,
      active: summary.find(s => s._id === 'active')?.count || 0,
      inactive: summary.find(s => s._id === 'inactive')?.count || 0,
      suspended: summary.find(s => s._id === 'suspended')?.count || 0,
      discontinued: summary.find(s => s._id === 'discontinued')?.count || 0
    };

    res.status(200).json({
      success: true,
      data: {
        plans: hmoPlans,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalPlans: total,
          hasNext: page * limit < total,
          hasPrev: page > 1
        },
        summary: summaryData
      }
    });
  } catch (error) {
    console.error('Error fetching HMO plans:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching HMO plans',
      error: error.message
    });
  }
};

/**
 * @desc    Get HMO plan by ID
 * @route   GET /api/super-admin/hmo-plans/:id
 * @access  Super Admin
 */
exports.getHMOPlanById = async (req, res) => {
  try {
    const { id } = req.params;

    const hmoPlan = await HMOPlan.findById(id)
      .populate('createdBy', 'profile.firstName profile.lastName email')
      .populate('lastModifiedBy', 'profile.firstName profile.lastName email')
      .populate('network.providers.providerId', 'profile.firstName profile.lastName email professionalInfo.specialization');

    if (!hmoPlan) {
      return res.status(404).json({
        success: false,
        message: 'HMO plan not found'
      });
    }

    res.status(200).json({
      success: true,
      data: hmoPlan
    });
  } catch (error) {
    console.error('Error fetching HMO plan:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching HMO plan',
      error: error.message
    });
  }
};

/**
 * @desc    Create new HMO plan
 * @route   POST /api/super-admin/hmo-plans
 * @access  Super Admin
 */
exports.createHMOPlan = async (req, res) => {
  try {
    const planData = req.body;

    // Check if plan code already exists
    const existingPlan = await HMOPlan.findByPlanCode(planData.planCode);
    if (existingPlan) {
      return res.status(400).json({
        success: false,
        message: 'HMO plan with this code already exists'
      });
    }

    // Add admin who created the plan
    planData.createdBy = req.user._id;
    planData.lastModifiedBy = req.user._id;

    const hmoPlan = await HMOPlan.create(planData);

    res.status(201).json({
      success: true,
      data: hmoPlan,
      message: 'HMO plan created successfully'
    });
  } catch (error) {
    console.error('Error creating HMO plan:', error);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating HMO plan',
      error: error.message
    });
  }
};

/**
 * @desc    Update HMO plan
 * @route   PUT /api/super-admin/hmo-plans/:id
 * @access  Super Admin
 */
exports.updateHMOPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const hmoPlan = await HMOPlan.findById(id);

    if (!hmoPlan) {
      return res.status(404).json({
        success: false,
        message: 'HMO plan not found'
      });
    }

    // If updating plan code, check for duplicates
    if (updateData.planCode && updateData.planCode !== hmoPlan.planCode) {
      const existingPlan = await HMOPlan.findByPlanCode(updateData.planCode);
      if (existingPlan) {
        return res.status(400).json({
          success: false,
          message: 'HMO plan with this code already exists'
        });
      }
    }

    // Update last modified by
    updateData.lastModifiedBy = req.user._id;

    // Update the plan
    const updatedPlan = await HMOPlan.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('createdBy lastModifiedBy', 'profile.firstName profile.lastName email');

    res.status(200).json({
      success: true,
      data: updatedPlan,
      message: 'HMO plan updated successfully'
    });
  } catch (error) {
    console.error('Error updating HMO plan:', error);

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error updating HMO plan',
      error: error.message
    });
  }
};

/**
 * @desc    Update HMO plan status
 * @route   PATCH /api/super-admin/hmo-plans/:id/status
 * @access  Super Admin
 */
exports.updateHMOPlanStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    // Validate status
    const validStatuses = ['active', 'inactive', 'suspended', 'discontinued'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }

    const hmoPlan = await HMOPlan.findById(id);

    if (!hmoPlan) {
      return res.status(404).json({
        success: false,
        message: 'HMO plan not found'
      });
    }

    hmoPlan.status = status;
    hmoPlan.lastModifiedBy = req.user._id;

    // Add note about status change
    if (reason) {
      hmoPlan.internalNotes = `${hmoPlan.internalNotes || ''}\n[${new Date().toISOString()}] Status changed to ${status}. Reason: ${reason}`;
    }

    // If plan is being discontinued or suspended, make it unavailable for new enrollment
    if (status === 'discontinued' || status === 'suspended') {
      hmoPlan.isAvailableForNewEnrollment = false;
    }

    await hmoPlan.save();

    res.status(200).json({
      success: true,
      data: {
        planId: hmoPlan._id,
        newStatus: hmoPlan.status,
        updatedAt: hmoPlan.updatedAt
      },
      message: `HMO plan status updated to ${status}`
    });
  } catch (error) {
    console.error('Error updating HMO plan status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating HMO plan status',
      error: error.message
    });
  }
};

/**
 * @desc    Delete HMO plan
 * @route   DELETE /api/super-admin/hmo-plans/:id
 * @access  Super Admin (Master Admin only)
 */
exports.deleteHMOPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { permanent = false } = req.body;

    const hmoPlan = await HMOPlan.findById(id);

    if (!hmoPlan) {
      return res.status(404).json({
        success: false,
        message: 'HMO plan not found'
      });
    }

    // Check if plan has active members
    if (hmoPlan.statistics.activeMembers > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete HMO plan with active members. Please discontinue the plan instead.',
        data: {
          activeMembers: hmoPlan.statistics.activeMembers
        }
      });
    }

    if (permanent) {
      // Permanent deletion (hard delete)
      await HMOPlan.findByIdAndDelete(id);

      res.status(200).json({
        success: true,
        message: 'HMO plan permanently deleted',
        data: {
          planId: id,
          deletedAt: new Date()
        }
      });
    } else {
      // Soft delete (change status to discontinued)
      hmoPlan.status = 'discontinued';
      hmoPlan.isAvailableForNewEnrollment = false;
      hmoPlan.lastModifiedBy = req.user._id;
      await hmoPlan.save();

      res.status(200).json({
        success: true,
        message: 'HMO plan discontinued successfully',
        data: {
          planId: hmoPlan._id,
          status: hmoPlan.status
        }
      });
    }
  } catch (error) {
    console.error('Error deleting HMO plan:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting HMO plan',
      error: error.message
    });
  }
};

/**
 * @desc    Get HMO plan statistics
 * @route   GET /api/super-admin/hmo-plans/stats/overview
 * @access  Super Admin
 */
exports.getHMOPlanStatistics = async (req, res) => {
  try {
    // Get overall statistics
    const totalPlans = await HMOPlan.countDocuments();
    const activePlans = await HMOPlan.countDocuments({ status: 'active' });

    // Get enrollment statistics
    const enrollmentStats = await HMOPlan.aggregate([
      {
        $group: {
          _id: null,
          totalEnrollments: { $sum: '$statistics.totalEnrollments' },
          totalActiveMembers: { $sum: '$statistics.activeMembers' },
          totalClaimsPaid: { $sum: '$statistics.totalClaimsPaid' },
          totalClaimsAmount: { $sum: '$statistics.totalClaimsAmount' }
        }
      }
    ]);

    // Get distribution by category
    const categoryDistribution = await HMOPlan.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          activeMembers: { $sum: '$statistics.activeMembers' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get distribution by plan type
    const planTypeDistribution = await HMOPlan.aggregate([
      {
        $group: {
          _id: '$planType',
          count: { $sum: 1 },
          activeMembers: { $sum: '$statistics.activeMembers' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get top plans by enrollment
    const topPlans = await HMOPlan.find({ status: 'active' })
      .select('name planCode statistics.activeMembers statistics.totalEnrollments')
      .sort({ 'statistics.activeMembers': -1 })
      .limit(5)
      .lean();

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalPlans,
          activePlans,
          totalEnrollments: enrollmentStats[0]?.totalEnrollments || 0,
          totalActiveMembers: enrollmentStats[0]?.totalActiveMembers || 0,
          totalClaimsPaid: enrollmentStats[0]?.totalClaimsPaid || 0,
          totalClaimsAmount: enrollmentStats[0]?.totalClaimsAmount || 0
        },
        distribution: {
          byCategory: categoryDistribution,
          byPlanType: planTypeDistribution
        },
        topPlans
      }
    });
  } catch (error) {
    console.error('Error fetching HMO plan statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching HMO plan statistics',
      error: error.message
    });
  }
};

/**
 * @desc    Add provider to HMO plan network
 * @route   POST /api/super-admin/hmo-plans/:id/network/providers
 * @access  Super Admin
 */
exports.addProviderToNetwork = async (req, res) => {
  try {
    const { id } = req.params;
    const { providerId, name, specialty, location } = req.body;

    const hmoPlan = await HMOPlan.findById(id);

    if (!hmoPlan) {
      return res.status(404).json({
        success: false,
        message: 'HMO plan not found'
      });
    }

    // Verify provider exists
    if (providerId) {
      const provider = await User.findOne({
        _id: providerId,
        userType: 'provider'
      });

      if (!provider) {
        return res.status(404).json({
          success: false,
          message: 'Provider not found'
        });
      }
    }

    // Check if provider already in network
    const existingProvider = hmoPlan.network.providers.find(
      p => p.providerId && p.providerId.toString() === providerId
    );

    if (existingProvider) {
      return res.status(400).json({
        success: false,
        message: 'Provider already in network'
      });
    }

    // Add provider to network
    hmoPlan.network.providers.push({
      providerId,
      name,
      specialty,
      location
    });

    hmoPlan.lastModifiedBy = req.user._id;
    await hmoPlan.save();

    res.status(200).json({
      success: true,
      data: hmoPlan.network.providers,
      message: 'Provider added to network successfully'
    });
  } catch (error) {
    console.error('Error adding provider to network:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding provider to network',
      error: error.message
    });
  }
};

/**
 * @desc    Remove provider from HMO plan network
 * @route   DELETE /api/super-admin/hmo-plans/:id/network/providers/:providerId
 * @access  Super Admin
 */
exports.removeProviderFromNetwork = async (req, res) => {
  try {
    const { id, providerId } = req.params;

    const hmoPlan = await HMOPlan.findById(id);

    if (!hmoPlan) {
      return res.status(404).json({
        success: false,
        message: 'HMO plan not found'
      });
    }

    // Remove provider from network
    const initialLength = hmoPlan.network.providers.length;
    hmoPlan.network.providers = hmoPlan.network.providers.filter(
      p => p.providerId && p.providerId.toString() !== providerId
    );

    if (hmoPlan.network.providers.length === initialLength) {
      return res.status(404).json({
        success: false,
        message: 'Provider not found in network'
      });
    }

    hmoPlan.lastModifiedBy = req.user._id;
    await hmoPlan.save();

    res.status(200).json({
      success: true,
      data: hmoPlan.network.providers,
      message: 'Provider removed from network successfully'
    });
  } catch (error) {
    console.error('Error removing provider from network:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing provider from network',
      error: error.message
    });
  }
};

/**
 * @desc    Get active HMO plans (public endpoint)
 * @route   GET /api/hmo-plans/active
 * @access  Public
 */
exports.getActiveHMOPlans = async (req, res) => {
  try {
    const { category, planType } = req.query;

    const query = {
      status: 'active',
      isAvailableForNewEnrollment: true
    };

    if (category) query.category = category;
    if (planType) query.planType = planType;

    const plans = await HMOPlan.find(query)
      .select('-internalNotes -createdBy -lastModifiedBy')
      .sort({ 'pricing.monthlyPremium.individual': 1 })
      .lean();

    res.status(200).json({
      success: true,
      data: plans
    });
  } catch (error) {
    console.error('Error fetching active HMO plans:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching active HMO plans',
      error: error.message
    });
  }
};
