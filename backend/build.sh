#!/bin/bash
echo "🔨 Building Jan-Samadhan Backend..."

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Build TypeScript
echo "🏗️ Building TypeScript..."
npx tsc

# Check if build was successful
if [ -f "dist/server.js" ]; then
    echo "✅ Build successful!"
    echo "📁 Built files:"
    ls -la dist/
else
    echo "❌ Build failed - dist/server.js not found"
    exit 1
fi