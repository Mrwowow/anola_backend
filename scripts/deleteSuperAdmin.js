/**
 * Script to delete a Super Admin by email (for cleanup/testing)
 *
 * Usage:
 * node scripts/deleteSuperAdmin.js <email>
 */

require('dotenv').config();
const mongoose = require('mongoose');
const SuperAdmin = require('../src/models/superAdmin.model');

async function deleteSuperAdmin() {
  try {
    const email = process.argv[2];

    if (!email) {
      console.error('❌ Error: Please provide an email address');
      console.log('Usage: node scripts/deleteSuperAdmin.js <email>');
      process.exit(1);
    }

    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find and delete super admin
    const admin = await SuperAdmin.findOneAndDelete({ email });

    if (!admin) {
      console.log(`ℹ️  No super admin found with email: ${email}`);
    } else {
      console.log('✅ Super admin deleted successfully!');
      console.log('Deleted admin details:');
      console.log(`  Email: ${admin.email}`);
      console.log(`  Name: ${admin.profile.firstName} ${admin.profile.lastName}`);
      console.log(`  ID: ${admin._id}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

deleteSuperAdmin();
