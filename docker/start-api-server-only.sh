#!/bin/sh
set -x  # Show all commands for debugging
echo "Starting API Server..."

cd /app/api || exit 1
echo "Current directory: $(pwd)"

# List what we have
echo "Checking node_modules..."
ls -la node_modules/.bin/ts-node || echo "ts-node not found"
ls -la node_modules/@prisma/client || echo "@prisma/client not found"

# Generate Prisma Client if needed
if [ ! -d "node_modules/@prisma/client" ]; then
  echo "Generating Prisma Client..."
  npx prisma generate
fi

# Start server (no exec - keep it simple)
echo "Starting ts-node index.ts..."
node_modules/.bin/ts-node index.ts
