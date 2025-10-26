const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const { authenticate } = require('../middleware/auth.middleware');

// ==================== Payment Initialization ====================

/**
 * @route POST /api/payments/hmo-enrollment/initialize
 * @desc Initialize payment for HMO enrollment
 * @access Private (Patient)
 * @body {
 *   enrollmentId: string,
 *   amount: number,
 *   currency?: string (default: 'USD'),
 *   gateway?: string ('stripe' | 'paystack' - auto-selected if not provided),
 *   paymentMethod?: string (default: 'card')
 * }
 * @returns {
 *   success: boolean,
 *   data: {
 *     gateway: string,
 *     reference: string,
 *     clientSecret?: string (Stripe),
 *     authorizationUrl?: string (Paystack),
 *     amount: number,
 *     currency: string
 *   }
 * }
 */
router.post(
  '/hmo-enrollment/initialize',
  authenticate,
  paymentController.initializeEnrollmentPayment
);

/**
 * @route POST /api/payments/wallet/initialize
 * @desc Initialize wallet funding payment
 * @access Private (All authenticated users)
 * @body {
 *   amount: number,
 *   currency?: string (default: 'USD'),
 *   gateway?: string ('stripe' | 'paystack')
 * }
 * @returns {
 *   success: boolean,
 *   data: {
 *     gateway: string,
 *     reference: string,
 *     clientSecret?: string (Stripe),
 *     authorizationUrl?: string (Paystack)
 *   }
 * }
 */
router.post(
  '/wallet/initialize',
  authenticate,
  paymentController.initializeWalletFunding
);

// ==================== Payment Verification ====================

/**
 * @route POST /api/payments/verify
 * @desc Verify payment status and process completion
 * @access Private
 * @body {
 *   gateway: string ('stripe' | 'paystack'),
 *   reference: string (payment reference or intent ID)
 * }
 * @returns {
 *   success: boolean,
 *   data: {
 *     status: string,
 *     amount: number,
 *     currency: string,
 *     metadata: object
 *   }
 * }
 */
router.post('/verify', authenticate, paymentController.verifyPayment);

// ==================== Webhooks (Public - No Auth) ====================

/**
 * @route POST /api/payments/webhooks/stripe
 * @desc Stripe webhook handler for payment events
 * @access Public (Stripe signature verified)
 * @headers {
 *   stripe-signature: string
 * }
 * @body Stripe event payload
 * @returns { received: boolean }
 *
 * Events handled:
 * - payment_intent.succeeded
 * - payment_intent.payment_failed
 * - charge.refunded
 */
router.post('/webhooks/stripe', paymentController.stripeWebhook);

/**
 * @route POST /api/payments/webhooks/paystack
 * @desc Paystack webhook handler for payment events
 * @access Public (Paystack signature verified)
 * @headers {
 *   x-paystack-signature: string
 * }
 * @body Paystack event payload
 * @returns { received: boolean }
 *
 * Events handled:
 * - charge.success
 * - charge.failed
 * - refund.processed
 */
router.post('/webhooks/paystack', paymentController.paystackWebhook);

// ==================== Refunds ====================

/**
 * @route POST /api/payments/refund
 * @desc Create a refund for a payment
 * @access Private (Super Admin only - should add role check)
 * @body {
 *   gateway: string ('stripe' | 'paystack'),
 *   reference: string (payment reference to refund),
 *   amount?: number (optional, full refund if not specified),
 *   reason?: string
 * }
 * @returns {
 *   success: boolean,
 *   data: {
 *     refundId: string,
 *     amount: number,
 *     status: string
 *   }
 * }
 */
router.post('/refund', authenticate, paymentController.createRefund);

// ==================== Payment History ====================

/**
 * @route GET /api/payments/history
 * @desc Get user's payment history
 * @access Private
 * @query {
 *   page?: number (default: 1),
 *   limit?: number (default: 20),
 *   category?: string (filter by category),
 *   gateway?: string (filter by gateway)
 * }
 * @returns {
 *   success: boolean,
 *   data: Transaction[],
 *   pagination: {
 *     page: number,
 *     limit: number,
 *     total: number,
 *     pages: number
 *   }
 * }
 */
router.get('/history', authenticate, paymentController.getPaymentHistory);

module.exports = router;
