# Lambda Deployment Guide for NutriWealth Backend

## 🎯 Recommended Configuration

### 1. Lambda Function Settings
```yaml
Runtime: Python 3.11 (Container)
Architecture: arm64 (Graviton2 - 20% cheaper, 19% faster)
Memory: 3008 MB (Sweet spot for AI processing)
Timeout: 30 seconds (API Gateway limit)
Reserved Concurrency: 50 (Prevent runaway costs)
Environment: See below
```

### 2. Environment Variables
```bash
# Required - Core
IBEX_API_URL=https://smartlink.ajna.cloud/ibexdb
IBEX_API_KEY=your-key-here
TENANT_ID=your-tenant-id
AUTH_MODE=cognito  # or 'local' for dev

# Required - AI Providers
OPENAI_API_KEY=sk-...
GROQ_API_KEY=gsk_...
ANTHROPIC_API_KEY=sk-ant-...

# Required - AWS Services
AWS_REGION=us-east-1
S3_BUCKET=nutriwealth-uploads

# Optional - Async Processing (Phase 2)
ENABLE_SQS=true
AI_PROCESSING_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/...

# Optional - Auth (if using Cognito)
COGNITO_USER_POOL_ID=us-east-1_...
COGNITO_CLIENT_ID=...
COGNITO_REGION=us-east-1

# Optional - Performance
ENABLE_CACHE=true
CACHE_TTL=300
LOG_LEVEL=INFO
```

## 📦 Deployment Steps

### Option 1: Docker Container (Recommended)

```bash
# 1. Build the Docker image
cd backend
docker build -t nutriwealth-backend .

# 2. Tag for ECR
docker tag nutriwealth-backend:latest \
  123456789012.dkr.ecr.us-east-1.amazonaws.com/nutriwealth-backend:latest

# 3. Push to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  123456789012.dkr.ecr.us-east-1.amazonaws.com

docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/nutriwealth-backend:latest

# 4. Update Lambda function
aws lambda update-function-code \
  --function-name nutriwealth-backend \
  --image-uri 123456789012.dkr.ecr.us-east-1.amazonaws.com/nutriwealth-backend:latest
```

### Option 2: Serverless Framework

Create `serverless.yml`:
```yaml
service: nutriwealth-backend

provider:
  name: aws
  runtime: python3.11
  stage: ${opt:stage, 'dev'}
  region: us-east-1
  architecture: arm64
  memorySize: 3008
  timeout: 30
  environment:
    IBEX_API_URL: ${env:IBEX_API_URL}
    IBEX_API_KEY: ${env:IBEX_API_KEY}
    OPENAI_API_KEY: ${env:OPENAI_API_KEY}
    # ... other env vars

functions:
  api:
    handler: app_optimized.lambda_handler
    events:
      - httpApi:
          path: /{proxy+}
          method: ANY
      - httpApi:
          path: /
          method: ANY
    reservedConcurrency: 50

  # Async processor (when SQS is ready)
  asyncProcessor:
    handler: handlers/analyze_async.process_queue_message
    timeout: 60
    reservedConcurrency: 10
    events:
      - sqs:
          arn:
            Fn::GetAtt: [AIProcessingQueue, Arn]
          batchSize: 1

resources:
  Resources:
    AIProcessingQueue:
      Type: AWS::SQS::Queue
      Properties:
        QueueName: ${self:service}-ai-processing-${self:provider.stage}
        VisibilityTimeout: 90
        MessageRetentionPeriod: 86400
```

Deploy:
```bash
serverless deploy --stage prod
```

### Option 3: AWS SAM

Create `template.yaml`:
```yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31

Globals:
  Function:
    Timeout: 30
    MemorySize: 3008
    Runtime: python3.11
    Architectures:
      - arm64
    Environment:
      Variables:
        IBEX_API_URL: !Ref IbexApiUrl
        IBEX_API_KEY: !Ref IbexApiKey

Parameters:
  IbexApiUrl:
    Type: String
    Default: https://smartlink.ajna.cloud/ibexdb
  IbexApiKey:
    Type: String
    NoEcho: true

Resources:
  NutriWealthAPI:
    Type: AWS::Serverless::Function
    Properties:
      PackageType: Image
      ImageUri: !Sub ${AWS::AccountId}.dkr.ecr.${AWS::Region}.amazonaws.com/nutriwealth-backend:latest
      Events:
        ApiEvent:
          Type: HttpApi
          Properties:
            Path: /{proxy+}
            Method: ANY
```

Deploy:
```bash
sam build
sam deploy --guided
```

## 🔐 IAM Role Permissions

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::nutriwealth-uploads/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObjectVersion",
        "s3:GetObjectVersionTagging"
      ],
      "Resource": "arn:aws:s3:::nutriwealth-uploads/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "sqs:SendMessage",
        "sqs:ReceiveMessage",
        "sqs:DeleteMessage",
        "sqs:GetQueueAttributes"
      ],
      "Resource": "arn:aws:sqs:*:*:nutriwealth-ai-processing-*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "xray:PutTraceSegments",
        "xray:PutTelemetryRecords"
      ],
      "Resource": "*"
    }
  ]
}
```

## 🚀 Performance Optimizations

### 1. Container Image Optimization
```dockerfile
# Multi-stage build for smaller image
FROM public.ecr.aws/lambda/python:3.11 as builder
COPY requirements.txt .
RUN pip install --target /opt/python -r requirements.txt

FROM public.ecr.aws/lambda/python:3.11
COPY --from=builder /opt/python /opt/python
COPY src/ ${LAMBDA_TASK_ROOT}/
```

### 2. Lambda Configuration
```yaml
# Provisioned Concurrency (for consistent <100ms cold starts)
ProvisionedConcurrencyConfig:
  ProvisionedConcurrentExecutions: 5

# SnapStart (Java/Python - reduces cold start by 90%)
SnapStart:
  ApplyOn: PublishedVersions

# Lambda@Edge (for global distribution)
# Consider for image serving endpoints
```

### 3. API Gateway Settings
```yaml
# HTTP API (40% cheaper than REST API)
Type: HttpApi
CorsConfiguration:
  AllowOrigins:
    - https://nutriwealth.com
  AllowMethods:
    - GET
    - POST
    - PUT
    - DELETE
  AllowHeaders:
    - authorization
    - content-type
  MaxAge: 86400

# Caching (for read endpoints)
CachingEnabled: true
CacheTtlInSeconds: 300
```

## 📊 Cost Optimization

### Estimated Monthly Costs (1M requests/month)
```
Lambda Compute: $80
  - 3008 MB × 1 sec avg × 1M requests
  - With Graviton2: $64 (20% savings)

API Gateway: $100
  - HTTP API: $1 per million requests
  - Data Transfer: ~$90 for 100GB

S3 Storage: $25
  - 1TB storage
  - 10M requests

SQS (when enabled): $20
  - 10M messages

Total: ~$200-250/month for 1M requests
```

### Cost Saving Tips
1. Use Graviton2 (arm64) - 20% cheaper
2. Use HTTP API instead of REST API - 40% cheaper
3. Enable S3 Intelligent Tiering for old images
4. Set Reserved Concurrency to prevent runaway costs
5. Use SQS for async processing - reduces Lambda runtime
6. Implement caching at API Gateway level

## 🔍 Monitoring & Debugging

### CloudWatch Alarms
```yaml
# High error rate
ErrorRateAlarm:
  MetricName: Errors
  Threshold: 10
  Period: 300

# High latency
LatencyAlarm:
  MetricName: Duration
  Threshold: 5000  # 5 seconds
  Period: 300

# Throttling
ThrottleAlarm:
  MetricName: Throttles
  Threshold: 5
  Period: 300
```

### X-Ray Tracing
```python
# Enable in Lambda
from aws_xray_sdk.core import xray_recorder

@xray_recorder.capture('analyze_food')
def analyze_food(event, context):
    # Your code here
```

## 🔄 CI/CD Pipeline

### GitHub Actions Example
```yaml
name: Deploy to Lambda

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v1
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1

      - name: Build and push Docker image
        run: |
          docker build -t nutriwealth-backend .
          docker tag nutriwealth-backend:latest \
            ${{ secrets.ECR_REGISTRY }}/nutriwealth-backend:latest
          docker push ${{ secrets.ECR_REGISTRY }}/nutriwealth-backend:latest

      - name: Update Lambda function
        run: |
          aws lambda update-function-code \
            --function-name nutriwealth-backend \
            --image-uri ${{ secrets.ECR_REGISTRY }}/nutriwealth-backend:latest
```

## 🎯 Production Checklist

- [ ] Set up CloudWatch Alarms
- [ ] Configure API Gateway throttling
- [ ] Enable X-Ray tracing
- [ ] Set up CloudWatch Logs retention (7 days)
- [ ] Configure Lambda Dead Letter Queue
- [ ] Set Reserved Concurrency limit
- [ ] Enable API Gateway caching for GET endpoints
- [ ] Set up CloudFront for static assets
- [ ] Configure S3 lifecycle policies
- [ ] Set up backup Lambda versions
- [ ] Configure auto-scaling for async processors
- [ ] Implement circuit breakers for external APIs
- [ ] Set up cost alerts

## 🚨 Rollback Strategy

```bash
# Quick rollback to previous version
aws lambda update-alias \
  --function-name nutriwealth-backend \
  --name prod \
  --function-version 42  # Previous stable version

# Or use CodeDeploy for blue/green deployments
```

## 📝 Notes

1. **Container stays warm for 15-60 minutes** - Great for model caching
2. **Lambda scales to 1000 concurrent** by default
3. **API Gateway has 29 second timeout** - Keep processing under this
4. **Use SQS for long-running tasks** - Async processing is key
5. **Monitor cold starts** - Use Provisioned Concurrency if needed