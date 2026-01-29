#!/bin/bash
API_URL="http://localhost:8000"

echo "Creating Local Dev User..."
USER_PAYLOAD='{
    "id": "local-dev-user",
    "username": "Local Developer",
    "email": "dev@local.com",
    "role": "participant" 
}'
# Note: Schema for users might require other fields?
# Let's check schema. schemas/users.json usually has id, username, email.

curl -v -X POST "$API_URL/v1/users" \
  -H "Content-Type: application/json" \
  -d "$USER_PAYLOAD"
echo ""
