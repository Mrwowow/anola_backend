const swaggerJsdoc = require('swagger-jsdoc');
const config = require('./config');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Anola Health API',
      version: '1.0.0',
      description: 'A comprehensive healthcare platform API connecting patients, providers, sponsors, and vendors',
      contact: {
        name: 'Anola Health',
        email: 'support@anolahealth.com'
      },
      license: {
        name: 'ISC',
        url: 'https://opensource.org/licenses/ISC'
      }
    },
    servers: [
      {
        url: 'https://anola-backend.vercel.app',
        description: 'Production server (Vercel)'
      },
      {
        url: config.nodeEnv === 'production'
          ? 'https://api.anolahealth.com'
          : `http://localhost:${config.port}`,
        description: config.nodeEnv === 'production' ? 'Production server (Custom domain)' : 'Local development server'
      },
      {
        url: 'http://localhost:3000',
        description: 'Local server - Port 3000'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              example: 'Error message'
            },
            error: {
              type: 'string',
              example: 'Detailed error information'
            }
          }
        },
        User: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '507f1f77bcf86cd799439011'
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'user@example.com'
            },
            firstName: {
              type: 'string',
              example: 'John'
            },
            lastName: {
              type: 'string',
              example: 'Doe'
            },
            role: {
              type: 'string',
              enum: ['patient', 'provider', 'sponsor', 'vendor'],
              example: 'patient'
            },
            phoneNumber: {
              type: 'string',
              example: '+1234567890'
            },
            isEmailVerified: {
              type: 'boolean',
              example: false
            },
            isPhoneVerified: {
              type: 'boolean',
              example: false
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        LoginResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            data: {
              type: 'object',
              properties: {
                user: {
                  $ref: '#/components/schemas/User'
                },
                accessToken: {
                  type: 'string',
                  example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
                },
                refreshToken: {
                  type: 'string',
                  example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
                }
              }
            }
          }
        },
        Appointment: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '507f1f77bcf86cd799439011'
            },
            patient: {
              type: 'string',
              example: '507f1f77bcf86cd799439011'
            },
            provider: {
              type: 'string',
              example: '507f1f77bcf86cd799439012'
            },
            dateTime: {
              type: 'string',
              format: 'date-time'
            },
            duration: {
              type: 'number',
              example: 30
            },
            type: {
              type: 'string',
              enum: ['consultation', 'follow-up', 'emergency', 'checkup'],
              example: 'consultation'
            },
            status: {
              type: 'string',
              enum: ['scheduled', 'confirmed', 'completed', 'cancelled', 'no-show'],
              example: 'scheduled'
            },
            reason: {
              type: 'string',
              example: 'Regular checkup'
            },
            notes: {
              type: 'string',
              example: 'Patient reports mild symptoms'
            }
          }
        },
        Wallet: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '507f1f77bcf86cd799439011'
            },
            user: {
              type: 'string',
              example: '507f1f77bcf86cd799439011'
            },
            type: {
              type: 'string',
              enum: ['personal', 'sponsored'],
              example: 'personal'
            },
            balance: {
              type: 'number',
              example: 1000.50
            },
            currency: {
              type: 'string',
              example: 'USD'
            },
            status: {
              type: 'string',
              enum: ['active', 'frozen', 'closed'],
              example: 'active'
            }
          }
        },
        Transaction: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '507f1f77bcf86cd799439011'
            },
            from: {
              type: 'string',
              example: '507f1f77bcf86cd799439011'
            },
            to: {
              type: 'string',
              example: '507f1f77bcf86cd799439012'
            },
            amount: {
              type: 'number',
              example: 50.00
            },
            currency: {
              type: 'string',
              example: 'USD'
            },
            type: {
              type: 'string',
              enum: ['payment', 'refund', 'deposit', 'withdrawal', 'sponsorship'],
              example: 'payment'
            },
            status: {
              type: 'string',
              enum: ['pending', 'completed', 'failed', 'cancelled'],
              example: 'completed'
            },
            description: {
              type: 'string',
              example: 'Appointment payment'
            }
          }
        },
        MedicalRecord: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '507f1f77bcf86cd799439011'
            },
            patient: {
              type: 'string',
              example: '507f1f77bcf86cd799439011'
            },
            provider: {
              type: 'string',
              example: '507f1f77bcf86cd799439012'
            },
            appointment: {
              type: 'string',
              example: '507f1f77bcf86cd799439013'
            },
            diagnosis: {
              type: 'string',
              example: 'Hypertension'
            },
            symptoms: {
              type: 'array',
              items: {
                type: 'string'
              },
              example: ['Headache', 'Dizziness']
            },
            prescriptions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  medication: {
                    type: 'string',
                    example: 'Lisinopril'
                  },
                  dosage: {
                    type: 'string',
                    example: '10mg'
                  },
                  frequency: {
                    type: 'string',
                    example: 'Once daily'
                  },
                  duration: {
                    type: 'string',
                    example: '30 days'
                  }
                }
              }
            },
            notes: {
              type: 'string',
              example: 'Patient advised to monitor blood pressure daily'
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and authorization endpoints'
      },
      {
        name: 'Users',
        description: 'User profile management'
      },
      {
        name: 'Patients',
        description: 'Patient-specific operations'
      },
      {
        name: 'Providers',
        description: 'Healthcare provider operations'
      },
      {
        name: 'Sponsors',
        description: 'Sponsor management and funding'
      },
      {
        name: 'Vendors',
        description: 'Vendor operations and products'
      },
      {
        name: 'Appointments',
        description: 'Appointment booking and management'
      },
      {
        name: 'Medical Records',
        description: 'Medical records management'
      },
      {
        name: 'Sponsorships',
        description: 'Sponsorship programs and allocations'
      },
      {
        name: 'Wallets',
        description: 'Wallet management'
      },
      {
        name: 'Transactions',
        description: 'Transaction history and processing'
      },
      {
        name: 'SuperAdmin',
        description: 'Super admin platform management'
      },
      {
        name: 'System',
        description: 'System endpoints and health checks'
      }
    ]
  },
  apis: [
    './src/routes/*.js',
    './src/app.js',
    __dirname + '/../routes/*.js',
    __dirname + '/../app.js'
  ]
};

const specs = swaggerJsdoc(options);

module.exports = specs;
