COMPOSE_FILE = docker/docker-compose.yaml
COMPOSE = docker compose -f $(COMPOSE_FILE)
API_SERVICE = hauspet_api
MONGO_SHELL_CMD = mongosh -u audit_user -p audit_pass --authenticationDatabase admin

.PHONY: up down logs restart install shell list-routes prune mongo-shell

up:
	$(COMPOSE) up -d

down:
	$(COMPOSE) down

prune:
	$(COMPOSE) down -v

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
	@$(COMPOSE) run --rm $(API_SERVICE) sh -c "npm install > /dev/null && ./node_modules/.bin/ts-node src/scripts/list-routes.ts"

mongo-shell:
	$(COMPOSE) exec hauspet_audit_db $(MONGO_SHELL_CMD)
