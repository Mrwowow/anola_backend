# Quick API Reference - Provider Endpoints

## Base URL
```
https://anola-backend.vercel.app
```

## Provider Onboarding Flow

### 1. Initialize Session
```bash
POST /api/providers/onboarding/init
```
Returns: `{ sessionToken }`

### 2. Basic Information
```bash
POST /api/providers/onboarding/step1
Authorization: Bearer {sessionToken}
Content-Type: application/json

{
  "providerType": "doctor",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "+2348012345678",
  "dateOfBirth": "1985-01-15",
  "gender": "male",
  "address": {
    "street": "123 Main St",
    "city": "Lagos",
    "state": "Lagos",
    "country": "Nigeria",
    "zipCode": "100001"
  }
}
```

### 3. Professional Information
```bash
POST /api/providers/onboarding/step2
Authorization: Bearer {sessionToken}
Content-Type: application/json

{
  "specialization": "Cardiology",
  "licenseNumber": "MD-123456",
  "licenseState": "Lagos",
  "licenseExpiry": "2028-12-31",
  "yearsOfExperience": 10,
  "npiNumber": "1234567890",
  "education": [
    {
      "degree": "MD",
      "institution": "University of Lagos",
      "year": 2015,
      "field": "Medicine"
    }
  ]
}
```

### 4. Practice Information
```bash
POST /api/providers/onboarding/step3
Authorization: Bearer {sessionToken}
Content-Type: application/json

{
  "practiceType": "pharmacy",
  "practiceName": "HealthPlus Pharmacy",
  "practiceAddress": {
    "street": "456 Medical Center Blvd",
    "city": "Lagos",
    "state": "Lagos",
    "zipCode": "100001",
    "country": "Nigeria"
  },
  "practicePhone": "+2341234567890",
  "practiceEmail": "info@healthplus.com",
  "acceptsInsurance": true,
  "insuranceProviders": ["NHIS"],
  "languages": ["English"],
  "consultationModes": ["in-person", "chat"],
  "servicesOffered": [
    {
      "serviceName": "Prescription Dispensing",
      "duration": 15,
      "durationType": "minutes",
      "price": 5000,
      "description": "Fill and dispense prescriptions",
      "category": "Medication"
    }
  ]
}
```

**Practice Types**: `hospital`, `clinic`, `private`, `telehealth`, `pharmacy`, `other`
**Duration Types**: `minutes`, `hours`, `days`, `months`, `years`

### 5. Complete Onboarding
```bash
POST /api/providers/onboarding/complete
Authorization: Bearer {sessionToken}
Content-Type: application/json

{
  "password": "SecurePass123!",
  "confirmPassword": "SecurePass123!",
  "termsAccepted": true,
  "privacyPolicyAccepted": true,
  "hipaaComplianceAccepted": true
}
```
Returns: Provider profile + JWT tokens

---

## Provider Discovery (Public)

### Get All Providers
```bash
GET /api/providers?page=1&limit=20
GET /api/providers?practiceType=pharmacy
GET /api/providers?city=Lagos
GET /api/providers?specialization=Cardiology
GET /api/providers?acceptsInsurance=true
GET /api/providers?consultationMode=telehealth
GET /api/providers?search=heart
```

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)
- `providerType` - Filter by provider type
- `specialization` - Filter by specialization
- `practiceType` - Filter by practice type
- `city` - Filter by city
- `state` - Filter by state
- `acceptsInsurance` - Filter by insurance acceptance
- `consultationMode` - Filter by consultation mode
- `search` - Search across name, practice, specialization

### Search All Services
```bash
GET /api/providers/services?page=1&limit=100
GET /api/providers/services?search=consultation
GET /api/providers/services?category=Medication
GET /api/providers/services?minPrice=5000&maxPrice=10000
GET /api/providers/services?durationType=months
GET /api/providers/services?city=Lagos&state=Lagos
```

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 100)
- `search` - Search service name/description
- `category` - Filter by service category
- `minPrice` - Minimum price filter
- `maxPrice` - Maximum price filter
- `durationType` - Filter by duration type
- `city` - Filter by provider city
- `state` - Filter by provider state

### Get Provider Profile
```bash
GET /api/providers/{providerId}/profile
```

### Get Provider Services
```bash
GET /api/providers/{providerId}/services
```

---

## Provider Management (Protected)

### Add Service
```bash
POST /api/providers/{providerId}/services
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "name": "Annual Wellness Program",
  "category": "Subscription",
  "description": "Comprehensive annual wellness package",
  "duration": 1,
  "durationType": "years",
  "price": 500000,
  "insuranceCovered": true,
  "availableModes": ["in-person", "telehealth"]
}
```

### Update Service
```bash
PUT /api/providers/{providerId}/services/{serviceId}
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "name": "Updated Service Name",
  "price": 6000,
  "durationType": "hours"
}
```

**Note:** `serviceId` can be either:
- Service ID format: `SRV-XXXXXX`
- MongoDB _id: `68f69bda582a884e78e0b0e7`

**Field Names:** You can use either `name` or `serviceName` in the request body.

### Delete Service
```bash
DELETE /api/providers/{providerId}/services/{serviceId}
Authorization: Bearer {accessToken}
```

**Note:** `serviceId` can be either Service ID (`SRV-XXXXXX`) or MongoDB _id.

### Update Profile
```bash
PUT /api/providers/{providerId}/profile
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "firstName": "Updated",
  "lastName": "Name",
  "phone": "+2348012345678"
}
```

### Update Practice Info
```bash
PUT /api/providers/{providerId}/practice-info
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "practiceName": "New Practice Name",
  "practicePhone": "+2341234567890"
}
```

### Update Availability
```bash
PUT /api/providers/{providerId}/availability
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "schedule": [
    {
      "dayOfWeek": "Monday",
      "startTime": "09:00",
      "endTime": "17:00"
    }
  ],
  "slotDuration": 30,
  "isAcceptingNewPatients": true
}
```

### Get Analytics
```bash
GET /api/providers/{providerId}/analytics?period=month
Authorization: Bearer {accessToken}
```

**Period Options:** `day`, `week`, `month`, `year`, `all`

**Response includes:**
- Appointment statistics (total, completed, cancelled, by mode, by type)
- Revenue analytics (total, pending, received, average per appointment)
- Patient statistics (total, new, returning)
- Top 5 performing services
- Daily trends (appointments and revenue over time)
- Performance metrics (completion rate, cancellation rate, no-show rate, ratings)

---

## Common Response Formats

### Success Response
```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

### Pagination Response
```json
{
  "success": true,
  "providers": [ ... ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 10,
    "totalProviders": 200,
    "limit": 20
  }
}
```

---

## Quick Examples

### Find Pharmacies in Lagos
```bash
curl "https://anola-backend.vercel.app/api/providers?practiceType=pharmacy&city=Lagos"
```

### Find Monthly Subscriptions
```bash
curl "https://anola-backend.vercel.app/api/providers/services?durationType=months"
```

### Find Affordable Services Under ₦10,000
```bash
curl "https://anola-backend.vercel.app/api/providers/services?maxPrice=10000"
```

### Search for Cardiologists
```bash
curl "https://anola-backend.vercel.app/api/providers?specialization=Cardiology"
```

### Find Telehealth Providers
```bash
curl "https://anola-backend.vercel.app/api/providers?consultationMode=telehealth"
```

---

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

---

## Need More Details?

See comprehensive documentation:
- [PROVIDER_BACKEND_API_GUIDE.md](./PROVIDER_BACKEND_API_GUIDE.md)
- [STEP3_REQUEST_FORMAT.md](./STEP3_REQUEST_FORMAT.md)
- [COMPLETE_ONBOARDING_REQUEST_FORMAT.md](./COMPLETE_ONBOARDING_REQUEST_FORMAT.md)
- [PROVIDER_DISCOVERY_API.md](./PROVIDER_DISCOVERY_API.md)
- [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)
