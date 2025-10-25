const express = require('express');
const router = express.Router();
const hmoClaimAdminController = require('../controllers/hmoClaimAdmin.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { isSuperAdmin } = require('../middleware/superAdmin.middleware');

// All routes require authentication and super admin access
router.use(authenticate);
router.use(isSuperAdmin);

/**
 * @swagger
 * /api/super-admin/hmo-claims:
 *   get:
 *     summary: Get all claims with filters
 *     tags: [SuperAdmin - HMO Claims]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: claimantType
 *         schema:
 *           type: string
 *       - in: query
 *         name: serviceType
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of claims with analytics
 */
router.get('/', hmoClaimAdminController.getAllClaims);

/**
 * @swagger
 * /api/super-admin/hmo-claims/pending:
 *   get:
 *     summary: Get pending claims for review
 *     tags: [SuperAdmin - HMO Claims]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of pending claims
 */
router.get('/pending', hmoClaimAdminController.getPendingClaims);

/**
 * @swagger
 * /api/super-admin/hmo-claims/analytics:
 *   get:
 *     summary: Get claims analytics and statistics
 *     tags: [SuperAdmin - HMO Claims]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: planId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Claims analytics data
 */
router.get('/analytics', hmoClaimAdminController.getClaimsAnalytics);

/**
 * @swagger
 * /api/super-admin/hmo-claims/{id}/assign:
 *   post:
 *     summary: Assign claim for review
 *     tags: [SuperAdmin - HMO Claims]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Claim assigned
 */
router.post('/:id/assign', hmoClaimAdminController.assignClaimForReview);

/**
 * @swagger
 * /api/super-admin/hmo-claims/{id}/approve:
 *   post:
 *     summary: Approve claim
 *     tags: [SuperAdmin - HMO Claims]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               approvedAmount:
 *                 type: number
 *               notes:
 *                 type: string
 *               autoPayment:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Claim approved
 */
router.post('/:id/approve', hmoClaimAdminController.approveClaim);

/**
 * @swagger
 * /api/super-admin/hmo-claims/{id}/reject:
 *   post:
 *     summary: Reject claim
 *     tags: [SuperAdmin - HMO Claims]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
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
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Claim rejected
 */
router.post('/:id/reject', hmoClaimAdminController.rejectClaim);

/**
 * @swagger
 * /api/super-admin/hmo-claims/{id}/partial-approve:
 *   post:
 *     summary: Partially approve claim
 *     tags: [SuperAdmin - HMO Claims]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - approvedAmount
 *               - rejectedAmount
 *             properties:
 *               approvedAmount:
 *                 type: number
 *               rejectedAmount:
 *                 type: number
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Claim partially approved
 */
router.post('/:id/partial-approve', hmoClaimAdminController.partiallyApproveClaim);

/**
 * @swagger
 * /api/super-admin/hmo-claims/{id}/process-payment:
 *   post:
 *     summary: Process payment for approved claim
 *     tags: [SuperAdmin - HMO Claims]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               paymentMethod:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment processed
 */
router.post('/:id/process-payment', hmoClaimAdminController.processPayment);

/**
 * @swagger
 * /api/super-admin/hmo-claims/{id}/review-appeal:
 *   post:
 *     summary: Review claim appeal
 *     tags: [SuperAdmin - HMO Claims]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - decision
 *             properties:
 *               decision:
 *                 type: string
 *                 enum: [approved, rejected]
 *               notes:
 *                 type: string
 *               approvedAmount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Appeal reviewed
 */
router.post('/:id/review-appeal', hmoClaimAdminController.reviewAppeal);

module.exports = router;
