# Async Implementation Status

## 🚀 Current Status: **70% Complete**

### ✅ What's Complete:

1. **AsyncAIService** (`lib/ai_async_service.py`)
   - Multi-provider support (OpenAI, Groq, Anthropic, Ollama)
   - SQS queue integration
   - Two-stage processing (classification + analysis)
   - Fallback chains

2. **Model Configuration** (`lib/model_manager.py`)
   - Database-driven model selection
   - Platform-level configuration
   - API endpoints for dynamic model changes

3. **Async Handlers** (`handlers/analyze_async.py`)
   - Submit endpoint (`POST /v1/analyze/async`)
   - Status endpoint (`GET /v1/analyze/status/{id}`)
   - Queue processor Lambda handler

### ❌ What's Missing:

## 1. AWS Infrastructure (Required)

### SQS Queue Setup
```yaml
# serverless.yml or CloudFormation
Resources:
  AIProcessingQueue:
    Type: AWS::SQS::Queue
    Properties:
      QueueName: ${self:service}-ai-processing-${self:provider.stage}
      VisibilityTimeout: 60  # Lambda timeout + buffer
      MessageRetentionPeriod: 86400  # 24 hours
      RedrivePolicy:
        deadLetterTargetArn: !GetAtt AIProcessingDLQ.Arn
        maxReceiveCount: 3

  AIProcessingDLQ:
    Type: AWS::SQS::Queue
    Properties:
      QueueName: ${self:service}-ai-processing-dlq-${self:provider.stage}
      MessageRetentionPeriod: 1209600  # 14 days

  # Lambda Execution Role needs SQS permissions
  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      Policies:
        - PolicyName: SQSAccess
          PolicyDocument:
            Statement:
              - Effect: Allow
                Action:
                  - sqs:SendMessage
                  - sqs:ReceiveMessage
                  - sqs:DeleteMessage
                Resource:
                  - !GetAtt AIProcessingQueue.Arn
```

### Lambda Functions
```yaml
functions:
  # API endpoint - returns immediately
  submitAnalysisAsync:
    handler: src/handlers/analyze_async.submit_analysis
    timeout: 6
    events:
      - http:
          path: /v1/analyze/async
          method: POST

  # Status check endpoint
  getAnalysisStatus:
    handler: src/handlers/analyze_async.get_analysis_status
    timeout: 6
    events:
      - http:
          path: /v1/analyze/status/{entry_id}
          method: GET

  # Queue processor - runs async
  processAnalysisQueue:
    handler: src/handlers/analyze_async.process_queue_message
    timeout: 30
    reservedConcurrency: 10  # Control costs
    events:
      - sqs:
          arn: !GetAtt AIProcessingQueue.Arn
          batchSize: 1  # Process one at a time for better error handling
```

## 2. Environment Variables

Add to Lambda environment:
```bash
# SQS Configuration
ENABLE_SQS=true
AI_PROCESSING_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/123456789/ai-processing-queue

# AWS Configuration
AWS_REGION=us-east-1
```

## 3. Router Updates

Add routes in `router.py`:
```python
# Async Analysis
('POST', r'^/v1/analyze/async$', analyze_async.submit_analysis),
('GET', r'^/v1/analyze/status/(?P<entry_id>[a-zA-Z0-9-]+)$', analyze_async.get_analysis_status),
```

## 4. Frontend Updates

### Submit with Async
```javascript
// Submit for async processing
const response = await api.post('/v1/analyze/async', {
  description: "Receipt from Walmart",
  image_url: imageUrl,
  callback_url: webhookUrl  // Optional
});

const { entry_id, poll_url } = response.data;

// Poll for status
const pollStatus = async () => {
  const status = await api.get(poll_url);

  if (status.data.status === 'completed') {
    // Process complete!
    console.log('Result:', status.data.result);
  } else if (status.data.status === 'failed') {
    // Handle error
    console.error('Processing failed');
  } else {
    // Still processing, poll again
    setTimeout(pollStatus, 2000);
  }
};

pollStatus();
```

### Or Use WebSocket (Better UX)
```javascript
// Connect to WebSocket for real-time updates
const ws = new WebSocket('wss://api.nutriwealth.com/ws');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.entry_id === entry_id) {
    if (data.status === 'completed') {
      updateUI(data.result);
    }
  }
};
```

## 5. Database Updates

Already have `pending_analyses` table, but might need to add:
```sql
ALTER TABLE pending_analyses
ADD COLUMN callback_url VARCHAR(500),
ADD COLUMN retry_count INT DEFAULT 0,
ADD COLUMN last_error TEXT;
```

## 📊 Performance Comparison

| Metric | Current (Sync) | With Async |
|--------|---------------|------------|
| API Response Time | 24-32 seconds | <200ms |
| User Wait Time | 24-32 seconds | 0 (instant) |
| Timeout Risk | High | None |
| Concurrent Users | Limited | Unlimited |
| Cost (API Lambda) | High (30s runtime) | Low (200ms) |
| Cost (Processing) | Same | Same (but in background) |

## 🎯 Implementation Steps

### Phase 1: Local Testing (No SQS)
1. ✅ Model configuration (DONE)
2. ✅ Async handlers (DONE)
3. ⬜ Update router.py
4. ⬜ Test with sync fallback

### Phase 2: AWS Setup
1. ⬜ Create SQS queues
2. ⬜ Deploy Lambda functions
3. ⬜ Set environment variables
4. ⬜ Configure IAM permissions

### Phase 3: Production
1. ⬜ Enable async by default
2. ⬜ Add monitoring/alerts
3. ⬜ Implement retry logic
4. ⬜ Add WebSocket support

## 🔄 Migration Strategy

### Gradual Rollout
```python
# In analyze.py
def analyze_food(event, context):
    # Check if user is in async rollout
    user_id = get_user_id(event)

    # Percentage-based rollout
    import hashlib
    user_hash = int(hashlib.md5(user_id.encode()).hexdigest()[:8], 16)

    if (user_hash % 100) < ASYNC_ROLLOUT_PERCENTAGE:
        # Use async
        return analyze_async.submit_analysis(event, context)
    else:
        # Use sync (current)
        return _process_sync(event, context)
```

## 📈 Expected Benefits

1. **User Experience**
   - Instant response (no waiting)
   - No timeout errors
   - Better progress indication

2. **Scalability**
   - Handle 100x more concurrent requests
   - Auto-scaling with SQS
   - No API Gateway timeouts

3. **Cost Optimization**
   - API Lambda: 30s → 0.2s (99% reduction)
   - Processing Lambda: Same cost but better distributed
   - Overall: ~50% cost reduction

4. **Reliability**
   - Built-in retry logic
   - Dead Letter Queue for failures
   - No lost requests

## 🚦 Current Blockers

1. **AWS Resources** - Need to create SQS queues
2. **IAM Permissions** - Lambda needs SQS access
3. **Environment Variables** - Need queue URLs
4. **Frontend Updates** - Polling/WebSocket implementation

## 📝 To Complete Async:

```bash
# 1. Deploy infrastructure
aws cloudformation deploy --template-file async-infra.yml

# 2. Update Lambda environment
aws lambda update-function-configuration \
  --function-name food-app-lambda \
  --environment Variables='{ENABLE_SQS=true,AI_PROCESSING_QUEUE_URL=...}'

# 3. Test async endpoint
curl -X POST https://api.nutriwealth.com/v1/analyze/async \
  -d '{"description": "Test receipt"}' \
  -H "Authorization: Bearer token"

# Response (instant):
{
  "entry_id": "abc-123",
  "status": "processing",
  "poll_url": "/v1/analyze/status/abc-123"
}

# 4. Check status
curl https://api.nutriwealth.com/v1/analyze/status/abc-123

# Response (after ~20 seconds):
{
  "entry_id": "abc-123",
  "status": "completed",
  "result": {...}
}
```

## Recommendation

The async implementation is **mostly complete** on the code side. To finish:

1. **Quick Win** (1 hour): Enable with sync fallback for testing
2. **Full Implementation** (4 hours): Set up AWS resources
3. **Production Ready** (1 day): Add monitoring, WebSocket, and gradual rollout

The async architecture will solve your current 24-32 second response time issue and make the app much more scalable!