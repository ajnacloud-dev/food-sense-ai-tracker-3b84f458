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

                # Create entry with complete data
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
                    "extracted_nutrients": json.dumps(ai_data),
                    "image_url": image_url or "",
                    "created_at": datetime.utcnow().isoformat(),
                    "updated_at": datetime.utcnow().isoformat()
                }

                write_result = db.write("app_food_entries_v2", [food_entry])

                if write_result.get('success'):
                    print(f"✅ Created food entry: {entry_id}")
                    return respond(200, {
                        "success": True, 
                        "entry_id": entry_id, 
                        "status": "completed",
                        "category": "food"
                    })

            elif category == 'receipt':
                # Receipt Logic
                merchant = ai_data.get('merchant_name', 'Unknown Vendor')
                date_str = ai_data.get('purchase_date') or datetime.utcnow().strftime('%Y-%m-%d')
                total = ai_data.get('total_amount', 0.0)
                
                receipt_record = {
                    "id": entry_id,
                    "user_id": user_id,
                    "vendor": merchant,
                    "receipt_date": date_str,
                    "total_amount": total,
                    "currency": ai_data.get('currency', 'USD'),
                    "category": ai_data.get('category', 'General'),
                    "image_url": image_url or "",
                    "created_at": datetime.utcnow().isoformat(),
                    "updated_at": datetime.utcnow().isoformat()
                }
                
                # Write Parent
                db.write("app_receipts", [receipt_record])
                
                # Write Items
                items = ai_data.get('items', [])
                if items:
                    item_records = []
                    for item in items:
                        item_records.append({
                            "id": str(uuid.uuid4()),
                            "receipt_id": entry_id,
                            "name": item.get('name', 'Unknown Item'),
                            "price": item.get('price', 0.0),
                            "quantity": item.get('quantity', 1.0),
                            "category": item.get('category'),
                            "created_at": datetime.utcnow().isoformat()
                        })
                    db.write("app_receipt_items", item_records)
                    
                return respond(200, {
                    "success": True,
                    "entry_id": entry_id,
                    "status": "completed",
                    "category": "receipt",
                    "merchant": merchant,
                    "total": total
                })

            elif category == 'workout':
                # Workout Logic
                w_type = ai_data.get('workout_type', 'General')
                duration = ai_data.get('duration_minutes', 0)
                calories = ai_data.get('calories_burned_estimate', 0)
                
                workout_record = {
                    "id": entry_id,
                    "user_id": user_id,
                    "workout_type": w_type,
                    "duration_minutes": duration,
                    "calories_burned": calories,
                    "workout_date": ai_data.get('workout_date') or datetime.utcnow().strftime('%Y-%m-%d'),
                    "notes": ai_data.get('notes'),
                    "image_url": image_url or "",
                    "created_at": datetime.utcnow().isoformat()
                }
                
                # Write Parent
                db.write("app_workouts", [workout_record])
                
                # Write Exercises
                exercises = ai_data.get('exercises', [])
                if exercises:
                    ex_records = []
                    for ex in exercises:
                        ex_records.append({
                            "id": str(uuid.uuid4()),
                            "workout_id": entry_id,
                            "exercise_name": ex.get('name', 'Exercise'),
                            "sets": ex.get('sets'),
                            "reps": ex.get('reps'),
                            "weight": ex.get('weight_lbs'),
                            "distance": ex.get('distance_miles'),
                            "created_at": datetime.utcnow().isoformat()
                        })
                    db.write("app_workout_exercises", ex_records)

                return respond(200, {
                    "success": True,
                    "entry_id": entry_id,
                    "status": "completed",
                    "category": "workout",
                    "type": w_type
                })

            else:
                return respond(400, {
                    "success": False,
                    "entry_id": entry_id,
                    "error": f"Unknown category: {category}"
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