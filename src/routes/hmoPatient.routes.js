const express = require('express');
const router = express.Router();
const hmoClaimController = require('../controllers/hmoClaim.controller');
const { authenticate } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/patients/my-claims:
 *   get:
 *     summary: Get patient's HMO claims
 *     description: Returns all claims for the authenticated patient
 *     tags: [Patient - HMO]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [all, submitted, under_review, approved, rejected, paid]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: List of patient claims
 */
router.get('/my-claims', hmoClaimController.getMyPatientClaims);

module.exports = router;
