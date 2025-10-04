COMPOSE_FILE = docker/docker-compose.yaml
COMPOSE = docker compose -f $(COMPOSE_FILE)
API_SERVICE = apicat_api

.PHONY: up down logs restart install shell list-routes prune

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
	$(COMPOSE) run --rm $(API_SERVICE) sh -c "npm run list-routes"
