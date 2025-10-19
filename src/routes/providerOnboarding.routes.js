const express = require('express');
const router = express.Router();
const multer = require('multer');
const providerOnboardingController = require('../controllers/providerOnboarding.controller');

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
 * /api/providers/onboarding/init:
 *   post:
 *     summary: Initialize provider onboarding session
 *     tags: [Provider Onboarding]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               referralCode:
 *                 type: string
 *                 example: "PROV-123456"
 *     responses:
 *       201:
 *         description: Session initialized successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 sessionToken:
 *                   type: string
 *                 sessionId:
 *                   type: string
 *                 expiresAt:
 *                   type: string
 *                   format: date-time
 */
router.post('/init', providerOnboardingController.initializeOnboarding);

/**
 * @swagger
 * /api/providers/onboarding/step1:
 *   post:
 *     summary: Submit basic information (Step 1)
 *     tags: [Provider Onboarding]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - providerType
 *               - firstName
 *               - lastName
 *               - email
 *               - phone
 *               - dateOfBirth
 *               - gender
 *             properties:
 *               providerType:
 *                 type: string
 *                 enum: [doctor, nurse, therapist, specialist, other]
 *               firstName:
 *                 type: string
 *               lastName:
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
 *                 enum: [male, female, other, prefer_not_to_say]
 *               address:
 *                 type: object
 *                 properties:
 *                   street:
 *                     type: string
 *                   city:
 *                     type: string
 *                   state:
 *                     type: string
 *                   zipCode:
 *                     type: string
 *                   country:
 *                     type: string
 *     responses:
 *       200:
 *         description: Basic information saved
 */
router.post('/step1', providerOnboardingController.submitStep1);

/**
 * @swagger
 * /api/providers/onboarding/step2:
 *   post:
 *     summary: Submit professional information (Step 2)
 *     tags: [Provider Onboarding]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - specialization
 *               - licenseNumber
 *               - yearsOfExperience
 *             properties:
 *               specialization:
 *                 type: string
 *               subSpecialties:
 *                 type: array
 *                 items:
 *                   type: string
 *               licenseNumber:
 *                 type: string
 *               licenseState:
 *                 type: string
 *               licenseExpiry:
 *                 type: string
 *                 format: date
 *               yearsOfExperience:
 *                 type: number
 *               npiNumber:
 *                 type: string
 *               deaNumber:
 *                 type: string
 *               education:
 *                 type: array
 *                 items:
 *                   type: object
 *               certifications:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Professional information saved
 */
router.post('/step2', providerOnboardingController.submitStep2);

/**
 * @swagger
 * /api/providers/onboarding/step3:
 *   post:
 *     summary: Submit practice information (Step 3)
 *     tags: [Provider Onboarding]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - practiceType
 *               - practiceName
 *               - consultationModes
 *             properties:
 *               practiceType:
 *                 type: string
 *                 enum: [hospital, clinic, private, telehealth, other]
 *               practiceName:
 *                 type: string
 *               practiceAddress:
 *                 type: object
 *               practicePhone:
 *                 type: string
 *               practiceEmail:
 *                 type: string
 *               acceptsInsurance:
 *                 type: boolean
 *               insuranceProviders:
 *                 type: array
 *                 items:
 *                   type: string
 *               languages:
 *                 type: array
 *                 items:
 *                   type: string
 *               consultationModes:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [in-person, video, phone, chat]
 *               servicesOffered:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Practice information saved
 */
router.post('/step3', providerOnboardingController.submitStep3);

/**
 * @swagger
 * /api/providers/onboarding/complete:
 *   post:
 *     summary: Complete provider registration (Step 4)
 *     tags: [Provider Onboarding]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *               - confirmPassword
 *               - termsAccepted
 *               - privacyPolicyAccepted
 *               - hipaaComplianceAccepted
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *                 format: password
 *               confirmPassword:
 *                 type: string
 *                 format: password
 *               termsAccepted:
 *                 type: boolean
 *               privacyPolicyAccepted:
 *                 type: boolean
 *               hipaaComplianceAccepted:
 *                 type: boolean
 *               profilePhoto:
 *                 type: string
 *     responses:
 *       201:
 *         description: Provider registration completed
 */
router.post('/complete', providerOnboardingController.completeOnboarding);

/**
 * @swagger
 * /api/providers/onboarding/status:
 *   get:
 *     summary: Get onboarding session status
 *     tags: [Provider Onboarding]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Session status retrieved
 */
router.get('/status', providerOnboardingController.getOnboardingStatus);

/**
 * @swagger
 * /api/providers/onboarding/profile-photo:
 *   post:
 *     summary: Upload profile photo
 *     tags: [Provider Onboarding]
 *     security:
 *       - BearerAuth: []
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
 *         description: Photo uploaded successfully
 */
router.post('/profile-photo', upload.single('file'), providerOnboardingController.uploadProfilePhoto);

module.exports = router;
