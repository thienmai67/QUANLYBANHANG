.PHONY: up down restart logs build migrate-up migrate-down test-backend test-frontend

up:
	docker compose up -d

down:
	docker compose down

restart:
	docker compose restart

logs:
	docker compose logs -f

build:
	docker compose build

migrate-up:
	docker compose exec -T postgres psql -U postgres -d vlxd_db -f /migrations/000001_init_vlxd_schema.up.sql
	docker compose exec -T postgres psql -U postgres -d vlxd_db -f /migrations/000002_seed_vlxd_data.up.sql

migrate-down:
	docker compose exec -T postgres psql -U postgres -d vlxd_db -f /migrations/000002_seed_vlxd_data.down.sql
	docker compose exec -T postgres psql -U postgres -d vlxd_db -f /migrations/000001_init_vlxd_schema.down.sql

test-backend:
	cd backend && go test ./...

test-frontend:
	cd frontend && npm run test
