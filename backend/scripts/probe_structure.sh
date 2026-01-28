#!/bin/bash

API_URL="https://smartlink.ajna.cloud/ibexdb"
API_KEY="McuMsuWDXo1g9zqLBBzVy3uXsIKDklGT8GbIhpyl"
TENANT="test-tenant"
NAMESPACE="default"
TABLE_NAME="app_pending_analyses_probe"

echo "------------------------------------------------"
echo "Creating table $TABLE_NAME (Full Schema)..."

# 1. Drop existing
curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d "{ \"operation\": \"DROP_TABLE\", \"tenant_id\": \"$TENANT\", \"namespace\": \"$NAMESPACE\", \"table\": \"$TABLE_NAME\", \"purge\": true }" > /dev/null
sleep 2

# 2. Create Full
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
curl -s -X POST "$API_URL" -H "Content-Type: application/json" -H "x-api-key: $API_KEY" -d "$PAYLOAD" > /dev/null

# 3. Probe Fields
echo "Probing fields..."

FIELDS=("user_id" "status" "category" "description" "image_url" "analysis_result" "error_message" "retry_count" "estimated_completion" "completed_at" "created_at" "updated_at")

for FIELD in "${FIELDS[@]}"; do
    # Try to write record with JUST id and this field
    VAL="test_val"
    if [ "$FIELD" == "retry_count" ]; then VAL=1; fi
    
    WRITE_PAYLOAD=$(cat <<EOF
{
  "operation": "WRITE",
  "tenant_id": "$TENANT",
  "namespace": "$NAMESPACE",
  "table": "$TABLE_NAME",
  "records": [{
    "id": "probe_$FIELD",
    "$FIELD": "$VAL"
  }]
}
EOF
)
    RESPONSE=$(curl -s -X POST "$API_URL" -H "Content-Type: application/json" -H "x-api-key: $API_KEY" -d "$WRITE_PAYLOAD")
    
    if echo "$RESPONSE" | grep -q '"success": true'; then
        echo "✅ Present: $FIELD"
    else
        echo "❌ MISSING: $FIELD"
    fi
done
