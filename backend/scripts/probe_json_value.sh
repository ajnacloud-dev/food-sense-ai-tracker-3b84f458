#!/bin/bash

API_URL="https://smartlink.ajna.cloud/ibexdb"
API_KEY="McuMsuWDXo1g9zqLBBzVy3uXsIKDklGT8GbIhpyl"
TENANT="test-tenant"
NAMESPACE="default"
TABLE_NAME="app_pending_val_json_bug"

echo "------------------------------------------------"
echo "Testing JSON VALUE BUG: $TABLE_NAME"

# 1. Create Table (Full Schema)
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
        "status": {"type": "string", "required": true},
        "category": {"type": "string", "required": false},
        "description": {"type": "string", "required": false},
        "image_url": {"type": "string", "required": false},
        "analysis_result": {"type": "string", "required": false},
        "error_message": {"type": "string", "required": false},
        "retry_count": {"type": "integer", "required": false},
        "estimated_completion": {"type": "string", "required": false},
        "completed_at": {"type": "string", "required": false},
        "created_at": {"type": "string", "required": true},
        "updated_at": {"type": "string", "required": true}
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

# 2. Write with JSON STRING value
# We use single quotes for shell string to protect the double quotes
JSON_VAL='{"calories": 500, "nutrients": {"fat": 10}}'
# Escape double quotes for insertion into JSON payload
JSON_VAL_ESCAPED=${JSON_VAL//\"/\\\"}

echo "Testing value: $JSON_VAL_ESCAPED"

WRITE_PAYLOAD=$(cat <<EOF
{
  "operation": "WRITE",
  "tenant_id": "$TENANT",
  "namespace": "$NAMESPACE",
  "table": "$TABLE_NAME",
  "records": [{
    "id": "rec_json_bug",
    "user_id": "test",
    "status": "pending",
    "analysis_result": "$JSON_VAL_ESCAPED"
  }]
}
EOF
)

# Debug: Print payload to check escaping
echo "Payload: $WRITE_PAYLOAD"

WRITE_RESPONSE=$(curl -s -X POST "$API_URL" -H "Content-Type: application/json" -H "x-api-key: $API_KEY" -d "$WRITE_PAYLOAD")

if echo "$WRITE_RESPONSE" | grep -q '"success": true'; then
     echo "✅ PASS: JSON Value worked!"
else
     echo "❌ FAIL: JSON Value BUG CONFIRMED!"
     echo "$WRITE_RESPONSE"
fi
