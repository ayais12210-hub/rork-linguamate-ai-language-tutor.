.PHONY: up down health lint test typecheck build clean fmt install

# Install dependencies
install:
	pnpm install

# Start development server
up:
	pnpm dev

# Stop development server
down:
	pkill -f "tsx watch" || true

# Run health checks
health:
	pnpm health

# Run health checks in CI mode
health-ci:
	pnpm health:ci

# Lint code
lint:
	pnpm lint

# Type check
typecheck:
	pnpm typecheck

# Run tests
test:
	pnpm test

# Run tests in watch mode
test-watch:
	pnpm test:watch

# Build for production
build:
	pnpm build

# Format code
fmt:
	pnpm fmt

# Check formatting
fmt-check:
	pnpm fmt:check

# Clean build artifacts and dependencies
clean:
	pnpm clean

# Quick setup for development
dev-setup: install
	@echo "Setting up development environment..."
	@if [ ! -f .env ]; then \
		echo "Creating .env from .env.example..."; \
		cp .env.example .env; \
		echo "Please edit .env with your API keys"; \
	fi
	@echo "Development setup complete!"

# Enable a server (usage: make enable-server SERVER=github)
enable-server:
	@if [ -z "$(SERVER)" ]; then \
		echo "Usage: make enable-server SERVER=<server-name>"; \
		echo "Available servers:"; \
		ls servers/*.yaml | sed 's/servers\///g' | sed 's/\.yaml//g' | sort; \
		exit 1; \
	fi
	@if [ ! -f "servers/$(SERVER).yaml" ]; then \
		echo "Server $(SERVER) not found"; \
		exit 1; \
	fi
	@echo "Enabling server: $(SERVER)"
	@echo "Edit config/local.yaml or config/dev.yaml to enable:"
	@echo "features:"
	@echo "  $(SERVER):"
	@echo "    enabled: true"

# Show server status
status:
	@echo "Server Status:"
	@curl -s http://localhost:3000/servers | jq . || echo "Orchestrator not running"

# Show health status
health-status:
	@echo "Health Status:"
	@curl -s http://localhost:3000/healthz | jq . || echo "Orchestrator not running"

# Show metrics
metrics:
	@echo "Metrics:"
	@curl -s http://localhost:3000/metrics || echo "Orchestrator not running"