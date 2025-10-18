# Vercel MongoDB Connection Fix - Complete Guide

## 🔴 Issue

MongoDB connection fails on Vercel even after whitelisting `0.0.0.0/0`:
```
Database connection failed: Could not connect to any servers in your MongoDB Atlas cluster.
```

---

## ✅ Complete Fix Applied

### Changes Made:

1. **Increased connection timeout** from 5s to 30s (for serverless cold starts)
2. **Added connection caching** (reuse connections across requests)
3. **Forced IPv4** (`family: 4`)
4. **Disabled command buffering** (better for serverless)
5. **Non-blocking connection** (doesn't block serverless function startup)

---

## 🔧 What You Need to Do Now

### Step 1: Verify MongoDB Atlas Network Access

1. Go to: https://cloud.mongodb.com/
2. Select your project
3. Click **"Network Access"** (left sidebar under Security)
4. Verify you see this entry:

```
IP Address    | Comment                      | Status
------------- | ---------------------------- | --------
0.0.0.0/0    | Allow access from anywhere   | Active ✅
```

**If not present:**
- Click "+ ADD IP ADDRESS"
- Click "ALLOW ACCESS FROM ANYWHERE"
- Wait 2-3 minutes for it to become Active

### Step 2: Verify Database User

1. In MongoDB Atlas, click **"Database Access"** (left sidebar under Security)
2. Verify user `anola` exists
3. Check it has these permissions:
   - ✅ Read and write to any database
   - ✅ User is Active

**If password is wrong, update it:**
- Click "EDIT" on the user
- Click "Edit Password"
- Set to: `ZNaw0sZTeTWcaP7v`
- Click "Update User"
- **Important:** Wait 2-3 minutes for changes to propagate

### Step 3: Verify MongoDB Connection String in Vercel

The connection string format is critical. Go to Vercel:

1. Vercel Dashboard → Your Project → Settings → Environment Variables
2. Find `MONGO_URI` and verify it matches EXACTLY:

```
mongodb+srv://anola:ZNaw0sZTeTWcaP7v@cluster0.r2vfdeu.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
```

**Common mistakes:**
- ❌ Missing `mongodb+srv://` prefix
- ❌ Wrong username (should be `anola`)
- ❌ Wrong password (should be `ZNaw0sZTeTWcaP7v`)
- ❌ Wrong cluster (should be `cluster0.r2vfdeu.mongodb.net`)
- ❌ Missing `?retryWrites=true&w=majority`
- ❌ Extra spaces or line breaks

**How to update:**
1. Click the three dots (...) next to MONGO_URI
2. Click "Edit"
3. Paste the correct connection string
4. Make sure it's set for **Production**, **Preview**, and **Development**
5. Click "Save"

### Step 4: Check MongoDB Cluster Status

1. Go to MongoDB Atlas → Clusters
2. Verify your cluster `Cluster0` shows:
   - Status: **Active** (not paused)
   - ✅ Green indicator

**If paused:**
- Click "Resume" button
- Wait for cluster to start (can take 1-2 minutes)

### Step 5: Deploy Changes

```bash
# Commit the updated database config
git add .
git commit -m "Fix MongoDB connection for Vercel serverless"
git push origin main

# Or deploy directly
vercel --prod
```

### Step 6: Test the Connection

After deployment (wait 2-3 minutes), test:

```bash
# Test 1: Health check
curl https://anola-backend.vercel.app/health

# Test 2: Login (requires database)
curl -X POST https://anola-backend.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@anolalinks.com",
    "password": "Possible@2025"
  }'
```

### Step 7: Check Vercel Logs

```bash
vercel logs --follow
```

Look for:
- ✅ `"Connecting to MongoDB..."`
- ✅ `"MongoDB Connected Successfully"`
- ✅ `"Database Host: ac-4fwmgii-shard-00-00.r2vfdeu.mongodb.net"`
- ❌ `"Database connection failed"`

---

## 🎯 Alternative: Test MongoDB Connection String

Create a test file locally to verify your connection string works:

```javascript
// test-connection.js
const mongoose = require('mongoose');

const MONGO_URI = 'mongodb+srv://anola:ZNaw0sZTeTWcaP7v@cluster0.r2vfdeu.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

async function test() {
  try {
    console.log('Testing MongoDB connection...');
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      family: 4
    });
    console.log('✅ Connection successful!');
    console.log('Host:', mongoose.connection.host);
    console.log('Database:', mongoose.connection.name);
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

test();
```

Run it:
```bash
node test-connection.js
```

**If this fails locally:**
- Your connection string is wrong
- Or MongoDB Atlas user/password is wrong
- Or your IP isn't whitelisted (add your current IP too)

**If this works locally but fails on Vercel:**
- Vercel IPs aren't whitelisted (add `0.0.0.0/0`)
- Environment variable not set correctly in Vercel
- Cluster is paused

---

## 🔍 Troubleshooting Checklist

### Issue 1: "Authentication failed"

**Solution:**
```bash
# Verify credentials
Username: anola
Password: ZNaw0sZTeTWcaP7v

# If wrong, update in MongoDB Atlas:
# Database Access → Edit User → Edit Password
```

### Issue 2: "Server selection timeout"

**Causes:**
1. ❌ IP not whitelisted (add `0.0.0.0/0`)
2. ❌ Cluster is paused (resume it)
3. ❌ Wrong cluster URL in connection string

**Solution:**
- Add `0.0.0.0/0` to Network Access
- Resume cluster if paused
- Verify connection string matches your cluster

### Issue 3: "Network error"

**Solution:**
```javascript
// Force IPv4 (already in our fix)
{
  family: 4,
  serverSelectionTimeoutMS: 30000
}
```

### Issue 4: "Function timeout"

**Solution:**
- Increased timeout to 30 seconds ✅ (already done)
- Increase Vercel function timeout in `vercel.json`:

```json
{
  "functions": {
    "api/*.js": {
      "maxDuration": 60,  // Max allowed on hobby plan
      "memory": 1024
    }
  }
}
```

### Issue 5: Still fails after everything

**Try this MongoDB URI format** (alternative syntax):

```
mongodb+srv://anola:ZNaw0sZTeTWcaP7v@cluster0.r2vfdeu.mongodb.net/anola_health?retryWrites=true&w=majority
```

Note: Added database name `anola_health` explicitly.

---

## 🛡️ MongoDB Atlas Security Checklist

Verify these settings:

### Network Access
- [ ] `0.0.0.0/0` is whitelisted
- [ ] Status shows "Active" (green)
- [ ] No conflicting rules

### Database Access
- [ ] User `anola` exists
- [ ] Password is `ZNaw0sZTeTWcaP7v`
- [ ] Role: "Atlas admin" or "Read and write to any database"
- [ ] Authentication method: SCRAM

### Cluster Settings
- [ ] Cluster is Active (not paused)
- [ ] Cluster tier: M0 or higher
- [ ] Region is accessible

---

## 📊 Vercel Environment Variables

Required variables in Vercel:

```bash
# Essential
MONGO_URI=mongodb+srv://anola:ZNaw0sZTeTWcaP7v@cluster0.r2vfdeu.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
NODE_ENV=production

# Authentication
JWT_SECRET=your-jwt-secret
REFRESH_SECRET=your-refresh-secret

# Optional but recommended
SENDGRID_API_KEY=your-sendgrid-key
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
STRIPE_SECRET_KEY=your-stripe-key
CLOUDINARY_CLOUD_NAME=your-cloudinary-name
CLOUDINARY_API_KEY=your-cloudinary-key
CLOUDINARY_API_SECRET=your-cloudinary-secret
```

**How to verify:**
```bash
vercel env ls
```

---

## 🎯 Debugging Commands

### Check Vercel logs in real-time
```bash
vercel logs --follow
```

### Test with verbose logging
Add to your Vercel environment variables:
```
DEBUG=mongoose:*
```

Then check logs after deployment.

### Test specific endpoint
```bash
# Health check (doesn't need DB)
curl -v https://anola-backend.vercel.app/health

# Login (needs DB)
curl -v -X POST https://anola-backend.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@anolalinks.com","password":"Possible@2025"}'
```

---

## 📝 Updated Code Changes

### `src/config/database.js`

Key improvements:
1. ✅ Connection caching (reuse across requests)
2. ✅ 30-second timeout (was 5 seconds)
3. ✅ Force IPv4
4. ✅ Disable buffering for serverless
5. ✅ Better error handling

### `src/app.js`

Key improvement:
1. ✅ Non-blocking connection (doesn't crash on connection failure)

---

## ✅ Final Verification Steps

After deployment:

1. **Check Vercel Function Logs**
   ```bash
   vercel logs
   ```
   Should see: "MongoDB Connected Successfully"

2. **Test Health Endpoint**
   ```bash
   curl https://anola-backend.vercel.app/health
   ```
   Should return 200 OK

3. **Test Database Query**
   ```bash
   curl -X POST https://anola-backend.vercel.app/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@anolalinks.com","password":"Possible@2025"}'
   ```
   Should return JWT token

4. **Check Super Admin Dashboard**
   - Login to get token
   - Test: `GET /api/super-admin/dashboard`
   - Should return platform stats

---

## 🆘 Still Not Working?

### Last Resort Options:

1. **Create New Database User**
   ```
   MongoDB Atlas → Database Access → + ADD NEW DATABASE USER
   Username: vercel_user
   Password: (generate strong password)
   Role: Read and write to any database
   ```

   Then update `MONGO_URI` in Vercel with new credentials.

2. **Use MongoDB Connection String from Atlas**
   ```
   MongoDB Atlas → Clusters → Connect → Connect your application
   Copy the connection string provided
   Replace <password> with your actual password
   Update in Vercel
   ```

3. **Check MongoDB Atlas Status**
   - Visit: https://status.mongodb.com/
   - Check for ongoing issues

4. **Contact Support**
   - MongoDB Atlas: https://support.mongodb.com/
   - Vercel: https://vercel.com/support
   - Share Vercel function logs

---

## 📦 Quick Fix Summary

1. ✅ Whitelist `0.0.0.0/0` in MongoDB Atlas Network Access
2. ✅ Verify database user `anola` with correct password
3. ✅ Update connection string in Vercel (exact format above)
4. ✅ Ensure cluster is Active (not paused)
5. ✅ Deploy updated code with 30-second timeout
6. ✅ Wait 2-3 minutes for changes to propagate
7. ✅ Test endpoints

**Most common fix:** Wait 2-3 minutes after changing MongoDB Atlas settings before redeploying!

---

## ✅ Deployment Command

```bash
# Deploy and watch logs
vercel --prod && vercel logs --follow
```

This will deploy and immediately show you the logs so you can see if MongoDB connects successfully.

---

Your MongoDB connection should now work on Vercel! 🚀
