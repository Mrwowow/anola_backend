# Provider Discovery API Documentation

## Overview

These public endpoints allow users to discover and search for healthcare providers and their services without authentication.

---

## Table of Contents

1. [Get All Providers](#get-all-providers)
2. [Search Services](#search-services)
3. [Get Single Provider](#get-single-provider)
4. [Get Provider Services](#get-provider-services)

---

## Get All Providers

### Endpoint
```
GET /api/providers
```

### Description
Retrieve a paginated list of all providers with optional filtering.

### Authentication
❌ Not required (public endpoint)

### Query Parameters

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `page` | integer | No | Page number (default: 1) | `1` |
| `limit` | integer | No | Items per page (default: 20) | `20` |
| `providerType` | string | No | Filter by provider type | `doctor` |
| `specialization` | string | No | Filter by specialization | `Cardiology` |
| `practiceType` | string | No | Filter by practice type | `pharmacy` |
| `city` | string | No | Filter by city | `Lagos` |
| `state` | string | No | Filter by state | `Lagos` |
| `acceptsInsurance` | boolean | No | Filter by insurance acceptance | `true` |
| `consultationMode` | string | No | Filter by consultation mode | `video` |
| `search` | string | No | Search across multiple fields | `heart` |

### Valid Values

**providerType:**
- `doctor`
- `nurse`
- `therapist`
- `specialist`
- `other`

**practiceType:**
- `hospital`
- `clinic`
- `private`
- `telehealth`
- `pharmacy`
- `other`

**consultationMode:**
- `in-person`
- `video`
- `phone`
- `chat`

### Example Requests

**Basic - Get first page:**
```bash
GET /api/providers?page=1&limit=10
```

**Filter by practice type (pharmacy):**
```bash
GET /api/providers?practiceType=pharmacy&city=Lagos
```

**Search by specialization:**
```bash
GET /api/providers?specialization=Cardiology&acceptsInsurance=true
```

**Search by name or practice:**
```bash
GET /api/providers?search=heart
```

**Filter by consultation mode:**
```bash
GET /api/providers?consultationMode=video&state=Lagos
```

### Response Format

```json
{
  "success": true,
  "providers": [
    {
      "_id": "68f578dbdd1daba3cae716c2",
      "userType": "provider",
      "providerCode": "PROV-F7E78E7F",
      "providerType": "doctor",
      "email": "provider@example.com",
      "phone": "+2348100123456",
      "status": "pending",
      "profile": {
        "firstName": "Dr. John",
        "lastName": "Doe",
        "gender": "male",
        "dateOfBirth": "1985-01-15T00:00:00.000Z",
        "address": {
          "street": "123 Medical Plaza",
          "city": "Lagos",
          "state": "Lagos",
          "country": "Nigeria",
          "zipCode": "100001"
        }
      },
      "professionalInfo": {
        "specialization": "Cardiology",
        "licenseNumber": "MD-12345678",
        "licenseState": "Lagos",
        "licenseExpiry": "2028-12-31T00:00:00.000Z",
        "yearsOfExperience": 15,
        "npiNumber": "1234567890",
        "education": [
          {
            "degree": "MBBS",
            "institution": "University of Lagos",
            "year": 2008,
            "field": "Medicine"
          }
        ]
      },
      "practiceInfo": {
        "practiceType": "private",
        "practiceName": "Heart Health Clinic",
        "practiceAddress": {
          "street": "456 Medical Center Blvd",
          "city": "Lagos",
          "state": "Lagos",
          "zipCode": "100001",
          "country": "Nigeria"
        },
        "practicePhone": "+2341234567890",
        "practiceEmail": "info@hearthealthclinic.com",
        "acceptsInsurance": true,
        "insuranceProviders": ["NHIS", "Hygeia HMO"],
        "languages": ["English", "Yoruba"],
        "consultationModes": ["in-person", "video", "phone"]
      },
      "services": [
        {
          "serviceId": "SRV-7DC21E",
          "name": "Initial Consultation",
          "duration": 45,
          "durationType": "minutes",
          "price": 15000,
          "isActive": true
        }
      ],
      "statistics": {
        "rating": 4.5,
        "totalReviews": 150,
        "totalPatients": 500,
        "totalAppointments": 1200,
        "completedAppointments": 1100
      },
      "createdAt": "2025-10-19T23:48:43.455Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalProviders": 45,
    "limit": 10
  }
}
```

### cURL Example

```bash
curl -X GET "https://anola-backend.vercel.app/api/providers?page=1&limit=10&practiceType=pharmacy&city=Lagos"
```

### JavaScript Example

```javascript
async function getProviders(filters = {}) {
  const params = new URLSearchParams({
    page: filters.page || 1,
    limit: filters.limit || 20,
    ...filters
  });

  const response = await fetch(
    `https://anola-backend.vercel.app/api/providers?${params}`
  );

  const data = await response.json();
  return data;
}

// Usage
const pharmacies = await getProviders({
  practiceType: 'pharmacy',
  city: 'Lagos',
  acceptsInsurance: true
});

console.log(`Found ${pharmacies.pagination.totalProviders} pharmacies`);
```

---

## Search Services

### Endpoint
```
GET /api/providers/services
```

### Description
Search and filter services across all providers.

### Authentication
❌ Not required (public endpoint)

### Query Parameters

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `page` | integer | No | Page number (default: 1) | `1` |
| `limit` | integer | No | Items per page (default: 100) | `50` |
| `search` | string | No | Search service name/description | `consultation` |
| `category` | string | No | Filter by category | `Consultation` |
| `minPrice` | number | No | Minimum price filter | `5000` |
| `maxPrice` | number | No | Maximum price filter | `50000` |
| `durationType` | string | No | Filter by duration type | `months` |
| `city` | string | No | Filter by provider city | `Lagos` |
| `state` | string | No | Filter by provider state | `Lagos` |

### Valid Values

**durationType:**
- `minutes`
- `hours`
- `days`
- `months`
- `years`

**Common Categories:**
- `Consultation`
- `Diagnostic`
- `Procedure`
- `Medication`
- `Subscription`
- `Treatment`
- `Therapy`

### Example Requests

**Basic - Get all services:**
```bash
GET /api/providers/services?page=1&limit=100
```

**Search by name:**
```bash
GET /api/providers/services?search=consultation
```

**Filter by price range:**
```bash
GET /api/providers/services?minPrice=10000&maxPrice=50000
```

**Filter by duration type (subscriptions):**
```bash
GET /api/providers/services?durationType=months
```

**Filter by category:**
```bash
GET /api/providers/services?category=Medication&city=Lagos
```

**Combined filters:**
```bash
GET /api/providers/services?search=health&durationType=months&maxPrice=100000&city=Lagos
```

### Response Format

```json
{
  "success": true,
  "services": [
    {
      "serviceId": "SRV-A1B2C3",
      "name": "Monthly Health Package",
      "category": "Subscription",
      "description": "Monthly medication and health monitoring package",
      "duration": 1,
      "durationType": "months",
      "price": 50000,
      "insuranceCovered": false,
      "availableModes": ["in-person", "phone"],
      "provider": {
        "id": "68f655f8c2a091172ab15e40",
        "code": "PROV-3AF981AA",
        "name": "Pharmacy Owner",
        "practiceName": "HealthPlus Pharmacy",
        "specialization": "Pharmacy",
        "city": "Lagos",
        "state": "Lagos",
        "rating": 4.5,
        "totalReviews": 25
      }
    },
    {
      "serviceId": "SRV-7DC21E",
      "name": "Initial Consultation",
      "category": "Consultation",
      "description": "Comprehensive cardiac evaluation",
      "duration": 45,
      "durationType": "minutes",
      "price": 15000,
      "insuranceCovered": true,
      "availableModes": ["in-person", "video"],
      "provider": {
        "id": "68f578dbdd1daba3cae716c2",
        "code": "PROV-F7E78E7F",
        "name": "Dr. John Doe",
        "practiceName": "Heart Health Clinic",
        "specialization": "Cardiology",
        "city": "Lagos",
        "state": "Lagos",
        "rating": 4.8,
        "totalReviews": 150
      }
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 3,
    "totalServices": 28,
    "limit": 100
  }
}
```

### cURL Example

```bash
curl -X GET "https://anola-backend.vercel.app/api/providers/services?durationType=months&city=Lagos&limit=50"
```

### JavaScript Example

```javascript
async function searchServices(filters = {}) {
  const params = new URLSearchParams({
    page: filters.page || 1,
    limit: filters.limit || 100,
    ...filters
  });

  const response = await fetch(
    `https://anola-backend.vercel.app/api/providers/services?${params}`
  );

  const data = await response.json();
  return data;
}

// Usage Examples

// Find monthly subscription services
const subscriptions = await searchServices({
  durationType: 'months',
  category: 'Subscription',
  city: 'Lagos'
});

// Find affordable consultations
const consultations = await searchServices({
  category: 'Consultation',
  maxPrice: 20000,
  search: 'initial'
});

// Find pharmacy services
const pharmacyServices = await searchServices({
  search: 'medication',
  category: 'Medication'
});

console.log(`Found ${subscriptions.pagination.totalServices} subscription services`);
```

---

## Get Single Provider

### Endpoint
```
GET /api/providers/:providerId/profile
```

### Description
Get detailed profile of a specific provider.

### Authentication
❌ Not required (public endpoint)

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `providerId` | string | Yes | Provider's MongoDB ID |

### Example Request

```bash
GET /api/providers/68f578dbdd1daba3cae716c2/profile
```

### Response Format

```json
{
  "success": true,
  "provider": {
    "_id": "68f578dbdd1daba3cae716c2",
    "providerCode": "PROV-F7E78E7F",
    "providerType": "doctor",
    "profile": {
      "firstName": "Dr. John",
      "lastName": "Doe"
    },
    "professionalInfo": {
      "specialization": "Cardiology",
      "yearsOfExperience": 15
    },
    "practiceInfo": {
      "practiceType": "private",
      "practiceName": "Heart Health Clinic"
    },
    "services": [...],
    "statistics": {
      "rating": 4.8,
      "totalReviews": 150
    }
  }
}
```

### cURL Example

```bash
curl -X GET "https://anola-backend.vercel.app/api/providers/68f578dbdd1daba3cae716c2/profile"
```

---

## Get Provider Services

### Endpoint
```
GET /api/providers/:providerId/services
```

### Description
Get all services offered by a specific provider.

### Authentication
❌ Not required (public endpoint)

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `providerId` | string | Yes | Provider's MongoDB ID |

### Example Request

```bash
GET /api/providers/68f578dbdd1daba3cae716c2/services
```

### Response Format

```json
{
  "success": true,
  "services": [
    {
      "serviceId": "SRV-7DC21E",
      "name": "Initial Consultation",
      "category": "Consultation",
      "description": "Comprehensive cardiac evaluation",
      "duration": 45,
      "durationType": "minutes",
      "price": 15000,
      "insuranceCovered": true,
      "availableModes": ["in-person", "video"],
      "isActive": true,
      "totalBookings": 150,
      "createdAt": "2025-10-19T23:48:43.455Z"
    },
    {
      "serviceId": "SRV-C8B7C1",
      "name": "ECG Test",
      "category": "Diagnostic",
      "description": "Electrocardiogram test",
      "duration": 20,
      "durationType": "minutes",
      "price": 5000,
      "insuranceCovered": true,
      "availableModes": ["in-person"],
      "isActive": true,
      "totalBookings": 85
    }
  ],
  "totalServices": 2
}
```

### cURL Example

```bash
curl -X GET "https://anola-backend.vercel.app/api/providers/68f578dbdd1daba3cae716c2/services"
```

---

## Use Cases

### 1. Find Pharmacies Near Me
```javascript
const pharmacies = await fetch(
  'https://anola-backend.vercel.app/api/providers?' +
  'practiceType=pharmacy&city=Lagos&acceptsInsurance=true'
).then(r => r.json());
```

### 2. Find Monthly Subscription Services
```javascript
const subscriptions = await fetch(
  'https://anola-backend.vercel.app/api/providers/services?' +
  'durationType=months&category=Subscription'
).then(r => r.json());
```

### 3. Find Cardiologists with Video Consultation
```javascript
const cardiologists = await fetch(
  'https://anola-backend.vercel.app/api/providers?' +
  'specialization=Cardiology&consultationMode=video'
).then(r => r.json());
```

### 4. Find Affordable Consultations
```javascript
const affordableServices = await fetch(
  'https://anola-backend.vercel.app/api/providers/services?' +
  'category=Consultation&maxPrice=20000&city=Lagos'
).then(r => r.json());
```

### 5. Search for Specific Treatment
```javascript
const treatments = await fetch(
  'https://anola-backend.vercel.app/api/providers/services?' +
  'search=diabetes&category=Treatment'
).then(r => r.json());
```

---

## React Component Example

```jsx
import { useState, useEffect } from 'react';

function ProviderSearch() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    practiceType: '',
    city: '',
    page: 1
  });

  useEffect(() => {
    searchProviders();
  }, [filters]);

  const searchProviders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(
        Object.entries(filters).filter(([_, v]) => v)
      );

      const response = await fetch(
        `https://anola-backend.vercel.app/api/providers?${params}`
      );

      const data = await response.json();
      setProviders(data.providers);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <select
        value={filters.practiceType}
        onChange={(e) => setFilters({ ...filters, practiceType: e.target.value })}
      >
        <option value="">All Types</option>
        <option value="hospital">Hospital</option>
        <option value="clinic">Clinic</option>
        <option value="pharmacy">Pharmacy</option>
        <option value="telehealth">Telehealth</option>
      </select>

      <input
        type="text"
        placeholder="City"
        value={filters.city}
        onChange={(e) => setFilters({ ...filters, city: e.target.value })}
      />

      {loading ? (
        <p>Loading...</p>
      ) : (
        <ul>
          {providers.map(provider => (
            <li key={provider._id}>
              <h3>{provider.practiceInfo.practiceName}</h3>
              <p>{provider.professionalInfo.specialization}</p>
              <p>Rating: {provider.statistics.rating}/5</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

---

## Performance Notes

### Service Search
- The `/api/providers/services` endpoint searches across ALL providers
- For better performance, use specific filters (city, state, category)
- Results are paginated (default: 100 items per page)

### Provider Listing
- Default pagination: 20 providers per page
- Use `limit` parameter to adjust page size
- Maximum recommended limit: 100

### Caching Recommendations
- Cache provider lists for 5-10 minutes
- Cache individual provider profiles for 15 minutes
- Invalidate cache when provider updates their profile

---

## Error Responses

### 500 - Server Error
```json
{
  "success": false,
  "message": "Failed to get providers",
  "error": "Error details..."
}
```

---

## Related Documentation

- [Step 3 Request Format](STEP3_REQUEST_FORMAT.md) - Provider onboarding
- [Complete Onboarding](COMPLETE_ONBOARDING_REQUEST_FORMAT.md) - Registration
- [Provider Backend API Guide](PROVIDER_BACKEND_API_GUIDE.md) - Full API reference

---

## API Base URL

**Production:** `https://anola-backend.vercel.app`

## Full Documentation

- **Swagger UI:** https://anola-backend.vercel.app/api-docs
- **JSON Spec:** https://anola-backend.vercel.app/api-spec.json
