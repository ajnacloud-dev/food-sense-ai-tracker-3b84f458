#!/bin/bash

# Food App Development Script
# Single script to manage local development environment

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

log_success() {
    echo -e "${GREEN}✓${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        log_error "Docker is not running. Please start Docker Desktop and try again."
        exit 1
    fi
}

# Setup environment
setup_env() {
    if [ ! -f .env ]; then
        log_warning ".env file not found"
        log_info "Creating .env from .env.example..."
        cp .env.example .env

        # Try to set the API key from Insomnia file
        if [ -f "food-sense-ai-tracker-3b84f458/Insomnia_2026-01-20.yaml" ]; then
            IBEX_KEY="McuMsuWDXo1g9zqLBBzVy3uXsIKDklGT8GbIhpyl"
            sed -i.bak "s/your-ibex-api-key-here/$IBEX_KEY/" .env && rm .env.bak
            log_success "Set IBEX_API_KEY from Insomnia config"
        fi

        echo ""
        log_warning "IMPORTANT: Edit .env and add your OPENAI_API_KEY"
        echo ""
        read -p "Press Enter to continue..."
    fi
}

# Start services
start_services() {
    log_info "Starting Food App services..."
    check_docker
    setup_env

    echo ""
    log_info "Building and starting containers..."
    docker-compose up --build -d

    echo ""
    log_success "Services started!"
    echo ""
    echo "╔════════════════════════════════════════════╗"
    echo "║  Food App - Development Environment        ║"
    echo "╠════════════════════════════════════════════╣"
    echo "║  Frontend:  http://localhost:5173          ║"
    echo "║  Backend:   http://localhost:8000          ║"
    echo "╚════════════════════════════════════════════╝"
    echo ""
    log_info "View logs: $0 logs"
    log_info "Stop:      $0 stop"
}

# Stop services
stop_services() {
    log_info "Stopping services..."
    docker-compose down
    log_success "Services stopped"
}

# Show logs
show_logs() {
    SERVICE=$1
    if [ -z "$SERVICE" ]; then
        log_info "Showing logs for all services (Ctrl+C to exit)"
        docker-compose logs -f
    else
        log_info "Showing logs for: $SERVICE"
        docker-compose logs -f "$SERVICE"
    fi
}

# Reset environment
reset_environment() {
    echo ""
    log_warning "This will:"
    echo "  - Stop all containers"
    echo "  - Remove all containers and volumes"
    echo "  - Clean Docker build cache"
    echo ""
    read -p "Are you sure? (y/N): " -n 1 -r
    echo

    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Cancelled"
        exit 0
    fi

    log_info "Stopping containers..."
    docker-compose down -v 2>/dev/null || true

    log_info "Removing volumes..."
    docker volume prune -f

    log_success "Environment reset complete!"
    log_info "Run '$0 start' to start fresh"
}

# Restart a service
restart_service() {
    SERVICE=$1
    if [ -z "$SERVICE" ]; then
        log_info "Restarting all services..."
        docker-compose restart
    else
        log_info "Restarting $SERVICE..."
        docker-compose restart "$SERVICE"
    fi
    log_success "Restart complete"
}

# Check service status
check_status() {
    log_info "Checking service status..."
    echo ""
    docker-compose ps
    echo ""

    # Check backend
    if curl -s http://localhost:8000/v1/auth/config > /dev/null 2>&1; then
        log_success "Backend is running (http://localhost:8000)"
    else
        log_error "Backend is not responding"
    fi

    # Check frontend
    if curl -s http://localhost:5173 > /dev/null 2>&1; then
        log_success "Frontend is running (http://localhost:5173)"
    else
        log_error "Frontend is not responding"
    fi
}

# Rebuild containers
rebuild() {
    log_info "Rebuilding containers from scratch..."
    docker-compose build --no-cache
    log_success "Rebuild complete"
    log_info "Run '$0 start' to start the services"
}

# Run backend command
backend_exec() {
    log_info "Executing command in backend container..."
    docker-compose exec backend "$@"
}

# Run frontend command
frontend_exec() {
    log_info "Executing command in frontend container..."
    docker-compose exec frontend "$@"
}

# Show help
show_help() {
    cat << EOF
Food App Development Script

Usage: $0 [command] [options]

Commands:
    start               Start all services (backend + frontend)
    stop                Stop all services
    restart [service]   Restart all services or specific service
    logs [service]      Show logs (all or specific service)
    status              Check service status
    reset               Reset environment (removes all data)
    rebuild             Rebuild containers from scratch
    backend [cmd]       Execute command in backend container
    frontend [cmd]      Execute command in frontend container
    help                Show this help message

Examples:
    $0 start                    # Start all services
    $0 logs                     # Show all logs
    $0 logs backend             # Show backend logs only
    $0 restart backend          # Restart backend service
    $0 backend env              # Show backend environment variables
    $0 frontend npm run build   # Build frontend

Services:
    backend   - Python Lambda container (port 8000)
    frontend  - React + Vite dev server (port 5173)

Endpoints:
    Frontend: http://localhost:5173
    Backend:  http://localhost:8000
EOF
}

# Main script logic
COMMAND=${1:-help}

case $COMMAND in
    start)
        start_services
        ;;
    stop)
        stop_services
        ;;
    restart)
        restart_service "$2"
        ;;
    logs)
        show_logs "$2"
        ;;
    status)
        check_status
        ;;
    reset)
        reset_environment
        ;;
    rebuild)
        rebuild
        ;;
    backend)
        shift
        backend_exec "$@"
        ;;
    frontend)
        shift
        frontend_exec "$@"
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        log_error "Unknown command: $COMMAND"
        echo ""
        show_help
        exit 1
        ;;
esac
