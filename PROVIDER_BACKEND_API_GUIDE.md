# Provider Backend API Implementation Guide

## Overview

This guide provides comprehensive documentation for implementing the Provider (Healthcare Provider) backend API for the Àñola Health platform. It covers all necessary endpoints, database schemas, authentication patterns, and implementation examples.

## Table of Contents

1. [Authentication & Authorization](#authentication--authorization)
2. [Provider Profile Management](#provider-profile-management)
3. [Provider Onboarding](#provider-onboarding)
4. [Appointment Management](#appointment-management)
5. [Patient Management](#patient-management)
6. [Schedule Management](#schedule-management)
7. [Earnings & Payments](#earnings--payments)
8. [Services Management](#services-management)
9. [Medical Records](#medical-records)
10. [Notifications](#notifications)
11. [Analytics & Reports](#analytics--reports)
12. [Database Schemas](#database-schemas)
13. [Implementation Examples](#implementation-examples)
14. [Security & Best Practices](#security--best-practices)
15. [Testing Strategies](#testing-strategies)

---

## Authentication & Authorization

### 1. Provider Registration/Onboarding

**Endpoint:** `POST /api/providers/onboarding/init`

**Description:** Initialize provider onboarding session

**Request:**
```json
{
  "referralCode": "PROV-123456"
}
```

**Response:**
```json
{
  "success": true,
  "sessionToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "sessionId": "sess_abc123def456",
  "expiresAt": "2025-10-19T18:30:00.000Z"
}
```

---

### 2. Submit Basic Information (Step 1)

**Endpoint:** `POST /api/providers/onboarding/step1`

**Headers:**
```
Authorization: Bearer {sessionToken}
```

**Request:**
```json
{
  "providerType": "doctor",
  "firstName": "Sarah",
  "lastName": "Johnson",
  "email": "dr.sarah@hospital.com",
  "phone": "+12345678900",
  "dateOfBirth": "1985-06-15",
  "gender": "female",
  "address": {
    "street": "123 Medical Center Drive",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "USA"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Basic information saved",
  "temporaryUserId": "temp_provider_abc123"
}
```

---

### 3. Submit Professional Information (Step 2)

**Endpoint:** `POST /api/providers/onboarding/step2`

**Headers:**
```
Authorization: Bearer {sessionToken}
```

**Request:**
```json
{
  "specialization": "Cardiology",
  "subSpecialties": ["Interventional Cardiology", "Echocardiography"],
  "licenseNumber": "MD123456",
  "licenseState": "NY",
  "licenseExpiry": "2026-12-31",
  "yearsOfExperience": 15,
  "education": [
    {
      "degree": "MD",
      "institution": "Harvard Medical School",
      "year": 2008
    },
    {
      "degree": "Bachelor of Science",
      "institution": "Stanford University",
      "year": 2004
    }
  ],
  "certifications": [
    {
      "name": "Board Certified in Cardiology",
      "issuer": "American Board of Internal Medicine",
      "issueDate": "2011-06-01",
      "expiryDate": "2026-06-01"
    }
  ],
  "npiNumber": "1234567890",
  "deaNumber": "AB1234567"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Professional information saved"
}
```

---

### 4. Submit Practice Information (Step 3)

**Endpoint:** `POST /api/providers/onboarding/step3`

**Headers:**
```
Authorization: Bearer {sessionToken}
```

**Request:**
```json
{
  "practiceType": "hospital",
  "practiceName": "New York Medical Center",
  "practiceAddress": {
    "street": "789 Healthcare Ave",
    "city": "New York",
    "state": "NY",
    "zipCode": "10002",
    "country": "USA"
  },
  "practicePhone": "+12345555555",
  "practiceEmail": "info@nymedcenter.com",
  "acceptsInsurance": true,
  "insuranceProviders": [
    "Blue Cross Blue Shield",
    "Aetna",
    "Cigna",
    "UnitedHealthcare"
  ],
  "languages": ["English", "Spanish"],
  "consultationModes": ["in-person", "video", "phone"],
  "servicesOffered": [
    {
      "serviceName": "Initial Consultation",
      "duration": 30,
      "price": 150.00,
      "description": "Comprehensive cardiac evaluation"
    },
    {
      "serviceName": "Follow-up Visit",
      "duration": 15,
      "price": 75.00,
      "description": "Post-treatment follow-up"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Practice information saved"
}
```

---

### 5. Complete Provider Registration

**Endpoint:** `POST /api/providers/onboarding/complete`

**Headers:**
```
Authorization: Bearer {sessionToken}
```

**Request:**
```json
{
  "username": "dr.sarahjohnson",
  "password": "SecurePassword@2025",
  "confirmPassword": "SecurePassword@2025",
  "termsAccepted": true,
  "privacyPolicyAccepted": true,
  "hipaaComplianceAccepted": true,
  "profilePhoto": "base64_encoded_image_data"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Provider registration completed successfully",
  "provider": {
    "providerId": "68f521af98baaed3c97b8710",
    "providerCode": "PROV-5FB2DE7A",
    "email": "dr.sarah@hospital.com",
    "status": "pending_verification",
    "createdAt": "2025-10-19T17:36:47.536Z"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "redirectUrl": "/dashboard/provider"
}
```

---

### 6. Provider Login

**Endpoint:** `POST /api/auth/login`

**Request:**
```json
{
  "email": "dr.sarah@hospital.com",
  "password": "SecurePassword@2025"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "68f521af98baaed3c97b8710",
      "email": "dr.sarah@hospital.com",
      "userType": "provider",
      "providerCode": "PROV-5FB2DE7A",
      "status": "active",
      "profile": {
        "firstName": "Sarah",
        "lastName": "Johnson",
        "avatar": "https://cdn.anola.com/avatars/provider_123.jpg",
        "specialization": "Cardiology"
      },
      "professionalInfo": {
        "licenseNumber": "MD123456",
        "npiNumber": "1234567890",
        "yearsOfExperience": 15
      },
      "verificationStatus": {
        "identity": { "verified": true },
        "license": { "verified": true },
        "email": { "verified": true },
        "phone": { "verified": true }
      },
      "rating": 4.8,
      "totalPatients": 342,
      "totalAppointments": 1256
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

## Provider Profile Management

### 7. Get Provider Profile

**Endpoint:** `GET /api/providers/:providerId/profile`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "success": true,
  "provider": {
    "_id": "68f521af98baaed3c97b8710",
    "providerCode": "PROV-5FB2DE7A",
    "providerType": "doctor",
    "email": "dr.sarah@hospital.com",
    "phone": "+12345678900",
    "profile": {
      "firstName": "Sarah",
      "lastName": "Johnson",
      "avatar": "https://cdn.anola.com/avatars/provider_123.jpg",
      "dateOfBirth": "1985-06-15",
      "gender": "female",
      "bio": "Board-certified cardiologist with 15 years of experience...",
      "address": {
        "street": "123 Medical Center Drive",
        "city": "New York",
        "state": "NY",
        "zipCode": "10001",
        "country": "USA"
      }
    },
    "professionalInfo": {
      "specialization": "Cardiology",
      "subSpecialties": ["Interventional Cardiology", "Echocardiography"],
      "licenseNumber": "MD123456",
      "licenseState": "NY",
      "licenseExpiry": "2026-12-31",
      "yearsOfExperience": 15,
      "npiNumber": "1234567890",
      "deaNumber": "AB1234567",
      "education": [...],
      "certifications": [...]
    },
    "practiceInfo": {
      "practiceType": "hospital",
      "practiceName": "New York Medical Center",
      "practiceAddress": {...},
      "acceptsInsurance": true,
      "insuranceProviders": [...],
      "languages": ["English", "Spanish"],
      "consultationModes": ["in-person", "video", "phone"]
    },
    "statistics": {
      "rating": 4.8,
      "totalReviews": 156,
      "totalPatients": 342,
      "totalAppointments": 1256,
      "completedAppointments": 1198,
      "cancelledAppointments": 58
    },
    "availability": {
      "isAcceptingNewPatients": true,
      "averageWaitTime": "2-3 days"
    },
    "verificationStatus": {
      "identity": { "verified": true, "verifiedAt": "2025-01-15T10:00:00Z" },
      "license": { "verified": true, "verifiedAt": "2025-01-15T10:30:00Z" },
      "email": { "verified": true, "verifiedAt": "2025-01-10T09:00:00Z" },
      "phone": { "verified": true, "verifiedAt": "2025-01-10T09:15:00Z" }
    },
    "status": "active",
    "createdAt": "2025-01-10T08:30:00Z",
    "updatedAt": "2025-10-19T14:20:00Z"
  }
}
```

---

### 8. Update Provider Profile

**Endpoint:** `PUT /api/providers/:providerId/profile`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request:**
```json
{
  "profile": {
    "bio": "Updated bio text...",
    "phone": "+12345678901"
  },
  "practiceInfo": {
    "isAcceptingNewPatients": false,
    "languages": ["English", "Spanish", "French"]
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "provider": {
    // Updated provider object
  }
}
```

---

### 9. Upload Provider Avatar

**Endpoint:** `POST /api/providers/:providerId/avatar`

**Headers:**
```
Authorization: Bearer {accessToken}
Content-Type: multipart/form-data
```

**Request:**
```
Form Data:
  avatar: (binary file)
```

**Response:**
```json
{
  "success": true,
  "message": "Avatar uploaded successfully",
  "avatarUrl": "https://cdn.anola.com/avatars/provider_123.jpg"
}
```

---

## Appointment Management

### 10. Get Provider Appointments

**Endpoint:** `GET /api/providers/:providerId/appointments`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Query Parameters:**
```
?status=scheduled&date=2025-10-20&page=1&limit=20
```

**Response:**
```json
{
  "success": true,
  "appointments": [
    {
      "_id": "apt_123456",
      "appointmentId": "APT-20251020-001",
      "patient": {
        "id": "patient_789",
        "name": "John Smith",
        "avatar": "https://cdn.anola.com/avatars/patient_789.jpg",
        "age": 45,
        "gender": "male",
        "healthCardId": "AH-123ABC"
      },
      "service": {
        "id": "service_001",
        "name": "Initial Consultation",
        "duration": 30,
        "price": 150.00
      },
      "scheduledDate": "2025-10-20",
      "scheduledTime": {
        "startTime": "10:00",
        "endTime": "10:30"
      },
      "status": "scheduled",
      "mode": "in-person",
      "chiefComplaint": "Chest pain and shortness of breath",
      "notes": "Patient has history of hypertension",
      "paymentStatus": "paid",
      "paymentMethod": "insurance",
      "insurance": {
        "provider": "Blue Cross",
        "policyNumber": "BC123456"
      },
      "createdAt": "2025-10-15T14:30:00Z",
      "updatedAt": "2025-10-18T09:00:00Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalAppointments": 87,
    "limit": 20
  }
}
```

---

### 11. Get Single Appointment Details

**Endpoint:** `GET /api/providers/:providerId/appointments/:appointmentId`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "success": true,
  "appointment": {
    "_id": "apt_123456",
    "appointmentId": "APT-20251020-001",
    "patient": {
      "id": "patient_789",
      "name": "John Smith",
      "email": "john.smith@email.com",
      "phone": "+12345678900",
      "avatar": "https://cdn.anola.com/avatars/patient_789.jpg",
      "age": 45,
      "gender": "male",
      "dateOfBirth": "1979-05-12",
      "healthCardId": "AH-123ABC",
      "medicalHistory": {
        "conditions": ["Hypertension", "Type 2 Diabetes"],
        "allergies": ["Penicillin"],
        "currentMedications": ["Lisinopril 10mg", "Metformin 500mg"]
      }
    },
    "service": {
      "id": "service_001",
      "name": "Initial Consultation",
      "duration": 30,
      "price": 150.00,
      "description": "Comprehensive cardiac evaluation"
    },
    "scheduledDate": "2025-10-20",
    "scheduledTime": {
      "startTime": "10:00",
      "endTime": "10:30"
    },
    "status": "scheduled",
    "mode": "in-person",
    "chiefComplaint": "Chest pain and shortness of breath",
    "notes": "Patient reports intermittent chest pain for 2 weeks",
    "vitalSigns": null,
    "diagnosis": null,
    "prescription": null,
    "followUpRequired": false,
    "paymentStatus": "paid",
    "paymentAmount": 150.00,
    "paymentMethod": "insurance",
    "insurance": {
      "provider": "Blue Cross Blue Shield",
      "policyNumber": "BC123456",
      "groupNumber": "GRP789"
    },
    "cancellationReason": null,
    "createdAt": "2025-10-15T14:30:00Z",
    "updatedAt": "2025-10-18T09:00:00Z"
  }
}
```

---

### 12. Update Appointment Status

**Endpoint:** `PATCH /api/providers/:providerId/appointments/:appointmentId/status`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request:**
```json
{
  "status": "completed",
  "notes": "Patient examined. Diagnosis: Stable angina. Prescribed medication and scheduled follow-up."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Appointment status updated",
  "appointment": {
    "_id": "apt_123456",
    "status": "completed",
    "completedAt": "2025-10-20T10:30:00Z"
  }
}
```

---

### 13. Cancel Appointment

**Endpoint:** `POST /api/providers/:providerId/appointments/:appointmentId/cancel`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request:**
```json
{
  "reason": "Emergency surgery scheduled",
  "notifyPatient": true,
  "refundAmount": 150.00
}
```

**Response:**
```json
{
  "success": true,
  "message": "Appointment cancelled successfully",
  "refundStatus": "processed",
  "notificationSent": true
}
```

---

### 14. Add Clinical Notes to Appointment

**Endpoint:** `POST /api/providers/:providerId/appointments/:appointmentId/notes`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request:**
```json
{
  "vitalSigns": {
    "bloodPressure": "140/90",
    "heartRate": 82,
    "temperature": 98.6,
    "weight": 185,
    "height": 70
  },
  "chiefComplaint": "Chest pain and shortness of breath",
  "historyOfPresentIllness": "Patient reports...",
  "physicalExamination": "General: Alert and oriented...",
  "diagnosis": "Stable angina pectoris",
  "treatmentPlan": "Started on beta-blocker, lifestyle modifications recommended",
  "prescriptions": [
    {
      "medication": "Metoprolol",
      "dosage": "25mg",
      "frequency": "twice daily",
      "duration": "30 days",
      "instructions": "Take with food"
    }
  ],
  "labOrders": [
    {
      "testName": "Lipid Panel",
      "priority": "routine",
      "instructions": "Fasting required"
    }
  ],
  "followUpRequired": true,
  "followUpDate": "2025-11-20",
  "followUpNotes": "Review lab results and medication efficacy"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Clinical notes added successfully",
  "appointment": {
    "_id": "apt_123456",
    "clinicalNotes": {
      "vitalSigns": {...},
      "diagnosis": "Stable angina pectoris",
      "prescriptions": [...],
      "addedBy": "dr.sarahjohnson",
      "addedAt": "2025-10-20T10:25:00Z"
    }
  }
}
```

---

## Patient Management

### 15. Get Provider's Patients

**Endpoint:** `GET /api/providers/:providerId/patients`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Query Parameters:**
```
?search=john&status=active&page=1&limit=20
```

**Response:**
```json
{
  "success": true,
  "patients": [
    {
      "_id": "patient_789",
      "healthCardId": "AH-123ABC",
      "name": "John Smith",
      "email": "john.smith@email.com",
      "phone": "+12345678900",
      "avatar": "https://cdn.anola.com/avatars/patient_789.jpg",
      "age": 45,
      "gender": "male",
      "dateOfBirth": "1979-05-12",
      "lastVisit": "2025-10-20",
      "nextAppointment": "2025-11-20",
      "totalAppointments": 8,
      "status": "active",
      "conditions": ["Hypertension", "Type 2 Diabetes"],
      "allergies": ["Penicillin"],
      "addedAt": "2024-05-15T10:00:00Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 18,
    "totalPatients": 342,
    "limit": 20
  }
}
```

---

### 16. Get Patient Details

**Endpoint:** `GET /api/providers/:providerId/patients/:patientId`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "success": true,
  "patient": {
    "_id": "patient_789",
    "healthCardId": "AH-123ABC",
    "profile": {
      "firstName": "John",
      "lastName": "Smith",
      "email": "john.smith@email.com",
      "phone": "+12345678900",
      "avatar": "https://cdn.anola.com/avatars/patient_789.jpg",
      "dateOfBirth": "1979-05-12",
      "age": 45,
      "gender": "male",
      "address": {
        "street": "456 Patient St",
        "city": "New York",
        "state": "NY",
        "zipCode": "10003",
        "country": "USA"
      }
    },
    "medicalHistory": {
      "bloodType": "O+",
      "conditions": [
        {
          "condition": "Hypertension",
          "diagnosedDate": "2018-03-15",
          "status": "active"
        },
        {
          "condition": "Type 2 Diabetes",
          "diagnosedDate": "2020-07-22",
          "status": "active"
        }
      ],
      "allergies": [
        {
          "allergen": "Penicillin",
          "severity": "moderate",
          "reaction": "Rash"
        }
      ],
      "currentMedications": [
        {
          "medication": "Lisinopril",
          "dosage": "10mg",
          "frequency": "once daily",
          "startDate": "2018-03-15"
        },
        {
          "medication": "Metformin",
          "dosage": "500mg",
          "frequency": "twice daily",
          "startDate": "2020-07-22"
        }
      ],
      "surgeries": [
        {
          "procedure": "Appendectomy",
          "date": "2010-05-20",
          "hospital": "City General Hospital"
        }
      ],
      "familyHistory": {
        "heartDisease": true,
        "diabetes": true,
        "cancer": false
      }
    },
    "appointments": {
      "total": 8,
      "completed": 7,
      "upcoming": 1,
      "lastVisit": "2025-10-20",
      "nextAppointment": "2025-11-20"
    },
    "insurance": {
      "provider": "Blue Cross Blue Shield",
      "policyNumber": "BC123456",
      "groupNumber": "GRP789",
      "coverageType": "PPO"
    },
    "emergencyContact": {
      "name": "Jane Smith",
      "relationship": "Spouse",
      "phone": "+12345678901"
    },
    "status": "active",
    "addedAt": "2024-05-15T10:00:00Z"
  }
}
```

---

### 17. Get Patient Medical Records

**Endpoint:** `GET /api/providers/:providerId/patients/:patientId/records`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Query Parameters:**
```
?type=appointment&startDate=2025-01-01&endDate=2025-10-20
```

**Response:**
```json
{
  "success": true,
  "records": [
    {
      "_id": "record_001",
      "type": "appointment",
      "date": "2025-10-20",
      "appointmentId": "APT-20251020-001",
      "provider": {
        "name": "Dr. Sarah Johnson",
        "specialization": "Cardiology"
      },
      "diagnosis": "Stable angina pectoris",
      "treatment": "Started on beta-blocker",
      "prescriptions": [...],
      "labResults": [],
      "notes": "Patient responded well to initial treatment"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 3,
    "totalRecords": 52
  }
}
```

---

## Schedule Management

### 18. Get Provider Schedule

**Endpoint:** `GET /api/providers/:providerId/schedule`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Query Parameters:**
```
?startDate=2025-10-20&endDate=2025-10-26
```

**Response:**
```json
{
  "success": true,
  "schedule": {
    "2025-10-20": [
      {
        "slotId": "slot_001",
        "startTime": "09:00",
        "endTime": "09:30",
        "status": "available",
        "appointmentId": null
      },
      {
        "slotId": "slot_002",
        "startTime": "09:30",
        "endTime": "10:00",
        "status": "blocked",
        "reason": "Administrative work"
      },
      {
        "slotId": "slot_003",
        "startTime": "10:00",
        "endTime": "10:30",
        "status": "booked",
        "appointmentId": "APT-20251020-001",
        "patient": {
          "name": "John Smith",
          "healthCardId": "AH-123ABC"
        }
      }
    ],
    "2025-10-21": [...]
  },
  "summary": {
    "totalSlots": 120,
    "availableSlots": 45,
    "bookedSlots": 60,
    "blockedSlots": 15
  }
}
```

---

### 19. Set Available Time Slots

**Endpoint:** `POST /api/providers/:providerId/schedule/availability`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request:**
```json
{
  "dayOfWeek": "monday",
  "timeSlots": [
    {
      "startTime": "09:00",
      "endTime": "12:00",
      "slotDuration": 30
    },
    {
      "startTime": "14:00",
      "endTime": "17:00",
      "slotDuration": 30
    }
  ],
  "effectiveFrom": "2025-10-20",
  "effectiveUntil": "2025-12-31"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Availability set successfully",
  "slotsCreated": 24
}
```

---

### 20. Block Time Slots

**Endpoint:** `POST /api/providers/:providerId/schedule/block`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request:**
```json
{
  "date": "2025-10-25",
  "startTime": "14:00",
  "endTime": "17:00",
  "reason": "Conference attendance",
  "notifyPatients": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Time slots blocked successfully",
  "blockedSlots": 6,
  "affectedAppointments": 2,
  "patientsNotified": true
}
```

---

### 21. Update Working Hours

**Endpoint:** `PUT /api/providers/:providerId/schedule/working-hours`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request:**
```json
{
  "workingHours": {
    "monday": { "start": "09:00", "end": "17:00", "isWorking": true },
    "tuesday": { "start": "09:00", "end": "17:00", "isWorking": true },
    "wednesday": { "start": "09:00", "end": "17:00", "isWorking": true },
    "thursday": { "start": "09:00", "end": "17:00", "isWorking": true },
    "friday": { "start": "09:00", "end": "15:00", "isWorking": true },
    "saturday": { "start": "10:00", "end": "14:00", "isWorking": true },
    "sunday": { "isWorking": false }
  },
  "slotDuration": 30,
  "breakTime": {
    "start": "12:00",
    "end": "13:00"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Working hours updated successfully",
  "workingHours": {...}
}
```

---

## Earnings & Payments

### 22. Get Earnings Summary

**Endpoint:** `GET /api/providers/:providerId/earnings`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Query Parameters:**
```
?period=monthly&month=10&year=2025
```

**Response:**
```json
{
  "success": true,
  "earnings": {
    "period": {
      "month": 10,
      "year": 2025,
      "startDate": "2025-10-01",
      "endDate": "2025-10-31"
    },
    "summary": {
      "totalEarnings": 42500.00,
      "totalAppointments": 285,
      "averagePerAppointment": 149.12,
      "platformFee": 4250.00,
      "netEarnings": 38250.00,
      "pendingPayments": 5600.00,
      "paidOut": 32650.00
    },
    "breakdown": {
      "consultations": {
        "count": 180,
        "amount": 27000.00
      },
      "followUps": {
        "count": 85,
        "amount": 6375.00
      },
      "procedures": {
        "count": 20,
        "amount": 9125.00
      }
    },
    "paymentMethods": {
      "insurance": 32500.00,
      "cash": 5000.00,
      "sponsored": 5000.00
    },
    "topServices": [
      {
        "serviceName": "Initial Consultation",
        "count": 120,
        "earnings": 18000.00
      },
      {
        "serviceName": "ECG",
        "count": 45,
        "earnings": 4500.00
      }
    ]
  }
}
```

---

### 23. Get Detailed Transaction History

**Endpoint:** `GET /api/providers/:providerId/earnings/transactions`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Query Parameters:**
```
?startDate=2025-10-01&endDate=2025-10-31&status=completed&page=1&limit=50
```

**Response:**
```json
{
  "success": true,
  "transactions": [
    {
      "_id": "txn_001",
      "transactionId": "TXN-20251020-001",
      "date": "2025-10-20",
      "appointmentId": "APT-20251020-001",
      "patient": {
        "name": "John Smith",
        "healthCardId": "AH-123ABC"
      },
      "service": "Initial Consultation",
      "amount": 150.00,
      "platformFee": 15.00,
      "netAmount": 135.00,
      "paymentMethod": "insurance",
      "paymentStatus": "completed",
      "payoutStatus": "pending",
      "payoutDate": null,
      "createdAt": "2025-10-20T10:30:00Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 6,
    "totalTransactions": 285
  },
  "summary": {
    "totalAmount": 42500.00,
    "totalFees": 4250.00,
    "netAmount": 38250.00
  }
}
```

---

### 24. Request Payout

**Endpoint:** `POST /api/providers/:providerId/earnings/payout`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request:**
```json
{
  "amount": 5000.00,
  "bankAccount": {
    "accountNumber": "****1234",
    "routingNumber": "021000021",
    "accountType": "checking"
  },
  "notes": "Monthly payout request"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payout request submitted successfully",
  "payout": {
    "payoutId": "PAYOUT-001",
    "amount": 5000.00,
    "status": "pending",
    "estimatedArrival": "2025-10-25",
    "requestedAt": "2025-10-20T15:00:00Z"
  }
}
```

---

### 25. Get Payout History

**Endpoint:** `GET /api/providers/:providerId/earnings/payouts`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "success": true,
  "payouts": [
    {
      "_id": "payout_001",
      "payoutId": "PAYOUT-001",
      "amount": 5000.00,
      "status": "completed",
      "bankAccount": {
        "accountNumber": "****1234",
        "accountType": "checking"
      },
      "requestedAt": "2025-10-20T15:00:00Z",
      "processedAt": "2025-10-22T09:00:00Z",
      "completedAt": "2025-10-24T10:30:00Z"
    }
  ],
  "totalPayouts": 45,
  "totalAmount": 125000.00
}
```

---

## Services Management

### 26. Get Provider Services

**Endpoint:** `GET /api/providers/:providerId/services`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "success": true,
  "services": [
    {
      "_id": "service_001",
      "serviceId": "SRV-001",
      "name": "Initial Consultation",
      "category": "Consultation",
      "description": "Comprehensive cardiac evaluation",
      "duration": 30,
      "price": 150.00,
      "insuranceCovered": true,
      "availableModes": ["in-person", "video"],
      "isActive": true,
      "totalBookings": 342,
      "createdAt": "2025-01-10T08:00:00Z"
    },
    {
      "_id": "service_002",
      "serviceId": "SRV-002",
      "name": "Follow-up Visit",
      "category": "Consultation",
      "description": "Post-treatment follow-up consultation",
      "duration": 15,
      "price": 75.00,
      "insuranceCovered": true,
      "availableModes": ["in-person", "video", "phone"],
      "isActive": true,
      "totalBookings": 567,
      "createdAt": "2025-01-10T08:00:00Z"
    },
    {
      "_id": "service_003",
      "serviceId": "SRV-003",
      "name": "ECG",
      "category": "Diagnostic",
      "description": "Electrocardiogram test",
      "duration": 20,
      "price": 100.00,
      "insuranceCovered": true,
      "availableModes": ["in-person"],
      "isActive": true,
      "totalBookings": 189,
      "createdAt": "2025-01-10T08:00:00Z"
    }
  ],
  "totalServices": 8
}
```

---

### 27. Add New Service

**Endpoint:** `POST /api/providers/:providerId/services`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request:**
```json
{
  "name": "Stress Test",
  "category": "Diagnostic",
  "description": "Cardiac stress test with monitoring",
  "duration": 45,
  "price": 250.00,
  "insuranceCovered": true,
  "availableModes": ["in-person"],
  "preparationInstructions": "Fasting for 4 hours before test",
  "isActive": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Service added successfully",
  "service": {
    "_id": "service_009",
    "serviceId": "SRV-009",
    "name": "Stress Test",
    "category": "Diagnostic",
    "duration": 45,
    "price": 250.00,
    "isActive": true,
    "createdAt": "2025-10-20T14:00:00Z"
  }
}
```

---

### 28. Update Service

**Endpoint:** `PUT /api/providers/:providerId/services/:serviceId`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request:**
```json
{
  "price": 275.00,
  "duration": 50,
  "description": "Updated description..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Service updated successfully",
  "service": {
    "_id": "service_009",
    "price": 275.00,
    "duration": 50,
    "updatedAt": "2025-10-20T15:30:00Z"
  }
}
```

---

### 29. Delete/Deactivate Service

**Endpoint:** `DELETE /api/providers/:providerId/services/:serviceId`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "success": true,
  "message": "Service deactivated successfully",
  "service": {
    "_id": "service_009",
    "isActive": false,
    "deactivatedAt": "2025-10-20T16:00:00Z"
  }
}
```

---

## Notifications

### 30. Get Provider Notifications

**Endpoint:** `GET /api/providers/:providerId/notifications`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Query Parameters:**
```
?unreadOnly=true&type=appointment&limit=20
```

**Response:**
```json
{
  "success": true,
  "notifications": [
    {
      "_id": "notif_001",
      "type": "appointment",
      "title": "New Appointment Booking",
      "message": "John Smith has booked an appointment for Oct 25, 2025 at 10:00 AM",
      "data": {
        "appointmentId": "APT-20251025-001",
        "patientId": "patient_789"
      },
      "isRead": false,
      "createdAt": "2025-10-20T14:30:00Z"
    },
    {
      "_id": "notif_002",
      "type": "payment",
      "title": "Payment Received",
      "message": "Payment of $150.00 received for appointment APT-20251020-001",
      "data": {
        "amount": 150.00,
        "appointmentId": "APT-20251020-001"
      },
      "isRead": false,
      "createdAt": "2025-10-20T10:35:00Z"
    }
  ],
  "unreadCount": 5,
  "totalNotifications": 142
}
```

---

### 31. Mark Notification as Read

**Endpoint:** `PATCH /api/providers/:providerId/notifications/:notificationId/read`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "success": true,
  "message": "Notification marked as read"
}
```

---

## Analytics & Reports

### 32. Get Provider Analytics

**Endpoint:** `GET /api/providers/:providerId/analytics`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Query Parameters:**
```
?period=monthly&month=10&year=2025
```

**Response:**
```json
{
  "success": true,
  "analytics": {
    "period": {
      "month": 10,
      "year": 2025,
      "startDate": "2025-10-01",
      "endDate": "2025-10-31"
    },
    "appointments": {
      "total": 285,
      "completed": 268,
      "cancelled": 12,
      "noShow": 5,
      "completionRate": 94.0,
      "cancellationRate": 4.2,
      "averagePerDay": 9.5
    },
    "patients": {
      "total": 342,
      "newPatients": 28,
      "returningPatients": 257,
      "retentionRate": 91.8
    },
    "earnings": {
      "total": 42500.00,
      "average": 149.12,
      "highest": 350.00,
      "lowest": 75.00
    },
    "rating": {
      "average": 4.8,
      "total": 156,
      "distribution": {
        "5": 120,
        "4": 28,
        "3": 6,
        "2": 2,
        "1": 0
      }
    },
    "topServices": [
      {
        "name": "Initial Consultation",
        "count": 120,
        "earnings": 18000.00
      },
      {
        "name": "Follow-up Visit",
        "count": 85,
        "earnings": 6375.00
      }
    ],
    "busyHours": [
      { "hour": "10:00", "appointments": 45 },
      { "hour": "14:00", "appointments": 42 },
      { "hour": "11:00", "appointments": 38 }
    ],
    "trends": {
      "appointments": {
        "current": 285,
        "previous": 268,
        "change": 6.3,
        "direction": "up"
      },
      "earnings": {
        "current": 42500.00,
        "previous": 39800.00,
        "change": 6.8,
        "direction": "up"
      }
    }
  }
}
```

---

### 33. Get Performance Metrics

**Endpoint:** `GET /api/providers/:providerId/analytics/performance`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "success": true,
  "performance": {
    "responseTime": {
      "average": 4.2,
      "unit": "hours",
      "benchmark": 8,
      "status": "excellent"
    },
    "appointmentUtilization": {
      "bookedSlots": 268,
      "availableSlots": 320,
      "utilizationRate": 83.8,
      "status": "good"
    },
    "patientSatisfaction": {
      "rating": 4.8,
      "nps": 85,
      "recommendationRate": 92.5
    },
    "clinicalMetrics": {
      "averageConsultationTime": 32,
      "followUpRate": 78.5,
      "prescriptionAccuracy": 99.2
    }
  }
}
```

---

## Database Schemas

### Provider Schema (MongoDB)

```javascript
const providerSchema = new mongoose.Schema({
  // Authentication
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true,
    select: false
  },
  userType: {
    type: String,
    default: 'provider',
    immutable: true
  },

  // Provider Information
  providerCode: {
    type: String,
    unique: true,
    required: true
  },
  providerType: {
    type: String,
    enum: ['doctor', 'nurse', 'therapist', 'specialist', 'other'],
    required: true
  },

  // Personal Profile
  profile: {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    avatar: String,
    dateOfBirth: Date,
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer_not_to_say']
    },
    bio: { type: String, maxlength: 1000 },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    }
  },

  // Professional Information
  professionalInfo: {
    specialization: { type: String, required: true },
    subSpecialties: [String],
    licenseNumber: { type: String, required: true },
    licenseState: String,
    licenseExpiry: Date,
    yearsOfExperience: Number,
    npiNumber: String,
    deaNumber: String,
    education: [{
      degree: String,
      institution: String,
      year: Number,
      field: String
    }],
    certifications: [{
      name: String,
      issuer: String,
      issueDate: Date,
      expiryDate: Date,
      certificateNumber: String
    }],
    publications: [{
      title: String,
      journal: String,
      year: Number,
      url: String
    }]
  },

  // Practice Information
  practiceInfo: {
    practiceType: {
      type: String,
      enum: ['hospital', 'clinic', 'private', 'telehealth', 'other']
    },
    practiceName: String,
    practiceAddress: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    },
    practicePhone: String,
    practiceEmail: String,
    acceptsInsurance: { type: Boolean, default: true },
    insuranceProviders: [String],
    languages: [String],
    consultationModes: {
      type: [String],
      enum: ['in-person', 'video', 'phone', 'chat']
    }
  },

  // Services
  services: [{
    serviceId: String,
    name: String,
    category: String,
    description: String,
    duration: Number, // minutes
    price: Number,
    insuranceCovered: Boolean,
    availableModes: [String],
    preparationInstructions: String,
    isActive: { type: Boolean, default: true },
    totalBookings: { type: Number, default: 0 },
    createdAt: Date
  }],

  // Availability
  availability: {
    isAcceptingNewPatients: { type: Boolean, default: true },
    averageWaitTime: String,
    workingHours: {
      monday: { start: String, end: String, isWorking: Boolean },
      tuesday: { start: String, end: String, isWorking: Boolean },
      wednesday: { start: String, end: String, isWorking: Boolean },
      thursday: { start: String, end: String, isWorking: Boolean },
      friday: { start: String, end: String, isWorking: Boolean },
      saturday: { start: String, end: String, isWorking: Boolean },
      sunday: { start: String, end: String, isWorking: Boolean }
    },
    slotDuration: { type: Number, default: 30 },
    breakTime: {
      start: String,
      end: String
    }
  },

  // Statistics
  statistics: {
    rating: { type: Number, default: 0, min: 0, max: 5 },
    totalReviews: { type: Number, default: 0 },
    totalPatients: { type: Number, default: 0 },
    totalAppointments: { type: Number, default: 0 },
    completedAppointments: { type: Number, default: 0 },
    cancelledAppointments: { type: Number, default: 0 }
  },

  // Financial
  earnings: {
    totalEarnings: { type: Number, default: 0 },
    pendingPayments: { type: Number, default: 0 },
    paidOut: { type: Number, default: 0 },
    platformFeePercentage: { type: Number, default: 10 }
  },

  // Bank Account (for payouts)
  bankAccount: {
    accountNumber: { type: String, select: false },
    routingNumber: { type: String, select: false },
    accountType: { type: String, enum: ['checking', 'savings'] },
    bankName: String,
    accountHolderName: String
  },

  // Verification Status
  verificationStatus: {
    identity: {
      verified: { type: Boolean, default: false },
      verifiedAt: Date,
      documents: [String]
    },
    license: {
      verified: { type: Boolean, default: false },
      verifiedAt: Date,
      documents: [String]
    },
    email: {
      verified: { type: Boolean, default: false },
      verifiedAt: Date,
      verificationToken: String
    },
    phone: {
      verified: { type: Boolean, default: false },
      verifiedAt: Date,
      verificationCode: String
    }
  },

  // Preferences
  preferences: {
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      sms: { type: Boolean, default: true },
      appointments: { type: Boolean, default: true },
      payments: { type: Boolean, default: true },
      reviews: { type: Boolean, default: true }
    },
    language: { type: String, default: 'en' },
    timezone: { type: String, default: 'UTC' },
    currency: { type: String, default: 'USD' }
  },

  // Security
  twoFactorEnabled: { type: Boolean, default: false },
  twoFactorSecret: { type: String, select: false },
  loginAttempts: { type: Number, default: 0 },
  lockUntil: Date,
  passwordChangedAt: Date,
  passwordResetToken: { type: String, select: false },
  passwordResetExpires: Date,

  // Status
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'pending_verification'],
    default: 'pending_verification'
  },

  // Metadata
  patients: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Patient' }],
  appointments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' }],
  refreshTokens: [String],
  loginHistory: [{
    timestamp: Date,
    ipAddress: String,
    userAgent: String,
    location: String
  }],

  // Terms and Compliance
  termsAcceptedAt: Date,
  privacyPolicyAcceptedAt: Date,
  hipaaComplianceAcceptedAt: Date

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtuals
providerSchema.virtual('fullName').get(function() {
  return `${this.profile.firstName} ${this.profile.lastName}`;
});

providerSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Indexes
providerSchema.index({ email: 1 });
providerSchema.index({ providerCode: 1 });
providerSchema.index({ 'professionalInfo.specialization': 1 });
providerSchema.index({ status: 1 });
providerSchema.index({ createdAt: -1 });
```

---

### Appointment Schema

```javascript
const appointmentSchema = new mongoose.Schema({
  appointmentId: {
    type: String,
    unique: true,
    required: true
  },

  // Participants
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Provider',
    required: true
  },

  // Service
  service: {
    serviceId: String,
    name: String,
    duration: Number,
    price: Number,
    description: String
  },

  // Schedule
  scheduledDate: {
    type: Date,
    required: true
  },
  scheduledTime: {
    startTime: { type: String, required: true },
    endTime: { type: String, required: true }
  },

  // Appointment Details
  status: {
    type: String,
    enum: ['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'],
    default: 'scheduled'
  },
  mode: {
    type: String,
    enum: ['in-person', 'video', 'phone', 'chat'],
    required: true
  },

  // Medical Information
  chiefComplaint: String,
  notes: String,
  clinicalNotes: {
    vitalSigns: {
      bloodPressure: String,
      heartRate: Number,
      temperature: Number,
      weight: Number,
      height: Number,
      bmi: Number
    },
    historyOfPresentIllness: String,
    physicalExamination: String,
    diagnosis: String,
    treatmentPlan: String,
    prescriptions: [{
      medication: String,
      dosage: String,
      frequency: String,
      duration: String,
      instructions: String
    }],
    labOrders: [{
      testName: String,
      priority: String,
      instructions: String
    }],
    followUpRequired: Boolean,
    followUpDate: Date,
    followUpNotes: String,
    addedBy: String,
    addedAt: Date
  },

  // Payment
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded', 'failed'],
    default: 'pending'
  },
  paymentAmount: Number,
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'insurance', 'sponsored']
  },
  insurance: {
    provider: String,
    policyNumber: String,
    groupNumber: String,
    copay: Number
  },

  // Cancellation
  cancellationReason: String,
  cancelledBy: {
    type: String,
    enum: ['patient', 'provider', 'system']
  },
  cancelledAt: Date,

  // Timestamps
  confirmedAt: Date,
  startedAt: Date,
  completedAt: Date

}, {
  timestamps: true
});

// Indexes
appointmentSchema.index({ patient: 1, scheduledDate: -1 });
appointmentSchema.index({ provider: 1, scheduledDate: -1 });
appointmentSchema.index({ status: 1 });
appointmentSchema.index({ appointmentId: 1 });
```

---

### Schedule Slot Schema

```javascript
const scheduleSlotSchema = new mongoose.Schema({
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Provider',
    required: true
  },

  date: {
    type: Date,
    required: true
  },

  startTime: {
    type: String,
    required: true
  },

  endTime: {
    type: String,
    required: true
  },

  status: {
    type: String,
    enum: ['available', 'booked', 'blocked'],
    default: 'available'
  },

  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  },

  blockReason: String,

  createdAt: Date

}, {
  timestamps: true
});

// Indexes
scheduleSlotSchema.index({ provider: 1, date: 1, startTime: 1 });
scheduleSlotSchema.index({ status: 1 });
```

---

### Transaction Schema

```javascript
const transactionSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    unique: true,
    required: true
  },

  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Provider',
    required: true
  },

  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient'
  },

  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  },

  type: {
    type: String,
    enum: ['earning', 'payout', 'refund', 'fee'],
    required: true
  },

  amount: {
    type: Number,
    required: true
  },

  platformFee: {
    type: Number,
    default: 0
  },

  netAmount: {
    type: Number,
    required: true
  },

  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'insurance', 'sponsored', 'bank_transfer']
  },

  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },

  payoutStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },

  payoutDate: Date,

  description: String,
  notes: String

}, {
  timestamps: true
});

// Indexes
transactionSchema.index({ provider: 1, createdAt: -1 });
transactionSchema.index({ transactionId: 1 });
transactionSchema.index({ status: 1 });
```

---

## Implementation Examples

### Express.js Middleware for Provider Authentication

```javascript
// middleware/auth.js
const jwt = require('jsonwebtoken');
const Provider = require('../models/Provider');

exports.protect = async (req, res, next) => {
  try {
    let token;

    // Get token from header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get provider from token
    req.provider = await Provider.findById(decoded.userId).select('-password');

    if (!req.provider) {
      return res.status(404).json({
        success: false,
        message: 'Provider not found'
      });
    }

    // Check if provider is active
    if (req.provider.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Account is not active'
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }
};

// Restrict to specific user type
exports.restrictToProvider = (req, res, next) => {
  if (req.provider.userType !== 'provider') {
    return res.status(403).json({
      success: false,
      message: 'Only providers can access this route'
    });
  }
  next();
};
```

---

### Controller Example: Get Provider Appointments

```javascript
// controllers/appointmentController.js
const Appointment = require('../models/Appointment');

exports.getProviderAppointments = async (req, res) => {
  try {
    const providerId = req.params.providerId;

    // Check if provider is accessing their own data
    if (req.provider._id.toString() !== providerId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this data'
      });
    }

    // Build query
    const query = { provider: providerId };

    // Filter by status
    if (req.query.status) {
      query.status = req.query.status;
    }

    // Filter by date
    if (req.query.date) {
      const startDate = new Date(req.query.date);
      const endDate = new Date(req.query.date);
      endDate.setDate(endDate.getDate() + 1);

      query.scheduledDate = {
        $gte: startDate,
        $lt: endDate
      };
    }

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Execute query
    const appointments = await Appointment.find(query)
      .populate('patient', 'profile.firstName profile.lastName profile.avatar healthCardId age gender')
      .sort({ scheduledDate: 1, 'scheduledTime.startTime': 1 })
      .skip(skip)
      .limit(limit);

    // Get total count
    const total = await Appointment.countDocuments(query);

    res.status(200).json({
      success: true,
      appointments,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalAppointments: total,
        limit
      }
    });

  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching appointments',
      error: error.message
    });
  }
};
```

---

### Controller Example: Add Clinical Notes

```javascript
// controllers/appointmentController.js
exports.addClinicalNotes = async (req, res) => {
  try {
    const { providerId, appointmentId } = req.params;

    // Check authorization
    if (req.provider._id.toString() !== providerId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // Find appointment
    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Verify provider owns this appointment
    if (appointment.provider.toString() !== providerId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this appointment'
      });
    }

    // Update clinical notes
    appointment.clinicalNotes = {
      ...req.body,
      addedBy: req.provider.email,
      addedAt: new Date()
    };

    // Update appointment status to completed
    appointment.status = 'completed';
    appointment.completedAt = new Date();

    await appointment.save();

    res.status(200).json({
      success: true,
      message: 'Clinical notes added successfully',
      appointment
    });

  } catch (error) {
    console.error('Add clinical notes error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding clinical notes',
      error: error.message
    });
  }
};
```

---

### Controller Example: Get Earnings Summary

```javascript
// controllers/earningsController.js
const Transaction = require('../models/Transaction');
const Appointment = require('../models/Appointment');

exports.getEarningsSummary = async (req, res) => {
  try {
    const providerId = req.params.providerId;

    // Check authorization
    if (req.provider._id.toString() !== providerId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // Get period from query
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;
    const year = parseInt(req.query.year) || new Date().getFullYear();

    // Calculate date range
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // Get transactions for period
    const transactions = await Transaction.find({
      provider: providerId,
      type: 'earning',
      createdAt: { $gte: startDate, $lte: endDate }
    });

    // Calculate summary
    const totalEarnings = transactions.reduce((sum, txn) => sum + txn.amount, 0);
    const platformFees = transactions.reduce((sum, txn) => sum + txn.platformFee, 0);
    const netEarnings = transactions.reduce((sum, txn) => sum + txn.netAmount, 0);

    const pending = transactions
      .filter(t => t.payoutStatus === 'pending')
      .reduce((sum, txn) => sum + txn.netAmount, 0);

    const paidOut = transactions
      .filter(t => t.payoutStatus === 'completed')
      .reduce((sum, txn) => sum + txn.netAmount, 0);

    // Get appointments for additional metrics
    const appointments = await Appointment.find({
      provider: providerId,
      scheduledDate: { $gte: startDate, $lte: endDate },
      status: 'completed'
    });

    // Calculate breakdown
    const serviceBreakdown = {};
    appointments.forEach(apt => {
      const serviceName = apt.service.name;
      if (!serviceBreakdown[serviceName]) {
        serviceBreakdown[serviceName] = { count: 0, amount: 0 };
      }
      serviceBreakdown[serviceName].count++;
      serviceBreakdown[serviceName].amount += apt.service.price;
    });

    // Format response
    const response = {
      success: true,
      earnings: {
        period: {
          month,
          year,
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0]
        },
        summary: {
          totalEarnings: parseFloat(totalEarnings.toFixed(2)),
          totalAppointments: appointments.length,
          averagePerAppointment: parseFloat((totalEarnings / appointments.length || 0).toFixed(2)),
          platformFee: parseFloat(platformFees.toFixed(2)),
          netEarnings: parseFloat(netEarnings.toFixed(2)),
          pendingPayments: parseFloat(pending.toFixed(2)),
          paidOut: parseFloat(paidOut.toFixed(2))
        },
        breakdown: Object.entries(serviceBreakdown).map(([name, data]) => ({
          serviceName: name,
          count: data.count,
          earnings: parseFloat(data.amount.toFixed(2))
        }))
      }
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('Get earnings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching earnings',
      error: error.message
    });
  }
};
```

---

## Security & Best Practices

### 1. Authentication & Authorization

- **JWT Tokens**: Use short-lived access tokens (15 minutes) and long-lived refresh tokens (7 days)
- **Password Security**: Hash passwords with bcrypt (salt rounds: 12)
- **Role-Based Access**: Verify provider role on every protected route
- **Token Validation**: Check token expiration and blacklist revoked tokens

### 2. Data Validation

```javascript
// Use Joi or express-validator
const { body, validationResult } = require('express-validator');

const validateAppointmentUpdate = [
  body('status').isIn(['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled']),
  body('notes').optional().trim().escape(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    next();
  }
];
```

### 3. Rate Limiting

```javascript
const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later'
});

app.use('/api/providers', apiLimiter);
```

### 4. Input Sanitization

```javascript
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');

app.use(mongoSanitize()); // Prevent NoSQL injection
app.use(xss()); // Prevent XSS attacks
```

### 5. CORS Configuration

```javascript
const cors = require('cors');

const corsOptions = {
  origin: process.env.CLIENT_URL,
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
```

### 6. HIPAA Compliance

- **Encryption**: Encrypt PHI (Protected Health Information) at rest and in transit
- **Access Logs**: Log all access to patient data
- **Audit Trail**: Maintain comprehensive audit trails
- **Data Minimization**: Only request and store necessary data
- **Secure Disposal**: Implement secure data deletion procedures

### 7. Error Handling

```javascript
// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);

  // Don't leak error details in production
  const message = process.env.NODE_ENV === 'production'
    ? 'Internal server error'
    : err.message;

  res.status(err.statusCode || 500).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});
```

---

## Testing Strategies

### 1. Unit Tests (Jest)

```javascript
// __tests__/controllers/appointmentController.test.js
const { getProviderAppointments } = require('../../controllers/appointmentController');
const Appointment = require('../../models/Appointment');

jest.mock('../../models/Appointment');

describe('getProviderAppointments', () => {
  it('should return appointments for authorized provider', async () => {
    const mockAppointments = [
      { _id: '1', scheduledDate: '2025-10-20', status: 'scheduled' }
    ];

    Appointment.find.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue(mockAppointments)
    });

    Appointment.countDocuments.mockResolvedValue(1);

    const req = {
      params: { providerId: 'provider123' },
      provider: { _id: 'provider123' },
      query: {}
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await getProviderAppointments(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        appointments: mockAppointments
      })
    );
  });
});
```

### 2. Integration Tests (Supertest)

```javascript
// __tests__/integration/appointments.test.js
const request = require('supertest');
const app = require('../../app');

describe('Appointment API', () => {
  let authToken;
  let providerId;

  beforeAll(async () => {
    // Login and get auth token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test.provider@example.com',
        password: 'TestPassword123'
      });

    authToken = loginResponse.body.data.accessToken;
    providerId = loginResponse.body.data.user._id;
  });

  it('should get provider appointments', async () => {
    const response = await request(app)
      .get(`/api/providers/${providerId}/appointments`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.appointments).toBeInstanceOf(Array);
  });

  it('should reject unauthorized access', async () => {
    await request(app)
      .get(`/api/providers/${providerId}/appointments`)
      .expect(401);
  });
});
```

### 3. End-to-End Tests

```javascript
// __tests__/e2e/providerFlow.test.js
describe('Provider Complete Flow', () => {
  it('should complete full provider workflow', async () => {
    // 1. Register provider
    const registerResponse = await request(app)
      .post('/api/providers/onboarding/init')
      .send({ referralCode: 'TEST123' });

    const sessionToken = registerResponse.body.sessionToken;

    // 2. Complete onboarding steps
    // Step 1 - Basic info
    await request(app)
      .post('/api/providers/onboarding/step1')
      .set('Authorization', `Bearer ${sessionToken}`)
      .send({ /* step 1 data */ })
      .expect(200);

    // Step 2 - Professional info
    await request(app)
      .post('/api/providers/onboarding/step2')
      .set('Authorization', `Bearer ${sessionToken}`)
      .send({ /* step 2 data */ })
      .expect(200);

    // 3. Login
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'new.provider@example.com',
        password: 'Password123'
      })
      .expect(200);

    const accessToken = loginResponse.body.data.accessToken;

    // 4. Get profile
    await request(app)
      .get(`/api/providers/${loginResponse.body.data.user._id}/profile`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    // 5. Set availability
    await request(app)
      .post(`/api/providers/${loginResponse.body.data.user._id}/schedule/availability`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ /* availability data */ })
      .expect(200);
  });
});
```

### 4. Performance Tests

```javascript
// Load test with Artillery
// artillery.yml
config:
  target: 'http://localhost:5000'
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 120
      arrivalRate: 50
      name: "Sustained load"

scenarios:
  - name: "Get appointments"
    flow:
      - post:
          url: "/api/auth/login"
          json:
            email: "test@example.com"
            password: "password"
          capture:
            - json: "$.data.accessToken"
              as: "token"
      - get:
          url: "/api/providers/{{ providerId }}/appointments"
          headers:
            Authorization: "Bearer {{ token }}"
```

---

## Summary

This comprehensive guide covers all aspects of the Provider backend API implementation for the Àñola Health platform:

✅ **35+ API Endpoints** covering:
- Authentication & Onboarding
- Profile Management
- Appointment Management
- Patient Management
- Schedule Management
- Earnings & Payments
- Services Management
- Notifications
- Analytics & Reports

✅ **Complete Database Schemas** with:
- Provider model with all fields
- Appointment model
- Schedule slots
- Transactions
- Proper indexing and validation

✅ **Implementation Examples** including:
- Authentication middleware
- Controller implementations
- Error handling
- Validation

✅ **Security Best Practices**:
- JWT authentication
- HIPAA compliance
- Input validation
- Rate limiting
- Data encryption

✅ **Testing Strategies**:
- Unit tests
- Integration tests
- E2E tests
- Performance tests

This guide provides everything needed to build a robust, secure, and scalable Provider backend API for the Àñola Health platform.
