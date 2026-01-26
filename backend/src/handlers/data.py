import json
from utils.http import respond, get_user_id

def list_data(event, context):
    """GET /v1/{table}"""
    db = context['db']
    schemas = context['schemas']
    table_name = event['pathParameters'].get('table')

    # Check if table exists in schemas
    if table_name not in schemas:
        # Return empty array for tables that don't exist yet
        # This allows the frontend to work even if tables aren't initialized
        return respond(200, [])

    # Get query parameters for filtering
    query_params = event.get('queryStringParameters') or {}
    schema_fields = schemas[table_name].get('fields', {})

    # Build filters from query parameters
    filters = []
    for key, value in query_params.items():
        # Skip special parameters
        if key in ['limit', 'order_by', 'order_dir', 'sort']:
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

    # Handle limit
    limit = int(query_params.get('limit', 50))

    try:
        # Build query parameters
        query_kwargs = {"limit": limit}
        if filters:
            query_kwargs["filters"] = filters
        if sort:
            query_kwargs["sort"] = sort

        result = db.query(table_name, **query_kwargs)
        # Ibex returns: {success, metadata, error, data: {records, query_metadata}}
        data = result.get('data', {})
        records = data.get('records', [])
        return respond(200, records)
    except Exception as e:
        # If query fails (table doesn't exist in DB), return empty array
        print(f"Query failed for {table_name}: {str(e)}")
        return respond(200, [])

def create_data(event, context):
    """POST /v1/{table}"""
    from datetime import datetime
    import uuid

    db = context['db']
    schemas = context['schemas']
    table_name = event['pathParameters'].get('table')

    # Check if table schema exists
    if table_name not in schemas:
        # For tables without schemas, just pass through the data
        # This allows flexibility for dynamic tables
        try:
            body = json.loads(event.get('body', '{}'))
        except:
            return respond(400, {"error": "Invalid JSON"})

        # Ensure it's a list for Ibex
        records = body if isinstance(body, list) else [body]

        try:
            result = db.write(table_name, records)
            # Return the written records
            written_records = result.get('data', {}).get('records', records)
            if not isinstance(body, list) and written_records:
                return respond(201, written_records[0])
            return respond(201, written_records)
        except Exception as e:
            return respond(500, {"error": str(e)})

    # Table has a schema, process accordingly
    try:
        body = json.loads(event.get('body', '{}'))
    except:
        return respond(400, {"error": "Invalid JSON"})

    schema = schemas[table_name]
    schema_fields = schema.get('fields', {})

    # Handle array of records or single record
    records = body if isinstance(body, list) else [body]

    for record in records:
        # Generate ID if the field exists and is not provided
        if 'id' in schema_fields and 'id' not in record:
            record['id'] = record.get('id') or str(uuid.uuid4())

        # Add timestamps if they exist in schema and not provided
        if 'created_at' in schema_fields and 'created_at' not in record:
            record['created_at'] = datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')
        if 'updated_at' in schema_fields:
            record['updated_at'] = datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')

        # Add user_id from auth context if field exists and not provided
        if 'user_id' in schema_fields and 'user_id' not in record:
            record['user_id'] = get_user_id(event)

    try:
        result = db.write(table_name, records)
        # Return the written records
        written_records = result.get('data', {}).get('records', records)
        if not isinstance(body, list) and written_records:
            return respond(201, written_records[0])
        return respond(201, written_records)
    except Exception as e:
        return respond(500, {"error": str(e)})

def get_data_by_id(event, context):
    """GET /v1/{table}/{id}"""
    db = context['db']
    schemas = context['schemas']
    table_name = event['pathParameters'].get('table')
    item_id = event['pathParameters'].get('id')
    
    if table_name not in schemas:
        return respond(404, {"error": f"Resource {table_name} not found"})
        
    user_id = get_user_id(event)
    filters = [
        {"field": "id", "operator": "eq", "value": item_id},
        {"field": "user_id", "operator": "eq", "value": user_id}
    ]
    
    try:
        result = db.query(table_name, filters=filters, limit=1)
        # Ibex returns: {success, metadata, error, data: {records, query_metadata}}
        data = result.get('data', {})
        items = data.get('records', [])
        if not items:
            return respond(404, {"error": "Not found"})
        return respond(200, items[0])
    except Exception as e:
        return respond(500, {"error": str(e)})

def initialize_schemas(event, context):
    """POST /v1/system/initialize-schemas"""
    db = context['db']
    schemas = context['schemas']

    # Check for force_recreate flag in query parameters or body
    query_params = event.get('queryStringParameters') or {}
    force_recreate = query_params.get('force_recreate', 'false').lower() == 'true'

    results = {}
    try:
        existing_response = db.list_tables()
        existing = existing_response.get('data', {}).get('tables', [])

        for table, schema in schemas.items():
            if table in existing:
                if force_recreate:
                    print(f"Dropping and recreating table: {table}")
                    db.drop_table(table)
                    db.create_table(table, schema)
                    results[table] = "Recreated"
                else:
                    results[table] = "Exists"
            else:
                print(f"Creating new table: {table}")
                db.create_table(table, schema)
                results[table] = "Created"

        return respond(200, results)
    except Exception as e:
        print(f"Schema initialization error: {e}")
        return respond(500, {"error": str(e)})
