# CORS Configuration Fix Guide

## Problem

You're getting this error:
```
Access to XMLHttpRequest at 'https://anola-backend.vercel.app/api/providers/onboarding/init'
from origin 'https://www.anolahealth.com' has been blocked by CORS policy:
Response to preflight request doesn't pass access control check:
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## Root Cause

The backend CORS configuration doesn't include `https://www.anolahealth.com` in the allowed origins list.

## Solution

### Option 1: Add to Vercel Environment Variables (Recommended)

1. Go to your Vercel project dashboard: https://vercel.com/waocards-projects/anola_backend

2. Navigate to **Settings** → **Environment Variables**

3. Add a new environment variable:
   - **Name**: `CORS_ORIGINS`
   - **Value**: `https://www.anolahealth.com,https://anolahealth.com,https://admin.anolahealth.com,http://localhost:3000,http://localhost:3001`
   - **Environments**: Production, Preview, Development (select all)

4. Click **Save**

5. Redeploy your application:
   ```bash
   vercel --prod
   ```

### Option 2: Update via Vercel CLI

```bash
# Set the CORS_ORIGINS environment variable
vercel env add CORS_ORIGINS production

# When prompted, enter:
https://www.anolahealth.com,https://anolahealth.com,https://admin.anolahealth.com

# Redeploy
vercel --prod
```

### Option 3: Using `.env` file (Local Development)

If you have a local `.env` file, add:

```bash
CORS_ORIGINS=http://localhost:3000,http://localhost:3001,https://www.anolahealth.com,https://anolahealth.com
```

**Note:** For production, always use Vercel's environment variables interface.

## Allowed Origins Format

The `CORS_ORIGINS` variable should be a **comma-separated list** of allowed origins:

```
https://www.anolahealth.com,https://anolahealth.com,https://admin.anolahealth.com
```

### Common Origins to Include

- `https://www.anolahealth.com` - Your main website
- `https://anolahealth.com` - Without www
- `https://admin.anolahealth.com` - Admin panel
- `https://app.anolahealth.com` - Web app (if you have one)
- `http://localhost:3000` - Local development (frontend)
- `http://localhost:3001` - Local development (admin)

## Verification

After setting the environment variable and redeploying:

1. Open your browser console
2. Try making the request again
3. You should see the request succeed without CORS errors

### Test with cURL

```bash
# Test preflight (OPTIONS) request
curl -X OPTIONS https://anola-backend.vercel.app/api/providers/onboarding/init \
  -H "Origin: https://www.anolahealth.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v

# Look for these headers in the response:
# Access-Control-Allow-Origin: https://www.anolahealth.com
# Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS
# Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With
```

## Current CORS Configuration

The backend is configured to:

- **Allow credentials**: Yes (`credentials: true`)
- **Allowed methods**: GET, POST, PUT, DELETE, PATCH, OPTIONS
- **Allowed headers**: Content-Type, Authorization, X-Requested-With
- **Exposed headers**: X-Total-Count, X-Page-Count

## Troubleshooting

### Issue 1: Still getting CORS error after setting environment variable

**Solution:**
1. Make sure you redeployed after adding the environment variable
2. Clear your browser cache
3. Try in incognito/private mode
4. Check the environment variable is set correctly in Vercel dashboard

### Issue 2: Works in development but not production

**Solution:**
- Ensure CORS_ORIGINS includes your production domain
- Check the domain matches exactly (including http/https)
- Verify no trailing slashes in the origin URL

### Issue 3: Multiple frontend domains

**Solution:**
Add all domains to CORS_ORIGINS, separated by commas:
```
https://www.anolahealth.com,https://anolahealth.com,https://app.anolahealth.com
```

### Issue 4: Preflight request fails

**Solution:**
The backend already handles OPTIONS requests. Ensure your frontend is sending:
- `Origin` header
- `Access-Control-Request-Method` header (for preflight)
- `Access-Control-Request-Headers` header (for preflight)

## Quick Fix Command

Run this in your terminal:

```bash
# Navigate to your backend directory
cd /Users/macbookpro/anola_backend

# Set environment variable in Vercel
vercel env add CORS_ORIGINS production

# When prompted, paste:
https://www.anolahealth.com,https://anolahealth.com,https://admin.anolahealth.com,http://localhost:3000,http://localhost:3001

# Redeploy
vercel --prod --yes
```

## Alternative: Update CORS to Allow All Origins in Development

**Not recommended for production**, but useful for testing:

Edit `src/app.js`:

```javascript
const corsOptions = {
  origin: function (origin, callback) {
    // In production, check against whitelist
    if (config.nodeEnv === 'production') {
      if (!origin || config.corsOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    }

    // In development, allow all origins
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count']
};
```

## Recommended Production Setup

1. **Set CORS_ORIGINS in Vercel**:
   ```
   https://www.anolahealth.com,https://anolahealth.com,https://admin.anolahealth.com
   ```

2. **For local development**, add to your local `.env`:
   ```
   CORS_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:3002
   ```

3. **Deploy**:
   ```bash
   vercel --prod
   ```

## Security Notes

- Only add trusted domains to CORS_ORIGINS
- Don't use `*` wildcard in production
- Always use HTTPS for production origins
- Keep the list minimal - only include domains you control

## Support

If you continue to have issues:
1. Check Vercel deployment logs: `vercel logs`
2. Verify environment variable: Check Vercel dashboard → Settings → Environment Variables
3. Test with the cURL command above to see actual headers returned
