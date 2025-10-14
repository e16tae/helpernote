.PHONY: help dev dev-up dev-down build up down logs clean test

help:
	@echo "Helpernote - Development Commands"
	@echo ""
	@echo "  make dev         - Start development environment (DB + MinIO only)"
	@echo "  make dev-up      - Start development services in detached mode"
	@echo "  make dev-down    - Stop development services"
	@echo "  make build       - Build all Docker images"
	@echo "  make up          - Start all services (production mode)"
	@echo "  make down        - Stop all services"
	@echo "  make logs        - View logs from all services"
	@echo "  make clean       - Remove all containers, volumes, and build artifacts"
	@echo "  make test        - Run tests"
	@echo ""
	@echo "Backend:"
	@echo "  make backend-dev     - Run backend in development mode"
	@echo "  make backend-build   - Build backend"
	@echo "  make backend-test    - Run backend tests"
	@echo ""
	@echo "Frontend:"
	@echo "  make frontend-dev    - Run frontend in development mode"
	@echo "  make frontend-build  - Build frontend"
	@echo "  make frontend-lint   - Lint frontend code"

# Development environment (DB + MinIO only)
dev:
	docker-compose -f docker-compose.dev.yml up

dev-up:
	docker-compose -f docker-compose.dev.yml up -d

dev-down:
	docker-compose -f docker-compose.dev.yml down

# Production environment
build:
	docker-compose build

up:
	docker-compose up -d

down:
	docker-compose down

logs:
	docker-compose logs -f

clean:
	docker-compose down -v
	rm -rf .docker/postgres-data .docker/minio-data
	cd backend && cargo clean
	cd frontend && rm -rf .next node_modules

# Backend commands
backend-dev:
	cd backend && cargo run

backend-build:
	cd backend && cargo build --release

backend-test:
	cd backend && cargo test

# Frontend commands
frontend-dev:
	cd frontend && npm run dev

frontend-build:
	cd frontend && npm run build

frontend-lint:
	cd frontend && npm run lint

# Run all tests
test: backend-test
	@echo "All tests completed"
