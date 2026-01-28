#!/bin/bash

# Configuration
API_URL="https://smartlink.ajna.cloud/ibexdb"
API_KEY="McuMsuWDXo1g9zqLBBzVy3uXsIKDklGT8GbIhpyl"
TENANT="test-tenant"
NAMESPACE="default"

test_schema() {
    local NAME=$1
    local SCHEMA_JSON=$2
    local WRITE_JSON=$3
    local TABLE_NAME="test_subset_${NAME}_v1"
    
    echo "------------------------------------------------"
    echo "Testing Subset: $NAME"
    
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
      $SCHEMA_JSON
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
        echo "❌ CREATE_TABLE failed for $NAME"
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
    $WRITE_JSON
  }]
}
EOF
)
    
    WRITE_RESPONSE=$(curl -s -X POST "$API_URL" \
      -H "Content-Type: application/json" \
      -H "x-api-key: $API_KEY" \
      -d "$WRITE_PAYLOAD")

    if echo "$WRITE_RESPONSE" | grep -q "Field .* does not exist"; then
         echo "❌ FAIL: Subset '$NAME' has missing fields!"
         MISSING=$(echo "$WRITE_RESPONSE" | grep -o 'Field ".*" does not exist')
         echo "Missing: $MISSING"
    elif echo "$WRITE_RESPONSE" | grep -q '"success": true'; then
         echo "✅ PASS: Subset '$NAME' works"
    else
         echo "❌ UNKNOWN ERROR for $NAME"
    fi
}

# Test 1: First 6 fields (user_id, status, category, description, image_url, analysis_result)
SCHEMA_1='"user_id": {"type": "string"}, "status": {"type": "string"}, "category": {"type": "string"}, "description": {"type": "string"}, "image_url": {"type": "string"}, "analysis_result": {"type": "string"}'
WRITE_1='"user_id": "u1", "status": "s", "category": "c", "description": "d", "image_url": "i", "analysis_result": "a"'
test_schema "first_6" "$SCHEMA_1" "$WRITE_1"

# Test 2: Last 6 fields (error_message, retry_count, estimated_completion, completed_at, created_at, updated_at)
SCHEMA_2='"error_message": {"type": "string"}, "retry_count": {"type": "integer"}, "estimated_completion": {"type": "string"}, "completed_at": {"type": "string"}, "created_at": {"type": "string"}, "updated_at": {"type": "string"}'
WRITE_2='"error_message": "e", "retry_count": 1, "estimated_completion": "e", "completed_at": "c", "created_at": "c", "updated_at": "u"'
test_schema "last_6" "$SCHEMA_2" "$WRITE_2"

# Test 3: First 10 fields (Combine 1 + first 4 of 2)
SCHEMA_3="$SCHEMA_1, \"error_message\": {\"type\": \"string\"}, \"retry_count\": {\"type\": \"integer\"}, \"estimated_completion\": {\"type\": \"string\"}, \"completed_at\": {\"type\": \"string\"}"
WRITE_3="$WRITE_1, \"error_message\": \"e\", \"retry_count\": 1, \"estimated_completion\": \"e\", \"completed_at\": \"c\""
test_schema "first_10" "$SCHEMA_3" "$WRITE_3"
