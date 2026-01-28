
import sys
import os
import json
import logging

# Add src to path
sys.path.append(os.path.join(os.path.dirname(__file__), '../src'))

from lib.ibex_client import IbexClient

logging.basicConfig(level=logging.INFO)

def run():
    print("🚀 Manually creating app_users_v5...")
    api_url = os.getenv("IBEX_API_URL", "https://smartlink.ajna.cloud/ibexdb")
    api_key = os.getenv("IBEX_API_KEY", "test-key") # Use dummy or real if needed
    tenant_id = "test-tenant"
    
    # We need to set env vars for IbexClient to work or pass them?
    # backend/src/lib/ibex_client.py signature: def __init__(self, api_url, api_key, tenant_id=None):
    client = IbexClient(api_url, api_key, tenant_id)
    
    # Define schema explicitly
    schema = {
        "fields": {
            "id": {"type": "string", "required": True},
            "email": {"type": "string", "required": True},
            "subscription_id": {"type": "string", "required": False}, # The problem field
            "role": {"type": "string", "required": False}
        }
    }
    
    table = "app_users_v5"
    
    # Create Table
    try:
        res = client.create_table(table, schema)
        print(f"Create Result: {res}")
    except Exception as e:
        print(f"Create Failed: {e}")
        return

    # Write Record
    print("✍️ Writing record...")
    record = {
        "id": "test-user",
        "email": "test@test.com",
        "subscription_id": "sub_123",
        "role": "admin"
    }
    
    try:
        res = client.write(table, [record])
        print(f"Write Result: {res}")
    except Exception as e:
        print(f"Write Failed: {e}")

if __name__ == "__main__":
    run()
