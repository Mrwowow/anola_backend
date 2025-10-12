const mongoose = require('mongoose');
const config = require('./config');

const connectDB = async () => {
  try {
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };
    
    if (!config.mongoUri) {
      throw new Error('MongoDB URI is not defined in environment variables');
    }
    
    await mongoose.connect(config.mongoUri, options);
    
    console.log('MongoDB Connected Successfully');
    console.log('Database Host:', mongoose.connection.host);
    console.log('Database Name:', mongoose.connection.name);
    
    // Connection event handlers
    mongoose.connection.on('error', err => {
      console.error('MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected');
    });
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed through app termination');
      process.exit(0);
    });
    
  } catch (error) {
    console.error('Database connection failed:', error.message);
    // In production, you might want to retry connection
    if (config.nodeEnv === 'production') {
      console.log('Retrying database connection in 5 seconds...');
      setTimeout(connectDB, 5000);
    } else {
      process.exit(1);
    }
  }
};

module.exports = connectDB;