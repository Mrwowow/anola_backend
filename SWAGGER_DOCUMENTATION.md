# Anola Health API - Swagger Documentation

## Overview

The Anola Health API now includes comprehensive Swagger/OpenAPI 3.0 documentation for all endpoints. This provides an interactive interface for exploring and testing the API.

## Accessing the Documentation

**Swagger UI URL:** http://localhost:3000/api-docs

When the server is running in development mode, navigate to the URL above to access the interactive API documentation.

## Features

### 1. Interactive API Explorer
- Browse all available endpoints organized by tags
- View detailed request/response schemas
- Test endpoints directly from the browser
- See example requests and responses

### 2. Authentication Support
- Built-in JWT Bearer token authentication
- Click the "Authorize" button to add your access token
- All protected endpoints will automatically include your token

### 3. Comprehensive Documentation

#### Documented Endpoint Categories:

**Authentication** (`/api/auth`)
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

**Users** (`/api/users`)
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `POST /api/users/verify-email` - Verify email address

**Appointments** (`/api/appointments`)
- `GET /api/appointments` - List appointments (with filtering & pagination)
- `POST /api/appointments` - Create new appointment
- `GET /api/appointments/{id}` - Get appointment details
- `PUT /api/appointments/{id}` - Update appointment
- `DELETE /api/appointments/{id}` - Cancel appointment

**Wallets** (`/api/wallets`)
- `GET /api/wallets` - Get user wallets
- `POST /api/wallets/deposit` - Deposit funds to wallet

**Transactions** (`/api/transactions`)
- `GET /api/transactions` - Get transaction history (with filtering)
- `POST /api/transactions` - Create new transaction
- `GET /api/transactions/{id}` - Get transaction details

**System Endpoints**
- `GET /health` - Health check endpoint
- `GET /` - API welcome message

### 4. Data Models

Pre-defined schemas for:
- User
- Appointment
- Wallet
- Transaction
- Medical Record
- Error responses
- Authentication responses

## Using the Documentation

### Selecting a Server/Base URL

The Swagger UI includes multiple server options in a dropdown at the top of the page:

**Available Servers:**
1. **Local development server (current port)** - Uses the PORT from your .env file
2. **Local server - Port 3000** - Default localhost on port 3000
3. **Local server - Port 8080** - Alternative port 8080
4. **Local server - Port 5000** - Alternative port 5000
5. **Local server - 127.0.0.1:3000** - Using IP address instead of localhost
6. **Production server** - Production API endpoint (https://api.anolahealth.com)

**To change servers:**
1. Look for the "Servers" dropdown at the top of the Swagger UI
2. Click to open the dropdown menu
3. Select the desired server URL
4. All subsequent API requests will use the selected server

**When to use different servers:**
- Running the API on a different port than default
- Testing against different environments (dev, staging, production)
- Working with multiple local instances
- Resolving localhost vs 127.0.0.1 connection issues
- Testing production endpoints

### Testing an Endpoint

1. Navigate to http://localhost:3000/api-docs
2. (Optional) Select your preferred server from the "Servers" dropdown
3. Click on any endpoint to expand it
4. Click "Try it out"
5. Fill in the required parameters
6. Click "Execute"
7. View the response below

### Authentication

For protected endpoints:
1. Click the "Authorize" button at the top
2. Enter your JWT token in the format: `Bearer <your-token>`
3. Click "Authorize"
4. Your token will be included in all subsequent requests

### Filtering and Pagination

Many endpoints support query parameters for filtering:
- `status` - Filter by status
- `startDate` / `endDate` - Date range filters
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10-20)

## File Structure

```
src/
├── config/
│   └── swagger.js          # Swagger configuration and schemas
├── routes/
│   ├── auth.routes.js      # Auth endpoint documentation
│   ├── user.routes.js      # User endpoint documentation
│   ├── appointment.routes.js  # Appointment endpoint documentation
│   ├── wallet.routes.js    # Wallet endpoint documentation
│   └── transaction.routes.js  # Transaction endpoint documentation
└── app.js                  # Swagger middleware setup
```

## Customization

### Adding New Endpoints

To document a new endpoint, add JSDoc comments above the route handler:

```javascript
/**
 * @swagger
 * /api/your-endpoint:
 *   get:
 *     tags: [YourTag]
 *     summary: Brief description
 *     description: Detailed description
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 */
router.get('/your-endpoint', handler);
```

### Adding New Schemas

Edit [src/config/swagger.js](src/config/swagger.js) to add new reusable schemas in the `components.schemas` section.

### Customizing Appearance

The Swagger UI can be customized in [src/app.js](src/app.js) where it's initialized:

```javascript
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Anola Health API Documentation'
}));
```

## Production Deployment

The Swagger documentation automatically adjusts the server URL based on the environment:

- **Development:** `http://localhost:3000`
- **Production:** `https://api.anolahealth.com`

Set `NODE_ENV=production` in your production environment to use the correct base URL.

## Next Steps

### Recommended Additions:

1. **Add more endpoints** - Document patient, provider, sponsor, vendor, and medical record routes
2. **Add examples** - Include more request/response examples
3. **Add schemas** - Create detailed schemas for complex data structures
4. **Add descriptions** - Enhance field descriptions with validation rules
5. **Add tags** - Organize endpoints with more granular tags

### Additional Features to Consider:

- Request validation using express-validator
- Rate limiting documentation
- Error code reference
- Webhook documentation
- API versioning strategy

## Support

For questions or issues with the API documentation:
- Email: support@anolahealth.com
- Documentation: http://localhost:3000/api-docs
- Health Check: http://localhost:3000/health

## Version

Current API Version: **1.0.0**
OpenAPI Specification: **3.0.0**
