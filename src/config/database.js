const mongoose = require('mongoose');
const config = require('./config');

// Cache the connection for serverless environments
let cachedConnection = null;

const connectDB = async () => {
  try {
    // If we already have a cached connection and it's connected, reuse it
    if (cachedConnection && mongoose.connection.readyState === 1) {
      console.log('Using cached MongoDB connection');
      return cachedConnection;
    }

    if (!config.mongoUri) {
      throw new Error('MongoDB URI is not defined in environment variables');
    }

    // Optimized options for serverless/Vercel
    const options = {
      maxPoolSize: 10,
      minPoolSize: 1,
      serverSelectionTimeoutMS: 30000, // Increased to 30 seconds for serverless cold starts
      socketTimeoutMS: 45000,
      family: 4, // Force IPv4
      // Disable buffering for serverless
      bufferCommands: false,
      // Auto-index only in development
      autoIndex: config.nodeEnv !== 'production',
    };

    console.log('Connecting to MongoDB...');
    console.log('Environment:', config.nodeEnv);

    // Connect to MongoDB
    const conn = await mongoose.connect(config.mongoUri, options);

    console.log('MongoDB Connected Successfully');
    console.log('Database Host:', mongoose.connection.host);
    console.log('Database Name:', mongoose.connection.name);

    // Cache the connection
    cachedConnection = conn;

    // Connection event handlers (only set once)
    if (!mongoose.connection._events || !mongoose.connection._events.error) {
      mongoose.connection.on('error', err => {
        console.error('MongoDB connection error:', err);
        cachedConnection = null; // Clear cache on error
      });

      mongoose.connection.on('disconnected', () => {
        console.log('MongoDB disconnected');
        cachedConnection = null; // Clear cache on disconnect
      });

      mongoose.connection.on('reconnected', () => {
        console.log('MongoDB reconnected');
      });
    }

    return conn;

  } catch (error) {
    console.error('Database connection failed:', error.message);
    console.error('Error details:', error);
    cachedConnection = null; // Clear cache on error

    // In production/serverless, don't retry immediately - let next request handle it
    if (config.nodeEnv === 'production') {
      console.log('Will retry on next request');
      throw error; // Throw error so calling code can handle it
    } else {
      process.exit(1);
    }
  }
};

module.exports = connectDB;