import json
import os
import sys

# Ensure src/ is in path
sys.path.append(os.path.dirname(os.path.realpath(__file__)))

try:
    from lib.ibex_client import IbexClient
    print("Using new IbexClient from ibex_client.py")
except ImportError:
    # Fallback to old client if new one doesn't exist
    from lib.ibex import IbexClient
    print("Using old IbexClient from ibex.py")
from lib.ai import AIService
from lib.tenant_manager import TenantManager
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
    Unified Entrypoint with Multi-tenant Support.
    Delegates to Router.
    """
    # Get tenant configuration from request
    tenant_config = TenantManager.get_tenant_from_request(event)
    print(f"Processing request for tenant: {tenant_config['display_name']} ({tenant_config['tenant_id']})")

    # Create tenant-specific database client
    try:
        tenant_db = TenantManager.create_ibex_client(tenant_config)
        print(f"Tenant DB Client initialized for namespace: {tenant_config['namespace']}")
    except Exception as e:
        print(f"Tenant DB Initialization Error: {e}")
        # Fallback to default db if tenant-specific fails
        tenant_db = db

    # Create tenant-specific AI service
    try:
        if tenant_db:
            tenant_ai_service = AIService(tenant_db)
            print("Tenant AI Service initialized successfully")
        else:
            tenant_ai_service = ai_service
    except Exception as e:
        print(f"Tenant AI Service Initialization Error: {e}")
        tenant_ai_service = ai_service

    # Build tenant-aware context
    tenant_context = {
        "db": tenant_db,
        "ai_service": tenant_ai_service,
        "schemas": SCHEMAS,
        "config": CONFIG,
        "tenant": tenant_config  # Include tenant info in context
    }

    print(f"Context Initialized for tenant. Routing request...")
    return router.route_request(event, tenant_context)
