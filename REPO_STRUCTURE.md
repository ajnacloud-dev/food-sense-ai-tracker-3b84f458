# Repository Structure

## 🗂️ Clean Repository Organization

After cleanup, the repository is now organized as follows:

```
food-app/
├── backend/                    # Lambda backend
│   ├── src/                   # Source code
│   │   ├── handlers/          # API handlers
│   │   ├── lib/              # Core libraries
│   │   ├── config/           # Configuration
│   │   ├── schemas/          # Database schemas
│   │   ├── prompts/          # AI prompts
│   │   └── routes/           # API routes
│   ├── tests/                # Test files
│   ├── scripts/              # Utility scripts
│   ├── test_assets/          # Test images/data
│   ├── aws/                  # AWS setup scripts
│   ├── .github/workflows/    # GitHub Actions
│   ├── Dockerfile            # Lambda container
│   └── *.md                  # Deployment guides
│
├── ui/                        # React frontend
│   ├── src/                  # Source code
│   ├── public/               # Static assets
│   └── tests/                # Frontend tests
│
├── docs/                      # Documentation
│   ├── archive/              # Historical docs
│   └── backend/              # Backend-specific docs
│
├── scripts/                   # General scripts
└── .github/workflows/         # CI/CD pipelines
```

## 📁 What Was Cleaned

### ✅ Removed
- `backup_root_frontend/` - Old backup directory
- Test files from root (`test_*.py`)
- Old frontend files (already in `ui/`)
- Temporary logs and cache files

### 📦 Organized
- Test files → `backend/tests/`
- Scripts → `backend/scripts/` and `scripts/`
- Test images → `backend/test_assets/`
- Historical docs → `docs/archive/`
- Backend docs → `docs/backend/`

## 🚀 Key Locations

### Production Code
- **Backend API**: `backend/src/`
- **Frontend**: `ui/src/`

### Deployment
- **Lambda Guides**: `backend/LAMBDA_DEPLOYMENT_GUIDE.md`
- **OIDC Setup**: `backend/DEPLOYMENT_OIDC_SETUP.md`
- **SQS Guide**: `backend/SQS_SETUP_GUIDE.md`
- **GitHub Actions**: `.github/workflows/`

### Testing
- **Backend Tests**: `backend/tests/`
- **Test Assets**: `backend/test_assets/`
- **Test Scripts**: `backend/scripts/`

### Configuration
- **Model Config**: `backend/MODEL_CONFIG_GUIDE.md`
- **Schemas**: `backend/src/schemas/`
- **Environment**: `.env.example`

## 🎯 Benefits of Cleanup

1. **Clear separation** between backend and frontend
2. **Organized test files** in dedicated directories
3. **Scripts grouped** by purpose
4. **Documentation archived** but accessible
5. **Cleaner root** directory
6. **Better discoverability** of important files

## 📝 Next Steps

1. Commit the cleanup:
```bash
git add -A
git commit -m "chore: organize repository structure

- Move test files to dedicated directories
- Archive historical documentation
- Organize scripts and assets
- Remove backup directories
- Clean root directory"
```

2. Deploy to Lambda using GitHub Actions:
```bash
git push origin main
```

3. Or deploy manually:
```bash
cd backend
./deploy.sh prod
```