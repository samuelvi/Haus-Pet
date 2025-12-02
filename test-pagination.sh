#!/bin/bash

# Test script for pagination endpoints
# Run this script after starting the API server

BASE_URL="http://localhost:3000/api"

echo "=========================================="
echo "Testing Pagination Endpoints"
echo "=========================================="
echo ""

# Test 1: Breeds - First page
echo "1. GET /api/breeds?page=1&limit=5"
echo "Expected: 5 breeds, hasNext=true, hasPrevious=false"
curl -s "${BASE_URL}/breeds?page=1&limit=5" | python3 -m json.tool
echo ""
echo "=========================================="
echo ""

# Test 2: Breeds - Second page
echo "2. GET /api/breeds?page=2&limit=5"
echo "Expected: 5 breeds, hasNext might be true/false, hasPrevious=true"
curl -s "${BASE_URL}/breeds?page=2&limit=5" | python3 -m json.tool
echo ""
echo "=========================================="
echo ""

# Test 3: Breeds by type - First page
echo "3. GET /api/breeds/dog?page=1&limit=3"
echo "Expected: 3 dog breeds, hasNext depends on total, hasPrevious=false"
curl -s "${BASE_URL}/breeds/dog?page=1&limit=3" | python3 -m json.tool
echo ""
echo "=========================================="
echo ""

# Test 4: Pets - First page
echo "4. GET /api/pets?page=1&limit=5"
echo "Expected: 5 pets, hasNext depends on total, hasPrevious=false"
curl -s "${BASE_URL}/pets?page=1&limit=5" | python3 -m json.tool
echo ""
echo "=========================================="
echo ""

# Test 5: Pets by type - First page
echo "5. GET /api/pets/type/dog?page=1&limit=3"
echo "Expected: 3 dog pets, hasNext depends on total, hasPrevious=false"
curl -s "${BASE_URL}/pets/type/dog?page=1&limit=3" | python3 -m json.tool
echo ""
echo "=========================================="
echo ""

# Test 6: Default pagination (no params)
echo "6. GET /api/breeds (default pagination)"
echo "Expected: 20 breeds (default limit), hasNext depends on total"
curl -s "${BASE_URL}/breeds" | python3 -c "import sys, json; data=json.load(sys.stdin); print(json.dumps({'itemsCount': len(data['data']['items']), 'pagination': data['data']['pagination']}, indent=2))"
echo ""
echo "=========================================="
echo ""

# Test 7: Large limit (should be capped at MAX_LIMIT=100)
echo "7. GET /api/breeds?limit=200"
echo "Expected: Maximum 100 items"
curl -s "${BASE_URL}/breeds?limit=200" | python3 -c "import sys, json; data=json.load(sys.stdin); print(json.dumps({'itemsCount': len(data['data']['items']), 'pagination': data['data']['pagination']}, indent=2))"
echo ""
echo "=========================================="
echo ""

echo "✓ All pagination tests completed!"
