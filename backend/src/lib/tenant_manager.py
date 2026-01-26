"""
Tenant Management for Multi-tenant Architecture
"""

import os
from typing import Optional, Dict, Any

class TenantManager:
    """
    Manages tenant configuration and isolation for the food tracking app.

    Architecture:
    - Each organization/company gets their own tenant_id
    - Individual users within a tenant are tracked by user_id
    - Data isolation at namespace level in Ibex
    """

    # Tenant configuration mapping
    TENANT_CONFIG = {
        "demo": {
            "tenant_id": "demo-tenant",
            "namespace": "demo",
            "display_name": "Demo Organization",
            "features": ["basic_analysis", "food_tracking"]
        },
        "test": {
            "tenant_id": "test-tenant",
            "namespace": "default",
            "display_name": "Test Environment",
            "features": ["all"]
        },
        "acme_corp": {
            "tenant_id": "acme-corp-prod",
            "namespace": "acme",
            "display_name": "ACME Corporation",
            "features": ["advanced_analysis", "food_tracking", "reporting", "queue"]
        },
        "health_co": {
            "tenant_id": "health-co-prod",
            "namespace": "healthco",
            "display_name": "HealthCo Inc",
            "features": ["advanced_analysis", "food_tracking", "nutrition_coaching"]
        }
    }

    @classmethod
    def get_tenant_from_request(cls, event: Dict[str, Any]) -> Dict[str, Any]:
        """
        Extract tenant information from request headers or auth token.

        Priority:
        1. X-Tenant-ID header (for testing)
        2. Tenant from JWT token
        3. Domain-based tenant detection
        4. Default to 'test' tenant
        """
        headers = event.get('headers', {}) or {}

        # 1. Check explicit tenant header (for testing/development)
        tenant_header = headers.get('X-Tenant-ID') or headers.get('x-tenant-id')
        if tenant_header and tenant_header in cls.TENANT_CONFIG:
            return cls.TENANT_CONFIG[tenant_header]

        # 2. Extract from authorization token
        auth_header = headers.get('Authorization') or headers.get('authorization')
        if auth_header:
            # In production, decode JWT and extract tenant claim
            # For now, we'll use a simple approach
            if 'acme' in auth_header.lower():
                return cls.TENANT_CONFIG['acme_corp']
            elif 'health' in auth_header.lower():
                return cls.TENANT_CONFIG['health_co']

        # 3. Domain-based tenant detection
        host = headers.get('Host') or headers.get('host') or ''
        if 'acme' in host:
            return cls.TENANT_CONFIG['acme_corp']
        elif 'healthco' in host:
            return cls.TENANT_CONFIG['health_co']
        elif 'demo' in host:
            return cls.TENANT_CONFIG['demo']

        # 4. Default to test tenant
        return cls.TENANT_CONFIG['test']

    @classmethod
    def get_tenant_config(cls, tenant_key: str) -> Optional[Dict[str, Any]]:
        """Get configuration for a specific tenant"""
        return cls.TENANT_CONFIG.get(tenant_key)

    @classmethod
    def has_feature(cls, tenant_config: Dict[str, Any], feature: str) -> bool:
        """Check if tenant has access to a specific feature"""
        features = tenant_config.get('features', [])
        return 'all' in features or feature in features

    @classmethod
    def get_table_name(cls, base_table: str, tenant_config: Dict[str, Any]) -> str:
        """
        Get the actual table name for a tenant.

        For Ibex, we use namespace separation, so table names stay consistent
        but are isolated by namespace.
        """
        # Remove any existing prefix
        if base_table.startswith('app_'):
            base_table = base_table[4:]

        # In Ibex, tables are prefixed with app_ by convention
        return f"app_{base_table}"

    @classmethod
    def create_ibex_client(cls, tenant_config: Dict[str, Any]):
        """Create an Ibex client configured for the specific tenant"""
        from lib.ibex_client import IbexClient

        api_url = os.environ.get('IBEX_API_URL', 'https://smartlink.ajna.cloud/ibexdb')
        api_key = os.environ.get('IBEX_API_KEY')

        return IbexClient(
            api_url=api_url,
            api_key=api_key,
            tenant_id=tenant_config['tenant_id'],
            namespace=tenant_config['namespace']
        )

    @classmethod
    def list_tenants(cls) -> Dict[str, str]:
        """List all configured tenants"""
        return {
            key: config['display_name']
            for key, config in cls.TENANT_CONFIG.items()
        }