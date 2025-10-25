const express = require('express');
const router = express.Router();
const hmoEnrollmentController = require('../controllers/hmoEnrollment.controller');
const hmoPlanController = require('../controllers/hmoPlan.controller');
const { authenticate } = require('../middleware/auth.middleware');

// ==================== Public HMO Plans Routes ====================

/**
 * @swagger
 * /api/hmo-plans:
 *   get:
 *     summary: Get all available HMO plans
 *     description: Returns list of active HMO plans available for enrollment
 *     tags: [HMO Plans - Public]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [basic, standard, premium, platinum]
 *         description: Filter by plan category
 *       - in: query
 *         name: planType
 *         schema:
 *           type: string
 *           enum: [individual, family, corporate, group]
 *         description: Filter by plan type
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Minimum monthly premium
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum monthly premium
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: pricing.monthlyPremium.individual
 *         description: Field to sort by
 *     responses:
 *       200:
 *         description: List of available HMO plans
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                 count:
 *                   type: integer
 */
router.get('/hmo-plans', hmoEnrollmentController.getAvailableHMOPlans);

/**
 * @swagger
 * /api/hmo-plans/{id}:
 *   get:
 *     summary: Get HMO plan details
 *     description: Returns detailed information about a specific HMO plan
 *     tags: [HMO Plans - Public]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: HMO plan ID
 *     responses:
 *       200:
 *         description: HMO plan details
 *       404:
 *         description: Plan not found or not available
 */
router.get('/hmo-plans/:id', hmoEnrollmentController.getHMOPlanDetails);

/**
 * @swagger
 * /api/hmo-plans/compare:
 *   post:
 *     summary: Compare multiple HMO plans
 *     description: Compare 2-4 HMO plans side by side
 *     tags: [HMO Plans - Public]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - planIds
 *             properties:
 *               planIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 minItems: 2
 *                 maxItems: 4
 *                 description: Array of plan IDs to compare
 *     responses:
 *       200:
 *         description: Plans comparison data
 *       400:
 *         description: Invalid request (wrong number of plans)
 *       404:
 *         description: One or more plans not found
 */
router.post('/hmo-plans/compare', hmoEnrollmentController.compareHMOPlans);

// ==================== HMO Enrollment Routes (Authenticated) ====================

/**
 * @swagger
 * /api/hmo-enrollments:
 *   post:
 *     summary: Enroll in an HMO plan
 *     description: Submit enrollment request for an HMO plan
 *     tags: [HMO Enrollment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - planId
 *               - enrollmentType
 *               - paymentMethod
 *             properties:
 *               planId:
 *                 type: string
 *                 description: ID of the HMO plan
 *               enrollmentType:
 *                 type: string
 *                 enum: [individual, family, corporate, group]
 *                 description: Type of enrollment
 *               dependents:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     firstName:
 *                       type: string
 *                     lastName:
 *                       type: string
 *                     dateOfBirth:
 *                       type: string
 *                       format: date
 *                     gender:
 *                       type: string
 *                     relationship:
 *                       type: string
 *                       enum: [spouse, child, parent, other]
 *                     nationalId:
 *                       type: string
 *                 description: Dependents for family plans
 *               paymentPlan:
 *                 type: string
 *                 enum: [monthly, quarterly, annual]
 *                 default: monthly
 *               paymentMethod:
 *                 type: string
 *                 enum: [card, bank_transfer, wallet, employer]
 *               coverageStartDate:
 *                 type: string
 *                 format: date
 *                 description: Desired coverage start date (defaults to today)
 *               primaryCareProviderId:
 *                 type: string
 *                 description: ID of primary care provider (optional)
 *               beneficiary:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   relationship:
 *                     type: string
 *                   phone:
 *                     type: string
 *                   email:
 *                     type: string
 *               employer:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   employeeId:
 *                     type: string
 *                   department:
 *                     type: string
 *     responses:
 *       201:
 *         description: Enrollment request submitted successfully
 *       400:
 *         description: Validation error or already enrolled
 *       404:
 *         description: Plan not found
 *       401:
 *         description: Unauthorized
 */
router.post('/hmo-enrollments', authenticate, hmoEnrollmentController.enrollInHMOPlan);

/**
 * @swagger
 * /api/hmo-enrollments/my-enrollments:
 *   get:
 *     summary: Get user's HMO enrollments
 *     description: Returns all enrollments for the authenticated user
 *     tags: [HMO Enrollment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, active, suspended, cancelled, expired, grace_period]
 *         description: Filter by enrollment status
 *     responses:
 *       200:
 *         description: List of user enrollments
 *       401:
 *         description: Unauthorized
 */
router.get('/hmo-enrollments/my-enrollments', authenticate, hmoEnrollmentController.getMyEnrollments);

/**
 * @swagger
 * /api/hmo-enrollments/{id}:
 *   get:
 *     summary: Get enrollment details
 *     description: Returns detailed information about a specific enrollment
 *     tags: [HMO Enrollment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Enrollment ID
 *     responses:
 *       200:
 *         description: Enrollment details
 *       404:
 *         description: Enrollment not found
 *       401:
 *         description: Unauthorized
 */
router.get('/hmo-enrollments/:id', authenticate, hmoEnrollmentController.getEnrollmentDetails);

/**
 * @swagger
 * /api/hmo-enrollments/{id}:
 *   put:
 *     summary: Update enrollment
 *     description: Update enrollment details (dependents, PCP, beneficiary, etc.)
 *     tags: [HMO Enrollment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Enrollment ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               dependents:
 *                 type: array
 *               primaryCareProviderId:
 *                 type: string
 *               beneficiary:
 *                 type: object
 *               paymentMethod:
 *                 type: string
 *     responses:
 *       200:
 *         description: Enrollment updated successfully
 *       404:
 *         description: Enrollment not found
 *       401:
 *         description: Unauthorized
 */
router.put('/hmo-enrollments/:id', authenticate, hmoEnrollmentController.updateEnrollment);

/**
 * @swagger
 * /api/hmo-enrollments/{id}/cancel:
 *   post:
 *     summary: Cancel enrollment
 *     description: Request cancellation of an active enrollment
 *     tags: [HMO Enrollment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Enrollment ID
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
 *                 description: Reason for cancellation
 *               effectiveDate:
 *                 type: string
 *                 format: date
 *                 description: Effective cancellation date (defaults to today)
 *     responses:
 *       200:
 *         description: Enrollment cancelled successfully
 *       400:
 *         description: Enrollment cannot be cancelled
 *       404:
 *         description: Enrollment not found
 *       401:
 *         description: Unauthorized
 */
router.post('/hmo-enrollments/:id/cancel', authenticate, hmoEnrollmentController.cancelEnrollment);

/**
 * @swagger
 * /api/hmo-enrollments/{id}/renew:
 *   post:
 *     summary: Renew enrollment
 *     description: Submit renewal request for an expiring enrollment
 *     tags: [HMO Enrollment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Enrollment ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               paymentMethod:
 *                 type: string
 *                 enum: [card, bank_transfer, wallet, employer]
 *     responses:
 *       201:
 *         description: Renewal request submitted successfully
 *       400:
 *         description: Enrollment cannot be renewed yet
 *       404:
 *         description: Enrollment not found
 *       401:
 *         description: Unauthorized
 */
router.post('/hmo-enrollments/:id/renew', authenticate, hmoEnrollmentController.renewEnrollment);

/**
 * @swagger
 * /api/hmo-enrollments/{id}/claims:
 *   get:
 *     summary: Get enrollment claims
 *     description: Returns claims and utilization data for an enrollment
 *     tags: [HMO Enrollment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Enrollment ID
 *     responses:
 *       200:
 *         description: Claims and utilization data
 *       404:
 *         description: Enrollment not found
 *       401:
 *         description: Unauthorized
 */
router.get('/hmo-enrollments/:id/claims', authenticate, hmoEnrollmentController.getEnrollmentClaims);

/**
 * @swagger
 * /api/hmo-enrollments/{id}/card:
 *   get:
 *     summary: Download enrollment card
 *     description: Download membership card/certificate for active enrollment
 *     tags: [HMO Enrollment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Enrollment ID
 *     responses:
 *       200:
 *         description: Membership card data
 *       400:
 *         description: Card not yet generated
 *       404:
 *         description: Active enrollment not found
 *       401:
 *         description: Unauthorized
 */
router.get('/hmo-enrollments/:id/card', authenticate, hmoEnrollmentController.downloadEnrollmentCard);

module.exports = router;
