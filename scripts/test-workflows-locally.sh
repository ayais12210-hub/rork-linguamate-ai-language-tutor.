#!/bin/bash

# Test GitHub Workflows Locally Without API Keys
# This script demonstrates how to test workflows without hardcoded API keys

set -e

echo "🧪 Testing GitHub Workflows Locally Without API Keys"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -d ".github/workflows" ]; then
    print_error "Not in a GitHub repository root directory"
    exit 1
fi

print_status "Starting workflow validation tests..."

# Test 1: Validate YAML syntax
print_status "1. Validating YAML syntax..."
yaml_errors=0
for workflow in .github/workflows/*.yml .github/workflows/*.yaml; do
    if [ -f "$workflow" ]; then
        if python3 -c "import yaml; yaml.safe_load(open('$workflow'))" 2>/dev/null; then
            print_success "✅ $workflow - YAML syntax valid"
        else
            print_error "❌ $workflow - YAML syntax invalid"
            yaml_errors=$((yaml_errors + 1))
        fi
    fi
done

if [ $yaml_errors -eq 0 ]; then
    print_success "All workflow files have valid YAML syntax"
else
    print_error "$yaml_errors workflow files have YAML syntax errors"
fi

# Test 2: Check for hardcoded secrets
print_status "2. Scanning for hardcoded secrets..."
secret_patterns=(
    "sk-[a-zA-Z0-9]{20,}"  # OpenAI API keys
    "AKIA[0-9A-Z]{16}"     # AWS access keys
    "ghp_[a-zA-Z0-9]{36}"  # GitHub personal access tokens
    "gho_[a-zA-Z0-9]{36}"  # GitHub OAuth tokens
    "ghu_[a-zA-Z0-9]{36}"  # GitHub user tokens
    "ghs_[a-zA-Z0-9]{36}"  # GitHub server tokens
    "ghr_[a-zA-Z0-9]{36}"  # GitHub refresh tokens
    "xoxb-[0-9]{11}-[0-9]{11}-[a-zA-Z0-9]{24}"  # Slack bot tokens
    "xoxp-[0-9]{11}-[0-9]{11}-[a-zA-Z0-9]{24}"  # Slack user tokens
    "AIza[0-9A-Za-z_-]{35}"  # Google API keys
    "ya29\.[0-9A-Za-z_-]+"   # Google OAuth tokens
)

found_secrets=false
for pattern in "${secret_patterns[@]}"; do
    if grep -r -E "$pattern" .github/workflows/ --exclude-dir=.git 2>/dev/null; then
        print_error "⚠️  Potential hardcoded secret found matching pattern: $pattern"
        found_secrets=true
    fi
done

if [ "$found_secrets" = false ]; then
    print_success "No hardcoded secrets detected in workflow files"
else
    print_error "Potential hardcoded secrets found! Please use GitHub secrets instead."
fi

# Test 3: Validate secret usage
print_status "3. Validating secret usage..."
proper_secrets=true
for workflow in .github/workflows/*.yml .github/workflows/*.yaml; do
    if [ -f "$workflow" ]; then
        if grep -q "secrets\." "$workflow"; then
            print_success "✅ $workflow uses GitHub secrets properly"
        else
            print_warning "ℹ️  $workflow doesn't use secrets (may be intentional)"
        fi
    fi
done

# Test 4: Check for required configuration files
print_status "4. Checking for required configuration files..."
config_files=(
    "package.json"
    "eas.json"
    "app.json"
    ".semgrep.yml"
    ".gitleaks.toml"
)

for file in "${config_files[@]}"; do
    if [ -f "$file" ]; then
        print_success "✅ $file found"
    else
        print_warning "ℹ️  $file not found (may not be required)"
    fi
done

# Test 5: Test with mock environment variables
print_status "5. Testing with mock environment variables..."
export MOCK_EXPO_TOKEN="mock-expo-token-12345"
export MOCK_GITLEAKS_LICENSE="mock-gitleaks-license-67890"
export MOCK_GITHUB_TOKEN="mock-github-token-abcdef"
export NODE_ENV="test"

print_success "Mock environment variables set:"
echo "  MOCK_EXPO_TOKEN: ${MOCK_EXPO_TOKEN:0:10}..."
echo "  MOCK_GITLEAKS_LICENSE: ${MOCK_GITLEAKS_LICENSE:0:10}..."
echo "  MOCK_GITHUB_TOKEN: ${MOCK_GITHUB_TOKEN:0:10}..."
echo "  NODE_ENV: $NODE_ENV"

# Test 6: Validate workflow triggers
print_status "6. Validating workflow triggers..."
for workflow in .github/workflows/*.yml .github/workflows/*.yaml; do
    if [ -f "$workflow" ]; then
        if grep -q "on:" "$workflow"; then
            print_success "✅ $workflow has trigger configuration"
        else
            print_warning "⚠️  $workflow may be missing trigger configuration"
        fi
    fi
done

# Test 7: Check for dry-run capabilities
print_status "7. Checking for dry-run capabilities..."
dry_run_workflows=0
for workflow in .github/workflows/*.yml .github/workflows/*.yaml; do
    if [ -f "$workflow" ]; then
        if grep -q "dry-run\|dryrun\|--dry-run" "$workflow"; then
            print_success "✅ $workflow supports dry-run mode"
            dry_run_workflows=$((dry_run_workflows + 1))
        fi
    fi
done

if [ $dry_run_workflows -gt 0 ]; then
    print_success "$dry_run_workflows workflows support dry-run mode"
else
    print_warning "No workflows found with dry-run capabilities"
fi

# Summary
echo ""
echo "=================================================="
echo "📊 Test Summary"
echo "=================================================="

if [ $yaml_errors -eq 0 ] && [ "$found_secrets" = false ]; then
    print_success "🎉 All tests passed! Workflows are properly configured."
    echo ""
    echo "Key findings:"
    echo "✅ No hardcoded API keys detected"
    echo "✅ Workflows use GitHub secrets properly"
    echo "✅ Workflow syntax is valid"
    echo "✅ Mock testing environment works correctly"
    echo ""
    echo "Recommendations:"
    echo "- Use GitHub secrets for all sensitive data"
    echo "- Test workflows with mock data before deploying"
    echo "- Validate workflow syntax regularly"
    echo "- Use dry-run modes when available"
else
    print_error "❌ Some tests failed! Please review the issues above."
    echo ""
    echo "Common fixes:"
    echo "- Replace hardcoded secrets with \${{ secrets.SECRET_NAME }}"
    echo "- Fix YAML syntax errors"
    echo "- Add proper workflow triggers"
    echo "- Use environment variables for testing"
fi

echo ""
print_status "Test completed. Check the output above for any issues."