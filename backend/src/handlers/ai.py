import json
import uuid
from datetime import datetime
from utils.http import respond, get_user_id

def analyze(event, context):
    """POST /v1/ai/analyze - Analyze AND store the results"""
    ai_service = context['ai_service']
    db = context['db']

    # Check if AI service is initialized
    if not ai_service:
        return respond(500, {"error": "AI service not initialized"})

    user_id = get_user_id(event) or 'local-dev-user'

    try:
        body = json.loads(event.get('body', '{}'))
    except:
        return respond(400, {"error": "Invalid JSON"})

    description = body.get('description')
    image_url = body.get('imageUrl') or body.get('image_url')

    if not description and not image_url:
        return respond(400, {"error": "Missing description or imageUrl"})

    try:
        # Step 1: Analyze with AI
        print(f"Analyzing content for user {user_id}")
        result = ai_service.process_request(user_id, description, image_url)

        if not result.get('success'):
            return respond(500, result)

        # Step 2: Extract nutritional data from AI response
        ai_data = result.get('data', {})
        category = result.get('category', 'food')

        # Step 3: If it's food, store it in the database
        if category == 'food':
            food_items = ai_data.get('food_items', [])
            total_calories = ai_data.get('total_calories', 0)
            meal_type = ai_data.get('meal_type', 'snack')

            # Calculate totals from food items
            total_protein = sum(item.get('protein', 0) for item in food_items)
            total_carbs = sum(item.get('carbs', 0) for item in food_items)
            total_fat = sum(item.get('fat', 0) for item in food_items)
            total_fiber = sum(item.get('fiber', 0) for item in food_items)
            total_sodium = sum(item.get('sodium', 0) for item in food_items)

            # Get the first food item name for description
            food_name = food_items[0].get('name') if food_items else description

            # Create food entry record
            food_entry = {
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "description": food_name or description or "AI-analyzed food",
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
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat(),
                "image_url": image_url  # Store base64 image directly here
            }

            print(f"Storing food entry: {food_entry['description']}")

            # Write to database - use food_entries table (which has the correct schema)
            try:
                write_result = db.write("food_entries", [food_entry])

                if write_result and write_result.get('success'):
                    print(f"✅ Successfully stored food entry with ID: {food_entry['id']}")
                    print(f"   Description: {food_entry['description']}")
                    print(f"   Calories: {food_entry['calories']}")
                    print(f"   Meal Type: {food_entry['meal_type']}")

                    # Add stored entry info to result
                    result['stored_entry'] = {
                        "id": food_entry["id"],
                        "description": food_entry["description"],
                        "calories": food_entry["calories"],
                        "meal_type": food_entry["meal_type"]
                    }
                else:
                    print(f"⚠️ Failed to store food entry: {write_result}")
                    result['warning'] = "Analysis successful but storage failed"
            except Exception as e:
                print(f"⚠️ Storage error: {e}")
                result['warning'] = f"Analysis successful but storage failed: {str(e)}"

        return respond(200, result)
    except Exception as e:
        print(f"AI analysis error: {e}")
        import traceback
        traceback.print_exc()
        return respond(500, {"error": str(e)})
