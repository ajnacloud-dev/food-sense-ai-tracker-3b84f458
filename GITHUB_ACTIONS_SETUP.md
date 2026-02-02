# GitHub Actions Setup Checklist

This guide will help you set up automated deployments for NutriWealth backend and UI using GitHub Actions.

## 📋 Prerequisites Checklist

- [ ] AWS Account with appropriate permissions
- [ ] GitHub repositories created and code pushed
- [ ] AWS CLI installed and configured locally
- [ ] Basic understanding of AWS services (Lambda, S3, CloudFront)

## 🚀 Quick Setup (Step by Step)

### Phase 1: AWS Infrastructure Setup

#### 1. Setup GitHub OIDC Authentication (Do This First!)

This allows GitHub Actions to authenticate with AWS securely without storing long-lived credentials.

```bash
# Clone the ajna-github-workflows repository
cd /Users/parameshnalla/ajna
git clone https://github.com/ajnacloud-ksj/ajna-github-workflows.git

# Run the OIDC setup script
cd ajna-github-workflows
./setup_oidc.sh
```

**Follow the script prompts to:**
- Create OIDC provider in AWS IAM
- Create GitHub Actions IAM role
- Configure trust policy for your repositories

**Save the Role ARN** - you'll need it for GitHub Secrets:
```
arn:aws:iam::ACCOUNT_ID:role/GitHubActionsRole
```

#### 2. Create Backend Infrastructure

```bash
# Set your AWS account ID
export AWS_ACCOUNT_ID="123456789012"  # Replace with your account ID
export AWS_REGION="us-east-1"

# Create Lambda execution role
aws iam create-role \
  --role-name nutriwealth-lambda-execution-role \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "lambda.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  }'

# Attach basic execution policy
aws iam attach-role-policy \
  --role-name nutriwealth-lambda-execution-role \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

# Create ECR repository (optional - workflow will create if doesn't exist)
aws ecr create-repository \
  --repository-name nutriwealth-backend \
  --region $AWS_REGION

# Build and push initial image to ECR
cd /Users/parameshnalla/ajna/nutri_wealth/ajna_nutri_wealth_backend_v2
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com
docker build -t nutriwealth-backend .
docker tag nutriwealth-backend:latest ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/nutriwealth-backend:latest
docker push ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/nutriwealth-backend:latest

# Create Lambda function
aws lambda create-function \
  --function-name nutriwealth-backend-api \
  --package-type Image \
  --code ImageUri=${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/nutriwealth-backend:latest \
  --role arn:aws:iam::${AWS_ACCOUNT_ID}:role/nutriwealth-lambda-execution-role \
  --timeout 30 \
  --memory-size 512 \
  --region $AWS_REGION

# Create Lambda Function URL (optional - for direct HTTPS access)
FUNCTION_URL=$(aws lambda create-function-url-config \
  --function-name nutriwealth-backend-api \
  --auth-type NONE \
  --cors '{
    "AllowOrigins": ["*"],
    "AllowMethods": ["*"],
    "AllowHeaders": ["*"],
    "MaxAge": 86400
  }' \
  --region $AWS_REGION \
  --query 'FunctionUrl' --output text)

echo "Lambda Function URL: $FUNCTION_URL"

# Add public invoke permission (if using Function URL)
aws lambda add-permission \
  --function-name nutriwealth-backend-api \
  --statement-id FunctionURLAllowPublicAccess \
  --action lambda:InvokeFunctionUrl \
  --principal "*" \
  --function-url-auth-type NONE \
  --region $AWS_REGION
```

#### 3. Create UI Infrastructure

```bash
# Create S3 bucket
aws s3 mb s3://nutriwealth-ui --region $AWS_REGION

# Block public access (CloudFront will access via OAI)
aws s3api put-public-access-block \
  --bucket nutriwealth-ui \
  --public-access-block-configuration \
    BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true

# Create CloudFront Origin Access Identity
OAI_ID=$(aws cloudfront create-cloud-front-origin-access-identity \
  --cloud-front-origin-access-identity-config \
    CallerReference="nutriwealth-ui-$(date +%s)",Comment="OAI for NutriWealth UI" \
  --query 'CloudFrontOriginAccessIdentity.Id' --output text)

echo "CloudFront OAI ID: $OAI_ID"

# Get OAI Canonical User ID for bucket policy
OAI_USER=$(aws cloudfront get-cloud-front-origin-access-identity \
  --id $OAI_ID \
  --query 'CloudFrontOriginAccessIdentity.S3CanonicalUserId' --output text)

# Update S3 bucket policy to allow CloudFront access
cat > /tmp/bucket-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowCloudFrontOAI",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::cloudfront:user/CloudFront Origin Access Identity $OAI_ID"
      },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::nutriwealth-ui/*"
    }
  ]
}
EOF

aws s3api put-bucket-policy --bucket nutriwealth-ui --policy file:///tmp/bucket-policy.json
```

**Note**: For CloudFront distribution creation, it's easier to use the AWS Console:
1. Go to CloudFront → Create Distribution
2. Select S3 bucket as origin
3. Use the OAI created above
4. Enable redirect HTTP to HTTPS
5. Set default root object to `index.html`
6. Create distribution and save the Distribution ID

#### 4. Update IAM Policies for GitHub Actions Role

Add these policies to the GitHub Actions role created in step 1:

**Backend Deployment Policy:**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "ecr:PutImage",
        "ecr:InitiateLayerUpload",
        "ecr:UploadLayerPart",
        "ecr:CompleteLayerUpload",
        "ecr:DescribeRepositories",
        "ecr:CreateRepository"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "lambda:UpdateFunctionCode",
        "lambda:GetFunction",
        "lambda:GetFunctionConfiguration"
      ],
      "Resource": "arn:aws:lambda:*:*:function:nutriwealth-backend-api"
    }
  ]
}
```

**UI Deployment Policy:**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::nutriwealth-ui",
        "arn:aws:s3:::nutriwealth-ui/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "cloudfront:CreateInvalidation",
        "cloudfront:GetInvalidation"
      ],
      "Resource": "arn:aws:cloudfront::*:distribution/*"
    }
  ]
}
```

Apply policies:

```bash
# Save policies to files
# backend-policy.json and ui-policy.json

# Attach to GitHub Actions role
aws iam put-role-policy \
  --role-name GitHubActionsRole \
  --policy-name NutriWealthBackendDeploy \
  --policy-document file://backend-policy.json

aws iam put-role-policy \
  --role-name GitHubActionsRole \
  --policy-name NutriWealthUIDeploy \
  --policy-document file://ui-policy.json
```

### Phase 2: GitHub Secrets Configuration

#### Backend Repository Secrets

Go to: https://github.com/ajnacloud-ksj/ajna_nutri_wealth_backend_v2/settings/secrets/actions

Add these secrets:

1. **AWS_ROLE_ARN**
   - Value: `arn:aws:iam::ACCOUNT_ID:role/GitHubActionsRole`
   - (Replace ACCOUNT_ID with your AWS account ID)

#### UI Repository Secrets

Go to: https://github.com/ajnacloud-ksj/ajna_nutri_wealth_ui_v2/settings/secrets/actions

Add these secrets:

1. **AWS_ROLE_ARN**
   - Value: `arn:aws:iam::ACCOUNT_ID:role/GitHubActionsRole`

2. **CLOUDFRONT_DISTRIBUTION_ID**
   - Value: Your CloudFront distribution ID (e.g., `E1234ABCDEFG`)
   - Find in: AWS Console → CloudFront → Distributions

3. **VITE_API_URL**
   - Value: Your Lambda Function URL or API Gateway URL
   - Example: `https://abc123.lambda-url.us-east-1.on.aws`

### Phase 3: Configure SPA Routing for CloudFront

For React Router to work correctly, add error page handling:

1. Go to AWS Console → CloudFront → Your Distribution → Error Pages
2. Create Custom Error Response for **403**:
   - HTTP Error Code: `403`
   - Customize Error Response: `Yes`
   - Response Page Path: `/index.html`
   - HTTP Response Code: `200`
3. Repeat for **404** error code

## ✅ Testing the Setup

### Test Backend Deployment

```bash
# Make a small change to backend
cd /Users/parameshnalla/ajna/nutri_wealth/ajna_nutri_wealth_backend_v2
echo "# Test deployment" >> README.md
git add README.md
git commit -m "Test backend deployment"
git push origin main

# Monitor deployment in GitHub Actions
# https://github.com/ajnacloud-ksj/ajna_nutri_wealth_backend_v2/actions
```

### Test UI Deployment

```bash
# Make a small change to UI
cd /Users/parameshnalla/ajna/nutri_wealth/ajna_nutri_wealth_ui_v2
echo "# Test deployment" >> README.md
git add README.md
git commit -m "Test UI deployment"
git push origin main

# Monitor deployment in GitHub Actions
# https://github.com/ajnacloud-ksj/ajna_nutri_wealth_ui_v2/actions
```

### Verify Deployments

**Backend:**
```bash
# Test Lambda function URL
curl https://YOUR_FUNCTION_URL.lambda-url.us-east-1.on.aws/v1/auth/config
```

**UI:**
```bash
# Test CloudFront URL
curl https://YOUR_DISTRIBUTION.cloudfront.net

# Or open in browser
open https://YOUR_DISTRIBUTION.cloudfront.net
```

## 📚 Documentation References

- **Backend Deployment**: See `ajna_nutri_wealth_backend_v2/DEPLOYMENT.md`
- **UI Deployment**: See `ajna_nutri_wealth_ui_v2/DEPLOYMENT.md`
- **Reusable Workflows**: See `ajna-github-workflows/README.md`

## 🐛 Common Issues

### Issue: "Access Denied" during deployment

**Solution**: Check that the GitHub Actions role has the correct permissions attached.

```bash
# List attached policies
aws iam list-attached-role-policies --role-name GitHubActionsRole

# List inline policies
aws iam list-role-policies --role-name GitHubActionsRole
```

### Issue: Lambda update fails

**Solution**: Ensure Lambda function exists and GitHub Actions role has `lambda:UpdateFunctionCode` permission.

### Issue: CloudFront shows 403 errors on page refresh

**Solution**: Configure CloudFront error pages (see Phase 3 above).

### Issue: Environment variables not showing in UI

**Solution**: 
1. Verify `VITE_API_URL` secret is set in GitHub
2. Remember: Vite variables are injected at build time
3. Check browser console: `console.log(import.meta.env.VITE_API_URL)`

## 🎉 You're Done!

Once everything is set up:

1. Push to `main` branch = automatic deployment
2. Monitor deployments in GitHub Actions
3. Check AWS Console to verify resources
4. Test your application endpoints

## 📞 Need Help?

- Review the detailed DEPLOYMENT.md files in each repository
- Check GitHub Actions logs for error messages
- Review AWS CloudWatch logs for Lambda execution logs
- Check AWS S3 and CloudFront access logs

---

**Setup Date**: February 2, 2026  
**Version**: 1.0.0
