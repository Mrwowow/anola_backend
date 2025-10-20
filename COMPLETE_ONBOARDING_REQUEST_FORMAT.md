# Complete Onboarding Request Format

## Endpoint
```
POST /api/providers/onboarding/complete
```

## Headers
```
Content-Type: application/json
Authorization: Bearer <sessionToken>
```

## Prerequisites
✅ Must have completed Step 1 (Basic Information)
✅ Must have completed Step 2 (Professional Information)
✅ Must have completed Step 3 (Practice Information)
✅ Session must be valid (not expired - 30 minute limit)

## Required Fields
All fields are **required**:
- `password` (string) - Must meet strength requirements
- `confirmPassword` (string) - Must match password
- `termsAccepted` (boolean) - Must be `true`
- `privacyPolicyAccepted` (boolean) - Must be `true`
- `hipaaComplianceAccepted` (boolean) - Must be `true`

## Complete Request Body

```json
{
  "password": "SecurePass123!",
  "confirmPassword": "SecurePass123!",
  "termsAccepted": true,
  "privacyPolicyAccepted": true,
  "hipaaComplianceAccepted": true
}
```

## Field Details

### password (Required)
**Type:** String
**Description:** Provider's account password

**Password Requirements:**
- Minimum 8 characters
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one number (0-9)
- At least one special character (@$!%*?&)

**Valid Examples:**
- ✅ `"SecurePass123!"`
- ✅ `"MyP@ssw0rd"`
- ✅ `"Health2024$"`
- ✅ `"Provider@123"`

**Invalid Examples:**
- ❌ `"password"` - No uppercase, number, or special char
- ❌ `"PASSWORD123"` - No lowercase or special char
- ❌ `"Pass123"` - Too short (less than 8 chars)
- ❌ `"Password123"` - No special character
- ❌ `"Password!"` - No number

---

### confirmPassword (Required)
**Type:** String
**Description:** Must exactly match the password field

**Example:** `"SecurePass123!"`

**Validation:**
- Must be identical to `password`
- Case-sensitive match required

---

### termsAccepted (Required)
**Type:** Boolean
**Description:** Acceptance of Terms of Service
**Must be:** `true`

**Example:** `true`

**Note:** Setting this to `false` or omitting it will result in validation error

---

### privacyPolicyAccepted (Required)
**Type:** Boolean
**Description:** Acceptance of Privacy Policy
**Must be:** `true`

**Example:** `true`

**Note:** Setting this to `false` or omitting it will result in validation error

---

### hipaaComplianceAccepted (Required)
**Type:** Boolean
**Description:** Acceptance of HIPAA Compliance requirements
**Must be:** `true`

**Example:** `true`

**Note:** Healthcare providers must accept HIPAA compliance. Setting this to `false` or omitting it will result in validation error

---

## Success Response (201 Created)

```json
{
  "success": true,
  "message": "Provider registration completed successfully",
  "provider": {
    "providerId": "68f578dbdd1daba3cae716c2",
    "providerCode": "PROV-F7E78E7F",
    "email": "provider@example.com",
    "status": "pending",
    "createdAt": "2025-10-19T23:48:43.455Z"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "redirectUrl": "/dashboard/provider"
}
```

### Response Fields

**provider Object:**
- `providerId` - Unique MongoDB ID for the provider
- `providerCode` - Unique provider code (format: PROV-XXXXXXXX)
- `email` - Provider's email address
- `status` - Account status (initially "pending" awaiting admin verification)
- `createdAt` - Timestamp of account creation

**Authentication Tokens:**
- `accessToken` - JWT access token (expires in 15 minutes)
- `refreshToken` - JWT refresh token (expires in 7 days)

**Navigation:**
- `redirectUrl` - Suggested redirect path for frontend

---

## Error Responses

### 400 - Password Required
```json
{
  "success": false,
  "message": "Password required"
}
```
**Cause:** Missing `password` or `confirmPassword` field

---

### 400 - Passwords Do Not Match
```json
{
  "success": false,
  "message": "Passwords do not match"
}
```
**Cause:** `password` and `confirmPassword` fields are different

---

### 400 - Password Strength
```json
{
  "success": false,
  "message": "Password must be at least 8 characters with uppercase, lowercase, number, and special character"
}
```
**Cause:** Password doesn't meet strength requirements

---

### 400 - Terms Not Accepted
```json
{
  "success": false,
  "message": "Must accept terms, privacy policy, and HIPAA compliance"
}
```
**Cause:** One or more of `termsAccepted`, `privacyPolicyAccepted`, or `hipaaComplianceAccepted` is `false` or missing

---

### 400 - Previous Steps Not Completed
```json
{
  "success": false,
  "message": "Complete all previous steps first"
}
```
**Cause:** Step 1, 2, or 3 not completed in this session

---

### 401 - Session Required
```json
{
  "success": false,
  "message": "Session token required"
}
```
**Cause:** Missing `Authorization` header

---

### 401 - Invalid or Expired Session
```json
{
  "success": false,
  "message": "Invalid or expired session"
}
```
**Cause:** Session token is invalid or expired (sessions expire after 30 minutes)

---

### 409 - Email Already Exists
```json
{
  "success": false,
  "message": "Email already registered"
}
```
**Cause:** Email from Step 1 is already registered in the system

---

### 500 - Registration Failed
```json
{
  "success": false,
  "message": "Failed to complete registration",
  "error": "Error details..."
}
```
**Cause:** Server error during provider account creation

---

## Complete Examples

### Example 1: Basic Request
```json
{
  "password": "SecurePass123!",
  "confirmPassword": "SecurePass123!",
  "termsAccepted": true,
  "privacyPolicyAccepted": true,
  "hipaaComplianceAccepted": true
}
```

### Example 2: Strong Password
```json
{
  "password": "MyH3@lthP@ss2024!",
  "confirmPassword": "MyH3@lthP@ss2024!",
  "termsAccepted": true,
  "privacyPolicyAccepted": true,
  "hipaaComplianceAccepted": true
}
```

---

## cURL Example

```bash
# Replace YOUR_SESSION_TOKEN with the token from /init endpoint
SESSION_TOKEN="your_session_token_here"

curl -X POST "https://anola-backend.vercel.app/api/providers/onboarding/complete" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SESSION_TOKEN" \
  -d '{
    "password": "SecurePass123!",
    "confirmPassword": "SecurePass123!",
    "termsAccepted": true,
    "privacyPolicyAccepted": true,
    "hipaaComplianceAccepted": true
  }'
```

---

## JavaScript/Fetch Example

```javascript
const sessionToken = 'YOUR_SESSION_TOKEN_FROM_INIT';

const completeData = {
  password: 'SecurePass123!',
  confirmPassword: 'SecurePass123!',
  termsAccepted: true,
  privacyPolicyAccepted: true,
  hipaaComplianceAccepted: true
};

try {
  const response = await fetch('https://anola-backend.vercel.app/api/providers/onboarding/complete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${sessionToken}`
    },
    body: JSON.stringify(completeData)
  });

  const result = await response.json();

  if (result.success) {
    console.log('✅ Registration completed!');
    console.log('Provider ID:', result.provider.providerId);
    console.log('Provider Code:', result.provider.providerCode);
    console.log('Access Token:', result.accessToken);

    // Store tokens securely
    localStorage.setItem('accessToken', result.accessToken);
    localStorage.setItem('refreshToken', result.refreshToken);

    // Redirect to provider dashboard
    window.location.href = result.redirectUrl;
  } else {
    console.error('❌ Registration failed:', result.message);
  }
} catch (error) {
  console.error('❌ Request failed:', error);
}
```

---

## React/TypeScript Example

```typescript
import { useState } from 'react';

interface CompleteOnboardingData {
  password: string;
  confirmPassword: string;
  termsAccepted: boolean;
  privacyPolicyAccepted: boolean;
  hipaaComplianceAccepted: boolean;
}

interface CompleteOnboardingResponse {
  success: boolean;
  message: string;
  provider?: {
    providerId: string;
    providerCode: string;
    email: string;
    status: string;
    createdAt: string;
  };
  accessToken?: string;
  refreshToken?: string;
  redirectUrl?: string;
}

function CompleteOnboardingForm({ sessionToken }: { sessionToken: string }) {
  const [formData, setFormData] = useState<CompleteOnboardingData>({
    password: '',
    confirmPassword: '',
    termsAccepted: false,
    privacyPolicyAccepted: false,
    hipaaComplianceAccepted: false
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        'https://anola-backend.vercel.app/api/providers/onboarding/complete',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionToken}`
          },
          body: JSON.stringify(formData)
        }
      );

      const result: CompleteOnboardingResponse = await response.json();

      if (result.success && result.accessToken) {
        // Store tokens
        localStorage.setItem('accessToken', result.accessToken);
        localStorage.setItem('refreshToken', result.refreshToken!);

        // Redirect to dashboard
        window.location.href = result.redirectUrl || '/dashboard/provider';
      } else {
        setError(result.message || 'Registration failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="password"
        placeholder="Password"
        value={formData.password}
        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        required
      />

      <input
        type="password"
        placeholder="Confirm Password"
        value={formData.confirmPassword}
        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
        required
      />

      <label>
        <input
          type="checkbox"
          checked={formData.termsAccepted}
          onChange={(e) => setFormData({ ...formData, termsAccepted: e.target.checked })}
          required
        />
        I accept the Terms of Service
      </label>

      <label>
        <input
          type="checkbox"
          checked={formData.privacyPolicyAccepted}
          onChange={(e) => setFormData({ ...formData, privacyPolicyAccepted: e.target.checked })}
          required
        />
        I accept the Privacy Policy
      </label>

      <label>
        <input
          type="checkbox"
          checked={formData.hipaaComplianceAccepted}
          onChange={(e) => setFormData({ ...formData, hipaaComplianceAccepted: e.target.checked })}
          required
        />
        I accept HIPAA Compliance requirements
      </label>

      {error && <div className="error">{error}</div>}

      <button type="submit" disabled={loading}>
        {loading ? 'Completing...' : 'Complete Registration'}
      </button>
    </form>
  );
}
```

---

## Common Mistakes to Avoid

### ❌ Wrong: Missing Authorization Header
```javascript
fetch('/api/providers/onboarding/complete', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
    // Missing Authorization header!
  },
  body: JSON.stringify(data)
});
```

### ✅ Correct: Include Authorization Header
```javascript
fetch('/api/providers/onboarding/complete', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${sessionToken}`  // ✅
  },
  body: JSON.stringify(data)
});
```

---

### ❌ Wrong: Weak Password
```json
{
  "password": "password123",
  "confirmPassword": "password123"
}
```

### ✅ Correct: Strong Password
```json
{
  "password": "SecurePass123!",
  "confirmPassword": "SecurePass123!"
}
```

---

### ❌ Wrong: Boolean as String
```json
{
  "termsAccepted": "true",  // String!
  "privacyPolicyAccepted": "true",
  "hipaaComplianceAccepted": "true"
}
```

### ✅ Correct: Boolean Values
```json
{
  "termsAccepted": true,  // Boolean
  "privacyPolicyAccepted": true,
  "hipaaComplianceAccepted": true
}
```

---

### ❌ Wrong: Setting Acceptance to False
```json
{
  "password": "SecurePass123!",
  "confirmPassword": "SecurePass123!",
  "termsAccepted": false,  // Will fail!
  "privacyPolicyAccepted": true,
  "hipaaComplianceAccepted": true
}
```

### ✅ Correct: All Acceptances True
```json
{
  "password": "SecurePass123!",
  "confirmPassword": "SecurePass123!",
  "termsAccepted": true,  // ✅
  "privacyPolicyAccepted": true,
  "hipaaComplianceAccepted": true
}
```

---

### ❌ Wrong: Mismatched Passwords
```json
{
  "password": "SecurePass123!",
  "confirmPassword": "SecurePass456!"  // Different!
}
```

### ✅ Correct: Matching Passwords
```json
{
  "password": "SecurePass123!",
  "confirmPassword": "SecurePass123!"  // Identical
}
```

---

## After Registration

Once registration is complete, you will receive:

1. **Provider ID** - Use for API calls
2. **Provider Code** - Unique identifier (PROV-XXXXXXXX)
3. **Access Token** - For authenticated API requests (15 min expiry)
4. **Refresh Token** - To get new access tokens (7 day expiry)

### Account Status

Your account will be created with status `"pending"`. This means:
- ✅ Account is created
- ✅ You can login
- ⏳ Awaiting admin verification
- ⏳ Some features may be restricted until verified

### Next Steps

1. **Login** with your email and password
2. **Wait for verification** by super admin
3. **Complete profile** if needed
4. **Start managing** appointments and services

---

## Using Authentication Tokens

### Making Authenticated Requests

```javascript
const accessToken = 'YOUR_ACCESS_TOKEN';

// Example: Get provider profile
const response = await fetch(
  `https://anola-backend.vercel.app/api/providers/${providerId}/profile`,
  {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  }
);
```

### Refreshing Expired Token

```javascript
const refreshToken = 'YOUR_REFRESH_TOKEN';

const response = await fetch(
  'https://anola-backend.vercel.app/api/auth/refresh-token',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ refreshToken })
  }
);

const { accessToken: newAccessToken } = await response.json();
```

---

## Security Best Practices

### Password Storage
- ❌ Never log passwords
- ❌ Never store passwords in plain text
- ❌ Never send passwords via email
- ✅ Use secure password managers
- ✅ Store tokens securely (e.g., httpOnly cookies)

### Token Management
- ✅ Store access token in memory or secure storage
- ✅ Store refresh token in httpOnly cookie (if possible)
- ✅ Clear tokens on logout
- ✅ Refresh access token before expiry
- ❌ Don't store tokens in localStorage (XSS vulnerable)

### Frontend Implementation
```javascript
// Good: Store in memory
let accessToken = null;

// Good: Store refresh token in httpOnly cookie (server-side)
// OR encrypted localStorage with additional security measures

// Bad: Plain text in localStorage
localStorage.setItem('password', password); // ❌ NEVER DO THIS
```

---

## Complete Flow Example

```javascript
async function completeProviderOnboarding() {
  // Step 1: Initialize
  const initResponse = await fetch(
    'https://anola-backend.vercel.app/api/providers/onboarding/init',
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }
  );
  const { sessionToken } = await initResponse.json();

  // Step 2: Submit Step 1 (Basic Info)
  await fetch('https://anola-backend.vercel.app/api/providers/onboarding/step1', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${sessionToken}`
    },
    body: JSON.stringify({ /* step1 data */ })
  });

  // Step 3: Submit Step 2 (Professional Info)
  await fetch('https://anola-backend.vercel.app/api/providers/onboarding/step2', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${sessionToken}`
    },
    body: JSON.stringify({ /* step2 data */ })
  });

  // Step 4: Submit Step 3 (Practice Info)
  await fetch('https://anola-backend.vercel.app/api/providers/onboarding/step3', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${sessionToken}`
    },
    body: JSON.stringify({ /* step3 data */ })
  });

  // Step 5: Complete Onboarding
  const completeResponse = await fetch(
    'https://anola-backend.vercel.app/api/providers/onboarding/complete',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionToken}`
      },
      body: JSON.stringify({
        password: 'SecurePass123!',
        confirmPassword: 'SecurePass123!',
        termsAccepted: true,
        privacyPolicyAccepted: true,
        hipaaComplianceAccepted: true
      })
    }
  );

  const result = await completeResponse.json();

  if (result.success) {
    console.log('✅ Registration complete!');
    console.log('Provider Code:', result.provider.providerCode);
    return result;
  }
}
```

---

## Testing

### Test Credentials
```json
{
  "password": "TestPass123!",
  "confirmPassword": "TestPass123!",
  "termsAccepted": true,
  "privacyPolicyAccepted": true,
  "hipaaComplianceAccepted": true
}
```

### Validation Tests

**Test 1: Valid Request** ✅
- All fields present and valid
- Expected: 201 Created

**Test 2: Weak Password** ❌
- Password: "password"
- Expected: 400 Bad Request

**Test 3: Password Mismatch** ❌
- password ≠ confirmPassword
- Expected: 400 Bad Request

**Test 4: Terms Not Accepted** ❌
- termsAccepted: false
- Expected: 400 Bad Request

**Test 5: Expired Session** ❌
- Session older than 30 minutes
- Expected: 401 Unauthorized

---

## Troubleshooting

### Issue: "Session token required"
**Solution:** Add Authorization header with Bearer token

### Issue: "Invalid or expired session"
**Solution:**
- Check if 30 minutes have passed since /init
- Get new session token by calling /init again
- Complete all steps within 30 minutes

### Issue: "Passwords do not match"
**Solution:** Ensure password and confirmPassword are identical (case-sensitive)

### Issue: "Password must be at least 8 characters..."
**Solution:** Use password with:
- 8+ characters
- Uppercase + lowercase
- Number
- Special character (@$!%*?&)

### Issue: "Must accept terms, privacy policy, and HIPAA compliance"
**Solution:** All three boolean fields must be `true`

### Issue: "Complete all previous steps first"
**Solution:** Ensure you've completed steps 1, 2, and 3 in order

---

## API Documentation

Full API documentation available at:
- **Swagger UI:** https://anola-backend.vercel.app/api-docs
- **JSON Spec:** https://anola-backend.vercel.app/api-spec.json
- **Step 3 Format:** STEP3_REQUEST_FORMAT.md

## Related Endpoints

- `POST /api/providers/onboarding/init` - Initialize session
- `POST /api/providers/onboarding/step1` - Basic information
- `POST /api/providers/onboarding/step2` - Professional information
- `POST /api/providers/onboarding/step3` - Practice information
- `GET /api/providers/onboarding/status` - Check progress
- `POST /api/auth/login` - Login after registration
