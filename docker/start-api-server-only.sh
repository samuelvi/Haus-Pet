#!/bin/sh
set -e

echo "========================================"
echo "Starting HausPet API Server"
echo "========================================"
echo "Platform: $(uname -s -m)"
echo "Node: $(node --version)"
echo ""

cd /app/api || { echo "ERROR: Cannot cd to /app/api"; exit 1; }

# Verify critical files exist
echo "Checking dependencies..."
[ -f "prisma/schema.prisma" ] || { echo "ERROR: schema.prisma not found"; exit 1; }
[ -d "node_modules" ] || { echo "ERROR: node_modules not found"; exit 1; }
[ -f "node_modules/.bin/ts-node" ] || { echo "ERROR: ts-node not found"; exit 1; }
echo "✓ All dependencies found"
echo ""

# Prisma client should already be generated on host with all binary targets
# including the one for this container platform (debian-openssl-3.0.x)
if [ -d "node_modules/@prisma/client" ]; then
  echo "✓ Prisma client found (generated on host with multi-platform binaries)"
else
  echo "WARNING: Prisma client not found, generating now..."
  npx prisma generate || { echo "ERROR: Failed to generate Prisma"; exit 1; }
fi
echo ""

echo "Starting API server..."
exec node_modules/.bin/ts-node index.ts
