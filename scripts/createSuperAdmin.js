/**
 * Script to create the first Super Admin (Master Admin)
 *
 * Usage:
 * node scripts/createSuperAdmin.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const readline = require('readline');
const SuperAdmin = require('../src/models/superAdmin.model');
const { USER_TYPES, ACCOUNT_STATUS } = require('../src/utils/constants');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function createSuperAdmin() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log('=== Create Master Super Admin ===\n');

    // Get admin details from user input
    const email = await question('Enter admin email: ');
    const password = await question('Enter admin password (min 8 characters): ');
    const firstName = await question('Enter first name: ');
    const lastName = await question('Enter last name: ');
    const phone = await question('Enter phone number: ');
    const nationalId = await question('Enter national ID: ');
    const country = await question('Enter country (default: Rwanda): ') || 'Rwanda';
    const employeeId = await question('Enter employee ID (optional): ');
    const department = await question('Enter department (optional): ');

    // Validate inputs
    if (!email || !password || !firstName || !lastName || !phone || !nationalId) {
      console.error('\n❌ Error: All required fields must be filled');
      process.exit(1);
    }

    if (password.length < 8) {
      console.error('\n❌ Error: Password must be at least 8 characters');
      process.exit(1);
    }

    // Check if admin with email already exists
    const existingAdmin = await SuperAdmin.findOne({ email });
    if (existingAdmin) {
      console.error('\n❌ Error: Admin with this email already exists');
      process.exit(1);
    }

    // Create super admin
    const superAdmin = await SuperAdmin.create({
      email,
      password,
      phone,
      userType: USER_TYPES.SUPER_ADMIN,
      profile: {
        firstName,
        lastName,
        nationalId,
        dateOfBirth: new Date('1990-01-01'), // Default, can be updated later
        address: {
          country: country,
          city: 'N/A',
          state: 'N/A'
        }
      },
      adminLevel: 'master', // Master admin
      permissions: {
        manageUsers: true,
        manageProviders: true,
        managePatients: true,
        manageSponsors: true,
        manageVendors: true,
        manageTransactions: true,
        manageAppointments: true,
        manageMedicalRecords: true,
        manageSponsorships: true,
        manageWallets: true,
        viewAnalytics: true,
        systemSettings: true,
        auditLogs: true,
        createAdmins: true // Can create other admins
      },
      employeeId: employeeId || undefined,
      department: department || undefined,
      status: ACCOUNT_STATUS.ACTIVE,
      twoFactorRequired: true
    });

    console.log('\n✅ Master Super Admin created successfully!\n');
    console.log('Admin Details:');
    console.log('================');
    console.log(`Email: ${superAdmin.email}`);
    console.log(`Name: ${superAdmin.profile.firstName} ${superAdmin.profile.lastName}`);
    console.log(`Admin Level: ${superAdmin.adminLevel}`);
    console.log(`User ID: ${superAdmin._id}`);
    console.log(`Employee ID: ${superAdmin.employeeId || 'N/A'}`);
    console.log(`Department: ${superAdmin.department || 'N/A'}`);
    console.log('\nAll permissions: ENABLED');
    console.log('\nYou can now login with these credentials at /api/auth/login');
    console.log('\nIMPORTANT: Please set up 2FA after first login for security!\n');

  } catch (error) {
    console.error('\n❌ Error creating super admin:', error.message);
    if (error.code === 11000) {
      console.error('Duplicate key error - email, phone, or national ID already exists');
    }
  } finally {
    rl.close();
    await mongoose.connection.close();
    process.exit(0);
  }
}

// Run the script
createSuperAdmin();
