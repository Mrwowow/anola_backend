const HMOClaim = require('../models/hmoClaim.model');
const HMOEnrollment = require('../models/hmoEnrollment.model');
const HMOPlan = require('../models/hmoPlan.model');
const Wallet = require('../models/wallet.model');
const Transaction = require('../models/transaction.model');
const { HTTP_STATUS } = require('../utils/constants');

// ==================== Super Admin Claims Management ====================

/**
 * Get all claims with filters
 * GET /api/super-admin/hmo-claims
 */
exports.getAllClaims = async (req, res) => {
  try {
    const {
      status,
      claimantType,
      serviceType,
      page = 1,
      limit = 20,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      search
    } = req.query;

    const query = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (claimantType && claimantType !== 'all') {
      query.claimantType = claimantType;
    }

    if (serviceType && serviceType !== 'all') {
      query.serviceType = serviceType;
    }

    if (startDate || endDate) {
      query.serviceDate = {};
      if (startDate) query.serviceDate.$gte = new Date(startDate);
      if (endDate) query.serviceDate.$lte = new Date(endDate);
    }

    if (minAmount || maxAmount) {
      query['billing.totalBilled'] = {};
      if (minAmount) query['billing.totalBilled'].$gte = parseFloat(minAmount);
      if (maxAmount) query['billing.totalBilled'].$lte = parseFloat(maxAmount);
    }

    if (search) {
      query.$or = [
        { claimNumber: { $regex: search, $options: 'i' } },
        { 'claimantDetails.name': { $regex: search, $options: 'i' } },
        { 'diagnosis.description': { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    const claims = await HMOClaim.find(query)
      .populate('patientId', 'profile.firstName profile.lastName email healthCardId')
      .populate('claimantId', 'profile.firstName profile.lastName email userType')
      .populate('planId', 'name planCode category')
      .populate('enrollmentId', 'enrollmentNumber membershipCardNumber')
      .populate('reviewedBy', 'profile.firstName profile.lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await HMOClaim.countDocuments(query);

    // Get summary statistics
    const summary = await HMOClaim.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalBilled: { $sum: '$billing.totalBilled' },
          totalApproved: { $sum: '$billing.approvedAmount' }
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
      summary
    });
  } catch (error) {
    console.error('Get all claims error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to fetch claims',
      error: error.message
    });
  }
};

/**
 * Get pending claims for review
 * GET /api/super-admin/hmo-claims/pending
 */
exports.getPendingClaims = async (req, res) => {
  try {
    const claims = await HMOClaim.getPendingClaims();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: claims,
      count: claims.length
    });
  } catch (error) {
    console.error('Get pending claims error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to fetch pending claims',
      error: error.message
    });
  }
};

/**
 * Assign claim for review
 * POST /api/super-admin/hmo-claims/:id/assign
 */
exports.assignClaimForReview = async (req, res) => {
  try {
    const { id } = req.params;

    const claim = await HMOClaim.findById(id);

    if (!claim) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Claim not found'
      });
    }

    if (claim.status !== 'submitted') {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Claim is not in submitted status'
      });
    }

    claim.status = 'under_review';
    claim.reviewedBy = req.user._id;
    claim.processing.assignedAt = new Date();
    claim.processing.reviewStartedAt = new Date();

    claim.statusHistory.push({
      status: 'under_review',
      notes: 'Claim assigned for review',
      changedAt: new Date(),
      changedBy: req.user._id
    });

    await claim.save();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Claim assigned for review',
      data: claim
    });
  } catch (error) {
    console.error('Assign claim error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to assign claim',
      error: error.message
    });
  }
};

/**
 * Approve claim
 * POST /api/super-admin/hmo-claims/:id/approve
 */
exports.approveClaim = async (req, res) => {
  try {
    const { id } = req.params;
    const { approvedAmount, notes, autoPayment = false } = req.body;

    const claim = await HMOClaim.findById(id)
      .populate('claimantId')
      .populate('enrollmentId');

    if (!claim) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Claim not found'
      });
    }

    if (!['submitted', 'under_review', 'appealed'].includes(claim.status)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Claim cannot be approved in current status'
      });
    }

    // Approve the claim
    const finalApprovedAmount = approvedAmount || claim.billing.coveredAmount;
    claim.approve(req.user._id, finalApprovedAmount, notes);

    // Update enrollment statistics
    const enrollment = claim.enrollmentId;
    enrollment.utilization.claimsApproved += 1;
    enrollment.utilization.claimsPending = Math.max(0, enrollment.utilization.claimsPending - 1);

    // Update deductible and out-of-pocket
    if (claim.billing.patientResponsibility.deductible > 0) {
      enrollment.limits.deductibleMet += claim.billing.patientResponsibility.deductible;
    }
    enrollment.limits.outOfPocketSpent += claim.billing.patientResponsibility.total;

    await enrollment.save();
    await claim.save();

    // If auto payment is enabled, initiate payment
    if (autoPayment && finalApprovedAmount > 0) {
      try {
        await processClaimPayment(claim, finalApprovedAmount);
      } catch (paymentError) {
        console.error('Auto payment failed:', paymentError);
        // Continue even if payment fails - admin can manually process
      }
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Claim approved successfully',
      data: claim
    });
  } catch (error) {
    console.error('Approve claim error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to approve claim',
      error: error.message
    });
  }
};

/**
 * Reject claim
 * POST /api/super-admin/hmo-claims/:id/reject
 */
exports.rejectClaim = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, notes } = req.body;

    if (!reason) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    const claim = await HMOClaim.findById(id).populate('enrollmentId');

    if (!claim) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Claim not found'
      });
    }

    if (!['submitted', 'under_review', 'appealed'].includes(claim.status)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Claim cannot be rejected in current status'
      });
    }

    // Reject the claim
    claim.reject(req.user._id, reason, notes);

    // Update enrollment statistics
    const enrollment = claim.enrollmentId;
    enrollment.utilization.claimsRejected = (enrollment.utilization.claimsRejected || 0) + 1;
    enrollment.utilization.claimsPending = Math.max(0, enrollment.utilization.claimsPending - 1);

    await enrollment.save();
    await claim.save();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Claim rejected',
      data: claim
    });
  } catch (error) {
    console.error('Reject claim error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to reject claim',
      error: error.message
    });
  }
};

/**
 * Partially approve claim
 * POST /api/super-admin/hmo-claims/:id/partial-approve
 */
exports.partiallyApproveClaim = async (req, res) => {
  try {
    const { id } = req.params;
    const { approvedAmount, rejectedAmount, notes } = req.body;

    if (!approvedAmount || !rejectedAmount) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Both approved and rejected amounts are required'
      });
    }

    const claim = await HMOClaim.findById(id).populate('enrollmentId');

    if (!claim) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Claim not found'
      });
    }

    claim.status = 'partially_approved';
    claim.reviewedBy = req.user._id;
    claim.reviewedAt = new Date();
    claim.reviewNotes = notes;
    claim.billing.approvedAmount = approvedAmount;
    claim.billing.rejectedAmount = rejectedAmount;

    claim.statusHistory.push({
      status: 'partially_approved',
      notes,
      changedAt: new Date(),
      changedBy: req.user._id
    });

    claim.processing.reviewCompletedAt = new Date();

    // Update enrollment
    const enrollment = claim.enrollmentId;
    enrollment.utilization.claimsApproved += 1;
    enrollment.utilization.claimsPending = Math.max(0, enrollment.utilization.claimsPending - 1);

    await enrollment.save();
    await claim.save();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Claim partially approved',
      data: claim
    });
  } catch (error) {
    console.error('Partial approve claim error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to partially approve claim',
      error: error.message
    });
  }
};

/**
 * Process payment for approved claim
 * POST /api/super-admin/hmo-claims/:id/process-payment
 */
exports.processPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentMethod = 'bank_transfer', notes } = req.body;

    const claim = await HMOClaim.findById(id)
      .populate('claimantId')
      .populate('planId');

    if (!claim) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Claim not found'
      });
    }

    if (claim.status !== 'approved') {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Only approved claims can be paid'
      });
    }

    if (claim.billing.amountPaid > 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Claim has already been paid'
      });
    }

    // Process payment
    const paymentResult = await processClaimPayment(claim, claim.billing.approvedAmount, paymentMethod);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Payment processed successfully',
      data: {
        claim,
        payment: paymentResult
      }
    });
  } catch (error) {
    console.error('Process payment error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to process payment',
      error: error.message
    });
  }
};

/**
 * Review appeal
 * POST /api/super-admin/hmo-claims/:id/review-appeal
 */
exports.reviewAppeal = async (req, res) => {
  try {
    const { id } = req.params;
    const { decision, notes, approvedAmount } = req.body; // decision: 'approved' or 'rejected'

    const claim = await HMOClaim.findById(id).populate('enrollmentId');

    if (!claim) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Claim not found'
      });
    }

    if (claim.status !== 'appealed') {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Claim is not in appealed status'
      });
    }

    claim.appeal.status = decision === 'approved' ? 'approved' : 'rejected';
    claim.appeal.reviewedAt = new Date();
    claim.appeal.reviewNotes = notes;

    if (decision === 'approved') {
      claim.status = 'approved';
      claim.billing.approvedAmount = approvedAmount || claim.billing.coveredAmount;

      const enrollment = claim.enrollmentId;
      enrollment.utilization.claimsApproved += 1;
      await enrollment.save();
    } else {
      claim.status = 'rejected';
    }

    claim.reviewedBy = req.user._id;
    claim.reviewedAt = new Date();

    claim.statusHistory.push({
      status: claim.status,
      notes: `Appeal ${decision}: ${notes}`,
      changedAt: new Date(),
      changedBy: req.user._id
    });

    await claim.save();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: `Appeal ${decision}`,
      data: claim
    });
  } catch (error) {
    console.error('Review appeal error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to review appeal',
      error: error.message
    });
  }
};

/**
 * Get claims analytics
 * GET /api/super-admin/hmo-claims/analytics
 */
exports.getClaimsAnalytics = async (req, res) => {
  try {
    const { startDate, endDate, planId } = req.query;

    const matchQuery = {};
    if (startDate || endDate) {
      matchQuery.createdAt = {};
      if (startDate) matchQuery.createdAt.$gte = new Date(startDate);
      if (endDate) matchQuery.createdAt.$lte = new Date(endDate);
    }
    if (planId) matchQuery.planId = mongoose.Types.ObjectId(planId);

    // Overall statistics
    const overallStats = await HMOClaim.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalClaims: { $sum: 1 },
          totalBilled: { $sum: '$billing.totalBilled' },
          totalApproved: { $sum: '$billing.approvedAmount' },
          totalPaid: { $sum: '$billing.amountPaid' },
          avgProcessingTime: { $avg: '$processing.processingTimeHours' }
        }
      }
    ]);

    // Claims by status
    const byStatus = await HMOClaim.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$billing.totalBilled' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Claims by service type
    const byServiceType = await HMOClaim.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$serviceType',
          count: { $sum: 1 },
          totalBilled: { $sum: '$billing.totalBilled' },
          totalApproved: { $sum: '$billing.approvedAmount' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Claims by claimant type
    const byClaimantType = await HMOClaim.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$claimantType',
          count: { $sum: 1 },
          totalBilled: { $sum: '$billing.totalBilled' }
        }
      }
    ]);

    // Top claimants
    const topClaimants = await HMOClaim.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$claimantId',
          claimantName: { $first: '$claimantDetails.name' },
          claimantType: { $first: '$claimantType' },
          totalClaims: { $sum: 1 },
          totalBilled: { $sum: '$billing.totalBilled' },
          totalApproved: { $sum: '$billing.approvedAmount' }
        }
      },
      { $sort: { totalBilled: -1 } },
      { $limit: 10 }
    ]);

    // Monthly trend
    const monthlyTrend = await HMOClaim.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 },
          totalBilled: { $sum: '$billing.totalBilled' },
          totalApproved: { $sum: '$billing.approvedAmount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        overview: overallStats[0] || {},
        byStatus,
        byServiceType,
        byClaimantType,
        topClaimants,
        monthlyTrend
      }
    });
  } catch (error) {
    console.error('Get claims analytics error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to fetch analytics',
      error: error.message
    });
  }
};

// ==================== Helper Functions ====================

/**
 * Process payment for a claim
 */
async function processClaimPayment(claim, amount, paymentMethod = 'bank_transfer') {
  const claimant = claim.claimantId;

  // Get or create wallet for claimant
  let wallet = await Wallet.findOne({ userId: claimant._id });

  if (!wallet) {
    wallet = await Wallet.create({
      userId: claimant._id,
      balance: {
        available: 0,
        pending: 0,
        reserved: 0
      },
      currency: 'USD'
    });
  }

  // Create transaction
  const transaction = await Transaction.create({
    type: 'credit',
    category: 'hmo_claim_payment',
    amount: {
      value: amount,
      currency: claim.billing.currency || 'USD'
    },
    from: {
      type: 'system',
      name: 'HMO Insurance'
    },
    to: {
      userId: claimant._id,
      type: 'wallet'
    },
    status: 'completed',
    metadata: {
      claimId: claim._id,
      claimNumber: claim.claimNumber,
      planId: claim.planId,
      enrollmentId: claim.enrollmentId
    },
    description: `HMO claim payment - ${claim.claimNumber}`
  });

  // Update wallet balance
  wallet.balance.available += amount;
  await wallet.save();

  // Mark claim as paid
  claim.markAsPaid({
    amount,
    method: paymentMethod,
    reference: transaction._id.toString()
  });
  await claim.save();

  return {
    transaction,
    wallet
  };
}

module.exports = exports;
