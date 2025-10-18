/**
 * Quick script to create Super Admin without interactive prompts
 *
 * Usage:
 * node scripts/createSuperAdminQuick.js
 *
 * Or customize by editing the ADMIN_DATA object below
 */

require('dotenv').config();
const mongoose = require('mongoose');
const SuperAdmin = require('../src/models/superAdmin.model');
const { USER_TYPES, ACCOUNT_STATUS } = require('../src/utils/constants');

// CUSTOMIZE THESE VALUES
const ADMIN_DATA = {
  email: 'admin@anolalinks.com',
  password: 'Possible@2025',
  firstName: 'Anola',
  lastName: 'Links',
  phone: '08100853150',
  nationalId: '1234567890',
  country: 'Nigeria',
  employeeId: 'EMP001', // Optional
  department: 'Administration' // Optional
};

async function createSuperAdmin() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log('Creating Master Super Admin...\n');

    // Validate inputs
    if (!ADMIN_DATA.email || !ADMIN_DATA.password || !ADMIN_DATA.firstName ||
        !ADMIN_DATA.lastName || !ADMIN_DATA.phone || !ADMIN_DATA.nationalId) {
      console.error('❌ Error: All required fields must be filled');
      process.exit(1);
    }

    if (ADMIN_DATA.password.length < 8) {
      console.error('❌ Error: Password must be at least 8 characters');
      process.exit(1);
    }

    // Check if admin with email already exists
    const existingAdmin = await SuperAdmin.findOne({ email: ADMIN_DATA.email });
    if (existingAdmin) {
      console.error('❌ Error: Admin with this email already exists');
      console.log('\nExisting admin details:');
      console.log(`  Email: ${existingAdmin.email}`);
      console.log(`  Name: ${existingAdmin.profile.firstName} ${existingAdmin.profile.lastName}`);
      console.log(`  ID: ${existingAdmin._id}`);
      console.log('\nTo delete this admin first, run:');
      console.log(`  node scripts/deleteSuperAdmin.js ${ADMIN_DATA.email}`);
      process.exit(1);
    }

    // Create super admin
    const superAdmin = await SuperAdmin.create({
      email: ADMIN_DATA.email,
      password: ADMIN_DATA.password,
      phone: ADMIN_DATA.phone,
      userType: USER_TYPES.SUPER_ADMIN,
      profile: {
        firstName: ADMIN_DATA.firstName,
        lastName: ADMIN_DATA.lastName,
        nationalId: ADMIN_DATA.nationalId,
        dateOfBirth: new Date('1990-01-01'), // Default, can be updated later
        address: {
          country: ADMIN_DATA.country || 'Nigeria',
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
      employeeId: ADMIN_DATA.employeeId || undefined,
      department: ADMIN_DATA.department || undefined,
      status: ACCOUNT_STATUS.ACTIVE,
      twoFactorRequired: true
    });

    console.log('✅ Master Super Admin created successfully!\n');
    console.log('Admin Details:');
    console.log('================');
    console.log(`Email: ${superAdmin.email}`);
    console.log(`Name: ${superAdmin.profile.firstName} ${superAdmin.profile.lastName}`);
    console.log(`Phone: ${superAdmin.phone}`);
    console.log(`Country: ${superAdmin.profile.address.country}`);
    console.log(`Admin Level: ${superAdmin.adminLevel}`);
    console.log(`User ID: ${superAdmin._id}`);
    console.log(`Employee ID: ${superAdmin.employeeId || 'N/A'}`);
    console.log(`Department: ${superAdmin.department || 'N/A'}`);
    console.log('\nAll permissions: ENABLED ✅');
    console.log('\n📝 Login Credentials:');
    console.log('================');
    console.log(`Email: ${ADMIN_DATA.email}`);
    console.log(`Password: ${ADMIN_DATA.password}`);
    console.log('\n🔗 Login at: POST /api/auth/login');
    console.log('\n⚠️  IMPORTANT: Please set up 2FA after first login for security!\n');

  } catch (error) {
    console.error('\n❌ Error creating super admin:', error.message);
    if (error.code === 11000) {
      console.error('Duplicate key error - email, phone, or national ID already exists');
      console.error('\nPlease check if an admin with these details already exists.');
    }
    console.error('\nFull error:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

// Run the script
createSuperAdmin();
