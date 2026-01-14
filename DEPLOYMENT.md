# Deployment Guide: Angel Baby Dresses

Complete guide for deploying Angel Baby Dresses with:
- **Frontend**: Firebase Hosting (with Cloudflare DNS)
- **Backend + Database**: VPS with Docker (automated CI/CD)
- **Domain**: angelbabydresses.com

## Architecture Overview

```
                      Cloudflare DNS
                           |
              +------------+------------+
              |                         |
    angelbabydresses.com      api.angelbabydresses.com
              |                         |
      Firebase Hosting              Your VPS
      (React Frontend)         +---------------+
                               |    Nginx      |
                               |    (SSL)      |
                               +-------+-------+
                                       |
                               +-------+-------+
                               |    Docker     |
                               | +-----------+ |
                               | |  Backend  | |
                               | |  (Node)   | |
                               | +-----------+ |
                               | +-----------+ |
                               | |  MongoDB  | |
                               | +-----------+ |
                               +---------------+
```

---

## Quick Start (If VPS is already set up)

```bash
# SSH into VPS
ssh deploy@YOUR_VPS_IP

# Go to project directory
cd /var/www/angel-baby-dresses

# Deploy latest changes
./deployment/deploy.sh
```

---

## Part 1: VPS Initial Setup

### 1.1 Prerequisites

- Ubuntu 22.04 LTS VPS
- Root access via SSH
- Domain pointed to VPS (via Cloudflare)

### 1.2 Automated Setup

SSH into your VPS and run:

```bash
# Clone repository
git clone https://github.com/YOUR_USERNAME/AngelBabyDresses.git /var/www/angel-baby-dresses
cd /var/www/angel-baby-dresses

# Make setup script executable
chmod +x deployment/vps-setup-full.sh

# Run full setup (as root)
sudo ./deployment/vps-setup-full.sh
```

This script will automatically:
- Update system packages
- Install Docker and Docker Compose
- Install and configure Nginx
- Configure UFW firewall
- Setup Fail2Ban for security
- Create deployment user
- Configure log rotation
- Create helper scripts

### 1.3 Post-Setup Steps

After running the setup script:

#### A. Add Your SSH Key (for CI/CD)

```bash
# On your LOCAL machine, generate a deployment key
ssh-keygen -t ed25519 -C "deploy@angelbabydresses" -f ~/.ssh/angelbaby_deploy

# Copy public key to VPS
ssh-copy-id -i ~/.ssh/angelbaby_deploy.pub deploy@YOUR_VPS_IP

# Test connection
ssh -i ~/.ssh/angelbaby_deploy deploy@YOUR_VPS_IP
```

#### B. Create Production Environment File

```bash
# On VPS
cd /var/www/angel-baby-dresses
cp .env.production.example .env.production
nano .env.production
```

Fill in all required values (see Environment Variables section below).

#### C. Setup Cloudflare Origin Certificate

1. Go to **Cloudflare Dashboard** > **SSL/TLS** > **Origin Server**
2. Click **Create Certificate**
3. Select:
   - Generate private key and CSR with Cloudflare
   - Hostnames: `*.angelbabydresses.com`, `angelbabydresses.com`
   - Certificate validity: 15 years
4. Click **Create**
5. Copy the certificate and save to VPS:

```bash
# Save certificate
sudo nano /etc/nginx/ssl/angel-baby-dresses/origin.pem
# Paste the certificate content

# Save private key
sudo nano /etc/nginx/ssl/angel-baby-dresses/origin-key.pem
# Paste the private key content

# Set permissions
sudo chmod 600 /etc/nginx/ssl/angel-baby-dresses/origin-key.pem

# Test and reload Nginx
sudo nginx -t && sudo systemctl reload nginx
```

---

## Part 2: Cloudflare DNS Configuration

### 2.1 Update Nameservers (if not done)

In Hostinger:
1. Go to **Domains** > **angelbabydresses.com** > **DNS / Nameservers**
2. Change to Cloudflare nameservers:
   ```
   ns1.cloudflare.com
   ns2.cloudflare.com
   ```

### 2.2 Configure DNS Records

In Cloudflare Dashboard > DNS:

| Type  | Name | Content              | Proxy Status |
|-------|------|----------------------|--------------|
| A     | api  | YOUR_VPS_IP          | Proxied (orange) |
| A     | @    | 151.101.1.195        | DNS only (grey)  |
| A     | @    | 151.101.65.195       | DNS only (grey)  |
| CNAME | www  | angelbabydresses.com | DNS only (grey)  |

**Note:** Firebase requires DNS-only mode (grey cloud) for custom domains.

### 2.3 SSL/TLS Settings

In Cloudflare > SSL/TLS:
- **Encryption mode**: Full (strict)
- **Always Use HTTPS**: On
- **Minimum TLS Version**: 1.2
- **Automatic HTTPS Rewrites**: On

---

## Part 3: Deploy Backend with Docker

### 3.1 Start the Application

```bash
cd /var/www/angel-baby-dresses

# Start all services
docker compose up -d

# Check status
docker compose ps

# View logs
docker compose logs -f
```

### 3.2 Verify Deployment

```bash
# Health check
curl http://localhost:5000/api/health

# Or from outside
curl https://api.angelbabydresses.com/api/health
```

### 3.3 Common Docker Commands

```bash
# View running containers
docker compose ps

# View logs
docker compose logs backend
docker compose logs mongodb

# Restart services
docker compose restart

# Stop all services
docker compose down

# Rebuild and restart
docker compose down
docker compose build --no-cache
docker compose up -d

# Enter container shell
docker compose exec backend sh
docker compose exec mongodb mongosh

# View resource usage
docker stats
```

---

## Part 4: Setup CI/CD with GitHub Actions

### 4.1 Add GitHub Secrets

Go to your GitHub repo > **Settings** > **Secrets and variables** > **Actions**

Add these secrets:

| Secret Name | Value |
|-------------|-------|
| `VPS_HOST` | Your VPS IP address |
| `VPS_USER` | `deploy` |
| `VPS_SSH_KEY` | Contents of `~/.ssh/angelbaby_deploy` (private key) |
| `API_URL` | `https://api.angelbabydresses.com` |
| `VITE_API_URL` | `https://api.angelbabydresses.com/api` |
| `FIREBASE_SERVICE_ACCOUNT` | Firebase service account JSON |

### 4.2 Get Firebase Service Account

1. Go to **Firebase Console** > **Project Settings** > **Service Accounts**
2. Click **Generate new private key**
3. Copy entire JSON content to `FIREBASE_SERVICE_ACCOUNT` secret

### 4.3 How CI/CD Works

**Backend (`.github/workflows/deploy.yml`):**
- Triggers on push to `main` when `server/**` files change
- SSHs into VPS and pulls latest code
- Rebuilds Docker containers
- Runs health check

**Frontend (`.github/workflows/deploy-frontend.yml`):**
- Triggers on push to `main` when `client/**` files change
- Builds the React app
- Deploys to Firebase Hosting

### 4.4 Manual Deployment Trigger

You can manually trigger deployment:
1. Go to **Actions** tab in GitHub
2. Select workflow
3. Click **Run workflow**

---

## Part 5: Firebase Frontend Setup

### 5.1 Initial Setup (if not done)

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Initialize (in project root)
firebase init hosting
```

### 5.2 Manual Deploy

```bash
cd /path/to/AngelBabyDresses

# Build frontend
cd client
npm run build

# Deploy
cd ..
firebase deploy --only hosting
```

### 5.3 Connect Custom Domain

1. **Firebase Console** > **Hosting** > **Add custom domain**
2. Enter `angelbabydresses.com`
3. Follow verification steps
4. DNS records are already configured in Part 2

---

## Part 6: Environment Variables

### Server Environment (`.env.production`)

```env
# Docker MongoDB
MONGO_ROOT_USER=admin
MONGO_ROOT_PASSWORD=<strong-password>
MONGO_APP_USER=angelbaby
MONGO_APP_PASSWORD=<strong-password>

# Application
NODE_ENV=production
PORT=5000
CLIENT_URL=https://angelbabydresses.com

# JWT (generate with: openssl rand -base64 64)
JWT_SECRET=<64-char-random-string>
JWT_EXPIRE=30d

# Cloudinary
CLOUDINARY_CLOUD_NAME=dcyhozh68
CLOUDINARY_API_KEY=<your-key>
CLOUDINARY_API_SECRET=<your-secret>

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=<email>
SMTP_PASS=<app-password>
FROM_EMAIL=noreply@angelbabydresses.com
FROM_NAME=Angel Baby Dresses

# Payment Gateways
JAZZCASH_MERCHANT_ID=<id>
JAZZCASH_PASSWORD=<password>
JAZZCASH_INTEGRITY_SALT=<salt>
JAZZCASH_RETURN_URL=https://angelbabydresses.com/payment/callback
JAZZCASH_API_URL=https://payments.jazzcash.com.pk/ApplicationAPI/API/Payment/DoTransaction

EASYPAISA_STORE_ID=<id>
EASYPAISA_HASH_KEY=<key>
EASYPAISA_API_URL=https://easypaisa.com.pk/api
```

### Client Environment (`client/.env.production`)

```env
VITE_API_URL=https://api.angelbabydresses.com/api
```

---

## Part 7: Multi-Project VPS Setup

This setup supports hosting multiple projects on the same VPS.

### Directory Structure

```
/var/www/
├── angel-baby-dresses/    # This project
│   ├── docker-compose.yml
│   ├── Dockerfile
│   └── ...
├── project-two/           # Future project
│   ├── docker-compose.yml
│   └── ...
└── project-three/         # Future project
    └── ...
```

### Adding Another Project

1. Create directory: `mkdir -p /var/www/new-project`
2. Create new Nginx config in `/etc/nginx/sites-available/`
3. Use different ports for Docker services
4. Create separate Docker network

Example for new project:
```yaml
# /var/www/new-project/docker-compose.yml
services:
  backend:
    ports:
      - "5001:5000"  # Different host port
    networks:
      - newproject_network

networks:
  newproject_network:
    name: newproject_network
```

---

## Part 8: Monitoring & Maintenance

### 8.1 Helper Commands (installed by setup script)

```bash
# Check status of all services
status-angelbaby

# Deploy latest changes
deploy-angelbaby
```

### 8.2 View Logs

```bash
# Docker logs
docker compose logs -f backend
docker compose logs -f mongodb

# Nginx logs
tail -f /var/log/nginx/angelbaby_access.log
tail -f /var/log/nginx/angelbaby_error.log
```

### 8.3 Database Backup

```bash
# Create backup
docker compose exec mongodb mongodump \
  --uri="mongodb://angelbaby:password@localhost:27017/angel-baby-dresses?authSource=angel-baby-dresses" \
  --out=/data/backup/$(date +%Y%m%d)

# Restore backup
docker compose exec mongodb mongorestore \
  --uri="mongodb://angelbaby:password@localhost:27017/angel-baby-dresses?authSource=angel-baby-dresses" \
  /data/backup/20240115
```

### 8.4 Automated Backup (Cron)

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * cd /var/www/angel-baby-dresses && docker compose exec -T mongodb mongodump --out=/data/backup/$(date +\%Y\%m\%d)
```

---

## Part 9: Troubleshooting

### Backend Issues

```bash
# Check if containers are running
docker compose ps

# View backend logs
docker compose logs backend

# Restart backend
docker compose restart backend

# Rebuild from scratch
docker compose down
docker compose build --no-cache backend
docker compose up -d
```

### MongoDB Issues

```bash
# Check MongoDB status
docker compose logs mongodb

# Connect to MongoDB shell
docker compose exec mongodb mongosh

# Test authentication
docker compose exec mongodb mongosh "mongodb://angelbaby:password@localhost:27017/angel-baby-dresses?authSource=angel-baby-dresses"
```

### Nginx Issues

```bash
# Test configuration
nginx -t

# View error log
tail -100 /var/log/nginx/angelbaby_error.log

# Reload configuration
systemctl reload nginx
```

### SSL/Certificate Issues

```bash
# Check certificate
openssl s_client -connect api.angelbabydresses.com:443 -servername api.angelbabydresses.com

# Verify Cloudflare Origin cert
openssl x509 -in /etc/nginx/ssl/angel-baby-dresses/origin.pem -text -noout
```

### CORS Errors

Ensure `CLIENT_URL` in `.env.production` matches your Firebase domain exactly:
```env
CLIENT_URL=https://angelbabydresses.com
```

### CI/CD Not Triggering

1. Check GitHub Actions tab for errors
2. Verify secrets are correctly set
3. Ensure branch name matches (`main` or `master`)
4. Check file paths in workflow triggers

---

## Part 10: Security Checklist

- [ ] Strong passwords for MongoDB
- [ ] JWT_SECRET is random 64+ characters
- [ ] Firewall configured (UFW)
- [ ] Fail2Ban active
- [ ] SSL/TLS enabled (Cloudflare Full Strict)
- [ ] CORS configured for your domain only
- [ ] Rate limiting enabled in Nginx
- [ ] No sensitive data in git repository
- [ ] Regular backups configured
- [ ] Automatic security updates enabled

---

## Quick Reference

| Service | URL |
|---------|-----|
| Frontend | https://angelbabydresses.com |
| API | https://api.angelbabydresses.com |
| Health Check | https://api.angelbabydresses.com/api/health |
| Firebase Console | https://console.firebase.google.com |
| Cloudflare Dashboard | https://dash.cloudflare.com |

| Command | Description |
|---------|-------------|
| `status-angelbaby` | Check all services status |
| `deploy-angelbaby` | Deploy latest changes |
| `docker compose logs -f` | View real-time logs |
| `docker compose restart` | Restart all services |
