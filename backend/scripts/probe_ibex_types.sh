#!/bin/bash

# Configuration
API_URL="https://smartlink.ajna.cloud/ibexdb"
API_KEY="McuMsuWDXo1g9zqLBBzVy3uXsIKDklGT8GbIhpyl"
TENANT="test-tenant"
NAMESPACE="default"

# Function to test specific types
test_types() {
    local TABLE_NAME="test_types_v1"
    
    echo "------------------------------------------------"
    echo "Testing table with MIXED types: $TABLE_NAME"
    
    # Construct Payload with integer, boolean, double
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
      "name": {"type": "string", "required": true},
      "age": {"type": "integer", "required": false},
      "score": {"type": "double", "required": false},
      "is_active": {"type": "boolean", "required": false},
      "tags": {"type": "string", "required": false}
    }
  }
}
EOF
)
    
    # Send Request
    echo "Sending CREATE_TABLE request..."
    RESPONSE=$(curl -s -X POST "$API_URL" \
      -H "Content-Type: application/json" \
      -H "x-api-key: $API_KEY" \
      -d "$PAYLOAD")
      
    echo "Response: $RESPONSE"
    
    if ! echo "$RESPONSE" | grep -q '"success": true'; then
        echo "❌ CREATE_TABLE failed"
        return 1
    fi
    
    # Verify by WRITING a record with ALL types
    echo "Verifying by writing record..."
    
    WRITE_PAYLOAD=$(cat <<EOF
{
  "operation": "WRITE",
  "tenant_id": "$TENANT",
  "namespace": "$NAMESPACE",
  "table": "$TABLE_NAME",
  "records": [{
    "id": "rec_1",
    "name": "Test User",
    "age": 25,
    "score": 98.6,
    "is_active": true,
    "tags": "test,probe"
  }]
}
EOF
)
    
    WRITE_RESPONSE=$(curl -s -X POST "$API_URL" \
      -H "Content-Type: application/json" \
      -H "x-api-key: $API_KEY" \
      -d "$WRITE_PAYLOAD")

    echo "Write Response: $WRITE_RESPONSE"

    if echo "$WRITE_RESPONSE" | grep -q "Field .* does not exist"; then
         echo "❌ WRITE FAILED: Missing fields!"
         MISSING=$(echo "$WRITE_RESPONSE" | grep -o 'Field ".*" does not exist')
         echo "Missing: $MISSING"
         return 1
    elif echo "$WRITE_RESPONSE" | grep -q '"success": true'; then
         echo "✅ WRITE SUCCESS: Mixed types worked"
         return 0
    else
         echo "❌ WRITE FAILED with unknown error"
         return 1
    fi
}

test_types
