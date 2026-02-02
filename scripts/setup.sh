#!/bin/bash

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Repository URLs
BACKEND_REPO="https://github.com/ajnacloud-ksj/ajna_nutri_wealth_backend_v2.git"
UI_REPO="https://github.com/ajnacloud-ksj/ajna_nutri_wealth_ui_v2.git"

echo -e "${GREEN}NutriWealth Setup Script${NC}"
echo "=========================="
echo ""

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

cd "$PROJECT_ROOT"

# Clone backend if not exists
if [ -d "backend" ]; then
    echo -e "${YELLOW}Backend directory already exists. Pulling latest changes...${NC}"
    cd backend
    git pull origin main
    cd ..
else
    echo -e "${GREEN}Cloning backend repository...${NC}"
    git clone "$BACKEND_REPO" backend
fi

# Clone UI if not exists
if [ -d "ui" ]; then
    echo -e "${YELLOW}UI directory already exists. Pulling latest changes...${NC}"
    cd ui
    git pull origin main
    cd ..
else
    echo -e "${GREEN}Cloning UI repository...${NC}"
    git clone "$UI_REPO" ui
fi

# Check for .env file
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}No .env file found. Creating from template...${NC}"
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo -e "${RED}⚠️  Please edit .env and add your API keys!${NC}"
    else
        echo -e "${RED}Warning: .env.example not found${NC}"
    fi
fi

echo ""
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Edit .env and add your API keys"
echo "2. Run: docker compose up --build"
echo ""
