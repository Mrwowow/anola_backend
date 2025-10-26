# Payment Integration Guide - Stripe & Paystack

## Overview

The Anola Health platform now supports dual payment gateway integration with **Stripe** (for international payments) and **Paystack** (for African markets). The system automatically selects the appropriate gateway based on the currency or allows manual gateway selection.

---

## Table of Contents

1. [Features](#features)
2. [Gateway Selection Logic](#gateway-selection-logic)
3. [Environment Setup](#environment-setup)
4. [API Endpoints](#api-endpoints)
5. [Payment Flows](#payment-flows)
6. [Webhook Configuration](#webhook-configuration)
7. [Frontend Integration](#frontend-integration)
8. [Testing](#testing)
9. [Error Handling](#error-handling)
10. [Security Considerations](#security-considerations)

---

## Features

### Supported Payment Types

- **HMO Enrollment Payments** - Pay for HMO plan enrollments
- **Wallet Funding** - Add funds to user wallets
- **Automatic Refunds** - Process refunds through either gateway
- **Payment Verification** - Verify payment status
- **Webhook Integration** - Real-time payment status updates
- **Transaction History** - Complete payment history tracking

### Gateway Capabilities

| Feature | Stripe | Paystack |
|---------|--------|----------|
| Currencies | USD, EUR, GBP, CAD, etc. | NGN, GHS, ZAR, KES |
| Payment Methods | Cards, Apple Pay, Google Pay | Cards, Bank Transfer, USSD |
| Webhooks | ✅ | ✅ |
| Refunds | ✅ | ✅ |
| Subscriptions | ✅ | ✅ |

---

## Gateway Selection Logic

### Automatic Selection

The system automatically selects the payment gateway based on currency:

```javascript
// Paystack for African currencies
['NGN', 'GHS', 'ZAR', 'KES'].includes(currency) ? 'paystack' : 'stripe'
```

**Paystack Currencies:**
- NGN (Nigerian Naira)
- GHS (Ghanaian Cedi)
- ZAR (South African Rand)
- KES (Kenyan Shilling) - coming soon

**Stripe Currencies:**
- USD (US Dollar)
- EUR (Euro)
- GBP (British Pound)
- CAD (Canadian Dollar)
- And 100+ more currencies

### Manual Selection

You can explicitly specify the gateway in API requests:

```json
{
  "amount": 50000,
  "currency": "NGN",
  "gateway": "paystack"  // Explicitly use Paystack
}
```

---

## Environment Setup

### 1. Install Dependencies

The required packages are already installed:
- `stripe` - Stripe SDK
- `paystack` - Paystack SDK

### 2. Configure Environment Variables

Update your `.env` file with payment gateway credentials:

```env
# Stripe Configuration (Get from https://dashboard.stripe.com/apikeys)
STRIPE_SECRET_KEY=sk_test_... or sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Paystack Configuration (Get from https://dashboard.paystack.com/#/settings/developer)
PAYSTACK_SECRET_KEY=sk_test_... or sk_live_...
PAYSTACK_PUBLIC_KEY=pk_test_... or pk_live_...

# Frontend URL for payment callbacks
CLIENT_URL=https://yourdomain.com
```

### 3. Get API Keys

#### Stripe Setup
1. Sign up at [stripe.com](https://stripe.com)
2. Go to [Dashboard > Developers > API Keys](https://dashboard.stripe.com/apikeys)
3. Copy your **Secret key**
4. For webhooks, go to [Dashboard > Developers > Webhooks](https://dashboard.stripe.com/webhooks)
5. Add endpoint: `https://your-api.com/api/payments/webhooks/stripe`
6. Copy the **Signing secret**

#### Paystack Setup
1. Sign up at [paystack.com](https://paystack.com)
2. Go to [Dashboard > Settings > Developer/API](https://dashboard.paystack.com/#/settings/developer)
3. Copy both **Public Key** and **Secret Key**
4. For webhooks, add endpoint: `https://your-api.com/api/payments/webhooks/paystack`

---

## API Endpoints

### Base URL
```
Production: https://api.anolahealth.com
Development: http://localhost:3000
```

### 1. Initialize HMO Enrollment Payment

**Endpoint:** `POST /api/payments/hmo-enrollment/initialize`

**Authentication:** Required (Bearer token)

**Request Body:**
```json
{
  "enrollmentId": "67890abcdef",
  "amount": 500,
  "currency": "USD",
  "gateway": "stripe",  // Optional: auto-selected if not provided
  "paymentMethod": "card"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "gateway": "stripe",
    "paymentIntentId": "pi_xxx",
    "clientSecret": "pi_xxx_secret_xxx",
    "customerId": "cus_xxx",
    "amount": 500,
    "currency": "USD",
    "status": "requires_payment_method"
  },
  "message": "Payment initialized successfully"
}
```

**Stripe Response Fields:**
- `clientSecret` - Use this with Stripe.js on frontend
- `paymentIntentId` - Payment reference for verification

**Paystack Response Fields:**
```json
{
  "success": true,
  "data": {
    "gateway": "paystack",
    "reference": "T123456789",
    "authorizationUrl": "https://checkout.paystack.com/xxx",
    "accessCode": "xxx",
    "amount": 50000,
    "currency": "NGN"
  }
}
```
- `authorizationUrl` - Redirect user to this URL
- `reference` - Payment reference for verification

---

### 2. Initialize Wallet Funding

**Endpoint:** `POST /api/payments/wallet/initialize`

**Authentication:** Required

**Request Body:**
```json
{
  "amount": 100,
  "currency": "USD",
  "gateway": "stripe"  // Optional
}
```

**Response:** Same structure as enrollment payment

---

### 3. Verify Payment

**Endpoint:** `POST /api/payments/verify`

**Authentication:** Required

**Request Body:**
```json
{
  "gateway": "stripe",
  "reference": "pi_xxx"  // Payment intent ID for Stripe, reference for Paystack
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "status": "succeeded",
    "amount": 500,
    "currency": "USD",
    "metadata": {
      "userId": "123",
      "enrollmentId": "456",
      "category": "hmo_enrollment"
    }
  },
  "message": "Payment verified successfully"
}
```

---

### 4. Get Payment History

**Endpoint:** `GET /api/payments/history`

**Authentication:** Required

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)
- `category` - Filter by category (e.g., "hmo_enrollment", "wallet_funding")
- `gateway` - Filter by gateway ("stripe" or "paystack")

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "trans123",
      "type": "credit",
      "category": "hmo_enrollment",
      "amount": {
        "value": 500,
        "currency": "USD"
      },
      "status": "completed",
      "paymentGateway": "stripe",
      "paymentReference": "pi_xxx",
      "description": "HMO Enrollment Payment",
      "createdAt": "2025-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3
  }
}
```

---

### 5. Create Refund

**Endpoint:** `POST /api/payments/refund`

**Authentication:** Required (Super Admin only)

**Request Body:**
```json
{
  "gateway": "stripe",
  "reference": "pi_xxx",
  "amount": 500,  // Optional: full refund if not specified
  "reason": "Customer requested refund"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "refundId": "re_xxx",
    "amount": 500,
    "status": "succeeded"
  },
  "message": "Refund processed successfully"
}
```

---

### 6. Webhooks (Internal - No Authentication)

These endpoints are called by payment gateways:

**Stripe Webhook:** `POST /api/payments/webhooks/stripe`
**Paystack Webhook:** `POST /api/payments/webhooks/paystack`

**Events Handled:**

**Stripe:**
- `payment_intent.succeeded` - Payment completed
- `payment_intent.payment_failed` - Payment failed
- `charge.refunded` - Refund processed

**Paystack:**
- `charge.success` - Payment completed
- `charge.failed` - Payment failed
- `refund.processed` - Refund completed

---

## Payment Flows

### Flow 1: HMO Enrollment Payment (Stripe)

```
┌─────────┐           ┌──────────┐           ┌─────────┐           ┌────────┐
│ Client  │           │   API    │           │ Stripe  │           │   DB   │
└────┬────┘           └────┬─────┘           └────┬────┘           └───┬────┘
     │                     │                      │                    │
     │  1. Initialize      │                      │                    │
     │  Payment            │                      │                    │
     ├────────────────────>│                      │                    │
     │                     │                      │                    │
     │                     │  2. Create Payment   │                    │
     │                     │  Intent              │                    │
     │                     ├─────────────────────>│                    │
     │                     │                      │                    │
     │                     │  3. Return Client    │                    │
     │                     │  Secret              │                    │
     │                     │<─────────────────────┤                    │
     │                     │                      │                    │
     │                     │  4. Save Payment     │                    │
     │                     │  Reference           │                    │
     │                     ├──────────────────────┼───────────────────>│
     │                     │                      │                    │
     │  5. Return Client   │                      │                    │
     │  Secret             │                      │                    │
     │<────────────────────┤                      │                    │
     │                     │                      │                    │
     │  6. Confirm Payment │                      │                    │
     │  (Stripe.js)        │                      │                    │
     ├──────────────────────┼─────────────────────>                    │
     │                     │                      │                    │
     │                     │  7. Webhook:         │                    │
     │                     │  payment_succeeded   │                    │
     │                     │<─────────────────────┤                    │
     │                     │                      │                    │
     │                     │  8. Update Enrollment│                    │
     │                     │  & Wallet            │                    │
     │                     ├──────────────────────┼───────────────────>│
     │                     │                      │                    │
     │  9. Payment Success │                      │                    │
     │<────────────────────┤                      │                    │
```

### Flow 2: HMO Enrollment Payment (Paystack)

```
┌─────────┐           ┌──────────┐           ┌──────────┐           ┌────────┐
│ Client  │           │   API    │           │ Paystack │           │   DB   │
└────┬────┘           └────┬─────┘           └────┬─────┘           └───┬────┘
     │                     │                      │                      │
     │  1. Initialize      │                      │                      │
     │  Payment            │                      │                      │
     ├────────────────────>│                      │                      │
     │                     │                      │                      │
     │                     │  2. Initialize Txn   │                      │
     │                     ├─────────────────────>│                      │
     │                     │                      │                      │
     │                     │  3. Return Auth URL  │                      │
     │                     │<─────────────────────┤                      │
     │                     │                      │                      │
     │                     │  4. Save Reference   │                      │
     │                     ├──────────────────────┼─────────────────────>│
     │                     │                      │                      │
     │  5. Return Auth URL │                      │                      │
     │<────────────────────┤                      │                      │
     │                     │                      │                      │
     │  6. Redirect to     │                      │                      │
     │  Paystack Checkout  │                      │                      │
     ├──────────────────────┼─────────────────────>                      │
     │                     │                      │                      │
     │  7. Complete Payment│                      │                      │
     │  on Paystack        │                      │                      │
     │<──────────────────────────────────────────>│                      │
     │                     │                      │                      │
     │                     │  8. Webhook:         │                      │
     │                     │  charge.success      │                      │
     │                     │<─────────────────────┤                      │
     │                     │                      │                      │
     │                     │  9. Update Records   │                      │
     │                     ├──────────────────────┼─────────────────────>│
     │                     │                      │                      │
     │  10. Redirect back  │                      │                      │
     │  to success page    │                      │                      │
     │<────────────────────────────────────────────                      │
```

---

## Webhook Configuration

### Stripe Webhooks

1. Go to [Stripe Dashboard > Webhooks](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"
3. Enter URL: `https://your-api.com/api/payments/webhooks/stripe`
4. Select events to listen for:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
5. Copy the **Signing secret** to your `.env` file as `STRIPE_WEBHOOK_SECRET`

### Paystack Webhooks

1. Go to [Paystack Dashboard > Settings > Webhooks](https://dashboard.paystack.com/#/settings/developer)
2. Enter URL: `https://your-api.com/api/payments/webhooks/paystack`
3. No signing secret needed (uses HMAC with secret key)

### Local Webhook Testing

**Stripe CLI:**
```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/payments/webhooks/stripe
```

**Paystack:**
Use [ngrok](https://ngrok.com/) to expose your local server:
```bash
ngrok http 3000
# Use the HTTPS URL in Paystack dashboard
```

---

## Frontend Integration

### React Example - Stripe Payment

```javascript
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe('pk_test_...');

function CheckoutForm({ enrollmentId, amount }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Step 1: Initialize payment
      const response = await fetch('/api/payments/hmo-enrollment/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          enrollmentId,
          amount,
          currency: 'USD',
          gateway: 'stripe'
        })
      });

      const { data } = await response.json();
      const { clientSecret } = data;

      // Step 2: Confirm payment with Stripe
      const { error, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: elements.getElement(CardElement),
            billing_details: {
              name: 'Customer Name',
              email: 'customer@example.com'
            }
          }
        }
      );

      if (error) {
        console.error('Payment failed:', error);
        alert('Payment failed: ' + error.message);
      } else if (paymentIntent.status === 'succeeded') {
        // Step 3: Verify payment on backend
        await fetch('/api/payments/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({
            gateway: 'stripe',
            reference: paymentIntent.id
          })
        });

        alert('Payment successful!');
        // Redirect to success page
        window.location.href = `/enrollments/${enrollmentId}/success`;
      }
    } catch (err) {
      console.error('Error:', err);
      alert('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardElement />
      <button type="submit" disabled={!stripe || loading}>
        {loading ? 'Processing...' : `Pay $${amount}`}
      </button>
    </form>
  );
}

export default function CheckoutPage({ enrollmentId, amount }) {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm enrollmentId={enrollmentId} amount={amount} />
    </Elements>
  );
}
```

### React Example - Paystack Payment

```javascript
import { PaystackButton } from 'react-paystack';

function PaystackCheckout({ enrollmentId, amount }) {
  const [loading, setLoading] = useState(false);
  const [paystackConfig, setPaystackConfig] = useState(null);

  useEffect(() => {
    initializePayment();
  }, []);

  const initializePayment = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/payments/hmo-enrollment/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          enrollmentId,
          amount: amount * 100, // Convert to kobo
          currency: 'NGN',
          gateway: 'paystack'
        })
      });

      const { data } = await response.json();

      setPaystackConfig({
        reference: data.reference,
        email: userEmail,
        amount: amount * 100,
        publicKey: 'pk_test_...',
      });
    } catch (err) {
      console.error('Error:', err);
      alert('Failed to initialize payment');
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = async (reference) => {
    try {
      // Verify payment on backend
      await fetch('/api/payments/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          gateway: 'paystack',
          reference: reference.reference
        })
      });

      alert('Payment successful!');
      window.location.href = `/enrollments/${enrollmentId}/success`;
    } catch (err) {
      console.error('Verification error:', err);
    }
  };

  const handleClose = () => {
    alert('Payment cancelled');
  };

  if (loading || !paystackConfig) {
    return <div>Loading...</div>;
  }

  return (
    <PaystackButton
      {...paystackConfig}
      text={`Pay ₦${amount.toLocaleString()}`}
      onSuccess={handleSuccess}
      onClose={handleClose}
    />
  );
}
```

### Alternative: Redirect Method (Paystack)

```javascript
const initializePayment = async () => {
  const response = await fetch('/api/payments/hmo-enrollment/initialize', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify({
      enrollmentId,
      amount: amount * 100,
      currency: 'NGN',
      gateway: 'paystack'
    })
  });

  const { data } = await response.json();

  // Redirect to Paystack checkout
  window.location.href = data.authorizationUrl;
};
```

---

## Testing

### Test Cards

**Stripe Test Cards:**
```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
3D Secure: 4000 0027 6000 3184
Expiry: Any future date
CVC: Any 3 digits
```

**Paystack Test Cards:**
```
Success: 5061 0200 0000 0000 083
PIN: 1234
OTP: 123456
```

### cURL Testing Examples

**Test Wallet Funding (Stripe):**
```bash
curl -X POST https://api.anolahealth.com/api/payments/wallet/initialize \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "amount": 100,
    "currency": "USD",
    "gateway": "stripe"
  }'
```

**Test Payment Verification:**
```bash
curl -X POST https://api.anolahealth.com/api/payments/verify \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "gateway": "stripe",
    "reference": "pi_xxx"
  }'
```

**Test Payment History:**
```bash
curl https://api.anolahealth.com/api/payments/history?page=1&limit=10 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Error Handling

### Common Errors

#### 1. Invalid API Keys
```json
{
  "success": false,
  "message": "Failed to initialize payment",
  "error": "Stripe payment failed: Invalid API Key provided"
}
```
**Solution:** Check your `.env` file has correct API keys

#### 2. Insufficient Funds (Card)
```json
{
  "success": false,
  "message": "Payment verification failed",
  "data": {
    "success": false,
    "status": "failed"
  }
}
```
**Solution:** User needs to use a different payment method

#### 3. Enrollment Not Found
```json
{
  "success": false,
  "message": "Enrollment not found"
}
```
**Solution:** Verify enrollmentId exists and belongs to user

#### 4. Already Paid
```json
{
  "success": false,
  "message": "Enrollment payment already completed"
}
```
**Solution:** Check enrollment payment status before initializing

#### 5. Webhook Signature Verification Failed
```json
{
  "success": false,
  "message": "Webhook verification failed",
  "error": "Invalid Stripe webhook: No signatures found"
}
```
**Solution:**
- For Stripe: Check `STRIPE_WEBHOOK_SECRET` is correct
- For Paystack: Check request is from Paystack IP addresses

---

## Security Considerations

### 1. Never Expose Secret Keys

❌ **NEVER** send secret keys to frontend:
```javascript
// DON'T DO THIS
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
res.json({ secretKey: process.env.STRIPE_SECRET_KEY }); // ❌ NEVER!
```

✅ **Only send public keys or client secrets:**
```javascript
// Frontend only gets client secret
res.json({
  clientSecret: paymentIntent.client_secret,  // ✅ Safe
  publicKey: process.env.STRIPE_PUBLIC_KEY    // ✅ Safe
});
```

### 2. Verify Webhook Signatures

Always verify webhook signatures to ensure requests are from payment gateways:

```javascript
// Stripe
const event = stripe.webhooks.constructEvent(
  payload,
  signature,
  process.env.STRIPE_WEBHOOK_SECRET
);

// Paystack
const hash = crypto
  .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
  .update(payload)
  .digest('hex');
const isValid = (hash === signature);
```

### 3. Use HTTPS

Always use HTTPS in production for:
- API endpoints
- Webhook URLs
- Callback URLs

### 4. Implement Rate Limiting

The API already has rate limiting enabled. Additional payment-specific limits:

```javascript
const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10 // Max 10 payment initiations per 15 minutes
});

app.use('/api/payments/*/initialize', paymentLimiter);
```

### 5. Store Minimal Card Data

**NEVER store:**
- Full card numbers
- CVV codes
- Card PINs

**Only store:**
- Last 4 digits (from payment gateway response)
- Card brand (Visa, Mastercard, etc.)
- Expiry month/year
- Payment gateway customer IDs

### 6. Log Payment Activities

```javascript
// Log all payment attempts
console.log('Payment initialized:', {
  userId,
  amount,
  currency,
  gateway,
  timestamp: new Date(),
  ip: req.ip
});
```

### 7. PCI Compliance

- Use Stripe Elements or Paystack Popup (card data never touches your server)
- Never log full card numbers
- Encrypt sensitive data at rest
- Use tokenization for recurring payments

---

## Troubleshooting

### Issue: Payment succeeds but webhook not received

**Possible causes:**
1. Webhook URL not configured correctly
2. Firewall blocking webhook requests
3. SSL certificate issues

**Solutions:**
- Test webhook with payment gateway's test tools
- Check server logs for webhook requests
- Verify webhook URL is publicly accessible

### Issue: "Payment intent already succeeded"

**Cause:** Trying to process the same payment twice

**Solution:** Check payment status before attempting to confirm again

### Issue: Currency mismatch

**Error:** `Amount must be at least $0.50 usd`

**Solution:**
- Stripe minimum: $0.50 USD
- Paystack minimum: ₦100 NGN
- Always check gateway minimums

### Issue: 3D Secure authentication required

**Solution:**
- Handle `requires_action` status
- Use Stripe.js `confirmCardPayment` which handles 3D Secure automatically

```javascript
const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret);
```

---

## Best Practices

### 1. Always Verify Payments Server-Side

Don't trust client-side confirmation alone:

```javascript
// ❌ Don't rely only on client callback
stripe.confirmCardPayment(clientSecret).then(() => {
  alert('Payment successful'); // User could fake this
});

// ✅ Always verify on server
await fetch('/api/payments/verify', {
  method: 'POST',
  body: JSON.stringify({ gateway: 'stripe', reference: paymentIntentId })
});
```

### 2. Handle Async Payment Methods

Some payment methods (bank transfers) are async:

```javascript
// Check payment status
if (paymentIntent.status === 'processing') {
  // Payment is being processed
  // Wait for webhook to confirm
}
```

### 3. Implement Idempotency

Use idempotency keys to prevent duplicate payments:

```javascript
const paymentIntent = await stripe.paymentIntents.create({
  amount: 5000,
  currency: 'usd'
}, {
  idempotencyKey: `enrollment_${enrollmentId}` // Unique key
});
```

### 4. Provide Clear Payment Status

Show users real-time payment status:

```javascript
const statuses = {
  'requires_payment_method': 'Awaiting payment',
  'requires_confirmation': 'Confirming payment',
  'requires_action': 'Action required',
  'processing': 'Processing payment',
  'succeeded': 'Payment successful',
  'failed': 'Payment failed'
};
```

### 5. Test Edge Cases

- Declined cards
- Insufficient funds
- 3D Secure authentication
- Network timeouts
- Webhook failures
- Concurrent payments

---

## Migration Checklist

- [ ] Add Stripe and Paystack API keys to `.env`
- [ ] Configure webhook URLs in payment dashboards
- [ ] Test payment initialization (both gateways)
- [ ] Test payment verification
- [ ] Test webhook handling
- [ ] Implement frontend payment forms
- [ ] Add error handling for payment failures
- [ ] Test refund functionality
- [ ] Set up monitoring and alerts
- [ ] Document payment flows for team
- [ ] Train support team on payment troubleshooting
- [ ] Create runbook for payment issues
- [ ] Set up analytics for payment metrics

---

## Support

### Stripe Support
- [Dashboard](https://dashboard.stripe.com)
- [Documentation](https://stripe.com/docs)
- [Support](https://support.stripe.com)

### Paystack Support
- [Dashboard](https://dashboard.paystack.com)
- [Documentation](https://paystack.com/docs)
- [Support](https://paystack.com/contact)

---

## Summary

The payment integration is now complete with:

✅ **Dual Gateway Support** - Stripe and Paystack
✅ **Automatic Gateway Selection** - Based on currency
✅ **Secure Webhook Handling** - Real-time payment updates
✅ **Complete Payment Flows** - Enrollment and wallet funding
✅ **Refund Support** - Process refunds through either gateway
✅ **Transaction History** - Complete audit trail
✅ **Production Ready** - Security best practices implemented

Users can now pay for HMO enrollments and fund wallets using their preferred payment method and currency!
