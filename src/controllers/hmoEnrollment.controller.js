const HMOEnrollment = require('../models/hmoEnrollment.model');
const HMOPlan = require('../models/hmoPlan.model');
const HMOClaim = require('../models/hmoClaim.model');
const User = require('../models/user.model');

/**
 * @desc    Get all available HMO plans (Public)
 * @route   GET /api/hmo-plans
 * @access  Public/Authenticated
 */
exports.getAvailableHMOPlans = async (req, res) => {
  try {
    const { category, planType, minPrice, maxPrice, sortBy = 'pricing.monthlyPremium.individual' } = req.query;

    const query = {
      status: 'active',
      isAvailableForNewEnrollment: true
    };

    if (category) query.category = category;
    if (planType) query.planType = planType;

    // Price filtering
    if (minPrice || maxPrice) {
      query['pricing.monthlyPremium.individual'] = {};
      if (minPrice) query['pricing.monthlyPremium.individual'].$gte = parseFloat(minPrice);
      if (maxPrice) query['pricing.monthlyPremium.individual'].$lte = parseFloat(maxPrice);
    }

    const plans = await HMOPlan.find(query)
      .select('-internalNotes -createdBy -lastModifiedBy')
      .sort(sortBy)
      .lean();

    res.status(200).json({
      success: true,
      data: plans,
      count: plans.length
    });
  } catch (error) {
    console.error('Error fetching available HMO plans:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching available HMO plans',
      error: error.message
    });
  }
};

/**
 * @desc    Get HMO plan details by ID (Public)
 * @route   GET /api/hmo-plans/:id
 * @access  Public/Authenticated
 */
exports.getHMOPlanDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const plan = await HMOPlan.findOne({
      _id: id,
      status: 'active',
      isAvailableForNewEnrollment: true
    })
      .select('-internalNotes -createdBy -lastModifiedBy')
      .lean();

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'HMO plan not found or not available for enrollment'
      });
    }

    res.status(200).json({
      success: true,
      data: plan
    });
  } catch (error) {
    console.error('Error fetching HMO plan details:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching HMO plan details',
      error: error.message
    });
  }
};

/**
 * @desc    Enroll in HMO plan
 * @route   POST /api/hmo-enrollments
 * @access  Authenticated (Patients)
 */
exports.enrollInHMOPlan = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      planId,
      enrollmentType,
      dependents,
      paymentPlan,
      paymentMethod,
      coverageStartDate,
      primaryCareProviderId,
      beneficiary,
      employer
    } = req.body;

    // Validate plan exists and is available
    const plan = await HMOPlan.findOne({
      _id: planId,
      status: 'active',
      isAvailableForNewEnrollment: true
    });

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'HMO plan not found or not available for enrollment'
      });
    }

    // Check if user already has active enrollment
    const existingEnrollment = await HMOEnrollment.findOne({
      userId,
      status: { $in: ['active', 'pending'] }
    });

    if (existingEnrollment) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active or pending enrollment'
      });
    }

    // Validate enrollment type matches plan type
    if (!plan.planType || (plan.planType !== 'individual' && plan.planType !== enrollmentType)) {
      // For individual plans or if enrollmentType matches
    }

    // Validate dependents for family plans
    if (enrollmentType === 'family' && (!dependents || dependents.length === 0)) {
      return res.status(400).json({
        success: false,
        message: 'Family plan requires at least one dependent'
      });
    }

    // Check dependents limit
    if (dependents && plan.limits?.dependentsAllowed && dependents.length > plan.limits.dependentsAllowed) {
      return res.status(400).json({
        success: false,
        message: `This plan allows a maximum of ${plan.limits.dependentsAllowed} dependents`
      });
    }

    // Calculate payment amount
    const paymentAmount = plan.pricing.monthlyPremium[enrollmentType] || plan.pricing.monthlyPremium.individual;

    if (!paymentAmount) {
      return res.status(400).json({
        success: false,
        message: 'Pricing not available for selected enrollment type'
      });
    }

    // Create enrollment
    const enrollment = new HMOEnrollment({
      userId,
      planId,
      enrollmentType,
      dependents: dependents || [],
      payment: {
        plan: paymentPlan || 'monthly',
        amount: paymentAmount,
        paymentMethod,
        autoRenewal: true
      },
      status: 'pending', // Will be activated after payment
      beneficiary,
      employer,
      enrolledBy: userId,
      enrollmentSource: req.headers['user-agent']?.includes('Mobile') ? 'mobile' : 'web'
    });

    // Calculate coverage dates
    enrollment.calculateCoverageDates(coverageStartDate, plan);

    // Initialize limits
    enrollment.initializeLimits(plan);

    // Set primary care provider if provided
    if (primaryCareProviderId) {
      const provider = await User.findOne({
        _id: primaryCareProviderId,
        userType: 'provider'
      });

      if (provider) {
        enrollment.primaryCareProvider = {
          providerId: provider._id,
          name: `${provider.profile.firstName} ${provider.profile.lastName}`,
          specialty: provider.professionalInfo?.specialization,
          assignedDate: new Date()
        };
      }
    }

    await enrollment.save();

    // Update plan statistics
    await plan.incrementEnrollment();

    // TODO: Initiate payment process here

    res.status(201).json({
      success: true,
      data: enrollment,
      message: 'Enrollment request submitted successfully. Please complete payment to activate.'
    });
  } catch (error) {
    console.error('Error enrolling in HMO plan:', error);

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
      message: 'Error processing enrollment request',
      error: error.message
    });
  }
};

/**
 * @desc    Get user's HMO enrollments
 * @route   GET /api/hmo-enrollments/my-enrollments
 * @access  Authenticated
 */
exports.getMyEnrollments = async (req, res) => {
  try {
    const userId = req.user._id;
    const { status } = req.query;

    const query = { userId };
    if (status) query.status = status;

    const enrollments = await HMOEnrollment.find(query)
      .populate('planId', '-internalNotes -createdBy -lastModifiedBy')
      .populate('primaryCareProvider.providerId', 'profile.firstName profile.lastName email phone professionalInfo.specialization')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: enrollments,
      count: enrollments.length
    });
  } catch (error) {
    console.error('Error fetching enrollments:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching enrollments',
      error: error.message
    });
  }
};

/**
 * @desc    Get enrollment details
 * @route   GET /api/hmo-enrollments/:id
 * @access  Authenticated (Owner only)
 */
exports.getEnrollmentDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const enrollment = await HMOEnrollment.findOne({
      _id: id,
      userId
    })
      .populate('planId')
      .populate('primaryCareProvider.providerId', 'profile email phone professionalInfo')
      .lean();

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    res.status(200).json({
      success: true,
      data: enrollment
    });
  } catch (error) {
    console.error('Error fetching enrollment details:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching enrollment details',
      error: error.message
    });
  }
};

/**
 * @desc    Update enrollment (add dependents, change PCP, etc.)
 * @route   PUT /api/hmo-enrollments/:id
 * @access  Authenticated (Owner only)
 */
exports.updateEnrollment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const { dependents, primaryCareProviderId, beneficiary, paymentMethod } = req.body;

    const enrollment = await HMOEnrollment.findOne({
      _id: id,
      userId,
      status: { $in: ['active', 'pending'] }
    });

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found or cannot be updated'
      });
    }

    // Get plan for validation
    const plan = await HMOPlan.findById(enrollment.planId);

    // Update dependents
    if (dependents) {
      if (plan.limits?.dependentsAllowed && dependents.length > plan.limits.dependentsAllowed) {
        return res.status(400).json({
          success: false,
          message: `This plan allows a maximum of ${plan.limits.dependentsAllowed} dependents`
        });
      }
      enrollment.dependents = dependents;
    }

    // Update primary care provider
    if (primaryCareProviderId) {
      const provider = await User.findOne({
        _id: primaryCareProviderId,
        userType: 'provider'
      });

      if (provider) {
        enrollment.primaryCareProvider = {
          providerId: provider._id,
          name: `${provider.profile.firstName} ${provider.profile.lastName}`,
          specialty: provider.professionalInfo?.specialization,
          assignedDate: new Date()
        };
      }
    }

    // Update beneficiary
    if (beneficiary) {
      enrollment.beneficiary = beneficiary;
    }

    // Update payment method
    if (paymentMethod) {
      enrollment.payment.paymentMethod = paymentMethod;
    }

    await enrollment.save();

    res.status(200).json({
      success: true,
      data: enrollment,
      message: 'Enrollment updated successfully'
    });
  } catch (error) {
    console.error('Error updating enrollment:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating enrollment',
      error: error.message
    });
  }
};

/**
 * @desc    Cancel enrollment
 * @route   POST /api/hmo-enrollments/:id/cancel
 * @access  Authenticated (Owner only)
 */
exports.cancelEnrollment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const { reason, effectiveDate } = req.body;

    const enrollment = await HMOEnrollment.findOne({
      _id: id,
      userId
    }).populate('planId');

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    if (!enrollment.canBeCancelled()) {
      return res.status(400).json({
        success: false,
        message: 'This enrollment cannot be cancelled'
      });
    }

    // Calculate refund if applicable
    let refundAmount = 0;
    const now = new Date();
    const daysRemaining = Math.ceil((enrollment.coverageEndDate - now) / (1000 * 60 * 60 * 24));

    if (daysRemaining > 0 && enrollment.payment.plan === 'annual') {
      // Pro-rata refund for annual plans
      const totalDays = Math.ceil((enrollment.coverageEndDate - enrollment.coverageStartDate) / (1000 * 60 * 60 * 24));
      refundAmount = (enrollment.payment.amount * daysRemaining) / totalDays;
    }

    // Update enrollment
    enrollment.status = 'cancelled';
    enrollment.cancellation = {
      requestedAt: new Date(),
      effectiveDate: effectiveDate ? new Date(effectiveDate) : new Date(),
      reason,
      refundAmount,
      refundStatus: refundAmount > 0 ? 'pending' : 'processed'
    };

    enrollment.statusHistory.push({
      status: 'cancelled',
      reason,
      changedAt: new Date(),
      changedBy: userId
    });

    await enrollment.save();

    // Update plan statistics
    const plan = await HMOPlan.findById(enrollment.planId);
    if (plan) {
      await plan.decrementEnrollment();
    }

    res.status(200).json({
      success: true,
      data: {
        enrollment,
        refundAmount
      },
      message: 'Enrollment cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling enrollment:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling enrollment',
      error: error.message
    });
  }
};

/**
 * @desc    Renew enrollment
 * @route   POST /api/hmo-enrollments/:id/renew
 * @access  Authenticated (Owner only)
 */
exports.renewEnrollment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const { paymentMethod } = req.body;

    const enrollment = await HMOEnrollment.findOne({
      _id: id,
      userId
    }).populate('planId');

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    if (!enrollment.canBeRenewed()) {
      return res.status(400).json({
        success: false,
        message: 'This enrollment cannot be renewed yet. Renewal is available 60 days before expiry.'
      });
    }

    // Check if plan is still available
    const plan = enrollment.planId;
    if (plan.status !== 'active' || !plan.isAvailableForNewEnrollment) {
      return res.status(400).json({
        success: false,
        message: 'This plan is no longer available for enrollment'
      });
    }

    // Create new enrollment for renewal
    const newEnrollment = new HMOEnrollment({
      userId: enrollment.userId,
      planId: enrollment.planId._id,
      enrollmentType: enrollment.enrollmentType,
      dependents: enrollment.dependents,
      payment: {
        plan: enrollment.payment.plan,
        amount: plan.pricing.monthlyPremium[enrollment.enrollmentType] || enrollment.payment.amount,
        paymentMethod: paymentMethod || enrollment.payment.paymentMethod,
        autoRenewal: enrollment.payment.autoRenewal
      },
      primaryCareProvider: enrollment.primaryCareProvider,
      beneficiary: enrollment.beneficiary,
      employer: enrollment.employer,
      status: 'pending',
      enrolledBy: userId,
      enrollmentSource: 'renewal'
    });

    // Calculate coverage dates (start from current enrollment end date)
    newEnrollment.calculateCoverageDates(enrollment.coverageEndDate, plan);

    // Initialize limits
    newEnrollment.initializeLimits(plan);

    await newEnrollment.save();

    // TODO: Initiate payment process

    res.status(201).json({
      success: true,
      data: newEnrollment,
      message: 'Renewal request submitted successfully. Please complete payment to activate.'
    });
  } catch (error) {
    console.error('Error renewing enrollment:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing renewal request',
      error: error.message
    });
  }
};

/**
 * @desc    Get enrollment claims
 * @route   GET /api/hmo-enrollments/:id/claims
 * @access  Authenticated (Owner only)
 */
exports.getEnrollmentClaims = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const enrollment = await HMOEnrollment.findOne({
      _id: id,
      userId
    });

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    // Fetch claims for this enrollment
    const claims = await HMOClaim.find({
      enrollmentId: id,
      patientId: userId
    })
      .populate('claimantId', 'profile.firstName profile.lastName userType businessInfo.name practice.name')
      .select('claimNumber serviceType serviceDate billing status createdAt')
      .sort({ createdAt: -1 })
      .limit(50);

    // Calculate summary statistics
    const claimsSummary = await HMOClaim.aggregate([
      {
        $match: {
          enrollmentId: enrollment._id,
          patientId: userId
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalBilled: { $sum: '$billing.totalBilled' },
          totalCovered: { $sum: '$billing.coveredAmount' },
          totalPatientPaid: { $sum: '$billing.patientResponsibility.total' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        claims,
        summary: claimsSummary,
        utilization: enrollment.utilization,
        limits: enrollment.limits
      }
    });
  } catch (error) {
    console.error('Error fetching enrollment claims:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching enrollment claims',
      error: error.message
    });
  }
};

/**
 * @desc    Download enrollment card/certificate
 * @route   GET /api/hmo-enrollments/:id/card
 * @access  Authenticated (Owner only)
 */
exports.downloadEnrollmentCard = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const enrollment = await HMOEnrollment.findOne({
      _id: id,
      userId,
      status: 'active'
    }).populate('planId userId');

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Active enrollment not found'
      });
    }

    if (!enrollment.membershipCardNumber) {
      return res.status(400).json({
        success: false,
        message: 'Membership card not yet generated'
      });
    }

    // TODO: Generate PDF card/certificate
    // For now, return card details
    res.status(200).json({
      success: true,
      data: {
        membershipCardNumber: enrollment.membershipCardNumber,
        enrollmentNumber: enrollment.enrollmentNumber,
        memberName: enrollment.userId.fullName,
        planName: enrollment.planId.name,
        coverageStartDate: enrollment.coverageStartDate,
        coverageEndDate: enrollment.coverageEndDate,
        dependents: enrollment.dependents
      },
      message: 'Card details retrieved. PDF generation coming soon.'
    });
  } catch (error) {
    console.error('Error downloading enrollment card:', error);
    res.status(500).json({
      success: false,
      message: 'Error downloading enrollment card',
      error: error.message
    });
  }
};

/**
 * @desc    Compare HMO plans
 * @route   POST /api/hmo-plans/compare
 * @access  Public/Authenticated
 */
exports.compareHMOPlans = async (req, res) => {
  try {
    const { planIds } = req.body;

    if (!planIds || !Array.isArray(planIds) || planIds.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Please provide at least 2 plan IDs to compare'
      });
    }

    if (planIds.length > 4) {
      return res.status(400).json({
        success: false,
        message: 'You can compare a maximum of 4 plans at once'
      });
    }

    const plans = await HMOPlan.find({
      _id: { $in: planIds },
      status: 'active'
    })
      .select('-internalNotes -createdBy -lastModifiedBy -documents -regulatoryApprovals')
      .lean();

    if (plans.length !== planIds.length) {
      return res.status(404).json({
        success: false,
        message: 'One or more plans not found'
      });
    }

    res.status(200).json({
      success: true,
      data: plans
    });
  } catch (error) {
    console.error('Error comparing HMO plans:', error);
    res.status(500).json({
      success: false,
      message: 'Error comparing HMO plans',
      error: error.message
    });
  }
};
