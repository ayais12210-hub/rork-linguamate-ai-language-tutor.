#!/bin/bash

# Linguamate AI Tutor - Development Scripts
# Senior Engineer Ops - Make targets implementation

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Setup target
setup() {
    log_info "Setting up Linguamate AI Tutor development environment..."
    
    # Check Node.js version
    if command_exists node; then
        NODE_VERSION=$(node --version)
        log_info "Node.js version: $NODE_VERSION"
        if [[ ! "$NODE_VERSION" =~ ^v(18|20|22) ]]; then
            log_warning "Node.js version should be 18, 20, or 22. Current: $NODE_VERSION"
        fi
    else
        log_error "Node.js not found. Please install Node.js 18+ first."
        exit 1
    fi
    
    # Check pnpm
    if command_exists pnpm; then
        PNPM_VERSION=$(pnpm --version)
        log_info "pnpm version: $PNPM_VERSION"
    else
        log_warning "pnpm not found. Installing pnpm..."
        npm install -g pnpm
    fi
    
    # Install dependencies
    log_info "Installing dependencies..."
    pnpm install
    
    # Copy environment file if it doesn't exist
    if [ ! -f .env ]; then
        if [ -f .env.example ]; then
            log_info "Copying .env.example to .env..."
            cp .env.example .env
            log_warning "Please update .env with your actual values"
        else
            log_warning "No .env.example found. You may need to create .env manually."
        fi
    fi
    
    # Verify MCP configuration
    log_info "Verifying MCP configuration..."
    if [ -f .mcp/servers.json ]; then
        log_success "MCP servers configuration found"
    else
        log_warning "MCP servers configuration not found at .mcp/servers.json"
    fi
    
    # Create necessary directories
    log_info "Creating necessary directories..."
    mkdir -p reports
    mkdir -p storage/audio
    mkdir -p storage/content
    mkdir -p storage/cache
    
    log_success "Setup completed successfully!"
}

# Typecheck target
typecheck() {
    log_info "Running TypeScript type checking..."
    
    if command_exists tsc; then
        tsc --noEmit
        log_success "TypeScript type checking passed"
    else
        log_error "TypeScript compiler not found. Run 'pnpm install' first."
        exit 1
    fi
}

# Lint target
lint() {
    log_info "Running ESLint..."
    
    if command_exists eslint; then
        eslint . --ext .ts,.tsx --max-warnings=0 --report-unused-disable-directives
        log_success "ESLint passed"
    else
        log_error "ESLint not found. Run 'pnpm install' first."
        exit 1
    fi
    
    log_info "Running Prettier format check..."
    if command_exists prettier; then
        prettier . --check
        log_success "Prettier format check passed"
    else
        log_error "Prettier not found. Run 'pnpm install' first."
        exit 1
    fi
    
    # Web-specific a11y checks
    log_info "Running accessibility checks..."
    if command_exists playwright; then
        playwright test -c playwright.a11y.config.ts --reporter=line || {
            log_warning "Accessibility tests failed - check output above"
        }
    else
        log_warning "Playwright not found. Install with: pnpm install playwright"
    fi
}

# Test target
test() {
    log_info "Running Jest unit tests..."
    
    if command_exists jest; then
        jest --coverage --coverageReporters=text --coverageReporters=cobertura
        log_success "Jest tests passed"
    else
        log_error "Jest not found. Run 'pnpm install' first."
        exit 1
    fi
    
    # Check coverage threshold
    COVERAGE_THRESHOLD=80
    COVERAGE_FILE=coverage/cobertura-coverage.xml
    
    if [ -f "$COVERAGE_FILE" ]; then
        # Extract coverage percentage (simplified)
        COVERAGE=$(grep -o 'line-rate="[0-9.]*"' "$COVERAGE_FILE" | grep -o '[0-9.]*' | head -1)
        if [[ -n "$COVERAGE" ]]; then
            # Convert coverage (e.g., 0.85) to integer percent (e.g., 85)
            COVERAGE_INT=${COVERAGE/./}
            # Pad with zero if necessary (e.g., 0.9 -> 90)
            if [[ "$COVERAGE" == 0.* && ${#COVERAGE_INT} -eq 1 ]]; then
                COVERAGE_INT="${COVERAGE_INT}0"
            fi
            COVERAGE_PERCENT=$((10#$COVERAGE_INT))
            if [ "$COVERAGE_PERCENT" -lt "$COVERAGE_THRESHOLD" ]; then
                log_error "Coverage $COVERAGE_PERCENT% is below threshold $COVERAGE_THRESHOLD%"
                exit 1
            else
                log_success "Coverage $COVERAGE_PERCENT% meets threshold $COVERAGE_THRESHOLD%"
            fi
        fi
    fi
}

# Audit target
audit() {
    log_info "Running security audit..."
    
    # npm audit
    if command_exists npm; then
        npm audit --audit-level=high || {
            log_warning "npm audit found vulnerabilities - check output above"
        }
    fi
    
    # Semgrep security scan
    if command_exists semgrep; then
        log_info "Running Semgrep security scan..."
        semgrep --config=auto . || {
            log_warning "Semgrep found potential security issues - check output above"
        }
    else
        log_warning "Semgrep not found. Install with: pip install semgrep"
    fi
    
    # Gitleaks scan
    if command_exists gitleaks; then
        log_info "Running Gitleaks scan..."
        gitleaks detect --config .gitleaks.toml --verbose || {
            log_warning "Gitleaks found potential secrets - check output above"
        }
    else
        log_warning "Gitleaks not found. Install from: https://github.com/gitleaks/gitleaks"
    fi
    
    log_success "Security audit completed"
}

# Build target
build() {
    log_info "Building application..."
    
    # TypeScript build
    typecheck
    
    # Web build
    log_info "Building web application..."
    if command_exists expo; then
        expo export --platform web
        log_success "Web build completed"
    else
        log_error "Expo CLI not found. Install with: npm install -g @expo/cli"
        exit 1
    fi
    
    # Backend build
    log_info "Building backend..."
    if [ -d "backend" ]; then
        cd backend
        if command_exists tsc; then
            tsc --noEmit
            log_success "Backend type checking passed"
        fi
        cd ..
    fi
    
    log_success "Build completed successfully!"
}

# Health target
health() {
    log_info "Running health checks..."
    
    # Check if backend is running
    if curl -s http://localhost:3000/api/health >/dev/null 2>&1; then
        log_success "Backend API is healthy"
    else
        log_warning "Backend API not responding at http://localhost:3000/api/health"
    fi
    
    # Check TTS service
    if curl -s http://localhost:3000/api/tts/health >/dev/null 2>&1; then
        log_success "TTS service is healthy"
    else
        log_warning "TTS service not responding"
    fi
    
    # Check STT service
    if curl -s http://localhost:3000/api/stt/health >/dev/null 2>&1; then
        log_success "STT service is healthy"
    else
        log_warning "STT service not responding"
    fi
    
    # Check storage
    if [ -d "storage" ] && [ -w "storage" ]; then
        log_success "Storage directory is accessible"
    else
        log_warning "Storage directory not accessible"
    fi
    
    # Check vector store (if configured)
    if curl -s http://localhost:3000/api/vector/health >/dev/null 2>&1; then
        log_success "Vector store is healthy"
    else
        log_warning "Vector store not responding"
    fi
    
    # Run omni-mcp health check
    if [ -f "omni-mcp/scripts/health.ts" ]; then
        log_info "Running omni-mcp health check..."
        cd omni-mcp
        if command_exists tsx; then
            tsx scripts/health.ts || {
                log_warning "omni-mcp health check failed"
            }
        else
            log_warning "tsx not found. Install with: npm install -g tsx"
        fi
        cd ..
    fi
    
    log_success "Health checks completed"
}

# Content validation target
validate-content() {
    log_info "Validating content..."
    
    if [ -f "omni-mcp/scripts/validate-content.ts" ]; then
        cd omni-mcp
        if command_exists tsx; then
            tsx scripts/validate-content.ts ../content ../reports/content-validation.json
            log_success "Content validation completed"
        else
            log_error "tsx not found. Install with: npm install -g tsx"
            exit 1
        fi
        cd ..
    else
        log_warning "Content validation script not found"
    fi
}

# Speech simulation target
simulate-speech() {
    log_info "Running speech simulation..."
    
    if [ -f "omni-mcp/scripts/simulate-speech.ts" ]; then
        cd omni-mcp
        if command_exists tsx; then
            tsx scripts/simulate-speech.ts 3 ../reports/speech-simulation.json
            log_success "Speech simulation completed"
        else
            log_error "tsx not found. Install with: npm install -g tsx"
            exit 1
        fi
        cd ..
    else
        log_warning "Speech simulation script not found"
    fi
}

# Full scan target
scan() {
    log_info "Running full development scan..."
    
    typecheck
    lint
    test
    audit
    build
    health
    
    log_success "Full scan completed successfully!"
}

# Clean target
clean() {
    log_info "Cleaning build artifacts..."
    
    rm -rf dist
    rm -rf build
    rm -rf coverage
    rm -rf .expo
    rm -rf node_modules/.cache
    
    log_success "Clean completed"
}

# Help target
help() {
    echo "Linguamate AI Tutor - Development Make Targets"
    echo "=============================================="
    echo ""
    echo "Available targets:"
    echo "  setup           - Set up development environment"
    echo "  typecheck       - Run TypeScript type checking"
    echo "  lint            - Run ESLint and Prettier checks"
    echo "  test            - Run Jest unit tests with coverage"
    echo "  audit           - Run security audits (npm, semgrep, gitleaks)"
    echo "  build           - Build application (web + backend)"
    echo "  health          - Run health checks on all services"
    echo "  validate-content - Validate content against schemas"
    echo "  simulate-speech - Run speech pipeline simulation"
    echo "  scan            - Run full development scan"
    echo "  clean           - Clean build artifacts"
    echo "  help            - Show this help message"
    echo ""
    echo "Usage: make <target>"
    echo "Example: make setup"
}

# Main script logic
case "${1:-help}" in
    setup)
        setup
        ;;
    typecheck)
        typecheck
        ;;
    lint)
        lint
        ;;
    test)
        test
        ;;
    audit)
        audit
        ;;
    build)
        build
        ;;
    health)
        health
        ;;
    validate-content)
        validate-content
        ;;
    simulate-speech)
        simulate-speech
        ;;
    scan)
        scan
        ;;
    clean)
        clean
        ;;
    help|--help|-h)
        help
        ;;
    *)
        log_error "Unknown target: $1"
        help
        exit 1
        ;;
esac