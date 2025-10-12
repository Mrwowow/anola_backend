# Anola Health Backend API

A comprehensive healthcare platform backend built with Node.js, Express, and MongoDB, designed to connect patients, healthcare providers, sponsors, and vendors in a unified ecosystem.

## 🚀 Features

- **Multi-tenant Architecture**: Support for patients, providers, sponsors, and vendors
- **Dual Wallet System**: Personal and sponsored funding mechanisms
- **Smart Health Cards**: QR code integration for patient identification
- **Appointment Management**: Comprehensive booking and scheduling system
- **Medical Records**: Secure and compliant medical data management
- **Global Sponsorship**: Healthcare funding from sponsors worldwide
- **Real-time Communication**: Socket.io integration for live updates
- **Secure Authentication**: JWT-based auth with refresh tokens
- **Payment Processing**: Stripe integration for transactions
- **File Upload**: Cloudinary integration for media management

## 🛠️ Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with bcryptjs
- **File Storage**: Cloudinary
- **Payment**: Stripe
- **Communication**: Twilio (SMS), SendGrid (Email)
- **Real-time**: Socket.io
- **Validation**: Express Validator
- **Security**: Helmet, CORS, Rate Limiting
- **Deployment**: Vercel

## 📁 Project Structure

```
anola-backend/
├── src/
│   ├── config/           # Configuration files
│   ├── controllers/      # Route controllers
│   ├── middleware/       # Custom middleware
│   ├── models/          # MongoDB models
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   └── utils/           # Utility functions
├── tests/               # Test files
├── .env.example         # Environment variables template
├── vercel.json          # Vercel deployment config
└── server.js           # Application entry point
```

## 🚦 Getting Started

### Prerequisites

- Node.js 18 or higher
- MongoDB database
- Required API keys (see Environment Variables)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd anola-backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your actual values
```

4. Start the development server:
```bash
npm run dev
```

The API will be available at `http://localhost:3000`

## 🔧 Environment Variables

Create a `.env` file with the following variables:

```bash
# Server
NODE_ENV=development
PORT=3000

# Database
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/anola_health

# JWT
JWT_SECRET=your-jwt-secret
REFRESH_SECRET=your-refresh-secret

# Email (SendGrid)
SENDGRID_API_KEY=your-sendgrid-key
EMAIL_FROM=noreply@anolahealth.com

# SMS (Twilio)
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=+1234567890

# Payment (Stripe)
STRIPE_SECRET_KEY=your-stripe-key
STRIPE_WEBHOOK_SECRET=your-webhook-secret

# File Upload (Cloudinary)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user

### User Management
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `POST /api/users/verify-email` - Verify email address

### Appointments
- `GET /api/appointments` - List appointments
- `POST /api/appointments` - Create appointment
- `GET /api/appointments/:id` - Get appointment details
- `PUT /api/appointments/:id` - Update appointment
- `DELETE /api/appointments/:id` - Cancel appointment

### Medical Records
- `GET /api/medical-records` - List medical records
- `POST /api/medical-records` - Create medical record
- `GET /api/medical-records/:id` - Get record details
- `PUT /api/medical-records/:id` - Update record

### Wallets & Transactions
- `GET /api/wallets` - Get user wallets
- `POST /api/transactions` - Create transaction
- `GET /api/transactions` - List transactions

## 🔐 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: Prevents abuse and DDoS attacks
- **Input Validation**: Comprehensive request validation
- **CORS Protection**: Configured for specific origins
- **Helmet Security**: Sets various HTTP headers
- **Password Hashing**: bcryptjs for secure password storage
- **Account Locking**: Automatic lockout after failed attempts

## 🏥 User Types

### Patients
- Personal health records
- Appointment booking
- Dual wallet system (personal + sponsored)
- Health card with QR code

### Healthcare Providers
- Service offerings management
- Appointment scheduling
- Medical record creation
- Payment processing

### Sponsors
- Healthcare funding allocation
- Impact tracking and reporting
- Beneficiary management
- Global reach analytics

### Vendors
- Product/service catalog
- Order management
- Inventory tracking
- Partner integrations

## 💳 Payment System

- **Stripe Integration**: Secure payment processing
- **Dual Wallets**: Personal and sponsored funding
- **Global Sponsorship**: Cross-border healthcare funding
- **Transaction Tracking**: Comprehensive audit trail

## 📱 Health Cards

Smart health cards with QR code integration:
- Unique patient identification
- Quick access to medical information
- Emergency contact details
- Insurance information

## 🌍 Global Sponsorship

- **Sponsor Matching**: AI-powered beneficiary matching
- **Impact Tracking**: Real-time utilization reports
- **Tax Benefits**: Automated receipt generation
- **Success Stories**: Patient testimonials and outcomes

## 🚀 Deployment

### Vercel Deployment

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel
```

3. Set environment variables in Vercel dashboard

### Environment Configuration

- Production MongoDB URI
- API keys for third-party services
- CORS origins for production domains

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## 📊 Monitoring

- **Health Check**: `/health` endpoint
- **Error Logging**: Comprehensive error tracking
- **Performance Metrics**: Response time monitoring
- **Database Monitoring**: Connection pool tracking

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## 🆘 Support

For support and questions:
- Email: support@anolahealth.com
- Documentation: [API Docs](https://api.anolahealth.com/docs)
- Issues: [GitHub Issues](https://github.com/anola-health/backend/issues)

## 🔄 API Versioning

Current API version: v1
Base URL: `https://api.anolahealth.com/api/v1`

## 📈 Roadmap

- [ ] Real-time chat system
- [ ] AI-powered health recommendations
- [ ] Telemedicine integration
- [ ] Mobile app API enhancements
- [ ] Advanced analytics dashboard
- [ ] Multi-language support