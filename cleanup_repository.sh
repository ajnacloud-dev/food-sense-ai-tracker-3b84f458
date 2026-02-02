#!/bin/bash

# Repository Cleanup Script
# This script removes unnecessary files and organizes the repository

echo "🧹 Cleaning up repository..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Dry run mode by default
DRY_RUN=true
if [[ "$1" == "--execute" ]]; then
    DRY_RUN=false
    echo -e "${RED}⚠️  Running in EXECUTE mode - files will be deleted!${NC}"
else
    echo -e "${YELLOW}Running in DRY RUN mode - no files will be deleted${NC}"
    echo "To actually delete files, run: ./cleanup_repository.sh --execute"
fi
echo ""

# Function to remove files/directories
remove_item() {
    local item=$1
    if [ -e "$item" ]; then
        if [ "$DRY_RUN" = true ]; then
            echo -e "${YELLOW}[DRY RUN]${NC} Would remove: $item"
        else
            rm -rf "$item"
            echo -e "${RED}[REMOVED]${NC} $item"
        fi
    fi
}

# Function to move files
move_item() {
    local source=$1
    local dest=$2
    if [ -e "$source" ]; then
        if [ "$DRY_RUN" = true ]; then
            echo -e "${YELLOW}[DRY RUN]${NC} Would move: $source → $dest"
        else
            mkdir -p "$(dirname "$dest")"
            mv "$source" "$dest"
            echo -e "${GREEN}[MOVED]${NC} $source → $dest"
        fi
    fi
}

echo "📁 Removing backup directories..."
remove_item "backup_root_frontend"

echo ""
echo "🧪 Removing test files from root..."
remove_item "test_frontend_receipts.py"
remove_item "test_receipts.py"
remove_item "test_s3_receipts.py"

echo ""
echo "🖼️  Moving test images to backend/test_assets..."
move_item "Chicken-Biryani-Recipe.png" "backend/test_assets/Chicken-Biryani-Recipe.png"
move_item "test-biryani.jpg" "backend/test_assets/test-biryani.jpg"

echo ""
echo "📝 Consolidating documentation..."
# Move important docs to docs/ folder
move_item "FRONTEND_CLEANUP_PLAN.md" "docs/archive/FRONTEND_CLEANUP_PLAN.md"
move_item "PERFORMANCE_OPTIMIZATION.md" "docs/archive/PERFORMANCE_OPTIMIZATION.md"
move_item "PERFORMANCE_SUMMARY.md" "docs/archive/PERFORMANCE_SUMMARY.md"
move_item "QUICK_WINS_COMPLETED.md" "docs/archive/QUICK_WINS_COMPLETED.md"
move_item "RECEIPT_IMAGE_OPTIMIZATION.md" "docs/archive/RECEIPT_IMAGE_OPTIMIZATION.md"

echo ""
echo "🧪 Moving backend test files to test directory..."
move_item "backend/test_all_endpoints.py" "backend/tests/test_all_endpoints.py"
move_item "backend/test_all_endpoints.sh" "backend/tests/test_all_endpoints.sh"
move_item "backend/test_function_url.py" "backend/tests/test_function_url.py"
move_item "backend/test_improvements.py" "backend/tests/test_improvements.py"
move_item "backend/test_optimization.py" "backend/tests/test_optimization.py"
move_item "backend/test_performance.py" "backend/tests/test_performance.py"
move_item "backend/test_performance_quick.py" "backend/tests/test_performance_quick.py"
move_item "backend/test_quick.sh" "backend/tests/test_quick.sh"
move_item "backend/test_storage_fix.py" "backend/tests/test_storage_fix.py"
move_item "backend/test_warm_performance.py" "backend/tests/test_warm_performance.py"
move_item "backend/test_simple_write.py" "backend/tests/test_simple_write.py"
move_item "backend/test_new_table.py" "backend/tests/test_new_table.py"

echo ""
echo "🔧 Moving scripts..."
move_item "backend/migrate_to_optimized.py" "backend/scripts/migrate_to_optimized.py"
move_item "backend/check_ibex_schema.py" "backend/scripts/check_ibex_schema.py"
move_item "backend/run_tests.sh" "backend/scripts/run_tests.sh"
move_item "backend/cleanup.sh" "backend/scripts/cleanup.sh"
move_item "backend/test_queue_with_image.sh" "backend/scripts/test_queue_with_image.sh"
move_item "check_status.sh" "scripts/check_status.sh"
move_item "start.sh" "scripts/start.sh"

echo ""
echo "📚 Organizing documentation..."
# Keep important deployment docs in backend
# Move less critical docs to docs/backend
move_item "backend/MODERNIZATION_COMPLETE.md" "docs/backend/MODERNIZATION_COMPLETE.md"
move_item "backend/ASYNC_IMPLEMENTATION_STATUS.md" "docs/backend/ASYNC_IMPLEMENTATION_STATUS.md"

echo ""
echo "🗑️  Removing temporary files..."
remove_item "backend/server.log"
remove_item "payload_test.json"

echo ""
echo "📦 Cleaning up old frontend files (already moved to ui/)..."
# These are already deleted in git status, just confirming removal
remove_item "components.json"
remove_item "eslint.config.js"
remove_item "index.html"
remove_item "package-lock.json"
remove_item "postcss.config.js"
remove_item "tailwind.config.ts"
remove_item "tsconfig.app.json"
remove_item "tsconfig.json"
remove_item "tsconfig.node.json"
remove_item "vite.config.ts"
remove_item "public/"
remove_item "src/"

echo ""
echo "📋 Summary of repository structure:"
echo ""
echo "✅ Production Code:"
echo "   backend/src/        - Backend Lambda code"
echo "   ui/src/            - Frontend React code"
echo ""
echo "📚 Documentation:"
echo "   backend/           - Deployment guides (LAMBDA_DEPLOYMENT_GUIDE.md, etc.)"
echo "   docs/              - General documentation"
echo "   docs/archive/      - Historical docs"
echo "   docs/backend/      - Backend-specific docs"
echo ""
echo "🧪 Tests:"
echo "   backend/tests/     - Backend test files"
echo "   ui/tests/         - Frontend tests"
echo ""
echo "🔧 Scripts:"
echo "   backend/scripts/   - Backend utilities"
echo "   scripts/          - General scripts"
echo ""
echo "🚀 Deployment:"
echo "   .github/workflows/ - GitHub Actions"
echo "   backend/aws/      - AWS setup scripts"
echo ""

if [ "$DRY_RUN" = true ]; then
    echo -e "${YELLOW}This was a DRY RUN - no files were actually deleted${NC}"
    echo "To execute cleanup, run: ./cleanup_repository.sh --execute"
else
    echo -e "${GREEN}✅ Cleanup complete!${NC}"
fi

echo ""
echo "📝 Next steps:"
echo "1. Review changes with: git status"
echo "2. Commit cleanup: git add -A && git commit -m 'chore: clean up repository structure'"
echo "3. Update any import paths if needed"