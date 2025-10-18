const Transaction = require('../models/transaction.model');

// Get transaction history
exports.getHistory = async (req, res) => {
  try {
    const { page = 1, limit = 20, type, status } = req.query;
    const userId = req.user._id;

    const query = { user: userId };

    if (type) query.type = type;
    if (status) query.status = status;

    const skip = (page - 1) * limit;

    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Transaction.countDocuments(query);

    res.status(200).json({
      success: true,
      data: transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get transaction history error:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to get transaction history',
      error: error.message
    });
  }
};

// Get transaction details
exports.getDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const transaction = await Transaction.findOne({
      _id: id,
      user: userId
    }).populate('wallet');

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    res.status(200).json({
      success: true,
      data: transaction
    });
  } catch (error) {
    console.error('Get transaction details error:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to get transaction details',
      error: error.message
    });
  }
};

// Get transaction statistics
exports.getStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const { startDate, endDate } = req.query;

    const matchQuery = { user: userId };

    if (startDate || endDate) {
      matchQuery.createdAt = {};
      if (startDate) matchQuery.createdAt.$gte = new Date(startDate);
      if (endDate) matchQuery.createdAt.$lte = new Date(endDate);
    }

    const stats = await Transaction.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    const formattedStats = {
      totalCredit: 0,
      totalDebit: 0,
      creditCount: 0,
      debitCount: 0
    };

    stats.forEach(stat => {
      if (stat._id === 'credit') {
        formattedStats.totalCredit = stat.total;
        formattedStats.creditCount = stat.count;
      } else if (stat._id === 'debit') {
        formattedStats.totalDebit = stat.total;
        formattedStats.debitCount = stat.count;
      }
    });

    formattedStats.netBalance = formattedStats.totalCredit - formattedStats.totalDebit;

    res.status(200).json({
      success: true,
      data: formattedStats
    });
  } catch (error) {
    console.error('Get transaction stats error:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to get transaction statistics',
      error: error.message
    });
  }
};
