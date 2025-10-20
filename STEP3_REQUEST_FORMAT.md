# Complete Step 3 Request Format

## Endpoint
```
POST /api/providers/onboarding/step3
```

## Headers
```
Content-Type: application/json
Authorization: Bearer <sessionToken>
```

## Required Fields
- `practiceType` (string, enum)
- `practiceName` (string)
- `consultationModes` (array, at least one required)

## Complete Request Body

```json
{
  "practiceType": "pharmacy",
  "practiceName": "HealthPlus Pharmacy",
  "practiceAddress": {
    "street": "No. 10 Alhaji, Olowo House Denro CAC, Ojodu-Berger",
    "city": "Ojodu-Berger",
    "state": "Lagos",
    "zipCode": "234",
    "country": "Nigeria"
  },
  "practicePhone": "+2341234567890",
  "practiceEmail": "info@healthplus.com",
  "acceptsInsurance": true,
  "insuranceProviders": ["NHIS", "Hygeia HMO", "Private Insurance"],
  "languages": ["English", "Yoruba", "Igbo"],
  "consultationModes": ["in-person", "video", "phone"],
  "servicesOffered": [
    {
      "serviceName": "Prescription Dispensing",
      "duration": 15,
      "durationType": "minutes",
      "price": 5000,
      "description": "Fill and dispense prescriptions",
      "category": "Medication",
      "insuranceCovered": true,
      "availableModes": ["in-person"],
      "preparationInstructions": "Bring your prescription and ID"
    },
    {
      "serviceName": "Monthly Health Package",
      "duration": 1,
      "durationType": "months",
      "price": 50000,
      "description": "Monthly medication and health monitoring package",
      "category": "Subscription",
      "insuranceCovered": false,
      "availableModes": ["in-person", "phone"],
      "preparationInstructions": "Schedule initial consultation"
    },
    {
      "serviceName": "90-Day Medication Supply",
      "duration": 90,
      "durationType": "days",
      "price": 120000,
      "description": "Three-month supply of chronic medication",
      "category": "Medication",
      "insuranceCovered": true,
      "availableModes": ["in-person"],
      "preparationInstructions": "Requires valid prescription for 90 days"
    },
    {
      "serviceName": "Annual Wellness Program",
      "duration": 1,
      "durationType": "years",
      "price": 500000,
      "description": "Comprehensive annual wellness and medication management",
      "category": "Subscription",
      "insuranceCovered": false,
      "availableModes": ["in-person", "video", "phone"],
      "preparationInstructions": "Complete health assessment form"
    },
    {
      "serviceName": "Pharmacist Consultation",
      "duration": 30,
      "durationType": "minutes",
      "price": 3000,
      "description": "Professional medication counseling",
      "category": "Consultation",
      "insuranceCovered": true,
      "availableModes": ["in-person", "video", "phone"],
      "preparationInstructions": "Prepare list of current medications"
    }
  ]
}
```

## Field Details

### practiceType (Required)
**Type:** String (enum)
**Valid Values:**
- `"hospital"` - Hospital facility
- `"clinic"` - Medical clinic
- `"private"` - Private practice
- `"telehealth"` - Telemedicine only
- `"pharmacy"` - Pharmacy/drugstore
- `"other"` - Other healthcare facility

**Example:** `"pharmacy"`

---

### practiceName (Required)
**Type:** String
**Description:** Name of your practice/facility
**Example:** `"HealthPlus Pharmacy"`

---

### practiceAddress (Optional but recommended)
**Type:** Object
**Fields:**
- `street` (string): Street address
- `city` (string): City name
- `state` (string): State/province
- `zipCode` (string): Postal/ZIP code
- `country` (string): Country name

**Example:**
```json
{
  "street": "No. 10 Alhaji, Olowo House Denro CAC, Ojodu-Berger",
  "city": "Ojodu-Berger",
  "state": "Lagos",
  "zipCode": "234",
  "country": "Nigeria"
}
```

---

### practicePhone (Optional)
**Type:** String
**Format:** International format recommended (e.g., +234...)
**Example:** `"+2341234567890"`

---

### practiceEmail (Optional)
**Type:** String
**Format:** Valid email address
**Example:** `"info@healthplus.com"`

---

### acceptsInsurance (Optional)
**Type:** Boolean
**Default:** `true`
**Example:** `true`

---

### insuranceProviders (Optional)
**Type:** Array of strings
**Description:** List of accepted insurance providers
**Example:** `["NHIS", "Hygeia HMO", "Reliance HMO"]`

---

### languages (Optional)
**Type:** Array of strings
**Description:** Languages spoken at practice
**Default:** `["English"]`
**Example:** `["English", "Yoruba", "Igbo", "Hausa"]`

---

### consultationModes (Required)
**Type:** Array of strings (enum)
**Valid Values:**
- `"in-person"` - Face-to-face consultations
- `"video"` - Video call consultations
- `"phone"` - Phone consultations
- `"chat"` - Text/chat consultations

**Note:** At least one mode is required
**Example:** `["in-person", "video", "phone"]`

---

### servicesOffered (Optional)
**Type:** Array of objects
**Description:** List of services provided

#### Service Object Fields:

##### serviceName (Required)
**Type:** String
**Description:** Name of the service
**Example:** `"Prescription Dispensing"`

##### duration (Required)
**Type:** Integer
**Description:** Duration value (number)
**Example:** `30`

##### durationType (Optional)
**Type:** String (enum)
**Valid Values:**
- `"minutes"` (default) - For consultations, appointments
- `"hours"` - For longer sessions, procedures
- `"days"` - For medication supplies, treatment courses
- `"months"` - For subscriptions, long-term treatments
- `"years"` - For annual programs, long-term care

**Default:** `"minutes"`
**Example:** `"months"`

##### price (Required)
**Type:** Number
**Description:** Price in Nigerian Naira (₦)
**Example:** `50000`

##### description (Optional)
**Type:** String
**Description:** Detailed service description
**Example:** `"Monthly medication and health monitoring package"`

##### category (Optional)
**Type:** String
**Common Values:**
- `"Consultation"` - Medical consultations
- `"Diagnostic"` - Diagnostic services
- `"Procedure"` - Medical procedures
- `"Medication"` - Medication services
- `"Subscription"` - Subscription/membership plans
- `"Treatment"` - Treatment plans
- `"Therapy"` - Therapy sessions

**Default:** `"Consultation"`
**Example:** `"Subscription"`

##### insuranceCovered (Optional)
**Type:** Boolean
**Description:** Whether insurance covers this service
**Default:** `true`
**Example:** `false`

##### availableModes (Optional)
**Type:** Array of strings
**Valid Values:** Same as consultationModes
**Default:** `["in-person"]`
**Example:** `["in-person", "video"]`

##### preparationInstructions (Optional)
**Type:** String
**Description:** Instructions for patients before service
**Example:** `"Bring your prescription and ID"`

---

## Complete Examples

### Example 1: Pharmacy
```json
{
  "practiceType": "pharmacy",
  "practiceName": "MediCare Pharmacy",
  "practiceAddress": {
    "street": "123 Lagos Street",
    "city": "Lagos",
    "state": "Lagos",
    "zipCode": "100001",
    "country": "Nigeria"
  },
  "practicePhone": "+2348012345678",
  "practiceEmail": "info@medicare.com",
  "acceptsInsurance": true,
  "insuranceProviders": ["NHIS", "Hygeia HMO"],
  "languages": ["English", "Yoruba"],
  "consultationModes": ["in-person", "phone"],
  "servicesOffered": [
    {
      "serviceName": "Prescription Filling",
      "duration": 15,
      "durationType": "minutes",
      "price": 3000,
      "description": "Quick prescription filling service",
      "category": "Medication"
    },
    {
      "serviceName": "Health Subscription",
      "duration": 1,
      "durationType": "months",
      "price": 25000,
      "description": "Monthly health and wellness package",
      "category": "Subscription"
    }
  ]
}
```

### Example 2: Hospital
```json
{
  "practiceType": "hospital",
  "practiceName": "Lagos General Hospital",
  "practiceAddress": {
    "street": "1 Hospital Road",
    "city": "Lagos",
    "state": "Lagos",
    "zipCode": "100001",
    "country": "Nigeria"
  },
  "practicePhone": "+2341234567890",
  "practiceEmail": "info@lagosgeneral.com",
  "acceptsInsurance": true,
  "insuranceProviders": ["NHIS", "All Major Insurance"],
  "languages": ["English", "Yoruba", "Igbo", "Hausa"],
  "consultationModes": ["in-person", "video"],
  "servicesOffered": [
    {
      "serviceName": "Emergency Consultation",
      "duration": 1,
      "durationType": "hours",
      "price": 50000,
      "description": "24/7 emergency medical consultation",
      "category": "Consultation"
    }
  ]
}
```

### Example 3: Telehealth
```json
{
  "practiceType": "telehealth",
  "practiceName": "VirtualDoc Telemedicine",
  "practiceEmail": "contact@virtualdoc.com",
  "acceptsInsurance": false,
  "languages": ["English"],
  "consultationModes": ["video", "phone", "chat"],
  "servicesOffered": [
    {
      "serviceName": "Video Consultation",
      "duration": 30,
      "durationType": "minutes",
      "price": 10000,
      "description": "Virtual doctor consultation",
      "category": "Consultation",
      "insuranceCovered": false,
      "availableModes": ["video"]
    },
    {
      "serviceName": "Follow-up Call",
      "duration": 15,
      "durationType": "minutes",
      "price": 5000,
      "description": "Follow-up consultation call",
      "category": "Consultation",
      "availableModes": ["phone"]
    }
  ]
}
```

### Example 4: Private Clinic
```json
{
  "practiceType": "private",
  "practiceName": "Dr. Smith Medical Center",
  "practiceAddress": {
    "street": "45 Medical Avenue",
    "city": "Abuja",
    "state": "FCT",
    "zipCode": "900001",
    "country": "Nigeria"
  },
  "practicePhone": "+2349087654321",
  "practiceEmail": "appointments@drsmith.com",
  "acceptsInsurance": true,
  "insuranceProviders": ["Hygeia HMO", "Reliance HMO"],
  "languages": ["English"],
  "consultationModes": ["in-person", "video"],
  "servicesOffered": [
    {
      "serviceName": "Initial Consultation",
      "duration": 45,
      "durationType": "minutes",
      "price": 20000,
      "description": "Comprehensive initial medical evaluation",
      "category": "Consultation"
    },
    {
      "serviceName": "Treatment Plan",
      "duration": 3,
      "durationType": "months",
      "price": 150000,
      "description": "3-month comprehensive treatment program",
      "category": "Treatment"
    }
  ]
}
```

## Common Mistakes to Avoid

❌ **Wrong:** Wrapping in `practiceInfo` object
```json
{
  "practiceInfo": {
    "practiceType": "pharmacy",
    ...
  }
}
```

✅ **Correct:** Flat structure at root level
```json
{
  "practiceType": "pharmacy",
  ...
}
```

---

❌ **Wrong:** Using `address` instead of `practiceAddress`
```json
{
  "address": { "street": "..." }
}
```

✅ **Correct:** Use `practiceAddress`
```json
{
  "practiceAddress": { "street": "..." }
}
```

---

❌ **Wrong:** Using `postalCode`
```json
{
  "practiceAddress": {
    "postalCode": "234"
  }
}
```

✅ **Correct:** Use `zipCode`
```json
{
  "practiceAddress": {
    "zipCode": "234"
  }
}
```

---

❌ **Wrong:** Missing `consultationModes` (required!)
```json
{
  "practiceType": "pharmacy",
  "practiceName": "Test"
}
```

✅ **Correct:** Include at least one consultation mode
```json
{
  "practiceType": "pharmacy",
  "practiceName": "Test",
  "consultationModes": ["in-person"]
}
```

---

❌ **Wrong:** Invalid `practiceType`
```json
{
  "practiceType": "drugstore"  // Not valid
}
```

✅ **Correct:** Use valid enum values
```json
{
  "practiceType": "pharmacy"  // Valid
}
```

---

❌ **Wrong:** Invalid `durationType`
```json
{
  "servicesOffered": [{
    "serviceName": "Service",
    "duration": 1,
    "durationType": "month"  // Wrong, should be "months"
  }]
}
```

✅ **Correct:** Use valid duration types
```json
{
  "servicesOffered": [{
    "serviceName": "Service",
    "duration": 1,
    "durationType": "months"  // Correct (plural)
  }]
}
```

## cURL Example

```bash
curl -X POST "https://anola-backend.vercel.app/api/providers/onboarding/step3" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -d '{
    "practiceType": "pharmacy",
    "practiceName": "HealthPlus Pharmacy",
    "practiceAddress": {
      "street": "No. 10 Alhaji, Olowo House",
      "city": "Lagos",
      "state": "Lagos",
      "zipCode": "234",
      "country": "Nigeria"
    },
    "practicePhone": "+2341234567890",
    "practiceEmail": "info@healthplus.com",
    "acceptsInsurance": true,
    "insuranceProviders": ["NHIS"],
    "languages": ["English"],
    "consultationModes": ["in-person", "phone"],
    "servicesOffered": [
      {
        "serviceName": "Prescription Dispensing",
        "duration": 15,
        "durationType": "minutes",
        "price": 5000,
        "description": "Quick prescription service"
      },
      {
        "serviceName": "Monthly Health Package",
        "duration": 1,
        "durationType": "months",
        "price": 50000,
        "description": "Monthly wellness package"
      }
    ]
  }'
```

## JavaScript/Fetch Example

```javascript
const sessionToken = 'YOUR_SESSION_TOKEN_FROM_INIT';

const step3Data = {
  practiceType: 'pharmacy',
  practiceName: 'HealthPlus Pharmacy',
  practiceAddress: {
    street: 'No. 10 Alhaji, Olowo House',
    city: 'Lagos',
    state: 'Lagos',
    zipCode: '234',
    country: 'Nigeria'
  },
  practicePhone: '+2341234567890',
  practiceEmail: 'info@healthplus.com',
  acceptsInsurance: true,
  insuranceProviders: ['NHIS', 'Hygeia HMO'],
  languages: ['English', 'Yoruba'],
  consultationModes: ['in-person', 'phone'],
  servicesOffered: [
    {
      serviceName: 'Prescription Dispensing',
      duration: 15,
      durationType: 'minutes',
      price: 5000,
      description: 'Fill and dispense prescriptions',
      category: 'Medication'
    },
    {
      serviceName: 'Monthly Health Package',
      duration: 1,
      durationType: 'months',
      price: 50000,
      description: 'Monthly medication package',
      category: 'Subscription'
    },
    {
      serviceName: '90-Day Supply',
      duration: 90,
      durationType: 'days',
      price: 120000,
      description: 'Three-month medication supply',
      category: 'Medication'
    }
  ]
};

const response = await fetch('https://anola-backend.vercel.app/api/providers/onboarding/step3', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${sessionToken}`
  },
  body: JSON.stringify(step3Data)
});

const result = await response.json();
console.log(result);
```

## Response Format

### Success Response (200)
```json
{
  "success": true,
  "message": "Practice information saved"
}
```

### Error Responses

**400 - Missing Required Fields**
```json
{
  "success": false,
  "message": "Missing required practice information"
}
```

**400 - Invalid Practice Type**
```json
{
  "success": false,
  "message": "Invalid practice type. Must be one of: hospital, clinic, private, telehealth, pharmacy, other"
}
```

**401 - Invalid Session**
```json
{
  "success": false,
  "message": "Invalid or expired session"
}
```

**400 - Previous Steps Not Completed**
```json
{
  "success": false,
  "message": "Complete previous steps first"
}
```

## Next Steps

After successfully submitting Step 3, proceed to:

**Step 4: Complete Onboarding**
```
POST /api/providers/onboarding/complete
Authorization: Bearer <sessionToken>

{
  "password": "SecurePass123!",
  "confirmPassword": "SecurePass123!",
  "termsAccepted": true,
  "privacyPolicyAccepted": true,
  "hipaaComplianceAccepted": true
}
```

## Need Help?

- Ensure session token is valid (30-minute expiry)
- Complete Step 1 and Step 2 before Step 3
- At least one `consultationMode` is required
- Service `duration` must be a positive integer
- Valid `durationType` values: minutes, hours, days, months, years (default: minutes)
- Valid `practiceType` values: hospital, clinic, private, telehealth, pharmacy, other

## API Documentation

Full API documentation available at:
- Swagger UI: `https://anola-backend.vercel.app/api-docs`
- JSON Spec: `https://anola-backend.vercel.app/api-spec.json`
