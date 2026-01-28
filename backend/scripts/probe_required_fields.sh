#!/bin/bash

API_URL="https://smartlink.ajna.cloud/ibexdb"
API_KEY="McuMsuWDXo1g9zqLBBzVy3uXsIKDklGT8GbIhpyl"
TENANT="test-tenant"
NAMESPACE="default"

test_required_limit() {
    local N=10
    local TABLE_NAME="test_limit_required_v1"
    
    echo "------------------------------------------------"
    echo "Testing $N REQUIRED fields: $TABLE_NAME"
    
    # Build schema fields JSON
    FIELDS_JSON=""
    for ((i=1; i<=N; i++)); do
        FIELDS_JSON+="\"field_${i}\": {\"type\": \"string\", \"required\": true}"
        if [ $i -lt $N ]; then
            FIELDS_JSON+=", "
        fi
    done
    
    # Construct Payload
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
      $FIELDS_JSON
    }
  }
}
EOF
)
    
    # Send Request
    echo "Sending CREATE_TABLE request..."
    RESPONSE=$(curl -s -X POST "$API_URL" -H "Content-Type: application/json" -H "x-api-key: $API_KEY" -d "$PAYLOAD")
    
    if ! echo "$RESPONSE" | grep -q '"success": true'; then
        echo "❌ CREATE_TABLE failed"
        return 1
    fi
    
    # Verify by writing 
    # Must include ALL fields because they are required!
    RECORD_JSON=""
    for ((i=1; i<=N; i++)); do
        RECORD_JSON+="\"field_${i}\": \"val\""
        if [ $i -lt $N ]; then
            RECORD_JSON+=", "
        fi
    done
    
    WRITE_PAYLOAD=$(cat <<EOF
{
  "operation": "WRITE",
  "tenant_id": "$TENANT",
  "namespace": "$NAMESPACE",
  "table": "$TABLE_NAME",
  "records": [{
    "id": "rec_1",
    $RECORD_JSON
  }]
}
EOF
)
    
    WRITE_RESPONSE=$(curl -s -X POST "$API_URL" -H "Content-Type: application/json" -H "x-api-key: $API_KEY" -d "$WRITE_PAYLOAD")

    if echo "$WRITE_RESPONSE" | grep -q "Field .* does not exist"; then
         echo "❌ FAIL: Required fields truncated!"
         echo "$WRITE_RESPONSE"
    elif echo "$WRITE_RESPONSE" | grep -q '"success": true'; then
         echo "✅ PASS: Required fields worked"
    else
         echo "❌ FAIL: Unknown error"
         echo "$WRITE_RESPONSE"
    fi
}

test_required_limit
