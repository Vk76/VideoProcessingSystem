#!/bin/bash

# Frontend Development Setup Script
# This script sets up the frontend for local development

set -e

echo "🎨 Setting up Video Processing Frontend for Development"
echo "======================================================"

# Navigate to frontend directory
cd "$(dirname "$0")"

# Check if Node.js is installed
if ! command -v node > /dev/null 2>&1; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ and try again."
    echo "   Download from: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Node.js version 16+ is required. Current version: $(node -v)"
    echo "   Please upgrade Node.js and try again."
    exit 1
fi

# Check if npm is available
if ! command -v npm > /dev/null 2>&1; then
    echo "❌ npm is not available. Please ensure npm is installed with Node.js."
    exit 1
fi

echo "✅ Node.js $(node -v) detected"
echo "✅ npm $(npm -v) detected"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Check if backend is running
echo ""
echo "🔍 Checking if backend API is available..."
if curl -f http://localhost:5001/health > /dev/null 2>&1; then
    echo "✅ Backend API is running at http://localhost:5001"
else
    echo "⚠️  Backend API is not running. Please start it first:"
    echo "   cd .. && docker-compose up -d api"
fi

echo ""
echo "🚀 Starting development server..."
echo "   Frontend will be available at: http://localhost:3000"
echo "   API proxy configured for: http://localhost:5001"
echo ""
echo "💡 Tips:"
echo "   - Hot reload is enabled for development"
echo "   - Edit files in src/ to see changes"
echo "   - Use Ctrl+C to stop the development server"
echo ""

# Start development server
npm start
