#!/bin/bash

# Quick start script for local development
# This script starts the services for local development and testing

set -e

echo "🚀 Starting Video Processing System for Local Development"
echo "========================================================"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check for environment file
if [ ! -f .env ]; then
    echo "⚠️  No .env file found. Creating from template..."
    cp .env.example .env
    echo "📝 Please edit .env file with your AWS credentials and S3 bucket name."
    echo "   Then run this script again."
    exit 1
fi

echo "🔨 Starting services with docker-compose..."
docker-compose up --build -d

echo "⏳ Waiting for services to start..."
sleep 15

echo "📊 Service status:"
docker-compose ps

echo ""
echo "✅ Local development environment is ready!"
echo ""
echo "🌐 Access the services:"
echo "   Frontend:    http://localhost:3001"
echo "   API:         http://localhost:5001"
echo "   RabbitMQ:    http://localhost:15672 (guest/guest)"
echo "   Prometheus:  http://localhost:9090"
echo "   Grafana:     http://localhost:3000 (admin/admin)"
echo ""
echo "🛑 To stop: docker-compose down"
echo "📊 Logs: docker-compose logs -f"
