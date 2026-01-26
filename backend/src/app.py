import json
import os
import sys

# Ensure src/ is in path
sys.path.append(os.path.dirname(os.path.realpath(__file__)))

try:
    from lib.ibex_client import IbexClient
except ImportError:
    # Fallback to old client if new one doesn't exist
    from lib.ibex import IbexClient
from lib.ai import AIService
import router

# --- Configuration Loading ---
try:
    with open('config.json', 'r') as f:
        CONFIG = json.load(f)
except Exception:
    CONFIG = {}

# Load Schemas
SCHEMAS = {}
SCHEMA_DIR = os.path.join(os.path.dirname(os.path.realpath(__file__)), 'schemas')

if os.path.exists(SCHEMA_DIR):
    for filename in os.listdir(SCHEMA_DIR):
        if filename.endswith('.json'):
            table_name = filename[:-5]
            try:
                with open(os.path.join(SCHEMA_DIR, filename), 'r') as f:
                    SCHEMAS[table_name] = json.load(f)
            except Exception as e:
                print(f"Error loading schema {filename}: {e}")

# Constants
IBEX_API_URL = os.environ.get('IBEX_API_URL') or CONFIG.get('ibex_api_url')
IBEX_API_KEY = os.environ.get('IBEX_API_KEY')
TENANT_ID = CONFIG.get('tenant_id', "test-tenant")
NAMESPACE = CONFIG.get('namespace', "default")

# Initialize Logic Services
try:
    db = IbexClient(IBEX_API_URL, IBEX_API_KEY, TENANT_ID, NAMESPACE)
    print("DB Client initialized successfully")
except Exception as e:
    print(f"DB Initialization Error: {e}")
    db = None

try:
    if db:
        ai_service = AIService(db)
        print("AI Service initialized successfully")
    else:
        ai_service = None
except Exception as e:
    print(f"AI Service Initialization Error: {e}")
    ai_service = None

# Context to pass to handlers
CONTEXT = {
    "db": db,
    "ai_service": ai_service,
    "schemas": SCHEMAS,
    "config": CONFIG
}

def lambda_handler(event, context):
    """
    Unified Entrypoint.
    Delegates to Router.
    """
    print(f"Context Initialized. Routing request...")
    return router.route_request(event, CONTEXT)
