#!/bin/bash

# Configuration
API_URL="https://smartlink.ajna.cloud/ibexdb"
API_KEY="McuMsuWDXo1g9zqLBBzVy3uXsIKDklGT8GbIhpyl"
TENANT="test-tenant"
NAMESPACE="default"

test_field() {
    local FIELD_NAME=$1
    local TABLE_NAME="test_keyword_${FIELD_NAME}_v1"
    
    echo "------------------------------------------------"
    echo "Testing field name: $FIELD_NAME"
    
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
      "$FIELD_NAME": {"type": "string", "required": false}
    }
  }
}
EOF
)

    RESPONSE=$(curl -s -X POST "$API_URL" \
      -H "Content-Type: application/json" \
      -H "x-api-key: $API_KEY" \
      -d "$PAYLOAD")
      
    if ! echo "$RESPONSE" | grep -q '"success": true'; then
        echo "❌ CREATE_TABLE failed for $FIELD_NAME"
        return 1
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
    "$FIELD_NAME": "test_value"
  }]
}
EOF
)
    
    WRITE_RESPONSE=$(curl -s -X POST "$API_URL" \
      -H "Content-Type: application/json" \
      -H "x-api-key: $API_KEY" \
      -d "$WRITE_PAYLOAD")

    if echo "$WRITE_RESPONSE" | grep -q "Field .* does not exist"; then
         echo "❌ FAIL: '$FIELD_NAME' is a RESERVED/BROKEN KEYWORD"
    elif echo "$WRITE_RESPONSE" | grep -q '"success": true'; then
         echo "✅ PASS: '$FIELD_NAME' works"
    else
         echo "❌ UNKNOWN ERROR for $FIELD_NAME"
         echo "$WRITE_RESPONSE"
    fi
}

test_field "category"
test_field "status"
test_field "description"
test_field "image_url"
test_field "analysis_result"
test_field "error_message"
test_field "retry_count"
test_field "estimated_completion"
test_field "completed_at"
test_field "created_at"
test_field "updated_at"
