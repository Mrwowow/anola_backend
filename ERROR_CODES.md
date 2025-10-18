# Anola Health API - Error Code Reference

## Overview

This document provides a comprehensive reference for all HTTP status codes and error responses used in the Anola Health API.

## Error Response Format

All error responses follow this standard format:

```json
{
  "success": false,
  "message": "Human-readable error message",
  "error": "Detailed error information (in development)",
  "statusCode": 400
}
```

## HTTP Status Codes

### 2xx Success

| Code | Message | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource successfully created |
| 204 | No Content | Request successful, no content to return |

### 4xx Client Errors

| Code | Message | Description | Common Causes |
|------|---------|-------------|---------------|
| 400 | Bad Request | Invalid request format or parameters | Missing required fields, invalid data types, malformed JSON |
| 401 | Unauthorized | Authentication required or failed | Missing/invalid JWT token, expired token |
| 403 | Forbidden | Insufficient permissions | Wrong user role, accessing another user's resources |
| 404 | Not Found | Resource not found | Invalid ID, deleted resource |
| 409 | Conflict | Resource conflict | Duplicate email, appointment slot taken |
| 422 | Unprocessable Entity | Validation failed | Email format invalid, password too short |
| 423 | Locked | Account locked | Too many failed login attempts |
| 429 | Too Many Requests | Rate limit exceeded | Too many API requests in short time |

### 5xx Server Errors

| Code | Message | Description | Common Causes |
|------|---------|-------------|---------------|
| 500 | Internal Server Error | Unexpected server error | Database error, uncaught exception |
| 502 | Bad Gateway | Invalid upstream response | Payment gateway error |
| 503 | Service Unavailable | Service temporarily unavailable | Database down, maintenance mode |
| 504 | Gateway Timeout | Upstream service timeout | External API timeout |

## Common Error Scenarios

### Authentication Errors

#### 401 - Missing Token
```json
{
  "success": false,
  "message": "No token provided",
  "statusCode": 401
}
```

#### 401 - Invalid Token
```json
{
  "success": false,
  "message": "Invalid token",
  "statusCode": 401
}
```

#### 401 - Expired Token
```json
{
  "success": false,
  "message": "Token has expired",
  "statusCode": 401
}
```

#### 423 - Account Locked
```json
{
  "success": false,
  "message": "Account locked due to multiple failed login attempts. Please try again in 30 minutes or reset your password.",
  "statusCode": 423
}
```

### Validation Errors

#### 400 - Missing Required Field
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    }
  ],
  "statusCode": 400
}
```

#### 422 - Invalid Email Format
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Please provide a valid email address"
    }
  ],
  "statusCode": 422
}
```

#### 422 - Password Too Short
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "password",
      "message": "Password must be at least 8 characters long"
    }
  ],
  "statusCode": 422
}
```

### Resource Errors

#### 404 - Resource Not Found
```json
{
  "success": false,
  "message": "Appointment not found",
  "statusCode": 404
}
```

#### 409 - Duplicate Resource
```json
{
  "success": false,
  "message": "User with this email already exists",
  "statusCode": 409
}
```

#### 409 - Appointment Conflict
```json
{
  "success": false,
  "message": "This appointment slot is no longer available",
  "statusCode": 409
}
```

### Permission Errors

#### 403 - Insufficient Permissions
```json
{
  "success": false,
  "message": "You do not have permission to access this resource",
  "statusCode": 403
}
```

#### 403 - Wrong User Role
```json
{
  "success": false,
  "message": "Only providers can create medical records",
  "statusCode": 403
}
```

### Payment Errors

#### 400 - Insufficient Funds
```json
{
  "success": false,
  "message": "Insufficient funds in wallet",
  "statusCode": 400
}
```

#### 402 - Payment Required
```json
{
  "success": false,
  "message": "Payment required to complete this action",
  "statusCode": 402
}
```

#### 502 - Payment Gateway Error
```json
{
  "success": false,
  "message": "Payment processing failed. Please try again.",
  "error": "Stripe API error",
  "statusCode": 502
}
```

### Rate Limiting

#### 429 - Rate Limit Exceeded
```json
{
  "error": "Too many requests from this IP, please try again later.",
  "retryAfter": 900
}
```

Headers included:
- `X-RateLimit-Limit`: Maximum requests per window
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Time when limit resets (Unix timestamp)

## Endpoint-Specific Errors

### Authentication Endpoints

#### POST /api/auth/register

| Code | Scenario |
|------|----------|
| 201 | User registered successfully |
| 400 | Invalid input data |
| 409 | Email already exists |
| 422 | Validation failed (weak password, invalid email) |

#### POST /api/auth/login

| Code | Scenario |
|------|----------|
| 200 | Login successful |
| 401 | Invalid credentials |
| 423 | Account locked |

#### POST /api/auth/refresh

| Code | Scenario |
|------|----------|
| 200 | Token refreshed |
| 401 | Invalid or expired refresh token |

### Appointment Endpoints

#### POST /api/appointments

| Code | Scenario |
|------|----------|
| 201 | Appointment created |
| 400 | Invalid date/time, provider not available |
| 401 | User not authenticated |
| 404 | Provider not found |
| 409 | Time slot already booked |

#### PUT /api/appointments/{id}

| Code | Scenario |
|------|----------|
| 200 | Appointment updated |
| 400 | Invalid update data |
| 403 | Not your appointment |
| 404 | Appointment not found |
| 409 | New time slot not available |

### Wallet/Transaction Endpoints

#### POST /api/wallets/deposit

| Code | Scenario |
|------|----------|
| 200 | Deposit successful |
| 400 | Invalid amount, payment method declined |
| 401 | User not authenticated |
| 502 | Payment gateway error |

#### POST /api/transactions

| Code | Scenario |
|------|----------|
| 201 | Transaction created |
| 400 | Insufficient funds, invalid recipient |
| 401 | User not authenticated |
| 404 | Recipient not found |

### Medical Record Endpoints

#### POST /api/medical-records

| Code | Scenario |
|------|----------|
| 201 | Medical record created |
| 400 | Invalid data |
| 403 | Only providers can create records |
| 404 | Patient not found |

#### PUT /api/medical-records/{id}

| Code | Scenario |
|------|----------|
| 200 | Record updated |
| 403 | Not the provider who created this record |
| 404 | Record not found |

## Best Practices for Error Handling

### Client-Side Handling

```javascript
try {
  const response = await fetch('/api/appointments', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(appointmentData)
  });

  if (!response.ok) {
    const error = await response.json();

    switch (response.status) {
      case 401:
        // Redirect to login or refresh token
        break;
      case 403:
        // Show permission error
        break;
      case 409:
        // Show conflict message (slot taken)
        break;
      case 429:
        // Show rate limit message, wait before retry
        break;
      default:
        // Show generic error
    }
  }

  const data = await response.json();
  // Handle success
} catch (error) {
  // Handle network errors
}
```

### Retry Logic

For 5xx errors and 429 (rate limiting), implement exponential backoff:

```javascript
async function fetchWithRetry(url, options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);

      if (response.status >= 500 || response.status === 429) {
        const delay = Math.pow(2, i) * 1000; // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      return response;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
    }
  }
}
```

### Token Refresh Flow

When receiving 401 errors, attempt token refresh:

```javascript
async function apiCall(url, options) {
  let response = await fetch(url, options);

  if (response.status === 401) {
    // Try to refresh token
    const newToken = await refreshAccessToken();

    if (newToken) {
      // Retry with new token
      options.headers.Authorization = `Bearer ${newToken}`;
      response = await fetch(url, options);
    } else {
      // Redirect to login
      window.location.href = '/login';
    }
  }

  return response;
}
```

## Support

For error codes not listed here or unexpected errors:
- Check API logs in development mode
- Contact support at support@anolahealth.com
- Report bugs at [GitHub Issues](https://github.com/anola-health/backend/issues)
