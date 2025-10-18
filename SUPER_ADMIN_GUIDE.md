# Super Admin API Documentation

## Overview

The Super Admin system provides comprehensive platform management capabilities for Anola Health. This includes user management, analytics, transaction monitoring, and system administration.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Creating First Super Admin](#creating-first-super-admin)
3. [Authentication](#authentication)
4. [Permissions System](#permissions-system)
5. [API Endpoints](#api-endpoints)
6. [Security Features](#security-features)

---

## Getting Started

### Prerequisites

- MongoDB connection configured
- Backend server running
- Authentication system enabled

### Admin Levels

- **Super Admin**: Regular admin with configurable permissions
- **Master Admin**: Full access, can create other admins

---

## Creating First Super Admin

Run the interactive script to create your first Master Admin:

```bash
npm run create-super-admin
```

Follow the prompts to enter:
- Email
- Password (min 8 characters)
- First Name
- Last Name
- Phone Number
- National ID
- Employee ID (optional)
- Department (optional)

### Example:

```bash
$ npm run create-super-admin

Connecting to MongoDB...
✅ Connected to MongoDB

=== Create Master Super Admin ===

Enter admin email: admin@anolahealth.com
Enter admin password: SecurePassword123!
Enter first name: John
Enter last name: Doe
Enter phone number: +250788123456
Enter national ID: 1234567890123456
Enter employee ID (optional): EMP001
Enter department (optional): Administration

✅ Master Super Admin created successfully!

Admin Details:
================
Email: admin@anolahealth.com
Name: John Doe
Admin Level: master
User ID: 6123456789abcdef01234567
Employee ID: EMP001
Department: Administration

All permissions: ENABLED

You can now login with these credentials at /api/auth/login
```

---

## Authentication

### Login

Super admins use the same authentication endpoint as other users:

**Endpoint:** `POST /api/auth/login`

```json
{
  "email": "admin@anolahealth.com",
  "password": "SecurePassword123!"
}
```

**Response:**

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "6123456789abcdef01234567",
    "email": "admin@anolahealth.com",
    "userType": "super_admin",
    "profile": {
      "firstName": "John",
      "lastName": "Doe"
    }
  }
}
```

### Using the Token

Include the token in the Authorization header for all requests:

```
Authorization: Bearer <your-token-here>
```

---

## Permissions System

### Available Permissions

| Permission | Description |
|------------|-------------|
| `manageUsers` | View, update, verify, and manage all users |
| `manageProviders` | Manage and verify healthcare providers |
| `managePatients` | Access and manage patient records |
| `manageSponsors` | Manage sponsor accounts |
| `manageVendors` | Manage vendor accounts |
| `manageTransactions` | View and reverse transactions |
| `manageAppointments` | Access all appointments |
| `manageMedicalRecords` | Access all medical records |
| `manageSponsorships` | Manage sponsorship programs |
| `manageWallets` | Manage user wallets |
| `viewAnalytics` | Access dashboard and analytics |
| `systemSettings` | Modify system settings |
| `auditLogs` | View audit logs |
| `createAdmins` | Create and manage other admins (Master only) |

### Permission Checks

Each endpoint automatically checks required permissions. Example:

```javascript
// User management requires 'manageUsers' permission
GET /api/super-admin/users
```

If permission is denied:

```json
{
  "success": false,
  "message": "Permission denied: manageUsers required"
}
```

---

## API Endpoints

### Base URL

All super admin endpoints are prefixed with:

```
/api/super-admin
```

### Authentication Required

All endpoints require:
1. Valid JWT token in Authorization header
2. User type must be `super_admin`
3. Appropriate permissions for the endpoint

---

## Dashboard & Analytics

### Get Dashboard

**Endpoint:** `GET /api/super-admin/dashboard`

**Permission:** `viewAnalytics`

**Description:** Get comprehensive platform statistics

**Response:**

```json
{
  "success": true,
  "data": {
    "users": {
      "total": 1523,
      "active": 1245,
      "newThisMonth": 87,
      "byType": [
        { "_id": "patient", "count": 1200 },
        { "_id": "provider", "count": 150 },
        { "_id": "sponsor", "count": 50 }
      ]
    },
    "appointments": {
      "total": 3456,
      "thisMonth": 234,
      "byStatus": [
        { "_id": "completed", "count": 2000 },
        { "_id": "scheduled", "count": 800 }
      ]
    },
    "transactions": {
      "total": 5678,
      "thisMonth": 456,
      "totalVolume": 234567.89,
      "totalFees": 5678.90
    },
    "sponsorships": {
      "total": 123,
      "active": 98,
      "totalAllocated": 500000,
      "totalUsed": 234567,
      "totalRemaining": 265433
    }
  }
}
```

### Get Statistics

**Endpoint:** `GET /api/super-admin/statistics`

**Permission:** `viewAnalytics`

**Query Parameters:**
- `startDate` - Start date (ISO 8601)
- `endDate` - End date (ISO 8601)
- `groupBy` - `day` or `month` (default: `day`)

**Example:**

```
GET /api/super-admin/statistics?startDate=2025-01-01&endDate=2025-12-31&groupBy=month
```

---

## User Management

### Get All Users

**Endpoint:** `GET /api/super-admin/users`

**Permission:** `manageUsers`

**Query Parameters:**
- `userType` - Filter by user type (patient, provider, sponsor, etc.)
- `status` - Filter by status (active, suspended, etc.)
- `search` - Search by name, email, phone, healthCardId
- `page` - Page number (default: 1)
- `limit` - Results per page (default: 50)

**Example:**

```
GET /api/super-admin/users?userType=patient&status=active&page=1&limit=50
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "_id": "6123...",
      "email": "patient@example.com",
      "userType": "patient",
      "status": "active",
      "profile": {
        "firstName": "Jane",
        "lastName": "Smith"
      },
      "healthCardId": "AH-123456"
    }
  ],
  "pagination": {
    "total": 1200,
    "page": 1,
    "pages": 24
  }
}
```

### Get User by ID

**Endpoint:** `GET /api/super-admin/users/:id`

**Permission:** `manageUsers`

### Update User Status

**Endpoint:** `PATCH /api/super-admin/users/:id/status`

**Permission:** `manageUsers`

**Body:**

```json
{
  "status": "suspended",
  "reason": "Suspicious activity detected"
}
```

**Valid Status Values:**
- `pending`
- `active`
- `inactive`
- `suspended`
- `deleted`

### Verify User Identity

**Endpoint:** `POST /api/super-admin/users/:id/verify`

**Permission:** `manageUsers`

**Description:** Verify user's identity and activate account

### Delete User Permanently

**Endpoint:** `DELETE /api/super-admin/users/:id`

**Permission:** `manageUsers` + **Master Admin Only**

**⚠️ WARNING:** This is a permanent action and cannot be undone!

---

## Provider Management

### Get All Providers

**Endpoint:** `GET /api/super-admin/providers`

**Permission:** `manageProviders`

**Query Parameters:**
- `verified` - Filter by verification status (true/false)
- `status` - Filter by account status
- `search` - Search by name, license number
- `page` - Page number
- `limit` - Results per page

### Verify Provider

**Endpoint:** `POST /api/super-admin/providers/:id/verify`

**Permission:** `manageProviders`

**Description:** Verify provider credentials and activate account

**Response:**

```json
{
  "success": true,
  "message": "Provider verified successfully",
  "data": {
    "_id": "6123...",
    "verification": {
      "isVerified": true,
      "verifiedAt": "2025-10-18T12:00:00.000Z",
      "verifiedBy": "admin-id"
    }
  }
}
```

---

## Transaction Management

### Get All Transactions

**Endpoint:** `GET /api/super-admin/transactions`

**Permission:** `manageTransactions`

**Query Parameters:**
- `status` - Filter by status (pending, completed, failed, etc.)
- `type` - Filter by type (payment, refund, deposit, etc.)
- `startDate` - Start date
- `endDate` - End date
- `page` - Page number
- `limit` - Results per page

### Reverse Transaction

**Endpoint:** `POST /api/super-admin/transactions/:id/reverse`

**Permission:** `manageTransactions`

**Body:**

```json
{
  "reason": "Fraudulent transaction - customer dispute"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Transaction reversed successfully",
  "data": {
    "transactionId": "TXN-123456",
    "status": "reversed",
    "reversedAt": "2025-10-18T12:00:00.000Z"
  }
}
```

---

## Sponsorship Management

### Get All Sponsorships

**Endpoint:** `GET /api/super-admin/sponsorships`

**Permission:** `manageSponsorships`

**Query Parameters:**
- `status` - Filter by status
- `type` - Filter by sponsorship type
- `page` - Page number
- `limit` - Results per page

---

## Audit & Logs

### Get Audit Logs

**Endpoint:** `GET /api/super-admin/audit-logs`

**Permission:** `auditLogs`

**Query Parameters:**
- `adminId` - Filter by admin who performed action
- `action` - Filter by action type
- `startDate` - Start date
- `endDate` - End date
- `page` - Page number
- `limit` - Results per page (default: 100)

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "action": "UPDATE_USER_STATUS",
      "targetModel": "User",
      "targetId": "user-id",
      "description": "Updated user status to suspended",
      "timestamp": "2025-10-18T12:00:00.000Z",
      "ip": "192.168.1.1",
      "adminId": "admin-id",
      "adminName": "John Doe",
      "adminEmail": "admin@anolahealth.com"
    }
  ],
  "pagination": {
    "total": 5000,
    "page": 1,
    "pages": 50
  }
}
```

---

## Admin Management (Master Admin Only)

### Get All Super Admins

**Endpoint:** `GET /api/super-admin/admins`

**Permission:** `createAdmins` + **Master Admin Only**

### Create New Super Admin

**Endpoint:** `POST /api/super-admin/admins`

**Permission:** `createAdmins` + **Master Admin Only**

**Body:**

```json
{
  "email": "newadmin@anolahealth.com",
  "password": "SecurePassword123!",
  "phone": "+250788123456",
  "profile": {
    "firstName": "Jane",
    "lastName": "Admin",
    "nationalId": "1234567890123456",
    "dateOfBirth": "1990-01-01",
    "country": "Rwanda"
  },
  "adminLevel": "super",
  "permissions": {
    "manageUsers": true,
    "manageProviders": true,
    "viewAnalytics": true
  },
  "department": "Customer Support",
  "employeeId": "EMP002"
}
```

### Update Admin Permissions

**Endpoint:** `PATCH /api/super-admin/admins/:id/permissions`

**Permission:** `createAdmins` + **Master Admin Only**

**Body:**

```json
{
  "permissions": {
    "manageTransactions": true,
    "manageSponsorships": true
  }
}
```

---

## Security Features

### 1. IP Whitelisting

Super admins can have IP restrictions configured. Add allowed IPs to the `allowedIPs` array in the admin document.

### 2. Action Logging

All administrative actions are automatically logged with:
- Action performed
- Target resource
- Timestamp
- IP address
- Admin details

### 3. Two-Factor Authentication

Super admins have 2FA enabled by default (`twoFactorRequired: true`)

### 4. Login History

All login attempts are tracked:
- Timestamp
- IP address
- User agent
- Location
- Success/failure status

---

## Error Responses

### Unauthorized (401)

```json
{
  "success": false,
  "message": "Authentication required"
}
```

### Forbidden (403)

```json
{
  "success": false,
  "message": "Super admin access required"
}
```

### Permission Denied (403)

```json
{
  "success": false,
  "message": "Permission denied: manageUsers required"
}
```

### Not Found (404)

```json
{
  "success": false,
  "message": "User not found"
}
```

### Internal Server Error (500)

```json
{
  "success": false,
  "message": "Failed to fetch users",
  "error": "Error details..."
}
```

---

## Best Practices

### 1. Use Appropriate Permissions

Grant only necessary permissions to each admin.

### 2. Regular Audit Reviews

Regularly review audit logs for suspicious activity.

### 3. Strong Passwords

Enforce strong passwords for all admin accounts (min 8 characters).

### 4. Enable 2FA

Always use two-factor authentication.

### 5. Limit Master Admins

Keep the number of Master Admins to a minimum.

### 6. Document Actions

Include descriptive reasons when taking actions (suspensions, deletions, etc.).

### 7. Monitor Transaction Reversals

Transaction reversals should be carefully reviewed and documented.

---

## Example Workflows

### Workflow 1: Verify New Provider

1. Get unverified providers:
   ```
   GET /api/super-admin/providers?verified=false
   ```

2. Review provider details:
   ```
   GET /api/super-admin/users/:providerId
   ```

3. Verify provider:
   ```
   POST /api/super-admin/providers/:providerId/verify
   ```

### Workflow 2: Handle Suspicious Transaction

1. Find transaction:
   ```
   GET /api/super-admin/transactions?transactionId=TXN-123
   ```

2. Review transaction details

3. Reverse if fraudulent:
   ```
   POST /api/super-admin/transactions/:id/reverse
   {
     "reason": "Fraudulent transaction - reported by user"
   }
   ```

4. Suspend related user:
   ```
   PATCH /api/super-admin/users/:userId/status
   {
     "status": "suspended",
     "reason": "Fraudulent activity"
   }
   ```

### Workflow 3: Create Department Admin

1. Master admin creates new admin:
   ```
   POST /api/super-admin/admins
   ```

2. Configure specific permissions for department

3. Provide credentials to new admin

4. Monitor initial activity through audit logs

---

## Support

For issues or questions:
- Check audit logs for troubleshooting
- Review error messages for specific guidance
- Ensure permissions are correctly configured

---

## Changelog

### Version 1.0.0 (2025-10-18)

- Initial super admin system
- Dashboard and analytics
- User management
- Provider verification
- Transaction management
- Audit logging
- Admin management
- Permission system
