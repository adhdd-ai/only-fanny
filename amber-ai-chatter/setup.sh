#!/bin/bash
set -e

echo "🚀 Setting up Amber AI..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ Create .env file first! Copy from .env.example"
    exit 1
fi

# Load environment
export $(cat .env | xargs)

# Start services
echo "📦 Starting services..."
docker-compose up -d

# Wait for database
echo "⏳ Waiting for database..."
sleep 30

# Run migrations
echo "🗄️ Setting up database..."
docker-compose exec -T postgres psql -U amber -d amber_platform < init-db.sql

echo ""
echo "✅ Amber AI is running!"
echo "🌐 Frontend: http://localhost:3000"
echo "🔌 API: http://localhost:3001"
echo ""
echo "To view logs: docker-compose logs -f"
echo "To stop: docker-compose down"
6. Backend Files
