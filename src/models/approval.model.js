const mongoose = require('mongoose');

const approvalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['provider', 'vendor', 'sponsor', 'product'],
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
    index: true
  },
  priority: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'medium',
    index: true
  },
  submittedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  processedAt: {
    type: Date
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  documents: [{
    name: String,
    url: String,
    type: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  notes: {
    type: String
  },
  history: [{
    action: {
      type: String,
      required: true
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    notes: String
  }]
}, {
  timestamps: true
});

// Compound indexes for efficient queries
approvalSchema.index({ status: 1, submittedAt: -1 });
approvalSchema.index({ type: 1, status: 1 });
approvalSchema.index({ priority: 1, status: 1 });

// Virtual for days pending
approvalSchema.virtual('daysPending').get(function() {
  if (this.status !== 'pending') return 0;
  const now = new Date();
  const submitted = this.submittedAt;
  return Math.floor((now - submitted) / (1000 * 60 * 60 * 24));
});

// Ensure virtuals are included in JSON
approvalSchema.set('toJSON', { virtuals: true });
approvalSchema.set('toObject', { virtuals: true });

const Approval = mongoose.model('Approval', approvalSchema);

module.exports = Approval;
