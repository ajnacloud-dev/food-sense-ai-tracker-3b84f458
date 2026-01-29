import os
import json
import time
from datetime import datetime
import pytz
from openai import OpenAI

class AIService:
    def __init__(self, db_client):
        self.db = db_client
        # Initialize OpenAI client with explicit configuration
        api_key = os.environ.get("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY environment variable is required")

        # Create client with minimal configuration to avoid proxy conflicts
        self.client = OpenAI(
            api_key=api_key,
            timeout=60.0,
            max_retries=2
        )

    def _get_default_model(self):
        try:
            print("Querying app_models for default model...")
            res = self.db.query("app_models", filters=[
                {"field": "is_active", "operator": "eq", "value": True},
                {"field": "is_default", "operator": "eq", "value": True}
            ], limit=1)
            print(f"Query response: {res}")
            data = res.get('data', {})
            models = data.get('records', [])
            if models:
                # Clean the record to remove metadata fields
                model = models[0]
                cleaned = {k: v for k, v in model.items() if not k.startswith('_')}
                print(f"Found model: {cleaned.get('model_id')}")
                return cleaned
            else:
                print("No models found in database")
        except Exception as e:
            print(f"Error fetching model: {e}")
            import traceback
            traceback.print_exc()
            
        return {
            "model_id": "gpt-4o-mini", 
            "input_cost_per_1k_tokens": 0.00015,
            "output_cost_per_1k_tokens": 0.0006
        }

    def _get_prompt(self, category):
        try:
            res = self.db.query("app_prompts", filters=[
                {"field": "category", "operator": "eq", "value": category},
                {"field": "is_active", "operator": "eq", "value": True}
            ], limit=1)

            print(f"Prompt query response for {category}: {res}")

            if res and res.get('success'):
                data = res.get('data', {})
                prompts = data.get('records', [])
                if prompts and len(prompts) > 0:
                    # Clean the record to remove metadata fields
                    prompt = prompts[0]
                    cleaned = {k: v for k, v in prompt.items() if not k.startswith('_')}
                    print(f"Found prompt for {category}")
                    return cleaned
        except Exception as e:
            print(f"Error getting prompt: {e}")

        # Fallback prompts if DB is empty or error
        print(f"Using fallback prompt for {category}")
        if category == "food":
            return {
                "system_prompt": """You are an expert nutritionist AI. Analyze food descriptions and images to provide detailed nutritional information.
Always return valid JSON with this structure:
{
  "food_items": [{"name": "string", "calories": number, "protein": number, "carbs": number, "fat": number, "fiber": number, "sodium": number}],
  "total_calories": number,
  "meal_type": "breakfast|lunch|dinner|snack",
  "nutritional_summary": "string",
  "health_metrics": {
      "health_score": number,  // 0-100 score based on nutritional value
      "glycemic_index": "low|medium|high",
      "summary": "string"
  },
  "micronutrients": ["string"], // e.g. "High in Vitamin C", "Rich in Iron"
  "health_notes": "string"
}""",
                "user_prompt_template": "Analyze this food: {description}"
            }
        else:
            return {
                "system_prompt": "You are a helpful AI assistant. Return valid JSON.",
                "user_prompt_template": "Analyze this: {description}"
            }

    def _classify_content(self, description):
        lower_desc = description.lower() if description else ""
        if any(w in lower_desc for w in ["receipt", "bill", "invoice"]):
            return "receipt"
        if any(w in lower_desc for w in ["workout", "gym", "exercise", "training"]):
            return "workout"
        return "food"

    def _get_time_context(self):
        # Default to UTC if no timezone provided (Future: User timezone)
        now = datetime.now(pytz.utc)
        hour = now.hour
        
        meal_type = 'snack'
        if 5 <= hour < 11: meal_type = 'breakfast'
        elif 11 <= hour < 15: meal_type = 'lunch'
        elif 17 <= hour < 22: meal_type = 'dinner'
        
        return f"Current time: {now.strftime('%Y-%m-%d %H:%M:%S UTC')}. Suggested meal type based on time: {meal_type}."

    def process_request(self, user_id, description, image_url=None):
        model_config = self._get_default_model()
        model_id = model_config.get('model_id')
        
        # Resolve Ibex Storage Keys to accessible Presigned URLs
        # If image_url looks like an S3 key (e.g. starts with "uploads/"), resolve it
        if image_url and isinstance(image_url, str) and image_url.startswith('uploads/'):
            try:
                file_key = image_url
                print(f"Resolving Stored File Key for analysis: {file_key}")
                # db is IbexClient
                res = self.db.get_download_url(file_key)
                if res.get('success'):
                    image_url = res['data']['download_url']
                    print("Successfully resolved to presigned URL")
                else:
                    print(f"Failed to resolve File Key: {res.get('error')}")
            except Exception as e:
                print(f"Error resolving File Key: {e}")

        # 1. Classify
        category = self._classify_content(description)
        
        # 2. Get Prompt & Context
        prompt_config = self._get_prompt(category)
        system_prompt = prompt_config.get('system_prompt', 'You are a helpful AI assistant.')
        user_template = prompt_config.get('user_prompt_template', '{description}')
        
        time_context = self._get_time_context()
        
        # Enhance prompt based on category
        full_user_prompt = user_template.replace('{description}', description or '')
        if category == 'food':
            full_user_prompt += f"\n\n{time_context}\nDetermine appropriate meal type. Provide nutrition estimates."
        elif category == 'receipt':
            full_user_prompt += "\n\nExtract visible items only. Do not hallucinate."
            
        full_user_prompt += "\nReturn ONLY valid JSON."

        # 3. Construct Messages
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": []}
        ]
        
        content_parts = [{"type": "text", "text": full_user_prompt}]
        if image_url:
            content_parts.append({
                "type": "image_url",
                "image_url": {"url": image_url}
            })
        messages[1]["content"] = content_parts

        # 4. Call OpenAI
        try:
            # Use different parameters based on model
            params = {
                "model": model_id,
                "messages": messages,
                "temperature": 0,
                "response_format": {"type": "json_object"}
            }

            # GPT-5.2 models use max_completion_tokens instead of max_tokens
            if "gpt-5" in model_id.lower():
                params["max_completion_tokens"] = 1500
            else:
                params["max_tokens"] = 1500

            completion = self.client.chat.completions.create(**params)
            
            result_text = completion.choices[0].message.content
            usage = completion.usage
            analysis_result = json.loads(result_text)
            
            # 5. Log Cost
            cost = (usage.prompt_tokens / 1000 * model_config.get('input_cost_per_1k_tokens', 0)) + \
                   (usage.completion_tokens / 1000 * model_config.get('output_cost_per_1k_tokens', 0))
                   
            log_entry = {
                "user_id": user_id,
                "function_name": "process_request",
                "category": category,
                "model_used": model_id,
                "total_tokens": usage.total_tokens,
                "cost_usd": cost,
                "created_at": datetime.now(pytz.utc).isoformat()
            }
            
            try:
                self.db.write("app_api_costs", [log_entry])
            except Exception as e:
                print(f"Failed to log cost: {e}")

            return {
                "success": True,
                "category": category,
                "data": analysis_result,
                "metadata": {
                    "model": model_id,
                    "tokens": usage.total_tokens
                }
            }

        except Exception as e:
            print(f"AI Processing Error: {e}")
            return {"success": False, "error": str(e)}
