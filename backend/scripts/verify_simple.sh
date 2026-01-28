#!/bin/bash
API_URL="http://localhost:8080"

echo "Creating Pending Analysis..."
ANALYSIS_PAYLOAD='{
    "id": "analysis_debug",
    "user_id": "test_user_debug",
    "status": "pending",
    "image_url": "http://example.com/food.jpg"
}'
# Use -v for verbose to see headers
curl -v -X POST "$API_URL/v1/pending_analyses" -d "$ANALYSIS_PAYLOAD"
echo ""
