# ✅ Correct API Routes Reference

## 🎯 Important Note

**All Super Admin routes use the prefix:** `/api/super-admin/`

**NOT** `/api/admin/` (this was a documentation error in ADMIN_BACKEND_API_GUIDE.md)

---

## 🔐 Authentication

### Login (Super Admin)
```
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "admin@anolalinks.com",
  "password": "Possible@2025"
}
```

---

## 📊 Dashboard & Analytics

### Dashboard Stats
```
GET /api/super-admin/dashboard
GET /api/super-admin/statistics
```

### User Distribution
```
GET /api/super-admin/dashboard/user-distribution
```

### Recent Activity
```
GET /api/super-admin/dashboard/activity?limit=10
```

### System Health
```
GET /api/super-admin/dashboard/system-health
```

---

## 👥 User Management

### List All Users
```
GET /api/super-admin/users?page=1&limit=10&type=all&status=all&search=
```

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)
- `type` - User type filter: `all`, `patient`, `provider`, `vendor`, `sponsor`
- `status` - Status filter: `all`, `active`, `pending`, `inactive`, `suspended`
- `search` - Search query (searches name, email, phone)
- `sortBy` - Field to sort by (default: `createdAt`)
- `sortOrder` - Sort order: `asc`, `desc` (default: `desc`)

### Get User by ID
```
GET /api/super-admin/users/:id
```

### Update User Status
```
PATCH /api/super-admin/users/:id/status
```

**Request Body:**
```json
{
  "status": "active",
  "reason": "Optional reason",
  "notifyUser": true
}
```

### Verify User
```
POST /api/super-admin/users/:id/verify
```

### Delete User
```
DELETE /api/super-admin/users/:id
```

---

## 📈 Analytics

### Revenue Analytics
```
GET /api/super-admin/analytics/revenue?period=6months
```

**Period options:** `7days`, `30days`, `3months`, `6months`, `1year`

### User Growth
```
GET /api/super-admin/analytics/users?period=monthly
```

**Period options:** `weekly`, `monthly`

### Top Performers
```
GET /api/super-admin/analytics/top-performers?type=all&limit=10
```

**Type options:** `all`, `provider`, `vendor`

### Platform Metrics
```
GET /api/super-admin/analytics/metrics
```

### Geographic Distribution
```
GET /api/super-admin/analytics/geographic
```

---

## 💰 Transactions

### List Transactions
```
GET /api/super-admin/transactions?page=1&limit=10&type=all&status=all
```

**Query Parameters:**
- `page`, `limit` - Pagination
- `type` - Transaction type: `all`, `appointment`, `product`, `sponsorship`, `withdrawal`, `deposit`, `refund`
- `status` - Status: `all`, `completed`, `pending`, `failed`, `refunded`
- `search` - Search by transaction ID
- `startDate`, `endDate` - Date range filter

### Get Transaction Details
```
GET /api/super-admin/transactions/:id
```

### Reverse Transaction
```
POST /api/super-admin/transactions/:id/reverse
```

---

## ✅ Approvals

### List Approvals
```
GET /api/super-admin/approvals?type=all&priority=all&status=pending&page=1&limit=20
```

**Query Parameters:**
- `type` - Approval type: `all`, `provider`, `vendor`, `sponsor`, `product`
- `priority` - Priority: `all`, `high`, `medium`, `low`
- `status` - Status: `all`, `pending`, `approved`, `rejected`
- `page`, `limit` - Pagination

### Get Approval Details
```
GET /api/super-admin/approvals/:id
```

### Approve Application
```
POST /api/super-admin/approvals/:id/approve
```

**Request Body:**
```json
{
  "notes": "Optional approval notes",
  "notifyApplicant": true
}
```

### Reject Application
```
POST /api/super-admin/approvals/:id/reject
```

**Request Body:**
```json
{
  "reason": "Reason for rejection",
  "notifyApplicant": true
}
```

---

## 🏥 HMO Plans Management (NEW!)

### List All HMO Plans (Admin)
```
GET /api/super-admin/hmo-plans?page=1&limit=20&status=all&category=all&planType=all
```

**Query Parameters:**
- `page`, `limit` - Pagination
- `status` - Status: `all`, `active`, `inactive`, `suspended`, `discontinued`
- `category` - Category: `all`, `basic`, `standard`, `premium`, `platinum`
- `planType` - Plan type: `all`, `individual`, `family`, `corporate`, `group`
- `search` - Search by name, plan code, provider name
- `isAvailableForNewEnrollment` - Filter by enrollment availability: `true`, `false`
- `sortBy`, `sortOrder` - Sorting options

### Get HMO Plan Statistics
```
GET /api/super-admin/hmo-plans/stats/overview
```

### Get HMO Plan Details
```
GET /api/super-admin/hmo-plans/:id
```

### Create HMO Plan
```
POST /api/super-admin/hmo-plans
```

**Request Body Example:**
```json
{
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
      "individual": 150,
      "family": 300
    },
    "currency": "USD"
  },
  "coverage": {
    "outpatientCare": {
      "covered": true,
      "copayment": 20,
      "coveragePercentage": 80
    }
  }
}
```

### Update HMO Plan
```
PUT /api/super-admin/hmo-plans/:id
```

### Update HMO Plan Status
```
PATCH /api/super-admin/hmo-plans/:id/status
```

**Request Body:**
```json
{
  "status": "active",
  "reason": "Optional reason for status change"
}
```

### Delete HMO Plan
```
DELETE /api/super-admin/hmo-plans/:id
```

**Request Body:**
```json
{
  "permanent": false
}
```

### Add Provider to Network
```
POST /api/super-admin/hmo-plans/:id/network/providers
```

**Request Body:**
```json
{
  "providerId": "user-id-here",
  "name": "Dr. John Doe",
  "specialty": "Cardiology",
  "location": "Lagos, Nigeria"
}
```

### Remove Provider from Network
```
DELETE /api/super-admin/hmo-plans/:id/network/providers/:providerId
```

---

## 🏥 HMO Enrollment (Public & Patient)

### Get Available Plans (Public - No Auth)
```
GET /api/hmo-plans?category=standard&planType=individual&minPrice=100&maxPrice=500
```

### Get Plan Details (Public - No Auth)
```
GET /api/hmo-plans/:id
```

### Compare Plans (Public - No Auth)
```
POST /api/hmo-plans/compare
```

**Request Body:**
```json
{
  "planIds": [
    "plan-id-1",
    "plan-id-2",
    "plan-id-3"
  ]
}
```

### Enroll in HMO Plan (Authenticated)
```
POST /api/hmo-enrollments
```

**Request Body:**
```json
{
  "planId": "plan-id-here",
  "enrollmentType": "individual",
  "paymentMethod": "card",
  "paymentPlan": "monthly"
}
```

### Get My Enrollments (Authenticated)
```
GET /api/hmo-enrollments/my-enrollments?status=active
```

### Get Enrollment Details (Authenticated)
```
GET /api/hmo-enrollments/:id
```

### Update Enrollment (Authenticated)
```
PUT /api/hmo-enrollments/:id
```

### Cancel Enrollment (Authenticated)
```
POST /api/hmo-enrollments/:id/cancel
```

**Request Body:**
```json
{
  "reason": "Switching to employer insurance",
  "effectiveDate": "2025-02-01"
}
```

### Renew Enrollment (Authenticated)
```
POST /api/hmo-enrollments/:id/renew
```

### Get Enrollment Claims (Authenticated)
```
GET /api/hmo-enrollments/:id/claims
```

### Download Membership Card (Authenticated)
```
GET /api/hmo-enrollments/:id/card
```

---

## 👨‍⚕️ Provider Management

### Get All Providers
```
GET /api/super-admin/providers
```

### Verify Provider
```
POST /api/super-admin/providers/:id/verify
```

---

## 💼 Sponsorship Management

### Get All Sponsorships
```
GET /api/super-admin/sponsorships
```

---

## 📝 Audit Logs

### Get Audit Logs
```
GET /api/super-admin/audit-logs
```

---

## 👑 Admin Management (Master Admin Only)

### Get All Super Admins
```
GET /api/super-admin/admins
```

### Create Super Admin
```
POST /api/super-admin/admins
```

**Request Body:**
```json
{
  "email": "newadmin@example.com",
  "password": "SecurePassword123!",
  "profile": {
    "firstName": "John",
    "lastName": "Doe"
  },
  "permissions": {
    "viewAnalytics": true,
    "manageUsers": true,
    "manageProviders": false,
    "manageTransactions": true,
    "manageSponsorships": true,
    "auditLogs": true,
    "createAdmins": false
  }
}
```

### Update Admin Permissions
```
PATCH /api/super-admin/admins/:id/permissions
```

---

## 🔑 Authentication Headers

For all **authenticated endpoints**, include:

```
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json
```

**Example:**
```bash
curl -X GET "https://anola-backend.vercel.app/api/super-admin/users?page=1&limit=10" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json"
```

---

## 📍 Base URLs

### Production
```
https://anola-backend.vercel.app
```

### Local Development
```
http://localhost:3000
```

---

## ⚡ Quick Test Commands

### 1. Login as Super Admin
```bash
curl -X POST https://anola-backend.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@anolalinks.com",
    "password": "Possible@2025"
  }'
```

### 2. Get Dashboard (replace TOKEN)
```bash
TOKEN="your-token-here"

curl -X GET "https://anola-backend.vercel.app/api/super-admin/dashboard" \
  -H "Authorization: Bearer $TOKEN"
```

### 3. List Users
```bash
curl -X GET "https://anola-backend.vercel.app/api/super-admin/users?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN"
```

### 4. Get HMO Plans (Public - No Auth)
```bash
curl -X GET "https://anola-backend.vercel.app/api/hmo-plans"
```

### 5. Get HMO Plans (Admin - With Auth)
```bash
curl -X GET "https://anola-backend.vercel.app/api/super-admin/hmo-plans" \
  -H "Authorization: Bearer $TOKEN"
```

---

## ❌ Common Errors

### Error: Route not found
**Problem:** Using `/api/admin/` instead of `/api/super-admin/`

**Solution:** Always use `/api/super-admin/` prefix for admin endpoints

### Error: Unauthorized
**Problem:** Missing or invalid token

**Solution:** Login first and include `Authorization: Bearer TOKEN` header

### Error: Forbidden
**Problem:** Insufficient permissions or not a super admin

**Solution:** Ensure you're logged in with super admin account

---

## 📚 Documentation Files

1. **[CORRECT_API_ROUTES.md](CORRECT_API_ROUTES.md)** - This file (Quick reference)
2. **[HMO_PUBLIC_API_GUIDE.md](HMO_PUBLIC_API_GUIDE.md)** - Complete HMO API guide
3. **[ADMIN_BACKEND_API_GUIDE.md](ADMIN_BACKEND_API_GUIDE.md)** - Admin API guide (some routes need prefix correction)
4. **[SUPER_ADMIN_GUIDE.md](SUPER_ADMIN_GUIDE.md)** - Super Admin specific guide
5. **[QUICK_START.md](QUICK_START.md)** - Quick start guide

---

**Last Updated:** January 2025
**Version:** 1.0.0

✅ All routes listed here are **tested and working** on the production server.
