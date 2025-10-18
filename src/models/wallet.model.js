const mongoose = require('mongoose');
const { WALLET_TYPES } = require('../utils/constants');

const walletSchema = new mongoose.Schema({
  walletId: {
    type: String,
    unique: true,
    required: true
  },
  owner: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: Object.values(WALLET_TYPES),
    required: true
  },
  
  // Balance Information
  balance: {
    available: {
      type: Number,
      default: 0,
      min: 0
    },
    pending: {
      type: Number,
      default: 0
    },
    reserved: {
      type: Number,
      default: 0
    },
    currency: {
      type: String,
      default: 'USD'
    }
  },
  
  // Sponsorship Details (for sponsored wallets)
  sponsorship: {
    sponsor: {
      type: mongoose.Schema.ObjectId,
      ref: 'Sponsor'
    },
    allocatedAmount: Number,
    usedAmount: Number,
    validFrom: Date,
    validUntil: Date,
    conditions: {
      maxPerTransaction: Number,
      allowedServices: [String],
      allowedProviders: [{
        type: mongoose.Schema.ObjectId,
        ref: 'Provider'
      }],
      requiresApproval: Boolean
    }
  },
  
  // Transaction History
  transactions: [{
    type: mongoose.Schema.ObjectId,
    ref: 'Transaction'
  }],
  
  // Funding Sources
  fundingSources: [{
    type: {
      type: String,
      enum: ['card', 'bank', 'mobile_money', 'sponsor']
    },
    details: {
      last4: String,
      brand: String,
      bankName: String,
      accountName: String
    },
    isDefault: Boolean,
    addedAt: Date
  }],
  
  // Withdrawal Settings
  withdrawal: {
    method: {
      type: String,
      enum: ['bank', 'mobile_money', 'card']
    },
    details: {
      bankName: String,
      accountNumber: String,
      accountName: String,
      swiftCode: String,
      iban: String,
      mobileNumber: String
    },
    minimumAmount: Number,
    lastWithdrawal: Date
  },
  
  // Security
  pin: {
    type: String,
    select: false
  },
  pinAttempts: {
    type: Number,
    default: 0
  },
  isLocked: {
    type: Boolean,
    default: false
  },
  lockedUntil: Date,
  
  // Limits
  limits: {
    daily: {
      amount: Number,
      transactions: Number
    },
    monthly: {
      amount: Number,
      transactions: Number
    },
    perTransaction: Number
  },
  
  // Statistics
  statistics: {
    totalReceived: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    totalWithdrawn: { type: Number, default: 0 },
    transactionCount: { type: Number, default: 0 },
    lastTransactionDate: Date
  },
  
  // Status
  status: {
    type: String,
    enum: ['active', 'suspended', 'closed'],
    default: 'active'
  },
  suspensionReason: String,
  closedAt: Date
}, {
  timestamps: true
});

// Indexes
// Note: walletId already has a unique index from field definition
walletSchema.index({ owner: 1, type: 1 });
walletSchema.index({ status: 1 });
walletSchema.index({ 'sponsorship.sponsor': 1 });

// Virtual for total balance
walletSchema.virtual('totalBalance').get(function() {
  return this.balance.available + this.balance.pending + this.balance.reserved;
});

// Methods
walletSchema.methods.credit = function(amount, transactionId) {
  this.balance.available += amount;
  this.statistics.totalReceived += amount;
  this.statistics.transactionCount += 1;
  this.statistics.lastTransactionDate = new Date();
  
  if (transactionId) {
    this.transactions.push(transactionId);
  }
  
  return this.save();
};

walletSchema.methods.debit = function(amount, transactionId) {
  if (this.balance.available < amount) {
    throw new Error('Insufficient balance');
  }
  
  this.balance.available -= amount;
  this.statistics.totalSpent += amount;
  this.statistics.transactionCount += 1;
  this.statistics.lastTransactionDate = new Date();
  
  if (transactionId) {
    this.transactions.push(transactionId);
  }
  
  return this.save();
};

walletSchema.methods.reserve = function(amount) {
  if (this.balance.available < amount) {
    throw new Error('Insufficient balance to reserve');
  }
  
  this.balance.available -= amount;
  this.balance.reserved += amount;
  
  return this.save();
};

walletSchema.methods.releaseReserved = function(amount) {
  if (this.balance.reserved < amount) {
    throw new Error('Insufficient reserved balance');
  }
  
  this.balance.reserved -= amount;
  this.balance.available += amount;
  
  return this.save();
};

walletSchema.methods.confirmReserved = function(amount, transactionId) {
  if (this.balance.reserved < amount) {
    throw new Error('Insufficient reserved balance');
  }
  
  this.balance.reserved -= amount;
  this.statistics.totalSpent += amount;
  this.statistics.transactionCount += 1;
  this.statistics.lastTransactionDate = new Date();
  
  if (transactionId) {
    this.transactions.push(transactionId);
  }
  
  return this.save();
};

walletSchema.methods.checkSpendingLimits = function(amount) {
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  
  // This would require aggregating transactions - simplified implementation
  if (this.limits.perTransaction && amount > this.limits.perTransaction) {
    return { valid: false, reason: 'Exceeds per-transaction limit' };
  }
  
  return { valid: true };
};

// Generate wallet ID
walletSchema.pre('save', function(next) {
  if (!this.walletId) {
    const prefix = this.type === 'personal' ? 'PW' : 
                   this.type === 'sponsored' ? 'SW' :
                   this.type === 'global' ? 'GW' :
                   this.type === 'provider' ? 'PRW' : 'VW';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.walletId = `${prefix}-${timestamp}-${random}`;
  }
  next();
});

module.exports = mongoose.model('Wallet', walletSchema);