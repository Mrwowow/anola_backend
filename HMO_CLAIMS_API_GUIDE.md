## HMO Claims Management API Guide

## 🎯 Overview

This guide provides complete API specifications for HMO Claims submission, processing, approval, and payment workflows. The claims system supports providers, vendors, patients, and super admins with role-specific functionality.

---

## 📋 Table of Contents

1. [Claims Architecture](#claims-architecture)
2. [Provider/Vendor Claims APIs](#providervendor-claims-apis)
3. [Patient Claims APIs](#patient-claims-apis)
4. [Provider-Specific APIs](#provider-specific-apis)
5. [Super Admin Claims Management](#super-admin-claims-management)
6. [Claims Analytics](#claims-analytics)
7. [Integration Examples](#integration-examples)

---

## 🏗️ Claims Architecture

### Claims Lifecycle

```
┌──────────────┐
│  SUBMITTED   │ ← Provider/Vendor submits claim
└──────┬───────┘
       │
       ↓
┌──────────────┐
│ UNDER_REVIEW │ ← Admin assigns for review
└──────┬───────┘
       │
       ├──→ APPROVED → PAID
       ├──→ PARTIALLY_APPROVED → PAID (partial amount)
       ├──→ REJECTED → (can appeal) → APPEALED
       └──→ CANCELLED
```

### User Roles & Permissions

| Role | Submit Claims | View Own Claims | View All Claims | Approve/Reject | Process Payment |
|------|---------------|-----------------|-----------------|----------------|-----------------|
| **Provider** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Vendor** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Patient** | ❌ | ✅ | ❌ | ❌ | ❌ |
| **Super Admin** | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## 🏥 Provider/Vendor Claims APIs

### Submit a New Claim

**Endpoint**: `POST /api/hmo-claims`

**Authentication**: Required (Provider or Vendor)

**Request Body**:
```typescript
interface SubmitClaimRequest {
  enrollmentId: string;           // Patient's HMO enrollment ID
  patientId: string;               // Patient user ID
  serviceType: 'outpatient' | 'inpatient' | 'emergency' | 'surgery' |
               'maternity' | 'prescription' | 'diagnostic' | 'dental' |
               'vision' | 'mental_health' | 'preventive' |
               'specialist_consultation' | 'other';
  serviceDate: string;             // ISO date
  dischargeDate?: string;          // For inpatient services

  diagnosis: {
    code: string;                  // ICD-10 code
    description: string;
    primary: boolean;
  };

  secondaryDiagnosis?: Array<{
    code: string;
    description: string;
  }>;

  procedure?: {
    code: string;                  // CPT code
    description: string;
  };

  additionalProcedures?: Array<{
    code: string;
    description: string;
  }>;

  treatmentDetails?: {
    description: string;
    prescriptions?: Array<{
      drugName: string;
      dosage: string;
      quantity: number;
      daysSupply: number;
    }>;
    diagnosticTests?: Array<{
      testName: string;
      result: string;
      date: string;
    }>;
    admissionType?: 'emergency' | 'elective' | 'urgent';
    lengthOfStay?: number;         // Days
  };

  billing: {
    totalBilled: number;           // Required
    breakdown: Array<{
      item: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
    }>;
    currency?: string;             // Default: USD
  };

  documents?: Array<{
    type: 'prescription' | 'lab_report' | 'invoice' |
          'discharge_summary' | 'medical_report' | 'receipt' | 'other';
    url: string;
    fileName: string;
  }>;
}
```

**Response**:
```typescript
interface SubmitClaimResponse {
  success: boolean;
  message: string;
  data: {
    _id: string;
    claimNumber: string;           // Auto-generated (e.g., CLM-ABC123-XY45)
    enrollmentId: string;
    planId: string;
    patientId: string;
    claimantType: 'provider' | 'vendor';
    claimantId: string;
    claimantDetails: {
      name: string;
      facilityName: string;
      licenseNumber: string;
      specialty: string;
      location: string;
    };
    serviceType: string;
    serviceDate: string;
    diagnosis: object;
    billing: {
      totalBilled: number;
      coveragePercentage: number;  // Auto-calculated
      coveredAmount: number;        // Auto-calculated
      patientResponsibility: {
        copayment: number;
        coinsurance: number;
        deductible: number;
        total: number;
      };
    };
    status: 'submitted';
    createdAt: string;
  };
}
```

**Example**:
```javascript
const response = await fetch('https://api.anolahealth.com/api/hmo-claims', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    enrollmentId: "64a1b2c3d4e5f6g7h8i9j0k1",
    patientId: "64a1b2c3d4e5f6g7h8i9j0k2",
    serviceType: "outpatient",
    serviceDate: "2025-01-15",
    diagnosis: {
      code: "J00",
      description: "Acute nasopharyngitis (common cold)",
      primary: true
    },
    procedure: {
      code: "99213",
      description: "Office outpatient visit, established patient, 20-29 minutes"
    },
    treatmentDetails: {
      description: "Patient presented with cold symptoms. Prescribed medication.",
      prescriptions: [{
        drugName: "Amoxicillin",
        dosage: "500mg",
        quantity: 21,
        daysSupply: 7
      }]
    },
    billing: {
      totalBilled: 150.00,
      breakdown: [
        { item: "Consultation", quantity: 1, unitPrice: 100, totalPrice: 100 },
        { item: "Prescription", quantity: 1, unitPrice: 50, totalPrice: 50 }
      ]
    },
    documents: [{
      type: "prescription",
      url: "https://storage.example.com/prescriptions/rx-001.pdf",
      fileName: "prescription-2025-01-15.pdf"
    }]
  })
});
```

---

### Get My Claims (Provider/Vendor)

**Endpoint**: `GET /api/hmo-claims/my-claims`

**Authentication**: Required (Provider or Vendor)

**Query Parameters**:
```typescript
{
  status?: 'all' | 'submitted' | 'under_review' | 'approved' |
           'partially_approved' | 'rejected' | 'paid' | 'appealed';
  page?: number;                   // Default: 1
  limit?: number;                  // Default: 20
  startDate?: string;              // Filter by service date
  endDate?: string;
}
```

**Response**:
```typescript
interface GetMyClaimsResponse {
  success: boolean;
  data: Array<Claim>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  statistics: Array<{
    _id: string;                   // Status
    count: number;
    totalAmount: number;
    approvedAmount: number;
  }>;
}
```

---

### Get Claim Details

**Endpoint**: `GET /api/hmo-claims/:id`

**Authentication**: Required

**Authorization**: Only claimant, patient, or super admin can view

**Response**: Full claim object with all details

---

### Update Claim

**Endpoint**: `PUT /api/hmo-claims/:id`

**Authentication**: Required (Claimant only)

**Restrictions**: Only claims in 'submitted' or 'under_review' status can be updated

**Request Body**:
```typescript
{
  documents?: Array<Document>;     // Add more supporting documents
  billing?: {
    totalBilled?: number;
    breakdown?: Array<BillingItem>;
  };
  notes?: string;
}
```

---

### Submit Appeal

**Endpoint**: `POST /api/hmo-claims/:id/appeal`

**Authentication**: Required (Claimant or Patient)

**Eligibility**: Only 'rejected' or 'partially_approved' claims can be appealed

**Request Body**:
```typescript
{
  reason: string;                  // Required - reason for appeal
  documents?: Array<{
    url: string;
    fileName: string;
  }>;
}
```

**Response**:
```typescript
{
  success: boolean;
  message: "Appeal submitted successfully";
  data: {
    status: "appealed";
    appeal: {
      submitted: true;
      submittedAt: string;
      reason: string;
      status: "pending";
    };
  };
}
```

---

## 👨‍⚕️ Provider-Specific APIs

### Get HMO Patients

**Endpoint**: `GET /api/providers/hmo-patients`

**Authentication**: Required (Provider only)

**Description**: Returns all patients who have selected this provider as their Primary Care Provider (PCP)

**Response**:
```typescript
{
  success: boolean;
  data: Array<{
    userId: User;
    planId: HMOPlan;
    enrollmentNumber: string;
    membershipCardNumber: string;
    status: string;
    coverageStartDate: string;
    coverageEndDate: string;
    limits: {
      annualMaximum: number;
      remainingAnnual: number;
      deductible: number;
      deductibleMet: number;
    };
    utilization: {
      appointmentsUsed: number;
      prescriptionsUsed: number;
      claimsSubmitted: number;
    };
  }>;
  count: number;
}
```

---

### Get Patient Coverage Details

**Endpoint**: `GET /api/providers/patients/:patientId/hmo-coverage`

**Authentication**: Required (Provider only)

**Description**: View specific patient's HMO coverage before providing services

**Response**:
```typescript
{
  success: boolean;
  data: {
    enrollment: HMOEnrollment;
    coverage: {
      outpatientCare: {
        covered: boolean;
        copayment: number;
        coveragePercentage: number;
      };
      // ... all coverage types
    };
    limits: {
      annualMaximum: number;
      remainingAnnual: number;
      deductible: number;
      deductibleMet: number;
      maxOutOfPocket: number;
      outOfPocketSpent: number;
    };
    utilization: {
      appointmentsUsed: number;
      appointmentsLimit: number;
      prescriptionsUsed: number;
      claimsSubmitted: number;
      claimsApproved: number;
    };
    recentClaims: Array<{
      claimNumber: string;
      serviceType: string;
      serviceDate: string;
      totalBilled: number;
      approvedAmount: number;
      status: string;
    }>;
  };
}
```

---

## 👤 Patient Claims APIs

### Get My Claims (Patient)

**Endpoint**: `GET /api/patients/my-claims`

**Authentication**: Required (Patient)

**Query Parameters**:
```typescript
{
  status?: 'all' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'paid';
  page?: number;
  limit?: number;
}
```

**Response**:
```typescript
{
  success: boolean;
  data: Array<{
    _id: string;
    claimNumber: string;
    claimantId: {
      profile: { firstName, lastName };
      userType: 'provider' | 'vendor';
    };
    planId: { name, planCode };
    serviceType: string;
    serviceDate: string;
    billing: {
      totalBilled: number;
      coveredAmount: number;
      patientResponsibility: {
        copayment: number;
        coinsurance: number;
        total: number;
      };
      approvedAmount: number;
      amountPaid: number;
    };
    status: string;
    createdAt: string;
  }>;
  pagination: object;
}
```

---

## 🔐 Super Admin Claims Management

### Get All Claims

**Endpoint**: `GET /api/super-admin/hmo-claims`

**Authentication**: Required (Super Admin)

**Query Parameters**:
```typescript
{
  status?: 'all' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'paid';
  claimantType?: 'all' | 'provider' | 'vendor' | 'patient';
  serviceType?: 'all' | 'outpatient' | 'inpatient' | ...;
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  search?: string;                 // Search by claim number, claimant name, diagnosis
}
```

**Response**:
```typescript
{
  success: boolean;
  data: Array<Claim>;
  pagination: object;
  summary: Array<{
    _id: string;                   // Status
    count: number;
    totalBilled: number;
    totalApproved: number;
  }>;
}
```

---

### Get Pending Claims

**Endpoint**: `GET /api/super-admin/hmo-claims/pending`

**Authentication**: Required (Super Admin)

**Response**: All claims in 'submitted' or 'under_review' status, sorted by submission date (oldest first)

---

### Assign Claim for Review

**Endpoint**: `POST /api/super-admin/hmo-claims/:id/assign`

**Authentication**: Required (Super Admin)

**Description**: Assigns claim to current admin and changes status to 'under_review'

**Response**:
```typescript
{
  success: boolean;
  message: "Claim assigned for review";
  data: {
    status: "under_review";
    reviewedBy: string;            // Admin ID
    processing: {
      assignedAt: string;
      reviewStartedAt: string;
    };
  };
}
```

---

### Approve Claim

**Endpoint**: `POST /api/super-admin/hmo-claims/:id/approve`

**Authentication**: Required (Super Admin)

**Request Body**:
```typescript
{
  approvedAmount?: number;         // If different from auto-calculated
  notes?: string;
  autoPayment?: boolean;           // Default: false - If true, initiates payment immediately
}
```

**Response**:
```typescript
{
  success: boolean;
  message: "Claim approved successfully";
  data: {
    status: "approved";
    reviewedBy: string;
    reviewedAt: string;
    billing: {
      approvedAmount: number;
    };
  };
}
```

**Auto-Payment**: If `autoPayment: true`, the system will:
1. Create a transaction
2. Credit the provider/vendor wallet
3. Mark claim as 'paid'
4. Send notification

---

### Reject Claim

**Endpoint**: `POST /api/super-admin/hmo-claims/:id/reject`

**Authentication**: Required (Super Admin)

**Request Body**:
```typescript
{
  reason: string;                  // Required - rejection reason
  notes?: string;
}
```

**Common Rejection Reasons**:
- Service not covered under plan
- Documentation incomplete
- Duplicate claim
- Service date outside coverage period
- Exceeds annual maximum
- Pre-authorization required but not obtained
- Service provided by out-of-network provider

---

### Partially Approve Claim

**Endpoint**: `POST /api/super-admin/hmo-claims/:id/partial-approve`

**Authentication**: Required (Super Admin)

**Request Body**:
```typescript
{
  approvedAmount: number;          // Required
  rejectedAmount: number;          // Required
  notes: string;                   // Explanation for partial approval
}
```

**Use Case**: Some line items approved, others rejected

---

### Process Payment

**Endpoint**: `POST /api/super-admin/hmo-claims/:id/process-payment`

**Authentication**: Required (Super Admin)

**Eligibility**: Only 'approved' claims

**Request Body**:
```typescript
{
  paymentMethod?: 'bank_transfer' | 'card' | 'wallet';  // Default: bank_transfer
  notes?: string;
}
```

**Response**:
```typescript
{
  success: boolean;
  message: "Payment processed successfully";
  data: {
    claim: {
      status: "paid";
      billing: {
        amountPaid: number;
        paymentDate: string;
        paymentReference: string;
      };
    };
    payment: {
      transaction: Transaction;
      wallet: Wallet;
    };
  };
}
```

---

### Review Appeal

**Endpoint**: `POST /api/super-admin/hmo-claims/:id/review-appeal`

**Authentication**: Required (Super Admin)

**Request Body**:
```typescript
{
  decision: 'approved' | 'rejected';  // Required
  notes: string;
  approvedAmount?: number;            // If decision is 'approved'
}
```

**Response**:
```typescript
{
  success: boolean;
  message: "Appeal approved" | "Appeal rejected";
  data: {
    status: "approved" | "rejected";
    appeal: {
      status: "approved" | "rejected";
      reviewedAt: string;
      reviewNotes: string;
    };
  };
}
```

---

## 📊 Claims Analytics

### Get Claims Analytics

**Endpoint**: `GET /api/super-admin/hmo-claims/analytics`

**Authentication**: Required (Super Admin)

**Query Parameters**:
```typescript
{
  startDate?: string;
  endDate?: string;
  planId?: string;
}
```

**Response**:
```typescript
{
  success: boolean;
  data: {
    overview: {
      totalClaims: number;
      totalBilled: number;
      totalApproved: number;
      totalPaid: number;
      avgProcessingTime: number;   // Hours
    };
    byStatus: Array<{
      _id: string;                 // Status
      count: number;
      totalAmount: number;
    }>;
    byServiceType: Array<{
      _id: string;                 // Service type
      count: number;
      totalBilled: number;
      totalApproved: number;
    }>;
    byClaimantType: Array<{
      _id: 'provider' | 'vendor';
      count: number;
      totalBilled: number;
    }>;
    topClaimants: Array<{
      _id: string;                 // Claimant ID
      claimantName: string;
      claimantType: string;
      totalClaims: number;
      totalBilled: number;
      totalApproved: number;
    }>;
    monthlyTrend: Array<{
      _id: { year: number, month: number };
      count: number;
      totalBilled: number;
      totalApproved: number;
    }>;
  };
}
```

---

## 🔧 Integration Examples

### Provider Workflow: Submit Claim After Patient Visit

```javascript
// Step 1: Check patient's HMO coverage
const checkCoverage = async (patientId) => {
  const response = await fetch(
    `https://api.anolahealth.com/api/providers/patients/${patientId}/hmo-coverage`,
    {
      headers: { 'Authorization': `Bearer ${providerToken}` }
    }
  );

  const { data } = await response.json();

  console.log('Patient Coverage:', {
    plan: data.enrollment.planId.name,
    remainingCoverage: data.limits.remainingAnnual,
    deductibleMet: data.limits.deductibleMet,
    outpatientCoverage: data.coverage.outpatientCare.coveragePercentage + '%'
  });

  return data;
};

// Step 2: After providing service, submit claim
const submitClaim = async (visitData) => {
  const response = await fetch('https://api.anolahealth.com/api/hmo-claims', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${providerToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      enrollmentId: visitData.enrollmentId,
      patientId: visitData.patientId,
      serviceType: 'outpatient',
      serviceDate: new Date().toISOString(),
      diagnosis: {
        code: visitData.diagnosisCode,
        description: visitData.diagnosisDesc,
        primary: true
      },
      procedure: {
        code: visitData.procedureCode,
        description: visitData.procedureDesc
      },
      billing: {
        totalBilled: visitData.totalCharge,
        breakdown: visitData.billingItems
      },
      documents: visitData.documents
    })
  });

  const result = await response.json();
  console.log('Claim submitted:', result.data.claimNumber);

  return result.data;
};

// Step 3: Track claim status
const trackClaim = async (claimId) => {
  const response = await fetch(
    `https://api.anolahealth.com/api/hmo-claims/${claimId}`,
    {
      headers: { 'Authorization': `Bearer ${providerToken}` }
    }
  );

  const { data } = await response.json();

  console.log('Claim Status:', {
    claimNumber: data.claimNumber,
    status: data.status,
    billed: data.billing.totalBilled,
    approved: data.billing.approvedAmount,
    paid: data.billing.amountPaid
  });

  return data;
};
```

---

### Super Admin Workflow: Process Pending Claims

```javascript
// Step 1: Get all pending claims
const getPendingClaims = async () => {
  const response = await fetch(
    'https://api.anolahealth.com/api/super-admin/hmo-claims/pending',
    {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    }
  );

  const { data } = await response.json();
  return data;
};

// Step 2: Assign and review claim
const reviewClaim = async (claimId) => {
  // Assign to self
  await fetch(
    `https://api.anolahealth.com/api/super-admin/hmo-claims/${claimId}/assign`,
    {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    }
  );

  // Review claim details
  const claimResponse = await fetch(
    `https://api.anolahealth.com/api/hmo-claims/${claimId}`,
    {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    }
  );

  const { data: claim } = await claimResponse.json();

  // Verify:
  // - Service date within coverage
  // - Diagnosis/procedure codes valid
  // - Documentation complete
  // - Coverage percentage correct
  // - Doesn't exceed limits

  return claim;
};

// Step 3: Approve and auto-pay
const approveAndPay = async (claimId, approvedAmount) => {
  const response = await fetch(
    `https://api.anolahealth.com/api/super-admin/hmo-claims/${claimId}/approve`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        approvedAmount,
        notes: 'Approved after verification. Documentation complete.',
        autoPayment: true
      })
    }
  );

  const result = await response.json();
  console.log('Claim approved and paid:', result.data);

  return result.data;
};
```

---

## 🎯 Best Practices

### For Providers/Vendors

1. **Check Coverage First**: Always verify patient's HMO coverage before providing services
2. **Complete Documentation**: Include all required documents (prescriptions, lab reports, invoices)
3. **Accurate Coding**: Use correct ICD-10 and CPT codes
4. **Submit Promptly**: Submit claims within 30 days of service
5. **Track Status**: Monitor claim status regularly

### For Super Admins

1. **Review SLA**: Process claims within 7-14 days
2. **Verify Documentation**: Ensure all required documents are present
3. **Check Eligibility**: Verify service date within coverage period
4. **Monitor Fraud**: Flag suspicious patterns (duplicate claims, excessive amounts)
5. **Communication**: Provide clear rejection reasons to enable appeals

### Error Handling

```javascript
try {
  const claim = await submitClaim(data);
} catch (error) {
  if (error.status === 404) {
    // Enrollment not found or inactive
    alert('Patient does not have active HMO coverage');
  } else if (error.status === 400) {
    // Validation error or service outside coverage
    alert(error.message);
  } else {
    // Server error
    console.error('Failed to submit claim:', error);
  }
}
```

---

## 📋 Summary

The HMO Claims system provides:

- ✅ **Complete Claims Lifecycle**: From submission to payment
- ✅ **Role-Based Access**: Providers, vendors, patients, and admins
- ✅ **Automated Coverage Calculation**: Based on plan rules
- ✅ **Appeals Process**: For rejected/partially approved claims
- ✅ **Payment Integration**: Direct wallet credits
- ✅ **Analytics & Reporting**: Comprehensive insights
- ✅ **Fraud Detection**: Automated flagging
- ✅ **SLA Tracking**: Processing time monitoring

For questions or support, contact the Anola Health API team.
