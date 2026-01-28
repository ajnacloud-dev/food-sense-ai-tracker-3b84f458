#!/bin/bash

# Configuration
API_URL="https://smartlink.ajna.cloud/ibexdb"
API_KEY="McuMsuWDXo1g9zqLBBzVy3uXsIKDklGT8GbIhpyl"
TENANT="test-tenant"
NAMESPACE="default"
TABLE_NAME="app_pending_analyses"

echo "------------------------------------------------"
echo "Testing SPECIFIC table creation: $TABLE_NAME"

# 1. DROP the table first to be sure
echo "Dropping table..."
curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d "{
  \"operation\": \"DROP_TABLE\",
  \"tenant_id\": \"$TENANT\",
  \"namespace\": \"$NAMESPACE\",
  \"table\": \"$TABLE_NAME\",
  \"purge\": true
}"
echo ""
echo "Waiting 5 seconds..."
sleep 5

# 2. CREATE the table with FULL SCHEMA
echo "Creating table..."
PAYLOAD=$(cat <<EOF
{
  "operation": "CREATE_TABLE",
  "tenant_id": "$TENANT",
  "namespace": "$NAMESPACE",
  "table": "$TABLE_NAME",
  "if_not_exists": true,
  "schema": {
    "fields": {
        "id": {
            "type": "string",
            "required": true
        },
        "user_id": {
            "type": "string",
            "required": true
        },
        "status": {
            "type": "string",
            "required": true
        },
        "category": {
            "type": "string",
            "required": false
        },
        "description": {
            "type": "string",
            "required": false
        },
        "image_url": {
            "type": "string",
            "required": false
        },
        "analysis_result": {
            "type": "string",
            "required": false
        },
        "error_message": {
            "type": "string",
            "required": false
        },
        "retry_count": {
            "type": "integer",
            "required": false
        },
        "estimated_completion": {
            "type": "string",
            "required": false
        },
        "completed_at": {
            "type": "string",
            "required": false
        },
        "created_at": {
            "type": "string",
            "required": true
        },
        "updated_at": {
            "type": "string",
            "required": true
        }
    }
  }
}
EOF
)

RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d "$PAYLOAD")

echo "Create Response: $RESPONSE"

# 3. VERIFY by writing a record with analysis_result
echo "Verifying..."
WRITE_PAYLOAD=$(cat <<EOF
{
  "operation": "WRITE",
  "tenant_id": "$TENANT",
  "namespace": "$NAMESPACE",
  "table": "$TABLE_NAME",
  "records": [{
    "id": "test_id_123",
    "user_id": "test_user",
    "status": "pending",
    "image_url": "http://test.com/img.jpg",
    "analysis_result": "{\"calories\": 500}",
    "retry_count": 0,
    "created_at": "2023-01-01",
    "updated_at": "2023-01-01"
  }]
}
EOF
)

WRITE_RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d "$WRITE_PAYLOAD")

echo "Write Response: $WRITE_RESPONSE"

if echo "$WRITE_RESPONSE" | grep -q '"success": true'; then
     echo "✅ SUCCESS: Table created correctly via CURL"
else
     echo "❌ FAILURE: Table created via CURL is BROKEN"
fi
