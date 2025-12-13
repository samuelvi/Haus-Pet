#!/bin/sh
set -e  # Exit on error
echo "Starting API Server..."

cd /app/api || exit 1
echo "Current directory: $(pwd)"

# ALWAYS regenerate Prisma Client inside container to ensure correct binary for container platform
echo "Generating Prisma Client for container platform..."
npx prisma generate || { echo "Failed to generate Prisma client"; exit 1; }
echo "✓ Prisma client generated"

# Start server
echo "Starting ts-node index.ts..."
node_modules/.bin/ts-node index.ts
