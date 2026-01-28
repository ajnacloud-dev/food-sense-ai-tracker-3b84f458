#!/bin/bash

API_URL="https://smartlink.ajna.cloud/ibexdb"
API_KEY="McuMsuWDXo1g9zqLBBzVy3uXsIKDklGT8GbIhpyl"
TENANT="test-tenant"
NAMESPACE="default"

test_variant() {
    local VARIANT_NAME=$1
    local PAYLOAD=$2
    local TABLE_NAME="test_workaround_${VARIANT_NAME}_v1"
    
    echo "------------------------------------------------"
    echo "Testing Variant: $VARIANT_NAME"
    
    # Inject Table Name
    FINAL_PAYLOAD=$(echo "$PAYLOAD" | sed "s/TABLE_NAME_PLACEHOLDER/$TABLE_NAME/g")
    
    RESPONSE=$(curl -s -X POST "$API_URL" -H "Content-Type: application/json" -H "x-api-key: $API_KEY" -d "$FINAL_PAYLOAD")
    
    if ! echo "$RESPONSE" | grep -q '"success": true'; then
        echo "❌ CREATE_TABLE failed"
        return 1
    fi
    
    # Verify by writing ALL fields
    # (Simplified: just check one critical field like 'retry_count' or 'category')
    WRITE_PAYLOAD=$(cat <<EOF
{
  "operation": "WRITE",
  "tenant_id": "$TENANT",
  "namespace": "$NAMESPACE",
  "table": "$TABLE_NAME",
  "records": [{
    "id": "rec_1",
    "category": "test",
    "retry_count": "1"
  }]
}
EOF
)
    
    WRITE_RESPONSE=$(curl -s -X POST "$API_URL" -H "Content-Type: application/json" -H "x-api-key: $API_KEY" -d "$WRITE_PAYLOAD")

    if echo "$WRITE_RESPONSE" | grep -q "Field .* does not exist"; then
         echo "❌ FAIL: Still broken!"
         echo "$WRITE_RESPONSE"
    elif echo "$WRITE_RESPONSE" | grep -q '"success": true'; then
         echo "✅ PASS: Variant '$VARIANT_NAME' WORKS!"
    else
         echo "❌ UNKNOWN ERROR"
    fi
}

# Variant 1: Change retry_count to STRING
PAYLOAD_1=$(cat <<EOF
{
  "operation": "CREATE_TABLE",
  "tenant_id": "$TENANT",
  "namespace": "$NAMESPACE",
  "table": "TABLE_NAME_PLACEHOLDER",
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
        "retry_count": {"type": "string", "required": false}, 
        "estimated_completion": {"type": "string", "required": false},
        "completed_at": {"type": "string", "required": false},
        "created_at": {"type": "string", "required": true},
        "updated_at": {"type": "string", "required": true}
    }
  }
}
EOF
)
test_variant "retry_count_string" "$PAYLOAD_1"

# Variant 2: Reorder - move optional fields to end
PAYLOAD_2=$(cat <<EOF
{
  "operation": "CREATE_TABLE",
  "tenant_id": "$TENANT",
  "namespace": "$NAMESPACE",
  "table": "TABLE_NAME_PLACEHOLDER",
  "if_not_exists": true,
  "schema": {
    "fields": {
        "id": {"type": "string", "required": true},
        "user_id": {"type": "string", "required": true},
        "status": {"type": "string", "required": true},
        "created_at": {"type": "string", "required": true},
        "updated_at": {"type": "string", "required": true},
        "category": {"type": "string", "required": false},
        "description": {"type": "string", "required": false},
        "image_url": {"type": "string", "required": false},
        "analysis_result": {"type": "string", "required": false},
        "error_message": {"type": "string", "required": false},
        "retry_count": {"type": "integer", "required": false},
        "estimated_completion": {"type": "string", "required": false},
        "completed_at": {"type": "string", "required": false}
    }
  }
}
EOF
)
test_variant "reordered" "$PAYLOAD_2"
