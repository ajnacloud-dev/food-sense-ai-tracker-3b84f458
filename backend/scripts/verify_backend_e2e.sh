#!/bin/bash

# Configuration
API_URL="http://localhost:8080"
API_KEY="test-key"  # Local server might not enforce? Or uses Dummy.

echo "------------------------------------------------"
echo "Starting End-to-End Backend Verification"

# Check if server is up
echo "Checking server health..."
curl -s "$API_URL/" > /dev/null
if [ $? -ne 0 ]; then
    echo "❌ Server is NOT running on $API_URL. Please start it!"
    exit 1
fi

# 1. Reset Database
echo "1. Resetting Database..."
RESPONSE=$(curl -s -X POST "$API_URL/v1/system/reset-database")
echo "$RESPONSE"

# 2. Initialize Schemas
echo "2. Initializing Schemas..."
RESPONSE=$(curl -s -X POST "$API_URL/v1/system/initialize-schemas")
echo "$RESPONSE"

# 3. Create User
echo "3. Creating User..."
USER_PAYLOAD='{"id": "test_user_1", "username": "testuser", "email": "test@example.com"}'
RESPONSE=$(curl -s -X POST "$API_URL/v1/users" -d "$USER_PAYLOAD")
echo "$RESPONSE"

# 4. Create Pending Analysis
echo "4. Creating Pending Analysis..."
# Note: Omitting optional fields to test ROBUSTNESS (Server Fix)
ANALYSIS_PAYLOAD='{
    "id": "analysis_1",
    "user_id": "test_user_1",
    "status": "pending",
    "image_url": "http://example.com/food.jpg"
}'
RESPONSE=$(curl -s -X POST "$API_URL/v1/pending_analyses" -d "$ANALYSIS_PAYLOAD")
echo "Create Response: $RESPONSE"

if echo "$RESPONSE" | grep -q '"id": "analysis_1"'; then
     echo "✅ Create Analysis SUCCESS"
else
     echo "❌ Create Analysis FAILED"
     exit 1
fi

# 5. Verify Get
echo "5. Verifying GET..."
RESPONSE=$(curl -s -X GET "$API_URL/v1/pending_analyses/analysis_1")
echo "Get Response: $RESPONSE"

if echo "$RESPONSE" | grep -q '"status": "pending"'; then
     echo "✅ E2E Verification PASSED!"
else
     echo "❌ GET Verification FAILED"
     exit 1
fi
