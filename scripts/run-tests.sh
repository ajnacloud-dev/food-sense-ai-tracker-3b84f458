#!/bin/bash

# Food Sense AI Tracker - Test Runner
# Usage: ./run-tests.sh [environment] [tenant]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT=${1:-local}
TENANT=${2:-test}

# Set BASE_URL based on environment
case $ENVIRONMENT in
  local)
    BASE_URL="http://localhost:8000"
    ;;
  docker)
    BASE_URL="http://backend:8000"
    ;;
  prod)
    BASE_URL="https://api.foodsense.com"
    ;;
  *)
    echo -e "${RED}Unknown environment: $ENVIRONMENT${NC}"
    echo "Usage: $0 [local|docker|prod] [test|demo|acme_corp|health_co]"
    exit 1
    ;;
esac

echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}Food Sense AI Tracker - API Tests${NC}"
echo -e "${GREEN}================================${NC}"
echo -e "${YELLOW}Environment:${NC} $ENVIRONMENT ($BASE_URL)"
echo -e "${YELLOW}Tenant:${NC} $TENANT"
echo ""

# Check if Newman is installed
if ! command -v newman &> /dev/null; then
    echo -e "${YELLOW}Newman not found. Installing...${NC}"
    npm install -g newman newman-reporter-html
fi

# Check if backend is running (for local environment)
if [ "$ENVIRONMENT" == "local" ]; then
    if ! curl -s http://localhost:8000/health > /dev/null 2>&1; then
        echo -e "${YELLOW}Backend not running. Starting with Docker Compose...${NC}"
        docker-compose up -d
        echo "Waiting for services to start..."
        sleep 10
    fi
fi

# Run tests
echo -e "${GREEN}Running tests...${NC}"
newman run insomnia-collection.json \
  --env-var BASE_URL=$BASE_URL \
  --env-var TENANT_ID=$TENANT \
  --reporters cli,html \
  --reporter-html-export "test-report-${TENANT}-$(date +%Y%m%d-%H%M%S).html" \
  --color

# Check exit code
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
else
    echo -e "${RED}❌ Some tests failed. Check the report for details.${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}Test report saved to: test-report-${TENANT}-*.html${NC}"
echo -e "${YELLOW}To view: open test-report-${TENANT}-*.html${NC}"