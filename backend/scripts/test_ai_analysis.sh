#!/bin/bash

API_URL="http://localhost:8080"
IMAGE_FILE="biryani.jpg"

if [ ! -f "$IMAGE_FILE" ]; then
    echo "❌ Image file $IMAGE_FILE not found!"
    exit 1
fi

echo "------------------------------------------------"
echo "Starting AI Analysis Test with $IMAGE_FILE"

# 1. Encode Image to Base64
echo "Encoding image..."
B64_DATA=$(base64 < "$IMAGE_FILE")
# Remove newlines
B64_DATA=$(echo "$B64_DATA" | tr -d '\n')
DATA_URL="data:image/jpeg;base64,$B64_DATA"

# 2. Call Analyze API
echo "Sending to AI Analysis API..."
# Truncate image for log (avoid spamming terminal)
echo "Payload size: ${#DATA_URL} chars"

# We use python to send request because payload is huge for curl arg list potentially?
# Actually curl -d @file is better.
# Let's create a temp json file.

cat <<EOF > payload.json
{
  "description": "A plate of biryani",
  "imageUrl": "$DATA_URL"
}
EOF

RESPONSE=$(curl -s -X POST "$API_URL/v1/analyze" \
  -H "Content-Type: application/json" \
  -d @payload.json)

echo "Analyze Response: $(echo "$RESPONSE" | head -c 200)..."

if echo "$RESPONSE" | grep -q '"success": true'; then
     echo "✅ Analysis SUCCESS"
     ENTRY_ID=$(echo "$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('entry_id', ''))")
     echo "Entry ID: $ENTRY_ID"
else
     echo "❌ Analysis FAILED"
     echo "$RESPONSE"
     rm payload.json
     exit 1
fi

rm payload.json

# 3. Verify Storage
echo "Verifying Storage..."
# Wait a sec for consistency? (Local is consistent)
RESPONSE=$(curl -s -X GET "$API_URL/v1/food_entries")

# Check if Entry ID is in the list
if echo "$RESPONSE" | grep -q "$ENTRY_ID"; then
     echo "✅ Entry FOUND in Database!"
     # Extract details
     # Python parsing to show the entry
     echo "$RESPONSE" | python3 -c "import sys, json; 
data=json.load(sys.stdin); 
entries=data.get('entries',[]); 
found = next((e for e in entries if e['id'] == '$ENTRY_ID'), None);
print(json.dumps(found, indent=2))"
else
     echo "❌ Entry NOT FOUND in Database"
     exit 1
fi
