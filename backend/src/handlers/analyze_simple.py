"""
Simplified Analysis Handler - Provides visibility without complex queuing
"""

import json
import uuid
import threading
from datetime import datetime
from utils.http import respond, get_user_id

def analyze_with_status(event, context):
    """
    POST /v1/analyze - Analyze food with visible status

    1. Creates food entry immediately with 'processing' status
    2. Returns entry ID for tracking
    3. Processes in background
    4. Updates entry when complete
    """
    db = context['db']
    ai_service = context['ai_service']
    user_id = get_user_id(event) or 'local-dev-user'

    try:
        body = json.loads(event.get('body', '{}'))
    except:
        return respond(400, {"error": "Invalid JSON"})

    description = body.get('description', '')
    image_url = body.get('imageUrl') or body.get('image_url', '')

    if not description and not image_url:
        return respond(400, {"error": "Missing description or imageUrl"})

    # Create food entry immediately with processing status
    entry_id = str(uuid.uuid4())
    food_entry = {
        "id": entry_id,
        "user_id": user_id,
        "description": description or "AI-analyzing...",
        "status": "processing",  # Key field for visibility
        "meal_type": "pending",
        "meal_date": datetime.utcnow().strftime('%Y-%m-%d'),
        "meal_time": datetime.utcnow().strftime('%H:%M'),
        "calories": 0,
        "total_protein": 0,
        "total_carbohydrates": 0,
        "total_fats": 0,
        "total_fiber": 0,
        "total_sodium": 0,
        "image_url": image_url,
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    }

    # Store the placeholder entry
    result = db.write("app_food_entries", [food_entry])

    if not result.get('success'):
        return respond(500, {"error": "Failed to create food entry"})

    # Process in background
    processor = threading.Thread(
        target=process_food_analysis,
        args=(entry_id, description, image_url, user_id, context),
        daemon=True
    )
    processor.start()

    # Return immediately with entry ID for tracking
    return respond(200, {
        "success": True,
        "entry_id": entry_id,
        "status": "processing",
        "message": f"Analyzing your food. Check back in a few seconds!"
    })


def process_food_analysis(entry_id, description, image_url, user_id, context):
    """
    Background processor for food analysis
    Updates the food entry when complete
    """
    db = context['db']
    ai_service = context['ai_service']

    print(f"🔄 Processing food entry: {entry_id}")

    try:
        # Analyze with AI
        print(f"🤖 Analyzing: {description}")
        analysis_result = ai_service.process_request(
            user_id,
            description,
            image_url
        )

        if analysis_result.get('success'):
            # Extract AI results
            ai_data = analysis_result.get('data', {})
            category = analysis_result.get('category', 'food')

            if category == 'food':
                # Parse food data
                food_items = ai_data.get('food_items', [])
                total_calories = ai_data.get('total_calories', 0)
                meal_type = ai_data.get('meal_type', 'snack')

                # Calculate totals
                total_protein = sum(item.get('protein', 0) for item in food_items)
                total_carbs = sum(item.get('carbs', 0) for item in food_items)
                total_fat = sum(item.get('fat', 0) for item in food_items)
                total_fiber = sum(item.get('fiber', 0) for item in food_items)
                total_sodium = sum(item.get('sodium', 0) for item in food_items)

                # Get food name from AI
                food_name = food_items[0].get('name') if food_items else description

                # Update the entry with results
                updated_entry = {
                    "id": entry_id,
                    "user_id": user_id,
                    "description": food_name or description,
                    "status": "completed",  # Mark as completed
                    "meal_type": meal_type,
                    "meal_date": datetime.utcnow().strftime('%Y-%m-%d'),
                    "meal_time": datetime.utcnow().strftime('%H:%M'),
                    "calories": total_calories,
                    "total_protein": total_protein,
                    "total_carbohydrates": total_carbs,
                    "total_fats": total_fat,
                    "total_fiber": total_fiber,
                    "total_sodium": total_sodium,
                    "ingredients": json.dumps(food_items),
                    "extracted_nutrients": json.dumps(ai_data),
                    "confidence_score": 0.95,
                    "image_url": image_url,
                    "created_at": datetime.utcnow().isoformat(),
                    "updated_at": datetime.utcnow().isoformat()
                }

                # Update the entry
                write_result = db.write("app_food_entries", [updated_entry])

                if write_result.get('success'):
                    print(f"✅ Updated food entry: {entry_id}")
                else:
                    print(f"❌ Failed to update entry: {entry_id}")
                    # Mark as failed
                    mark_as_failed(db, entry_id, user_id, "Failed to save results")
            else:
                # Non-food item
                mark_as_failed(db, entry_id, user_id, f"Not a food item: {category}")
        else:
            # AI analysis failed
            error_msg = analysis_result.get('error', 'Analysis failed')
            mark_as_failed(db, entry_id, user_id, error_msg)

    except Exception as e:
        print(f"❌ Processing error for {entry_id}: {e}")
        mark_as_failed(db, entry_id, user_id, str(e))


def mark_as_failed(db, entry_id, user_id, error_msg):
    """Mark an entry as failed"""
    failed_entry = {
        "id": entry_id,
        "user_id": user_id,
        "status": "failed",
        "error_message": error_msg,
        "updated_at": datetime.utcnow().isoformat()
    }
    db.write("app_food_entries", [failed_entry])
    print(f"❌ Marked entry as failed: {entry_id} - {error_msg}")


def get_entry_status(event, context):
    """
    GET /v1/analyze/status/{entry_id} - Get status of a food entry
    """
    db = context['db']
    entry_id = event['pathParameters'].get('entry_id')

    if not entry_id:
        return respond(400, {"error": "Missing entry_id"})

    try:
        # Query the food entry
        result = db.query("app_food_entries",
                         filters=[{"field": "id", "operator": "eq", "value": entry_id}],
                         limit=1)

        if result.get('success'):
            data = result.get('data', {})
            records = data.get('records', []) if isinstance(data, dict) else data

            if records:
                entry = records[0]
                return respond(200, {
                    "entry_id": entry['id'],
                    "status": entry.get('status', 'unknown'),
                    "description": entry.get('description'),
                    "calories": entry.get('calories', 0),
                    "meal_type": entry.get('meal_type'),
                    "error_message": entry.get('error_message')
                })
            else:
                return respond(404, {"error": "Entry not found"})
        else:
            return respond(500, {"error": "Failed to query entry"})

    except Exception as e:
        print(f"Status check error: {e}")
        return respond(500, {"error": str(e)})