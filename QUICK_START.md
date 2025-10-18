# Quick Start - Deploy to Vercel in 5 Minutes

Follow these steps to deploy your Anola Backend to Vercel with MongoDB connection.

---

## ⚡ 5-Minute Deployment

### Step 1: Test MongoDB Connection (1 minute)

```bash
node test-mongo-connection.js
```

**Expected Output:**
```
✅ SUCCESS! Connected to MongoDB Atlas
✅ TEST PASSED - Your MongoDB connection works!
```

**If it fails:** Fix MongoDB Atlas settings before deploying:
- Go to: https://cloud.mongodb.com/
- Network Access → Add IP `0.0.0.0/0`
- Database Access → Verify user `anola` exists
- Wait 2 minutes, then retry

---

### Step 2: Deploy to Vercel (2 minutes)

```bash
# Commit all changes
git add .
git commit -m "Fix MongoDB connection for Vercel"
git push origin main

# Deploy
vercel --prod
```

**Wait for:** "✅ Production: https://anola-backend.vercel.app"

---

### Step 3: Test Deployment (2 minutes)

#### Option A: Automated Test (Recommended)
```bash
./test-vercel-deployment.sh
```

#### Option B: Manual Test
```bash
# Test health (no database)
curl https://anola-backend.vercel.app/health

# Test login (requires database)
curl -X POST https://anola-backend.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@anolalinks.com", "password": "Possible@2025"}'
```

**Expected:** JWT token in response = Success!

---

## ✅ Done!

If you got a JWT token, your deployment is successful!

**Your API is live at:**
```
https://anola-backend.vercel.app
```

**API Documentation:**
```
https://anola-backend.vercel.app/api-docs
```

**Super Admin Login:**
- Email: `admin@anolalinks.com`
- Password: `Possible@2025`

---

## ❌ Troubleshooting

### Problem: Login returns "Database connection failed"

**Quick Fix:**
1. Go to: https://cloud.mongodb.com/
2. Click: Network Access (left sidebar)
3. Click: + ADD IP ADDRESS
4. Click: ALLOW ACCESS FROM ANYWHERE (0.0.0.0/0)
5. Click: Confirm
6. Wait 2-3 minutes
7. Redeploy: `vercel --prod`

**Detailed Fix:**
See: `DEPLOYMENT_CHECKLIST.md`

### Problem: Health endpoint fails

**Quick Fix:**
Check Vercel logs:
```bash
vercel logs
```

Look for errors and check `vercel.json` configuration.

### Problem: Test script fails

**Quick Fix:**
Make script executable:
```bash
chmod +x test-vercel-deployment.sh
./test-vercel-deployment.sh
```

---

## 📚 Next Steps

### 1. Explore API Documentation
Visit: https://anola-backend.vercel.app/api-docs

### 2. Test Super Admin Endpoints

**Get JWT Token:**
```bash
curl -X POST https://anola-backend.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@anolalinks.com", "password": "Possible@2025"}' \
  | grep -o '"accessToken":"[^"]*' | sed 's/"accessToken":"//'
```

Save the token, then:

**Get Dashboard:**
```bash
TOKEN="<your-token-here>"
curl https://anola-backend.vercel.app/api/super-admin/dashboard \
  -H "Authorization: Bearer $TOKEN"
```

### 3. Update Frontend

Update your frontend to use:
```
API_URL=https://anola-backend.vercel.app
```

### 4. Set Up Custom Domain (Optional)

In Vercel Dashboard:
1. Go to your project
2. Settings → Domains
3. Add your custom domain
4. Update DNS records

---

## 🔐 Important Credentials

**Super Admin:**
- Email: `admin@anolalinks.com`
- Password: `Possible@2025`

**MongoDB:**
- URI: `mongodb+srv://anola:ZNaw0sZTeTWcaP7v@cluster0.r2vfdeu.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`
- Username: `anola`
- Password: `ZNaw0sZTeTWcaP7v`

---

## 📖 Documentation

- **Deployment Guide**: `DEPLOYMENT_CHECKLIST.md` (comprehensive)
- **MongoDB Fix**: `VERCEL_MONGODB_CONNECTION_FIX.md`
- **API Guide**: `SUPER_ADMIN_GUIDE.md` (50+ pages)
- **Quick Reference**: `SUPER_ADMIN_QUICK_REFERENCE.md`
- **All Fixes**: `FIXES_SUMMARY.md`

---

## ⚡ Quick Commands

```bash
# Test MongoDB locally
node test-mongo-connection.js

# Deploy to production
vercel --prod

# Test deployment
./test-vercel-deployment.sh

# View logs
vercel logs --follow

# Check environment variables
vercel env ls

# Create new super admin
npm run create-super-admin-quick

# Delete super admin
npm run delete-super-admin admin@anolalinks.com
```

---

## 🎯 Success Checklist

- ✅ Local MongoDB test passes
- ✅ Vercel deployment succeeds
- ✅ Health endpoint returns 200
- ✅ Login endpoint returns JWT token
- ✅ Super admin dashboard returns data
- ✅ Swagger UI loads at /api-docs
- ✅ No errors in Vercel logs

---

## 🆘 Need Help?

### Check Logs First:
```bash
vercel logs --follow
```

### Common Issues:

**"Database connection failed"**
→ Check MongoDB Atlas IP whitelist (0.0.0.0/0)

**"Module not found"**
→ Check package.json has all dependencies

**"Function timeout"**
→ Check database connection string is correct

**"Not allowed by CORS"**
→ Add your frontend URL to CORS_ORIGINS in Vercel

### Still Stuck?

1. Read: `DEPLOYMENT_CHECKLIST.md`
2. Check: https://status.mongodb.com/
3. Check: https://vercel-status.com/
4. Review: All console logs and error messages

---

**You're all set! Your Anola Backend is ready to serve requests.** 🚀
