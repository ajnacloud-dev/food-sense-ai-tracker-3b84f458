#!/bin/bash

API_URL="https://smartlink.ajna.cloud/ibexdb"
API_KEY="McuMsuWDXo1g9zqLBBzVy3uXsIKDklGT8GbIhpyl"
TENANT="test-tenant"
NAMESPACE="default"
TABLE_NAME="test_renamed_fields_v1"

echo "------------------------------------------------"
echo "Testing RENAMED fields: $TABLE_NAME"

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
        "owner_id": {"type": "string", "required": true},
        "process_status": {"type": "string", "required": true},
        "food_category": {"type": "string", "required": false},
        "food_description": {"type": "string", "required": false},
        "food_image_url": {"type": "string", "required": false},
        "ai_analysis_result": {"type": "string", "required": false},
        "process_error_message": {"type": "string", "required": false},
        "process_retry_count": {"type": "integer", "required": false},
        "time_estimated_completion": {"type": "string", "required": false},
        "time_completed_at": {"type": "string", "required": false},
        "record_created_at": {"type": "string", "required": true},
        "record_updated_at": {"type": "string", "required": true}
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

# Verify Write
WRITE_PAYLOAD=$(cat <<EOF
{
  "operation": "WRITE",
  "tenant_id": "$TENANT",
  "namespace": "$NAMESPACE",
  "table": "$TABLE_NAME",
  "records": [{
    "id": "rec_1",
    "owner_id": "u1",
    "food_category": "test"
  }]
}
EOF
)

WRITE_RESPONSE=$(curl -s -X POST "$API_URL" -H "Content-Type: application/json" -H "x-api-key: $API_KEY" -d "$WRITE_PAYLOAD")

if echo "$WRITE_RESPONSE" | grep -q '"success": true'; then
     echo "✅ PASS: Renamed fields WORK!"
else
     echo "❌ FAIL: Renamed fields BROKEN"
     echo "$WRITE_RESPONSE"
fi
