#!/bin/bash

# =============================================================================
# PRODUCTION SETUP SCRIPT FOR ANGEL BABY DRESSES BACKEND
# Run this script to ensure 100% stable backend uptime
# =============================================================================

set -e

echo "=========================================="
echo "  Production Setup for Angel Baby Dresses"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# -----------------------------------------------------------------------------
# STEP 1: Setup Swap Memory (CRITICAL for VPS stability)
# -----------------------------------------------------------------------------
echo -e "\n${YELLOW}[1/7] Setting up Swap Memory...${NC}"

if [ $(swapon --show | wc -l) -eq 0 ]; then
    echo "Creating 2GB swap file..."

    # Create swap file
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile

    # Make swap permanent
    if ! grep -q '/swapfile' /etc/fstab; then
        echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    fi

    # Optimize swap settings
    echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
    echo 'vm.vfs_cache_pressure=50' | sudo tee -a /etc/sysctl.conf
    sudo sysctl -p

    echo -e "${GREEN}✓ Swap memory configured (2GB)${NC}"
else
    echo -e "${GREEN}✓ Swap already exists${NC}"
fi

# Show current memory status
free -m

# -----------------------------------------------------------------------------
# STEP 2: Install/Update PM2 and log rotate module
# -----------------------------------------------------------------------------
echo -e "\n${YELLOW}[2/7] Setting up PM2...${NC}"

# Install PM2 globally if not present
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
fi

# Install PM2 log rotate module
pm2 install pm2-logrotate

# Configure log rotation
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true
pm2 set pm2-logrotate:dateFormat YYYY-MM-DD_HH-mm-ss
pm2 set pm2-logrotate:rotateModule true

echo -e "${GREEN}✓ PM2 and log rotation configured${NC}"

# -----------------------------------------------------------------------------
# STEP 3: Stop current PM2 process
# -----------------------------------------------------------------------------
echo -e "\n${YELLOW}[3/7] Stopping current backend...${NC}"

pm2 stop angel-backend 2>/dev/null || true
pm2 delete angel-backend 2>/dev/null || true

echo -e "${GREEN}✓ Old process stopped${NC}"

# -----------------------------------------------------------------------------
# STEP 4: Start with new ecosystem config
# -----------------------------------------------------------------------------
echo -e "\n${YELLOW}[4/7] Starting backend with production config...${NC}"

cd /root/AngelBabyDresses
pm2 start ecosystem.config.cjs

echo -e "${GREEN}✓ Backend started in cluster mode${NC}"

# -----------------------------------------------------------------------------
# STEP 5: Setup PM2 startup script (auto-start on server reboot)
# -----------------------------------------------------------------------------
echo -e "\n${YELLOW}[5/7] Setting up auto-start on reboot...${NC}"

pm2 startup systemd -u root --hp /root
pm2 save

echo -e "${GREEN}✓ PM2 startup configured${NC}"

# -----------------------------------------------------------------------------
# STEP 6: Verify Nginx configuration
# -----------------------------------------------------------------------------
echo -e "\n${YELLOW}[6/7] Verifying Nginx configuration...${NC}"

sudo nginx -t
sudo systemctl reload nginx

echo -e "${GREEN}✓ Nginx configuration valid${NC}"

# -----------------------------------------------------------------------------
# STEP 7: Final status check
# -----------------------------------------------------------------------------
echo -e "\n${YELLOW}[7/7] Final verification...${NC}"

sleep 3

echo -e "\n${GREEN}=========================================="
echo "  PRODUCTION SETUP COMPLETE!"
echo "==========================================${NC}"

echo -e "\n${YELLOW}Current Status:${NC}"
pm2 status

echo -e "\n${YELLOW}Memory Status:${NC}"
free -m

echo -e "\n${YELLOW}Health Check:${NC}"
curl -s http://localhost:5000/api/health || echo "Waiting for server to start..."

echo -e "\n${GREEN}=========================================="
echo "  Your backend is now production-ready!"
echo "==========================================${NC}"

echo -e "\n${YELLOW}Useful Commands:${NC}"
echo "  pm2 logs angel-backend     - View logs"
echo "  pm2 monit                  - Real-time monitoring"
echo "  pm2 status                 - Check status"
echo "  pm2 restart angel-backend  - Restart backend"
echo "  pm2 reload angel-backend   - Zero-downtime reload"
