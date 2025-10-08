# Linguamate AI Tutor - Makefile
# Senior Engineer Ops - Development targets

.PHONY: setup typecheck lint test audit build health validate-content simulate-speech scan clean help

# Default target
help:
	@echo "Linguamate AI Tutor - Development Make Targets"
	@echo "=============================================="
	@echo ""
	@echo "Available targets:"
	@echo "  setup           - Set up development environment"
	@echo "  typecheck       - Run TypeScript type checking"
	@echo "  lint            - Run ESLint and Prettier checks"
	@echo "  test            - Run Jest unit tests with coverage"
	@echo "  audit           - Run security audits (npm, semgrep, gitleaks)"
	@echo "  build           - Build application (web + backend)"
	@echo "  health          - Run health checks on all services"
	@echo "  validate-content - Validate content against schemas"
	@echo "  simulate-speech - Run speech pipeline simulation"
	@echo "  scan            - Run full development scan"
	@echo "  clean           - Clean build artifacts"
	@echo "  help            - Show this help message"
	@echo ""
	@echo "Usage: make <target>"
	@echo "Example: make setup"

# Setup development environment
setup:
	@bash scripts/make.sh setup

# TypeScript type checking
typecheck:
	@bash scripts/make.sh typecheck

# Linting and formatting
lint:
	@bash scripts/make.sh lint

# Unit tests with coverage
test:
	@bash scripts/make.sh test

# Security audits
audit:
	@bash scripts/make.sh audit

# Build application
build:
	@bash scripts/make.sh build

# Health checks
health:
	@bash scripts/make.sh health

# Content validation
validate-content:
	@bash scripts/make.sh validate-content

# Speech simulation
simulate-speech:
	@bash scripts/make.sh simulate-speech

# Full development scan
scan:
	@bash scripts/make.sh scan

# Clean build artifacts
clean:
	@bash scripts/make.sh clean