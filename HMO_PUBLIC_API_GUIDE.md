# HMO Plans & Enrollment API Guide

## 🎯 Overview

This guide provides complete API specifications for HMO Plans discovery, comparison, enrollment, and management features available to all user types (patients, providers, vendors, sponsors).

---

## 📋 Table of Contents

1. [Authentication](#authentication)
2. [HMO Plans Discovery (Public)](#hmo-plans-discovery-public)
3. [HMO Enrollment APIs (Authenticated)](#hmo-enrollment-apis-authenticated)
4. [Enrollment Management](#enrollment-management)
5. [Claims & Utilization](#claims--utilization)
6. [Error Handling](#error-handling)
7. [Integration Examples](#integration-examples)

---

## 🔐 Authentication

### Public Endpoints
The following endpoints are publicly accessible (no authentication required):
- `GET /api/hmo-plans` - Browse available plans
- `GET /api/hmo-plans/:id` - View plan details
- `POST /api/hmo-plans/compare` - Compare plans

### Authenticated Endpoints
All enrollment and management endpoints require authentication:

```typescript
{
  'Authorization': 'Bearer <access_token>',
  'Content-Type': 'application/json'
}
```

---

## 🏥 HMO Plans Discovery (Public)

### Get Available HMO Plans

Browse all active HMO plans available for enrollment.

```typescript
// GET /api/hmo-plans?category=standard&planType=individual&minPrice=100&maxPrice=500
interface GetHMOPlansRequest {
  category?: 'basic' | 'standard' | 'premium' | 'platinum';
  planType?: 'individual' | 'family' | 'corporate' | 'group';
  minPrice?: number; // Minimum monthly premium
  maxPrice?: number; // Maximum monthly premium
  sortBy?: string; // Default: pricing.monthlyPremium.individual
}

interface GetHMOPlansResponse {
  success: boolean;
  data: Array<{
    _id: string;
    name: string;
    planCode: string;
    description: string;
    provider: {
      name: string;
      email: string;
      phone: string;
      website?: string;
    };
    planType: string;
    category: string;
    pricing: {
      monthlyPremium: {
        individual: number;
        family?: number;
        corporate?: number;
      };
      annualPremium: {
        individual: number;
        family?: number;
        corporate?: number;
      };
      currency: string;
    };
    coverage: {
      outpatientCare: CoverageDetails;
      inpatientCare: CoverageDetails;
      emergencyCare: CoverageDetails;
      surgery: CoverageDetails;
      maternityAndChildbirth: CoverageDetails;
      prescriptionDrugs: CoverageDetails;
      diagnosticTests: CoverageDetails;
      dentalCare: CoverageDetails;
      visionCare: CoverageDetails;
      mentalHealth: CoverageDetails;
      preventiveCare: CoverageDetails;
      specialistConsultation: CoverageDetails;
    };
    limits: {
      annualMaximum: number;
      lifetimeMaximum: number;
      dependentsAllowed: number;
      ageLimit: { min: number; max: number };
    };
    keyBenefits: string[];
    network: {
      type: string;
      hospitals: string[];
      pharmacies: string[];
      clinics: string[];
    };
    status: string;
    isAvailableForNewEnrollment: boolean;
  }>;
  count: number;
}

interface CoverageDetails {
  covered: boolean;
  copayment?: number;
  coveragePercentage?: number;
  requiresReferral?: boolean;
  limit?: {
    amount: number;
    period: string;
  };
}
```

**Example Request:**

```bash
curl -X GET "https://api.anolahealth.com/api/hmo-plans?category=standard&planType=individual&minPrice=100&maxPrice=300" \
  -H "Content-Type: application/json"
```

**Example Response:**

```json
{
  "success": true,
  "data": [
    {
      "_id": "65f1234567890abcdef12345",
      "name": "Standard Health Plan",
      "planCode": "SHP-001",
      "description": "Comprehensive coverage for individuals",
      "provider": {
        "name": "National Health Insurance",
        "email": "contact@nhi.com",
        "phone": "+1234567890",
        "website": "https://nhi.com"
      },
      "planType": "individual",
      "category": "standard",
      "pricing": {
        "monthlyPremium": {
          "individual": 150
        },
        "annualPremium": {
          "individual": 1800
        },
        "currency": "USD"
      },
      "coverage": {
        "outpatientCare": {
          "covered": true,
          "copayment": 20,
          "coveragePercentage": 80,
          "limit": {
            "amount": 5000,
            "period": "year"
          }
        }
        // ... other coverage details
      },
      "limits": {
        "annualMaximum": 50000,
        "lifetimeMaximum": 500000,
        "dependentsAllowed": 0,
        "ageLimit": { "min": 18, "max": 65 }
      },
      "keyBenefits": [
        "24/7 emergency care",
        "Free preventive checkups",
        "Prescription drug coverage"
      ],
      "status": "active",
      "isAvailableForNewEnrollment": true
    }
  ],
  "count": 1
}
```

---

### Get HMO Plan Details

Get detailed information about a specific HMO plan.

```typescript
// GET /api/hmo-plans/:id
interface GetPlanDetailsResponse {
  success: boolean;
  data: {
    // Complete plan details including all fields from the model
    _id: string;
    name: string;
    planCode: string;
    description: string;
    provider: object;
    planType: string;
    category: string;
    coverage: object;
    pricing: object;
    limits: object;
    exclusions: Array<{ category: string; description: string }>;
    network: {
      type: string;
      providers: Array<object>;
      hospitals: string[];
      pharmacies: string[];
      clinics: string[];
    };
    enrollment: {
      openEnrollment: { startDate: Date; endDate: Date };
      minimumMembers: number;
      autoRenewal: boolean;
      gracePeriod: number;
    };
    documents: Array<{
      name: string;
      type: string;
      url: string;
    }>;
    keyBenefits: string[];
    additionalBenefits: Array<object>;
    statistics: {
      totalEnrollments: number;
      activeMembers: number;
      customerSatisfactionRating: number;
    };
  };
}
```

---

### Compare HMO Plans

Compare 2-4 HMO plans side by side.

```typescript
// POST /api/hmo-plans/compare
interface ComparePlansRequest {
  planIds: string[]; // Array of 2-4 plan IDs
}

interface ComparePlansResponse {
  success: boolean;
  data: Array<{
    // Plan details for each plan
    _id: string;
    name: string;
    planCode: string;
    pricing: object;
    coverage: object;
    limits: object;
    // ... other relevant comparison fields
  }>;
}
```

**Example Request:**

```bash
curl -X POST "https://api.anolahealth.com/api/hmo-plans/compare" \
  -H "Content-Type: application/json" \
  -d '{
    "planIds": [
      "65f1234567890abcdef12345",
      "65f1234567890abcdef12346",
      "65f1234567890abcdef12347"
    ]
  }'
```

---

## 🔐 HMO Enrollment APIs (Authenticated)

### Enroll in HMO Plan

Submit an enrollment request for an HMO plan. Requires authentication.

```typescript
// POST /api/hmo-enrollments
interface EnrollInPlanRequest {
  planId: string; // Required
  enrollmentType: 'individual' | 'family' | 'corporate' | 'group'; // Required
  dependents?: Array<{
    firstName: string;
    lastName: string;
    dateOfBirth: Date;
    gender: string;
    relationship: 'spouse' | 'child' | 'parent' | 'other';
    nationalId: string;
  }>;
  paymentPlan?: 'monthly' | 'quarterly' | 'annual'; // Default: monthly
  paymentMethod: 'card' | 'bank_transfer' | 'wallet' | 'employer'; // Required
  coverageStartDate?: Date; // Optional, defaults to today
  primaryCareProviderId?: string; // Optional
  beneficiary?: {
    name: string;
    relationship: string;
    phone: string;
    email: string;
    address: string;
  };
  employer?: {
    name: string;
    employeeId: string;
    department: string;
    contributionPercentage: number;
  };
}

interface EnrollInPlanResponse {
  success: boolean;
  data: {
    _id: string;
    userId: string;
    planId: string;
    enrollmentNumber: string;
    enrollmentType: string;
    status: 'pending' | 'active';
    payment: {
      plan: string;
      amount: number;
      nextPaymentDate: Date;
    };
    coverageStartDate: Date;
    coverageEndDate: Date;
    renewalDate: Date;
    limits: {
      annualMaximum: number;
      remainingAnnual: number;
      lifetimeMaximum: number;
      remainingLifetime: number;
      deductible: number;
      deductibleMet: number;
      maxOutOfPocket: number;
      outOfPocketMet: number;
    };
    dependents: Array<object>;
    createdAt: Date;
  };
  message: string;
}
```

**Example Request:**

```bash
curl -X POST "https://api.anolahealth.com/api/hmo-enrollments" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "planId": "65f1234567890abcdef12345",
    "enrollmentType": "family",
    "dependents": [
      {
        "firstName": "Jane",
        "lastName": "Doe",
        "dateOfBirth": "1990-05-15",
        "gender": "female",
        "relationship": "spouse",
        "nationalId": "987654321"
      },
      {
        "firstName": "John Jr.",
        "lastName": "Doe",
        "dateOfBirth": "2015-08-20",
        "gender": "male",
        "relationship": "child",
        "nationalId": "123456789"
      }
    ],
    "paymentPlan": "monthly",
    "paymentMethod": "card",
    "beneficiary": {
      "name": "Jane Doe",
      "relationship": "spouse",
      "phone": "+1234567890",
      "email": "jane@example.com"
    }
  }'
```

**Example Response:**

```json
{
  "success": true,
  "data": {
    "_id": "65f9876543210fedcba98765",
    "userId": "65f1111111111111111111111",
    "planId": "65f1234567890abcdef12345",
    "enrollmentNumber": "ENR-1K9L3M8-AB2C",
    "enrollmentType": "family",
    "status": "pending",
    "payment": {
      "plan": "monthly",
      "amount": 250,
      "nextPaymentDate": "2025-02-01T00:00:00.000Z"
    },
    "coverageStartDate": "2025-01-15T00:00:00.000Z",
    "coverageEndDate": "2026-01-15T00:00:00.000Z",
    "renewalDate": "2025-12-16T00:00:00.000Z",
    "limits": {
      "annualMaximum": 100000,
      "remainingAnnual": 100000,
      "lifetimeMaximum": 1000000,
      "remainingLifetime": 1000000,
      "deductible": 500,
      "deductibleMet": 0,
      "maxOutOfPocket": 5000,
      "outOfPocketMet": 0
    },
    "dependents": [
      {
        "firstName": "Jane",
        "lastName": "Doe",
        "relationship": "spouse"
      },
      {
        "firstName": "John Jr.",
        "lastName": "Doe",
        "relationship": "child"
      }
    ],
    "createdAt": "2025-01-15T10:30:00.000Z"
  },
  "message": "Enrollment request submitted successfully. Please complete payment to activate."
}
```

---

### Get My Enrollments

Retrieve all enrollments for the authenticated user.

```typescript
// GET /api/hmo-enrollments/my-enrollments?status=active
interface GetMyEnrollmentsRequest {
  status?: 'pending' | 'active' | 'suspended' | 'cancelled' | 'expired' | 'grace_period';
}

interface GetMyEnrollmentsResponse {
  success: boolean;
  data: Array<{
    _id: string;
    enrollmentNumber: string;
    membershipCardNumber?: string;
    planId: {
      name: string;
      planCode: string;
      category: string;
      provider: object;
    };
    enrollmentType: string;
    status: string;
    coverageStartDate: Date;
    coverageEndDate: Date;
    payment: {
      plan: string;
      amount: number;
      nextPaymentDate: Date;
    };
    primaryCareProvider?: {
      name: string;
      specialty: string;
    };
    utilization: {
      appointmentsUsed: number;
      prescriptionsUsed: number;
      claimsSubmitted: number;
    };
    createdAt: Date;
  }>;
  count: number;
}
```

---

## 📋 Enrollment Management

### Get Enrollment Details

```typescript
// GET /api/hmo-enrollments/:id
interface GetEnrollmentDetailsResponse {
  success: boolean;
  data: {
    _id: string;
    userId: string;
    planId: object; // Populated plan details
    enrollmentNumber: string;
    membershipCardNumber: string;
    enrollmentType: string;
    status: string;
    coverageStartDate: Date;
    coverageEndDate: Date;
    renewalDate: Date;
    payment: object;
    dependents: Array<object>;
    primaryCareProvider: object;
    utilization: object;
    limits: object;
    beneficiary: object;
    documents: Array<object>;
    statusHistory: Array<object>;
    createdAt: Date;
    updatedAt: Date;
  };
}
```

---

### Update Enrollment

Update enrollment details such as dependents, primary care provider, or beneficiary.

```typescript
// PUT /api/hmo-enrollments/:id
interface UpdateEnrollmentRequest {
  dependents?: Array<object>;
  primaryCareProviderId?: string;
  beneficiary?: object;
  paymentMethod?: string;
}

interface UpdateEnrollmentResponse {
  success: boolean;
  data: object; // Updated enrollment
  message: string;
}
```

**Example Request:**

```bash
curl -X PUT "https://api.anolahealth.com/api/hmo-enrollments/65f9876543210fedcba98765" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "primaryCareProviderId": "65f2222222222222222222222",
    "beneficiary": {
      "name": "Updated Beneficiary",
      "relationship": "spouse",
      "phone": "+0987654321",
      "email": "updated@example.com"
    }
  }'
```

---

### Cancel Enrollment

Request cancellation of an active enrollment.

```typescript
// POST /api/hmo-enrollments/:id/cancel
interface CancelEnrollmentRequest {
  reason: string; // Required
  effectiveDate?: Date; // Optional, defaults to today
}

interface CancelEnrollmentResponse {
  success: boolean;
  data: {
    enrollment: object;
    refundAmount: number;
  };
  message: string;
}
```

**Example Request:**

```bash
curl -X POST "https://api.anolahealth.com/api/hmo-enrollments/65f9876543210fedcba98765/cancel" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "reason": "Switching to employer-provided insurance",
    "effectiveDate": "2025-02-01"
  }'
```

---

### Renew Enrollment

Submit a renewal request for an expiring enrollment.

```typescript
// POST /api/hmo-enrollments/:id/renew
interface RenewEnrollmentRequest {
  paymentMethod?: 'card' | 'bank_transfer' | 'wallet' | 'employer';
}

interface RenewEnrollmentResponse {
  success: boolean;
  data: object; // New enrollment for renewal period
  message: string;
}
```

**Note:** Renewal is available 60 days before the coverage end date.

---

## 📊 Claims & Utilization

### Get Enrollment Claims

Retrieve claims and utilization data for an enrollment.

```typescript
// GET /api/hmo-enrollments/:id/claims
interface GetEnrollmentClaimsResponse {
  success: boolean;
  data: {
    utilization: {
      appointmentsUsed: number;
      prescriptionsUsed: number;
      claimsSubmitted: number;
      claimsApproved: number;
      claimsDenied: number;
      totalClaimsAmount: number;
      totalPaidAmount: number;
    };
    limits: {
      annualMaximum: number;
      remainingAnnual: number;
      lifetimeMaximum: number;
      remainingLifetime: number;
      deductible: number;
      deductibleMet: number;
      maxOutOfPocket: number;
      outOfPocketMet: number;
    };
  };
}
```

---

### Download Enrollment Card

Download membership card/certificate for active enrollment.

```typescript
// GET /api/hmo-enrollments/:id/card
interface DownloadCardResponse {
  success: boolean;
  data: {
    membershipCardNumber: string;
    enrollmentNumber: string;
    memberName: string;
    planName: string;
    coverageStartDate: Date;
    coverageEndDate: Date;
    dependents: Array<object>;
  };
  message: string;
}
```

---

## ⚠️ Error Handling

### Standard Error Response

```typescript
interface ErrorResponse {
  success: false;
  message: string;
  error?: string;
  errors?: string[];
}
```

### Common Error Codes

| Status Code | Error Type | Description |
|------------|-----------|-------------|
| 400 | Bad Request | Invalid request data or validation error |
| 401 | Unauthorized | Missing or invalid authentication token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Already enrolled or duplicate request |
| 500 | Internal Server Error | Server-side error |

### Example Error Responses

**Validation Error:**
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    "Enrollment type is required",
    "Payment method is required"
  ]
}
```

**Already Enrolled:**
```json
{
  "success": false,
  "message": "You already have an active or pending enrollment"
}
```

**Plan Not Available:**
```json
{
  "success": false,
  "message": "HMO plan not found or not available for enrollment"
}
```

---

## 💻 Integration Examples

### React/Next.js Integration

```typescript
// lib/api/hmo.ts
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.anolahealth.com/api';

// Create axios instance
const hmoApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token interceptor
hmoApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const hmoAPI = {
  // Public endpoints
  getPlans: (params) => hmoApi.get('/hmo-plans', { params }),
  getPlanDetails: (id) => hmoApi.get(`/hmo-plans/${id}`),
  comparePlans: (planIds) => hmoApi.post('/hmo-plans/compare', { planIds }),

  // Enrollment endpoints
  enroll: (data) => hmoApi.post('/hmo-enrollments', data),
  getMyEnrollments: (params) => hmoApi.get('/hmo-enrollments/my-enrollments', { params }),
  getEnrollmentDetails: (id) => hmoApi.get(`/hmo-enrollments/${id}`),
  updateEnrollment: (id, data) => hmoApi.put(`/hmo-enrollments/${id}`, data),
  cancelEnrollment: (id, data) => hmoApi.post(`/hmo-enrollments/${id}/cancel`, data),
  renewEnrollment: (id, data) => hmoApi.post(`/hmo-enrollments/${id}/renew`, data),
  getEnrollmentClaims: (id) => hmoApi.get(`/hmo-enrollments/${id}/claims`),
  downloadCard: (id) => hmoApi.get(`/hmo-enrollments/${id}/card`)
};
```

### React Hook Example

```typescript
// hooks/useHMOPlans.ts
import { useState, useEffect } from 'react';
import { hmoAPI } from '@/lib/api/hmo';

export function useHMOPlans(filters = {}) {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoading(true);
        const response = await hmoAPI.getPlans(filters);
        setPlans(response.data.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, [JSON.stringify(filters)]);

  return { plans, loading, error };
}

export function useMyEnrollments() {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEnrollments = async () => {
      try {
        setLoading(true);
        const response = await hmoAPI.getMyEnrollments();
        setEnrollments(response.data.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEnrollments();
  }, []);

  return { enrollments, loading, error };
}
```

### Component Example

```typescript
// components/HMOPlanCard.tsx
import { useState } from 'react';
import { hmoAPI } from '@/lib/api/hmo';

export default function HMOPlanCard({ plan }) {
  const [enrolling, setEnrolling] = useState(false);

  const handleEnroll = async () => {
    try {
      setEnrolling(true);
      const response = await hmoAPI.enroll({
        planId: plan._id,
        enrollmentType: 'individual',
        paymentMethod: 'card',
        paymentPlan: 'monthly'
      });

      alert('Enrollment successful! Please complete payment.');
      // Redirect to payment or next step
    } catch (error) {
      alert(error.response?.data?.message || 'Enrollment failed');
    } finally {
      setEnrolling(false);
    }
  };

  return (
    <div className="plan-card">
      <h3>{plan.name}</h3>
      <p>{plan.description}</p>
      <div className="price">
        ${plan.pricing.monthlyPremium.individual}/month
      </div>
      <button
        onClick={handleEnroll}
        disabled={enrolling}
      >
        {enrolling ? 'Enrolling...' : 'Enroll Now'}
      </button>
    </div>
  );
}
```

---

## 🔒 Security Best Practices

1. **Always use HTTPS** in production
2. **Store tokens securely** (HttpOnly cookies preferred)
3. **Implement rate limiting** on enrollment endpoints
4. **Validate all user input** before processing
5. **Log all enrollment actions** for audit trail
6. **Encrypt sensitive data** (payment information, SSN, etc.)
7. **Implement proper CORS** configuration
8. **Use environment variables** for API endpoints and keys

---

## 📞 Support

For technical support or questions about HMO Plans API integration:

- Email: api-support@anolahealth.com
- Documentation: https://docs.anolahealth.com
- Status Page: https://status.anolahealth.com

---

**Status:** Ready for Integration
**Version:** 1.0.0
**Last Updated:** January 2025
