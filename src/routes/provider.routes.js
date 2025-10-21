const express = require('express');
const router = express.Router();
const multer = require('multer');
const providerController = require('../controllers/provider.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { USER_TYPES } = require('../utils/constants');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

/**
 * @swagger
 * /api/providers/{providerId}/profile:
 *   get:
 *     tags: [Providers]
 *     summary: Get provider profile
 *     description: Retrieve complete provider profile including services and schedule
 *     parameters:
 *       - in: path
 *         name: providerId
 *         required: true
 *         schema:
 *           type: string
 *         description: Provider ID
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
 *                 provider:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     providerCode:
 *                       type: string
 *                       example: PROV-5FB2DE7A
 *                     providerType:
 *                       type: string
 *                       example: doctor
 *                     professionalInfo:
 *                       type: object
 *                     practiceInfo:
 *                       type: object
 *                     services:
 *                       type: array
 *                     availability:
 *                       type: object
 *                     statistics:
 *                       type: object
 *       404:
 *         description: Provider not found
 *       400:
 *         description: User is not a provider
 *   put:
 *     tags: [Providers]
 *     summary: Update provider profile
 *     description: Update provider information and services
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: providerId
 *         required: true
 *         schema:
 *           type: string
 *         description: Provider ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               profile:
 *                 type: object
 *               professionalInfo:
 *                 type: object
 *               practiceInfo:
 *                 type: object
 *               availability:
 *                 type: object
 *               preferences:
 *                 type: object
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       403:
 *         description: Not authorized to update this profile
 *       404:
 *         description: Provider not found
 */

/**
 * @swagger
 * /api/providers/{providerId}/avatar:
 *   post:
 *     tags: [Providers]
 *     summary: Upload provider avatar
 *     description: Upload profile picture for provider
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: providerId
 *         required: true
 *         schema:
 *           type: string
 *         description: Provider ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Avatar uploaded successfully
 *       400:
 *         description: No file uploaded
 *       404:
 *         description: Provider not found
 */

/**
 * @swagger
 * /api/providers/{providerId}/appointments:
 *   get:
 *     tags: [Providers]
 *     summary: Get provider appointments
 *     description: Retrieve all appointments for the provider with filtering and pagination
 *     parameters:
 *       - in: path
 *         name: providerId
 *         required: true
 *         schema:
 *           type: string
 *         description: Provider ID
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
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
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
 *                 appointments:
 *                   type: array
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     totalAppointments:
 *                       type: integer
 *                     limit:
 *                       type: integer
 */

/**
 * @swagger
 * /api/providers/{providerId}/services:
 *   get:
 *     tags: [Providers]
 *     summary: Get provider services
 *     description: Retrieve all services offered by the provider
 *     parameters:
 *       - in: path
 *         name: providerId
 *         required: true
 *         schema:
 *           type: string
 *         description: Provider ID
 *     responses:
 *       200:
 *         description: Services retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 services:
 *                   type: array
 *                 totalServices:
 *                   type: integer
 *   post:
 *     tags: [Providers]
 *     summary: Add new service
 *     description: Add a new service to provider's offerings
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: providerId
 *         required: true
 *         schema:
 *           type: string
 *         description: Provider ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - duration
 *               - price
 *             properties:
 *               name:
 *                 type: string
 *                 example: General Consultation
 *               category:
 *                 type: string
 *                 example: Consultation
 *               description:
 *                 type: string
 *               duration:
 *                 type: integer
 *                 example: 30
 *               durationType:
 *                 type: string
 *                 enum: [minutes, hours, days, months, years]
 *                 default: minutes
 *                 example: minutes
 *               price:
 *                 type: number
 *                 example: 50.00
 *               insuranceCovered:
 *                 type: boolean
 *               availableModes:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [in-person, video, phone, chat]
 *               preparationInstructions:
 *                 type: string
 *     responses:
 *       201:
 *         description: Service added successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Provider not found
 */

/**
 * @swagger
 * /api/providers/{providerId}/services/{serviceId}:
 *   put:
 *     tags: [Providers]
 *     summary: Update service
 *     description: Update an existing service
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: providerId
 *         required: true
 *         schema:
 *           type: string
 *         description: Provider ID
 *       - in: path
 *         name: serviceId
 *         required: true
 *         schema:
 *           type: string
 *         description: Service ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               category:
 *                 type: string
 *               description:
 *                 type: string
 *               duration:
 *                 type: integer
 *               durationType:
 *                 type: string
 *                 enum: [minutes, hours, days, months, years]
 *               price:
 *                 type: number
 *               insuranceCovered:
 *                 type: boolean
 *               availableModes:
 *                 type: array
 *                 items:
 *                   type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Service updated successfully
 *       404:
 *         description: Provider or service not found
 *   delete:
 *     tags: [Providers]
 *     summary: Deactivate service
 *     description: Deactivate a service (soft delete)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: providerId
 *         required: true
 *         schema:
 *           type: string
 *         description: Provider ID
 *       - in: path
 *         name: serviceId
 *         required: true
 *         schema:
 *           type: string
 *         description: Service ID
 *     responses:
 *       200:
 *         description: Service deactivated successfully
 *       404:
 *         description: Provider or service not found
 */

/**
 * @swagger
 * /api/providers/{providerId}/patients:
 *   get:
 *     tags: [Providers]
 *     summary: Get provider patients
 *     description: Retrieve all patients who have had appointments with this provider
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: providerId
 *         required: true
 *         schema:
 *           type: string
 *         description: Provider ID
 *     responses:
 *       200:
 *         description: Patients retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 patients:
 *                   type: array
 *                 totalPatients:
 *                   type: integer
 */

/**
 * @swagger
 * /api/providers:
 *   get:
 *     tags: [Providers]
 *     summary: Get all providers
 *     description: Get list of all providers with filtering and pagination
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
 *         name: providerType
 *         schema:
 *           type: string
 *           enum: [doctor, nurse, therapist, specialist, other]
 *       - in: query
 *         name: specialization
 *         schema:
 *           type: string
 *       - in: query
 *         name: practiceType
 *         schema:
 *           type: string
 *           enum: [hospital, clinic, private, telehealth, pharmacy, other]
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *       - in: query
 *         name: acceptsInsurance
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: consultationMode
 *         schema:
 *           type: string
 *           enum: [in-person, video, phone, chat]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name, practice name, or specialization
 *     responses:
 *       200:
 *         description: Providers retrieved successfully
 */

/**
 * @swagger
 * /api/providers/services:
 *   get:
 *     tags: [Providers]
 *     summary: Search services across all providers
 *     description: Search and filter services from all providers
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
 *           default: 100
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by service name or description
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: durationType
 *         schema:
 *           type: string
 *           enum: [minutes, hours, days, months, years]
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Services retrieved successfully
 */

/**
 * @swagger
 * /api/providers/{providerId}/analytics:
 *   get:
 *     tags: [Providers]
 *     summary: Get provider analytics
 *     description: Retrieve comprehensive analytics for a provider including appointments, revenue, and patient statistics
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: providerId
 *         required: true
 *         schema:
 *           type: string
 *         description: Provider ID
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [day, week, month, year, all]
 *           default: month
 *         description: Time period for analytics
 *     responses:
 *       200:
 *         description: Analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 period:
 *                   type: string
 *                   example: month
 *                 startDate:
 *                   type: string
 *                   format: date-time
 *                 endDate:
 *                   type: string
 *                   format: date-time
 *                 analytics:
 *                   type: object
 *                   properties:
 *                     appointments:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: number
 *                         scheduled:
 *                           type: number
 *                         completed:
 *                           type: number
 *                         cancelled:
 *                           type: number
 *                         noShow:
 *                           type: number
 *                         byMode:
 *                           type: object
 *                         byType:
 *                           type: object
 *                     revenue:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: number
 *                         pending:
 *                           type: number
 *                         received:
 *                           type: number
 *                         averagePerAppointment:
 *                           type: number
 *                     patients:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: number
 *                         new:
 *                           type: number
 *                         returning:
 *                           type: number
 *                     topServices:
 *                       type: array
 *                       items:
 *                         type: object
 *                     dailyTrends:
 *                       type: array
 *                       items:
 *                         type: object
 *                     performance:
 *                       type: object
 *                 summary:
 *                   type: object
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Provider not found
 */

// Provider routes
// Public routes (no authentication required)
router.get('/', providerController.getAllProviders);
router.get('/services', providerController.searchServices);
router.get('/:providerId/profile', providerController.getProfile);
router.get('/:providerId/services', providerController.getServices);
router.get('/:providerId/appointments', providerController.getAppointments);

// Protected routes (authentication required)
router.get('/:providerId/analytics', authenticate, providerController.getAnalytics);
router.put('/:providerId/profile', authenticate, providerController.updateProfile);
router.post('/:providerId/avatar', authenticate, upload.single('file'), providerController.uploadAvatar);
router.post('/:providerId/services', authenticate, providerController.addService);
router.put('/:providerId/services/:serviceId', authenticate, providerController.updateService);
router.delete('/:providerId/services/:serviceId', authenticate, providerController.deleteService);
router.get('/:providerId/patients', authenticate, authorize(USER_TYPES.PROVIDER), providerController.getPatients);

module.exports = router;
