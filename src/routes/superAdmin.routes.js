const express = require('express');
const router = express.Router();
const superAdminController = require('../controllers/superAdmin.controller');
const { protect } = require('../middleware/auth.middleware');
const { isSuperAdmin, hasPermission, isMasterAdmin, logAction } = require('../middleware/superAdmin.middleware');

// All routes require authentication and super admin access
router.use(protect);
router.use(isSuperAdmin);

// ==================== Dashboard & Analytics ====================

/**
 * @swagger
 * /api/v1/super-admin/dashboard:
 *   get:
 *     summary: Get platform dashboard and analytics
 *     tags: [SuperAdmin]
 *     security:
 *       - bearerAuth: []
 */
router.get('/dashboard', hasPermission('viewAnalytics'), superAdminController.getDashboard);

/**
 * @swagger
 * /api/v1/super-admin/statistics:
 *   get:
 *     summary: Get platform statistics with trends
 *     tags: [SuperAdmin]
 *     security:
 *       - bearerAuth: []
 */
router.get('/statistics', hasPermission('viewAnalytics'), superAdminController.getStatistics);

// ==================== User Management ====================

/**
 * @swagger
 * /api/v1/super-admin/users:
 *   get:
 *     summary: Get all users with filters
 *     tags: [SuperAdmin]
 *     security:
 *       - bearerAuth: []
 */
router.get('/users', hasPermission('manageUsers'), superAdminController.getAllUsers);

/**
 * @swagger
 * /api/v1/super-admin/users/:id:
 *   get:
 *     summary: Get user by ID
 *     tags: [SuperAdmin]
 *     security:
 *       - bearerAuth: []
 */
router.get('/users/:id', hasPermission('manageUsers'), superAdminController.getUserById);

/**
 * @swagger
 * /api/v1/super-admin/users/:id/status:
 *   patch:
 *     summary: Update user status
 *     tags: [SuperAdmin]
 *     security:
 *       - bearerAuth: []
 */
router.patch(
  '/users/:id/status',
  hasPermission('manageUsers'),
  logAction('UPDATE_USER_STATUS', 'User'),
  superAdminController.updateUserStatus
);

/**
 * @swagger
 * /api/v1/super-admin/users/:id/verify:
 *   post:
 *     summary: Verify user identity
 *     tags: [SuperAdmin]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/users/:id/verify',
  hasPermission('manageUsers'),
  logAction('VERIFY_USER', 'User'),
  superAdminController.verifyUser
);

/**
 * @swagger
 * /api/v1/super-admin/users/:id:
 *   delete:
 *     summary: Permanently delete user (Master Admin only)
 *     tags: [SuperAdmin]
 *     security:
 *       - bearerAuth: []
 */
router.delete(
  '/users/:id',
  isMasterAdmin,
  hasPermission('manageUsers'),
  logAction('DELETE_USER', 'User'),
  superAdminController.deleteUser
);

// ==================== Provider Management ====================

/**
 * @swagger
 * /api/v1/super-admin/providers:
 *   get:
 *     summary: Get all providers
 *     tags: [SuperAdmin]
 *     security:
 *       - bearerAuth: []
 */
router.get('/providers', hasPermission('manageProviders'), superAdminController.getAllProviders);

/**
 * @swagger
 * /api/v1/super-admin/providers/:id/verify:
 *   post:
 *     summary: Verify provider credentials
 *     tags: [SuperAdmin]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/providers/:id/verify',
  hasPermission('manageProviders'),
  logAction('VERIFY_PROVIDER', 'Provider'),
  superAdminController.verifyProvider
);

// ==================== Transaction Management ====================

/**
 * @swagger
 * /api/v1/super-admin/transactions:
 *   get:
 *     summary: Get all transactions
 *     tags: [SuperAdmin]
 *     security:
 *       - bearerAuth: []
 */
router.get('/transactions', hasPermission('manageTransactions'), superAdminController.getAllTransactions);

/**
 * @swagger
 * /api/v1/super-admin/transactions/:id/reverse:
 *   post:
 *     summary: Reverse a transaction
 *     tags: [SuperAdmin]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/transactions/:id/reverse',
  hasPermission('manageTransactions'),
  logAction('REVERSE_TRANSACTION', 'Transaction'),
  superAdminController.reverseTransaction
);

// ==================== Sponsorship Management ====================

/**
 * @swagger
 * /api/v1/super-admin/sponsorships:
 *   get:
 *     summary: Get all sponsorships
 *     tags: [SuperAdmin]
 *     security:
 *       - bearerAuth: []
 */
router.get('/sponsorships', hasPermission('manageSponsorships'), superAdminController.getAllSponsorships);

// ==================== Audit & Logs ====================

/**
 * @swagger
 * /api/v1/super-admin/audit-logs:
 *   get:
 *     summary: Get audit logs
 *     tags: [SuperAdmin]
 *     security:
 *       - bearerAuth: []
 */
router.get('/audit-logs', hasPermission('auditLogs'), superAdminController.getAuditLogs);

// ==================== Admin Management (Master Admin Only) ====================

/**
 * @swagger
 * /api/v1/super-admin/admins:
 *   get:
 *     summary: Get all super admins (Master Admin only)
 *     tags: [SuperAdmin]
 *     security:
 *       - bearerAuth: []
 */
router.get('/admins', isMasterAdmin, hasPermission('createAdmins'), superAdminController.getAllSuperAdmins);

/**
 * @swagger
 * /api/v1/super-admin/admins:
 *   post:
 *     summary: Create new super admin (Master Admin only)
 *     tags: [SuperAdmin]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/admins',
  isMasterAdmin,
  hasPermission('createAdmins'),
  logAction('CREATE_ADMIN', 'SuperAdmin'),
  superAdminController.createSuperAdmin
);

/**
 * @swagger
 * /api/v1/super-admin/admins/:id/permissions:
 *   patch:
 *     summary: Update admin permissions (Master Admin only)
 *     tags: [SuperAdmin]
 *     security:
 *       - bearerAuth: []
 */
router.patch(
  '/admins/:id/permissions',
  isMasterAdmin,
  hasPermission('createAdmins'),
  logAction('UPDATE_ADMIN_PERMISSIONS', 'SuperAdmin'),
  superAdminController.updateAdminPermissions
);

module.exports = router;
