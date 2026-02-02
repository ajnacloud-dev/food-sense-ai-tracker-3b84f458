# Platform-Level Model Configuration Guide

## Overview
Centralized AI model configuration for the NutriWealth platform using Ibex DB (DuckDB/Iceberg).

## Architecture

```
┌─────────────────────────────────────────────┐
│            Lambda Container                  │
│                                              │
│  ┌─────────────────────────────────────┐    │
│  │     ModelManager (Singleton)        │    │
│  │  - Container Cache (5 min TTL)      │    │
│  │  - Survives between invocations     │    │
│  └─────────────────────────────────────┘    │
│                    │                         │
│                    ▼                         │
│  ┌─────────────────────────────────────┐    │
│  │     Ibex DB (ai_model_config)       │    │
│  │  - Platform-wide settings           │    │
│  │  - Simple DuckDB table              │    │
│  └─────────────────────────────────────┘    │
└─────────────────────────────────────────────┘
```

## Features

### ✅ Platform-Level Configuration
- **Single source of truth** for all tenants
- No per-user or per-tenant complexity
- Default models for all use cases

### ✅ Lambda-Optimized Caching
- Container cache survives 15-60 minutes
- 5-minute TTL for config freshness
- <1ms access for cached configs

### ✅ Simple Table Structure
```sql
-- DuckDB/Iceberg compatible table
CREATE TABLE ai_model_config (
    id VARCHAR,           -- use_case name
    use_case VARCHAR,     -- classifier, food, receipt, workout
    provider VARCHAR,     -- openai, groq, anthropic
    model_name VARCHAR,   -- gpt-4o-mini, llama-3.3-70b
    temperature DECIMAL,
    max_tokens INT,
    is_active BOOLEAN
);
```

## Usage

### 1. Get Model Configuration
```python
from lib.model_manager import get_model_manager

# In your Lambda handler
model_manager = get_model_manager(db_client)
config = model_manager.get_model_config("receipt")

print(f"Provider: {config.provider}")        # openai
print(f"Model: {config.model_name}")         # gpt-4o-mini
print(f"Max Tokens: {config.max_tokens}")    # 500
```

### 2. Use in AI Service
```python
class OptimizedAIService:
    def __init__(self, db_client):
        self.db = db_client
        self.model_manager = get_model_manager(db_client)

    def process_request(self, user_id, description, image_url):
        # Stage 1: Get classifier model
        classifier_config = self.model_manager.get_model_config("classifier")

        # Use the config
        response = self.client.chat.completions.create(
            model=classifier_config.model_name,
            temperature=classifier_config.temperature,
            max_tokens=classifier_config.max_tokens,
            ...
        )

        # Stage 2: Get category-specific model
        category = response.choices[0].message.content
        analysis_config = self.model_manager.get_model_config(category)
        ...
```

## API Endpoints

### Get All Configurations
```bash
GET /v1/models/config

Response:
{
  "configs": {
    "classifier": {
      "provider": "openai",
      "model": "gpt-4o-mini",
      "temperature": 0.0,
      "max_tokens": 100
    },
    "food": {
      "provider": "openai",
      "model": "gpt-4o-mini",
      "temperature": 0.0,
      "max_tokens": 500,
      "fallback_provider": "groq",
      "fallback_model": "llama-3.3-70b-versatile"
    }
  }
}
```

### Update Configuration (Admin)
```bash
PUT /v1/models/config/receipt
Authorization: Bearer admin-token

{
  "provider": "groq",
  "model_name": "llama-3.3-70b-versatile",
  "max_tokens": 1000
}
```

### Test a Model
```bash
POST /v1/models/test

{
  "provider": "groq",
  "model": "llama-3.3-70b-versatile",
  "prompt": "Test prompt"
}

Response:
{
  "success": true,
  "provider": "groq",
  "model": "llama-3.3-70b-versatile",
  "response": "Test response...",
  "latency_ms": 450,
  "tokens": 25
}
```

## Default Configuration

If database is unavailable, falls back to hardcoded defaults:

| Use Case | Provider | Model | Max Tokens | Fallback |
|----------|----------|-------|------------|----------|
| classifier | OpenAI | gpt-4o-mini | 100 | - |
| food | OpenAI | gpt-4o-mini | 500 | Groq/Llama-3.3 |
| receipt | OpenAI | gpt-4o-mini | 500 | Groq/Llama-3.3 |
| workout | OpenAI | gpt-4o-mini | 500 | - |

## Performance

### Cold Start (First Request)
- Database query: ~50ms
- Total: ~100ms

### Warm Start (Cached)
- Container cache hit: <1ms
- No database query needed

### Cache Duration
- Container stays warm: 15-60 minutes
- Config cache TTL: 5 minutes
- Effective caching: Very high hit rate

## Changing Models Without Redeploy

### Option 1: API Call
```bash
# Switch receipts to use Groq
curl -X PUT https://api.nutriwealth.com/v1/models/config/receipt \
  -H "Authorization: Bearer admin-token" \
  -d '{
    "provider": "groq",
    "model_name": "llama-3.2-90b-vision"
  }'
```

### Option 2: Direct Database Update
```sql
UPDATE ai_model_config
SET provider = 'groq',
    model_name = 'llama-3.3-70b-versatile',
    updated_at = CURRENT_TIMESTAMP
WHERE use_case = 'receipt';
```

### Option 3: Environment Variables (Fallback)
```bash
# In Lambda environment variables
AI_PROVIDER=groq
FOOD_MODEL=llama-3.3-70b-versatile
```

## Cost Tracking

Models automatically track costs based on token usage:

```python
# Cost per 1K tokens stored in config
config.cost_per_1k_tokens  # 0.00015 for gpt-4o-mini

# Calculate cost
tokens_used = 1500
cost = (tokens_used / 1000) * config.cost_per_1k_tokens
```

## Adding New Providers

1. Add to `PROVIDER_CONFIGS` in `model_manager.py`:
```python
"new_provider": {
    "base_url": "https://api.newprovider.com/v1",
    "api_key_env": "NEW_PROVIDER_API_KEY",
    "supports_images": True,
    "supports_json_mode": True
}
```

2. Add models to `list_available_models()`:
```python
"new_provider": [
    "model-1",
    "model-2"
]
```

3. Set API key in Lambda environment:
```
NEW_PROVIDER_API_KEY=sk-...
```

## Benefits

1. **No Redeploy Needed** - Change models via API
2. **Platform-Wide** - All tenants use same config
3. **Simple** - No complex JSON types, just VARCHAR/INT/DECIMAL
4. **Fast** - Lambda container caching
5. **Reliable** - Hardcoded fallbacks if DB unavailable
6. **Cost Effective** - Minimal DB queries due to caching

## Migration from Hardcoded Models

Current hardcoded models will be automatically migrated on first use:
1. ModelManager checks if table exists
2. If not, creates default entries from `DEFAULT_CONFIGS`
3. Subsequent requests use database values

No manual migration needed!