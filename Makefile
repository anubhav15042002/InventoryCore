.PHONY: up down logs test migrate seed

up:
	docker compose up --build

down:
	docker compose down

logs:
	docker compose logs -f

test:
	docker compose run --rm backend pytest

migrate:
	docker compose run --rm backend alembic upgrade head

seed:
	docker compose exec backend python -m scripts.seed
