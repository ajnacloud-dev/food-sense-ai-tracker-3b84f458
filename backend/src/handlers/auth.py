import os
from utils.http import respond

# Load config from env
COGNITO_USER_POOL_ID = os.environ.get('COGNITO_USER_POOL_ID')
COGNITO_CLIENT_ID = os.environ.get('COGNITO_CLIENT_ID')
COGNITO_REGION = os.environ.get('COGNITO_REGION', 'us-east-1')

def get_config(event, context):
    """GET /v1/auth/config"""
    return respond(200, {
        "userPoolId": COGNITO_USER_POOL_ID,
        "userPoolClientId": COGNITO_CLIENT_ID,
        "region": COGNITO_REGION
    })

def redeem_invitation(event, context):
    """POST /v1/auth/invitations/redeem"""
    # Placeholder for invitation redemption logic
    # In real app, we verify the code and update the user record
    return respond(200, {"status": "success", "message": "Invitation redeemed"})
