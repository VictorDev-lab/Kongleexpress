#!/bin/bash

echo "🚀 Starting KONGLE app with frontend setup..."

# Check if we're in Railway environment
if [ "$RAILWAY_ENVIRONMENT" = "production" ]; then
    echo "📁 Setting up frontend files for production..."
    
    # List what's in the app directory
    echo "📋 Contents of /app:"
    ls -la /app/
    
    # Check if frontend directory exists
    if [ -d "/app/frontend" ]; then
        echo "✅ Frontend directory found!"
        ls -la /app/frontend/
    else
        echo "⚠️ Frontend directory not found, checking for files..."
        find /app -name "index.html" -type f
    fi
fi

# Start the application
echo "🚀 Starting Node.js server..."
cd /app/backend && node server.js
