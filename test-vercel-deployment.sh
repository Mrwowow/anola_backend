#!/bin/bash

# Vercel Deployment Test Script
# Tests all critical endpoints after deployment

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color
BLUE='\033[0;34m'

# Configuration
BASE_URL="https://anola-backend.vercel.app"
ADMIN_EMAIL="admin@anolalinks.com"
ADMIN_PASSWORD="Possible@2025"

echo "╔════════════════════════════════════════════════════════════╗"
echo "║         Vercel Deployment Test Suite                     ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "Testing deployment at: ${BLUE}${BASE_URL}${NC}"
echo ""

# Test 1: Health Check (No Database)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 1: Health Check (No Database Required)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" "${BASE_URL}/health")
HEALTH_BODY=$(echo "$HEALTH_RESPONSE" | head -n -1)
HEALTH_STATUS=$(echo "$HEALTH_RESPONSE" | tail -n 1)

if [ "$HEALTH_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ PASSED${NC} - Health check returned 200"
    echo "Response: $HEALTH_BODY"
else
    echo -e "${RED}❌ FAILED${NC} - Health check returned $HEALTH_STATUS"
    echo "Response: $HEALTH_BODY"
    echo ""
    echo -e "${RED}Critical Error: Basic health endpoint failed. Check Vercel deployment.${NC}"
    exit 1
fi
echo ""

# Test 2: Welcome Endpoint (No Database)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 2: Welcome Endpoint (No Database Required)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

WELCOME_RESPONSE=$(curl -s -w "\n%{http_code}" "${BASE_URL}/")
WELCOME_BODY=$(echo "$WELCOME_RESPONSE" | head -n -1)
WELCOME_STATUS=$(echo "$WELCOME_RESPONSE" | tail -n 1)

if [ "$WELCOME_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ PASSED${NC} - Welcome endpoint returned 200"
    echo "Response: $WELCOME_BODY"
else
    echo -e "${RED}❌ FAILED${NC} - Welcome endpoint returned $WELCOME_STATUS"
    echo "Response: $WELCOME_BODY"
fi
echo ""

# Test 3: Swagger API Docs
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 3: Swagger API Documentation"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

SWAGGER_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/api-docs")

if [ "$SWAGGER_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ PASSED${NC} - Swagger UI accessible at ${BASE_URL}/api-docs"
else
    echo -e "${YELLOW}⚠️  WARNING${NC} - Swagger UI returned $SWAGGER_STATUS"
    echo "Try: ${BASE_URL}/api-spec.json for JSON spec"
fi
echo ""

# Test 4: Login Endpoint (Requires Database)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 4: Super Admin Login (Requires Database)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Testing with: $ADMIN_EMAIL"

LOGIN_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"${ADMIN_EMAIL}\", \"password\": \"${ADMIN_PASSWORD}\"}")

LOGIN_BODY=$(echo "$LOGIN_RESPONSE" | head -n -1)
LOGIN_STATUS=$(echo "$LOGIN_RESPONSE" | tail -n 1)

if [ "$LOGIN_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ PASSED${NC} - Login successful (Database connected!)"

    # Extract token using grep and sed (more portable than jq)
    TOKEN=$(echo "$LOGIN_BODY" | grep -o '"accessToken":"[^"]*' | sed 's/"accessToken":"//')

    if [ -n "$TOKEN" ]; then
        echo -e "${GREEN}✅ JWT Token received${NC}"
        echo "Token (first 50 chars): ${TOKEN:0:50}..."
    else
        echo -e "${YELLOW}⚠️  WARNING${NC} - No token in response"
    fi
else
    echo -e "${RED}❌ FAILED${NC} - Login returned $LOGIN_STATUS"
    echo "Response: $LOGIN_BODY"
    echo ""
    echo -e "${RED}Database Connection Issue Detected!${NC}"
    echo ""
    echo "Possible causes:"
    echo "1. MongoDB Atlas IP not whitelisted (add 0.0.0.0/0)"
    echo "2. Wrong MONGO_URI in Vercel environment variables"
    echo "3. MongoDB cluster is paused"
    echo "4. Database user credentials incorrect"
    echo ""
    echo "Next steps:"
    echo "1. Check Vercel logs: vercel logs"
    echo "2. Verify MongoDB Atlas Network Access"
    echo "3. Run local test: node test-mongo-connection.js"
    echo "4. See: VERCEL_MONGODB_CONNECTION_FIX.md"
    exit 1
fi
echo ""

# Test 5: Super Admin Dashboard (Requires Database + Auth)
if [ -n "$TOKEN" ]; then
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Test 5: Super Admin Dashboard (Requires Auth)"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    DASHBOARD_RESPONSE=$(curl -s -w "\n%{http_code}" "${BASE_URL}/api/super-admin/dashboard" \
      -H "Authorization: Bearer ${TOKEN}")

    DASHBOARD_BODY=$(echo "$DASHBOARD_RESPONSE" | head -n -1)
    DASHBOARD_STATUS=$(echo "$DASHBOARD_RESPONSE" | tail -n 1)

    if [ "$DASHBOARD_STATUS" = "200" ]; then
        echo -e "${GREEN}✅ PASSED${NC} - Super Admin dashboard accessible"
        echo "Dashboard data: $DASHBOARD_BODY"
    else
        echo -e "${RED}❌ FAILED${NC} - Dashboard returned $DASHBOARD_STATUS"
        echo "Response: $DASHBOARD_BODY"
    fi
    echo ""
fi

# Summary
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                   Test Summary                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

if [ "$HEALTH_STATUS" = "200" ] && [ "$LOGIN_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ ALL CRITICAL TESTS PASSED!${NC}"
    echo ""
    echo "Your Vercel deployment is working correctly:"
    echo "  ✅ API is responding"
    echo "  ✅ MongoDB is connected"
    echo "  ✅ Authentication is working"
    echo "  ✅ Super Admin endpoints are accessible"
    echo ""
    echo "Next steps:"
    echo "1. Visit: ${BASE_URL}/api-docs"
    echo "2. Test other endpoints in Swagger UI"
    echo "3. Update your frontend to use: ${BASE_URL}"
    echo ""
elif [ "$HEALTH_STATUS" = "200" ] && [ "$LOGIN_STATUS" != "200" ]; then
    echo -e "${YELLOW}⚠️  PARTIAL SUCCESS${NC}"
    echo ""
    echo "API is deployed but database connection failed."
    echo ""
    echo "Action required:"
    echo "1. Run: vercel logs"
    echo "2. Check MongoDB Atlas Network Access (0.0.0.0/0)"
    echo "3. Verify MONGO_URI in Vercel environment variables"
    echo "4. See: DEPLOYMENT_CHECKLIST.md"
    echo "5. See: VERCEL_MONGODB_CONNECTION_FIX.md"
    echo ""
else
    echo -e "${RED}❌ DEPLOYMENT FAILED${NC}"
    echo ""
    echo "Basic endpoints are not responding."
    echo ""
    echo "Action required:"
    echo "1. Check Vercel deployment status"
    echo "2. Run: vercel logs"
    echo "3. Verify vercel.json configuration"
    echo "4. Check for build errors"
    echo ""
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "API Base URL: ${BASE_URL}"
echo "API Docs: ${BASE_URL}/api-docs"
echo "API Spec: ${BASE_URL}/api-spec.json"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
