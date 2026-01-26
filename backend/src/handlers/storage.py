import json
import uuid
from datetime import datetime
from utils.http import respond

def upload_file(event, context):
    """POST /storage/upload - Upload a file to storage"""
    db = context['db']

    try:
        body = json.loads(event.get('body', '{}'))
    except:
        return respond(400, {"error": "Invalid JSON"})

    bucket = body.get('bucket', 'uploads')
    path = body.get('path') or f"{uuid.uuid4()}.jpg"
    file_data = body.get('file')  # base64 encoded data
    mime_type = body.get('mime_type', 'image/jpeg')
    size_bytes = body.get('size_bytes', 0)

    if not file_data:
        return respond(400, {"error": "Missing file data"})

    try:
        # Store in database
        record = {
            "id": str(uuid.uuid4()),
            "bucket": bucket,
            "file_path": path,
            "data": file_data,
            "mime_type": mime_type,
            "size_bytes": size_bytes,
            "created_at": datetime.utcnow().isoformat()
        }

        result = db.write("images", [record])

        if result.get('success'):
            # Return the path for use in other records
            return respond(200, {
                "success": True,
                "path": path,
                "url": f"/v1/storage/{bucket}/{path}"
            })
        else:
            return respond(500, {"error": "Failed to store file"})

    except Exception as e:
        return respond(500, {"error": str(e)})

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
