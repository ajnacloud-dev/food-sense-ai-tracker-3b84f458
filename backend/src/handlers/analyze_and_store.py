"""
Analyze and store food entries directly
"""

import json
import uuid
from datetime import datetime
from utils.http import respond, get_user_id


def analyze_and_store(event, context):
    """POST /v1/analyze-and-store - Analyze content and store results"""
    ai_service = context['ai_service']
    db = context['db']

    # Check if AI service is initialized
    if not ai_service:
        return respond(500, {"error": "AI service not initialized"})

    # Get user ID
    user_id = get_user_id(event) or 'local-dev-user'

    try:
        body = json.loads(event.get('body', '{}'))
    except:
        return respond(400, {"error": "Invalid JSON"})

    description = body.get('description')
    image_url = body.get('image_url') or body.get('imageUrl')

    if not description and not image_url:
        return respond(400, {"error": "Missing description or image_url"})

    try:
        # Step 1: Analyze with AI
        print(f"Analyzing content for user {user_id}")
        result = ai_service.process_request(user_id, description, image_url)

        if not result.get('success'):
            return respond(500, {"error": "AI analysis failed", "details": result.get('error')})

        # Step 2: Extract nutritional data from AI response
        ai_data = result.get('data', {})
        category = result.get('category', 'food')

        if category != 'food':
            return respond(200, {
                "success": True,
                "message": f"Content classified as {category}, not food",
                "data": ai_data
            })

        # Step 3: Store in food_entries table
        food_items = ai_data.get('food_items', [])
        total_calories = ai_data.get('total_calories', 0)
        meal_type = ai_data.get('meal_type', 'snack')

        # Calculate totals from food items
        total_protein = sum(item.get('protein', 0) for item in food_items)
        total_carbs = sum(item.get('carbs', 0) for item in food_items)
        total_fat = sum(item.get('fat', 0) for item in food_items)
        total_fiber = sum(item.get('fiber', 0) for item in food_items)
        total_sodium = sum(item.get('sodium', 0) for item in food_items)

        # Create food entry record
        food_entry = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "description": description or "AI-analyzed food",
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
            "confidence_score": 0.95
        }

        print(f"Storing food entry: {food_entry['description']}")

        # Write to database - use app_food_entries table
        write_result = db.write("app_food_entries", [food_entry])

        if write_result and write_result.get('success'):
            print(f"Successfully stored food entry with ID: {food_entry['id']}")

            # Return complete response
            return respond(200, {
                "success": True,
                "category": category,
                "food_entry_id": food_entry["id"],
                "data": ai_data,
                "metadata": result.get('metadata', {}),
                "stored_entry": {
                    "id": food_entry["id"],
                    "description": food_entry["description"],
                    "calories": food_entry["calories"],
                    "meal_type": food_entry["meal_type"]
                }
            })
        else:
            print(f"Failed to store food entry: {write_result}")
            # Even if storage fails, return the analysis
            return respond(200, {
                "success": True,
                "category": category,
                "data": ai_data,
                "metadata": result.get('metadata', {}),
                "warning": "Analysis successful but storage failed"
            })

    except Exception as e:
        print(f"Error in analyze_and_store: {e}")
        import traceback
        traceback.print_exc()
        return respond(500, {"error": str(e)})