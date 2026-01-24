from utils.http import respond

def get_file(event, context):
    """GET /v1/storage/{path+}"""
    db = context['db']
    # 'path' parameter contains the file path
    path_param = event['pathParameters'].get('path')
    
    if not path_param:
        return respond(400, {"error": "Missing path"})
        
    try:
        filters = [{"field": "file_path", "operator": "eq", "value": path_param}]
        result = db.query("images", filters=filters, limit=1)
        
        items = result.get('data', [])
        if not items:
            return respond(404, {"error": "File not found"})
            
        record = items[0]
        data = record.get('data')
        mime_type = record.get('mime_type', 'application/octet-stream')
        
        if not data:
            return respond(404, {"error": "Content empty"})
            
        return respond(200, data, is_base64=True)
    except Exception as e:
        return respond(500, {"error": str(e)})
