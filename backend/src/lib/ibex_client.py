import requests
import json
import os
import re
from typing import Dict, List, Any, Optional

class IbexClient:
    """Production-grade Ibex database client with proper error handling and data sanitization."""

    def __init__(self, api_url: str, api_key: str, tenant_id: str, namespace: str = "default"):
        self.api_url = api_url
        self.headers = {
            "Content-Type": "application/json",
            "x-api-key": api_key
        }
        self.base_payload = {
            "tenant_id": tenant_id,
            "namespace": namespace
        }

    def _sanitize_response(self, response_text: str) -> str:
        """Replace NaN and other non-JSON values with null."""
        # Replace NaN with null (Ibex returns NaN for null numeric values)
        response_text = re.sub(r'\bNaN\b', 'null', response_text)
        # Replace NaT (Not a Time) with null
        response_text = re.sub(r'"NaT"', 'null', response_text)
        return response_text

    def _call(self, payload: Dict[str, Any], timeout: int = 20) -> Dict[str, Any]:
        """Make API call to Ibex with proper error handling."""
        full_payload = {**self.base_payload, **payload}

        try:
            response = requests.post(
                self.api_url,
                headers=self.headers,
                json=full_payload,
                timeout=timeout
            )
            response.raise_for_status()

            # Sanitize and parse response
            response_text = self._sanitize_response(response.text)
            return json.loads(response_text)

        except requests.exceptions.Timeout:
            raise Exception(f"Ibex API timeout after {timeout} seconds")
        except requests.exceptions.ConnectionError:
            raise Exception("Unable to connect to Ibex API")
        except requests.exceptions.RequestException as e:
            # Extract error details if available
            error_msg = str(e)
            if hasattr(e, 'response') and e.response is not None:
                try:
                    error_detail = e.response.json()
                    error_msg = error_detail.get('error', {}).get('message', str(e))
                except:
                    error_msg = e.response.text or str(e)
            raise Exception(f"Ibex API error: {error_msg}")
        except json.JSONDecodeError as e:
            raise Exception(f"Invalid JSON response from Ibex: {e}")

    def list_tables(self) -> Dict[str, Any]:
        """List all tables in the namespace."""
        return self._call({"operation": "LIST_TABLES"})

    def create_table(self, table_name: str, schema: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new table with the given schema."""
        return self._call({
            "operation": "CREATE_TABLE",
            "table": table_name,
            "schema": schema
        }, timeout=29)

    def describe_table(self, table_name: str) -> Dict[str, Any]:
        """Get the schema of a table."""
        return self._call({
            "operation": "DESCRIBE_TABLE",
            "table": table_name
        })

    def query(self, table: str, filters: Optional[List[Dict]] = None,
              limit: int = 50, sort: Optional[List[Dict]] = None,
              offset: int = 0) -> Dict[str, Any]:
        """
        Query records from a table.

        Args:
            table: Table name
            filters: List of filter conditions [{"field": "name", "operator": "eq", "value": "John"}]
            limit: Maximum number of records to return
            sort: List of sort conditions [{"field": "created_at", "order": "desc"}]
            offset: Number of records to skip

        Returns:
            Query result with records
        """
        payload = {
            "operation": "QUERY",
            "table": table,
            "limit": min(limit, 1000)  # Cap at 1000 for safety
        }

        if filters:
            payload["filters"] = filters
        if sort:
            payload["sort"] = sort
        if offset > 0:
            payload["offset"] = offset

        return self._call(payload)

    def write(self, table: str, records: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Write records to a table.

        Args:
            table: Table name
            records: List of records to write

        Returns:
            Write result
        """
        # Ensure records is a list
        if not isinstance(records, list):
            records = [records]

        # Sanitize records - remove None values that might cause issues
        sanitized_records = []
        for record in records:
            sanitized = {}
            for key, value in record.items():
                # Skip None values for optional fields
                if value is not None:
                    sanitized[key] = value
            sanitized_records.append(sanitized)

        print(f"IbexClient.write called with table: {table}")
        return self._call({
            "operation": "WRITE",
            "table": table,
            "records": sanitized_records
        }, timeout=29)

    def update(self, table: str, filters: List[Dict], updates: Dict[str, Any]) -> Dict[str, Any]:
        """
        Update records in a table.

        Args:
            table: Table name
            filters: Filter conditions to identify records
            updates: Field updates to apply

        Returns:
            Update result
        """
        return self._call({
            "operation": "UPDATE",
            "table": table,
            "filters": filters,
            "updates": updates
        }, timeout=29)

    def delete(self, table: str, filters: List[Dict]) -> Dict[str, Any]:
        """
        Delete records from a table.

        Args:
            table: Table name
            filters: Filter conditions to identify records

        Returns:
            Delete result
        """
        return self._call({
            "operation": "DELETE",
            "table": table,
            "filters": filters
        }, timeout=29)