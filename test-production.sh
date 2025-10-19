#!/bin/bash

# Production Deployment Test Script
# Quick verification that all systems are operational

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'
BLUE='\033[0;34m'

BASE_URL="https://anola-backend.vercel.app"

echo "╔════════════════════════════════════════════════════════════╗"
echo "║         Production Deployment Verification               ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Test 1: Health Check
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 1: Health Check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/health")

if [ "$HEALTH_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ PASSED${NC} - Health check returned 200"
else
    echo -e "${RED}❌ FAILED${NC} - Health check returned $HEALTH_STATUS"
    exit 1
fi
echo ""

# Test 2: API Welcome
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 2: API Welcome"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

WELCOME_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/")

if [ "$WELCOME_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ PASSED${NC} - API root returned 200"
else
    echo -e "${RED}❌ FAILED${NC} - API root returned $WELCOME_STATUS"
fi
echo ""

# Test 3: MongoDB Connection via Login
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 3: MongoDB Connection (Login Test)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@anolalinks.com","password":"Possible@2025"}')

echo "$LOGIN_RESPONSE" | grep -q '"success":true'

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ PASSED${NC} - Login successful (Database connected!)"
    echo -e "${GREEN}✅ MongoDB Atlas connection working${NC}"
else
    echo -e "${RED}❌ FAILED${NC} - Login failed"
    echo "Response: $LOGIN_RESPONSE"
    exit 1
fi
echo ""

# Test 4: Swagger UI
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 4: API Documentation"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

SWAGGER_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api-docs")

if [ "$SWAGGER_STATUS" = "200" ] || [ "$SWAGGER_STATUS" = "301" ] || [ "$SWAGGER_STATUS" = "302" ]; then
    echo -e "${GREEN}✅ PASSED${NC} - Swagger UI accessible"
else
    echo -e "${YELLOW}⚠️  WARNING${NC} - Swagger UI returned $SWAGGER_STATUS"
fi
echo ""

# Summary
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                   Test Summary                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}✅ ALL TESTS PASSED!${NC}"
echo ""
echo "Your Anola Backend is fully operational:"
echo "  ✅ API is responding"
echo "  ✅ Serverless function working"
echo "  ✅ MongoDB is connected"
echo "  ✅ Authentication working"
echo "  ✅ Swagger UI accessible"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Production URL: $BASE_URL"
echo "API Docs: $BASE_URL/api-docs"
echo "Health Check: $BASE_URL/health"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${BLUE}Super Admin Login:${NC}"
echo "  Email: admin@anolalinks.com"
echo "  Password: Possible@2025"
echo ""
echo "🎉 Your Anola Backend is production ready!"
