const HMOClaim = require('../models/hmoClaim.model');
const HMOEnrollment = require('../models/hmoEnrollment.model');
const HMOPlan = require('../models/hmoPlan.model');
const User = require('../models/user.model');
const { HTTP_STATUS } = require('../utils/constants');

// ==================== Provider/Vendor Claims Submission ====================

/**
 * Submit a new HMO claim (Provider or Vendor)
 * POST /api/hmo-claims
 */
exports.submitClaim = async (req, res) => {
  try {
    const {
      enrollmentId,
      patientId,
      serviceType,
      serviceDate,
      dischargeDate,
      diagnosis,
      procedure,
      treatmentDetails,
      billing,
      documents
    } = req.body;

    const claimantId = req.user._id;
    const claimantType = req.user.userType; // provider or vendor

    // Validate enrollment exists and is active
    const enrollment = await HMOEnrollment.findOne({
      _id: enrollmentId,
      userId: patientId,
      status: 'active'
    }).populate('planId');

    if (!enrollment) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Active enrollment not found for this patient'
      });
    }

    // Check if service date is within coverage period
    const serviceDateTime = new Date(serviceDate);
    if (serviceDateTime < enrollment.coverageStartDate || serviceDateTime > enrollment.coverageEndDate) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Service date is outside coverage period'
      });
    }

    // Get claimant details
    const claimant = await User.findById(claimantId);
    const claimantDetails = {
      name: `${claimant.profile?.firstName || ''} ${claimant.profile?.lastName || ''}`.trim(),
      facilityName: claimant.practice?.name || claimant.businessInfo?.name,
      licenseNumber: claimant.professionalInfo?.licenseNumber || claimant.businessInfo?.licenseNumber,
      specialty: claimant.professionalInfo?.specialization || claimant.businessInfo?.type,
      location: `${claimant.profile?.address?.city || ''}, ${claimant.profile?.address?.state || ''}`.trim(),
      contactPhone: claimant.phone,
      contactEmail: claimant.email
    };

    // Create claim
    const claim = new HMOClaim({
      enrollmentId,
      planId: enrollment.planId._id,
      patientId,
      claimantType,
      claimantId,
      claimantDetails,
      serviceType,
      serviceDate,
      dischargeDate,
      diagnosis,
      procedure,
      treatmentDetails,
      billing: {
        totalBilled: billing.totalBilled,
        breakdown: billing.breakdown,
        currency: billing.currency || 'USD'
      },
      documents,
      processing: {
        submittedAt: new Date(),
        receivedAt: new Date()
      },
      submittedVia: 'api',
      ipAddress: req.ip
    });

    // Calculate coverage based on plan
    await claim.calculateCoverage(enrollment.planId);

    // Check if it exceeds enrollment limits
    const totalClaimsAmount = enrollment.utilization.claimsAmount + claim.billing.coveredAmount;
    if (totalClaimsAmount > enrollment.limits.annualMaximum) {
      claim.billing.coveredAmount = Math.max(0, enrollment.limits.annualMaximum - enrollment.utilization.claimsAmount);
      claim.notes = 'Coverage limited due to annual maximum reached';
    }

    await claim.save();

    // Update enrollment utilization
    enrollment.utilization.claimsSubmitted += 1;
    enrollment.utilization.claimsAmount += claim.billing.coveredAmount;

    if (serviceType === 'outpatient' || serviceType === 'specialist_consultation') {
      enrollment.utilization.appointmentsUsed += 1;
    } else if (serviceType === 'prescription') {
      enrollment.utilization.prescriptionsUsed += 1;
    }

    await enrollment.save();

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Claim submitted successfully',
      data: claim
    });
  } catch (error) {
    console.error('Submit claim error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to submit claim',
      error: error.message
    });
  }
};

/**
 * Get claims submitted by current user (Provider/Vendor)
 * GET /api/hmo-claims/my-claims
 */
exports.getMyClaims = async (req, res) => {
  try {
    const { status, page = 1, limit = 20, startDate, endDate } = req.query;
    const claimantId = req.user._id;

    const query = { claimantId };

    if (status && status !== 'all') {
      query.status = status;
    }

    if (startDate || endDate) {
      query.serviceDate = {};
      if (startDate) query.serviceDate.$gte = new Date(startDate);
      if (endDate) query.serviceDate.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;

    const claims = await HMOClaim.find(query)
      .populate('patientId', 'profile.firstName profile.lastName email healthCardId')
      .populate('planId', 'name planCode')
      .populate('enrollmentId', 'enrollmentNumber membershipCardNumber')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await HMOClaim.countDocuments(query);

    // Get statistics
    const stats = await HMOClaim.aggregate([
      { $match: { claimantId: claimantId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$billing.totalBilled' },
          approvedAmount: { $sum: '$billing.approvedAmount' }
        }
      }
    ]);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: claims,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      statistics: stats
    });
  } catch (error) {
    console.error('Get my claims error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to fetch claims',
      error: error.message
    });
  }
};

/**
 * Get claim details by ID
 * GET /api/hmo-claims/:id
 */
exports.getClaimById = async (req, res) => {
  try {
    const { id } = req.params;

    const claim = await HMOClaim.findById(id)
      .populate('patientId', 'profile.firstName profile.lastName email healthCardId phone')
      .populate('planId')
      .populate('enrollmentId')
      .populate('claimantId', 'profile.firstName profile.lastName email userType')
      .populate('reviewedBy', 'profile.firstName profile.lastName email');

    if (!claim) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Claim not found'
      });
    }

    // Authorization check - only claimant, patient, or admin can view
    const userId = req.user._id.toString();
    const isClaimant = claim.claimantId._id.toString() === userId;
    const isPatient = claim.patientId._id.toString() === userId;
    const isAdmin = req.user.userType === 'super_admin';

    if (!isClaimant && !isPatient && !isAdmin) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'You do not have permission to view this claim'
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: claim
    });
  } catch (error) {
    console.error('Get claim by ID error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to fetch claim',
      error: error.message
    });
  }
};

/**
 * Update claim (add documents, update billing)
 * PUT /api/hmo-claims/:id
 */
exports.updateClaim = async (req, res) => {
  try {
    const { id } = req.params;
    const { documents, billing, notes } = req.body;

    const claim = await HMOClaim.findById(id);

    if (!claim) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Claim not found'
      });
    }

    // Only claimant can update, and only if status is submitted or under_review
    if (claim.claimantId.toString() !== req.user._id.toString()) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'You do not have permission to update this claim'
      });
    }

    if (!['submitted', 'under_review'].includes(claim.status)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Claim cannot be updated in current status'
      });
    }

    // Update fields
    if (documents) {
      claim.documents.push(...documents);
    }

    if (billing) {
      if (billing.totalBilled) claim.billing.totalBilled = billing.totalBilled;
      if (billing.breakdown) claim.billing.breakdown = billing.breakdown;
    }

    if (notes) {
      claim.notes = notes;
    }

    await claim.save();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Claim updated successfully',
      data: claim
    });
  } catch (error) {
    console.error('Update claim error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to update claim',
      error: error.message
    });
  }
};

// ==================== Provider-Specific Endpoints ====================

/**
 * Get patients enrolled in HMO plans under this provider
 * GET /api/providers/hmo-patients
 */
exports.getHMOPatients = async (req, res) => {
  try {
    const providerId = req.user._id;

    // Find enrollments where this provider is the primary care provider
    const enrollments = await HMOEnrollment.find({
      primaryCareProviderId: providerId,
      status: 'active'
    })
      .populate('userId', 'profile.firstName profile.lastName email phone healthCardId')
      .populate('planId', 'name planCode category')
      .sort({ createdAt: -1 });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: enrollments,
      count: enrollments.length
    });
  } catch (error) {
    console.error('Get HMO patients error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to fetch HMO patients',
      error: error.message
    });
  }
};

/**
 * Get patient's HMO coverage details (for providers)
 * GET /api/providers/patients/:patientId/hmo-coverage
 */
exports.getPatientCoverage = async (req, res) => {
  try {
    const { patientId } = req.params;

    const enrollment = await HMOEnrollment.findOne({
      userId: patientId,
      status: 'active'
    })
      .populate('planId')
      .populate('primaryCareProviderId', 'profile.firstName profile.lastName professionalInfo.specialization');

    if (!enrollment) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'No active HMO enrollment found for this patient'
      });
    }

    // Get recent claims
    const recentClaims = await HMOClaim.find({
      patientId,
      enrollmentId: enrollment._id
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('claimNumber serviceType serviceDate billing.totalBilled billing.approvedAmount status');

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        enrollment,
        coverage: enrollment.planId.coverage,
        limits: enrollment.limits,
        utilization: enrollment.utilization,
        recentClaims
      }
    });
  } catch (error) {
    console.error('Get patient coverage error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to fetch patient coverage',
      error: error.message
    });
  }
};

// ==================== Patient Claims Endpoints ====================

/**
 * Get patient's claims
 * GET /api/patients/my-claims
 */
exports.getMyPatientClaims = async (req, res) => {
  try {
    const patientId = req.user._id;
    const { status, page = 1, limit = 20 } = req.query;

    const query = { patientId };

    if (status && status !== 'all') {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    const claims = await HMOClaim.find(query)
      .populate('claimantId', 'profile.firstName profile.lastName userType')
      .populate('planId', 'name planCode')
      .populate('enrollmentId', 'enrollmentNumber')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await HMOClaim.countDocuments(query);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: claims,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get patient claims error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to fetch claims',
      error: error.message
    });
  }
};

/**
 * Submit claim appeal
 * POST /api/hmo-claims/:id/appeal
 */
exports.submitAppeal = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, documents } = req.body;

    const claim = await HMOClaim.findById(id);

    if (!claim) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Claim not found'
      });
    }

    // Only patient or claimant can appeal
    const userId = req.user._id.toString();
    const isPatient = claim.patientId.toString() === userId;
    const isClaimant = claim.claimantId.toString() === userId;

    if (!isPatient && !isClaimant) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'You do not have permission to appeal this claim'
      });
    }

    // Only rejected or partially_approved claims can be appealed
    if (!['rejected', 'partially_approved'].includes(claim.status)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Only rejected or partially approved claims can be appealed'
      });
    }

    // Check if already appealed
    if (claim.appeal.submitted) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Claim has already been appealed'
      });
    }

    claim.appeal = {
      submitted: true,
      submittedAt: new Date(),
      reason,
      documents: documents || [],
      status: 'pending'
    };

    claim.status = 'appealed';
    claim.statusHistory.push({
      status: 'appealed',
      notes: reason,
      changedAt: new Date(),
      changedBy: req.user._id
    });

    await claim.save();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Appeal submitted successfully',
      data: claim
    });
  } catch (error) {
    console.error('Submit appeal error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to submit appeal',
      error: error.message
    });
  }
};

module.exports = exports;
