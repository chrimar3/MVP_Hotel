# Hotel Reviews AI - Development Makefile
# Professional development workflow automation

.PHONY: help install dev build test lint clean docker setup ci release

# Default target
.DEFAULT_GOAL := help

# Variables
NODE_VERSION := 18
DOCKER_IMAGE := hotel-reviews-ai
DOCKER_TAG := latest

# Colors for output
RED := \033[0;31m
GREEN := \033[0;32m
YELLOW := \033[0;33m
BLUE := \033[0;34m
NC := \033[0m # No Color

## Help target
help: ## Show this help message
	@echo "$(BLUE)Hotel Reviews AI - Development Commands$(NC)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "$(GREEN)%-20s$(NC) %s\n", $$1, $$2}'

## Setup and Installation
setup: ## Initial project setup for new developers
	@echo "$(BLUE)Setting up development environment...$(NC)"
	@node tools/scripts/dev-setup.js

install: ## Install all dependencies
	@echo "$(BLUE)Installing dependencies...$(NC)"
	@npm ci
	@npm run build:packages

## Development Commands
dev: ## Start development server
	@echo "$(BLUE)Starting development server...$(NC)"
	@npm run dev

dev-debug: ## Start development server with debugging
	@echo "$(BLUE)Starting development server with debugging...$(NC)"
	@DEBUG=* npm run dev

## Build Commands
build: ## Build for production
	@echo "$(BLUE)Building for production...$(NC)"
	@npm run build

build-analyze: ## Build and analyze bundle size
	@echo "$(BLUE)Building and analyzing bundle...$(NC)"
	@npm run analyze

build-packages: ## Build all packages
	@echo "$(BLUE)Building packages...$(NC)"
	@npm run build:packages

## Testing Commands
test: ## Run all tests
	@echo "$(BLUE)Running all tests...$(NC)"
	@npm test

test-unit: ## Run unit tests only
	@echo "$(BLUE)Running unit tests...$(NC)"
	@npm run test:unit

test-integration: ## Run integration tests only
	@echo "$(BLUE)Running integration tests...$(NC)"
	@npm run test:integration

test-e2e: ## Run end-to-end tests
	@echo "$(BLUE)Running E2E tests...$(NC)"
	@npm run test:e2e

test-watch: ## Run tests in watch mode
	@echo "$(BLUE)Running tests in watch mode...$(NC)"
	@npm run test:watch

test-coverage: ## Run tests with coverage report
	@echo "$(BLUE)Running tests with coverage...$(NC)"
	@npm run test:coverage

## Code Quality Commands
lint: ## Run linting
	@echo "$(BLUE)Running linting...$(NC)"
	@npm run lint

lint-fix: ## Fix linting issues
	@echo "$(BLUE)Fixing linting issues...$(NC)"
	@npm run lint:fix

format: ## Format code with Prettier
	@echo "$(BLUE)Formatting code...$(NC)"
	@npm run format

format-check: ## Check code formatting
	@echo "$(BLUE)Checking code formatting...$(NC)"
	@npm run format:check

typecheck: ## Run TypeScript type checking
	@echo "$(BLUE)Running type checks...$(NC)"
	@npm run typecheck

## Security Commands
security-audit: ## Run security audit
	@echo "$(BLUE)Running security audit...$(NC)"
	@npm run security:audit

security-scan: ## Run comprehensive security scan
	@echo "$(BLUE)Running security scan...$(NC)"
	@npm run security:scan

## Performance Commands
perf-audit: ## Run performance audit
	@echo "$(BLUE)Running performance audit...$(NC)"
	@npm run perf:audit

perf-lighthouse: ## Run Lighthouse performance test
	@echo "$(BLUE)Running Lighthouse audit...$(NC)"
	@npm run perf:lighthouse

## Docker Commands
docker-build: ## Build Docker image
	@echo "$(BLUE)Building Docker image...$(NC)"
	@docker build -f infrastructure/docker/Dockerfile -t $(DOCKER_IMAGE):$(DOCKER_TAG) .

docker-run: ## Run Docker container
	@echo "$(BLUE)Running Docker container...$(NC)"
	@docker run -p 3000:3000 $(DOCKER_IMAGE):$(DOCKER_TAG)

docker-up: ## Start all Docker services
	@echo "$(BLUE)Starting Docker services...$(NC)"
	@npm run docker:up

docker-down: ## Stop all Docker services
	@echo "$(BLUE)Stopping Docker services...$(NC)"
	@npm run docker:down

## Cleanup Commands
clean: ## Clean all build artifacts and dependencies
	@echo "$(BLUE)Cleaning project...$(NC)"
	@npm run clean
	@rm -rf node_modules
	@rm -rf .next
	@rm -rf dist

clean-cache: ## Clean npm and build caches
	@echo "$(BLUE)Cleaning caches...$(NC)"
	@npm cache clean --force

## Infrastructure Commands
infra-plan: ## Plan infrastructure changes (Terraform)
	@echo "$(BLUE)Planning infrastructure changes...$(NC)"
	@npm run infra:plan

infra-apply: ## Apply infrastructure changes (Terraform)
	@echo "$(BLUE)Applying infrastructure changes...$(NC)"
	@npm run infra:apply

## CI/CD Commands
ci: ## Run full CI pipeline locally
	@echo "$(BLUE)Running CI pipeline...$(NC)"
	@make lint
	@make typecheck
	@make test
	@make security-audit
	@make build

ci-quick: ## Run quick CI checks
	@echo "$(BLUE)Running quick CI checks...$(NC)"
	@make lint
	@make test-unit

## Release Commands
release: ## Create a new release
	@echo "$(BLUE)Creating release...$(NC)"
	@npm run release

release-dry: ## Dry run release process
	@echo "$(BLUE)Dry run release...$(NC)"
	@npm run release -- --dry-run

## Workspace Commands
workspace-build: ## Build specific workspace
	@echo "$(BLUE)Building workspace: $(WORKSPACE)$(NC)"
	@npm run build --workspace=$(WORKSPACE)

workspace-test: ## Test specific workspace
	@echo "$(BLUE)Testing workspace: $(WORKSPACE)$(NC)"
	@npm run test --workspace=$(WORKSPACE)

## Monitoring Commands
logs: ## View application logs
	@echo "$(BLUE)Viewing logs...$(NC)"
	@docker-compose -f infrastructure/docker/docker-compose.yml logs -f

health: ## Check application health
	@echo "$(BLUE)Checking application health...$(NC)"
	@curl -f http://localhost:3000/health || echo "$(RED)Application is not healthy$(NC)"

## Development Utilities
fresh-install: ## Fresh install (clean + install)
	@make clean
	@make install

reset: ## Reset development environment
	@echo "$(BLUE)Resetting development environment...$(NC)"
	@make clean
	@make setup

validate: ## Validate project setup
	@echo "$(BLUE)Validating project setup...$(NC)"
	@node tools/scripts/validate-setup.js

## Git Utilities
git-hooks: ## Install Git hooks
	@echo "$(BLUE)Installing Git hooks...$(NC)"
	@npx husky install

pre-commit: ## Run pre-commit checks manually
	@echo "$(BLUE)Running pre-commit checks...$(NC)"
	@npx lint-staged

## Documentation
docs: ## Generate documentation
	@echo "$(BLUE)Generating documentation...$(NC)"
	@echo "Documentation available in ./docs/"

docs-serve: ## Serve documentation locally
	@echo "$(BLUE)Serving documentation...$(NC)"
	@python3 -m http.server 8080 --directory docs

## Quality Gates
quality-gate: ## Run comprehensive quality checks
	@echo "$(BLUE)Running quality gate checks...$(NC)"
	@make lint
	@make typecheck
	@make test-coverage
	@make security-audit
	@make build
	@echo "$(GREEN)✅ All quality gates passed!$(NC)"

## Print Status
status: ## Show project status
	@echo "$(BLUE)Project Status$(NC)"
	@echo "Node version: $$(node --version)"
	@echo "NPM version: $$(npm --version)"
	@echo "Git branch: $$(git branch --show-current)"
	@echo "Git status: $$(git status --porcelain | wc -l) changes"