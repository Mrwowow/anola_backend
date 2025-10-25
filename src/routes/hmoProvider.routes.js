const express = require('express');
const router = express.Router();
const hmoClaimController = require('../controllers/hmoClaim.controller');
const { authenticate } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(authenticate);

// Middleware to ensure user is a provider
const isProvider = (req, res, next) => {
  if (req.user.userType !== 'provider') {
    return res.status(403).json({
      success: false,
      message: 'Access restricted to providers only'
    });
  }
  next();
};

router.use(isProvider);

/**
 * @swagger
 * /api/providers/hmo-patients:
 *   get:
 *     summary: Get patients enrolled in HMO plans under this provider
 *     description: Returns list of patients who have selected this provider as their PCP
 *     tags: [Provider - HMO]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of HMO patients
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                 count:
 *                   type: integer
 */
router.get('/hmo-patients', hmoClaimController.getHMOPatients);

/**
 * @swagger
 * /api/providers/patients/{patientId}/hmo-coverage:
 *   get:
 *     summary: Get patient's HMO coverage details
 *     description: View patient's active HMO plan coverage, limits, and utilization
 *     tags: [Provider - HMO]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *         description: Patient user ID
 *     responses:
 *       200:
 *         description: Patient HMO coverage details
 *       404:
 *         description: No active enrollment found
 */
router.get('/patients/:patientId/hmo-coverage', hmoClaimController.getPatientCoverage);

module.exports = router;
