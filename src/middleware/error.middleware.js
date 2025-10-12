const { HTTP_STATUS, ERROR_MESSAGES } = require('../utils/constants');
const config = require('../config/config');

/**
 * Global error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  
  // Log error in development
  if (config.nodeEnv === 'development') {
    console.error('Error Details:', {
      message: err.message,
      stack: err.stack,
      url: req.url,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
  } else {
    // In production, log to monitoring service
    console.error('Error:', err.message);
  }
  
  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = ERROR_MESSAGES.NOT_FOUND;
    error = { message, statusCode: HTTP_STATUS.NOT_FOUND };
  }
  
  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `Duplicate field value: ${field}`;
    error = { message, statusCode: HTTP_STATUS.CONFLICT };
  }
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = { message, statusCode: HTTP_STATUS.BAD_REQUEST };
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = { message, statusCode: HTTP_STATUS.UNAUTHORIZED };
  }
  
  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = { message, statusCode: HTTP_STATUS.UNAUTHORIZED };
  }
  
  // Rate limiting errors
  if (err.statusCode === HTTP_STATUS.TOO_MANY_REQUESTS) {
    error.message = ERROR_MESSAGES.RATE_LIMIT_EXCEEDED;
  }
  
  // Default error response
  const statusCode = error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  const message = error.message || ERROR_MESSAGES.INTERNAL_ERROR;
  
  res.status(statusCode).json({
    success: false,
    error: message,
    ...(config.nodeEnv === 'development' && { 
      stack: err.stack,
      details: error 
    })
  });
};

/**
 * 404 handler for undefined routes
 */
const notFound = (req, res, next) => {
  const error = new Error(`Route ${req.originalUrl} not found`);
  error.statusCode = HTTP_STATUS.NOT_FOUND;
  next(error);
};

module.exports = {
  errorHandler,
  notFound
};