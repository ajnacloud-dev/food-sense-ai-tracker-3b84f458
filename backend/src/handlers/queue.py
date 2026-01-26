"""
Background Analysis Queue Handler
"""

import json
import uuid
import threading
import time
from datetime import datetime
from utils.http import respond, get_user_id

# Global queue processor thread
queue_processor = None

def queue_analysis(event, context):
    """POST /v1/queue/analysis - Queue a food analysis job"""
    db = context['db']
    user_id = get_user_id(event) or 'local-dev-user'

    try:
        body = json.loads(event.get('body', '{}'))
    except:
        return respond(400, {"error": "Invalid JSON"})

    description = body.get('description')
    image_url = body.get('imageUrl') or body.get('image_url')

    if not description and not image_url:
        return respond(400, {"error": "Missing description or imageUrl"})

    # Create queue entry with all required fields
    job_id = str(uuid.uuid4())
    queue_entry = {
        "id": job_id,
        "user_id": user_id,
        "description": description or "",
        "image_url": image_url or "",  # Include empty string if None
        "status": "pending",  # pending, processing, completed, failed
        "result": "",  # Empty initially
        "error": "",  # Empty initially
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
        "completed_at": "",  # Empty initially
        "progress": 0
    }

    try:
        # Store in app_analysis_queue table (must use full table name with prefix)
        print(f"Queue entry to write: {queue_entry}")
        result = db.write("app_analysis_queue", [queue_entry])

        if result.get('success'):
            print(f"✅ Queued analysis job: {job_id}")

            # Start background processor if not running
            global queue_processor
            if queue_processor is None or not queue_processor.is_alive():
                queue_processor = threading.Thread(
                    target=process_queue,
                    args=(context,),
                    daemon=True
                )
                queue_processor.start()
                print("🚀 Started background queue processor")

            return respond(200, {
                "success": True,
                "job_id": job_id,
                "message": "Analysis queued successfully",
                "status": "pending"
            })
        else:
            return respond(500, {"error": "Failed to queue analysis"})

    except Exception as e:
        print(f"Queue error: {e}")
        return respond(500, {"error": str(e)})


def get_job_status(event, context):
    """GET /v1/queue/status/{job_id} - Get status of a queued job"""
    db = context['db']
    job_id = event['pathParameters'].get('job_id')

    if not job_id:
        return respond(400, {"error": "Missing job_id"})

    try:
        # Query the queue
        result = db.query("app_analysis_queue",
                         filters=[{"field": "id", "operator": "eq", "value": job_id}],
                         limit=1)

        if result.get('success'):
            data = result.get('data', {})
            records = data.get('records', []) if isinstance(data, dict) else data
            if records:
                job = records[0]

                response = {
                    "job_id": job['id'],
                    "status": job['status'],
                    "progress": job.get('progress', 0),
                    "created_at": job['created_at']
                }

                # Include result if completed
                if job['status'] == 'completed' and job.get('result'):
                    try:
                        response['result'] = json.loads(job['result']) if isinstance(job['result'], str) else job['result']
                    except:
                        response['result'] = job['result']

                # Include error if failed
                if job['status'] == 'failed':
                    response['error'] = job.get('error', 'Unknown error')

                return respond(200, response)
            else:
                return respond(404, {"error": "Job not found"})
        else:
            return respond(500, {"error": "Failed to query job status"})

    except Exception as e:
        print(f"Status check error: {e}")
        return respond(500, {"error": str(e)})


def get_user_jobs(event, context):
    """GET /v1/queue/jobs - Get all jobs for current user"""
    db = context['db']
    user_id = get_user_id(event) or 'local-dev-user'

    try:
        # Query user's jobs
        result = db.query("app_analysis_queue",
                         filters=[{"field": "user_id", "operator": "eq", "value": user_id}],
                         sort=[{"field": "created_at", "order": "desc"}],
                         limit=50)

        if result.get('success'):
            data = result.get('data', {})
            jobs = data.get('records', []) if isinstance(data, dict) else data

            # Format response
            formatted_jobs = []
            for job in jobs:
                formatted_job = {
                    "job_id": job['id'],
                    "status": job['status'],
                    "description": job.get('description', ''),
                    "progress": job.get('progress', 0),
                    "created_at": job['created_at'],
                    "updated_at": job.get('updated_at')
                }

                if job['status'] == 'completed':
                    formatted_job['completed_at'] = job.get('updated_at')

                formatted_jobs.append(formatted_job)

            return respond(200, {
                "success": True,
                "jobs": formatted_jobs,
                "total": len(formatted_jobs)
            })
        else:
            return respond(500, {"error": "Failed to query jobs"})

    except Exception as e:
        print(f"Jobs query error: {e}")
        return respond(500, {"error": str(e)})


def process_queue(context):
    """Background thread to process queued analysis jobs"""
    db = context['db']
    ai_service = context['ai_service']

    print("📊 Queue processor started")

    while True:
        try:
            # Get pending jobs (use full table name with prefix)
            result = db.query("app_analysis_queue",
                            filters=[{"field": "status", "operator": "eq", "value": "pending"}],
                            sort=[{"field": "created_at", "order": "asc"}],
                            limit=1)

            print(f"Query result: {result}")
            if result.get('success'):
                # Extract records from the data structure
                data = result.get('data', {})
                jobs = data.get('records', []) if isinstance(data, dict) else data

                if jobs:
                    job = jobs[0]
                    job_id = job['id']
                    print(f"📋 Processing job: {job_id}")

                    # Update status to processing (need all fields for Ibex)
                    job['status'] = "processing"
                    job['progress'] = 25
                    job['updated_at'] = datetime.utcnow().isoformat()
                    db.write("app_analysis_queue", [job])

                    try:
                        # Perform AI analysis
                        print(f"🤖 Analyzing with GPT-5.2...")
                        analysis_result = ai_service.process_request(
                            job['user_id'],
                            job.get('description'),
                            job.get('image_url')
                        )

                        # Update progress
                        job['progress'] = 75
                        job['updated_at'] = datetime.utcnow().isoformat()
                        db.write("app_analysis_queue", [job])

                        if analysis_result.get('success'):
                            # Store the food entry
                            ai_data = analysis_result.get('data', {})
                            category = analysis_result.get('category', 'food')

                            if category == 'food':
                                # Extract and store food data
                                food_items = ai_data.get('food_items', [])
                                total_calories = ai_data.get('total_calories', 0)
                                meal_type = ai_data.get('meal_type', 'snack')

                                # Calculate totals
                                total_protein = sum(item.get('protein', 0) for item in food_items)
                                total_carbs = sum(item.get('carbs', 0) for item in food_items)
                                total_fat = sum(item.get('fat', 0) for item in food_items)

                                # Get food name
                                food_name = food_items[0].get('name') if food_items else job.get('description')

                                # Create food entry
                                food_entry_id = str(uuid.uuid4())
                                food_entry = {
                                    "id": food_entry_id,
                                    "user_id": job['user_id'],
                                    "description": food_name or job.get('description') or "AI-analyzed food",
                                    "meal_type": meal_type,
                                    "meal_date": datetime.utcnow().strftime('%Y-%m-%d'),
                                    "meal_time": datetime.utcnow().strftime('%H:%M'),
                                    "calories": total_calories,
                                    "total_protein": total_protein,
                                    "total_carbohydrates": total_carbs,
                                    "total_fats": total_fat,
                                    "total_fiber": sum(item.get('fiber', 0) for item in food_items),
                                    "total_sodium": sum(item.get('sodium', 0) for item in food_items),
                                    "ingredients": json.dumps(food_items),
                                    "extracted_nutrients": json.dumps(ai_data),
                                    "confidence_score": 0.95,
                                    "created_at": datetime.utcnow().isoformat(),
                                    "updated_at": datetime.utcnow().isoformat(),
                                    "image_url": job.get('image_url')
                                }

                                # Store food entry (use app_ prefix)
                                write_result = db.write("app_food_entries", [food_entry])

                                if write_result.get('success'):
                                    print(f"✅ Stored food entry: {food_entry_id}")

                                    # Mark job as completed
                                    complete_result = {
                                        "food_entry_id": food_entry_id,
                                        "description": food_entry['description'],
                                        "calories": total_calories,
                                        "meal_type": meal_type,
                                        "analysis": ai_data
                                    }

                                    job['status'] = "completed"
                                    job['progress'] = 100
                                    job['result'] = json.dumps(complete_result)
                                    job['updated_at'] = datetime.utcnow().isoformat()
                                    job['completed_at'] = datetime.utcnow().isoformat()
                                    db.write("app_analysis_queue", [job])

                                    print(f"✅ Job completed: {job_id}")
                                else:
                                    raise Exception("Failed to store food entry")
                            else:
                                # Non-food item
                                job['status'] = "completed"
                                job['progress'] = 100
                                job['result'] = json.dumps({"category": category, "data": ai_data})
                                job['updated_at'] = datetime.utcnow().isoformat()
                                job['completed_at'] = datetime.utcnow().isoformat()
                                db.write("app_analysis_queue", [job])
                        else:
                            raise Exception(analysis_result.get('error', 'Analysis failed'))

                    except Exception as e:
                        print(f"❌ Job failed: {job_id} - {e}")
                        # Mark as failed
                        job['status'] = "failed"
                        job['error'] = str(e)
                        job['updated_at'] = datetime.utcnow().isoformat()
                        db.write("app_analysis_queue", [job])
                else:
                    # No pending jobs, wait
                    time.sleep(5)
            else:
                print(f"Queue query error: {result.get('error')}")
                time.sleep(10)

        except Exception as e:
            import traceback
            print(f"Queue processor error: {str(e)}")
            print(f"Error type: {type(e).__name__}")
            print(f"Traceback: {traceback.format_exc()}")
            time.sleep(10)