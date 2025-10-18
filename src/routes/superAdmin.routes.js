const express = require('express');
const router = express.Router();
const superAdminController = require('../controllers/superAdmin.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { isSuperAdmin, hasPermission, isMasterAdmin, logAction } = require('../middleware/superAdmin.middleware');

// All routes require authentication and super admin access
router.use(authenticate);
router.use(isSuperAdmin);

// ==================== Dashboard & Analytics ====================

/**
 * @swagger
 * /api/super-admin/dashboard:
 *   get:
 *     summary: Get platform dashboard and analytics
 *     tags: [SuperAdmin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics retrieved successfully
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Insufficient permissions
 */
router.get('/dashboard', hasPermission('viewAnalytics'), superAdminController.getDashboard);

/**
 * @swagger
 * /api/super-admin/statistics:
 *   get:
 *     summary: Get platform statistics with trends
 *     tags: [SuperAdmin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Operation successful
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Insufficient permissions */
router.get('/statistics', hasPermission('viewAnalytics'), superAdminController.getStatistics);

// ==================== User Management ====================

/**
 * @swagger
 * /api/super-admin/users:
 *   get:
 *     summary: Get all users with filters
 *     tags: [SuperAdmin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Operation successful
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Insufficient permissions */
router.get('/users', hasPermission('manageUsers'), superAdminController.getAllUsers);

/**
 * @swagger
 * /api/super-admin/users/:id:
 *   get:
 *     summary: Get user by ID
 *     tags: [SuperAdmin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Operation successful
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Insufficient permissions */
router.get('/users/:id', hasPermission('manageUsers'), superAdminController.getUserById);

/**
 * @swagger
 * /api/super-admin/users/:id/status:
 *   patch:
 *     summary: Update user status
 *     tags: [SuperAdmin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Operation successful
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Insufficient permissions */
router.patch(
  '/users/:id/status',
  hasPermission('manageUsers'),
  logAction('UPDATE_USER_STATUS', 'User'),
  superAdminController.updateUserStatus
);

/**
 * @swagger
 * /api/super-admin/users/:id/verify:
 *   post:
 *     summary: Verify user identity
 *     tags: [SuperAdmin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Operation successful
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Insufficient permissions */
router.post(
  '/users/:id/verify',
  hasPermission('manageUsers'),
  logAction('VERIFY_USER', 'User'),
  superAdminController.verifyUser
);

/**
 * @swagger
 * /api/super-admin/users/:id:
 *   delete:
 *     summary: Permanently delete user (Master Admin only)
 *     tags: [SuperAdmin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Operation successful
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Insufficient permissions */
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
 * /api/super-admin/providers:
 *   get:
 *     summary: Get all providers
 *     tags: [SuperAdmin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Operation successful
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Insufficient permissions */
router.get('/providers', hasPermission('manageProviders'), superAdminController.getAllProviders);

/**
 * @swagger
 * /api/super-admin/providers/:id/verify:
 *   post:
 *     summary: Verify provider credentials
 *     tags: [SuperAdmin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Operation successful
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Insufficient permissions */
router.post(
  '/providers/:id/verify',
  hasPermission('manageProviders'),
  logAction('VERIFY_PROVIDER', 'Provider'),
  superAdminController.verifyProvider
);

// ==================== Transaction Management ====================

/**
 * @swagger
 * /api/super-admin/transactions:
 *   get:
 *     summary: Get all transactions
 *     tags: [SuperAdmin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Operation successful
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Insufficient permissions */
router.get('/transactions', hasPermission('manageTransactions'), superAdminController.getAllTransactions);

/**
 * @swagger
 * /api/super-admin/transactions/:id/reverse:
 *   post:
 *     summary: Reverse a transaction
 *     tags: [SuperAdmin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Operation successful
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Insufficient permissions */
router.post(
  '/transactions/:id/reverse',
  hasPermission('manageTransactions'),
  logAction('REVERSE_TRANSACTION', 'Transaction'),
  superAdminController.reverseTransaction
);

// ==================== Sponsorship Management ====================

/**
 * @swagger
 * /api/super-admin/sponsorships:
 *   get:
 *     summary: Get all sponsorships
 *     tags: [SuperAdmin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Operation successful
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Insufficient permissions */
router.get('/sponsorships', hasPermission('manageSponsorships'), superAdminController.getAllSponsorships);

// ==================== Audit & Logs ====================

/**
 * @swagger
 * /api/super-admin/audit-logs:
 *   get:
 *     summary: Get audit logs
 *     tags: [SuperAdmin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Operation successful
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Insufficient permissions */
router.get('/audit-logs', hasPermission('auditLogs'), superAdminController.getAuditLogs);

// ==================== Admin Management (Master Admin Only) ====================

/**
 * @swagger
 * /api/super-admin/admins:
 *   get:
 *     summary: Get all super admins (Master Admin only)
 *     tags: [SuperAdmin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Operation successful
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Insufficient permissions */
router.get('/admins', isMasterAdmin, hasPermission('createAdmins'), superAdminController.getAllSuperAdmins);

/**
 * @swagger
 * /api/super-admin/admins:
 *   post:
 *     summary: Create new super admin (Master Admin only)
 *     tags: [SuperAdmin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Operation successful
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Insufficient permissions */
router.post(
  '/admins',
  isMasterAdmin,
  hasPermission('createAdmins'),
  logAction('CREATE_ADMIN', 'SuperAdmin'),
  superAdminController.createSuperAdmin
);

/**
 * @swagger
 * /api/super-admin/admins/:id/permissions:
 *   patch:
 *     summary: Update admin permissions (Master Admin only)
 *     tags: [SuperAdmin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Operation successful
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Insufficient permissions */
router.patch(
  '/admins/:id/permissions',
  isMasterAdmin,
  hasPermission('createAdmins'),
  logAction('UPDATE_ADMIN_PERMISSIONS', 'SuperAdmin'),
  superAdminController.updateAdminPermissions
);

module.exports = router;
