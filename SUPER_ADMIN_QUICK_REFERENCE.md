# Super Admin Quick Reference

## Setup

```bash
# Create first super admin
npm run create-super-admin
```

## Authentication

```bash
# Login
POST /api/auth/login
{
  "email": "admin@anolahealth.com",
  "password": "your-password"
}

# Use token in all requests
Authorization: Bearer <token>
```

## Endpoints Cheat Sheet

### Dashboard & Analytics
| Endpoint | Method | Permission |
|----------|--------|------------|
| `/api/super-admin/dashboard` | GET | viewAnalytics |
| `/api/super-admin/statistics` | GET | viewAnalytics |

### User Management
| Endpoint | Method | Permission |
|----------|--------|------------|
| `/api/super-admin/users` | GET | manageUsers |
| `/api/super-admin/users/:id` | GET | manageUsers |
| `/api/super-admin/users/:id/status` | PATCH | manageUsers |
| `/api/super-admin/users/:id/verify` | POST | manageUsers |
| `/api/super-admin/users/:id` | DELETE | manageUsers + Master |

### Provider Management
| Endpoint | Method | Permission |
|----------|--------|------------|
| `/api/super-admin/providers` | GET | manageProviders |
| `/api/super-admin/providers/:id/verify` | POST | manageProviders |

### Transaction Management
| Endpoint | Method | Permission |
|----------|--------|------------|
| `/api/super-admin/transactions` | GET | manageTransactions |
| `/api/super-admin/transactions/:id/reverse` | POST | manageTransactions |

### Sponsorship Management
| Endpoint | Method | Permission |
|----------|--------|------------|
| `/api/super-admin/sponsorships` | GET | manageSponsorships |

### Audit & Logs
| Endpoint | Method | Permission |
|----------|--------|------------|
| `/api/super-admin/audit-logs` | GET | auditLogs |

### Admin Management (Master Only)
| Endpoint | Method | Permission |
|----------|--------|------------|
| `/api/super-admin/admins` | GET | createAdmins + Master |
| `/api/super-admin/admins` | POST | createAdmins + Master |
| `/api/super-admin/admins/:id/permissions` | PATCH | createAdmins + Master |

## Common Query Parameters

```
?page=1              - Page number
&limit=50            - Results per page
&status=active       - Filter by status
&userType=patient    - Filter by user type
&search=john         - Search query
&startDate=2025-01-01 - Start date filter
&endDate=2025-12-31  - End date filter
&verified=true       - Filter by verification status
```

## Permissions List

- ✅ `manageUsers` - User management
- ✅ `manageProviders` - Provider management
- ✅ `managePatients` - Patient management
- ✅ `manageSponsors` - Sponsor management
- ✅ `manageVendors` - Vendor management
- ✅ `manageTransactions` - Transaction management
- ✅ `manageAppointments` - Appointment access
- ✅ `manageMedicalRecords` - Medical records access
- ✅ `manageSponsorships` - Sponsorship management
- ✅ `manageWallets` - Wallet management
- ✅ `viewAnalytics` - Dashboard & analytics
- ✅ `systemSettings` - System settings
- ✅ `auditLogs` - Audit log access
- ✅ `createAdmins` - Admin management (Master only)

## Status Values

**Account Status:**
- `pending` - Awaiting verification
- `active` - Active account
- `inactive` - Temporarily inactive
- `suspended` - Suspended by admin
- `deleted` - Marked for deletion

**Transaction Status:**
- `pending` - Processing
- `processing` - In progress
- `completed` - Successful
- `failed` - Failed
- `cancelled` - Cancelled
- `reversed` - Reversed by admin

## Quick Actions

### Verify Provider
```bash
POST /api/super-admin/providers/:id/verify
```

### Suspend User
```bash
PATCH /api/super-admin/users/:id/status
{
  "status": "suspended",
  "reason": "Violation of terms"
}
```

### Reverse Transaction
```bash
POST /api/super-admin/transactions/:id/reverse
{
  "reason": "Fraudulent transaction"
}
```

### Create Admin
```bash
POST /api/super-admin/admins
{
  "email": "admin@example.com",
  "password": "SecurePass123!",
  "phone": "+250788123456",
  "profile": {
    "firstName": "Jane",
    "lastName": "Doe",
    "nationalId": "1234567890123456",
    "dateOfBirth": "1990-01-01",
    "country": "Rwanda"
  },
  "adminLevel": "super",
  "permissions": {
    "manageUsers": true,
    "viewAnalytics": true
  }
}
```

## Response Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized (not logged in)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Server Error

## Security Notes

⚠️ **Important:**
- Always use HTTPS in production
- Enable 2FA for all admins
- Regularly review audit logs
- Use strong passwords (min 8 chars)
- Limit Master Admin accounts
- Document all significant actions

## Troubleshooting

**403 Forbidden:**
- Check if logged in as super_admin
- Verify permission is granted
- Check IP whitelist (if configured)

**404 Not Found:**
- Verify resource ID is correct
- Check if resource was deleted

**500 Server Error:**
- Check server logs
- Verify database connection
- Check environment variables

## Support

- **Documentation:** `/SUPER_ADMIN_GUIDE.md`
- **API Docs:** `/api-docs`
- **Logs:** Check audit logs endpoint
