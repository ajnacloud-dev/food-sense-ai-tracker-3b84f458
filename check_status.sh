#!/bin/bash

echo "=========================================="
echo "🚀 NutriWealth App Status Check"
echo "=========================================="
echo ""

# Check Backend
echo "📡 Backend Status (Port 8080):"
if curl -s -f -o /dev/null http://localhost:8080/v1/auth/config; then
    echo "   ✅ Backend is running"
    echo "   Endpoint: http://localhost:8080"
else
    echo "   ❌ Backend is not responding"
fi

# Check Frontend
echo ""
echo "🖥️  Frontend Status (Port 8081):"
if curl -s -f -o /dev/null http://localhost:8081; then
    echo "   ✅ Frontend is running"
    echo "   URL: http://localhost:8081"
else
    echo "   ❌ Frontend is not responding"
fi

# Test Backend API
echo ""
echo "🔍 Testing Backend API:"
response=$(curl -s -w "\n%{http_code}" http://localhost:8080/v1/food_entries -H "Authorization: Bearer dev-user-1")
status_code=$(echo "$response" | tail -n 1)
if [ "$status_code" = "200" ]; then
    echo "   ✅ API is responding correctly"
else
    echo "   ⚠️  API returned status: $status_code"
fi

echo ""
echo "=========================================="
echo "📱 To use the app:"
echo "   1. Open your browser"
echo "   2. Go to: http://localhost:8081"
echo "   3. Login with test credentials:"
echo "      - Username: dev@local.com"
echo "      - Password: Test123!"
echo "=========================================="