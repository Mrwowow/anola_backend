const express = require('express');
const router = express.Router();
const providerController = require('../controllers/provider.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { USER_TYPES } = require('../utils/constants');

/**
 * @swagger
 * /api/providers/profile:
 *   get:
 *     tags: [Providers]
 *     summary: Get provider profile
 *     description: Retrieve complete provider profile including services and schedule
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Provider profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     specialty:
 *                       type: string
 *                       example: Cardiology
 *                     licenseNumber:
 *                       type: string
 *                     yearsOfExperience:
 *                       type: integer
 *                       example: 10
 *                     services:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                           price:
 *                             type: number
 *                           duration:
 *                             type: integer
 *                     rating:
 *                       type: number
 *                       example: 4.5
 *                     totalReviews:
 *                       type: integer
 *                       example: 150
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   put:
 *     tags: [Providers]
 *     summary: Update provider profile
 *     description: Update provider information and services
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               specialty:
 *                 type: string
 *               licenseNumber:
 *                 type: string
 *               bio:
 *                 type: string
 *               services:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     price:
 *                       type: number
 *                     duration:
 *                       type: integer
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/providers/schedule:
 *   get:
 *     tags: [Providers]
 *     summary: Get provider schedule
 *     description: Retrieve provider's availability schedule
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
 *     responses:
 *       200:
 *         description: Schedule retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       date:
 *                         type: string
 *                         format: date
 *                       slots:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             time:
 *                               type: string
 *                               example: "09:00"
 *                             available:
 *                               type: boolean
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   post:
 *     tags: [Providers]
 *     summary: Set availability
 *     description: Update provider's availability schedule
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - date
 *               - slots
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *               slots:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     startTime:
 *                       type: string
 *                       example: "09:00"
 *                     endTime:
 *                       type: string
 *                       example: "17:00"
 *     responses:
 *       200:
 *         description: Schedule updated successfully
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/providers/appointments:
 *   get:
 *     tags: [Providers]
 *     summary: Get provider appointments
 *     description: Retrieve all appointments for the provider
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [scheduled, confirmed, completed, cancelled]
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *     responses:
 *       200:
 *         description: Appointments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Appointment'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/providers/earnings:
 *   get:
 *     tags: [Providers]
 *     summary: Get earnings summary
 *     description: Retrieve provider's earnings and transaction history
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
 *     responses:
 *       200:
 *         description: Earnings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalEarnings:
 *                       type: number
 *                       example: 5000.00
 *                     pendingPayments:
 *                       type: number
 *                       example: 500.00
 *                     transactions:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Transaction'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

// Provider routes - require authentication and provider role
router.get('/profile', authenticate, authorize(USER_TYPES.PROVIDER), providerController.getProfile);
router.put('/profile', authenticate, authorize(USER_TYPES.PROVIDER), providerController.updateProfile);
router.get('/schedule', authenticate, authorize(USER_TYPES.PROVIDER), providerController.getSchedule);
router.get('/patients', authenticate, authorize(USER_TYPES.PROVIDER), providerController.getPatients);

module.exports = router;
