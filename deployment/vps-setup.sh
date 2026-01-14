#!/bin/bash

# ===========================================
# VPS Setup Script for Angel Baby Dresses
# Run this script on your VPS as root
# ===========================================

set -e

echo "=========================================="
echo "Setting up VPS for Angel Baby Dresses"
echo "=========================================="

# Update system
echo "Updating system packages..."
apt update && apt upgrade -y

# Install essential packages
echo "Installing essential packages..."
apt install -y curl wget git nginx certbot python3-certbot-nginx ufw

# Install Node.js 20.x LTS
echo "Installing Node.js 20.x..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Verify Node.js installation
node -v
npm -v

# Install PM2 globally
echo "Installing PM2..."
npm install -g pm2

# Install MongoDB 7.0
echo "Installing MongoDB..."
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
   gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor

echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | \
   tee /etc/apt/sources.list.d/mongodb-org-7.0.list

apt update
apt install -y mongodb-org

# Start and enable MongoDB
systemctl start mongod
systemctl enable mongod

echo "MongoDB status:"
systemctl status mongod --no-pager

# Configure firewall
echo "Configuring firewall..."
ufw allow ssh
ufw allow 'Nginx Full'
ufw --force enable

# Create application directory
echo "Creating application directory..."
mkdir -p /var/www/angel-baby-dresses
chown -R $USER:$USER /var/www/angel-baby-dresses

echo "=========================================="
echo "VPS Setup Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Clone your repository to /var/www/angel-baby-dresses"
echo "2. Configure your .env file"
echo "3. Run the deploy script"
echo ""
