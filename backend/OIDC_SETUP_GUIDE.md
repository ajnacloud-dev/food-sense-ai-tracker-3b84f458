# OpenID Connect (OIDC) Setup Guide

## 🎯 Two Ways to Use OIDC

### 1. **GitHub Actions → AWS (No AWS Keys!)**
### 2. **User Authentication (Google, Auth0, etc.)**

---

## 1️⃣ **GitHub Actions OIDC → AWS**

This replaces AWS access keys with temporary IAM role credentials - much more secure!

### Setup Steps:

```bash
# 1. Run the setup script
cd backend/aws
chmod +x github-oidc-setup.sh

# Edit the script first to set your GitHub org/repo
vim github-oidc-setup.sh
# Change: GITHUB_ORG="your-github-org"
# Change: GITHUB_REPO="food-app"

# Run it
./github-oidc-setup.sh
```

### 2. Add ONE secret to GitHub (instead of AWS keys):
```yaml
# Go to: Settings → Secrets → Actions
AWS_ACCOUNT_ID: 123456789012  # Your AWS account ID
```

### 3. Use the OIDC workflow:
```yaml
# .github/workflows/deploy-lambda-oidc.yml
- name: Configure AWS credentials via OIDC
  uses: aws-actions/configure-aws-credentials@v4
  with:
    role-to-assume: arn:aws:iam::${{ secrets.AWS_ACCOUNT_ID }}:role/github-actions-nutriwealth
    aws-region: us-east-1
```

### Benefits:
✅ **No AWS keys in GitHub**
✅ **Temporary credentials (15 min)**
✅ **Automatic rotation**
✅ **Better audit trail**
✅ **AWS best practice**

---

## 2️⃣ **User Authentication with OIDC**

Support login with Google, Auth0, Okta, Azure AD, or any OIDC provider.

### Option A: Google Sign-In

```bash
# 1. Set up Google OAuth 2.0
# Go to: https://console.cloud.google.com/apis/credentials
# Create OAuth 2.0 Client ID
# Add redirect URI: https://your-app.com/callback

# 2. Add to Lambda environment variables:
OIDC_PROVIDER=google
OIDC_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
OIDC_CLIENT_SECRET=your-client-secret  # Optional for public clients
```

### Option B: Auth0

```bash
# 1. Create Auth0 application
# Go to: https://manage.auth0.com
# Create Single Page Application

# 2. Add to Lambda environment variables:
OIDC_PROVIDER=auth0
AUTH0_DOMAIN=https://your-tenant.auth0.com
OIDC_CLIENT_ID=your-auth0-client-id
OIDC_CLIENT_SECRET=your-auth0-client-secret
```

### Option C: Custom OIDC Provider

```bash
# Add to Lambda environment variables:
OIDC_PROVIDER=custom
OIDC_ISSUER=https://your-provider.com
OIDC_CLIENT_ID=your-client-id
OIDC_JWKS_URI=https://your-provider.com/.well-known/jwks.json
OIDC_AUDIENCE=your-audience  # Optional
```

### Update auth_provider.py to use OIDC:

```python
# In src/lib/auth_provider.py
from lib.auth_oidc import verify_oidc_token

def authenticate(event):
    auth_mode = os.environ.get("AUTH_MODE", "cognito")

    if auth_mode == "oidc":
        # Use OIDC authentication
        is_valid, user_id, claims = verify_oidc_token(event)
        if is_valid:
            return {"user_id": user_id, "claims": claims}
    elif auth_mode == "cognito":
        # Existing Cognito logic
        ...
```

---

## 🔐 **Security Best Practices**

### For GitHub Actions OIDC:
1. **Restrict to specific branches**:
```json
{
  "Condition": {
    "StringLike": {
      "token.actions.githubusercontent.com:sub": "repo:org/repo:ref:refs/heads/main"
    }
  }
}
```

2. **Use environment protection rules** in GitHub

3. **Minimal IAM permissions** - only what's needed

### For User OIDC:
1. **Validate token issuer** - must match expected
2. **Check token audience** - must be your app
3. **Verify token expiry** - reject expired tokens
4. **Use HTTPS only** - never HTTP
5. **Validate redirect URIs** - prevent open redirects

---

## 📊 **Comparison: OIDC vs Traditional**

| Aspect | AWS Keys | OIDC (IAM Role) |
|--------|----------|-----------------|
| **Security** | Keys can leak | Temporary credentials |
| **Rotation** | Manual | Automatic |
| **Expiry** | Never | 15 minutes |
| **Audit** | Basic | Detailed |
| **Setup** | Quick | One-time setup |
| **Best Practice** | ❌ | ✅ |

---

## 🚀 **Quick Start Commands**

### Test GitHub OIDC:
```bash
# Trigger workflow manually
gh workflow run deploy-lambda-oidc.yml -f environment=dev
```

### Test User OIDC:
```bash
# Get Google ID token (for testing)
curl -X POST https://oauth2.googleapis.com/token \
  -d "code=AUTH_CODE" \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_SECRET" \
  -d "redirect_uri=YOUR_REDIRECT_URI" \
  -d "grant_type=authorization_code"

# Test with your API
curl -X POST https://your-api.com/v1/analyze \
  -H "Authorization: Bearer ID_TOKEN_HERE" \
  -d '{"description": "test"}'
```

---

## 🎯 **Which OIDC Should You Use?**

### Use GitHub Actions OIDC if:
- Deploying from GitHub Actions ✅
- Want to eliminate AWS keys ✅
- Need better security ✅

### Use User OIDC if:
- Want social login (Google, Facebook) ✅
- Have enterprise SSO (Okta, Azure AD) ✅
- Replacing Cognito ✅

### Use Both!
Many production apps use:
- **GitHub OIDC** for CI/CD deployment
- **Google/Auth0 OIDC** for user authentication

---

## 📝 **Environment Variables Summary**

### For GitHub Actions (add to GitHub Secrets):
```yaml
AWS_ACCOUNT_ID: 123456789012  # Only this! No AWS keys!
```

### For User Authentication (add to Lambda):
```bash
# Pick one provider:
OIDC_PROVIDER=google          # or auth0, okta, azure, custom
OIDC_CLIENT_ID=your-client-id
OIDC_CLIENT_SECRET=your-secret  # Optional
OIDC_ISSUER=https://accounts.google.com  # Provider-specific
OIDC_AUDIENCE=your-app-id     # Optional
```

---

## ✅ **You're Ready!**

With OIDC set up, you get:
- **No AWS keys in GitHub**
- **Social login for users**
- **Enterprise SSO support**
- **Better security**
- **AWS best practices**