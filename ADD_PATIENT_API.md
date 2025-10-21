# Add Patient API Documentation

## Overview

This API allows providers, vendors, and sponsors to register new patients into the Anola Health system. The endpoint automatically generates health cards with QR codes, creates temporary passwords, and optionally sets up wallets for new patients.

## Endpoint

```
POST /api/patients/add
```

**Authentication:** Required (Bearer Token)

**Authorized User Types:**
- Providers
- Vendors
- Sponsors

**Base URL:** `https://anola-backend.vercel.app`

## Request

### Headers

```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

### Request Body

#### Required Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| firstName | string | Patient's first name | "John" |
| lastName | string | Patient's last name | "Doe" |
| email | string | Valid email address | "john.doe@example.com" |
| phone | string | Phone number with country code | "+2348012345678" |
| dateOfBirth | string | Date in YYYY-MM-DD format | "1990-01-15" |
| gender | string | One of: male, female, other, prefer-not-to-say | "male" |

#### Optional Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| middleName | string | - | Patient's middle name |
| address | object | {country: "Nigeria"} | Full address |
| bloodType | string | - | Blood type (A+, B+, O+, AB+, etc.) |
| allergies | array | [] | List of allergies |
| chronicConditions | array | [] | List of chronic conditions |
| currentMedications | array | [] | Current medications |
| emergencyContact | object | - | Emergency contact information |
| insuranceInfo | object | - | Insurance information |
| createWallet | boolean | false | Create wallet for patient |
| initialDeposit | number | 0 | Initial wallet deposit (NGN) |
| sendCredentials | boolean | true | Include temp password in response |

### Example Request

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "middleName": "Michael",
  "email": "john.doe@example.com",
  "phone": "+2348012345678",
  "dateOfBirth": "1990-01-15",
  "gender": "male",
  "address": {
    "street": "123 Main Street",
    "city": "Lagos",
    "state": "Lagos",
    "country": "Nigeria",
    "zipCode": "100001"
  },
  "bloodType": "O+",
  "allergies": [
    {
      "allergen": "Penicillin",
      "severity": "high",
      "reaction": "Anaphylaxis"
    }
  ],
  "chronicConditions": [
    {
      "condition": "Hypertension",
      "diagnosedDate": "2020-05-10",
      "status": "managed"
    }
  ],
  "currentMedications": [
    {
      "name": "Lisinopril",
      "dosage": "10mg",
      "frequency": "once daily"
    }
  ],
  "emergencyContact": {
    "name": "Jane Doe",
    "relationship": "spouse",
    "phone": "+2348098765432",
    "email": "jane.doe@example.com"
  },
  "insuranceInfo": {
    "provider": "NHIS",
    "policyNumber": "NHIS-123456",
    "expiryDate": "2025-12-31"
  },
  "createWallet": true,
  "initialDeposit": 50000
}
```

## Response

### Success Response (201 Created)

```json
{
  "success": true,
  "message": "Patient added successfully",
  "patient": {
    "id": "68f69bda582a884e78e0b0e5",
    "healthCardId": "AH-B58739B3-CE46",
    "email": "john.doe@example.com",
    "phone": "+2348012345678",
    "fullName": "John Michael Doe",
    "dateOfBirth": "1990-01-15T00:00:00.000Z",
    "gender": "male",
    "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
  },
  "wallet": {
    "walletId": "PW-ABC123-XYZ789",
    "balance": 50000,
    "currency": "NGN"
  },
  "credentials": {
    "email": "john.doe@example.com",
    "tempPassword": "a1b2c3d4e5f6g7h8",
    "message": "Please ask the patient to change this password on first login"
  }
}
```

### Error Responses

#### 400 Bad Request - Missing Required Fields

```json
{
  "success": false,
  "message": "Missing required fields: firstName, lastName, email, phone, dateOfBirth, gender"
}
```

#### 400 Bad Request - Invalid Email

```json
{
  "success": false,
  "message": "Invalid email format"
}
```

#### 400 Bad Request - Invalid Phone

```json
{
  "success": false,
  "message": "Invalid phone number format"
}
```

#### 400 Bad Request - Invalid Gender

```json
{
  "success": false,
  "message": "Invalid gender. Must be one of: male, female, other, prefer-not-to-say"
}
```

#### 401 Unauthorized

```json
{
  "success": false,
  "message": "Unauthorized"
}
```

#### 409 Conflict - Duplicate Email

```json
{
  "success": false,
  "message": "Email already registered"
}
```

#### 409 Conflict - Duplicate Phone

```json
{
  "success": false,
  "message": "Phone number already registered"
}
```

## Additional Endpoints

### Get My Patients

```
GET /api/patients/my-patients?page=1&limit=20&search=john
```

Retrieves all patients added by the authenticated user.

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Results per page (default: 20)
- `search` - Search by name, email, phone, or health card ID

**Response:**
```json
{
  "success": true,
  "patients": [
    {
      "id": "68f69bda582a884e78e0b0e5",
      "healthCardId": "AH-B58739B3-CE46",
      "fullName": "John Michael Doe",
      "email": "john.doe@example.com",
      "phone": "+2348012345678",
      "gender": "male",
      "dateOfBirth": "1990-01-15T00:00:00.000Z",
      "status": "active",
      "addedAt": "2025-10-21T14:30:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 1,
    "totalPatients": 1,
    "limit": 20
  }
}
```

### Get Patient Details

```
GET /api/patients/{patientId}
```

Retrieves detailed information about a specific patient.

**Response:**
```json
{
  "success": true,
  "patient": {
    "_id": "68f69bda582a884e78e0b0e5",
    "healthCardId": "AH-B58739B3-CE46",
    "email": "john.doe@example.com",
    "phone": "+2348012345678",
    "userType": "patient",
    "profile": {
      "firstName": "John",
      "lastName": "Doe",
      "middleName": "Michael",
      "dateOfBirth": "1990-01-15T00:00:00.000Z",
      "gender": "male",
      "address": {
        "street": "123 Main Street",
        "city": "Lagos",
        "state": "Lagos",
        "country": "Nigeria",
        "zipCode": "100001"
      }
    },
    "medicalHistory": {
      "bloodType": "O+",
      "allergies": [...],
      "chronicConditions": [...],
      "currentMedications": [...]
    },
    "emergencyContact": {...},
    "qrCode": {
      "data": "{...}",
      "imageUrl": "data:image/png;base64,..."
    },
    "status": "active",
    "metadata": {
      "addedBy": "provider",
      "addedById": "68f376a6f1ca671db96e399e",
      "addedAt": "2025-10-21T14:30:00.000Z"
    }
  }
}
```

## Features

### 1. Automatic Health Card Generation

Every patient gets:
- Unique health card ID (format: `AH-XXXXXXXX-XXXX`)
- QR code containing:
  - Health card ID
  - Patient ID
  - Full name
  - Email and phone
- Base64-encoded QR code image for immediate use

### 2. Temporary Password Generation

- Secure random password generated automatically
- 16-character hexadecimal string
- Returned in response if `sendCredentials` is true
- Patient should change password on first login

### 3. Optional Wallet Creation

When `createWallet` is true:
- Personal wallet created automatically
- Unique wallet ID generated (format: `PW-XXXXXX-XXXXXX`)
- Initial deposit added if specified
- Wallet statistics initialized

### 4. Metadata Tracking

System automatically tracks:
- Who added the patient (`addedBy`: provider/vendor/sponsor)
- User ID of the person who added them (`addedById`)
- Timestamp when patient was added (`addedAt`)

## Integration Examples

### cURL Example

```bash
curl -X POST https://anola-backend.vercel.app/api/patients/add \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "phone": "+2348012345678",
    "dateOfBirth": "1990-01-15",
    "gender": "male",
    "createWallet": true,
    "initialDeposit": 50000
  }'
```

### JavaScript/Axios Example

```javascript
const axios = require('axios');

async function addPatient(accessToken) {
  try {
    const response = await axios.post(
      'https://anola-backend.vercel.app/api/patients/add',
      {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '+2348012345678',
        dateOfBirth: '1990-01-15',
        gender: 'male',
        bloodType: 'O+',
        createWallet: true,
        initialDeposit: 50000,
        emergencyContact: {
          name: 'Jane Doe',
          relationship: 'spouse',
          phone: '+2348098765432'
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Patient added:', response.data);
    console.log('Health Card ID:', response.data.patient.healthCardId);
    console.log('Temporary Password:', response.data.credentials.tempPassword);

    // Save or display the QR code
    const qrCode = response.data.patient.qrCode;
    // Can be used directly in an <img> tag

    return response.data;
  } catch (error) {
    console.error('Error adding patient:', error.response?.data || error.message);
    throw error;
  }
}
```

### React/TypeScript Component

```typescript
import React, { useState } from 'react';
import axios from 'axios';

interface AddPatientFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  bloodType?: string;
  createWallet?: boolean;
  initialDeposit?: number;
}

const AddPatientForm: React.FC = () => {
  const [formData, setFormData] = useState<AddPatientFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: 'male',
    createWallet: false,
    initialDeposit: 0
  });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.post(
        'https://anola-backend.vercel.app/api/patients/add',
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      setResult(response.data);
      alert(`Patient added successfully! Health Card: ${response.data.patient.healthCardId}`);
    } catch (error: any) {
      alert(`Error: ${error.response?.data?.message || 'Failed to add patient'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-patient-form">
      <h2>Add New Patient</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="First Name"
          value={formData.firstName}
          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
          required
        />
        <input
          type="text"
          placeholder="Last Name"
          value={formData.lastName}
          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />
        <input
          type="tel"
          placeholder="Phone (+234...)"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          required
        />
        <input
          type="date"
          value={formData.dateOfBirth}
          onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
          required
        />
        <select
          value={formData.gender}
          onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
        >
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
          <option value="prefer-not-to-say">Prefer not to say</option>
        </select>

        <label>
          <input
            type="checkbox"
            checked={formData.createWallet}
            onChange={(e) => setFormData({ ...formData, createWallet: e.target.checked })}
          />
          Create Wallet
        </label>

        {formData.createWallet && (
          <input
            type="number"
            placeholder="Initial Deposit (NGN)"
            value={formData.initialDeposit}
            onChange={(e) => setFormData({ ...formData, initialDeposit: Number(e.target.value) })}
          />
        )}

        <button type="submit" disabled={loading}>
          {loading ? 'Adding...' : 'Add Patient'}
        </button>
      </form>

      {result && (
        <div className="result">
          <h3>Patient Added Successfully!</h3>
          <p><strong>Health Card ID:</strong> {result.patient.healthCardId}</p>
          <p><strong>Email:</strong> {result.patient.email}</p>
          {result.credentials && (
            <p><strong>Temporary Password:</strong> {result.credentials.tempPassword}</p>
          )}
          {result.patient.qrCode && (
            <div>
              <p><strong>Health Card QR Code:</strong></p>
              <img src={result.patient.qrCode} alt="Health Card QR Code" />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AddPatientForm;
```

## Validation Rules

### Email Validation
- Must be valid email format
- Must not already exist in system
- Converted to lowercase automatically

### Phone Validation
- Must match international phone number format
- Country code recommended (+234 for Nigeria)
- Must not already exist in system

### Gender Validation
- Must be one of: `male`, `female`, `other`, `prefer-not-to-say`

### Date of Birth
- Must be valid date
- Format: `YYYY-MM-DD`

## Best Practices

1. **Always provide emergency contact** for safety
2. **Collect medical history** upfront when possible (allergies, chronic conditions)
3. **Create wallet** for patients who will make payments
4. **Send credentials securely** - don't expose temp password in logs
5. **Ask patient to change password** on first login
6. **Store QR code** for easy health card access
7. **Track patient source** using metadata

## Security Notes

- Endpoint requires authentication
- Only providers, vendors, and sponsors can add patients
- Passwords are automatically hashed before storage
- Sensitive data excluded from responses
- Each user can only see patients they added (via `my-patients` endpoint)

## Common Use Cases

### 1. Walk-in Patient Registration (Provider)
```json
{
  "firstName": "Sarah",
  "lastName": "Johnson",
  "email": "sarah.j@email.com",
  "phone": "+2348123456789",
  "dateOfBirth": "1985-06-20",
  "gender": "female",
  "bloodType": "A+",
  "createWallet": true,
  "initialDeposit": 25000
}
```

### 2. Sponsored Patient (Sponsor)
```json
{
  "firstName": "Ahmed",
  "lastName": "Ibrahim",
  "email": "ahmed.i@email.com",
  "phone": "+2348111222333",
  "dateOfBirth": "1975-03-10",
  "gender": "male",
  "createWallet": true,
  "initialDeposit": 100000,
  "insuranceInfo": {
    "provider": "Sponsor-Funded",
    "policyNumber": "SPONSOR-2025-001"
  }
}
```

### 3. Vendor Customer Registration
```json
{
  "firstName": "Mary",
  "lastName": "Okonkwo",
  "email": "mary.o@email.com",
  "phone": "+2348099887766",
  "dateOfBirth": "1995-11-25",
  "gender": "female",
  "createWallet": true,
  "initialDeposit": 10000
}
```

## Support

For issues or questions:
- Check the [main documentation](./README.md)
- Review [error codes](./ERROR_CODES.md)
- Check Swagger documentation at `/api-docs`
