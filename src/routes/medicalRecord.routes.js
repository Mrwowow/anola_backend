const express = require('express');
const router = express.Router();
const medicalRecordController = require('../controllers/medicalRecord.controller');
const { authenticate } = require('../middleware/auth.middleware');

/**
 * @swagger
 * /api/medical-records:
 *   get:
 *     tags: [Medical Records]
 *     summary: Get medical records
 *     description: Retrieve medical records for a patient (providers can access their created records, patients can access their own)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: patientId
 *         schema:
 *           type: string
 *         description: Filter by patient ID (providers only)
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
 *         description: Medical records retrieved successfully
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
 *                     $ref: '#/components/schemas/MedicalRecord'
 *                 pagination:
 *                   type: object
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   post:
 *     tags: [Medical Records]
 *     summary: Create medical record
 *     description: Create a new medical record (providers only)
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
 *               - diagnosis
 *             properties:
 *               patient:
 *                 type: string
 *                 description: Patient ID
 *                 example: 507f1f77bcf86cd799439011
 *               appointment:
 *                 type: string
 *                 description: Related appointment ID
 *                 example: 507f1f77bcf86cd799439013
 *               diagnosis:
 *                 type: string
 *                 example: Hypertension
 *               symptoms:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Headache", "Dizziness"]
 *               prescriptions:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     medication:
 *                       type: string
 *                       example: Lisinopril
 *                     dosage:
 *                       type: string
 *                       example: 10mg
 *                     frequency:
 *                       type: string
 *                       example: Once daily
 *                     duration:
 *                       type: string
 *                       example: 30 days
 *               labResults:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     test:
 *                       type: string
 *                     result:
 *                       type: string
 *                     unit:
 *                       type: string
 *               notes:
 *                 type: string
 *                 example: Patient advised to monitor blood pressure daily
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: string
 *                   description: File URLs
 *     responses:
 *       201:
 *         description: Medical record created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/MedicalRecord'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Only providers can create records
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/medical-records/{id}:
 *   get:
 *     tags: [Medical Records]
 *     summary: Get medical record details
 *     description: Retrieve detailed information about a specific medical record
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Medical record ID
 *     responses:
 *       200:
 *         description: Medical record retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/MedicalRecord'
 *       404:
 *         description: Medical record not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   put:
 *     tags: [Medical Records]
 *     summary: Update medical record
 *     description: Update an existing medical record (provider who created it only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Medical record ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               diagnosis:
 *                 type: string
 *               symptoms:
 *                 type: array
 *                 items:
 *                   type: string
 *               prescriptions:
 *                 type: array
 *                 items:
 *                   type: object
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Medical record updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/MedicalRecord'
 *       404:
 *         description: Medical record not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

// Routes
router.post('/', authenticate, medicalRecordController.create);
router.get('/', authenticate, medicalRecordController.getAll);
router.get('/:id', authenticate, medicalRecordController.getById);
router.put('/:id', authenticate, medicalRecordController.update);

module.exports = router;
