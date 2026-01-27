"""
Fixed production data handler that properly handles all tables including users
"""

import json
from datetime import datetime
import uuid
import re
from utils.http import respond, get_user_id


def sanitize_json_response(data):
    """Replace NaN and other non-JSON values in response data"""
    if isinstance(data, dict):
        return {k: sanitize_json_response(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [sanitize_json_response(item) for item in data]
    elif isinstance(data, float):
        if data != data:  # NaN check
            return None
        return data
    elif isinstance(data, str) and data == "NaT":
        return None
    return data


def list_data(event, context):
    """GET /v1/{table}"""
    db = context['db']
    schemas = context['schemas']
    table_name = event['pathParameters'].get('table')

    # Add app_ prefix if not present and handle special cases
    if table_name == 'users':
        db_table_name = 'app_users_v2'
    elif table_name == 'food_entries':
        # Use v2 table to avoid schema issues with Ibex
        db_table_name = 'app_food_entries_v2'
    elif table_name and not table_name.startswith('app_'):
        db_table_name = f'app_{table_name}'
    else:
        db_table_name = table_name

    # Return empty array for non-existent tables
    if table_name not in schemas:
        return respond(200, [])

    # Get query parameters
    query_params = event.get('queryStringParameters') or {}
    schema_fields = schemas[table_name].get('fields', {})

    # Build filters from query parameters
    filters = []
    for key, value in query_params.items():
        # Skip special parameters
        if key in ['limit', 'order_by', 'order_dir', 'sort', 'offset']:
            continue
        # Only add filter if the field exists in the schema
        if key in schema_fields:
            filters.append({"field": key, "operator": "eq", "value": value})

    # Handle sorting
    sort = None
    if 'order_by' in query_params:
        order_field = query_params['order_by']
        order_dir = query_params.get('order_dir', 'asc')
        if order_field in schema_fields:
            sort = [{"field": order_field, "order": order_dir}]

    # Handle pagination
    limit = min(int(query_params.get('limit', 50)), 1000)
    offset = int(query_params.get('offset', 0))

    try:
        # Execute query
        kwargs = {"limit": limit}
        if filters:
            kwargs["filters"] = filters
        if sort:
            kwargs["sort"] = sort
        if offset > 0:
            kwargs["offset"] = offset

        result = db.query(db_table_name, **kwargs)

        if result and result.get('success'):
            data = result.get('data', {})
            records = data.get('records', [])

            # Clean internal fields and sanitize
            cleaned_records = []
            for record in records:
                cleaned = {k: v for k, v in record.items() if not k.startswith('_')}
                cleaned = sanitize_json_response(cleaned)
                cleaned_records.append(cleaned)

            return respond(200, cleaned_records)
        else:
            return respond(200, [])
    except Exception as e:
        print(f"Query error for {table_name}: {str(e)}")
        return respond(200, [])


def create_data(event, context):
    """POST /v1/{table}"""
    from datetime import datetime
    import uuid

    db = context['db']
    schemas = context['schemas']
    table_name = event['pathParameters'].get('table')

    # Add app_ prefix if not present and handle special cases
    if table_name == 'users':
        db_table_name = 'app_users_v2'
    elif table_name == 'food_entries':
        # Use v2 table to avoid schema issues with Ibex
        db_table_name = 'app_food_entries_v2'
    elif table_name and not table_name.startswith('app_'):
        db_table_name = f'app_{table_name}'
    else:
        db_table_name = table_name

    # Parse body
    try:
        body = json.loads(event.get('body', '{}'))
    except:
        return respond(400, {"error": "Invalid JSON"})

    # Handle batch or single
    records = body if isinstance(body, list) else [body]

    # Get schema
    schema = schemas.get(table_name, {})
    schema_fields = schema.get('fields', {})

    # Process records
    user_id = get_user_id(event)
    current_time = datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')

    processed_records = []
    for record in records:
        if not record:
            continue

        # Auto-fill fields if schema exists
        if schema_fields:
            # Generate ID if needed
            if 'id' in schema_fields and 'id' not in record:
                record['id'] = str(uuid.uuid4())

            # Add timestamps
            if 'created_at' in schema_fields and 'created_at' not in record:
                record['created_at'] = current_time
            if 'updated_at' in schema_fields:
                record['updated_at'] = current_time

            # Add user_id ONLY if:
            # 1. The field exists in schema
            # 2. It's not already in the record
            # 3. It's NOT the users table (users table doesn't have user_id field!)
            if 'user_id' in schema_fields and 'user_id' not in record and table_name != 'users':
                record['user_id'] = user_id

        processed_records.append(record)

    if not processed_records:
        return respond(400, {"error": "No valid records"})

    try:
        # Log what we're sending for debugging
        print(f"Writing to {db_table_name}: {json.dumps(processed_records[:1] if processed_records else [], indent=2)}")

        result = db.write(db_table_name, processed_records)

        if result and result.get('success'):
            written_records = result.get('data', {}).get('records', processed_records)

            # Clean and sanitize
            cleaned_records = []
            for record in written_records:
                cleaned = {k: v for k, v in record.items() if not k.startswith('_')}
                cleaned = sanitize_json_response(cleaned)
                cleaned_records.append(cleaned)

            # Return single if input was single
            if not isinstance(body, list) and cleaned_records:
                return respond(201, cleaned_records[0])
            return respond(201, cleaned_records)
        else:
            return respond(500, {"error": "Failed to create records"})
    except Exception as e:
        print(f"Write error for {table_name}: {str(e)}")
        return respond(500, {"error": str(e)})


def get_data_by_id(event, context):
    """GET /v1/{table}/{id}"""
    db = context['db']
    schemas = context['schemas']
    table_name = event['pathParameters'].get('table')
    item_id = event['pathParameters'].get('id')

    # Add app_ prefix if not present and handle special cases
    if table_name == 'users':
        db_table_name = 'app_users_v2'
    elif table_name == 'food_entries':
        # Use v2 table to avoid schema issues with Ibex
        db_table_name = 'app_food_entries_v2'
    elif table_name and not table_name.startswith('app_'):
        db_table_name = f'app_{table_name}'
    else:
        db_table_name = table_name

    if table_name not in schemas:
        return respond(404, {"error": f"Resource {table_name} not found"})

    schema_fields = schemas[table_name].get('fields', {})

    # Build filters - just the ID filter
    filters = [{"field": "id", "operator": "eq", "value": item_id}]

    # IMPORTANT: Only add user_id filter if:
    # 1. The table HAS a user_id field
    # 2. It's NOT the users table itself
    # This was the bug - we were adding user_id filter to the users table!
    if 'user_id' in schema_fields and table_name != 'users':
        user_id = get_user_id(event)
        if user_id:
            filters.append({"field": "user_id", "operator": "eq", "value": user_id})

    try:
        result = db.query(db_table_name, filters=filters, limit=1)

        if result and result.get('success'):
            data = result.get('data', {})
            records = data.get('records', [])

            if not records:
                return respond(404, {"error": "Not found"})

            # Clean and sanitize
            record = records[0]
            cleaned = {k: v for k, v in record.items() if not k.startswith('_')}
            cleaned = sanitize_json_response(cleaned)

            return respond(200, cleaned)
        else:
            return respond(404, {"error": "Not found"})
    except Exception as e:
        print(f"Get by ID error for {table_name}/{item_id}: {str(e)}")
        return respond(500, {"error": str(e)})


def delete_data(event, context):
    """DELETE /v1/{table}/{id}"""
    db = context['db']
    schemas = context['schemas']
    table_name = event['pathParameters'].get('table')
    item_id = event['pathParameters'].get('id')

    # Add app_ prefix if not present and handle special cases
    if table_name == 'users':
        db_table_name = 'app_users_v2'
    elif table_name == 'food_entries':
        db_table_name = 'app_food_entries_v2'
    elif table_name and not table_name.startswith('app_'):
        db_table_name = f'app_{table_name}'
    else:
        db_table_name = table_name

    if table_name not in schemas:
        return respond(404, {"error": f"Resource {table_name} not found"})

    schema_fields = schemas[table_name].get('fields', {})

    # Build filters
    filters = [{"field": "id", "operator": "eq", "value": item_id}]

    # Add user_id filter for user-scoped tables
    if 'user_id' in schema_fields and table_name != 'users':
        user_id = get_user_id(event)
        if user_id:
            filters.append({"field": "user_id", "operator": "eq", "value": user_id})

    try:
        # Delete the record
        result = db.delete(db_table_name, filters=filters)

        if result and result.get('success'):
            return respond(204, None)
        else:
            return respond(404, {"error": "Record not found or not authorized"})
    except Exception as e:
        print(f"Delete error for {table_name}/{item_id}: {str(e)}")
        return respond(500, {"error": str(e)})


def initialize_schemas(event, context):
    """POST /v1/system/initialize-schemas"""
    db = context['db']
    schemas = context['schemas']

    results = {}
    try:
        existing_response = db.list_tables()
        existing = existing_response.get('data', {}).get('tables', [])

        for table, schema in schemas.items():
            if table in existing:
                results[table] = "Exists"
            else:
                try:
                    # Convert schema to Ibex format
                    ibex_schema = {"fields": {}}

                    type_mapping = {
                        "string": "string",
                        "integer": "integer",
                        "boolean": "boolean",
                        "timestamp": "string",
                        "text": "string",
                        "double": "double",
                        "long": "long",
                        "float": "double"
                    }

                    for field_name, field_config in schema.get("fields", {}).items():
                        field_type = field_config.get("type", "string")
                        ibex_type = type_mapping.get(field_type, "string")
                        ibex_schema["fields"][field_name] = {
                            "type": ibex_type,
                            "required": field_config.get("required", False)
                        }

                    db.create_table(table, ibex_schema)
                    results[table] = "Created"
                except Exception as e:
                    print(f"Failed to create table {table}: {e}")
                    results[table] = f"Error: {str(e)}"

        return respond(200, results)
    except Exception as e:
        print(f"Schema initialization error: {e}")
        return respond(500, {"error": str(e)})