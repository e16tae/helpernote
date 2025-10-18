.PHONY: help dev dev-up dev-down reset-data reset-production build up down logs clean test test-docker test-nerdctl

help:
	@echo "Helpernote - Development Commands"
	@echo ""
	@echo "Development:"
	@echo "  make dev         - Start development environment (DB + MinIO only)"
	@echo "  make dev-up      - Start development services in detached mode"
	@echo "  make dev-down    - Stop development services"
	@echo "  make reset-data  - Reset local DB and MinIO data (DESTRUCTIVE)"
	@echo ""
	@echo "Production:"
	@echo "  make reset-production NAMESPACE=<ns> - Reset production data (EXTREMELY DANGEROUS)"
	@echo ""
	@echo "Testing:"
	@echo "  make test        - Run all unit tests"
	@echo "  make test-all    - Run all tests including E2E"
	@echo "  make test-e2e    - Run E2E tests only"
	@echo "  make test-coverage - Generate test coverage reports"
	@echo "  make test-docker   - Start test environment with Docker Compose"
	@echo "  make test-nerdctl  - Start test environment with nerdctl compose"
	@echo ""
	@echo "Docker:"
	@echo "  make build       - Build all Docker images"
	@echo "  make up          - Start all services (production mode)"
	@echo "  make down        - Stop all services"
	@echo "  make logs        - View logs from all services"
	@echo "  make clean       - Remove all containers, volumes, and build artifacts"
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

# Reset all data (PostgreSQL + MinIO)
reset-data:
	@./scripts/reset-data.sh

# Reset production data (DANGEROUS!)
reset-production:
	@echo "⚠️  WARNING: This will reset PRODUCTION data!"
	@echo "Usage: make reset-production NAMESPACE=<namespace>"
	@echo ""
	@echo "Example:"
	@echo "  make reset-production NAMESPACE=helpernote-staging"
	@echo "  make reset-production NAMESPACE=helpernote-prod"
	@echo ""
	@if [ -z "$(NAMESPACE)" ]; then \
		echo "Error: NAMESPACE not specified"; \
		exit 1; \
	fi
	@./scripts/reset-production-data.sh $(NAMESPACE)

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
test: backend-test frontend-test
	@echo "All tests completed"

frontend-test:
	cd frontend && npm run test

# Test coverage
test-coverage:
	@echo "Running backend coverage..."
	cd backend && cargo tarpaulin --out Html --output-dir ./coverage || echo "Install cargo-tarpaulin: cargo install cargo-tarpaulin"
	@echo "Running frontend coverage..."
	cd frontend && npm run test:coverage
	@echo "Coverage reports generated"

# E2E tests
test-e2e:
	@echo "Running E2E tests..."
	cd frontend && npm run test:e2e
	@echo "E2E tests completed"

# Run all tests including E2E
test-all: test test-e2e
	@echo "All tests including E2E completed"

# Start test environment with Docker Compose
test-docker:
	@./scripts/docker-compose-test.sh

# Start test environment with nerdctl compose
test-nerdctl:
	@./scripts/nerd-compose-test.sh
