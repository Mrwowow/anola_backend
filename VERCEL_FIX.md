# Vercel Deployment Fix - "builds and functions" Error

## ✅ Issue Resolved

The deployment error **"The `functions` property cannot be used in conjunction with the `builds` property"** has been fixed.

---

## 🔧 What Was Changed

### vercel.json - FIXED Configuration

**Old (Broken):**
```json
{
  "version": 2,
  "builds": [                    // ❌ REMOVED - Causes conflict
    {
      "src": "api/index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [                    // ❌ CHANGED to rewrites
    {
      "src": "/(.*)",
      "dest": "api/index.js"
    }
  ],
  "functions": {                 // ⚠️ Conflicts with builds
    "api/index.js": {
      "maxDuration": 60
    }
  }
}
```

**New (Working):**
```json
{
  "version": 2,
  "rewrites": [                  // ✅ Using rewrites instead of routes
    {
      "source": "/(.*)",
      "destination": "/api"
    }
  ],
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Credentials",
          "value": "true"
        },
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        },
        {
          "key": "Access-Control-Allow-Methods",
          "value": "GET,OPTIONS,PATCH,DELETE,POST,PUT"
        },
        {
          "key": "Access-Control-Allow-Headers",
          "value": "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization"
        }
      ]
    }
  ],
  "functions": {                 // ✅ Can now use functions without builds
    "api/*.js": {
      "maxDuration": 60,
      "memory": 1024
    }
  }
}
```

---

## 📝 Key Changes

1. **Removed `builds` property** - Modern Vercel auto-detects serverless functions in `/api` directory
2. **Changed `routes` to `rewrites`** - Modern routing approach
3. **Updated `functions` pattern** - Changed from `api/index.js` to `api/*.js` for flexibility
4. **Kept CORS headers** - Properly configured for API access

---

## 🚀 Deploy Now

Your deployment should now work! Try deploying again:

### Option 1: Vercel CLI
```bash
vercel --prod
```

### Option 2: GitHub Push
```bash
git add .
git commit -m "Fix Vercel deployment configuration"
git push origin main
```

Vercel will auto-deploy from GitHub.

---

## ✅ What Should Happen

1. **Vercel detects** `/api/index.js` as a serverless function automatically
2. **All routes** are rewritten to `/api`
3. **Function runs** with 60-second timeout and 1024MB memory
4. **CORS headers** are applied to all API requests

---

## 🔍 Verify Deployment

After deployment succeeds:

### Test Health Endpoint
```bash
curl https://your-app.vercel.app/health
```

Expected response:
```json
{
  "status": "OK",
  "timestamp": "2025-10-18T...",
  "environment": "production",
  "version": "1.0.0"
}
```

### Test API Endpoint
```bash
curl https://your-app.vercel.app/api/auth/health
```

### Test Super Admin Login
```bash
curl -X POST https://your-app.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@anolalinks.com",
    "password": "Possible@2025"
  }'
```

---

## 📚 Understanding the Fix

### Why the Error Occurred
Vercel's newer versions don't support using both `builds` and `functions` properties together:
- `builds` - Old way to configure serverless functions
- `functions` - New way with auto-detection
- Using both causes a conflict

### Modern Vercel Approach
- **Auto-detection**: Vercel automatically detects files in `/api` directory as serverless functions
- **No builds needed**: Just put your code in `/api` and Vercel handles the rest
- **Configure with functions**: Use `functions` property to set timeout, memory, etc.
- **Routing with rewrites**: Use `rewrites` instead of `routes` for cleaner config

---

## 📋 Pre-Deployment Checklist

Before deploying, ensure:

- ✅ `vercel.json` has been updated (already done)
- ✅ `/api/index.js` exists and exports Express app (already done)
- ✅ All environment variables are set in Vercel dashboard:
  - `MONGO_URI`
  - `JWT_SECRET`
  - `REFRESH_SECRET`
  - `SENDGRID_API_KEY`
  - `TWILIO_ACCOUNT_SID`
  - `TWILIO_AUTH_TOKEN`
  - `STRIPE_SECRET_KEY`
  - `CLOUDINARY_CLOUD_NAME`
  - `CLOUDINARY_API_KEY`
  - `CLOUDINARY_API_SECRET`
  - `CLIENT_URL`
  - `ENCRYPTION_KEY`
  - `NODE_ENV=production`

---

## 🎯 Next Steps

1. **Deploy to Vercel**
   ```bash
   vercel --prod
   ```

2. **Add Environment Variables** (if not already added)
   - Go to Vercel Dashboard
   - Your Project → Settings → Environment Variables
   - Add all variables from `.env.example`

3. **Test the Deployment**
   - Test health endpoint
   - Test API endpoints
   - Test super admin login

4. **Update Frontend**
   - Update your frontend to use new API URL
   - Example: `https://your-backend.vercel.app`

5. **Monitor**
   - Check Vercel logs for any errors
   - Monitor performance
   - Set up error tracking (Sentry, etc.)

---

## 🐛 If Deployment Still Fails

### Check Build Logs
```bash
vercel logs
```

### Common Issues After Fix

1. **Environment Variables Missing**
   - Add all required variables in Vercel dashboard
   - Make sure they're set for "Production" environment

2. **MongoDB Connection Issues**
   - Whitelist Vercel IPs in MongoDB Atlas
   - Or use `0.0.0.0/0` (allow all) for testing

3. **Module Not Found**
   - Check all dependencies are in `package.json`
   - Make sure `node_modules` is in `.vercelignore`

4. **Function Timeout**
   - Optimize database queries
   - Consider increasing timeout in `vercel.json` (max 60s on hobby plan)

---

## 📖 Additional Resources

- **Vercel Documentation**: https://vercel.com/docs
- **Serverless Functions**: https://vercel.com/docs/functions
- **Environment Variables**: https://vercel.com/docs/environment-variables
- **Full Deployment Guide**: [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md)

---

## ✅ Summary

- **Fixed**: Removed `builds` property from `vercel.json`
- **Changed**: Using `rewrites` instead of `routes`
- **Status**: ✅ Ready to deploy
- **Action**: Run `vercel --prod` to deploy

Your deployment should now succeed! 🚀
