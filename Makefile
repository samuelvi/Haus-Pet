# --- Development Environment ---
DEV_COMPOSE_FILE = docker/dev/docker-compose.yaml
DEV_COMPOSE = docker compose -f $(DEV_COMPOSE_FILE)
DEV_PROXY_COMPOSE_FILE = docker/dev/docker-compose.proxy.yaml
DEV_PROXY_COMPOSE = docker compose -f $(DEV_PROXY_COMPOSE_FILE)
API_SERVICE = hauspet_api
GUI_SERVICE = hauspet_gui
MONGO_SHELL_CMD = mongosh -u audit_user -p audit_pass --authenticationDatabase admin

# --- Test Environment ---
TEST_COMPOSE_FILE = docker/test/docker-compose.yaml
TEST_COMPOSE = docker compose -f $(TEST_COMPOSE_FILE)
TEST_API_SERVICE = hauspet_api_test

# --- Production Environment ---
PROD_COMPOSE_FILE = docker/prod/docker-compose.yaml
PROD_COMPOSE = docker compose -f $(PROD_COMPOSE_FILE)

.PHONY: dev-up dev-down dev-logs dev-restart dev-install dev-shell dev-list-routes dev-prune dev-mongo-shell dev-reset-db dev-seed dev-gui-build dev-gui-restart dev-gui-logs dev-gui-shell dev-init dev-proxy-up dev-proxy-down dev-proxy-logs dev-proxy-restart test-up test-down test-run test-prune test-list-routes test-unit test-unit-watch test-unit-coverage test-integration test-functional test-all test prod-up prod-down prod-logs prod-restart prod-cert

# =============================================================================
# DEVELOPMENT ENVIRONMENT
# =============================================================================

dev-up:
	@echo "Starting development environment..."
	@$(DEV_COMPOSE) up -d

dev-down:
	@echo "Stopping development environment..."
	@$(DEV_COMPOSE) down

dev-prune:
	@echo "Stopping development environment and removing volumes..."
	@$(DEV_COMPOSE) down -v

dev-reset-db:
	@echo "Resetting dev database schemas/enums/migrations..."
	@$(DEV_COMPOSE) exec hauspet_db sh -c "psql -U user -d hauspet_db -c \"DROP SCHEMA IF EXISTS readmodels CASCADE; DROP SCHEMA IF EXISTS eventstore CASCADE; DROP TABLE IF EXISTS breed, users, _prisma_migrations CASCADE; DROP TYPE IF EXISTS \\\"PetType\\\" CASCADE;\""

dev-seed:
	@echo "Applying migrations and seeding dev database..."
	@$(DEV_COMPOSE) run --rm $(API_SERVICE) sh -c "npm install --silent && npx prisma migrate deploy && npx prisma db seed && npx ts-node prisma/seed-pets-readmodel.ts"

dev-logs:
	@$(DEV_COMPOSE) logs -f $(API_SERVICE)

dev-restart:
	@echo "Restarting development environment..."
	@$(DEV_COMPOSE) down
	@$(DEV_COMPOSE) up -d

dev-install:
	@echo "Installing dependencies..."
	@$(DEV_COMPOSE) run --rm $(API_SERVICE) sh -c "npm install"

dev-shell:
	@$(DEV_COMPOSE) exec $(API_SERVICE) sh

dev-list-routes:
	@echo "Installing dependencies and listing routes..."
	@$(DEV_COMPOSE) run --rm $(API_SERVICE) sh -c "npm install > /dev/null && ./node_modules/.bin/ts-node scripts/list-routes.ts"

dev-mongo-shell:
	@$(DEV_COMPOSE) exec hauspet_audit_db $(MONGO_SHELL_CMD)

# --- Frontend (GUI) Commands ---
dev-gui-build:
	@echo "Rebuilding frontend container..."
	@$(DEV_COMPOSE) stop $(GUI_SERVICE)
	@$(DEV_COMPOSE) build --no-cache $(GUI_SERVICE)
	@$(DEV_COMPOSE) up -d $(GUI_SERVICE)
	@echo "Frontend rebuilt successfully!"

dev-gui-restart:
	@echo "Restarting frontend..."
	@$(DEV_COMPOSE) restart $(GUI_SERVICE)

dev-gui-logs:
	@$(DEV_COMPOSE) logs -f $(GUI_SERVICE)

dev-gui-shell:
	@$(DEV_COMPOSE) exec $(GUI_SERVICE) sh

# --- Initialization ---
dev-init:
	@echo "🚀 Initializing HausPet development environment..."
	@echo ""
	@echo "📦 Building and starting all services..."
	@$(DEV_COMPOSE) down
	@$(DEV_COMPOSE) build
	@$(DEV_COMPOSE) up -d
	@echo ""
	@echo "⏳ Waiting for services to be ready..."
	@sleep 10
	@echo ""
	@echo "✅ HausPet is ready!"
	@echo ""
	@echo "🌐 Access points:"
	@echo "   - Frontend (GUI):  http://localhost:5173"
	@echo "   - API:             http://localhost:3000"
	@echo "   - Nginx:           http://localhost"
	@echo ""
	@echo "📚 Useful commands:"
	@echo "   make dev-logs          - View API logs"
	@echo "   make dev-gui-logs      - View frontend logs"
	@echo "   make dev-restart       - Restart all services"
	@echo "   make dev-gui-restart   - Restart frontend only"
	@echo "   make dev-down          - Stop all services"
	@echo ""

# --- Proxy (Local Development) ---
dev-proxy-up:
	@echo "Starting nginx proxy..."
	@$(DEV_PROXY_COMPOSE) up -d

dev-proxy-down:
	@echo "Stopping nginx proxy..."
	@$(DEV_PROXY_COMPOSE) down

dev-proxy-logs:
	@$(DEV_PROXY_COMPOSE) logs -f

dev-proxy-restart:
	@$(DEV_PROXY_COMPOSE) restart

# =============================================================================
# TEST ENVIRONMENT
# =============================================================================

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
	@$(TEST_COMPOSE) exec -w /app $(TEST_API_SERVICE) sh -c "npx playwright test"

test-list-routes:
	@echo "Installing dependencies and listing routes..."
	@$(TEST_COMPOSE) run --rm $(TEST_API_SERVICE) sh -c "npm install > /dev/null && ./node_modules/.bin/ts-node scripts/list-routes.ts"

# --- Unit Tests ---
test-unit:
	@echo "Running unit tests with Vitest..."
	@npm run test:unit

test-unit-watch:
	@echo "Running unit tests in watch mode..."
	@npm run test:unit:watch

test-unit-coverage:
	@echo "Running unit tests with coverage..."
	@npm run test:unit:coverage

# --- Integration Tests ---
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

# --- Functional Tests ---
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

# --- All Tests ---
test-all:
	@echo "Running all tests (unit, integration, functional)..."
	@make test-unit
	@make test-integration
	@make test-functional

test:
	@make test-all

# =============================================================================
# PRODUCTION ENVIRONMENT
# =============================================================================

prod-up:
	@echo "Starting production environment..."
	@$(PROD_COMPOSE) up -d

prod-down:
	@echo "Stopping production environment..."
	@$(PROD_COMPOSE) down

prod-logs:
	@$(PROD_COMPOSE) logs -f

prod-restart:
	@echo "Restarting production environment..."
	@$(PROD_COMPOSE) down
	@$(PROD_COMPOSE) up -d

prod-cert:
	@echo "Issuing/renewing Let's Encrypt cert via hauspet_nginx..."
	@$(PROD_COMPOSE) run --rm hauspet_nginx \
		certbot certonly --webroot -w /var/www/certbot \
		-d $(DOMAIN) -d $(WWW_DOMAIN) \
		--email $(LETSENCRYPT_EMAIL) --agree-tos --no-eff-email
	@$(PROD_COMPOSE) exec hauspet_nginx nginx -s reload

# =============================================================================
# ALIASES FOR BACKWARDS COMPATIBILITY
# =============================================================================

# Default environment is development
up: dev-up
down: dev-down
logs: dev-logs
restart: dev-restart
install: dev-install
shell: dev-shell
list-routes: dev-list-routes
prune: dev-prune
mongo-shell: dev-mongo-shell
reset-db: dev-reset-db
seed: dev-seed
gui-build: dev-gui-build
gui-restart: dev-gui-restart
gui-logs: dev-gui-logs
gui-shell: dev-gui-shell
init: dev-init
proxy-up: dev-proxy-up
proxy-down: dev-proxy-down
proxy-logs: dev-proxy-logs
proxy-restart: dev-proxy-restart
