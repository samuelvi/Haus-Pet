#!/bin/sh
echo "======================================"
echo "Starting API Server (setup already done)"
echo "======================================"

cd /app/api || exit 1

# Just start the server - everything else done in workflow
echo "Starting server on port 3000..."
exec ./node_modules/.bin/ts-node index.ts
