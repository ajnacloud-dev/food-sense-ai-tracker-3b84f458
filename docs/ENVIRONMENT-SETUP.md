# Environment Configuration Guide

This guide explains how the NutriWealth app handles different environments (local development vs cloud deployment) seamlessly.

## Overview

The application uses a smart configuration system that:
- **Local Development**: Uses Vite proxy for API calls and local authentication
- **Cloud Deployment**: Uses Lambda Function URLs and AWS Cognito authentication

## Quick Start

### Local Development

```bash
# Start both frontend and backend
./start.sh

# Or start separately:
# Backend (port 8080)
cd backend
python3 src/main.py

# Frontend (port 8081)
cd ui
npm run dev
```

Access the app at: http://localhost:8081

### Production Build

```bash
cd ui
npm run build
# Deploy dist/ folder to your hosting service
```

## Configuration Files

### Frontend Configuration

#### `ui/vite.config.ts`
- Configures proxy for `/v1/*` API calls to `localhost:8080` in development
- Automatically handles CORS and API routing
- No need to configure API URLs in development

#### `ui/.env.development`
```env
# Development settings
VITE_AUTH_MODE=local
VITE_ENABLE_DEBUG=true
VITE_ENABLE_PWA=false
# API URL not needed - uses Vite proxy
```

#### `ui/.env.production`
```env
# Production settings
VITE_API_URL=https://your-lambda-url.amazonaws.com
VITE_AUTH_MODE=cognito
VITE_ENABLE_DEBUG=false
VITE_ENABLE_PWA=true
```

#### `ui/src/lib/api/client.ts`
```typescript
// Automatically uses relative URLs in dev (for proxy)
// and absolute URLs in production
const API_BASE_URL = import.meta.env.DEV
  ? '' // Empty = relative URLs → Vite proxy
  : import.meta.env.VITE_API_URL
```

### Backend Configuration

#### `backend/src/main.py`
- FastAPI server for local development
- Automatically loads `.env` file if present
- Handles CORS for all environments
- Wraps Lambda handler for local testing

#### `backend/.env` (create from .env.example)
```env
# Required
IBEX_API_KEY=your-key
OPENAI_API_KEY=your-key

# Optional (for production mode testing)
AUTH_MODE=cognito
COGNITO_USER_POOL_ID=your-pool-id
COGNITO_CLIENT_ID=your-client-id
```

## How It Works

### 1. API Routing

**Development Mode:**
```
Frontend (8081) → Vite Proxy → Backend (8080)
/v1/food_entries → http://localhost:8080/v1/food_entries
```

**Production Mode:**
```
Frontend → Lambda Function URL
/v1/food_entries → https://lambda-url.amazonaws.com/v1/food_entries
```

### 2. Authentication

**Local Mode (AUTH_MODE=local):**
- No Cognito required
- Mock users: `dev@local.com`, `test@local.com`
- Any password works
- User ID: `local-dev-user`

**Cognito Mode (AUTH_MODE=cognito):**
- Requires Cognito configuration
- Real user authentication
- JWT token validation
- User ID from Cognito claims

### 3. Environment Detection

The system automatically detects the environment:

```javascript
// Frontend
if (import.meta.env.DEV) {
  // Development mode
  // Uses Vite proxy, local auth
} else {
  // Production mode
  // Uses environment variables
}
```

```python
# Backend
if os.environ.get('AUTH_MODE') == 'cognito':
    # Production mode with Cognito
else:
    # Local development mode
```

## Deployment

### Local Development
1. No configuration needed
2. Run `./start.sh`
3. Everything works out of the box

### AWS Lambda Deployment
1. Set environment variables in Lambda:
   ```
   AUTH_MODE=cognito
   COGNITO_USER_POOL_ID=your-pool-id
   COGNITO_CLIENT_ID=your-client-id
   IBEX_API_KEY=your-key
   OPENAI_API_KEY=your-key
   ```

2. Build and deploy frontend:
   ```bash
   cd ui
   npm run build
   # Upload dist/ to S3/CloudFront
   ```

3. Update `ui/.env.production` with your Lambda URL

### Docker Deployment
```bash
# Both services with Docker Compose
docker compose up

# Access at http://localhost:8081
```

## Testing Different Modes

### Test Local Mode
```bash
# Default mode
./start.sh
```

### Test Cognito Mode Locally
```bash
# Set in backend/.env
AUTH_MODE=cognito
COGNITO_USER_POOL_ID=xxx
COGNITO_CLIENT_ID=xxx

# Start normally
./start.sh
```

## Troubleshooting

### API calls returning HTML instead of JSON
- Check if backend is running on port 8080
- Verify Vite proxy configuration
- Ensure `/v1/` prefix is used for API calls

### CORS errors
- Backend automatically handles CORS for known origins
- Check `backend/src/utils/http.py` for allowed origins
- In development, proxy handles CORS automatically

### Authentication not working
- Check `AUTH_MODE` environment variable
- Verify Cognito credentials in production
- Use `dev@local.com` for local testing

### Port conflicts
```bash
# Kill processes on specific ports
lsof -ti:8080 | xargs kill -9
lsof -ti:8081 | xargs kill -9
```

## Benefits of This Setup

1. **Zero Configuration Development**: Just run `./start.sh`
2. **Seamless Environment Switching**: Same code works locally and in cloud
3. **No CORS Issues**: Vite proxy handles it in dev, backend handles it in prod
4. **Flexible Authentication**: Easy switch between local and Cognito
5. **Type Safety**: TypeScript knows about environment variables
6. **Fast Development**: Hot reload for both frontend and backend
7. **Production Ready**: Optimized builds for deployment