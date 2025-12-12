#!/bin/sh
echo "======================================"
echo "Starting API Server"
echo "======================================"

cd /app/api || exit 1

# Quick check - ensure Prisma Client exists
if [ ! -d "node_modules/@prisma/client" ]; then
  echo "Generating Prisma Client in container..."
  npx prisma generate || exit 1
fi

# Verify dependencies exist
if [ ! -f "node_modules/.bin/ts-node" ]; then
  echo "ERROR: ts-node not found!"
  ls -la node_modules/.bin/ || echo "node_modules/.bin/ not found"
  exit 1
fi

# Start the server
echo "Starting server on port 3000..."
echo "Node modules path: $(pwd)/node_modules"
echo "ts-node path: $(which ts-node || echo 'not in PATH')"
exec ./node_modules/.bin/ts-node index.ts
