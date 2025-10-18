const express = require('express');
const router = express.Router();
const vendorController = require('../controllers/vendor.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { USER_TYPES } = require('../utils/constants');

/**
 * @swagger
 * /api/vendors/products:
 *   get:
 *     tags: [Vendors]
 *     summary: Get vendor products
 *     description: Retrieve all products/services offered by vendor
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: available
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Products retrieved successfully
 *   post:
 *     tags: [Vendors]
 *     summary: Add new product
 *     description: Add a new product or service to catalog
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
 *               - price
 *             properties:
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *               category:
 *                 type: string
 *               stock:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Product added successfully
 */

/**
 * @swagger
 * /api/vendors/orders:
 *   get:
 *     tags: [Vendors]
 *     summary: Get vendor orders
 *     description: Retrieve all orders for vendor's products
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, processing, completed, cancelled]
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 */

// Routes
router.get('/profile', authenticate, authorize(USER_TYPES.VENDOR), vendorController.getProfile);
router.put('/profile', authenticate, authorize(USER_TYPES.VENDOR), vendorController.updateProfile);

module.exports = router;