const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patient.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { USER_TYPES } = require('../utils/constants');

/**
 * @swagger
 * /api/patients/dashboard:
 *   get:
 *     tags: [Patients]
 *     summary: Get patient dashboard
 *     description: Retrieve patient dashboard with upcoming appointments, recent transactions, and health summary
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data retrieved successfully
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
 *                     upcomingAppointments:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Appointment'
 *                     recentTransactions:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Transaction'
 *                     walletBalance:
 *                       type: object
 *                       properties:
 *                         personal:
 *                           type: number
 *                           example: 500.00
 *                         sponsored:
 *                           type: number
 *                           example: 250.00
 *                     healthCardId:
 *                       type: string
 *                       example: HC-123456789
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/patients/health-card:
 *   get:
 *     tags: [Patients]
 *     summary: Get patient health card
 *     description: Retrieve patient's smart health card with QR code
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Health card retrieved successfully
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
 *                     cardId:
 *                       type: string
 *                       example: HC-123456789
 *                     qrCode:
 *                       type: string
 *                       description: Base64 encoded QR code image
 *                     patientInfo:
 *                       type: object
 *                       properties:
 *                         name:
 *                           type: string
 *                         dateOfBirth:
 *                           type: string
 *                           format: date
 *                         bloodType:
 *                           type: string
 *                           example: O+
 *                         allergies:
 *                           type: array
 *                           items:
 *                             type: string
 *                     emergencyContact:
 *                       type: object
 *                       properties:
 *                         name:
 *                           type: string
 *                         phone:
 *                           type: string
 *                         relationship:
 *                           type: string
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/patients/medical-history:
 *   get:
 *     tags: [Patients]
 *     summary: Get medical history
 *     description: Retrieve patient's complete medical history
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
 *         description: Medical history retrieved successfully
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
 */

/**
 * @swagger
 * /api/patients/providers:
 *   get:
 *     tags: [Patients]
 *     summary: Find healthcare providers
 *     description: Search for healthcare providers by specialty, location, or availability
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: specialty
 *         schema:
 *           type: string
 *         description: Provider specialty
 *         example: Cardiology
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: City or area
 *       - in: query
 *         name: available
 *         schema:
 *           type: boolean
 *         description: Only show available providers
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Providers found
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
 *                       _id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       specialty:
 *                         type: string
 *                       location:
 *                         type: string
 *                       rating:
 *                         type: number
 *                       availableSlots:
 *                         type: integer
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/patients/add:
 *   post:
 *     tags: [Patients]
 *     summary: Add a new patient
 *     description: Allows providers, vendors, and sponsors to register new patients
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *               - phone
 *               - dateOfBirth
 *               - gender
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               middleName:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *               gender:
 *                 type: string
 *                 enum: [male, female, other, prefer-not-to-say]
 *               address:
 *                 type: object
 *               bloodType:
 *                 type: string
 *               allergies:
 *                 type: array
 *                 items:
 *                   type: object
 *               chronicConditions:
 *                 type: array
 *                 items:
 *                   type: object
 *               emergencyContact:
 *                 type: object
 *               createWallet:
 *                 type: boolean
 *                 default: false
 *               initialDeposit:
 *                 type: number
 *                 default: 0
 *     responses:
 *       201:
 *         description: Patient added successfully
 *       400:
 *         description: Bad request
 *       409:
 *         description: Email or phone already exists
 */

/**
 * @swagger
 * /api/patients/my-patients:
 *   get:
 *     tags: [Patients]
 *     summary: Get my patients
 *     description: Get all patients added by the authenticated provider/vendor/sponsor
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Patients retrieved successfully
 */

/**
 * @swagger
 * /api/patients/{patientId}:
 *   get:
 *     tags: [Patients]
 *     summary: Get patient details
 *     description: Get detailed information about a specific patient
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Patient details retrieved
 *       404:
 *         description: Patient not found
 */

// Patient routes - all require authentication
router.get('/dashboard', authenticate, authorize(USER_TYPES.PATIENT), patientController.getDashboard);
router.get('/health-card', authenticate, authorize(USER_TYPES.PATIENT), patientController.getHealthCard);
router.get('/medical-history', authenticate, authorize(USER_TYPES.PATIENT), patientController.getMedicalHistory);
router.get('/providers', authenticate, patientController.findProviders);

// Add patient endpoints (for providers, vendors, sponsors)
router.post('/add', authenticate, patientController.addPatient);
router.get('/my-patients', authenticate, patientController.getMyPatients);
router.get('/:patientId', authenticate, patientController.getPatientById);

module.exports = router;