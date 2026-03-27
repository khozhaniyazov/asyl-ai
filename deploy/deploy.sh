#!/bin/bash
set -e

# Sandar - Production Deployment Script
# Usage: ./deploy.sh [domain]
# Example: ./deploy.sh app.sandar.kz

DOMAIN=${1:-"app.sandar.kz"}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "=== Sandar Production Deployment ==="
echo "Domain: $DOMAIN"
echo "Project: $PROJECT_DIR"
echo ""

# Check prerequisites
command -v docker >/dev/null 2>&1 || { echo "Docker is required. Install: https://docs.docker.com/engine/install/"; exit 1; }
command -v docker compose >/dev/null 2>&1 || { echo "Docker Compose v2 is required."; exit 1; }

# Check .env file
if [ ! -f "$PROJECT_DIR/.env.production" ]; then
    echo "ERROR: .env.production not found. Copy .env.production.example and fill in values."
    exit 1
fi

# Load env
export $(grep -v '^#' "$PROJECT_DIR/.env.production" | xargs)
export DOMAIN=$DOMAIN

echo "1. Building containers..."
cd "$PROJECT_DIR"
docker compose -f deploy/docker-compose.prod.yml build

echo "2. Starting database and storage..."
docker compose -f deploy/docker-compose.prod.yml up -d db minio createbuckets
sleep 5

echo "3. Running database migrations..."
docker compose -f deploy/docker-compose.prod.yml run --rm backend alembic upgrade head

echo "4. Starting all services..."
docker compose -f deploy/docker-compose.prod.yml up -d

echo "5. Obtaining SSL certificate..."
docker compose -f deploy/docker-compose.prod.yml run --rm certbot certonly \
    --webroot --webroot-path=/var/www/certbot \
    --email admin@$DOMAIN --agree-tos --no-eff-email \
    -d $DOMAIN || echo "SSL cert already exists or certbot failed (ok for first run)"

echo "6. Reloading nginx with SSL..."
docker compose -f deploy/docker-compose.prod.yml exec nginx nginx -s reload || true

echo ""
echo "=== Deployment Complete ==="
echo "App: https://$DOMAIN"
echo "API Docs: https://$DOMAIN/api/v1/docs"
echo ""
echo "Useful commands:"
echo "  Logs:    docker compose -f deploy/docker-compose.prod.yml logs -f"
echo "  Stop:    docker compose -f deploy/docker-compose.prod.yml down"
echo "  Restart: docker compose -f deploy/docker-compose.prod.yml restart"
