import json
from utils.http import respond, get_user_id

def list_data(event, context):
    """GET /v1/{table}"""
    db = context['db']
    schemas = context['schemas']
    table_name = event['pathParameters'].get('table')
    
    if table_name not in schemas:
        return respond(404, {"error": f"Resource {table_name} not found"})
        
    user_id = get_user_id(event)
    filters = [{"field": "user_id", "operator": "eq", "value": user_id}]
    
    try:
        result = db.query(table_name, filters=filters, sort=[{"field": "created_at", "order": "desc"}])
        return respond(200, result.get('data', []))
    except Exception as e:
        return respond(500, {"error": str(e)})

def create_data(event, context):
    """POST /v1/{table}"""
    db = context['db']
    schemas = context['schemas']
    table_name = event['pathParameters'].get('table')
    
    if table_name not in schemas:
        return respond(404, {"error": f"Resource {table_name} not found"})
    
    try:
        body = json.loads(event.get('body', '{}'))
    except:
        return respond(400, {"error": "Invalid JSON"})
        
    body['user_id'] = get_user_id(event)
    
    try:
        result = db.write(table_name, [body])
        return respond(201, result)
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
        items = result.get('data', [])
        if not items:
            return respond(404, {"error": "Not found"})
        return respond(200, items[0])
    except Exception as e:
        return respond(500, {"error": str(e)})

def initialize_schemas(event, context):
    """POST /v1/system/initialize-schemas"""
    db = context['db']
    schemas = context['schemas']
    results = {}
    try:
        existing = db.list_tables().get('data', {}).get('tables', [])
        for table, schema in schemas.items():
            if table in existing:
                results[table] = "Exists"
            else:
                db.create_table(table, schema)
                results[table] = "Created"
        return respond(200, results)
    except Exception as e:
        return respond(500, {"error": str(e)})
