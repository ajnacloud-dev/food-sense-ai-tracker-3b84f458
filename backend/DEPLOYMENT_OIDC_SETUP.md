# GitHub Actions OIDC Setup (Deployment Only)

## 🎯 Purpose
Replace AWS access keys in GitHub with secure OIDC IAM role for **deployment only**.

## 📋 Your Architecture
```
Users → Frontend → API Gateway → Lambda (Cognito Auth) → Backend
         ↑
    (Cognito handles user auth)

GitHub Actions → AWS (OIDC for deployment only)
         ↑
    (No AWS keys needed!)
```

## 🚀 One-Time Setup (5 minutes)

### 1. Run Setup Script
```bash
cd backend/aws

# Edit script with your GitHub details
sed -i '' 's/your-github-org/YOUR_ACTUAL_ORG/g' github-oidc-setup.sh
sed -i '' 's/food-app/YOUR_REPO_NAME/g' github-oidc-setup.sh

# Run it
./github-oidc-setup.sh
```

### 2. Add ONE Secret to GitHub
```
Settings → Secrets → Actions → New repository secret

Name: AWS_ACCOUNT_ID
Value: 123456789012  (your AWS account ID)
```

That's it! No AWS access keys needed.

### 3. Deploy Using GitHub Actions
```bash
# Automatic deployment on push
git push origin main

# Or manual deployment
Go to Actions → Deploy Backend to Lambda (OIDC) → Run workflow
```

## 🔐 What This Gives You

### Security Benefits:
- ❌ **No AWS keys** stored in GitHub
- ✅ **Temporary credentials** (15 min expiry)
- ✅ **Automatic rotation**
- ✅ **Full audit trail** in CloudTrail
- ✅ **AWS best practice**

### Your Auth Setup Remains:
- **Cognito** continues handling user authentication
- **Frontend** users never touch Lambda directly
- **API Gateway** validates Cognito tokens
- **No changes** to your application auth

## 📊 Architecture Overview

```yaml
User Authentication (No Change):
  Frontend (React/Vue)
    → Cognito (User Pool)
    → API Gateway
    → Lambda (validates Cognito JWT)
    → Your Backend Logic

Deployment (Using OIDC):
  GitHub Actions
    → OIDC Provider (token.actions.githubusercontent.com)
    → AWS STS (AssumeRoleWithWebIdentity)
    → Temporary IAM Role
    → Deploy to Lambda/ECR/S3
```

## 🛠️ GitHub Workflow Using OIDC

```yaml
# .github/workflows/deploy-lambda-oidc.yml
jobs:
  deploy:
    permissions:
      id-token: write  # Required for OIDC
      contents: read

    steps:
      # No AWS keys needed! Uses OIDC instead
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::${{ secrets.AWS_ACCOUNT_ID }}:role/github-actions-nutriwealth
          aws-region: us-east-1

      # Now you have AWS credentials to deploy
      - name: Deploy to Lambda
        run: |
          aws lambda update-function-code ...
```

## ✅ Environment Variables for Lambda

Keep your existing Cognito setup:
```bash
# User Authentication (No Change)
AUTH_MODE=cognito
COGNITO_USER_POOL_ID=us-east-1_xxxxx
COGNITO_CLIENT_ID=xxxxx
COGNITO_REGION=us-east-1

# Your other configs
IBEX_API_URL=...
OPENAI_API_KEY=...
# etc
```

## 🚫 What You DON'T Need

Since you have Cognito for users:
- ❌ User OIDC providers (Google, Auth0)
- ❌ OIDC authentication in Lambda code
- ❌ Changes to your auth flow
- ❌ Changes to frontend auth

## 📝 Summary

- **Users**: Frontend → Cognito → Lambda ✅
- **Deployment**: GitHub → OIDC → AWS (no keys!) ✅
- **Change required**: Just run setup script + add AWS_ACCOUNT_ID to GitHub
- **Time to implement**: 5 minutes
- **Security improvement**: Huge!