COMPOSE_FILE = docker/docker-compose.yaml
COMPOSE = docker compose -f $(COMPOSE_FILE)
API_SERVICE = hauspet_api
MONGO_SHELL_CMD = mongosh -u audit_user -p audit_pass --authenticationDatabase admin

# --- Test Environment ---
TEST_COMPOSE_FILE = docker/docker-compose.test.yaml
TEST_COMPOSE = docker compose -f $(TEST_COMPOSE_FILE)
TEST_API_SERVICE = hauspet_api_test

.PHONY: up down logs restart install shell list-routes prune mongo-shell reset-db seed test test-up test-down test-run test-prune test-unit test-integration test-functional test-all proxy-up proxy-down proxy-logs proxy-restart prod-cert

# --- Development Environment ---
up:
	$(COMPOSE) up -d

down:
	$(COMPOSE) down

prune:
	$(COMPOSE) down -v

reset-db:
	@echo "Resetting dev database schemas/enums/migrations..."
	@docker compose -f docker/docker-compose.yaml exec hauspet_db sh -c "psql -U user -d hauspet_db -c \"DROP SCHEMA IF EXISTS readmodels CASCADE; DROP SCHEMA IF EXISTS eventstore CASCADE; DROP TABLE IF EXISTS breed, users, _prisma_migrations CASCADE; DROP TYPE IF EXISTS \\\"PetType\\\" CASCADE;\""

seed:
	@echo "Applying migrations and seeding dev database..."
	@docker compose -f docker/docker-compose.yaml run --rm hauspet_api sh -c "npm install --silent && npx prisma migrate deploy && npx prisma db seed && npx ts-node prisma/seed-pets-readmodel.ts"

logs:
	$(COMPOSE) logs -f $(API_SERVICE)

restart:
	$(COMPOSE) down
	$(COMPOSE) up -d

install:
	$(COMPOSE) run --rm $(API_SERVICE) sh -c "npm install"

shell:
	$(COMPOSE) exec $(API_SERVICE) sh

list-routes:
	@echo "Installing dependencies and listing routes..."
	@$(COMPOSE) run --rm $(API_SERVICE) sh -c "npm install > /dev/null && ./node_modules/.bin/ts-node scripts/list-routes.ts"

mongo-shell:
	$(COMPOSE) exec hauspet_audit_db $(MONGO_SHELL_CMD)

# --- Test Environment ---
test-up:
	@echo "Starting test environment..."
	@$(TEST_COMPOSE) up -d --build

test-down:
	@echo "Stopping test environment..."
	@$(TEST_COMPOSE) down

test-prune:
	@echo "Stopping test environment and pruning volumes..."
	@$(TEST_COMPOSE) down -v

test-run:
	@echo "Running Playwright tests inside the running API container..."
	# The container installs its own dependencies, so we just run the tests.
	@$(TEST_COMPOSE) exec -w /app $(TEST_API_SERVICE) sh -c "npx playwright test"

test-list-routes:
	@echo "Installing dependencies and listing routes..."
	@$(TEST_COMPOSE) run --rm $(TEST_API_SERVICE) sh -c "npm install > /dev/null && ./node_modules/.bin/ts-node scripts/list-routes.ts"


# --- Tests ---
test-unit:
	@echo "Running unit tests with Vitest..."
	@npm run test:unit

test-unit-watch:
	@echo "Running unit tests in watch mode..."
	@npm run test:unit:watch

test-unit-coverage:
	@echo "Running unit tests with coverage..."
	@npm run test:unit:coverage

test-integration:
	@make test-up
	@echo "Waiting for API to be ready..."
	@attempts=0; \
	max_attempts=20; \
	until curl -s -f -o /dev/null http://localhost:3000/api/breeds/; do \
		attempts=$$(($$attempts + 1)); \
		if [ "$$attempts" -ge "$$max_attempts" ]; then \
			echo "API failed to start after $$(($$max_attempts * 2)) seconds."; \
			echo "Dumping container logs for debugging..."; \
			$(TEST_COMPOSE) logs $(TEST_API_SERVICE); \
			make test-down; \
			exit 1; \
		fi; \
		echo "API not ready, waiting 2 seconds... (Attempt $$attempts/$$max_attempts)"; \
		sleep 2; \
	done
	@echo "API is ready! Running integration tests..."
	@npx playwright test tests/integration ; EXIT_CODE=$$? ; \
		echo "Cleaning up test environment..." ; \
		make test-down ; \
		exit $$EXIT_CODE

test-functional:
	@make test-up
	@echo "Waiting for API to be ready..."
	@attempts=0; \
	max_attempts=20; \
	until curl -s -f -o /dev/null http://localhost:3000/api/breeds/; do \
		attempts=$$(($$attempts + 1)); \
		if [ "$$attempts" -ge "$$max_attempts" ]; then \
			echo "API failed to start after $$(($$max_attempts * 2)) seconds."; \
			echo "Dumping container logs for debugging..."; \
			$(TEST_COMPOSE) logs $(TEST_API_SERVICE); \
			make test-down; \
			exit 1; \
		fi; \
		echo "API not ready, waiting 2 seconds... (Attempt $$attempts/$$max_attempts)"; \
		sleep 2; \
	done
	@echo "API is ready! Running functional tests..."
	@npx playwright test tests/functional ; EXIT_CODE=$$? ; \
		echo "Cleaning up test environment..." ; \
		make test-down ; \
		exit $$EXIT_CODE

test-all:
	@echo "Running all tests (unit, integration, functional)..."
	@make test-unit
	@make test-integration
	@make test-functional

test:
	@make test-all

# --- Proxy (Local Development) ---
PROXY_COMPOSE_FILE = docker/docker-compose.proxy.yaml
PROXY_COMPOSE = docker compose -f $(PROXY_COMPOSE_FILE)

proxy-up:
	@echo "Starting nginx proxy..."
	@$(PROXY_COMPOSE) up -d

proxy-down:
	@echo "Stopping nginx proxy..."
	@$(PROXY_COMPOSE) down

proxy-logs:
	@$(PROXY_COMPOSE) logs -f

proxy-restart:
	@$(PROXY_COMPOSE) restart

# --- Production Helpers ---
prod-cert:
	@echo "Issuing/renewing Let's Encrypt cert via hauspet_nginx..."
	@docker compose -f docker/docker-compose.prod.yaml run --rm hauspet_nginx \
		certbot certonly --webroot -w /var/www/certbot \
		-d $(DOMAIN) -d $(WWW_DOMAIN) \
		--email $(LETSENCRYPT_EMAIL) --agree-tos --no-eff-email
	@docker compose -f docker/docker-compose.prod.yaml exec hauspet_nginx nginx -s reload
