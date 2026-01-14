#!/bin/bash

#############################################
# Angel Baby Dresses - VPS Full Setup Script
# Designed for Ubuntu 22.04 LTS
# Supports multi-project VPS hosting
#############################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="angel-baby-dresses"
DOMAIN="angelbabydresses.com"
API_SUBDOMAIN="api.angelbabydresses.com"
DEPLOY_USER="deploy"
PROJECT_DIR="/var/www/${PROJECT_NAME}"
GITHUB_REPO="https://github.com/YOUR_USERNAME/AngelBabyDresses.git"

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}  Angel Baby Dresses - VPS Setup Script  ${NC}"
echo -e "${BLUE}=========================================${NC}"

# Function to print status
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    print_error "Please run as root (sudo ./vps-setup-full.sh)"
    exit 1
fi

#############################################
# 1. System Update and Basic Packages
#############################################
print_status "Updating system packages..."
apt-get update && apt-get upgrade -y

print_status "Installing essential packages..."
apt-get install -y \
    curl \
    wget \
    git \
    vim \
    htop \
    ufw \
    fail2ban \
    unzip \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release

#############################################
# 2. Create Deploy User
#############################################
print_status "Setting up deploy user..."
if ! id "$DEPLOY_USER" &>/dev/null; then
    useradd -m -s /bin/bash $DEPLOY_USER
    usermod -aG sudo $DEPLOY_USER
    print_status "Deploy user '$DEPLOY_USER' created"
else
    print_status "Deploy user '$DEPLOY_USER' already exists"
fi

# Setup SSH directory for deploy user
mkdir -p /home/$DEPLOY_USER/.ssh
touch /home/$DEPLOY_USER/.ssh/authorized_keys
chmod 700 /home/$DEPLOY_USER/.ssh
chmod 600 /home/$DEPLOY_USER/.ssh/authorized_keys
chown -R $DEPLOY_USER:$DEPLOY_USER /home/$DEPLOY_USER/.ssh

echo -e "${YELLOW}[ACTION REQUIRED]${NC} Add your SSH public key to /home/$DEPLOY_USER/.ssh/authorized_keys"

#############################################
# 3. Install Docker
#############################################
print_status "Installing Docker..."

# Remove old versions if any
apt-get remove -y docker docker-engine docker.io containerd runc 2>/dev/null || true

# Add Docker's official GPG key
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

# Set up repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Add deploy user to docker group
usermod -aG docker $DEPLOY_USER

# Start and enable Docker
systemctl start docker
systemctl enable docker

print_status "Docker installed successfully"
docker --version

#############################################
# 4. Install Nginx
#############################################
print_status "Installing Nginx..."
apt-get install -y nginx

# Create directories for multi-project setup
mkdir -p /etc/nginx/sites-available
mkdir -p /etc/nginx/sites-enabled
mkdir -p /etc/nginx/ssl/${PROJECT_NAME}
mkdir -p /var/www/certbot

# Stop default nginx for now
systemctl stop nginx

print_status "Nginx installed successfully"

#############################################
# 5. Configure Firewall (UFW)
#############################################
print_status "Configuring firewall..."

# Reset UFW
ufw --force reset

# Default policies
ufw default deny incoming
ufw default allow outgoing

# Allow SSH (important!)
ufw allow ssh
ufw allow 22/tcp

# Allow HTTP and HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Enable UFW
ufw --force enable

print_status "Firewall configured"
ufw status

#############################################
# 6. Configure Fail2Ban
#############################################
print_status "Configuring Fail2Ban..."

cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 1h
findtime = 10m
maxretry = 5
ignoreip = 127.0.0.1/8

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 24h

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /var/log/nginx/error.log

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
port = http,https
logpath = /var/log/nginx/error.log
EOF

systemctl restart fail2ban
systemctl enable fail2ban

print_status "Fail2Ban configured"

#############################################
# 7. Create Project Directory
#############################################
print_status "Setting up project directory..."

mkdir -p $PROJECT_DIR
chown -R $DEPLOY_USER:$DEPLOY_USER $PROJECT_DIR

# Create directory structure
mkdir -p /var/www/projects  # For future projects

print_status "Project directory created at $PROJECT_DIR"

#############################################
# 8. Setup Nginx Configuration
#############################################
print_status "Setting up Nginx configuration..."

# Backup default config
mv /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup 2>/dev/null || true

# Copy main nginx config
cat > /etc/nginx/nginx.conf << 'NGINX_MAIN'
user www-data;
worker_processes auto;
pid /run/nginx.pid;
include /etc/nginx/modules-enabled/*.conf;

events {
    worker_connections 1024;
    multi_accept on;
    use epoll;
}

http {
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    server_tokens off;

    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log;

    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Cloudflare Real IP
    set_real_ip_from 173.245.48.0/20;
    set_real_ip_from 103.21.244.0/22;
    set_real_ip_from 103.22.200.0/22;
    set_real_ip_from 103.31.4.0/22;
    set_real_ip_from 141.101.64.0/18;
    set_real_ip_from 108.162.192.0/18;
    set_real_ip_from 190.93.240.0/20;
    set_real_ip_from 188.114.96.0/20;
    set_real_ip_from 197.234.240.0/22;
    set_real_ip_from 198.41.128.0/17;
    set_real_ip_from 162.158.0.0/15;
    set_real_ip_from 104.16.0.0/13;
    set_real_ip_from 104.24.0.0/14;
    set_real_ip_from 172.64.0.0/13;
    set_real_ip_from 131.0.72.0/22;
    set_real_ip_from 2400:cb00::/32;
    set_real_ip_from 2606:4700::/32;
    set_real_ip_from 2803:f800::/32;
    set_real_ip_from 2405:b500::/32;
    set_real_ip_from 2405:8100::/32;
    set_real_ip_from 2a06:98c0::/29;
    set_real_ip_from 2c0f:f248::/32;
    real_ip_header CF-Connecting-IP;

    include /etc/nginx/sites-enabled/*;
}
NGINX_MAIN

# Create site configuration
cat > /etc/nginx/sites-available/${PROJECT_NAME} << 'NGINX_SITE'
# Rate limiting
limit_req_zone $binary_remote_addr zone=angelbaby_api:10m rate=10r/s;

upstream angelbaby_backend {
    server 127.0.0.1:5000;
    keepalive 32;
}

# HTTP redirect
server {
    listen 80;
    listen [::]:80;
    server_name api.angelbabydresses.com;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

# HTTPS API Server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api.angelbabydresses.com;

    ssl_certificate /etc/nginx/ssl/angel-baby-dresses/origin.pem;
    ssl_certificate_key /etc/nginx/ssl/angel-baby-dresses/origin-key.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    access_log /var/log/nginx/angelbaby_access.log;
    error_log /var/log/nginx/angelbaby_error.log;

    client_max_body_size 10M;

    location /api {
        limit_req zone=angelbaby_api burst=20 nodelay;

        proxy_pass http://angelbaby_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    location /api/health {
        proxy_pass http://angelbaby_backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    location /uploads {
        proxy_pass http://angelbaby_backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        expires 7d;
        add_header Cache-Control "public, immutable";
    }

    location ~ /\. {
        deny all;
    }
}
NGINX_SITE

# Enable site
ln -sf /etc/nginx/sites-available/${PROJECT_NAME} /etc/nginx/sites-enabled/

# Remove default site
rm -f /etc/nginx/sites-enabled/default

print_status "Nginx configuration complete"

#############################################
# 9. Create SSL Certificate Placeholder
#############################################
print_status "Creating SSL certificate placeholder..."

# Create self-signed cert for initial testing
# You'll replace this with Cloudflare Origin Certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/${PROJECT_NAME}/origin-key.pem \
    -out /etc/nginx/ssl/${PROJECT_NAME}/origin.pem \
    -subj "/C=US/ST=State/L=City/O=Organization/CN=${API_SUBDOMAIN}"

print_warning "Self-signed certificate created. Replace with Cloudflare Origin Certificate!"
echo -e "${YELLOW}[ACTION REQUIRED]${NC} Add Cloudflare Origin Certificate to:"
echo "  - /etc/nginx/ssl/${PROJECT_NAME}/origin.pem"
echo "  - /etc/nginx/ssl/${PROJECT_NAME}/origin-key.pem"

#############################################
# 10. Create Deployment Script
#############################################
print_status "Creating deployment helper scripts..."

cat > /usr/local/bin/deploy-angelbaby << 'DEPLOY_SCRIPT'
#!/bin/bash
set -e

PROJECT_DIR="/var/www/angel-baby-dresses"
cd $PROJECT_DIR

echo "Pulling latest changes..."
git pull origin main || git pull origin master

echo "Rebuilding containers..."
docker compose down
docker compose build
docker compose up -d

echo "Cleaning up..."
docker image prune -f

echo "Deployment complete!"
docker compose ps
DEPLOY_SCRIPT

chmod +x /usr/local/bin/deploy-angelbaby

# Create status check script
cat > /usr/local/bin/status-angelbaby << 'STATUS_SCRIPT'
#!/bin/bash
echo "=== Angel Baby Dresses Status ==="
echo ""
echo "Docker Containers:"
docker compose -f /var/www/angel-baby-dresses/docker-compose.yml ps
echo ""
echo "API Health Check:"
curl -s http://localhost:5000/api/health || echo "API not responding"
echo ""
echo "Nginx Status:"
systemctl status nginx --no-pager -l | head -5
echo ""
echo "Recent Logs:"
docker compose -f /var/www/angel-baby-dresses/docker-compose.yml logs --tail=20
STATUS_SCRIPT

chmod +x /usr/local/bin/status-angelbaby

#############################################
# 11. Setup Log Rotation
#############################################
print_status "Configuring log rotation..."

cat > /etc/logrotate.d/angelbaby << 'LOGROTATE'
/var/log/nginx/angelbaby_*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data adm
    sharedscripts
    postrotate
        [ -f /var/run/nginx.pid ] && kill -USR1 `cat /var/run/nginx.pid`
    endscript
}
LOGROTATE

#############################################
# 12. Setup Automatic Security Updates
#############################################
print_status "Configuring automatic security updates..."

apt-get install -y unattended-upgrades
dpkg-reconfigure -plow unattended-upgrades

#############################################
# 13. Final Steps
#############################################
print_status "Starting Nginx..."
nginx -t && systemctl start nginx && systemctl enable nginx

echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}  VPS Setup Complete!                    ${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo ""
echo "1. Clone your repository:"
echo "   su - $DEPLOY_USER"
echo "   cd $PROJECT_DIR"
echo "   git clone $GITHUB_REPO ."
echo ""
echo "2. Create production environment file:"
echo "   cp .env.example .env.production"
echo "   nano .env.production"
echo ""
echo "3. Add Cloudflare Origin Certificate:"
echo "   - Go to Cloudflare Dashboard > SSL/TLS > Origin Server"
echo "   - Create certificate for *.angelbabydresses.com and angelbabydresses.com"
echo "   - Save to /etc/nginx/ssl/${PROJECT_NAME}/origin.pem"
echo "   - Save key to /etc/nginx/ssl/${PROJECT_NAME}/origin-key.pem"
echo "   - Run: nginx -t && systemctl reload nginx"
echo ""
echo "4. Configure Cloudflare DNS:"
echo "   - A record: api -> Your VPS IP (Proxied)"
echo "   - A record: @ -> Firebase (or CNAME if available)"
echo ""
echo "5. Start the application:"
echo "   cd $PROJECT_DIR"
echo "   docker compose up -d"
echo ""
echo "6. Setup GitHub Actions secrets:"
echo "   - VPS_HOST: Your VPS IP"
echo "   - VPS_USER: $DEPLOY_USER"
echo "   - VPS_SSH_KEY: SSH private key"
echo "   - API_URL: https://api.angelbabydresses.com"
echo ""
echo -e "${BLUE}Helper Commands:${NC}"
echo "  deploy-angelbaby  - Deploy latest changes"
echo "  status-angelbaby  - Check status of all services"
echo ""
print_status "Setup complete!"
