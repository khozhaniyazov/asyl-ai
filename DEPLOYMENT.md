# Sandar - DigitalOcean Deployment Guide

## Prerequisites

1. **DigitalOcean Droplet** ($12/month recommended)
   - Ubuntu 22.04 LTS
   - 1 vCPU, 2GB RAM, 50GB SSD
   - Frankfurt datacenter (closest to Kazakhstan)
   - Note: 1GB RAM will work for initial testing but 2GB is recommended for production with 50+ users

2. **Domain Name** (e.g., sandar.kz)
   - Point A record to your droplet IP

3. **SSH Access** to your droplet

## Step 1: Initial Server Setup

SSH into your droplet:
```bash
ssh root@YOUR_DROPLET_IP
```

Update system and install Docker:
```bash
apt update && apt upgrade -y
apt install -y docker.io docker-compose git curl
systemctl enable docker
systemctl start docker
```

## Step 2: Clone Repository

```bash
cd /opt
git clone https://github.com/khozhaniyazov/sandar.git
cd sandar
```

## Step 3: Configure Environment

Create `.env` file:
```bash
nano .env
```

Add the following (replace with your values):
```env
# Database
POSTGRES_USER=sandar_user
POSTGRES_PASSWORD=YOUR_SECURE_PASSWORD_HERE
POSTGRES_DB=sandar_db

# Backend
SECRET_KEY=YOUR_SECRET_KEY_HERE
FRONTEND_URL=https://yourdomain.com

# Frontend
VITE_API_URL=https://yourdomain.com/api/v1
```

Generate a secure SECRET_KEY:
```bash
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

## Step 4: Deploy Application

Build and start services:
```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

Check logs:
```bash
docker-compose -f docker-compose.prod.yml logs -f
```

## Step 5: Install Caddy (Auto HTTPS)

Install Caddy:
```bash
apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
apt update
apt install caddy
```

Configure Caddy:
```bash
nano /etc/caddy/Caddyfile
```

Add:
```
yourdomain.com {
    reverse_proxy localhost:80
}
```

Restart Caddy:
```bash
systemctl restart caddy
```

## Step 6: Verify Deployment

Visit https://yourdomain.com - you should see the login page.

## Updating the Application

```bash
cd /opt/sandar
git pull
docker-compose -f docker-compose.prod.yml up -d --build
```

## Backup Database

```bash
docker exec sandar-db-1 pg_dump -U sandar_user sandar_db > backup_$(date +%Y%m%d).sql
```

## Troubleshooting

View logs:
```bash
docker-compose -f docker-compose.prod.yml logs backend
docker-compose -f docker-compose.prod.yml logs frontend
```

Restart services:
```bash
docker-compose -f docker-compose.prod.yml restart
```

Check container status:
```bash
docker ps
```
