const express = require('express');
const router = express.Router();
const multer = require('multer');
const onboardingController = require('../controllers/onboarding.controller');

// Configure multer for file upload
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

/**
 * @swagger
 * tags:
 *   name: Onboarding
 *   description: Patient onboarding endpoints
 */

/**
 * @swagger
 * /api/onboarding/init:
 *   post:
 *     summary: Initialize onboarding session
 *     description: Creates a temporary onboarding session for patient registration
 *     tags: [Onboarding]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               referralCode:
 *                 type: string
 *                 description: Optional referral code
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
 *                 expiresAt:
 *                   type: string
 *                   format: date-time
 *       500:
 *         description: Internal server error
 */
router.post('/init', onboardingController.initializeOnboarding);

/**
 * @swagger
 * /api/onboarding/step1:
 *   post:
 *     summary: Submit personal information (Step 1)
 *     description: Saves patient's basic demographic and contact information
 *     tags: [Onboarding]
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
 *         description: Personal information saved
 *       400:
 *         description: Validation error
 *       401:
 *         description: Invalid session token
 *       409:
 *         description: Email already registered
 */
router.post('/step1', onboardingController.submitStep1);

/**
 * @swagger
 * /api/onboarding/step2:
 *   post:
 *     summary: Submit medical information (Step 2)
 *     description: Saves patient's medical history, allergies, and emergency contacts
 *     tags: [Onboarding]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               medicalConditions:
 *                 type: array
 *                 items:
 *                   type: object
 *               allergies:
 *                 type: array
 *                 items:
 *                   type: object
 *               currentMedications:
 *                 type: array
 *                 items:
 *                   type: object
 *               emergencyContact:
 *                 type: object
 *               bloodType:
 *                 type: string
 *               height:
 *                 type: object
 *               weight:
 *                 type: object
 *     responses:
 *       200:
 *         description: Medical information saved
 *       400:
 *         description: Validation error
 *       401:
 *         description: Invalid session token
 */
router.post('/step2', onboardingController.submitStep2);

/**
 * @swagger
 * /api/onboarding/step3:
 *   post:
 *     summary: Configure wallet and insurance (Step 3)
 *     description: Sets up patient wallet and optional insurance information
 *     tags: [Onboarding]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               activateWallet:
 *                 type: boolean
 *               initialDeposit:
 *                 type: object
 *               insurance:
 *                 type: object
 *     responses:
 *       200:
 *         description: Wallet configured successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Invalid session token
 */
router.post('/step3', onboardingController.submitStep3);

/**
 * @swagger
 * /api/onboarding/complete:
 *   post:
 *     summary: Complete onboarding (Step 4)
 *     description: Finalizes onboarding, creates user account and health card
 *     tags: [Onboarding]
 *     security:
 *       - bearerAuth: []
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
 *             properties:
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
 *               consentToDataSharing:
 *                 type: boolean
 *               preferredLanguage:
 *                 type: string
 *               notificationPreferences:
 *                 type: object
 *     responses:
 *       201:
 *         description: Onboarding completed successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Invalid session token
 */
router.post('/complete', onboardingController.completeOnboarding);

/**
 * @swagger
 * /api/onboarding/status:
 *   get:
 *     summary: Get onboarding session status
 *     description: Retrieves current onboarding progress and saved data
 *     tags: [Onboarding]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Session status retrieved
 *       401:
 *         description: Invalid session token
 */
router.get('/status', onboardingController.getOnboardingStatus);

/**
 * @swagger
 * /api/onboarding/profile-picture:
 *   post:
 *     summary: Upload profile picture
 *     description: Uploads patient profile picture during onboarding
 *     tags: [Onboarding]
 *     security:
 *       - bearerAuth: []
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
 *         description: Profile picture uploaded
 *       400:
 *         description: Invalid file
 *       401:
 *         description: Invalid session token
 */
router.post('/profile-picture', upload.single('file'), onboardingController.uploadProfilePicture);

module.exports = router;
