// User Types
exports.USER_TYPES = {
  PATIENT: 'patient',
  PROVIDER: 'provider',
  SPONSOR: 'sponsor',
  VENDOR: 'vendor',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin'
};

// Account Status
exports.ACCOUNT_STATUS = {
  PENDING: 'pending',
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
  DELETED: 'deleted'
};

// Appointment Status
exports.APPOINTMENT_STATUS = {
  SCHEDULED: 'scheduled',
  CONFIRMED: 'confirmed',
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no-show',
  RESCHEDULED: 'rescheduled'
};

// Transaction Types
exports.TRANSACTION_TYPES = {
  PAYMENT: 'payment',
  REFUND: 'refund',
  DEPOSIT: 'deposit',
  WITHDRAWAL: 'withdrawal',
  TRANSFER: 'transfer',
  SPONSORSHIP: 'sponsorship'
};

// Wallet Types
exports.WALLET_TYPES = {
  PERSONAL: 'personal',
  SPONSORED: 'sponsored',
  GLOBAL: 'global',
  PROVIDER: 'provider',
  VENDOR: 'vendor'
};

// Blood Types
exports.BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

// Gender Options
exports.GENDER_OPTIONS = ['male', 'female', 'other', 'prefer_not_to_say'];

// Notification Types
exports.NOTIFICATION_TYPES = {
  APPOINTMENT: 'appointment',
  PAYMENT: 'payment',
  MEDICAL_RECORD: 'medical_record',
  SPONSORSHIP: 'sponsorship',
  SYSTEM: 'system'
};

// Medical Record Types
exports.MEDICAL_RECORD_TYPES = {
  CONSULTATION: 'consultation',
  LAB_RESULT: 'lab_result',
  IMAGING: 'imaging',
  PRESCRIPTION: 'prescription',
  VACCINATION: 'vaccination',
  SURGERY: 'surgery',
  DISCHARGE_SUMMARY: 'discharge_summary',
  REFERRAL: 'referral'
};

// Provider Types
exports.PROVIDER_TYPES = {
  HOSPITAL: 'hospital',
  CLINIC: 'clinic',
  PRIVATE_PRACTICE: 'private_practice',
  TELEMEDICINE: 'telemedicine',
  HOME_CARE: 'home_care'
};

// Vendor Types
exports.VENDOR_TYPES = {
  PHARMACY: 'pharmacy',
  LABORATORY: 'laboratory',
  MEDICAL_EQUIPMENT: 'medical_equipment',
  MEDICAL_SUPPLIES: 'medical_supplies',
  AMBULANCE: 'ambulance',
  OTHER: 'other'
};

// Sponsorship Types
exports.SPONSORSHIP_TYPES = {
  FULL: 'full',
  PARTIAL: 'partial',
  EMERGENCY: 'emergency',
  CHRONIC_CARE: 'chronic_care',
  PREVENTIVE: 'preventive',
  MEDICATION: 'medication'
};

// HTTP Status Codes
exports.HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
};

// Error Messages
exports.ERROR_MESSAGES = {
  INVALID_CREDENTIALS: 'Invalid email or password',
  UNAUTHORIZED: 'Authentication required',
  FORBIDDEN: 'Insufficient permissions',
  NOT_FOUND: 'Resource not found',
  VALIDATION_ERROR: 'Validation failed',
  DUPLICATE_ENTRY: 'Duplicate entry found',
  INTERNAL_ERROR: 'Internal server error',
  RATE_LIMIT_EXCEEDED: 'Too many requests, please try again later'
};

// Success Messages
exports.SUCCESS_MESSAGES = {
  CREATED: 'Resource created successfully',
  UPDATED: 'Resource updated successfully',
  DELETED: 'Resource deleted successfully',
  LOGIN_SUCCESS: 'Login successful',
  LOGOUT_SUCCESS: 'Logout successful',
  PASSWORD_RESET: 'Password reset successful',
  EMAIL_SENT: 'Email sent successfully'
};