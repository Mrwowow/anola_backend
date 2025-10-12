const { body, param, query, validationResult } = require('express-validator');
const { HTTP_STATUS } = require('../utils/constants');

/**
 * Check validation results and return errors if any
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.path,
      message: error.msg,
      value: error.value
    }));
    
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      error: 'Validation failed',
      details: errorMessages
    });
  }
  
  next();
};

// User validation rules
const validateUserRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  body('phone')
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  body('profile.firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('profile.lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('profile.dateOfBirth')
    .isISO8601()
    .withMessage('Please provide a valid date of birth'),
  body('profile.nationalId')
    .notEmpty()
    .withMessage('National ID is required'),
  body('profile.address.country')
    .notEmpty()
    .withMessage('Country is required'),
  body('userType')
    .isIn(['patient', 'provider', 'sponsor', 'vendor'])
    .withMessage('Invalid user type'),
  handleValidationErrors
];

const validateUserLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

const validatePasswordReset = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  handleValidationErrors
];

const validatePasswordUpdate = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  handleValidationErrors
];

// Appointment validation rules
const validateAppointmentCreation = [
  body('provider')
    .isMongoId()
    .withMessage('Invalid provider ID'),
  body('type')
    .isIn(['consultation', 'follow-up', 'emergency', 'routine-checkup', 'vaccination', 'lab-test', 'surgery', 'therapy'])
    .withMessage('Invalid appointment type'),
  body('reason')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Reason must be between 10 and 500 characters'),
  body('scheduledDate')
    .isISO8601()
    .withMessage('Please provide a valid scheduled date'),
  body('scheduledTime.startTime')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Please provide a valid start time (HH:MM format)'),
  body('mode')
    .optional()
    .isIn(['in-person', 'video', 'audio', 'chat'])
    .withMessage('Invalid consultation mode'),
  handleValidationErrors
];

const validateAppointmentUpdate = [
  body('status')
    .optional()
    .isIn(['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show', 'rescheduled'])
    .withMessage('Invalid appointment status'),
  body('scheduledDate')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid scheduled date'),
  body('scheduledTime.startTime')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Please provide a valid start time (HH:MM format)'),
  handleValidationErrors
];

// Medical record validation rules
const validateMedicalRecord = [
  body('patient')
    .isMongoId()
    .withMessage('Invalid patient ID'),
  body('type')
    .isIn(['consultation', 'lab_result', 'imaging', 'prescription', 'vaccination', 'surgery', 'discharge_summary', 'referral'])
    .withMessage('Invalid medical record type'),
  body('clinical.chiefComplaint')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Chief complaint cannot exceed 1000 characters'),
  handleValidationErrors
];

// Sponsorship validation rules
const validateSponsorship = [
  body('beneficiary')
    .isMongoId()
    .withMessage('Invalid beneficiary ID'),
  body('type')
    .isIn(['full', 'partial', 'emergency', 'chronic_care', 'preventive', 'medication'])
    .withMessage('Invalid sponsorship type'),
  body('amount.allocated')
    .isNumeric()
    .isFloat({ min: 1 })
    .withMessage('Allocated amount must be a positive number'),
  body('duration.startDate')
    .isISO8601()
    .withMessage('Please provide a valid start date'),
  body('duration.endDate')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid end date'),
  handleValidationErrors
];

// Transaction validation rules
const validateTransaction = [
  body('type')
    .isIn(['payment', 'refund', 'deposit', 'withdrawal', 'transfer', 'sponsorship'])
    .withMessage('Invalid transaction type'),
  body('amount.value')
    .isNumeric()
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be a positive number'),
  body('from.wallet')
    .optional()
    .isMongoId()
    .withMessage('Invalid source wallet ID'),
  body('to.wallet')
    .optional()
    .isMongoId()
    .withMessage('Invalid destination wallet ID'),
  handleValidationErrors
];

// Query parameter validation
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('sort')
    .optional()
    .isIn(['createdAt', '-createdAt', 'updatedAt', '-updatedAt', 'name', '-name'])
    .withMessage('Invalid sort parameter'),
  handleValidationErrors
];

const validateDateRange = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid start date'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid end date'),
  handleValidationErrors
];

// Parameter validation
const validateObjectId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid ID format'),
  handleValidationErrors
];

const validateHealthCardId = [
  param('healthCardId')
    .matches(/^AH-[A-Z0-9]{6,}-[A-Z0-9]{6}$/)
    .withMessage('Invalid health card ID format'),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateUserRegistration,
  validateUserLogin,
  validatePasswordReset,
  validatePasswordUpdate,
  validateAppointmentCreation,
  validateAppointmentUpdate,
  validateMedicalRecord,
  validateSponsorship,
  validateTransaction,
  validatePagination,
  validateDateRange,
  validateObjectId,
  validateHealthCardId
};