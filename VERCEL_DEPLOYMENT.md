# Vercel Deployment Guide for Anola Health Backend

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Vercel CLI** (optional but recommended):
   ```bash
   npm install -g vercel
   ```

## Deployment Methods

### Method 1: Deploy via Vercel CLI (Recommended)

#### Step 1: Login to Vercel
```bash
vercel login
```

#### Step 2: Deploy to Preview
```bash
vercel
```
This will deploy to a preview URL for testing.

#### Step 3: Deploy to Production
```bash
vercel --prod
```

### Method 2: Deploy via GitHub Integration

#### Step 1: Push to GitHub
```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

#### Step 2: Import Project in Vercel
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Vercel will auto-detect the configuration from `vercel.json`

## Environment Variables Setup

**CRITICAL**: You must add all environment variables to Vercel before deployment.

### Via Vercel Dashboard:
1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add each variable from `.env.example`:

#### Required Environment Variables:

```env
# MongoDB
MONGO_URI=mongodb+srv://your-connection-string

# JWT Secrets
JWT_SECRET=your-super-secure-jwt-secret-key-change-this-in-production
REFRESH_SECRET=your-super-secure-refresh-secret-key-change-this-in-production
JWT_EXPIRE=15m
REFRESH_EXPIRE=7d

# Email (SendGrid)
SENDGRID_API_KEY=your-sendgrid-api-key
EMAIL_FROM=noreply@anolahealth.com

# Twilio
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# Stripe
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret

# Frontend URLs
CLIENT_URL=https://your-frontend-url.vercel.app
ADMIN_URL=https://your-admin-url.vercel.app

# Encryption
ENCRYPTION_KEY=your-32-character-encryption-key

# Server Config
NODE_ENV=production
PORT=3000
```

### Via Vercel CLI:
```bash
vercel env add MONGO_URI
vercel env add JWT_SECRET
vercel env add REFRESH_SECRET
# ... add all other variables
```

## Project Structure for Vercel

```
anola_backend/
├── api/
│   └── index.js          # Vercel serverless entry point
├── src/
│   ├── app.js           # Express app
│   ├── config/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   └── middleware/
├── server.js            # Local development server
├── vercel.json          # Vercel configuration
├── .vercelignore        # Files to exclude from deployment
└── package.json
```

## Important Notes

### 1. **Serverless Function Limits**
- Max execution time: 60 seconds (configured in vercel.json)
- Max payload size: 4.5MB
- Cold starts: First request may be slower

### 2. **MongoDB Connection**
- Use MongoDB Atlas (cloud-hosted)
- Ensure connection string allows connections from anywhere (0.0.0.0/0)
- Or whitelist Vercel's IP ranges

### 3. **WebSocket Support**
- Socket.IO requires special configuration on Vercel
- Consider using Vercel's WebSocket support or external service

### 4. **File Uploads**
- Local file storage won't persist on Vercel
- Use Cloudinary (already configured) for all file uploads

### 5. **CORS Configuration**
- Update `CLIENT_URL` and `ADMIN_URL` in environment variables
- CORS headers are configured in vercel.json

## Testing Your Deployment

### 1. Check Health Endpoint
```bash
curl https://your-app.vercel.app/health
```

### 2. Test API Endpoints
```bash
curl https://your-app.vercel.app/api/v1/auth/health
```

### 3. View Logs
```bash
vercel logs
```
Or view in Vercel Dashboard → Your Project → Logs

## Important Configuration Notes

### Vercel.json Configuration
The `vercel.json` file uses the modern Vercel configuration:
- Uses `rewrites` instead of `routes` for cleaner routing
- Uses `functions` property (NOT `builds`) for serverless function configuration
- **NOTE:** Do NOT use `builds` and `functions` together - Vercel will throw an error

### Serverless Function Structure
```
anola_backend/
├── api/
│   └── index.js       # Main serverless entry point
├── src/
│   └── app.js         # Express app
└── vercel.json        # Vercel configuration
```

## Troubleshooting

### Common Issues:

#### 1. **500 Internal Server Error**
- Check environment variables are set correctly
- View logs: `vercel logs` or in Vercel Dashboard
- Ensure MongoDB connection string is correct

#### 2. **MongoDB Connection Failed**
- Whitelist Vercel IPs in MongoDB Atlas
- Or use `0.0.0.0/0` for testing (not recommended for production)
- Check connection string format

#### 3. **Module Not Found**
- Ensure all dependencies are in `package.json` dependencies (not devDependencies)
- Run `npm install` and redeploy

#### 4. **Function Timeout**
- Optimize slow database queries
- Add indexes to frequently queried fields
- Consider pagination for large datasets

#### 5. **CORS Errors**
- Update environment variables for frontend URLs
- Check CORS configuration in src/app.js
- Verify headers in vercel.json

#### 6. **"functions property cannot be used with builds property" Error**
- **Solution:** This error occurs when using both `builds` and `functions` in vercel.json
- Remove the `builds` property from vercel.json
- Use only `functions` property for serverless function configuration
- The correct vercel.json should use `rewrites` for routing
- If you see this error, your vercel.json has already been fixed in this project

## Custom Domain Setup

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add your custom domain (e.g., api.anolahealth.com)
3. Update DNS records as instructed
4. SSL certificate will be automatically provisioned

## Rollback to Previous Deployment

```bash
vercel rollback
```
Or use Vercel Dashboard → Deployments → Select deployment → Promote to Production

## Monitoring & Analytics

- **Real-time Logs**: Vercel Dashboard → Logs
- **Analytics**: Vercel Dashboard → Analytics
- **Performance Monitoring**: Consider integrating Sentry or similar

## Security Checklist

- ✅ All sensitive data in environment variables
- ✅ JWT secrets are strong and unique
- ✅ MongoDB network access properly configured
- ✅ CORS configured for specific domains (not wildcard in production)
- ✅ Rate limiting enabled
- ✅ Helmet.js security headers configured
- ✅ Input validation on all endpoints

## Deployment Checklist

- [ ] All environment variables added to Vercel
- [ ] MongoDB Atlas cluster created and accessible
- [ ] Third-party API keys (SendGrid, Twilio, Stripe, Cloudinary) configured
- [ ] Frontend URLs updated in environment variables
- [ ] Test deployment on preview URL
- [ ] Promote to production after successful testing
- [ ] Set up custom domain (optional)
- [ ] Configure monitoring and alerts

## Support

For issues specific to:
- **Vercel Platform**: [vercel.com/support](https://vercel.com/support)
- **This Backend**: Check application logs and error messages

## Next Steps After Deployment

1. Test all API endpoints
2. Update frontend to use new API URL
3. Set up monitoring and error tracking
4. Configure backup strategy for MongoDB
5. Implement CI/CD pipeline for automated deployments
6. Set up staging environment for testing
