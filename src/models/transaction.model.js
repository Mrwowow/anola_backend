const mongoose = require('mongoose');
const { TRANSACTION_TYPES } = require('../utils/constants');

const transactionSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    unique: true,
    required: true
  },
  
  // Transaction Type
  type: {
    type: String,
    enum: Object.values(TRANSACTION_TYPES),
    required: true
  },
  category: {
    type: String,
    enum: ['consultation', 'medication', 'lab_test', 'procedure', 'emergency', 'subscription', 'donation'],
    required: true
  },
  
  // Parties Involved
  from: {
    wallet: {
      type: mongoose.Schema.ObjectId,
      ref: 'Wallet'
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    type: String
  },
  to: {
    wallet: {
      type: mongoose.Schema.ObjectId,
      ref: 'Wallet'
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    type: String
  },
  
  // Amount Details
  amount: {
    value: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'USD'
    },
    exchangeRate: Number,
    originalAmount: Number,
    originalCurrency: String
  },
  
  // Fees
  fees: {
    platform: {
      type: Number,
      default: 0
    },
    payment: {
      type: Number,
      default: 0
    },
    tax: {
      type: Number,
      default: 0
    },
    total: {
      type: Number,
      default: 0
    }
  },
  
  // Reference
  reference: {
    type: {
      type: String,
      enum: ['appointment', 'prescription', 'order', 'subscription', 'donation']
    },
    id: mongoose.Schema.Types.Mixed,
    details: String
  },
  
  // Payment Method
  paymentMethod: {
    type: {
      type: String,
      enum: ['wallet', 'card', 'bank', 'mobile_money', 'cash', 'insurance', 'sponsor']
    },
    details: {
      last4: String,
      brand: String,
      bankName: String
    }
  },
  
  // Status
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'reversed'],
    default: 'pending'
  },
  statusHistory: [{
    status: String,
    timestamp: Date,
    reason: String
  }],
  
  // Processing Information
  processor: {
    name: String,
    transactionId: String,
    responseCode: String,
    responseMessage: String
  },
  
  // Metadata
  metadata: {
    ip: String,
    userAgent: String,
    location: String,
    device: String
  },
  
  // Timestamps
  initiatedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date,
  failedAt: Date,
  reversedAt: Date,
  
  // Notes
  description: String,
  internalNotes: String,
  failureReason: String
}, {
  timestamps: true
});

// Indexes
transactionSchema.index({ transactionId: 1 });
transactionSchema.index({ 'from.wallet': 1, createdAt: -1 });
transactionSchema.index({ 'to.wallet': 1, createdAt: -1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ type: 1, category: 1 });
transactionSchema.index({ initiatedAt: -1 });

// Virtual for net amount (amount - fees)
transactionSchema.virtual('netAmount').get(function() {
  return this.amount.value - this.fees.total;
});

// Methods
transactionSchema.methods.updateStatus = function(newStatus, reason) {
  this.statusHistory.push({
    status: this.status,
    timestamp: new Date(),
    reason: reason || ''
  });
  
  this.status = newStatus;
  
  switch (newStatus) {
    case 'completed':
      this.completedAt = new Date();
      break;
    case 'failed':
      this.failedAt = new Date();
      break;
    case 'reversed':
      this.reversedAt = new Date();
      break;
  }
  
  return this.save();
};

transactionSchema.methods.calculateFees = function() {
  const amount = this.amount.value;
  
  // Platform fee calculation (e.g., 2.5%)
  this.fees.platform = Math.round(amount * 0.025 * 100) / 100;
  
  // Payment method fees
  if (this.paymentMethod.type === 'card') {
    this.fees.payment = Math.round(amount * 0.029 * 100) / 100; // 2.9% for cards
  } else if (this.paymentMethod.type === 'bank') {
    this.fees.payment = 0.5; // Fixed $0.50 for bank transfers
  }
  
  // Tax calculation (if applicable)
  this.fees.tax = Math.round(amount * 0.05 * 100) / 100; // 5% tax
  
  // Total fees
  this.fees.total = this.fees.platform + this.fees.payment + this.fees.tax;
  
  return this.fees.total;
};

transactionSchema.methods.reverse = function(reason) {
  if (this.status !== 'completed') {
    throw new Error('Can only reverse completed transactions');
  }
  
  return this.updateStatus('reversed', reason);
};

// Generate transaction ID
transactionSchema.pre('save', function(next) {
  if (!this.transactionId) {
    const date = new Date();
    const timestamp = date.getTime().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 7).toUpperCase();
    this.transactionId = `TXN-${timestamp}-${random}`;
  }
  
  // Calculate fees if not set
  if (this.fees.total === 0) {
    this.calculateFees();
  }
  
  next();
});

// Static methods
transactionSchema.statics.findByReference = function(type, id) {
  return this.find({
    'reference.type': type,
    'reference.id': id
  });
};

transactionSchema.statics.findByWallet = function(walletId, startDate, endDate) {
  const query = {
    $or: [
      { 'from.wallet': walletId },
      { 'to.wallet': walletId }
    ]
  };
  
  if (startDate && endDate) {
    query.createdAt = { $gte: startDate, $lte: endDate };
  }
  
  return this.find(query).sort({ createdAt: -1 });
};

module.exports = mongoose.model('Transaction', transactionSchema);