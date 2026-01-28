#!/bin/bash

API_URL="https://smartlink.ajna.cloud/ibexdb"
API_KEY="McuMsuWDXo1g9zqLBBzVy3uXsIKDklGT8GbIhpyl"
TENANT="test-tenant"
NAMESPACE="default"
TABLE_NAME="app_pending_analyses_optional_fix"

echo "------------------------------------------------"
echo "Testing OPTIONAL fields workaround: $TABLE_NAME"

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
        "user_id": {"type": "string", "required": false},
        "status": {"type": "string", "required": false},
        "category": {"type": "string", "required": false},
        "description": {"type": "string", "required": false},
        "image_url": {"type": "string", "required": false},
        "analysis_result": {"type": "string", "required": false},
        "error_message": {"type": "string", "required": false},
        "retry_count": {"type": "integer", "required": false},
        "estimated_completion": {"type": "string", "required": false},
        "completed_at": {"type": "string", "required": false},
        "created_at": {"type": "string", "required": false},
        "updated_at": {"type": "string", "required": false}
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

# Verify by writing fields
WRITE_PAYLOAD=$(cat <<EOF
{
  "operation": "WRITE",
  "tenant_id": "$TENANT",
  "namespace": "$NAMESPACE",
  "table": "$TABLE_NAME",
  "records": [{
    "id": "rec_1",
    "user_id": "test",
    "status": "test",
    "category": "test"
  }]
}
EOF
)

WRITE_RESPONSE=$(curl -s -X POST "$API_URL" -H "Content-Type: application/json" -H "x-api-key: $API_KEY" -d "$WRITE_PAYLOAD")

if echo "$WRITE_RESPONSE" | grep -q '"success": true'; then
     echo "✅ PASS: Optional fields workaround WORKS!"
else
     echo "❌ FAIL: Still broken!"
     echo "$WRITE_RESPONSE"
fi
