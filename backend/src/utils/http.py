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
    """Extract user ID from Cognito authorizer claims, request body, or headers."""
    # Try Cognito claims first
    try:
        claims = event.get('requestContext', {}).get('authorizer', {}).get('claims', {})
        if 'sub' in claims:
            return claims['sub']
    except:
        pass

    # Try request body
    try:
        body = json.loads(event.get('body', '{}'))
        if 'user_id' in body and body['user_id']:
            return body['user_id']
    except:
        pass

    # Try headers
    try:
        headers = event.get('headers', {})
        user_id = headers.get('X-User-ID') or headers.get('x-user-id')
        if user_id:
            return user_id
    except:
        pass

    # No user ID found - return None instead of hardcoded value
    return None
