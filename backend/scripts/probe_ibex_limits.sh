#!/bin/bash

# Configuration
API_URL="https://smartlink.ajna.cloud/ibexdb"
API_KEY="McuMsuWDXo1g9zqLBBzVy3uXsIKDklGT8GbIhpyl"
TENANT="test-tenant"
NAMESPACE="default"

# Function to create a table with N fields
create_table_n_fields() {
    local N=$1
    local TABLE_NAME="test_limit_${N}_fields_v2"
    
    echo "------------------------------------------------"
    echo "Testing table with $N fields: $TABLE_NAME"
    
    # Build schema fields JSON
    FIELDS_JSON=""
    for ((i=1; i<=N; i++)); do
        FIELDS_JSON+="\"field_${i}\": {\"type\": \"string\", \"required\": false}"
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
    RESPONSE=$(curl -s -X POST "$API_URL" \
      -H "Content-Type: application/json" \
      -H "x-api-key: $API_KEY" \
      -d "$PAYLOAD")
      
    echo "Response: $RESPONSE"
    
    # Check if successful
    if echo "$RESPONSE" | grep -q '"success": true'; then
        echo "✅ CREATE_TABLE success"
    else
        echo "❌ CREATE_TABLE failed"
        return 1
    fi
    
    # Verify by WRITING a record with ALL fields
    echo "Verifying by writing record..."
    
    # Build record JSON
    RECORD_JSON=""
    for ((i=1; i<=N; i++)); do
        RECORD_JSON+="\"field_${i}\": \"value_${i}\""
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
         # Extract which field is missing
         MISSING=$(echo "$WRITE_RESPONSE" | grep -o 'Field "field_[0-9]*" does not exist')
         echo "Missing: $MISSING"
         return 1
    elif echo "$WRITE_RESPONSE" | grep -q '"success": true'; then
         echo "✅ WRITE SUCCESS: All $N fields created correctly"
         return 0
    else
         echo "❌ WRITE FAILED with unknown error"
         return 1
    fi
}

# Run Probe
# We know 10 works. We know ~13 failed in app.

# Test 12 fields (Total 13 including 'id')
create_table_n_fields 12

# Test 15 fields (Total 16 including 'id')
create_table_n_fields 15

# Test 20 fields (Total 21 including 'id')
create_table_n_fields 20

echo "------------------------------------------------"
echo "Probe Complete"
