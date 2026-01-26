import json

def respond(status_code, body, is_base64=False):
    return {
        "statusCode": status_code,
        "headers": {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Tenant-ID",
            "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
            "Content-Type": "application/json" if not is_base64 else "application/octet-stream"
        },
        "body": body if is_base64 else json.dumps(body),
        "isBase64Encoded": is_base64
    }

def get_user_id(event):
    """Extract user ID from Cognito authorizer claims or fallback."""
    try:
        claims = event.get('requestContext', {}).get('authorizer', {}).get('claims', {})
        if 'sub' in claims:
            return claims['sub']
    except:
        pass
    
    # In production, this should likely fail if no user ID is found. 
    # For now, we use a test fallback as requested.
    return "test-user-id"
