# MongoDB Connection Fix - Deployment Checklist

## ✅ Pre-Deployment Verification

### 1. Local MongoDB Connection Test

First, verify your MongoDB connection works locally:

```bash
node test-mongo-connection.js
```

**Expected Output:**
```
✅ SUCCESS! Connected to MongoDB Atlas
✅ Ping result: { ok: 1 }
✅ TEST PASSED - Your MongoDB connection works!
```

**If this fails locally**, your MongoDB credentials or IP whitelist are wrong. Fix before deploying to Vercel.

---

## 🔧 MongoDB Atlas Verification

### Step 1: Verify IP Whitelist

1. Login to MongoDB Atlas: https://cloud.mongodb.com/
2. Go to: **Network Access** (Security → Network Access)
3. Verify you see this entry:

   ```
   IP Address: 0.0.0.0/0
   Comment: Allow from anywhere
   Status: Active (green)
   ```

4. **Important**: Wait 2-3 minutes after adding this entry before deploying

### Step 2: Verify Database User

1. Go to: **Database Access** (Security → Database Access)
2. Find user: `anola`
3. Verify:
   - ✅ Password Authentication (not SCRAM)
   - ✅ Password: `ZNaw0sZTeTWcaP7v`
   - ✅ Database User Privileges: **Atlas admin** or **Read and write to any database**
   - ✅ Status: Active

### Step 3: Verify Cluster is Running

1. Go to: **Clusters** (Database → Browse Collections)
2. Verify cluster status: **ACTIVE** (not Paused)
3. Cluster name: `cluster0`
4. Server: `cluster0.r2vfdeu.mongodb.net`

---

## 🚀 Vercel Deployment Steps

### Step 1: Verify Environment Variables

Go to Vercel Dashboard → Your Project → Settings → Environment Variables

**Required Variables:**

```env
MONGO_URI=mongodb+srv://anola:ZNaw0sZTeTWcaP7v@cluster0.r2vfdeu.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
NODE_ENV=production
JWT_SECRET=your-super-secure-jwt-secret-key-change-this-in-production
REFRESH_SECRET=your-super-secure-refresh-secret-key-change-this-in-production
JWT_EXPIRE=15m
REFRESH_EXPIRE=7d
SENDGRID_API_KEY=your-sendgrid-api-key
EMAIL_FROM=noreply@anolahealth.com
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
CLIENT_URL=https://your-frontend.vercel.app
ADMIN_URL=https://your-admin.vercel.app
ENCRYPTION_KEY=your-32-character-encryption-key
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**Critical**: Copy the `MONGO_URI` EXACTLY as shown above. Extra spaces or characters will break the connection.

### Step 2: Deploy to Vercel

#### Option A: Via CLI
```bash
# Make sure all changes are committed
git add .
git commit -m "Fix MongoDB connection for serverless"
git push origin main

# Deploy
vercel --prod
```

#### Option B: Via GitHub (Auto-deploy)
```bash
# Commit and push
git add .
git commit -m "Fix MongoDB connection for serverless"
git push origin main

# Vercel will auto-deploy from GitHub
```

### Step 3: Monitor Deployment

Watch the deployment in real-time:

```bash
vercel logs --follow
```

Look for these success messages:
- ✅ `Connecting to MongoDB...`
- ✅ `MongoDB Connected Successfully`
- ✅ `Database Host: cluster0-shard-00-XX.r2vfdeu.mongodb.net`

Look for these error messages:
- ❌ `Database connection failed`
- ❌ `Could not connect to any servers`
- ❌ `MongoServerSelectionError`

---

## 🧪 Post-Deployment Testing

### Test 1: Health Check (No Database Required)

```bash
curl https://anola-backend.vercel.app/health
```

**Expected Response:**
```json
{
  "status": "OK",
  "timestamp": "2025-10-18T...",
  "environment": "production",
  "version": "1.0.0"
}
```

**If this fails**: Your Vercel deployment itself is broken (not database issue)

### Test 2: API Welcome (No Database Required)

```bash
curl https://anola-backend.vercel.app/
```

**Expected Response:**
```json
{
  "message": "Welcome to Anola Health API",
  "version": "1.0.0",
  "documentation": "/api-docs",
  "status": "running",
  "timestamp": "2025-10-18T..."
}
```

### Test 3: Login Endpoint (Requires Database)

```bash
curl -X POST https://anola-backend.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@anolalinks.com",
    "password": "Possible@2025"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "68f376a6f1ca671db96e399e",
      "email": "admin@anolalinks.com",
      "firstName": "Anola",
      "lastName": "Links",
      "role": "super_admin"
    },
    "accessToken": "eyJhbGci...",
    "refreshToken": "eyJhbGci..."
  }
}
```

**If this fails with "Database connection failed"**: MongoDB connection issue

### Test 4: Super Admin Dashboard (Requires Database + Auth)

First, save the token from Test 3, then:

```bash
TOKEN="<paste-your-token-here>"

curl https://anola-backend.vercel.app/api/super-admin/dashboard \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "totalUsers": 1,
    "totalProviders": 0,
    "totalPatients": 0,
    "totalSponsors": 0,
    "totalVendors": 0,
    "totalTransactions": 0,
    "totalRevenue": 0,
    "activeAppointments": 0,
    "period": "last30days"
  }
}
```

### Test 5: Swagger API Documentation

Visit in browser:
```
https://anola-backend.vercel.app/api-docs
```

Should show interactive Swagger UI with all endpoints.

---

## 🔍 Troubleshooting

### Issue: "Database connection failed" in Vercel Logs

**Check 1: Verify MONGO_URI in Vercel**
```bash
# This shows your environment variables (passwords are masked)
vercel env ls
```

**Check 2: Test MongoDB from another serverless platform**

The issue might be Vercel-specific. Try MongoDB Atlas Data API as alternative.

**Check 3: Verify Connection String Format**

Your connection string should be EXACTLY:
```
mongodb+srv://anola:ZNaw0sZTeTWcaP7v@cluster0.r2vfdeu.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
```

Common mistakes:
- ❌ Extra spaces
- ❌ Wrong username (should be `anola`)
- ❌ Wrong password (should be `ZNaw0sZTeTWcaP7v`)
- ❌ Wrong cluster (should be `cluster0.r2vfdeu.mongodb.net`)
- ❌ Missing `?` before query parameters

**Check 4: MongoDB Atlas Status**

Visit: https://status.mongodb.com/
Ensure no ongoing incidents.

**Check 5: Create New Database User**

Sometimes the user gets corrupted. Create a new one:

1. MongoDB Atlas → Database Access
2. Add New Database User
3. Username: `anolabackend`
4. Password: Generate new secure password
5. Privileges: Atlas admin
6. Update MONGO_URI in Vercel with new credentials
7. Redeploy

**Check 6: Try Alternative Connection String**

Add explicit database name:
```
mongodb+srv://anola:ZNaw0sZTeTWcaP7v@cluster0.r2vfdeu.mongodb.net/anoladb?retryWrites=true&w=majority&appName=Cluster0
```

---

## 📊 What Changed in This Fix

### 1. Database Configuration (`src/config/database.js`)

**Before:**
- Timeout: 5 seconds (too short for serverless cold starts)
- No connection caching (new connection every request)
- No IPv4 forcing (can cause issues)

**After:**
- Timeout: 30 seconds (adequate for cold starts)
- Connection caching (reuse across requests)
- Forced IPv4 (more reliable)
- Non-blocking connection (don't exit on error)

### 2. Application Initialization (`src/app.js`)

**Before:**
```javascript
connectDB();
```

**After:**
```javascript
connectDB().catch(err => {
  console.error('Initial database connection failed:', err.message);
  // Don't exit in serverless - let it retry on next request
});
```

### 3. Serverless Configuration (`vercel.json`)

**Before:**
- Had conflicting `builds` and `functions` properties
- Used old `routes` instead of `rewrites`

**After:**
- Only `functions` property (modern approach)
- Using `rewrites` (cleaner routing)
- 60-second timeout
- 1024MB memory

---

## 🎯 Success Criteria

You'll know the fix worked when:

1. ✅ Local test script passes: `node test-mongo-connection.js`
2. ✅ Vercel logs show: `MongoDB Connected Successfully`
3. ✅ Login endpoint returns JWT token
4. ✅ Super admin dashboard returns statistics
5. ✅ No "Database connection failed" errors in logs

---

## 📞 If Still Failing

If MongoDB connection still fails after all these steps:

### Option 1: Use MongoDB Atlas Data API

MongoDB Atlas Data API doesn't require IP whitelisting and works better with serverless.

**Setup:**
1. MongoDB Atlas → Data API (left sidebar)
2. Enable Data API
3. Generate API Key
4. Update your app to use REST API instead of native driver

### Option 2: Try Different Serverless Platform

Test if it's Vercel-specific:
- Deploy to Netlify Functions
- Deploy to AWS Lambda
- Deploy to Railway (not serverless, but easier)

### Option 3: Use MongoDB Atlas Serverless Instance

Instead of a regular cluster, use MongoDB Atlas Serverless tier which is optimized for serverless functions.

### Option 4: Share Logs for Analysis

Run and share output:
```bash
vercel logs --follow > vercel-logs.txt
```

Share the logs so we can see the exact error message.

---

## ✅ Quick Command Reference

```bash
# Test MongoDB locally
node test-mongo-connection.js

# Deploy to Vercel
vercel --prod

# View logs
vercel logs

# Follow logs in real-time
vercel logs --follow

# Check environment variables
vercel env ls

# Test health endpoint
curl https://anola-backend.vercel.app/health

# Test login endpoint
curl -X POST https://anola-backend.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@anolalinks.com", "password": "Possible@2025"}'
```

---

## 📋 Deployment Checklist

Copy this checklist and mark as you complete:

### Pre-Deployment
- [ ] Ran `node test-mongo-connection.js` - PASSED
- [ ] MongoDB Atlas Network Access shows 0.0.0.0/0 - ACTIVE
- [ ] MongoDB Atlas Database Access shows user `anola` - ACTIVE
- [ ] MongoDB cluster is RUNNING (not paused)
- [ ] Waited 3 minutes after adding IP whitelist

### Vercel Configuration
- [ ] MONGO_URI environment variable set in Vercel
- [ ] NODE_ENV=production set in Vercel
- [ ] All other required env vars set in Vercel
- [ ] Environment variables set for "Production" environment

### Deployment
- [ ] Committed all code changes
- [ ] Pushed to GitHub or deployed via CLI
- [ ] Deployment succeeded (no build errors)
- [ ] Checked Vercel logs for "MongoDB Connected Successfully"

### Testing
- [ ] `/health` endpoint returns 200 OK
- [ ] `/` endpoint returns welcome message
- [ ] `/api/auth/login` returns JWT token (DATABASE TEST)
- [ ] `/api/super-admin/dashboard` returns statistics (DATABASE TEST)
- [ ] `/api-docs` shows Swagger UI
- [ ] No errors in Vercel logs

---

## 🎉 Expected Result

After following this checklist, your Vercel deployment should:

1. ✅ Connect to MongoDB successfully on cold start
2. ✅ Reuse cached connections for subsequent requests
3. ✅ Complete connections within 30-second timeout
4. ✅ Serve all API endpoints successfully
5. ✅ Show comprehensive API documentation at /api-docs

**Your Anola Backend will be fully operational on Vercel!**
