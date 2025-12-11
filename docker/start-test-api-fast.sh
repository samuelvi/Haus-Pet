#!/bin/sh
set -e  # Exit on error

echo "======================================"
echo "Starting HausPet API Test Environment"
echo "======================================"

# Change to API directory
cd /app/api || exit 1
echo "✓ Changed to /app/api"

# Verify dependencies exist (but don't reinstall)
if [ ! -d "node_modules" ]; then
  echo "⚠ node_modules not found, installing..."
  npm install --silent || { echo "✗ npm install failed"; exit 1; }
else
  echo "✓ API dependencies already installed"
fi

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate || { echo "✗ Prisma generate failed"; exit 1; }
echo "✓ Prisma client generated"

# Run migrations
echo "Running database migrations..."
npx prisma migrate deploy || { echo "✗ Migrations failed"; exit 1; }
echo "✓ Migrations completed"

# Seed database
echo "Seeding database..."
npx prisma db seed || { echo "✗ Database seeding failed"; exit 1; }
echo "✓ Database seeded"

# Seed pets read model
echo "Seeding pets read model..."
npx ts-node prisma/seed-pets-readmodel.ts || { echo "✗ Pets read model seeding failed"; exit 1; }
echo "✓ Pets read model seeded"

# Start API server
echo "======================================"
echo "Starting API server..."
echo "======================================"
./node_modules/.bin/ts-node index.ts
