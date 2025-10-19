# Backend Integration Guide

## 🎯 Overview

This guide provides the complete backend implementation requirements for all dashboard pages in the Àñola Health platform. All frontend pages are ready and waiting for API integration.

---

## 📊 Current Status

**Frontend Completion:**
- ✅ Patient Dashboard: 100% (6/6 pages)
- ✅ Provider Dashboard: 100% (6/6 pages)
- ✅ Vendor Dashboard: 100% (6/6 pages)
- ⚠️ Sponsor Dashboard: 33% (2/6 pages)

**Backend Requirements:**
- MongoDB schema definitions
- REST API endpoints
- Authentication & authorization
- Real-time updates (WebSocket)
- File upload handling
- Export functionality

---

## 🗄️ MongoDB Schema Definitions

### 1. User Schema (Base)

```javascript
const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    unique: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  userType: {
    type: String,
    enum: ['patient', 'provider', 'sponsor', 'vendor'],
    required: true
  },
  profile: {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    avatar: { type: String },
    dateOfBirth: { type: Date, required: true }
  },
  healthCardId: { type: String, unique: true, sparse: true },
  status: {
    type: String,
    enum: ['pending', 'active', 'inactive', 'suspended'],
    default: 'pending'
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  discriminatorKey: 'userType'
});
```

### 2. Patient Schema (Extends User)

```javascript
const PatientSchema = new mongoose.Schema({
  medicalHistory: [{
    date: Date,
    condition: String,
    diagnosis: String,
    treatment: String,
    providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Provider' },
    documents: [String]
  }],
  allergies: [String],
  medications: [{
    name: String,
    dosage: String,
    frequency: String,
    startDate: Date,
    endDate: Date
  }],
  wallet: {
    personalBalance: { type: Number, default: 0 },
    sponsoredBalance: { type: Number, default: 0 },
    currency: { type: String, default: 'USD' }
  },
  insuranceInfo: {
    provider: String,
    policyNumber: String,
    expiryDate: Date
  },
  emergencyContact: {
    name: String,
    relationship: String,
    phone: String
  }
});
```

### 3. Provider Schema (Extends User)

```javascript
const ProviderSchema = new mongoose.Schema({
  specialization: {
    type: String,
    required: true
  },
  licenseNumber: {
    type: String,
    required: true,
    unique: true
  },
  experience: {
    type: Number,
    default: 0
  },
  rating: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 }
  },
  location: {
    facility: String,
    address: String,
    city: String,
    state: String,
    zipCode: String
  },
  availability: {
    type: String,
    enum: ['available', 'busy', 'unavailable'],
    default: 'available'
  },
  workingHours: [{
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    },
    startTime: String,
    endTime: String,
    isActive: Boolean
  }],
  services: [{
    name: String,
    category: String,
    duration: Number,
    price: Number,
    description: String,
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active'
    }
  }],
  acceptsAnola: { type: Boolean, default: true },
  earnings: {
    total: { type: Number, default: 0 },
    pending: { type: Number, default: 0 },
    paid: { type: Number, default: 0 }
  }
});
```

### 4. Vendor Schema (Extends User)

```javascript
const VendorSchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: true
  },
  businessLicense: {
    type: String,
    required: true,
    unique: true
  },
  location: {
    address: String,
    city: String,
    state: String,
    zipCode: String
  },
  products: [{
    name: String,
    category: {
      type: String,
      enum: ['PPE', 'Diagnostics', 'Medical Supplies', 'Equipment']
    },
    price: Number,
    sku: String,
    description: String,
    availability: {
      inStock: Boolean,
      quantity: Number
    },
    createdAt: { type: Date, default: Date.now }
  }],
  revenue: {
    total: { type: Number, default: 0 },
    monthly: [{ month: String, amount: Number }]
  },
  rating: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 }
  }
});
```

### 5. Sponsor Schema (Extends User)

```javascript
const SponsorSchema = new mongoose.Schema({
  organizationName: {
    type: String,
    required: true
  },
  organizationType: {
    type: String,
    enum: ['Individual', 'NGO', 'Corporate', 'Government'],
    required: true
  },
  totalContributed: {
    type: Number,
    default: 0
  },
  activeSponsorships: [{
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
    amount: Number,
    frequency: {
      type: String,
      enum: ['one-time', 'monthly', 'quarterly', 'yearly']
    },
    startDate: Date,
    endDate: Date,
    status: {
      type: String,
      enum: ['active', 'paused', 'completed'],
      default: 'active'
    }
  }]
});
```

### 6. Appointment Schema

```javascript
const AppointmentSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  providerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Provider',
    required: true
  },
  serviceId: String,
  scheduledDate: {
    type: Date,
    required: true
  },
  duration: {
    type: Number,
    default: 30
  },
  status: {
    type: String,
    enum: ['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'],
    default: 'scheduled'
  },
  type: {
    type: String,
    enum: ['in-person', 'video', 'phone'],
    default: 'in-person'
  },
  notes: String,
  symptoms: [String],
  diagnosis: String,
  prescription: String,
  payment: {
    amount: Number,
    method: {
      type: String,
      enum: ['anola-wallet', 'insurance', 'cash', 'card']
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'refunded'],
      default: 'pending'
    }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
```

### 7. Order Schema (Vendor Orders)

```javascript
const OrderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true
  },
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'customerType'
  },
  customerType: {
    type: String,
    enum: ['Patient', 'Provider', 'Sponsor'],
    required: true
  },
  items: [{
    productId: String,
    productName: String,
    quantity: Number,
    price: Number,
    subtotal: Number
  }],
  totalAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded'],
    default: 'pending'
  },
  shippingAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String
  },
  trackingNumber: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
```

### 8. Transaction Schema (Wallet Transactions)

```javascript
const TransactionSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  type: {
    type: String,
    enum: ['deposit', 'withdrawal', 'payment', 'refund', 'sponsorship'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  balanceType: {
    type: String,
    enum: ['personal', 'sponsored']
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  description: String,
  relatedEntityId: mongoose.Schema.Types.ObjectId,
  relatedEntityType: String,
  createdAt: { type: Date, default: Date.now }
});
```

---

## 🔌 API Endpoints

### Authentication & Authorization

```
POST   /api/auth/register          - Register new user
POST   /api/auth/login             - Login user
POST   /api/auth/logout            - Logout user
POST   /api/auth/refresh-token     - Refresh access token
POST   /api/auth/forgot-password   - Request password reset
POST   /api/auth/reset-password    - Reset password
GET    /api/auth/verify-email/:token - Verify email address
```

### Patient Dashboard Endpoints

#### Main Dashboard
```
GET    /api/patient/dashboard      - Get dashboard overview
GET    /api/patient/stats          - Get quick statistics
```

#### Appointments
```
GET    /api/patient/appointments              - List all appointments
GET    /api/patient/appointments/:id          - Get appointment details
POST   /api/patient/appointments              - Book new appointment
PUT    /api/patient/appointments/:id          - Update appointment
DELETE /api/patient/appointments/:id          - Cancel appointment
GET    /api/patient/appointments/upcoming     - Get upcoming appointments
GET    /api/patient/appointments/history      - Get past appointments
```

#### Medical Records
```
GET    /api/patient/records                   - Get all medical records
GET    /api/patient/records/:id               - Get specific record
POST   /api/patient/records                   - Add new record
PUT    /api/patient/records/:id               - Update record
GET    /api/patient/records/recent            - Get recent records
GET    /api/patient/medications               - Get current medications
POST   /api/patient/medications               - Add medication
```

#### Wallet
```
GET    /api/patient/wallet                    - Get wallet balance
GET    /api/patient/wallet/transactions       - Get transaction history
POST   /api/patient/wallet/deposit            - Deposit funds
POST   /api/patient/wallet/withdraw           - Withdraw funds
GET    /api/patient/wallet/sponsored          - Get sponsored balance details
```

#### Health Card
```
GET    /api/patient/health-card               - Get health card details
PUT    /api/patient/health-card               - Update health card
GET    /api/patient/health-card/qr            - Generate QR code
```

#### Providers
```
GET    /api/patient/providers                 - List all providers
GET    /api/patient/providers/:id             - Get provider details
GET    /api/patient/providers/search          - Search providers
GET    /api/patient/providers/recommended     - Get recommended providers
GET    /api/patient/providers/:id/reviews     - Get provider reviews
POST   /api/patient/providers/:id/reviews     - Add provider review
```

### Provider Dashboard Endpoints

#### Main Dashboard
```
GET    /api/provider/dashboard                - Get dashboard overview
GET    /api/provider/stats                    - Get statistics
```

#### Appointments
```
GET    /api/provider/appointments             - List all appointments
GET    /api/provider/appointments/:id         - Get appointment details
PUT    /api/provider/appointments/:id         - Update appointment
PUT    /api/provider/appointments/:id/status  - Update appointment status
GET    /api/provider/appointments/today       - Today's appointments
GET    /api/provider/appointments/upcoming    - Upcoming appointments
POST   /api/provider/appointments/:id/notes   - Add appointment notes
```

#### Patients
```
GET    /api/provider/patients                 - List all patients
GET    /api/provider/patients/:id             - Get patient details
GET    /api/provider/patients/:id/history     - Get patient history
POST   /api/provider/patients/:id/notes       - Add patient notes
GET    /api/provider/patients/recent          - Recently seen patients
```

#### Schedule
```
GET    /api/provider/schedule                 - Get schedule
GET    /api/provider/schedule/week            - Get weekly schedule
PUT    /api/provider/schedule/availability    - Update availability
POST   /api/provider/schedule/time-off        - Add time off
DELETE /api/provider/schedule/time-off/:id    - Remove time off
PUT    /api/provider/schedule/settings        - Update schedule settings
```

#### Services
```
GET    /api/provider/services                 - List all services
GET    /api/provider/services/:id             - Get service details
POST   /api/provider/services                 - Add new service
PUT    /api/provider/services/:id             - Update service
DELETE /api/provider/services/:id             - Delete service
PUT    /api/provider/services/:id/status      - Activate/deactivate service
```

#### Earnings
```
GET    /api/provider/earnings                 - Get earnings overview
GET    /api/provider/earnings/transactions    - Get transaction history
GET    /api/provider/earnings/monthly         - Get monthly earnings
GET    /api/provider/earnings/stats           - Get earnings statistics
POST   /api/provider/earnings/withdraw        - Request withdrawal
```

### Vendor Dashboard Endpoints

#### Main Dashboard
```
GET    /api/vendor/dashboard                  - Get dashboard overview
GET    /api/vendor/stats                      - Get statistics
```

#### Orders
```
GET    /api/vendor/orders                     - List all orders
GET    /api/vendor/orders/:id                 - Get order details
PUT    /api/vendor/orders/:id/status          - Update order status
GET    /api/vendor/orders/pending             - Get pending orders
GET    /api/vendor/orders/processing          - Get processing orders
POST   /api/vendor/orders/:id/tracking        - Add tracking info
```

#### Inventory
```
GET    /api/vendor/inventory                  - Get inventory list
GET    /api/vendor/inventory/:id              - Get item details
PUT    /api/vendor/inventory/:id              - Update inventory
POST   /api/vendor/inventory/restock          - Restock items
GET    /api/vendor/inventory/low-stock        - Get low stock items
```

#### Products
```
GET    /api/vendor/products                   - List all products
GET    /api/vendor/products/:id               - Get product details
POST   /api/vendor/products                   - Create product
PUT    /api/vendor/products/:id               - Update product
DELETE /api/vendor/products/:id               - Delete product
POST   /api/vendor/products/import            - Import products (CSV)
GET    /api/vendor/products/best-sellers      - Get best sellers
```

#### Analytics
```
GET    /api/vendor/analytics/revenue          - Get revenue data
GET    /api/vendor/analytics/sales            - Get sales breakdown
GET    /api/vendor/analytics/customers        - Get customer metrics
GET    /api/vendor/analytics/performance      - Get performance KPIs
GET    /api/vendor/analytics/geographic       - Get geographic distribution
POST   /api/vendor/analytics/export           - Export analytics report
```

#### Customers
```
GET    /api/vendor/customers                  - List all customers
GET    /api/vendor/customers/:id              - Get customer details
PUT    /api/vendor/customers/:id              - Update customer
GET    /api/vendor/customers/:id/orders       - Get customer order history
GET    /api/vendor/customers/top              - Get top customers
GET    /api/vendor/customers/at-risk          - Get at-risk customers
GET    /api/vendor/customers/new              - Get new customers
```

### Sponsor Dashboard Endpoints

#### Main Dashboard
```
GET    /api/sponsor/dashboard                 - Get dashboard overview
GET    /api/sponsor/stats                     - Get statistics
```

#### Sponsorships
```
GET    /api/sponsor/sponsorships              - List all sponsorships
GET    /api/sponsor/sponsorships/:id          - Get sponsorship details
POST   /api/sponsor/sponsorships              - Create new sponsorship
PUT    /api/sponsor/sponsorships/:id          - Update sponsorship
DELETE /api/sponsor/sponsorships/:id          - Cancel sponsorship
GET    /api/sponsor/sponsorships/active       - Get active sponsorships
```

#### Beneficiaries (To be implemented)
```
GET    /api/sponsor/beneficiaries             - List all beneficiaries
GET    /api/sponsor/beneficiaries/:id         - Get beneficiary details
```

---

## 🔐 Authentication Middleware

```javascript
// middleware/auth.js
const jwt = require('jsonwebtoken');

const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    req.userType = decoded.userType;

    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

const authorize = (...allowedTypes) => {
  return (req, res, next) => {
    if (!allowedTypes.includes(req.userType)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    next();
  };
};

module.exports = { authenticate, authorize };
```

---

## 📡 Real-time Updates (WebSocket)

```javascript
// socket/index.js
const socketIO = require('socket.io');

const initializeSocket = (server) => {
  const io = socketIO(server, {
    cors: {
      origin: process.env.FRONTEND_URL,
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Join user-specific room
    socket.on('join', (userId) => {
      socket.join(`user:${userId}`);
    });

    // Appointment updates
    socket.on('appointment:update', (data) => {
      io.to(`user:${data.patientId}`).emit('appointment:updated', data);
      io.to(`user:${data.providerId}`).emit('appointment:updated', data);
    });

    // Order updates
    socket.on('order:update', (data) => {
      io.to(`user:${data.customerId}`).emit('order:updated', data);
      io.to(`user:${data.vendorId}`).emit('order:updated', data);
    });

    // Wallet updates
    socket.on('wallet:update', (data) => {
      io.to(`user:${data.userId}`).emit('wallet:updated', data);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
};

module.exports = initializeSocket;
```

---

## 📤 File Upload Configuration

```javascript
// config/multer.js
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads', req.userType);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

module.exports = upload;
```

---

## 📊 Export Functionality

```javascript
// utils/export.js
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');

const exportToPDF = async (data, type) => {
  const doc = new PDFDocument();

  // Header
  doc.fontSize(20).text(`${type} Report`, { align: 'center' });
  doc.moveDown();

  // Data
  data.forEach(item => {
    doc.fontSize(12).text(JSON.stringify(item));
    doc.moveDown();
  });

  return doc;
};

const exportToCSV = async (data, headers) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Report');

  worksheet.columns = headers.map(h => ({ header: h, key: h }));
  worksheet.addRows(data);

  return await workbook.csv.writeBuffer();
};

module.exports = { exportToPDF, exportToCSV };
```

---

## 🔄 Next Steps

### Immediate Tasks:
1. Set up MongoDB database and collections
2. Implement authentication system
3. Create API routes for all endpoints
4. Set up WebSocket for real-time updates
5. Configure file upload handling
6. Implement export functionality

### Frontend Integration:
1. Replace mock data with API calls
2. Add error handling and loading states
3. Implement WebSocket listeners
4. Add form validation
5. Set up authentication context
6. Add toast notifications

### Testing:
1. Unit tests for all API endpoints
2. Integration tests for user flows
3. Load testing for scalability
4. Security testing

---

## 📝 Environment Variables Required

```env
# Database
MONGODB_URI=mongodb://localhost:27017/anola-health
MONGODB_TEST_URI=mongodb://localhost:27017/anola-health-test

# JWT
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=24h
REFRESH_TOKEN_SECRET=your-refresh-secret-here
REFRESH_TOKEN_EXPIRES_IN=7d

# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-password

# File Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880

# Payment (if applicable)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# AWS S3 (for production file storage)
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_BUCKET_NAME=anola-health-uploads
AWS_REGION=us-east-1
```

---

## 🎯 Success Metrics

**API Performance:**
- Response time < 200ms for 95% of requests
- 99.9% uptime
- Handle 1000+ concurrent users

**Data Integrity:**
- Zero data loss
- Proper error handling
- Transaction rollback on failures

**Security:**
- All endpoints authenticated
- Role-based access control
- Data encryption at rest and in transit
- Regular security audits

---

**Status:** 📋 Ready for Backend Development
**Priority:** High - Frontend is complete and waiting for integration
