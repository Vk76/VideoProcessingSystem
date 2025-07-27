#!/bin/bash

# Deployment Script for Video Processing System
# Run this on the EC2 instance to deploy/update the application

set -e  # Exit on any error

echo "🚀 Starting deployment of Video Processing System..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "📦 Installing Docker..."
    sudo yum update -y
    sudo yum install -y docker
    sudo systemctl start docker
    sudo systemctl enable docker
    sudo usermod -aG docker $USER
    echo "✅ Docker installed successfully"
else
    echo "✅ Docker is already installed"
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "📦 Installing Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    echo "✅ Docker Compose installed successfully"
else
    echo "✅ Docker Compose is already installed"
fi

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p uploads temp prometheus-data grafana-data

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  Creating .env file..."
    cat > .env << EOF
# AWS Configuration
S3_BUCKET=video-processing-system-bucket
AWS_DEFAULT_REGION=ap-south-1
AWS_PROFILE=my-dev-profile  # Use the profile you created for your personal AWS account

# RabbitMQ Configuration
RABBITMQ_DEFAULT_USER=guest
RABBITMQ_DEFAULT_PASS=guest

# Frontend Configuration
REACT_APP_API_URL=http://localhost:5001

# Add your AWS credentials here or use IAM roles (recommended)
# AWS_ACCESS_KEY_ID=your-access-key
# AWS_SECRET_ACCESS_KEY=your-secret-key
EOF
    echo "📝 Please edit .env file with your actual S3 bucket name!"
    echo "   You can find the bucket name from the provision script output."
else
    echo "✅ .env file already exists"
fi

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose down || true

# Remove old images to ensure we use the latest
echo "🗑️  Removing old images..."
docker image prune -f || true

# Build and start services
echo "🔨 Building and starting services..."
docker-compose up --build -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 30

# Check service health
echo "🩺 Checking service health..."
docker-compose ps

# Test API endpoint
echo "🧪 Testing API endpoint..."
sleep 10
if curl -f http://localhost:5001/health &> /dev/null; then
    echo "✅ API service is healthy"
else
    echo "⚠️  API service may not be ready yet"
fi

# Test Frontend endpoint
echo "🧪 Testing Frontend endpoint..."
if curl -f http://localhost:3001 &> /dev/null; then
    echo "✅ Frontend service is healthy"
else
    echo "⚠️  Frontend service may not be ready yet"
fi

# Display service URLs
echo ""
echo "🎉 Deployment completed!"
echo ""
echo "📋 Service URLs:"
echo "  � Frontend (Web):  http://$(curl -s http://checkip.amazonaws.com):3001"
echo "  �🌐 API Gateway:     http://$(curl -s http://checkip.amazonaws.com):5001"
echo "  🐰 RabbitMQ UI:     http://$(curl -s http://checkip.amazonaws.com):15672 (guest/guest)"
echo "  📊 Prometheus:      http://$(curl -s http://checkip.amazonaws.com):9090"
echo "  📈 Grafana:         http://$(curl -s http://checkip.amazonaws.com):3000 (admin/admin)"
echo ""
echo "📝 How to use:"
echo "1. 🌐 Open the web interface: http://your-ip:3001"
echo "2. 📤 Upload videos using the drag & drop interface"
echo "3. 📊 Monitor processing status in real-time"
echo "4. 📥 Download processed videos when complete"
echo "5. 📈 View system metrics in Grafana dashboard"
echo ""
echo "🔧 Alternative - API Usage:"
echo "  curl -X POST -F \"file=@test.mp4\" http://your-ip:5001/upload"
echo ""
echo "🔧 To view logs:"
echo "  docker-compose logs -f [service-name]"
echo ""
echo "🔄 To restart services:"
echo "  docker-compose restart"
echo ""
