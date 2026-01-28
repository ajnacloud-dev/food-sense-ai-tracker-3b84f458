#!/bin/bash

# Configuration
API_URL="https://smartlink.ajna.cloud/ibexdb"
API_KEY="McuMsuWDXo1g9zqLBBzVy3uXsIKDklGT8GbIhpyl"
TENANT="test-tenant"
NAMESPACE="default"

test_long_names() {
    local N=13
    local TABLE_NAME="test_limit_size_v1"
    
    echo "------------------------------------------------"
    echo "Testing 13 fields with LONG names: $TABLE_NAME"
    
    # Build schema fields JSON with LONG names
    FIELDS_JSON=""
    for ((i=1; i<=N; i++)); do
        # Create a 50-char name
        NAME="field_${i}_$(printf 'a%.0s' {1..40})"
        FIELDS_JSON+="\"$NAME\": {\"type\": \"string\", \"required\": false}"
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
    
    echo "Payload size: ${#PAYLOAD} bytes"
    
    # Send Request
    echo "Sending CREATE_TABLE request..."
    RESPONSE=$(curl -s -X POST "$API_URL" \
      -H "Content-Type: application/json" \
      -H "x-api-key: $API_KEY" \
      -d "$PAYLOAD")
      
    echo "Response: $RESPONSE"
    
    if echo "$RESPONSE" | grep -q '"success": true'; then
        echo "✅ CREATE_TABLE success"
    else
        echo "❌ CREATE_TABLE failed"
        return 1
    fi
    
    # Verify by WRITING a record
    echo "Verifying by writing record..."
    
    RECORD_JSON=""
    for ((i=1; i<=N; i++)); do
        NAME="field_${i}_$(printf 'a%.0s' {1..40})"
        RECORD_JSON+="\"$NAME\": \"value_${i}\""
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
    
    WRITE_RESPONSE=$(curl -s -X POST "$API_URL" \
      -H "Content-Type: application/json" \
      -H "x-api-key: $API_KEY" \
      -d "$WRITE_PAYLOAD")

    echo "Write Response: $WRITE_RESPONSE"

    if echo "$WRITE_RESPONSE" | grep -q "Field .* does not exist"; then
         echo "❌ WRITE FAILED: Missing fields!"
    elif echo "$WRITE_RESPONSE" | grep -q '"success": true'; then
         echo "✅ WRITE SUCCESS: Long names worked"
    else
         echo "❌ WRITE FAILED with unknown error"
    fi
}

test_long_names
