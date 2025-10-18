const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger');

const config = require('./config/config');
const connectDB = require('./config/database');
const { errorHandler, notFound } = require('./middleware/error.middleware');

const app = express();

// Connect to database (non-blocking for serverless)
// Connection will be established on first request
connectDB().catch(err => {
  console.error('Initial database connection failed:', err.message);
  // Don't exit in serverless - let it retry on next request
});

// Trust proxy for Vercel deployment
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    if (config.corsOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // In development, allow all origins
    if (config.nodeEnv === 'development') {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count']
};

app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMaxRequests,
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil(config.rateLimitWindowMs / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting in development
  skip: (req) => config.nodeEnv === 'development'
});

app.use('/api/', limiter);

// Compression middleware
app.use(compression());

// Logging middleware
if (config.nodeEnv === 'production') {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Swagger API Documentation
// Wrap in try-catch to prevent crashes in serverless environments
try {
  app.use('/api-docs', swaggerUi.serve);
  app.get('/api-docs', swaggerUi.setup(swaggerSpecs, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Anola Health API Documentation',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      docExpansion: 'none',
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
      tryItOutEnabled: true
    }
  }));

  // JSON API specification endpoint (fallback for when Swagger UI doesn't load)
  app.get('/api-spec.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpecs);
  });
} catch (error) {
  console.error('Swagger UI setup error:', error.message);
  // Provide a fallback endpoint
  app.get('/api-docs', (req, res) => {
    res.status(200).send('<h1>API Documentation</h1><p>Swagger UI is currently unavailable. Please use <a href="/api-spec.json">/api-spec.json</a> for the OpenAPI specification.</p>');
  });
  app.get('/api-spec.json', (req, res) => {
    res.status(200).json(swaggerSpecs || { openapi: '3.0.0', info: { title: 'Anola Health API', version: '1.0.0' }, paths: {} });
  });
}

/**
 * @swagger
 * /health:
 *   get:
 *     tags: [System]
 *     summary: Health check
 *     description: Check if the API is running and healthy
 *     responses:
 *       200:
 *         description: API is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: OK
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 environment:
 *                   type: string
 *                   example: development
 *                 version:
 *                   type: string
 *                   example: 1.0.0
 */
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
    version: process.env.npm_package_version || '1.0.0'
  });
});

// API routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/patients', require('./routes/patient.routes'));
app.use('/api/providers', require('./routes/provider.routes'));
app.use('/api/sponsors', require('./routes/sponsor.routes'));
app.use('/api/vendors', require('./routes/vendor.routes'));
app.use('/api/appointments', require('./routes/appointment.routes'));
app.use('/api/medical-records', require('./routes/medicalRecord.routes'));
app.use('/api/sponsorships', require('./routes/sponsorship.routes'));
app.use('/api/wallets', require('./routes/wallet.routes'));
app.use('/api/transactions', require('./routes/transaction.routes'));
app.use('/api/super-admin', require('./routes/superAdmin.routes'));

/**
 * @swagger
 * /:
 *   get:
 *     tags: [System]
 *     summary: API welcome endpoint
 *     description: Get API information and documentation link
 *     responses:
 *       200:
 *         description: API information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Welcome to Anola Health API
 *                 version:
 *                   type: string
 *                   example: 1.0.0
 *                 documentation:
 *                   type: string
 *                   example: /api-docs
 *                 status:
 *                   type: string
 *                   example: running
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Anola Health API',
    version: '1.0.0',
    documentation: '/api-docs',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

// Handle undefined routes
app.use(notFound);

// Global error handler
app.use(errorHandler);

module.exports = app;