.PHONY: up down logs restart install shell list-routes

up:
	docker compose up -d

down:
	docker compose down

logs:
	docker compose logs -f api_cat_nodejs

restart:
	docker compose down
	docker compose up -d

install:
	docker compose run --rm api_cat_nodejs sh -c "npm install"

shell:
	docker compose exec api_cat_nodejs sh

list-routes:
	docker compose run --rm api_cat_nodejs sh -c "npm run list-routes"
