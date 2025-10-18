const express = require('express');
const router = express.Router();
const sponsorshipController = require('../controllers/sponsorship.controller');
const { authenticate } = require('../middleware/auth.middleware');

/**
 * @swagger
 * /api/sponsorships:
 *   get:
 *     tags: [Sponsorships]
 *     summary: Get sponsorships
 *     description: Retrieve all sponsorships (filtered by user role)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, pending, completed, cancelled]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *     responses:
 *       200:
 *         description: Sponsorships retrieved successfully
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
 *                     properties:
 *                       _id:
 *                         type: string
 *                       sponsor:
 *                         type: string
 *                       patient:
 *                         type: string
 *                       amount:
 *                         type: number
 *                       status:
 *                         type: string
 *   post:
 *     tags: [Sponsorships]
 *     summary: Create sponsorship
 *     description: Create a new sponsorship allocation
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - patient
 *               - amount
 *             properties:
 *               patient:
 *                 type: string
 *                 description: Patient ID
 *               amount:
 *                 type: number
 *                 example: 500.00
 *               duration:
 *                 type: string
 *                 example: 6 months
 *     responses:
 *       201:
 *         description: Sponsorship created successfully
 */

/**
 * @swagger
 * /api/sponsorships/{id}:
 *   get:
 *     tags: [Sponsorships]
 *     summary: Get sponsorship details
 *     description: Retrieve detailed information about a specific sponsorship
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
 *         description: Sponsorship details retrieved
 *       404:
 *         description: Sponsorship not found
 */

// Routes
router.post('/', authenticate, sponsorshipController.create);
router.get('/', authenticate, sponsorshipController.getAll);
router.get('/:id', authenticate, sponsorshipController.getById);

module.exports = router;