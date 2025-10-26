const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Paystack = require('paystack');
const crypto = require('crypto');
const Transaction = require('../models/transaction.model');
const Wallet = require('../models/wallet.model');

// Initialize Paystack
const paystack = new Paystack(process.env.PAYSTACK_SECRET_KEY);

/**
 * Payment Service - Handles Stripe and Paystack integrations
 */
class PaymentService {
  constructor() {
    this.stripe = stripe;
    this.paystack = paystack;
  }

  // ==================== STRIPE INTEGRATION ====================

  /**
   * Initialize Stripe payment
   * @param {Object} paymentData - Payment information
   * @returns {Object} Payment intent or session
   */
  async initializeStripePayment(paymentData) {
    try {
      const { amount, currency = 'usd', metadata, customerId, description } = paymentData;

      // Create or retrieve customer
      let customer;
      if (customerId) {
        customer = await this.stripe.customers.retrieve(customerId);
      } else {
        customer = await this.stripe.customers.create({
          email: metadata.email,
          name: metadata.name,
          metadata: {
            userId: metadata.userId,
            userType: metadata.userType,
          },
        });
      }

      // Create payment intent
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: currency.toLowerCase(),
        customer: customer.id,
        description: description || 'Anola Health Payment',
        metadata: {
          ...metadata,
          paymentGateway: 'stripe',
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      return {
        success: true,
        gateway: 'stripe',
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        customerId: customer.id,
        amount: amount,
        currency,
        status: paymentIntent.status,
      };
    } catch (error) {
      console.error('Stripe payment initialization error:', error);
      throw new Error(`Stripe payment failed: ${error.message}`);
    }
  }

  /**
   * Verify Stripe payment
   * @param {String} paymentIntentId - Stripe payment intent ID
   * @returns {Object} Payment status
   */
  async verifyStripePayment(paymentIntentId) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);

      return {
        success: paymentIntent.status === 'succeeded',
        status: paymentIntent.status,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        metadata: paymentIntent.metadata,
        paymentMethod: paymentIntent.payment_method,
      };
    } catch (error) {
      console.error('Stripe verification error:', error);
      throw new Error(`Stripe verification failed: ${error.message}`);
    }
  }

  /**
   * Create Stripe checkout session (for hosted checkout page)
   * @param {Object} sessionData - Checkout session data
   * @returns {Object} Checkout session
   */
  async createStripeCheckoutSession(sessionData) {
    try {
      const {
        amount,
        currency = 'usd',
        successUrl,
        cancelUrl,
        metadata,
        lineItems,
      } = sessionData;

      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: lineItems || [
          {
            price_data: {
              currency: currency.toLowerCase(),
              product_data: {
                name: metadata.productName || 'HMO Enrollment',
                description: metadata.description,
              },
              unit_amount: Math.round(amount * 100),
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          ...metadata,
          paymentGateway: 'stripe',
        },
      });

      return {
        success: true,
        gateway: 'stripe',
        sessionId: session.id,
        url: session.url,
      };
    } catch (error) {
      console.error('Stripe checkout session error:', error);
      throw new Error(`Stripe checkout failed: ${error.message}`);
    }
  }

  /**
   * Create Stripe refund
   * @param {String} paymentIntentId - Payment intent to refund
   * @param {Number} amount - Amount to refund (optional, full refund if not specified)
   * @returns {Object} Refund details
   */
  async createStripeRefund(paymentIntentId, amount = null) {
    try {
      const refundData = { payment_intent: paymentIntentId };
      if (amount) {
        refundData.amount = Math.round(amount * 100);
      }

      const refund = await this.stripe.refunds.create(refundData);

      return {
        success: true,
        refundId: refund.id,
        amount: refund.amount / 100,
        status: refund.status,
      };
    } catch (error) {
      console.error('Stripe refund error:', error);
      throw new Error(`Stripe refund failed: ${error.message}`);
    }
  }

  // ==================== PAYSTACK INTEGRATION ====================

  /**
   * Initialize Paystack payment
   * @param {Object} paymentData - Payment information
   * @returns {Object} Payment initialization response
   */
  async initializePaystackPayment(paymentData) {
    try {
      const { amount, email, metadata, currency = 'NGN', callbackUrl } = paymentData;

      const response = await this.paystack.transaction.initialize({
        amount: Math.round(amount * 100), // Convert to kobo/cents
        email,
        currency: currency.toUpperCase(),
        callback_url: callbackUrl,
        metadata: {
          ...metadata,
          paymentGateway: 'paystack',
        },
      });

      if (!response.status) {
        throw new Error(response.message || 'Paystack initialization failed');
      }

      return {
        success: true,
        gateway: 'paystack',
        reference: response.data.reference,
        authorizationUrl: response.data.authorization_url,
        accessCode: response.data.access_code,
        amount: amount,
        currency,
      };
    } catch (error) {
      console.error('Paystack payment initialization error:', error);
      throw new Error(`Paystack payment failed: ${error.message}`);
    }
  }

  /**
   * Verify Paystack payment
   * @param {String} reference - Paystack transaction reference
   * @returns {Object} Payment verification result
   */
  async verifyPaystackPayment(reference) {
    try {
      const response = await this.paystack.transaction.verify({
        reference,
      });

      if (!response.status) {
        throw new Error(response.message || 'Paystack verification failed');
      }

      const data = response.data;

      return {
        success: data.status === 'success',
        status: data.status,
        reference: data.reference,
        amount: data.amount / 100,
        currency: data.currency,
        metadata: data.metadata,
        paidAt: data.paid_at,
        channel: data.channel,
      };
    } catch (error) {
      console.error('Paystack verification error:', error);
      throw new Error(`Paystack verification failed: ${error.message}`);
    }
  }

  /**
   * Create Paystack refund
   * @param {String} reference - Transaction reference
   * @param {Number} amount - Amount to refund (optional)
   * @returns {Object} Refund details
   */
  async createPaystackRefund(reference, amount = null) {
    try {
      const refundData = { transaction: reference };
      if (amount) {
        refundData.amount = Math.round(amount * 100);
      }

      const response = await this.paystack.refund.create(refundData);

      if (!response.status) {
        throw new Error(response.message || 'Paystack refund failed');
      }

      return {
        success: true,
        refundId: response.data.id,
        amount: response.data.amount / 100,
        status: response.data.status,
      };
    } catch (error) {
      console.error('Paystack refund error:', error);
      throw new Error(`Paystack refund failed: ${error.message}`);
    }
  }

  // ==================== WEBHOOK VERIFICATION ====================

  /**
   * Verify Stripe webhook signature
   * @param {String} payload - Request body
   * @param {String} signature - Stripe signature header
   * @returns {Object} Verified event
   */
  verifyStripeWebhook(payload, signature) {
    try {
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );

      return event;
    } catch (error) {
      console.error('Stripe webhook verification error:', error);
      throw new Error(`Invalid Stripe webhook: ${error.message}`);
    }
  }

  /**
   * Verify Paystack webhook signature
   * @param {String} payload - Request body
   * @param {String} signature - Paystack signature header
   * @returns {Boolean} Verification result
   */
  verifyPaystackWebhook(payload, signature) {
    try {
      const hash = crypto
        .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
        .update(payload)
        .digest('hex');

      return hash === signature;
    } catch (error) {
      console.error('Paystack webhook verification error:', error);
      throw new Error(`Invalid Paystack webhook: ${error.message}`);
    }
  }

  // ==================== UNIFIED PAYMENT METHODS ====================

  /**
   * Initialize payment (auto-select gateway based on currency)
   * @param {Object} paymentData - Payment information
   * @returns {Object} Payment initialization response
   */
  async initializePayment(paymentData) {
    const { gateway, currency = 'usd' } = paymentData;

    // Auto-select gateway based on currency if not specified
    let selectedGateway = gateway;
    if (!selectedGateway) {
      selectedGateway = ['NGN', 'GHS', 'ZAR'].includes(currency.toUpperCase())
        ? 'paystack'
        : 'stripe';
    }

    if (selectedGateway === 'stripe') {
      return await this.initializeStripePayment(paymentData);
    } else if (selectedGateway === 'paystack') {
      return await this.initializePaystackPayment(paymentData);
    } else {
      throw new Error(`Unsupported payment gateway: ${selectedGateway}`);
    }
  }

  /**
   * Verify payment
   * @param {String} gateway - Payment gateway
   * @param {String} reference - Payment reference/ID
   * @returns {Object} Verification result
   */
  async verifyPayment(gateway, reference) {
    if (gateway === 'stripe') {
      return await this.verifyStripePayment(reference);
    } else if (gateway === 'paystack') {
      return await this.verifyPaystackPayment(reference);
    } else {
      throw new Error(`Unsupported payment gateway: ${gateway}`);
    }
  }

  /**
   * Process successful payment and update wallet
   * @param {Object} paymentData - Verified payment data
   * @returns {Object} Transaction record
   */
  async processSuccessfulPayment(paymentData) {
    try {
      const {
        userId,
        amount,
        currency,
        gateway,
        reference,
        metadata,
        description,
      } = paymentData;

      // Get or create wallet
      let wallet = await Wallet.findOne({ userId });
      if (!wallet) {
        wallet = await Wallet.create({
          userId,
          balance: {
            available: 0,
            pending: 0,
            reserved: 0,
          },
          currency: currency || 'USD',
        });
      }

      // Create transaction record
      const transaction = await Transaction.create({
        type: 'credit',
        category: metadata?.category || 'payment',
        amount: {
          value: amount,
          currency: currency || 'USD',
        },
        from: {
          type: 'external',
          name: gateway.charAt(0).toUpperCase() + gateway.slice(1),
        },
        to: {
          userId,
          type: 'wallet',
        },
        status: 'completed',
        paymentGateway: gateway,
        paymentReference: reference,
        metadata: {
          ...metadata,
          gateway,
          reference,
        },
        description: description || `Payment via ${gateway}`,
      });

      // Update wallet balance
      wallet.balance.available += amount;
      await wallet.save();

      return {
        success: true,
        transaction,
        wallet,
      };
    } catch (error) {
      console.error('Process payment error:', error);
      throw new Error(`Failed to process payment: ${error.message}`);
    }
  }

  /**
   * Create refund
   * @param {String} gateway - Payment gateway
   * @param {String} reference - Payment reference
   * @param {Number} amount - Refund amount
   * @returns {Object} Refund details
   */
  async createRefund(gateway, reference, amount = null) {
    if (gateway === 'stripe') {
      return await this.createStripeRefund(reference, amount);
    } else if (gateway === 'paystack') {
      return await this.createPaystackRefund(reference, amount);
    } else {
      throw new Error(`Unsupported payment gateway: ${gateway}`);
    }
  }
}

module.exports = new PaymentService();
