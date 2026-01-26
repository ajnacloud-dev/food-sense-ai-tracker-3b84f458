# NutriWealth - Food & Wellness Tracker

A comprehensive nutrition tracking application with AI-powered food analysis, designed for AWS Lambda deployment with a modern React frontend.

## 🏗️ Project Structure

```
food-app/
├── backend/              # Python FastAPI backend (AWS Lambda)
│   ├── src/
│   │   ├── app.py       # Lambda entry point
│   │   ├── router.py    # API routing
│   │   ├── handlers/    # 10 API endpoint handlers
│   │   ├── lib/         # Core services (AI, DB, tenant management)
│   │   ├── schemas/     # 23 database table schemas
│   │   └── utils/       # Helper utilities
│   ├── local_server.py  # Local development server
│   ├── Dockerfile       # Production Lambda image
│   ├── Dockerfile.dev   # Development Docker image
│   └── tenants.json     # Multi-tenant configuration
│
├── ui/                  # React + TypeScript frontend
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── contexts/    # React contexts (Auth, Role, etc.)
│   │   ├── lib/         # API client and utilities
│   │   └── hooks/       # Custom React hooks
│   ├── public/          # Static assets
│   ├── vite.config.ts   # Vite configuration
│   ├── package.json     # Dependencies
│   └── Dockerfile.dev   # Development Docker image
│
├── docs/                # Documentation
│   ├── README.md        # Original documentation
│   ├── API-TESTING-GUIDE.md
│   ├── FRONTEND-INTEGRATION.md
│   ├── TESTING.md
│   └── test-assets/     # Test images and fixtures
│
├── scripts/             # Utility scripts
│   ├── dev.sh          # Development helper
│   └── run-tests.sh    # Test runner
│
├── docker-compose.yml   # Docker Compose configuration
├── .env.example         # Environment variables template
└── .env                 # Local environment (not in git)
```

## ✅ What's Been Completed

### Supabase Removal (100% Complete)
- ✅ All Supabase references removed from 77+ files
- ✅ Replaced with custom backend API (`backendApi`)
- ✅ No Supabase dependencies in package.json
- ✅ Service worker updated to cache backend API
- ✅ PWA configuration updated

### Repository Organization
- ✅ Flattened directory structure
- ✅ Removed obsolete nested directory
- ✅ Organized documentation into `/docs` folder
- ✅ Moved scripts to `/scripts` folder
- ✅ Cleaned up test artifacts

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 20+ (for local UI development)
- Python 3.12+ (for local backend development)

### 1. Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Edit .env and add your API keys:
# IBEX_API_KEY=your-ibex-key
# OPENAI_API_KEY=your-openai-key
```

### 2. Start with Docker Compose

```bash
# Build and start both services
docker compose up --build

# Or run in detached mode
docker compose up -d

# View logs
docker compose logs -f

# Stop services
docker compose down
```

### 3. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs (if configured)

## 🏃 Development

### Backend Development

```bash
cd backend

# Install dependencies with uv (recommended)
uv pip install -r src/requirements.txt

# Or with pip
pip install -r src/requirements.txt

# Run local server
python local_server.py

# Server runs on http://localhost:8080
```

### Frontend Development

```bash
cd ui

# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🏢 Architecture

### Backend (Python + FastAPI)
- **Runtime**: AWS Lambda (Python 3.12)
- **Framework**: Custom FastAPI-like router
- **Database**: Ibex Database (external API)
- **AI**: OpenAI GPT-4 for food analysis
- **Features**:
  - Multi-tenant architecture
  - Generic CRUD API for all tables
  - AI-powered food, receipt, and workout analysis
  - Image processing and storage
  - Cost tracking

### Frontend (React + TypeScript)
- **Framework**: React 18.3
- **Build Tool**: Vite 5.4
- **UI Library**: Tailwind CSS + Shadcn/ui
- **Routing**: React Router 6
- **State**: React Context API
- **PWA**: Progressive Web App enabled
- **Features**:
  - Responsive design
  - Offline support
  - Real-time updates
  - Role-based access (Participant/Caretaker)

## 📡 API Endpoints

### Authentication
- `GET /v1/auth/config` - Get auth configuration
- `POST /v1/auth/invitations/redeem` - Redeem invitation

### AI Analysis
- `POST /v1/analyze` - Analyze food/receipt/workout

### Storage
- `POST /v1/storage/upload` - Upload file
- `GET /v1/storage/{path}` - Get file

### System
- `POST /v1/system/initialize-schemas` - Initialize database

### Generic CRUD (works for all tables)
- `GET /v1/{table}` - List records
- `POST /v1/{table}` - Create record
- `GET /v1/{table}/{id}` - Get record
- `PUT /v1/{table}/{id}` - Update record
- `DELETE /v1/{table}/{id}` - Delete record

### Database Tables (23 total)
api_costs, api_usage_log, care_relationships, caretaker_notes, food_entries, food_items, health_assessments, images, invitation_codes, meal_summaries, models, participant_comments, participant_permissions, pending_analyses, permission_requests, prompts, receipt_items, receipts, user_goals, user_notifications, users, workout_exercises, workouts

## 🔧 Configuration

### Environment Variables

**Required:**
- `IBEX_API_KEY` - Ibex Database API key
- `OPENAI_API_KEY` - OpenAI API key

**Optional:**
- `IBEX_API_URL` - Ibex Database URL (default: https://smartlink.ajna.cloud/ibexdb)
- `AWS_REGION` - AWS region (default: us-east-1)
- `VITE_API_URL` - Frontend API URL (default: http://localhost:8000)
- `VITE_TENANT_ID` - Tenant ID (default: test)

### Multi-Tenant Configuration

Edit `backend/tenants.json` to configure tenants:

```json
{
  "tenants": {
    "demo": {
      "tenant_id": "demo-tenant",
      "namespace": "demo",
      "settings": {
        "max_api_calls_per_day": 100,
        "storage_quota_mb": 100
      }
    }
  }
}
```

## 🧪 Testing

```bash
# Run backend tests
cd backend
python -m pytest

# Run frontend tests
cd ui
npm test

# Run integration tests
./scripts/run-tests.sh
```

## 📦 Deployment

### Backend (AWS Lambda)

```bash
cd backend

# Build production image
docker build -f Dockerfile -t food-app-backend .

# Push to ECR
docker tag food-app-backend:latest {account}.dkr.ecr.{region}.amazonaws.com/food-app-backend:latest
docker push {account}.dkr.ecr.{region}.amazonaws.com/food-app-backend:latest

# Deploy with AWS CLI or Terraform
```

### Frontend (CloudFront + S3)

```bash
cd ui

# Build production bundle
npm run build

# Deploy to S3
aws s3 sync dist/ s3://your-bucket-name/

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

## 🐛 Troubleshooting

### Frontend Errors

**"supabase is not defined"**
- This has been fixed. All Supabase references have been replaced with `backendApi`
- If you see this, restart the frontend: `docker compose restart frontend`

**Port conflicts**
- Frontend uses port 5173, backend uses port 8000
- Check if ports are in use: `lsof -i :5173` or `lsof -i :8000`

### Backend Errors

**"IBEX_API_KEY not found"**
- Make sure `.env` file exists and contains `IBEX_API_KEY`
- Restart containers: `docker compose restart backend`

**Database connection errors**
- Check `IBEX_API_URL` is correct
- Verify API key is valid

## 📚 Additional Documentation

- [API Testing Guide](docs/API-TESTING-GUIDE.md)
- [Frontend Integration](docs/FRONTEND-INTEGRATION.md)
- [Testing Guide](docs/TESTING.md)
- [Original README](docs/README.md)

## 🔐 Security Notes

### ⚠️ IMPORTANT
- Never commit `.env` file to git
- The `.env.example` file should NOT contain real API keys
- Rotate API keys if exposed
- Use AWS Secrets Manager for production secrets

### Current Security Issues to Address:
1. Authentication bypass with hardcoded `test-user-id`
2. CORS wildcard `*` (should restrict to specific origins)
3. No input validation framework
4. Error messages expose internal details

## 🛣️ Roadmap

### Immediate (Week 1)
- [ ] Implement proper authentication (Cognito)
- [ ] Add input validation
- [ ] Fix error handling consistency
- [ ] Remove hardcoded user IDs

### Short-term (Month 1)
- [ ] Implement structured logging
- [ ] Move tenant config to database
- [ ] Add comprehensive testing
- [ ] Set up CI/CD pipeline

### Long-term (Quarter 1+)
- [ ] Implement Infrastructure as Code (CDK/Terraform)
- [ ] Add monitoring and alerting
- [ ] Performance optimization
- [ ] Microservices refactoring

## 📄 License

[Add your license here]

## 👥 Contributors

[Add contributors here]

## 📧 Support

For issues and questions:
- Create an issue in the repository
- Contact: [your-email]

---

**Last Updated:** January 26, 2026
**Version:** 1.0.0 (Post-Supabase removal)
**Repository:** https://github.com/ajnacloud-dev/food-sense-ai-tracker-3b84f458
