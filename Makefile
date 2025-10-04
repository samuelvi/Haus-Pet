COMPOSE_FILE = docker/docker-compose.yaml
COMPOSE = docker compose -f $(COMPOSE_FILE)

.PHONY: up down logs restart install shell list-routes

up:
	$(COMPOSE) up -d

down:
	$(COMPOSE) down

logs:
	$(COMPOSE) logs -f api_cat_nodejs

restart:
	$(COMPOSE) down
	$(COMPOSE) up -d

install:
	$(COMPOSE) run --rm api_cat_nodejs sh -c "npm install"

shell:
	$(COMPOSE) exec api_cat_nodejs sh

list-routes:
	$(COMPOSE) run --rm api_cat_nodejs sh -c "npm run list-routes"
