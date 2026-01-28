#!/bin/bash

API_URL="https://smartlink.ajna.cloud/ibexdb"
API_KEY="McuMsuWDXo1g9zqLBBzVy3uXsIKDklGT8GbIhpyl"
TENANT="test-tenant"
NAMESPACE="default"
TABLE_NAME="app_pending_opt_bug_test"

echo "------------------------------------------------"
echo "Testing MISSING OPTIONAL FIELD: $TABLE_NAME"

# 1. Create Table (Schema with optional category)
PAYLOAD=$(cat <<EOF
{
  "operation": "CREATE_TABLE",
  "tenant_id": "$TENANT",
  "namespace": "$NAMESPACE",
  "table": "$TABLE_NAME",
  "if_not_exists": true,
  "schema": {
    "fields": {
        "id": {"type": "string", "required": true},
        "user_id": {"type": "string", "required": true},
        "category": {"type": "string", "required": false}
    }
  }
}
EOF
)

RESPONSE=$(curl -s -X POST "$API_URL" -H "Content-Type: application/json" -H "x-api-key: $API_KEY" -d "$PAYLOAD")

if ! echo "$RESPONSE" | grep -q '"success": true'; then
    echo "❌ CREATE_TABLE failed"
    exit 1
fi

# 2. Write WITHOUT category
WRITE_PAYLOAD=$(cat <<EOF
{
  "operation": "WRITE",
  "tenant_id": "$TENANT",
  "namespace": "$NAMESPACE",
  "table": "$TABLE_NAME",
  "records": [{
    "id": "rec_1",
    "user_id": "test"
  }]
}
EOF
)

WRITE_RESPONSE=$(curl -s -X POST "$API_URL" -H "Content-Type: application/json" -H "x-api-key: $API_KEY" -d "$WRITE_PAYLOAD")

if echo "$WRITE_RESPONSE" | grep -q "Field .* does not exist"; then
     echo "❌ FAIL: Missing optional field caused error!"
     echo "$WRITE_RESPONSE"
elif echo "$WRITE_RESPONSE" | grep -q '"success": true'; then
     echo "✅ PASS: Missing optional field is OK"
else
     echo "❌ UNKNOWN ERROR"
fi
