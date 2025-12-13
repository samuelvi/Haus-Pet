#!/bin/sh
set -e  # Exit on error

echo "========================================"
echo "Starting API Server Container"
echo "========================================"
echo "Container platform: $(uname -a)"
echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"
echo ""

cd /app/api || exit 1
echo "✓ Working directory: $(pwd)"
echo ""

# Check if schema exists
if [ -f "prisma/schema.prisma" ]; then
  echo "✓ Prisma schema found"
else
  echo "✗ ERROR: Prisma schema NOT found at prisma/schema.prisma"
  ls -la prisma/ || echo "prisma/ directory not found"
  exit 1
fi

# Check if node_modules exists
if [ -d "node_modules" ]; then
  echo "✓ node_modules directory exists"
  echo "  - @prisma/client: $(ls -d node_modules/@prisma/client 2>/dev/null && echo 'exists' || echo 'NOT FOUND')"
  echo "  - ts-node: $(ls node_modules/.bin/ts-node 2>/dev/null && echo 'exists' || echo 'NOT FOUND')"
else
  echo "✗ ERROR: node_modules directory NOT found"
  exit 1
fi
echo ""

# ALWAYS regenerate Prisma Client inside container to ensure correct binary for container platform
echo "Generating Prisma Client for container platform..."
echo "This ensures the query engine binary matches the container OS/architecture"
npx prisma generate || { echo "✗ FAILED to generate Prisma client"; exit 1; }
echo "✓ Prisma client generated successfully"
echo ""

# Verify Prisma client after generation
if [ -d "node_modules/@prisma/client" ]; then
  echo "✓ Prisma client verified in node_modules"
  echo "  Available query engines:"
  find node_modules/@prisma/client -name "libquery_engine-*" -type f 2>/dev/null | head -5 || echo "  (query engines not found)"
else
  echo "✗ ERROR: Prisma client NOT found after generation"
  exit 1
fi
echo ""

# Start server
echo "========================================"
echo "Starting API Server with ts-node..."
echo "========================================"
node_modules/.bin/ts-node index.ts
