"""
Receipt handlers - Fetch receipts with joined items
"""

import json
from utils.http import respond, get_user_id

def get_receipt_with_items(event, context):
    """
    GET /v1/receipts/:id - Get receipt with all items
    """
    db = context['db']
    user_id = get_user_id(event) or 'local-dev-user'
    receipt_id = event.get('pathParameters', {}).get('id')
    
    if not receipt_id:
        return respond(400, {"error": "Receipt ID required"})
    
    try:
        # Fetch receipt
        receipt_result = db.query("app_receipts", filters=[
            {"field": "id", "operator": "eq", "value": receipt_id},
            {"field": "user_id", "operator": "eq", "value": user_id}
        ], limit=1)
        
        if not receipt_result.get('success'):
            return respond(500, {"error": "Failed to fetch receipt"})
        
        receipts = receipt_result.get('data', {}).get('records', [])
        if not receipts:
            return respond(404, {"error": "Receipt not found"})
        
        receipt = receipts[0]
        
        # Fetch items
        items_result = db.query("app_receipt_items", filters=[
            {"field": "receipt_id", "operator": "eq", "value": receipt_id}
        ], limit=100)
        
        items = []
        if items_result.get('success'):
            items = items_result.get('data', {}).get('records', [])
        
        # Attach items to receipt
        receipt['items'] = items
        
        return respond(200, receipt)
        
    except Exception as e:
        print(f"Error fetching receipt: {e}")
        return respond(500, {"error": str(e)})


def list_receipts(event, context):
    """
    GET /v1/receipts - List all receipts for user
    """
    db = context['db']
    user_id = get_user_id(event) or 'local-dev-user'
    
    try:
        result = db.query("app_receipts", filters=[
            {"field": "user_id", "operator": "eq", "value": user_id}
        ], sort=[{"field": "created_at", "order": "desc"}], limit=50)
        
        if result.get('success'):
            receipts = result.get('data', {}).get('records', [])
            return respond(200, {"receipts": receipts, "total": len(receipts)})
        else:
            return respond(500, {"error": "Failed to fetch receipts"})
            
    except Exception as e:
        print(f"Error listing receipts: {e}")
        return respond(500, {"error": str(e)})
