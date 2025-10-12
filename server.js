const app = require('./src/app');
const config = require('./src/config/config');

const PORT = config.port || 3000;

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Anola Health API Server running on port ${PORT}`);
  console.log(`📊 Environment: ${config.nodeEnv}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
  
  if (config.nodeEnv === 'development') {
    console.log(`📖 API Base URL: http://localhost:${PORT}/api`);
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error('Unhandled Promise Rejection:', err.message);
  // Close server & exit process
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received');
  console.log('🔄 Shutting down gracefully');
  server.close(() => {
    console.log('✅ Process terminated');
  });
});

process.on('SIGINT', () => {
  console.log('👋 SIGINT received');
  console.log('🔄 Shutting down gracefully');
  server.close(() => {
    console.log('✅ Process terminated');
  });
});

module.exports = server;