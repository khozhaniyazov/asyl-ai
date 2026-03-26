#!/bin/bash
set -e

echo "🚀 Deploying Asyl AI to production..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Please create .env file with required variables."
    exit 1
fi

# Pull latest changes
echo "📥 Pulling latest code..."
git pull

# Build and start services
echo "🔨 Building and starting services..."
docker-compose -f docker-compose.prod.yml up -d --build

# Wait for services to be healthy
echo "⏳ Waiting for services to start..."
sleep 10

# Check service status
echo "✅ Checking service status..."
docker-compose -f docker-compose.prod.yml ps

echo "🎉 Deployment complete!"
echo "Visit your domain to verify the deployment."
