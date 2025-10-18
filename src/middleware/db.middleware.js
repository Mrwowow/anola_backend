const mongoose = require('mongoose');
const connectDB = require('../config/database');

/**
 * Middleware to ensure database connection is established
 * before processing requests in serverless environments
 */
const ensureDbConnection = async (req, res, next) => {
  try {
    // Check if connection is already active
    if (mongoose.connection.readyState === 1) {
      return next();
    }

    // If not connected, establish connection
    await connectDB();
    next();
  } catch (error) {
    console.error('Database connection middleware error:', error.message);
    return res.status(503).json({
      success: false,
      message: 'Database connection unavailable',
      error: error.message
    });
  }
};

module.exports = { ensureDbConnection };
