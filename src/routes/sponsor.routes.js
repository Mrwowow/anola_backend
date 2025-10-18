const express = require('express');
const router = express.Router();
const sponsorController = require('../controllers/sponsor.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { USER_TYPES } = require('../utils/constants');

/**
 * @swagger
 * /api/sponsors/dashboard:
 *   get:
 *     tags: [Sponsors]
 *     summary: Get sponsor dashboard
 *     description: Retrieve sponsor dashboard with impact metrics and sponsored patients
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data retrieved
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
 *                     totalDonated:
 *                       type: number
 *                       example: 10000.00
 *                     patientsHelped:
 *                       type: integer
 *                       example: 50
 *                     activePrograms:
 *                       type: integer
 *                     impactMetrics:
 *                       type: object
 */

/**
 * @swagger
 * /api/sponsors/programs:
 *   get:
 *     tags: [Sponsors]
 *     summary: Get sponsorship programs
 *     description: List all available sponsorship programs
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Programs retrieved successfully
 *   post:
 *     tags: [Sponsors]
 *     summary: Create sponsorship program
 *     description: Create a new sponsorship program
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
 *               - amount
 *             properties:
 *               name:
 *                 type: string
 *                 example: Monthly Healthcare Support
 *               amount:
 *                 type: number
 *                 example: 500.00
 *               duration:
 *                 type: string
 *                 example: 12 months
 *     responses:
 *       201:
 *         description: Program created successfully
 */

/**
 * @swagger
 * /api/sponsors/beneficiaries:
 *   get:
 *     tags: [Sponsors]
 *     summary: Get sponsored beneficiaries
 *     description: Retrieve list of patients sponsored by this sponsor
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Beneficiaries retrieved successfully
 */

// Routes
router.get('/profile', authenticate, authorize(USER_TYPES.SPONSOR), sponsorController.getProfile);
router.put('/profile', authenticate, authorize(USER_TYPES.SPONSOR), sponsorController.updateProfile);
router.get('/sponsorships', authenticate, authorize(USER_TYPES.SPONSOR), sponsorController.getSponsorships);

module.exports = router;