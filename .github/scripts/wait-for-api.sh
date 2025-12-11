#!/bin/bash
set -e
set -o pipefail

echo "=== Starting API Wait Script ==="
echo "Will wait up to 5 minutes for API to be ready"
echo "Starting at: $(date '+%Y-%m-%d %H:%M:%S')"

attempt=0
max_attempts=150
start_time=$(date +%s)

while [ $attempt -lt $max_attempts ]; do
    attempt=$((attempt + 1))
    current_time=$(date +%s)
    elapsed=$((current_time - start_time))

    # Try to reach the API
    if curl --connect-timeout 3 --max-time 5 -f -s http://localhost:3000/api/breeds > /dev/null 2>&1; then
        echo ""
        echo "✓ API is ready after ${elapsed} seconds (attempt ${attempt})!"
        echo ""
        echo "Verifying database has data..."
        response=$(curl -s http://localhost:3000/api/breeds)
        echo "API Response: ${response:0:200}"

        breed_count=$(echo "$response" | grep -o '"id"' | wc -l)
        echo "Found $breed_count breeds in database"

        if [ "$breed_count" -ge 5 ]; then
            echo "✓ Database verified with $breed_count breeds!"
            echo "✓ Ready to run functional tests!"
            exit 0
        else
            echo "ERROR: Database does not have enough seed data (expected at least 5 breeds)"
            docker compose -f docker/docker-compose.test.yaml logs hauspet_api_test
            exit 1
        fi
    fi

    # Show progress every 5 attempts
    if [ $((attempt % 5)) -eq 0 ]; then
        echo "[${elapsed}s] Attempt ${attempt}/${max_attempts} - waiting for API..."
    fi

    sleep 2
done

# If we get here, API never became ready
echo ""
echo "✗ API failed to start after 300 seconds"
echo "Ended at: $(date '+%Y-%m-%d %H:%M:%S')"
echo "Total attempts: $attempt"
echo ""
echo "=== CONTAINER STATUS ==="
docker compose -f docker/docker-compose.test.yaml ps
echo ""
echo "=== FULL API LOGS ==="
docker compose -f docker/docker-compose.test.yaml logs hauspet_api_test
echo ""
echo "=== DATABASE LOGS ==="
docker compose -f docker/docker-compose.test.yaml logs hauspet_db_test
exit 1
