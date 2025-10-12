const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

module.exports = {
  // Server
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',

  // Database
  mongoUri: process.env.MONGO_URI,

  // JWT
  jwtSecret: process.env.JWT_SECRET || 'default-jwt-secret',
  refreshSecret: process.env.REFRESH_SECRET || 'default-refresh-secret',
  jwtExpire: process.env.JWT_EXPIRE || '15m',
  refreshExpire: process.env.REFRESH_EXPIRE || '7d',

  // Email
  sendgridApiKey: process.env.SENDGRID_API_KEY,
  emailFrom: process.env.EMAIL_FROM || 'noreply@anolahealth.com',

  // Twilio
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID,
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN,
  twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER,

  // Stripe
  stripeSecretKey: process.env.STRIPE_SECRET_KEY,
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,

  // Cloudinary
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME,
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY,
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET,

  // URLs
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3001',
  adminUrl: process.env.ADMIN_URL || 'http://localhost:3002',

  // Redis
  redisUrl: process.env.REDIS_URL,

  // Rate Limiting
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,

  // Encryption
  encryptionKey: process.env.ENCRYPTION_KEY,

  // CORS
  corsOrigins: process.env.CORS_ORIGINS ? 
    process.env.CORS_ORIGINS.split(',') : 
    ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002']
};