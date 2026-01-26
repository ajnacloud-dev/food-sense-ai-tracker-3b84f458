import requests
import json
import os

class IbexClient:
    def __init__(self, api_url, api_key, tenant_id, namespace="default"):
        self.api_url = api_url
        self.headers = {
            "Content-Type": "application/json",
            "x-api-key": api_key
        }
        self.base_payload = {
            "tenant_id": tenant_id,
            "namespace": namespace
        }

    def _call(self, payload, timeout=20):
        # Merge base payload (tenant/namespace) with operation payload
        full_payload = {**self.base_payload, **payload}

        try:
            response = requests.post(
                self.api_url,
                headers=self.headers,
                json=full_payload,
                timeout=timeout
            )
            response.raise_for_status()

            # Parse response and handle NaN values
            response_text = response.text
            # Replace NaN with null in the response
            import re
            response_text = re.sub(r'\bNaN\b', 'null', response_text)

            return json.loads(response_text)
        except requests.exceptions.RequestException as e:
            # Log error details for debugging
            print(f"Ibex API Error: {str(e)}")
            if hasattr(e, 'response') and e.response is not None:
                try:
                    error_detail = e.response.json()
                    print(f"Error details: {error_detail}")
                except:
                    print(f"Error response text: {e.response.text}")
            raise

    def list_tables(self):
        return self._call({"operation": "LIST_TABLES"})

    def create_table(self, table_name, schema):
        return self._call({
            "operation": "CREATE_TABLE",
            "table": table_name,
            "schema": schema
        }, timeout=29)

    def describe_table(self, table_name):
        return self._call({
            "operation": "DESCRIBE_TABLE",
            "table": table_name
        })

    def query(self, table, filters=None, limit=50, sort=None):
        payload = {
            "operation": "QUERY",
            "table": table,
            "limit": limit
        }
        if filters:
            payload["filters"] = filters
        if sort:
            payload["sort"] = sort
            
        return self._call(payload)

    def write(self, table, records):
        return self._call({
            "operation": "WRITE",
            "table": table,
            "records": records
        }, timeout=29)
