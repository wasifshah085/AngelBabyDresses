#!/bin/bash

# ===========================================
# Deployment Script for Angel Baby Dresses
# Supports both Docker and PM2 deployment modes
# ===========================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

APP_DIR="/var/www/angel-baby-dresses"
DEPLOY_MODE="${DEPLOY_MODE:-docker}"  # docker or pm2

print_status() { echo -e "${GREEN}[INFO]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

cd $APP_DIR

echo ""
echo -e "${BLUE}==========================================${NC}"
echo -e "${BLUE}  Deploying Angel Baby Dresses           ${NC}"
echo -e "${BLUE}  Mode: ${DEPLOY_MODE}                   ${NC}"
echo -e "${BLUE}==========================================${NC}"
echo ""

# Pull latest changes from git
if [ -d ".git" ]; then
    print_status "Pulling latest changes from git..."
    git fetch origin
    git reset --hard origin/main 2>/dev/null || git reset --hard origin/master
fi

# Load environment variables
if [ -f ".env.production" ]; then
    print_status "Loading environment variables..."
    export $(cat .env.production | grep -v '^#' | xargs)
fi

if [ "$DEPLOY_MODE" = "docker" ]; then
    ###########################################
    # Docker Deployment
    ###########################################
    print_status "Deploying with Docker..."

    # Check if docker compose is available
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed!"
        exit 1
    fi

    # Stop existing containers gracefully
    print_status "Stopping existing containers..."
    docker compose down --remove-orphans 2>/dev/null || true

    # Build new images
    print_status "Building Docker images..."
    docker compose build --no-cache

    # Start containers
    print_status "Starting containers..."
    docker compose up -d

    # Wait for services to be ready
    print_status "Waiting for services to be healthy..."
    sleep 10

    # Health check
    print_status "Running health checks..."

    MAX_RETRIES=30
    RETRY_COUNT=0

    while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
        if curl -s http://localhost:5000/api/health > /dev/null 2>&1; then
            print_status "Backend is healthy!"
            break
        fi
        RETRY_COUNT=$((RETRY_COUNT + 1))
        echo "Waiting for backend... ($RETRY_COUNT/$MAX_RETRIES)"
        sleep 2
    done

    if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
        print_error "Backend failed to start!"
        docker compose logs backend
        exit 1
    fi

    # Cleanup old images
    print_status "Cleaning up old Docker images..."
    docker image prune -f

    # Show status
    echo ""
    print_status "Container Status:"
    docker compose ps

else
    ###########################################
    # PM2 Deployment (Legacy)
    ###########################################
    print_status "Deploying with PM2..."

    # Install server dependencies
    print_status "Installing server dependencies..."
    cd server
    npm ci --only=production

    # Restart application with PM2
    print_status "Restarting application..."
    pm2 delete angel-baby-api 2>/dev/null || true
    pm2 start server.js --name "angel-baby-api" --env production

    # Save PM2 process list
    pm2 save

    # Show status
    echo ""
    print_status "PM2 Status:"
    pm2 status
fi

echo ""
echo -e "${GREEN}==========================================${NC}"
echo -e "${GREEN}  Deployment Complete!                    ${NC}"
echo -e "${GREEN}==========================================${NC}"
echo ""
echo "API URL: https://api.angelbabydresses.com"
echo ""
