# NutriWealth - Deployment Repository

This repository contains deployment configurations and orchestration files for the NutriWealth application.

## 📦 Repository Structure

This is a monorepo orchestrator that brings together the backend and frontend repositories for local development and deployment.

### Related Repositories

- **Backend**: [ajna_nutri_wealth_backend_v2](https://github.com/ajnacloud-ksj/ajna_nutri_wealth_backend_v2)
- **UI**: [ajna_nutri_wealth_ui_v2](https://github.com/ajnacloud-ksj/ajna_nutri_wealth_ui_v2)

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- Git

### 1. Clone All Repositories

```bash
# Run the setup script
./scripts/setup.sh

# Or manually clone:
git clone https://github.com/ajnacloud-ksj/ajna_nutri_wealth_backend_v2.git backend
git clone https://github.com/ajnacloud-ksj/ajna_nutri_wealth_ui_v2.git ui
```

### 2. Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Edit .env and add your API keys:
# IBEX_API_KEY=your-ibex-key
# OPENAI_API_KEY=your-openai-key
```

### 3. Start Services

```bash
# Start both backend and frontend
docker compose up --build

# Or use the helper script
./scripts/dev.sh
```

### 4. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000

## 📁 Directory Structure

```
food-sense-ai-tracker/
├── backend/                # Cloned from backend repo (git ignored)
├── ui/                     # Cloned from UI repo (git ignored)
├── docs/                   # Deployment documentation
├── scripts/                # Deployment and utility scripts
│   ├── setup.sh           # Clone repositories
│   ├── dev.sh             # Start development
│   ├── check_status.sh    # Check service health
│   └── start.sh           # Production start
├── docker-compose.yml      # Service orchestration
├── .env.example           # Environment template
└── README.md              # This file
```

## 🛠️ Scripts

### Setup Script

Clones the backend and UI repositories:

```bash
./scripts/setup.sh
```

### Development Script

Starts all services in development mode:

```bash
./scripts/dev.sh
```

### Status Check

Checks the health of running services:

```bash
./scripts/check_status.sh
```

## 🐳 Docker Compose

The `docker-compose.yml` file orchestrates both services:

- **Backend**: Python Lambda container on port 8000
- **Frontend**: React Vite dev server on port 5173

### Commands

```bash
# Start services
docker compose up

# Start in detached mode
docker compose up -d

# View logs
docker compose logs -f

# Stop services
docker compose down

# Rebuild containers
docker compose up --build
```

## 🔧 Configuration

### Environment Variables

**Required:**
- `IBEX_API_KEY` - Ibex Database API key
- `OPENAI_API_KEY` - OpenAI API key

**Optional:**
- `IBEX_API_URL` - Ibex Database URL (default: https://smartlink.ajna.cloud/ibexdb)
- `AWS_REGION` - AWS region (default: us-east-1)
- `VITE_API_URL` - Frontend API URL (default: http://localhost:8000)
- `VITE_TENANT_ID` - Tenant ID (default: demo)

## 📦 Deployment

### Local Development

Use Docker Compose (see above).

### AWS Lambda (Backend)

```bash
cd backend
docker build -f Dockerfile -t nutriwealth-backend .
# Push to ECR and deploy to Lambda
```

### CloudFront + S3 (Frontend)

```bash
cd ui
npm run build
aws s3 sync dist/ s3://your-bucket-name/
```

See individual repository READMEs for detailed deployment instructions:
- [Backend Deployment](https://github.com/ajnacloud-ksj/ajna_nutri_wealth_backend_v2#-deployment)
- [UI Deployment](https://github.com/ajnacloud-ksj/ajna_nutri_wealth_ui_v2#-deployment)

## 🧪 Testing

```bash
# Test backend
cd backend && python -m pytest

# Test frontend
cd ui && npm test

# Run integration tests
./scripts/run-tests.sh
```

## 🐛 Troubleshooting

### Repositories Not Found

If backend or ui folders are missing:

```bash
./scripts/setup.sh
```

### Port Conflicts

Check if ports 5173 or 8000 are in use:

```bash
lsof -i :5173
lsof -i :8000
```

### Docker Issues

```bash
# Clean up Docker
docker compose down -v
docker system prune -a

# Rebuild from scratch
./scripts/setup.sh
docker compose up --build
```

## 📚 Documentation

- [Backend Documentation](https://github.com/ajnacloud-ksj/ajna_nutri_wealth_backend_v2)
- [UI Documentation](https://github.com/ajnacloud-ksj/ajna_nutri_wealth_ui_v2)
- [Environment Setup](docs/ENVIRONMENT-SETUP.md)
- [API Testing Guide](docs/Food_App_Backend_Collection.yaml)

## 🔐 Security

- Never commit `.env` files
- Use AWS Secrets Manager for production
- Keep API keys secure
- Regularly update dependencies

## 📄 License

MIT

---

**Last Updated:** February 2, 2026
**Version:** 2.0.0
