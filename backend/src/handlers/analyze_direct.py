"""
Direct Analysis Handler - Simple approach for Lambda + Ibex
No complex queuing, just direct processing with status updates
"""

import json
import uuid
from datetime import datetime
from utils.http import respond, get_user_id

def analyze_food(event, context):
    """
    POST /v1/analyze - Direct food analysis with status tracking

    Flow:
    1. Create entry with status='processing'
    2. Process with AI
    3. Update entry with results
    4. Return entry ID

    Frontend can show the entry immediately with "processing" status
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

    # Generate entry ID upfront for response
    entry_id = str(uuid.uuid4())

    # Process with AI first (no initial write to avoid duplicates)
    try:
        print(f"🤖 Analyzing food: {description}")
        analysis_result = ai_service.process_request(
            user_id,
            description,
            image_url
        )

        if analysis_result.get('success'):
            # Step 3: Update entry with results
            ai_data = analysis_result.get('data', {})
            category = analysis_result.get('category', 'food')

            if category == 'food':
                # Parse AI results
                food_items = ai_data.get('food_items', [])
                total_calories = ai_data.get('total_calories', 0)
                meal_type = ai_data.get('meal_type', 'snack')

                # Calculate nutrition totals
                total_protein = sum(item.get('protein', 0) for item in food_items)
                total_carbs = sum(item.get('carbs', 0) for item in food_items)
                total_fat = sum(item.get('fat', 0) for item in food_items)
                total_fiber = sum(item.get('fiber', 0) for item in food_items)
                total_sodium = sum(item.get('sodium', 0) for item in food_items)

                # Get proper food name
                food_name = food_items[0].get('name') if food_items else description

                # Create entry with complete data (single write to avoid duplicates)
                food_entry = {
                    "id": entry_id,
                    "user_id": user_id,
                    "description": food_name,
                    "meal_type": meal_type,
                    "meal_date": datetime.utcnow().strftime('%Y-%m-%d'),
                    "meal_time": datetime.utcnow().strftime('%H:%M'),
                    "calories": total_calories,
                    "total_protein": total_protein,
                    "total_carbohydrates": total_carbs,
                    "total_fats": total_fat,
                    "total_fiber": total_fiber,
                    "total_sodium": total_sodium,
                    "image_url": image_url or "",
                    "created_at": datetime.utcnow().isoformat(),
                    "updated_at": datetime.utcnow().isoformat()
                }

                # Save the entry (single write)
                write_result = db.write("app_food_entries_v2", [food_entry])

                if write_result.get('success'):
                    print(f"✅ Created food entry: {entry_id} with AI results")

                    return respond(200, {
                        "success": True,
                        "entry_id": entry_id,
                        "status": "completed",
                        "description": food_name,
                        "calories": total_calories,
                        "meal_type": meal_type
                    })
                else:
                    raise Exception("Failed to save AI results")
            else:
                # Not a food item - don't create entry
                return respond(400, {
                    "success": False,
                    "entry_id": entry_id,
                    "error": f"Not a food item: {category}"
                })
        else:
            raise Exception(analysis_result.get('error', 'AI analysis failed'))

    except Exception as e:
        print(f"❌ Analysis failed for {entry_id}: {e}")

        # Don't create entry for failed analyses
        return respond(500, {
            "success": False,
            "entry_id": entry_id,
            "error": str(e)
        })


def get_food_entries_with_status(event, context):
    """
    GET /v1/food_entries - Get all food entries including processing ones
    This allows the UI to show items that are still being processed
    """
    db = context['db']
    user_id = get_user_id(event) or 'local-dev-user'

    try:
        # Get all entries for user
        result = db.query("app_food_entries_v2",
                         filters=[{"field": "user_id", "operator": "eq", "value": user_id}],
                         sort=[{"field": "created_at", "order": "desc"}],
                         limit=50)

        if result.get('success'):
            data = result.get('data', {})
            entries = data.get('records', []) if isinstance(data, dict) else data

            # Format entries for UI
            formatted_entries = []
            for entry in entries:
                # Entry is ready as-is, no JSON parsing needed
                # since we're not storing complex JSON in string fields
                formatted_entries.append(entry)

            return respond(200, {
                "success": True,
                "entries": formatted_entries,
                "total": len(formatted_entries)
            })
        else:
            return respond(500, {"error": "Failed to fetch entries"})

    except Exception as e:
        print(f"Error fetching entries: {e}")
        return respond(500, {"error": str(e)})