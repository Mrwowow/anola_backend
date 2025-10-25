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

/**
 * @swagger
 * /api/super-admin/dashboard/user-distribution:
 *   get:
 *     summary: Get user distribution by type
 *     description: Returns count and percentage breakdown of all user types on the platform
 *     tags: [SuperAdmin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User distribution retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalUsers:
 *                       type: integer
 *                     distribution:
 *                       type: object
 *                       additionalProperties:
 *                         type: object
 *                         properties:
 *                           count:
 *                             type: integer
 *                           percentage:
 *                             type: string
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Insufficient permissions
 */
router.get('/dashboard/user-distribution', hasPermission('viewAnalytics'), superAdminController.getUserDistribution);

/**
 * @swagger
 * /api/super-admin/dashboard/activity:
 *   get:
 *     summary: Get recent platform activity
 *     description: Returns recent user registrations and transactions combined into activity feed
 *     tags: [SuperAdmin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *           maximum: 50
 *         description: Number of activities to return
 *     responses:
 *       200:
 *         description: Recent activity retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     activities:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           type:
 *                             type: string
 *                           description:
 *                             type: string
 *                           timestamp:
 *                             type: string
 *                             format: date-time
 *                     total:
 *                       type: integer
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Insufficient permissions
 */
router.get('/dashboard/activity', hasPermission('viewAnalytics'), superAdminController.getRecentActivity);

/**
 * @swagger
 * /api/super-admin/dashboard/system-health:
 *   get:
 *     summary: Get system health metrics
 *     description: Returns API status, database connectivity, error rates, and storage metrics
 *     tags: [SuperAdmin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: System health retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     api:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                         uptime:
 *                           type: number
 *                     database:
 *                       type: object
 *                       properties:
 *                         connected:
 *                           type: boolean
 *                         status:
 *                           type: string
 *                     errorRate:
 *                       type: object
 *                       properties:
 *                         last24h:
 *                           type: string
 *                         status:
 *                           type: string
 *                     storage:
 *                       type: object
 *                       properties:
 *                         used:
 *                           type: string
 *                         status:
 *                           type: string
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Insufficient permissions
 */
router.get('/dashboard/system-health', hasPermission('viewAnalytics'), superAdminController.getSystemHealth);

// ==================== Analytics ====================

/**
 * @swagger
 * /api/super-admin/analytics/revenue:
 *   get:
 *     summary: Get revenue analytics with charts data
 *     description: Returns revenue overview, monthly trends, and breakdown by source
 *     tags: [SuperAdmin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [7days, 30days, 3months, 6months, 1year]
 *           default: 6months
 *         description: Time period for analytics
 *     responses:
 *       200:
 *         description: Revenue analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     overview:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: number
 *                         growth:
 *                           type: number
 *                         currency:
 *                           type: string
 *                     monthlyData:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           month:
 *                             type: string
 *                           revenue:
 *                             type: number
 *                           transactions:
 *                             type: integer
 *                     breakdown:
 *                       type: object
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Insufficient permissions
 */
router.get('/analytics/revenue', hasPermission('viewAnalytics'), superAdminController.getRevenueAnalytics);

/**
 * @swagger
 * /api/super-admin/analytics/users:
 *   get:
 *     summary: Get user growth analytics
 *     description: Returns user growth trends and distribution by type
 *     tags: [SuperAdmin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [weekly, monthly]
 *           default: monthly
 *         description: Grouping period for data
 *     responses:
 *       200:
 *         description: User growth analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     growth:
 *                       type: number
 *                     periodData:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           period:
 *                             type: string
 *                           patients:
 *                             type: integer
 *                           providers:
 *                             type: integer
 *                           vendors:
 *                             type: integer
 *                           sponsors:
 *                             type: integer
 *                     distribution:
 *                       type: object
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Insufficient permissions
 */
router.get('/analytics/users', hasPermission('viewAnalytics'), superAdminController.getUserGrowthAnalytics);

/**
 * @swagger
 * /api/super-admin/analytics/top-performers:
 *   get:
 *     summary: Get top performing providers and vendors
 *     description: Returns top performers by revenue and activity
 *     tags: [SuperAdmin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [all, provider, vendor]
 *           default: all
 *         description: Type of performers to retrieve
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *           maximum: 50
 *         description: Number of performers to return
 *     responses:
 *       200:
 *         description: Top performers retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     providers:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           email:
 *                             type: string
 *                           revenue:
 *                             type: number
 *                           appointments:
 *                             type: integer
 *                           rating:
 *                             type: number
 *                     vendors:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           email:
 *                             type: string
 *                           revenue:
 *                             type: number
 *                           orders:
 *                             type: integer
 *                           rating:
 *                             type: number
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Insufficient permissions
 */
router.get('/analytics/top-performers', hasPermission('viewAnalytics'), superAdminController.getTopPerformers);

/**
 * @swagger
 * /api/super-admin/analytics/metrics:
 *   get:
 *     summary: Get platform metrics and KPIs
 *     description: Returns session duration, bounce rate, conversion rate, and satisfaction scores
 *     tags: [SuperAdmin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Platform metrics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     sessionDuration:
 *                       type: object
 *                       properties:
 *                         average:
 *                           type: string
 *                         change:
 *                           type: number
 *                         trend:
 *                           type: string
 *                     bounceRate:
 *                       type: object
 *                     conversionRate:
 *                       type: object
 *                     satisfaction:
 *                       type: object
 *                     activeUsers:
 *                       type: object
 *                     totalTransactions:
 *                       type: object
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Insufficient permissions
 */
router.get('/analytics/metrics', hasPermission('viewAnalytics'), superAdminController.getPlatformMetrics);

/**
 * @swagger
 * /api/super-admin/analytics/geographic:
 *   get:
 *     summary: Get geographic distribution of users
 *     description: Returns user and revenue distribution by region
 *     tags: [SuperAdmin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Geographic distribution retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     regions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                           users:
 *                             type: integer
 *                           revenue:
 *                             type: number
 *                           percentage:
 *                             type: number
 *                     states:
 *                       type: array
 *                       items:
 *                         type: object
 *                     totalUsers:
 *                       type: integer
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Insufficient permissions
 */
router.get('/analytics/geographic', hasPermission('viewAnalytics'), superAdminController.getGeographicDistribution);

// ==================== Approvals ====================

/**
 * @swagger
 * /api/super-admin/approvals:
 *   get:
 *     summary: Get list of approval requests
 *     description: Returns paginated list of approval requests with filters
 *     tags: [SuperAdmin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [all, provider, vendor, sponsor, product]
 *           default: all
 *         description: Type of approval to filter
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [all, high, medium, low]
 *           default: all
 *         description: Priority level to filter
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [all, pending, approved, rejected]
 *           default: pending
 *         description: Status to filter
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Approvals retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     approvals:
 *                       type: array
 *                       items:
 *                         type: object
 *                     pagination:
 *                       type: object
 *                     summary:
 *                       type: object
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Insufficient permissions
 */
router.get('/approvals', hasPermission('manageUsers'), superAdminController.getApprovals);

/**
 * @swagger
 * /api/super-admin/approvals/{id}:
 *   get:
 *     summary: Get approval details by ID
 *     description: Returns detailed information about a specific approval request
 *     tags: [SuperAdmin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Approval ID
 *     responses:
 *       200:
 *         description: Approval details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     type:
 *                       type: string
 *                     status:
 *                       type: string
 *                     priority:
 *                       type: string
 *                     applicant:
 *                       type: object
 *                     details:
 *                       type: object
 *                     documents:
 *                       type: array
 *                     history:
 *                       type: array
 *       404:
 *         description: Approval not found
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Insufficient permissions
 */
router.get('/approvals/:id', hasPermission('manageUsers'), superAdminController.getApprovalDetails);

/**
 * @swagger
 * /api/super-admin/approvals/{id}/approve:
 *   post:
 *     summary: Approve an application
 *     description: Approves a pending approval request and activates the user account
 *     tags: [SuperAdmin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Approval ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notes:
 *                 type: string
 *                 description: Optional approval notes
 *               notifyApplicant:
 *                 type: boolean
 *                 default: true
 *                 description: Whether to send notification to applicant
 *     responses:
 *       200:
 *         description: Application approved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     approvalId:
 *                       type: string
 *                     userId:
 *                       type: string
 *                     approvedAt:
 *                       type: string
 *                       format: date-time
 *                 message:
 *                   type: string
 *       400:
 *         description: Application already processed
 *       404:
 *         description: Approval not found
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Insufficient permissions
 */
router.post(
  '/approvals/:id/approve',
  hasPermission('manageUsers'),
  logAction('APPROVE_APPLICATION', 'Approval'),
  superAdminController.approveApplication
);

/**
 * @swagger
 * /api/super-admin/approvals/{id}/reject:
 *   post:
 *     summary: Reject an application
 *     description: Rejects a pending approval request with a reason
 *     tags: [SuperAdmin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Approval ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Reason for rejection
 *               notifyApplicant:
 *                 type: boolean
 *                 default: true
 *                 description: Whether to send notification to applicant
 *     responses:
 *       200:
 *         description: Application rejected successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     approvalId:
 *                       type: string
 *                     userId:
 *                       type: string
 *                     rejectedAt:
 *                       type: string
 *                       format: date-time
 *                 message:
 *                   type: string
 *       400:
 *         description: Application already processed or missing reason
 *       404:
 *         description: Approval not found
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Insufficient permissions
 */
router.post(
  '/approvals/:id/reject',
  hasPermission('manageUsers'),
  logAction('REJECT_APPLICATION', 'Approval'),
  superAdminController.rejectApplication
);

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

// ==================== HMO Plans Management ====================

// Import and mount HMO Plans routes
const hmoPlanRoutes = require('./hmoPlan.routes');
router.use('/', hmoPlanRoutes);

// ==================== HMO Claims Management ====================

// Import and mount HMO Claims admin routes
const hmoClaimAdminRoutes = require('./hmoClaimAdmin.routes');
router.use('/hmo-claims', hmoClaimAdminRoutes);

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
