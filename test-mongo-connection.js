/**
 * MongoDB Connection Test Script
 *
 * Run locally to verify your MongoDB Atlas connection works
 *
 * Usage:
 * node test-mongo-connection.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Your MongoDB connection string
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://anola:ZNaw0sZTeTWcaP7v@cluster0.r2vfdeu.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

async function testConnection() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║         MongoDB Atlas Connection Test                     ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  console.log('📋 Connection Details:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Mask password in output
  const maskedUri = MONGO_URI.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');
  console.log('URI:', maskedUri);
  console.log('');

  try {
    console.log('🔄 Attempting connection...\n');

    const startTime = Date.now();

    // Connect with optimized settings for serverless
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      family: 4, // Force IPv4
      maxPoolSize: 10,
      minPoolSize: 1,
    });

    const duration = Date.now() - startTime;

    console.log('✅ SUCCESS! Connected to MongoDB Atlas\n');
    console.log('📊 Connection Info:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Host:           ', mongoose.connection.host);
    console.log('Database:       ', mongoose.connection.name || '(default)');
    console.log('Port:           ', mongoose.connection.port);
    console.log('Ready State:    ', mongoose.connection.readyState, '(1 = connected)');
    console.log('Connection Time:', duration, 'ms');
    console.log('');

    // Test a simple operation
    console.log('🧪 Testing database operation...');
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('✅ Found', collections.length, 'collections');
    if (collections.length > 0) {
      console.log('Collections:', collections.map(c => c.name).join(', '));
    }
    console.log('');

    // Ping the database
    console.log('🏓 Pinging database...');
    const pingResult = await mongoose.connection.db.admin().ping();
    console.log('✅ Ping result:', pingResult);
    console.log('');

    await mongoose.connection.close();
    console.log('✅ Connection closed successfully\n');

    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║  ✅ TEST PASSED - Your MongoDB connection works!          ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    console.log('✓ Your connection string is correct');
    console.log('✓ MongoDB Atlas is accessible');
    console.log('✓ IP is whitelisted');
    console.log('✓ Credentials are valid\n');

    console.log('Next steps:');
    console.log('1. Deploy to Vercel: vercel --prod');
    console.log('2. Check Vercel logs: vercel logs');
    console.log('3. Test your API endpoints\n');

    process.exit(0);

  } catch (error) {
    console.log('❌ FAILED! Could not connect to MongoDB Atlas\n');
    console.log('📋 Error Details:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Error Type:    ', error.name);
    console.log('Error Message: ', error.message);
    console.log('');

    if (error.message.includes('authentication failed')) {
      console.log('🔧 Likely Issue: WRONG USERNAME OR PASSWORD\n');
      console.log('Solutions:');
      console.log('1. Verify username in MongoDB Atlas (should be: anola)');
      console.log('2. Verify password in MongoDB Atlas');
      console.log('3. Update connection string with correct credentials');
      console.log('4. Go to: MongoDB Atlas → Database Access → Edit User\n');

    } else if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
      console.log('🔧 Likely Issue: WRONG CLUSTER URL\n');
      console.log('Solutions:');
      console.log('1. Verify cluster URL in connection string');
      console.log('2. Should be: cluster0.r2vfdeu.mongodb.net');
      console.log('3. Get correct URL from MongoDB Atlas → Clusters → Connect\n');

    } else if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
      console.log('🔧 Likely Issue: IP NOT WHITELISTED\n');
      console.log('Solutions:');
      console.log('1. Go to: MongoDB Atlas → Network Access');
      console.log('2. Click: + ADD IP ADDRESS');
      console.log('3. Click: ALLOW ACCESS FROM ANYWHERE (0.0.0.0/0)');
      console.log('4. Wait 2-3 minutes for changes to apply');
      console.log('5. Try again\n');

    } else {
      console.log('🔧 Possible Issues:\n');
      console.log('1. MongoDB cluster is paused');
      console.log('   → Go to: MongoDB Atlas → Clusters → Resume');
      console.log('');
      console.log('2. IP not whitelisted');
      console.log('   → Add 0.0.0.0/0 to Network Access');
      console.log('');
      console.log('3. Wrong connection string format');
      console.log('   → Should start with: mongodb+srv://');
      console.log('');
      console.log('4. Network/firewall blocking connection');
      console.log('   → Try from different network\n');
    }

    console.log('Full error:');
    console.log(error);
    console.log('');

    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║  ❌ TEST FAILED - Please fix the issues above             ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    process.exit(1);
  }
}

// Run the test
testConnection();
