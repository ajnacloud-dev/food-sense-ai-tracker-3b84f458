# Testing Guide for Food Sense AI Tracker

## Overview
This project uses **Newman** (Postman/Insomnia CLI runner) for API testing instead of Python test scripts.

## Setup

### Install Newman
```bash
# Navigate to backend directory
cd backend

# Install Newman and dependencies
npm install

# Or install globally
npm install -g newman
npm install -g newman-reporter-html
```

## Running Tests

### Basic Test Run
```bash
# Run all tests with default environment (test tenant)
npm test

# Or directly with Newman
newman run insomnia-collection.json
```

### Test Different Environments

#### Local Development
```bash
npm run test:local
# Or
newman run insomnia-collection.json --env-var BASE_URL=http://localhost:8000
```

#### Docker Environment
```bash
npm run test:docker
# Or
newman run insomnia-collection.json --env-var BASE_URL=http://backend:8000
```

### Test Different Tenants

#### ACME Corp Tenant
```bash
newman run insomnia-collection.json \
  --env-var BASE_URL=http://localhost:8000 \
  --env-var TENANT_ID=acme_corp
```

#### HealthCo Tenant
```bash
newman run insomnia-collection.json \
  --env-var BASE_URL=http://localhost:8000 \
  --env-var TENANT_ID=health_co
```

### Generate Test Reports
```bash
# Generate HTML report
npm run test:report

# View report
open test-report.html
```

### Verbose Output
```bash
# See detailed request/response data
npm run test:verbose
```

## Test Scenarios

### 1. Health Check
- **Endpoint**: GET /health
- **Purpose**: Verify API is running
- **Expected**: 200 OK

### 2. Queue System Tests
- **Queue Analysis**: POST /v1/queue/analysis
- **Check Status**: GET /v1/queue/status/{job_id}
- **List Jobs**: GET /v1/queue/jobs

### 3. Food Analysis Tests
- **Direct Analysis**: POST /v1/analyze
- **Get Entries**: GET /v1/food_entries
- **Create Entry**: POST /v1/food_entries

### 4. Admin Tests
- **Get Models**: GET /v1/models
- **Get Prompts**: GET /v1/prompts

## Multi-Tenant Testing

Each test can be run with different tenant headers:

```bash
# Test with ACME Corp tenant
newman run insomnia-collection.json \
  --global-var "X-Tenant-ID=acme_corp"

# Test with HealthCo tenant
newman run insomnia-collection.json \
  --global-var "X-Tenant-ID=health_co"

# Test with Demo tenant
newman run insomnia-collection.json \
  --global-var "X-Tenant-ID=demo"
```

## Continuous Integration

### GitHub Actions Example
```yaml
name: API Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Start services
        run: docker-compose up -d
      - name: Wait for services
        run: sleep 10
      - name: Run Newman tests
        run: |
          npm install -g newman
          newman run insomnia-collection.json \
            --env-var BASE_URL=http://localhost:8000
      - name: Stop services
        run: docker-compose down
```

## Manual Testing with curl

For quick manual tests:

```bash
# Queue analysis
curl -X POST http://localhost:8000/v1/queue/analysis \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: test" \
  -d '{"description": "chicken biryani with raita"}'

# Check job status (replace JOB_ID)
curl http://localhost:8000/v1/queue/status/JOB_ID \
  -H "X-Tenant-ID: test"

# Get food entries
curl http://localhost:8000/v1/food_entries \
  -H "X-Tenant-ID: test"
```

## Environment Variables

The collection uses these variables:
- `BASE_URL`: API base URL (default: http://localhost:8000)
- `TENANT_ID`: Tenant identifier (default: test)
- `JOB_ID`: Job ID for status checks (set after queue request)

## Troubleshooting

### Common Issues

1. **Connection refused**
   - Ensure backend is running: `docker-compose up`
   - Check port 8000 is available

2. **401 Unauthorized**
   - Check tenant ID is valid
   - Verify API key in environment

3. **Queue not processing**
   - Check background processor is running
   - Verify OpenAI API key is set

4. **Wrong tenant data**
   - Verify X-Tenant-ID header
   - Check tenants.json configuration

## Notes

- **NO Python test files**: All .py test files have been archived
- **Use Newman**: All API testing should use Newman
- **Multi-tenant aware**: Always test with different tenants
- **Real APIs only**: No mocking, use actual services