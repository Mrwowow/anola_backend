const express = require('express');
const router = express.Router();
const hmoClaimController = require('../controllers/hmoClaim.controller');
const { authenticate } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(authenticate);

// ==================== Claims Submission (Provider/Vendor) ====================

/**
 * @swagger
 * /api/hmo-claims:
 *   post:
 *     summary: Submit a new HMO claim
 *     description: Providers and vendors can submit claims for HMO-covered services
 *     tags: [HMO Claims]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - enrollmentId
 *               - patientId
 *               - serviceType
 *               - serviceDate
 *               - diagnosis
 *               - billing
 *             properties:
 *               enrollmentId:
 *                 type: string
 *               patientId:
 *                 type: string
 *               serviceType:
 *                 type: string
 *                 enum: [outpatient, inpatient, emergency, surgery, maternity, prescription, diagnostic, dental, vision, mental_health, preventive, specialist_consultation, other]
 *               serviceDate:
 *                 type: string
 *                 format: date
 *               dischargeDate:
 *                 type: string
 *                 format: date
 *               diagnosis:
 *                 type: object
 *                 properties:
 *                   code:
 *                     type: string
 *                   description:
 *                     type: string
 *                   primary:
 *                     type: boolean
 *               procedure:
 *                 type: object
 *               treatmentDetails:
 *                 type: object
 *               billing:
 *                 type: object
 *                 required:
 *                   - totalBilled
 *                 properties:
 *                   totalBilled:
 *                     type: number
 *                   breakdown:
 *                     type: array
 *               documents:
 *                 type: array
 *     responses:
 *       201:
 *         description: Claim submitted successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Enrollment not found
 */
router.post('/', hmoClaimController.submitClaim);

/**
 * @swagger
 * /api/hmo-claims/my-claims:
 *   get:
 *     summary: Get claims submitted by current user (Provider/Vendor)
 *     tags: [HMO Claims]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
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
 *         description: List of claims
 */
router.get('/my-claims', hmoClaimController.getMyClaims);

/**
 * @swagger
 * /api/hmo-claims/{id}:
 *   get:
 *     summary: Get claim details
 *     tags: [HMO Claims]
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
 *         description: Claim details
 *       404:
 *         description: Claim not found
 */
router.get('/:id', hmoClaimController.getClaimById);

/**
 * @swagger
 * /api/hmo-claims/{id}:
 *   put:
 *     summary: Update claim (add documents, update billing)
 *     tags: [HMO Claims]
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
 *     responses:
 *       200:
 *         description: Claim updated
 */
router.put('/:id', hmoClaimController.updateClaim);

/**
 * @swagger
 * /api/hmo-claims/{id}/appeal:
 *   post:
 *     summary: Submit claim appeal
 *     tags: [HMO Claims]
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
 *               documents:
 *                 type: array
 *     responses:
 *       200:
 *         description: Appeal submitted
 */
router.post('/:id/appeal', hmoClaimController.submitAppeal);

module.exports = router;
