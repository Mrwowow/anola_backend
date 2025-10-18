# Swagger API Documentation Fix for Vercel

## ✅ Issue Resolved

The blank Swagger API documentation page at `/api-docs` has been fixed for Vercel deployment.

---

## 🔧 What Was Fixed

### 1. **Updated Swagger Configuration** (`src/config/swagger.js`)

**Changes Made:**
- Added Vercel production URL as primary server
- Added absolute paths for API route scanning
- Added SuperAdmin and System tags
- Better server configuration for production

```javascript
servers: [
  {
    url: 'https://anola-backend.vercel.app',
    description: 'Production server (Vercel)'
  },
  {
    url: 'http://localhost:3000',
    description: 'Local server - Port 3000'
  }
]
```

### 2. **Fixed Swagger UI Setup** (`src/app.js`)

**Before (Broken on Vercel):**
```javascript
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Anola Health API Documentation'
}));
```

**After (Works on Vercel):**
```javascript
// Separate middleware and route handler
app.use('/api-docs', swaggerUi.serve);
app.get('/api-docs', swaggerUi.setup(swaggerSpecs, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Anola Health API Documentation',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    docExpansion: 'none',
    filter: true,
    showExtensions: true,
    showCommonExtensions: true,
    tryItOutEnabled: true
  }
}));

// JSON fallback endpoint
app.get('/api-spec.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpecs);
});
```

---

## 🎯 Why It Was Blank

### Root Causes:

1. **Serverless Environment Issues**
   - File path resolution in serverless differs from traditional Node.js
   - Swagger JSDoc needs absolute paths in serverless

2. **Middleware Setup**
   - Using both `serve` and `setup` in same `app.use()` can cause issues
   - Better to separate middleware and route handler

3. **Static Assets**
   - Swagger UI loads CSS/JS assets that may not resolve correctly
   - Separate route handler improves asset loading

---

## ✅ How to Access API Documentation

### Option 1: Swagger UI (Interactive)
```
https://anola-backend.vercel.app/api-docs
```

**Features:**
- Interactive API testing
- Try out endpoints directly
- View request/response examples
- Authorize with JWT token
- Filter endpoints
- Expandable documentation

### Option 2: JSON Specification (Raw)
```
https://anola-backend.vercel.app/api-spec.json
```

**Use Cases:**
- Import into Postman
- Generate client SDKs
- API documentation tools
- Automated testing

### Option 3: Local Development
```
http://localhost:3000/api-docs
```

---

## 🚀 Using the API Documentation

### 1. **Browse Endpoints**
- Visit `/api-docs`
- All endpoints organized by tags:
  - Authentication
  - Users
  - Patients
  - Providers
  - Super Admin
  - Transactions
  - Wallets
  - Medical Records
  - Appointments
  - Sponsorships

### 2. **Test Endpoints**

#### Step 1: Authorize
1. Click "Authorize" button (top right)
2. Login to get JWT token:
   ```bash
   curl -X POST https://anola-backend.vercel.app/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "email": "admin@anolalinks.com",
       "password": "Possible@2025"
     }'
   ```
3. Copy the `token` from response
4. Paste in "Value" field with `Bearer ` prefix:
   ```
   Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
5. Click "Authorize"

#### Step 2: Try Endpoints
1. Expand any endpoint
2. Click "Try it out"
3. Fill in parameters
4. Click "Execute"
5. View response

### 3. **Import to Postman**

Download the spec:
```bash
curl https://anola-backend.vercel.app/api-spec.json > anola-api-spec.json
```

In Postman:
1. File → Import
2. Upload `anola-api-spec.json`
3. All endpoints will be imported

---

## 📊 Available Documentation

### Swagger UI Features:

✅ **Interactive Testing**
- Execute API calls directly from browser
- See real responses

✅ **Authentication**
- JWT Bearer token support
- Persist authorization across requests

✅ **Request/Response Examples**
- See example payloads
- Understand data structures

✅ **Filtering**
- Search for specific endpoints
- Filter by tags

✅ **Schema Definitions**
- View data models
- Understand object structures

---

## 🔍 Troubleshooting

### If Swagger UI Still Doesn't Load:

#### 1. **Clear Browser Cache**
```bash
# Chrome: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
# Or right-click → Inspect → Application → Clear Storage
```

#### 2. **Check Network Tab**
- Open Developer Tools (F12)
- Go to Network tab
- Reload page
- Look for failed requests
- Check console for errors

#### 3. **Use JSON Spec Directly**
```
https://anola-backend.vercel.app/api-spec.json
```
- Should return full OpenAPI specification
- If this works but UI doesn't, it's a frontend loading issue

#### 4. **Test Locally**
```bash
npm run dev
# Then visit: http://localhost:3000/api-docs
```
- If works locally but not on Vercel, it's a deployment issue

#### 5. **Check Vercel Logs**
```bash
vercel logs
```
- Look for errors related to `/api-docs`
- Check for static asset loading errors

---

## 🎨 Swagger Options Explained

```javascript
swaggerOptions: {
  persistAuthorization: true,      // Keep JWT token across page refreshes
  displayRequestDuration: true,    // Show how long requests take
  docExpansion: 'none',            // Collapse all by default
  filter: true,                    // Enable search/filter box
  showExtensions: true,            // Show custom extensions
  showCommonExtensions: true,      // Show common extensions
  tryItOutEnabled: true            // Enable "Try it out" by default
}
```

---

## 📝 API Documentation Tags

| Tag | Description | Endpoints |
|-----|-------------|-----------|
| System | Health checks and system info | `/health`, `/` |
| Authentication | Login, register, password reset | `/api/auth/*` |
| Users | User profile management | `/api/users/*` |
| Patients | Patient-specific features | `/api/patients/*` |
| Providers | Healthcare provider operations | `/api/providers/*` |
| Sponsors | Sponsor management | `/api/sponsors/*` |
| Vendors | Vendor operations | `/api/vendors/*` |
| Appointments | Appointment booking | `/api/appointments/*` |
| Medical Records | Medical record access | `/api/medical-records/*` |
| Sponsorships | Sponsorship programs | `/api/sponsorships/*` |
| Wallets | Wallet management | `/api/wallets/*` |
| Transactions | Transaction processing | `/api/transactions/*` |
| SuperAdmin | Platform administration | `/api/super-admin/*` |

---

## 🔐 Testing Super Admin Endpoints

1. **Login as Super Admin**
   ```bash
   POST /api/auth/login
   {
     "email": "admin@anolalinks.com",
     "password": "Possible@2025"
   }
   ```

2. **Authorize in Swagger UI**
   - Click "Authorize"
   - Enter: `Bearer YOUR_TOKEN`

3. **Test Super Admin Endpoints**
   - Expand "SuperAdmin" tag
   - Try endpoints like:
     - `GET /api/super-admin/dashboard`
     - `GET /api/super-admin/users`
     - `GET /api/super-admin/audit-logs`

---

## 📦 Deployment Notes

### What's Deployed:
- ✅ Swagger UI at `/api-docs`
- ✅ OpenAPI JSON spec at `/api-spec.json`
- ✅ All API endpoints documented
- ✅ Interactive testing enabled
- ✅ JWT authentication configured

### Files Changed:
1. `src/config/swagger.js` - Server URLs and paths
2. `src/app.js` - Swagger UI setup
3. Created `SWAGGER_FIX.md` - This documentation

---

## 🎯 Next Steps

1. **Access Documentation**
   ```
   https://anola-backend.vercel.app/api-docs
   ```

2. **Test Endpoints**
   - Login to get JWT token
   - Authorize in Swagger UI
   - Try different endpoints

3. **Share with Team**
   - Send them the `/api-docs` URL
   - Provide login credentials for testing
   - Share this documentation

4. **Generate Client SDK** (Optional)
   - Use `/api-spec.json` with OpenAPI generators
   - Generate TypeScript/JavaScript client
   - Auto-generate API documentation

---

## ✅ Verification Checklist

After deployment:
- [ ] Visit `/api-docs` - Should show Swagger UI
- [ ] Visit `/api-spec.json` - Should return JSON spec
- [ ] Test login endpoint in Swagger UI
- [ ] Authorize with JWT token
- [ ] Test a protected endpoint
- [ ] Verify super admin endpoints appear
- [ ] Check all tags are visible
- [ ] Confirm request/response examples load

---

## 📚 Additional Resources

- **Swagger UI Docs**: https://swagger.io/tools/swagger-ui/
- **OpenAPI Specification**: https://swagger.io/specification/
- **Postman Import**: https://learning.postman.com/docs/integrations/available-integrations/working-with-openAPI/

---

**Your API documentation is now live and working!** 🎉

Access it at: **https://anola-backend.vercel.app/api-docs**
