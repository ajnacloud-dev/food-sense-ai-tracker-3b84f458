# Food App - Local Development & AWS Deployment

Health and nutrition tracking application with AI-powered analysis.

## Architecture Overview

### Current State
- **Backend**: Python Lambda (ready for AWS deployment)
  - Uses Ibex API for database (external service)
  - Handlers for auth, AI analysis, data, and storage
- **Frontend**: React + TypeScript + Vite
  - Currently using Supabase (will be migrated to AWS services)

### Target AWS Deployment
- **Backend**: AWS Lambda Container (Python 3.12)
- **Frontend**: CloudFront + S3 static hosting
- **Database**: Ibex API (external - no changes needed)
- **Auth**: AWS Cognito (to be implemented)
- **Storage**: S3 for file uploads

### Local Development
- Docker Compose with **backend + frontend** only
- Backend connects to real Ibex API (same as production)
- Tests the **exact** setup that will run in AWS Lambda

---

## Local Development Setup

### Prerequisites
- Docker Desktop (running)
- Your API keys (Ibex, OpenAI)

### Quick Start

1. **Navigate to project**
```bash
cd /Users/pnalla/tracelinkrepo/food-app
```

2. **Configure environment variables**
```bash
cp .env.example .env
# Edit .env and add your API keys:
# - IBEX_API_KEY (required)
# - OPENAI_API_KEY (required)
```

3. **Make dev script executable**
```bash
chmod +x dev.sh
```

4. **Start the development environment**
```bash
./dev.sh start
```

This starts:
- **Backend API** (Python Lambda simulation) → http://localhost:8000
- **Frontend** (React dev server with HMR) → http://localhost:5173

5. **Access the application**
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000

### Development Commands

```bash
# Start all services (backend + frontend)
./dev.sh start

# Stop all services
./dev.sh stop

# View logs (all services)
./dev.sh logs

# View logs (specific service)
./dev.sh logs backend
./dev.sh logs frontend

# Check service status
./dev.sh status

# Restart services
./dev.sh restart           # All services
./dev.sh restart backend   # Just backend

# Reset environment (removes all containers and volumes)
./dev.sh reset

# Rebuild containers from scratch
./dev.sh rebuild

# Run commands in containers
./dev.sh backend env                 # Show backend environment
./dev.sh frontend npm run build      # Build frontend

# Show help
./dev.sh help
```

---

## Project Structure

```
food-app/
├── docker-compose.yml          # Backend + Frontend orchestration
├── .env.example                # Environment variables template
├── dev-*.sh                    # Development helper scripts
├── food-sense-ai-tracker-3b84f458/
│   ├── backend/
│   │   ├── src/
│   │   │   ├── app.py          # Lambda entry point
│   │   │   ├── router.py       # API routing
│   │   │   ├── handlers/       # Request handlers
│   │   │   │   ├── auth.py     # Authentication
│   │   │   │   ├── ai.py       # AI analysis
│   │   │   │   ├── data.py     # Data CRUD
│   │   │   │   └── storage.py  # File storage
│   │   │   ├── lib/
│   │   │   │   ├── ibex.py     # Ibex database client
│   │   │   │   └── ai.py       # AI service (OpenAI)
│   │   │   ├── schemas/        # JSON table schemas
│   │   │   ├── config.json     # Backend config
│   │   │   └── requirements.txt
│   │   ├── Dockerfile          # Production Lambda container
│   │   ├── Dockerfile.dev      # Development container
│   │   ├── pyproject.toml      # uv package manager config
│   │   └── local_server.py     # Local development server
│   └── ui/
│       ├── src/
│       │   ├── components/     # React components
│       │   ├── contexts/       # State management
│       │   ├── pages/          # Page components
│       │   ├── integrations/   # External services
│       │   │   └── supabase/   # TO BE MIGRATED
│       │   └── services/
│       ├── Dockerfile.dev      # Development container
│       ├── vite.config.ts      # Vite configuration
│       └── package.json
```

---

## How This Matches AWS Deployment

### Backend (Lambda Container)
- **Local**: Docker runs `local_server.py` simulating Lambda
- **AWS**: Same container runs on AWS Lambda with Lambda Runtime
- **API**: Both connect to real Ibex API
- **Code**: Exact same Python code and dependencies

### Frontend (Static Site)
- **Local**: Vite dev server with hot module reload
- **AWS**: Built bundle served from CloudFront + S3
- **Build**: `npm run build` creates production bundle

### Database (Ibex API)
- **Local & AWS**: Same external Ibex API
- **No changes needed**: Already configured correctly

---

## Migration Plan: Supabase → AWS

### ✅ Phase 1: Local Testing (CURRENT)
- ✅ Docker Compose with backend + frontend
- ✅ Backend using uv package manager
- ✅ Backend connects to Ibex API
- ✅ Development scripts for easy testing

### Phase 2: Frontend Migration (~50 files)
Supabase services to migrate:
- **Auth** → AWS Cognito (can use LocalStack for local testing)
- **Database queries** → Backend API endpoints
- **Storage** → S3 with presigned URLs
- **Realtime** → WebSocket API (future)

Files using Supabase (need updating):
- Auth: [SimplifiedAuth.tsx](food-sense-ai-tracker-3b84f458/ui/src/pages/SimplifiedAuth.tsx), [UserTypeContext.tsx](food-sense-ai-tracker-3b84f458/ui/src/contexts/UserTypeContext.tsx)
- Database: ~40 files using `supabase.from()`
- Storage: File upload components

### Phase 3: Infrastructure as Code
Create AWS deployment using CDK or Terraform:
- Lambda Function (ECR container)
- API Gateway (HTTP API)
- CloudFront Distribution
- S3 Buckets (storage + static site)
- Cognito User Pool (if needed)
- IAM Roles and Policies
- CI/CD Pipeline (GitHub Actions)

### Phase 4: AWS Deployment
- Build and push Lambda container to ECR
- Deploy infrastructure with CDK/Terraform
- Build and upload frontend to S3
- Configure CloudFront distribution
- Test in production

---

## Development Workflow

### Backend Development (Using UV)

```bash
cd food-sense-ai-tracker-3b84f458/backend

# Install uv (if not installed)
curl -LsSf https://astral.sh/uv/install.sh | sh

# Install dependencies
uv pip install -r src/requirements.txt

# Run locally (outside Docker)
python local_server.py
```

### Frontend Development

```bash
cd food-sense-ai-tracker-3b84f458/ui

# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Hot Reload

- **Backend**: Source files mounted as volume (changes require container restart)
- **Frontend**: Vite HMR (instant updates, no restart needed)

To restart backend after code changes:
```bash
./dev.sh restart backend
```

---

## Testing

### Backend API Testing

```bash
# Health check / auth config
curl http://localhost:8000/v1/auth/config

# List tables
curl http://localhost:8000/v1/system/initialize-schemas

# Example: Get food entries (requires auth)
curl http://localhost:8000/v1/food_entries \
  -H "Authorization: Bearer YOUR_TOKEN"

# Example: AI analysis
curl -X POST http://localhost:8000/v1/ai/analyze \
  -H "Content-Type: application/json" \
  -d '{"text":"I ate an apple"}'
```

### Frontend Testing
- Access http://localhost:5173
- Currently uses Supabase for auth (will be migrated)

---

## Authentication (Current vs Future)

### Current (Supabase)
- Frontend uses Supabase Auth
- Backend has auth handler but not fully wired

### Future (AWS Cognito)
- **Option 1**: Set up real AWS Cognito (production-ready)
- **Option 2**: Use LocalStack for local Cognito testing
- **Option 3**: Mock auth in development (simplest for now)

For now, the backend's [local_server.py](food-sense-ai-tracker-3b84f458/backend/local_server.py:47-70) includes mock auth for development.

---

## Deployment to AWS (Coming Soon)

### Build Backend Lambda Container

```bash
cd food-sense-ai-tracker-3b84f458/backend

# Build production container
docker build -t food-app-backend:latest .

# Test locally
docker run -p 8000:8080 \
  -e IBEX_API_KEY=your-key \
  -e OPENAI_API_KEY=your-key \
  food-app-backend:latest

# Tag and push to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

docker tag food-app-backend:latest \
  ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/food-app-backend:latest

docker push \
  ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/food-app-backend:latest
```

### Deploy Frontend to S3 + CloudFront

```bash
cd food-sense-ai-tracker-3b84f458/ui

# Build production bundle
npm run build

# Upload to S3
aws s3 sync dist/ s3://food-app-frontend-prod \
  --delete \
  --cache-control "public,max-age=31536000,immutable"

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/*"
```

---

## Troubleshooting

### Docker Issues

```bash
# Check Docker is running
docker info

# Check service status
./dev.sh status

# View all container logs
./dev.sh logs

# View specific service logs
./dev.sh logs backend
./dev.sh logs frontend

# Restart a service
./dev.sh restart backend

# Rebuild containers from scratch
./dev.sh rebuild

# Clean everything and start fresh
./dev.sh reset
```

### Backend Issues

```bash
# Check backend is running
curl http://localhost:8000/v1/auth/config

# View backend logs
./dev.sh logs backend

# Check environment variables
./dev.sh backend env

# Restart backend
./dev.sh restart backend
```

### Frontend Issues

```bash
# Check frontend is running
curl http://localhost:5173

# View frontend logs
./dev.sh logs frontend

# Check environment variables
./dev.sh frontend env | grep VITE_

# Restart frontend
./dev.sh restart frontend
```

### Build Issues

```bash
# Clean Docker build cache
docker-compose build --no-cache

# Remove all stopped containers
docker container prune -f

# Remove all unused volumes
docker volume prune -f
```

---

## Environment Variables

### Required
- `IBEX_API_KEY` - Ibex database API key (from Ajna)
- `OPENAI_API_KEY` - OpenAI API key for AI analysis

### Optional (Production only)
- `AWS_REGION` - AWS region (default: us-east-1)
- `AWS_ACCOUNT_ID` - Your AWS account ID

---

## Next Steps

1. ✅ **Test local setup**
   - Run `./dev.sh start`
   - Access frontend at http://localhost:5173
   - Test backend API at http://localhost:8000

2. **Migrate frontend from Supabase**
   - Replace Supabase Auth with AWS Cognito (or mock for now)
   - Update database calls to use backend API
   - Replace storage calls with S3

3. **Create AWS infrastructure**
   - Set up Lambda function with container
   - Configure API Gateway
   - Set up CloudFront + S3 for frontend
   - Configure Cognito User Pool

4. **Deploy to AWS**
   - Push Lambda container to ECR
   - Deploy infrastructure
   - Upload frontend to S3
   - Test production deployment

---

## Support & Contributing

For issues or questions about specific components:
- **Backend Lambda**: [backend/src/app.py](food-sense-ai-tracker-3b84f458/backend/src/app.py)
- **API Routing**: [backend/src/router.py](food-sense-ai-tracker-3b84f458/backend/src/router.py)
- **Frontend**: [ui/src/](food-sense-ai-tracker-3b84f458/ui/src/)
- **Docker Setup**: [docker-compose.yml](docker-compose.yml)
