.PHONY: help build up down test migrate seed lint format

help: ## Show this help message
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

build: ## Build all Docker images
	docker-compose build

up: ## Start all services with docker-compose
	docker-compose up -d

down: ## Stop all services
	docker-compose down

logs: ## View logs from all services
	docker-compose logs -f

test: ## Run all tests
	cd api/shared && pytest -v
	cd api/auth && pytest -v
	cd api/dashboard && pytest -v
	cd api/status && pytest -v
	cd api/gateway && pytest -v
	cd api/monitor && pytest -v
	cd api/notify && pytest -v

migrate: ## Run database migrations
	cd api/shared && alembic upgrade head

migrate-down: ## Rollback one migration
	cd api/shared && alembic downgrade -1

seed: ## Seed database with sample data
	@echo "Seeding database..."
	@# Add seed script here

lint: ## Run linters
	cd app && npm run lint

format: ## Format code
	cd app && npm run format

k8s-apply: ## Apply Kubernetes manifests
	kubectl apply -k k8s/overlays/production

k8s-delete: ## Delete Kubernetes resources
	kubectl delete -k k8s/overlays/production

install: ## Install all dependencies
	cd app && npm install
	cd api/shared && pip install -e .
