import os
import sys
import json
from dotenv import load_dotenv

# Load env from root
load_dotenv()

# Add src to path
sys.path.append(os.path.join(os.getcwd(), 'backend/src'))

from lib.ibex_client import IbexClient

def check_data():
    try:
        api_url = os.environ.get('IBEX_API_URL')
        api_key = os.environ.get('IBEX_API_KEY')
        
        print(f"Connecting to Ibex: {api_url}")
        client = IbexClient(api_url, api_key, "test-tenant", "default")
        
        table = "app_food_entries_v2"
        print(f"Querying {table} with filter...")
        
        # Query with filter
        filters = [{"field": "user_id", "operator": "eq", "value": "local-dev-user"}]
        result = client.query(table, filters=filters, limit=10)
        
        if result.get('success'):
            data = result.get('data', {})
            records = data.get('records', [])
            print(f"Found {len(records)} records in {table}")
            for r in records:
                print(f" - ID: {r.get('id')}, User: {r.get('user_id')}, Desc: {r.get('description')}")
        else:
            print(f"Query failed: {result}")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_data()
