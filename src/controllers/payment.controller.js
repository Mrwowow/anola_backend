const paymentService = require('../services/payment.service');
const HMOEnrollment = require('../models/hmoEnrollment.model');
const Wallet = require('../models/wallet.model');
const Transaction = require('../models/transaction.model');
const { HTTP_STATUS } = require('../utils/constants');

// ==================== Payment Initialization ====================

/**
 * Initialize payment for HMO enrollment
 * POST /api/payments/hmo-enrollment/initialize
 */
exports.initializeEnrollmentPayment = async (req, res) => {
  try {
    const {
      enrollmentId,
      amount,
      currency = 'USD',
      gateway, // 'stripe' or 'paystack' (optional - auto-selected based on currency)
      paymentMethod = 'card',
    } = req.body;

    const userId = req.user._id;
    const userEmail = req.user.email;
    const userName = `${req.user.profile?.firstName || ''} ${req.user.profile?.lastName || ''}`.trim();

    // Validate enrollment
    const enrollment = await HMOEnrollment.findOne({
      _id: enrollmentId,
      userId,
    }).populate('planId');

    if (!enrollment) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Enrollment not found',
      });
    }

    // Check if already paid
    if (enrollment.payment?.status === 'paid') {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Enrollment payment already completed',
      });
    }

    // Prepare payment metadata
    const metadata = {
      userId: userId.toString(),
      userType: req.user.userType,
      enrollmentId: enrollmentId.toString(),
      planId: enrollment.planId._id.toString(),
      planName: enrollment.planId.name,
      email: userEmail,
      name: userName,
      category: 'hmo_enrollment',
      description: `HMO Enrollment Payment - ${enrollment.planId.name}`,
    };

    // Initialize payment based on gateway
    const paymentData = {
      amount,
      currency,
      gateway,
      email: userEmail,
      metadata,
      description: metadata.description,
      customerId: req.user.stripeCustomerId, // If user has existing Stripe customer ID
      callbackUrl: `${process.env.CLIENT_URL}/enrollments/${enrollmentId}/payment-callback`,
      successUrl: `${process.env.CLIENT_URL}/enrollments/${enrollmentId}/payment-success`,
      cancelUrl: `${process.env.CLIENT_URL}/enrollments/${enrollmentId}/payment-cancel`,
    };

    const paymentResponse = await paymentService.initializePayment(paymentData);

    // Update enrollment with payment reference
    enrollment.payment = {
      ...enrollment.payment,
      gateway: paymentResponse.gateway,
      reference: paymentResponse.reference || paymentResponse.paymentIntentId,
      amount,
      currency,
      status: 'pending',
    };
    await enrollment.save();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: paymentResponse,
      message: 'Payment initialized successfully',
    });
  } catch (error) {
    console.error('Initialize enrollment payment error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to initialize payment',
      error: error.message,
    });
  }
};

/**
 * Initialize wallet funding payment
 * POST /api/payments/wallet/initialize
 */
exports.initializeWalletFunding = async (req, res) => {
  try {
    const {
      amount,
      currency = 'USD',
      gateway,
    } = req.body;

    const userId = req.user._id;
    const userEmail = req.user.email;
    const userName = `${req.user.profile?.firstName || ''} ${req.user.profile?.lastName || ''}`.trim();

    if (!amount || amount <= 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Invalid amount',
      });
    }

    const metadata = {
      userId: userId.toString(),
      userType: req.user.userType,
      email: userEmail,
      name: userName,
      category: 'wallet_funding',
      description: `Wallet Funding - $${amount}`,
    };

    const paymentData = {
      amount,
      currency,
      gateway,
      email: userEmail,
      metadata,
      description: metadata.description,
      callbackUrl: `${process.env.CLIENT_URL}/wallet/payment-callback`,
      successUrl: `${process.env.CLIENT_URL}/wallet/payment-success`,
      cancelUrl: `${process.env.CLIENT_URL}/wallet`,
    };

    const paymentResponse = await paymentService.initializePayment(paymentData);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: paymentResponse,
      message: 'Wallet funding initialized successfully',
    });
  } catch (error) {
    console.error('Initialize wallet funding error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to initialize wallet funding',
      error: error.message,
    });
  }
};

// ==================== Payment Verification ====================

/**
 * Verify payment
 * POST /api/payments/verify
 */
exports.verifyPayment = async (req, res) => {
  try {
    const { gateway, reference } = req.body;

    if (!gateway || !reference) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Gateway and reference are required',
      });
    }

    // Verify payment with gateway
    const verificationResult = await paymentService.verifyPayment(gateway, reference);

    if (!verificationResult.success) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Payment verification failed',
        data: verificationResult,
      });
    }

    // Process successful payment
    const metadata = verificationResult.metadata || {};

    if (metadata.category === 'hmo_enrollment') {
      // Update enrollment payment status
      const enrollment = await HMOEnrollment.findById(metadata.enrollmentId);

      if (enrollment) {
        enrollment.payment.status = 'paid';
        enrollment.payment.paidAt = new Date();
        enrollment.payment.transactionId = reference;

        // Activate enrollment if it was pending payment
        if (enrollment.status === 'pending') {
          enrollment.status = 'active';
        }

        await enrollment.save();
      }
    } else if (metadata.category === 'wallet_funding') {
      // Process wallet funding
      await paymentService.processSuccessfulPayment({
        userId: metadata.userId,
        amount: verificationResult.amount,
        currency: verificationResult.currency,
        gateway,
        reference,
        metadata,
        description: metadata.description,
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: verificationResult,
      message: 'Payment verified successfully',
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to verify payment',
      error: error.message,
    });
  }
};

// ==================== Webhooks ====================

/**
 * Stripe webhook handler
 * POST /api/payments/webhooks/stripe
 */
exports.stripeWebhook = async (req, res) => {
  try {
    const signature = req.headers['stripe-signature'];
    const payload = req.body;

    // Verify webhook signature
    const event = paymentService.verifyStripeWebhook(
      JSON.stringify(payload),
      signature
    );

    console.log('Stripe webhook event:', event.type);

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        const metadata = paymentIntent.metadata;

        if (metadata.category === 'hmo_enrollment') {
          // Update enrollment
          const enrollment = await HMOEnrollment.findById(metadata.enrollmentId);
          if (enrollment) {
            enrollment.payment.status = 'paid';
            enrollment.payment.paidAt = new Date();
            enrollment.payment.transactionId = paymentIntent.id;

            if (enrollment.status === 'pending') {
              enrollment.status = 'active';
            }

            await enrollment.save();
          }
        } else if (metadata.category === 'wallet_funding') {
          // Process wallet funding
          await paymentService.processSuccessfulPayment({
            userId: metadata.userId,
            amount: paymentIntent.amount / 100,
            currency: paymentIntent.currency,
            gateway: 'stripe',
            reference: paymentIntent.id,
            metadata,
            description: metadata.description,
          });
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        const metadata = paymentIntent.metadata;

        if (metadata.category === 'hmo_enrollment') {
          const enrollment = await HMOEnrollment.findById(metadata.enrollmentId);
          if (enrollment) {
            enrollment.payment.status = 'failed';
            await enrollment.save();
          }
        }
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object;
        // Handle refund
        console.log('Refund processed:', charge.id);
        break;
      }

      default:
        console.log(`Unhandled Stripe event type: ${event.type}`);
    }

    res.status(HTTP_STATUS.OK).json({ received: true });
  } catch (error) {
    console.error('Stripe webhook error:', error);
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'Webhook verification failed',
      error: error.message,
    });
  }
};

/**
 * Paystack webhook handler
 * POST /api/payments/webhooks/paystack
 */
exports.paystackWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-paystack-signature'];
    const payload = JSON.stringify(req.body);

    // Verify webhook signature
    const isValid = paymentService.verifyPaystackWebhook(payload, signature);

    if (!isValid) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Invalid webhook signature',
      });
    }

    const event = req.body;
    console.log('Paystack webhook event:', event.event);

    // Handle different event types
    switch (event.event) {
      case 'charge.success': {
        const data = event.data;
        const metadata = data.metadata;

        if (metadata.category === 'hmo_enrollment') {
          // Update enrollment
          const enrollment = await HMOEnrollment.findById(metadata.enrollmentId);
          if (enrollment) {
            enrollment.payment.status = 'paid';
            enrollment.payment.paidAt = new Date();
            enrollment.payment.transactionId = data.reference;

            if (enrollment.status === 'pending') {
              enrollment.status = 'active';
            }

            await enrollment.save();
          }
        } else if (metadata.category === 'wallet_funding') {
          // Process wallet funding
          await paymentService.processSuccessfulPayment({
            userId: metadata.userId,
            amount: data.amount / 100,
            currency: data.currency,
            gateway: 'paystack',
            reference: data.reference,
            metadata,
            description: metadata.description,
          });
        }
        break;
      }

      case 'charge.failed': {
        const data = event.data;
        const metadata = data.metadata;

        if (metadata.category === 'hmo_enrollment') {
          const enrollment = await HMOEnrollment.findById(metadata.enrollmentId);
          if (enrollment) {
            enrollment.payment.status = 'failed';
            await enrollment.save();
          }
        }
        break;
      }

      case 'refund.processed': {
        const data = event.data;
        console.log('Refund processed:', data.reference);
        break;
      }

      default:
        console.log(`Unhandled Paystack event type: ${event.event}`);
    }

    res.status(HTTP_STATUS.OK).json({ received: true });
  } catch (error) {
    console.error('Paystack webhook error:', error);
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'Webhook processing failed',
      error: error.message,
    });
  }
};

// ==================== Refunds ====================

/**
 * Create refund
 * POST /api/payments/refund
 */
exports.createRefund = async (req, res) => {
  try {
    const { gateway, reference, amount, reason } = req.body;

    if (!gateway || !reference) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Gateway and reference are required',
      });
    }

    const refund = await paymentService.createRefund(gateway, reference, amount);

    // Create transaction record for refund
    await Transaction.create({
      type: 'debit',
      category: 'refund',
      amount: {
        value: refund.amount,
        currency: 'USD', // Should be from original transaction
      },
      from: {
        userId: req.user._id,
        type: 'wallet',
      },
      to: {
        type: 'external',
        name: gateway.charAt(0).toUpperCase() + gateway.slice(1),
      },
      status: 'completed',
      paymentGateway: gateway,
      paymentReference: refund.refundId,
      metadata: {
        originalReference: reference,
        reason,
      },
      description: `Refund for ${reference}`,
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: refund,
      message: 'Refund processed successfully',
    });
  } catch (error) {
    console.error('Create refund error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to process refund',
      error: error.message,
    });
  }
};

// ==================== Payment History ====================

/**
 * Get user's payment history
 * GET /api/payments/history
 */
exports.getPaymentHistory = async (req, res) => {
  try {
    const { page = 1, limit = 20, category, gateway } = req.query;
    const userId = req.user._id;

    const query = {
      $or: [
        { 'from.userId': userId },
        { 'to.userId': userId },
      ],
    };

    if (category) {
      query.category = category;
    }

    if (gateway) {
      query.paymentGateway = gateway;
    }

    const skip = (page - 1) * limit;

    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Transaction.countDocuments(query);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to fetch payment history',
      error: error.message,
    });
  }
};

module.exports = exports;
