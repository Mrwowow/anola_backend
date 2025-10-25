const express = require('express');
const router = express.Router();
const hmoPlanController = require('../controllers/hmoPlan.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { isSuperAdmin, hasPermission, isMasterAdmin, logAction } = require('../middleware/superAdmin.middleware');

// All routes require authentication and super admin access
router.use(authenticate);
router.use(isSuperAdmin);

// ==================== HMO Plans Management ====================

/**
 * @swagger
 * /api/super-admin/hmo-plans:
 *   get:
 *     summary: Get all HMO plans with filters and pagination
 *     description: Returns paginated list of HMO plans with filtering and search capabilities
 *     tags: [SuperAdmin - HMO Plans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [all, active, inactive, suspended, discontinued]
 *           default: all
 *         description: Filter by plan status
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [all, basic, standard, premium, platinum]
 *           default: all
 *         description: Filter by plan category
 *       - in: query
 *         name: planType
 *         schema:
 *           type: string
 *           enum: [all, individual, family, corporate, group]
 *           default: all
 *         description: Filter by plan type
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name, plan code, provider name, or description
 *       - in: query
 *         name: isAvailableForNewEnrollment
 *         schema:
 *           type: boolean
 *         description: Filter by enrollment availability
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: createdAt
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: HMO plans retrieved successfully
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
 *                     plans:
 *                       type: array
 *                       items:
 *                         type: object
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *                         totalPlans:
 *                           type: integer
 *                         hasNext:
 *                           type: boolean
 *                         hasPrev:
 *                           type: boolean
 *                     summary:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         active:
 *                           type: integer
 *                         inactive:
 *                           type: integer
 *                         suspended:
 *                           type: integer
 *                         discontinued:
 *                           type: integer
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Insufficient permissions
 */
router.get('/hmo-plans', hasPermission('manageHMOPlans'), hmoPlanController.getAllHMOPlans);

/**
 * @swagger
 * /api/super-admin/hmo-plans/stats/overview:
 *   get:
 *     summary: Get HMO plans statistics and overview
 *     description: Returns overall statistics, enrollment data, and distribution analytics
 *     tags: [SuperAdmin - HMO Plans]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
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
 *                         totalPlans:
 *                           type: integer
 *                         activePlans:
 *                           type: integer
 *                         totalEnrollments:
 *                           type: integer
 *                         totalActiveMembers:
 *                           type: integer
 *                         totalClaimsPaid:
 *                           type: integer
 *                         totalClaimsAmount:
 *                           type: number
 *                     distribution:
 *                       type: object
 *                       properties:
 *                         byCategory:
 *                           type: array
 *                         byPlanType:
 *                           type: array
 *                     topPlans:
 *                       type: array
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Insufficient permissions
 */
router.get('/hmo-plans/stats/overview', hasPermission('viewAnalytics'), hmoPlanController.getHMOPlanStatistics);

/**
 * @swagger
 * /api/super-admin/hmo-plans/{id}:
 *   get:
 *     summary: Get HMO plan by ID
 *     description: Returns detailed information about a specific HMO plan
 *     tags: [SuperAdmin - HMO Plans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: HMO plan ID
 *     responses:
 *       200:
 *         description: HMO plan retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       404:
 *         description: HMO plan not found
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Insufficient permissions
 */
router.get('/hmo-plans/:id', hasPermission('manageHMOPlans'), hmoPlanController.getHMOPlanById);

/**
 * @swagger
 * /api/super-admin/hmo-plans:
 *   post:
 *     summary: Create new HMO plan
 *     description: Creates a new HMO plan with all coverage details and pricing
 *     tags: [SuperAdmin - HMO Plans]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - planCode
 *               - description
 *               - provider
 *               - planType
 *               - category
 *               - pricing
 *             properties:
 *               name:
 *                 type: string
 *                 description: HMO plan name
 *               planCode:
 *                 type: string
 *                 description: Unique plan code
 *               description:
 *                 type: string
 *                 description: Plan description
 *               provider:
 *                 type: object
 *                 required:
 *                   - name
 *                   - email
 *                   - phone
 *                 properties:
 *                   name:
 *                     type: string
 *                   email:
 *                     type: string
 *                   phone:
 *                     type: string
 *                   contactPerson:
 *                     type: string
 *                   address:
 *                     type: object
 *                   website:
 *                     type: string
 *               planType:
 *                 type: string
 *                 enum: [individual, family, corporate, group]
 *               category:
 *                 type: string
 *                 enum: [basic, standard, premium, platinum]
 *               coverage:
 *                 type: object
 *                 description: Detailed coverage information
 *               pricing:
 *                 type: object
 *                 required:
 *                   - monthlyPremium
 *                 properties:
 *                   monthlyPremium:
 *                     type: object
 *                     properties:
 *                       individual:
 *                         type: number
 *                       family:
 *                         type: number
 *                       corporate:
 *                         type: number
 *     responses:
 *       201:
 *         description: HMO plan created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                 message:
 *                   type: string
 *       400:
 *         description: Validation error or plan code already exists
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Insufficient permissions
 */
router.post(
  '/hmo-plans',
  hasPermission('manageHMOPlans'),
  logAction('CREATE_HMO_PLAN', 'HMOPlan'),
  hmoPlanController.createHMOPlan
);

/**
 * @swagger
 * /api/super-admin/hmo-plans/{id}:
 *   put:
 *     summary: Update HMO plan
 *     description: Updates an existing HMO plan with new information
 *     tags: [SuperAdmin - HMO Plans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: HMO plan ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Fields to update
 *     responses:
 *       200:
 *         description: HMO plan updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                 message:
 *                   type: string
 *       400:
 *         description: Validation error
 *       404:
 *         description: HMO plan not found
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Insufficient permissions
 */
router.put(
  '/hmo-plans/:id',
  hasPermission('manageHMOPlans'),
  logAction('UPDATE_HMO_PLAN', 'HMOPlan'),
  hmoPlanController.updateHMOPlan
);

/**
 * @swagger
 * /api/super-admin/hmo-plans/{id}/status:
 *   patch:
 *     summary: Update HMO plan status
 *     description: Changes the status of an HMO plan (active, inactive, suspended, discontinued)
 *     tags: [SuperAdmin - HMO Plans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: HMO plan ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [active, inactive, suspended, discontinued]
 *                 description: New status for the plan
 *               reason:
 *                 type: string
 *                 description: Optional reason for status change
 *     responses:
 *       200:
 *         description: Status updated successfully
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
 *                     planId:
 *                       type: string
 *                     newStatus:
 *                       type: string
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid status value
 *       404:
 *         description: HMO plan not found
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Insufficient permissions
 */
router.patch(
  '/hmo-plans/:id/status',
  hasPermission('manageHMOPlans'),
  logAction('UPDATE_HMO_PLAN_STATUS', 'HMOPlan'),
  hmoPlanController.updateHMOPlanStatus
);

/**
 * @swagger
 * /api/super-admin/hmo-plans/{id}:
 *   delete:
 *     summary: Delete or discontinue HMO plan
 *     description: Soft deletes (discontinues) or permanently deletes an HMO plan (Master Admin only for permanent deletion)
 *     tags: [SuperAdmin - HMO Plans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: HMO plan ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               permanent:
 *                 type: boolean
 *                 default: false
 *                 description: Whether to permanently delete (requires Master Admin)
 *     responses:
 *       200:
 *         description: HMO plan deleted or discontinued successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *       400:
 *         description: Cannot delete plan with active members
 *       404:
 *         description: HMO plan not found
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Insufficient permissions
 */
router.delete(
  '/hmo-plans/:id',
  hasPermission('manageHMOPlans'),
  logAction('DELETE_HMO_PLAN', 'HMOPlan'),
  hmoPlanController.deleteHMOPlan
);

// ==================== Network Management ====================

/**
 * @swagger
 * /api/super-admin/hmo-plans/{id}/network/providers:
 *   post:
 *     summary: Add provider to HMO plan network
 *     description: Adds a healthcare provider to the HMO plan's network
 *     tags: [SuperAdmin - HMO Plans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: HMO plan ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               providerId:
 *                 type: string
 *                 description: User ID of the provider
 *               name:
 *                 type: string
 *                 description: Provider name
 *               specialty:
 *                 type: string
 *                 description: Provider specialty
 *               location:
 *                 type: string
 *                 description: Provider location
 *     responses:
 *       200:
 *         description: Provider added to network successfully
 *       400:
 *         description: Provider already in network
 *       404:
 *         description: HMO plan or provider not found
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Insufficient permissions
 */
router.post(
  '/hmo-plans/:id/network/providers',
  hasPermission('manageHMOPlans'),
  logAction('ADD_PROVIDER_TO_HMO_NETWORK', 'HMOPlan'),
  hmoPlanController.addProviderToNetwork
);

/**
 * @swagger
 * /api/super-admin/hmo-plans/{id}/network/providers/{providerId}:
 *   delete:
 *     summary: Remove provider from HMO plan network
 *     description: Removes a healthcare provider from the HMO plan's network
 *     tags: [SuperAdmin - HMO Plans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: HMO plan ID
 *       - in: path
 *         name: providerId
 *         required: true
 *         schema:
 *           type: string
 *         description: Provider ID to remove
 *     responses:
 *       200:
 *         description: Provider removed from network successfully
 *       404:
 *         description: HMO plan or provider not found
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Insufficient permissions
 */
router.delete(
  '/hmo-plans/:id/network/providers/:providerId',
  hasPermission('manageHMOPlans'),
  logAction('REMOVE_PROVIDER_FROM_HMO_NETWORK', 'HMOPlan'),
  hmoPlanController.removeProviderFromNetwork
);

module.exports = router;
