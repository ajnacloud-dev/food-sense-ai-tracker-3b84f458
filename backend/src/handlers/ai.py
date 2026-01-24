import json
from utils.http import respond, get_user_id

def analyze(event, context):
    """POST /v1/ai/analyze"""
    ai_service = context['ai_service']
    user_id = get_user_id(event)
    
    try:
        body = json.loads(event.get('body', '{}'))
    except:
        return respond(400, {"error": "Invalid JSON"})
        
    description = body.get('description')
    image_url = body.get('imageUrl') or body.get('image_url')
    
    if not description and not image_url:
        return respond(400, {"error": "Missing description or imageUrl"})
        
    result = ai_service.process_request(user_id, description, image_url)
    
    if not result.get('success'):
        return respond(500, result)
        
    return respond(200, result)
