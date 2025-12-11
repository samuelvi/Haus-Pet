#!/bin/bash

echo "=== Wait Script Starting ==="
echo "PWD: $(pwd)"
echo "Script permissions: $(ls -la .github/scripts/wait-for-api.sh 2>/dev/null || echo 'cannot check')"

echo "Testing curl availability..."
which curl || echo "curl not found!"

echo "Testing docker compose availability..."
docker compose version || echo "docker compose not found!"

echo ""
echo "=== Starting API Wait Loop ==="
echo "Will attempt up to 150 times (5 minutes)"

for attempt in $(seq 1 150); do
    # Try to reach the API - don't let curl failure stop the loop
    if curl --connect-timeout 3 --max-time 5 -f -s http://localhost:3000/api/breeds > /dev/null 2>&1; then
        echo ""
        echo "✓ API is ready after attempt ${attempt}!"

        # Verify data
        response=$(curl -s http://localhost:3000/api/breeds 2>/dev/null || echo '{}')
        echo "Response: ${response:0:200}"

        breed_count=$(echo "$response" | grep -o '"id"' | wc -l | tr -d ' ')
        echo "Found $breed_count breeds"

        if [ "$breed_count" -ge 5 ]; then
            echo "✓ Database verified!"
            exit 0
        else
            echo "ERROR: Not enough data (need 5+ breeds)"
            exit 1
        fi
    fi

    # Progress every 5 attempts
    if [ $((attempt % 5)) -eq 0 ]; then
        echo "[Attempt ${attempt}/150] Still waiting..."
    fi

    sleep 2
done

echo ""
echo "✗ API never became ready after 150 attempts"
echo "=== Container Status ==="
docker compose -f docker/docker-compose.test.yaml ps 2>/dev/null || echo "Cannot get status"
echo "=== API Logs ==="
docker compose -f docker/docker-compose.test.yaml logs hauspet_api_test 2>/dev/null | tail -50 || echo "Cannot get logs"
exit 1
