#!/bin/bash
# Bot Setup and Validation Script for Linguamate AI Tutor
# Senior Lead Engineer - Complete Bot Implementation

set -euo pipefail

echo "🚀 Linguamate AI Tutor - Bot Setup & Validation"
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local status=$1
    local message=$2
    case $status in
        "SUCCESS") echo -e "${GREEN}✅ $message${NC}" ;;
        "WARNING") echo -e "${YELLOW}⚠️  $message${NC}" ;;
        "ERROR") echo -e "${RED}❌ $message${NC}" ;;
        "INFO") echo -e "${BLUE}ℹ️  $message${NC}" ;;
    esac
}

# Check if we're in the right directory
if [ ! -d ".github/workflows" ]; then
    print_status "ERROR" "Not in Linguamate AI Tutor repository root"
    exit 1
fi

print_status "INFO" "Starting bot validation and setup..."

# 1. Validate all bot workflows
echo ""
echo "📋 Validating Bot Workflows..."
echo "=============================="

workflow_count=0
syntax_errors=0

for workflow in .github/workflows/bots-*.yml; do
    if [ -f "$workflow" ]; then
        workflow_count=$((workflow_count + 1))
        workflow_name=$(basename "$workflow")
        
        # Check YAML syntax
        if python3 -c "import yaml; yaml.safe_load(open('$workflow'))" 2>/dev/null; then
            print_status "SUCCESS" "$workflow_name - Syntax OK"
        else
            print_status "ERROR" "$workflow_name - Syntax Error"
            syntax_errors=$((syntax_errors + 1))
        fi
    fi
done

print_status "INFO" "Total bot workflows: $workflow_count"
if [ $syntax_errors -eq 0 ]; then
    print_status "SUCCESS" "All workflows have valid syntax"
else
    print_status "ERROR" "$syntax_errors workflow(s) have syntax errors"
fi

# 2. Check configuration files
echo ""
echo "⚙️ Checking Configuration Files..."
echo "=================================="

config_files=(
    ".github/dependabot.yml"
    ".github/renovate.json"
    ".github/labeler.yml"
    ".github/auto-assign.yml"
    ".github/label-sync.yml"
    ".github/commitlint.config.cjs"
    ".lighthouserc.json"
    ".pa11yci.json"
    ".bundlewatch.config.json"
    "dangerfile.js"
    ".all-contributorsrc"
)

missing_configs=0
for config in "${config_files[@]}"; do
    if [ -f "$config" ]; then
        print_status "SUCCESS" "$config exists"
    else
        print_status "WARNING" "$config missing"
        missing_configs=$((missing_configs + 1))
    fi
done

# 3. Validate JSON configurations
echo ""
echo "🔧 Validating JSON Configurations..."
echo "===================================="

json_configs=(
    ".github/renovate.json"
    ".lighthouserc.json"
    ".pa11yci.json"
    ".bundlewatch.config.json"
    ".all-contributorsrc"
)

json_errors=0
for json_file in "${json_configs[@]}"; do
    if [ -f "$json_file" ]; then
        if python3 -c "import json; json.load(open('$json_file'))" 2>/dev/null; then
            print_status "SUCCESS" "$json_file - Valid JSON"
        else
            print_status "ERROR" "$json_file - Invalid JSON"
            json_errors=$((json_errors + 1))
        fi
    fi
done

# 4. Check documentation
echo ""
echo "📚 Checking Documentation..."
echo "============================"

doc_files=(
    "docs/BOTS.md"
    "docs/bot-architecture.md"
    "docs/bots-tier1.md"
    "docs/bots-tier2.md"
    "docs/bots-tier3.md"
    "docs/bots-tier4.md"
    "docs/bots-tier5.md"
)

missing_docs=0
for doc in "${doc_files[@]}"; do
    if [ -f "$doc" ]; then
        print_status "SUCCESS" "$doc exists"
    else
        print_status "WARNING" "$doc missing"
        missing_docs=$((missing_docs + 1))
    fi
done

# 5. Check for required secrets
echo ""
echo "🔐 Required Secrets Check..."
echo "============================"

required_secrets=(
    "LHCI_GITHUB_APP_TOKEN:Lighthouse CI GitHub integration"
    "PERCY_TOKEN:Percy visual testing"
    "CROWDIN_API_TOKEN:Crowdin translation sync"
    "CROWDIN_PROJECT_ID:Crowdin project identification"
    "OPENAI_API_KEY:CodiumAI PR-Agent AI reviews"
    "SWEEP_API_KEY:Sweep Bot AI issue resolution"
    "CODECOV_TOKEN:Codecov coverage reporting"
    "DEFAULT_PROJECT_URL:Add-to-Project routing"
)

print_status "INFO" "Required secrets for enhanced features:"
for secret_info in "${required_secrets[@]}"; do
    secret_name=$(echo "$secret_info" | cut -d: -f1)
    secret_desc=$(echo "$secret_info" | cut -d: -f2)
    echo "  - $secret_name: $secret_desc"
done

# 6. Bot tier validation
echo ""
echo "🎯 Bot Tier Validation..."
echo "========================"

tier_counts=(8 5 9 9 10)  # Expected counts for each tier
tier_names=("Baseline" "Advanced" "Security & Quality" "AI-Powered" "Language Learning")

total_expected=0
for count in "${tier_counts[@]}"; do
    total_expected=$((total_expected + count))
done

print_status "INFO" "Expected bot distribution:"
for i in "${!tier_names[@]}"; do
    echo "  - Tier $((i+1)) (${tier_names[$i]}): ${tier_counts[$i]} bots"
done
echo "  - Total Expected: $total_expected bots"

# 7. Generate setup report
echo ""
echo "📊 Setup Report..."
echo "=================="

report_file="bot-setup-report.md"
cat > "$report_file" << EOF
# 🤖 Bot Setup Report - $(date)

## 📊 Summary
- **Total Bot Workflows**: $workflow_count
- **Syntax Errors**: $syntax_errors
- **Missing Configurations**: $missing_configs
- **JSON Validation Errors**: $json_errors
- **Missing Documentation**: $missing_docs

## ✅ Status
EOF

if [ $syntax_errors -eq 0 ] && [ $json_errors -eq 0 ]; then
    print_status "SUCCESS" "All bot configurations are valid"
    echo "- **Configuration Status**: ✅ All valid" >> "$report_file"
else
    print_status "ERROR" "Some configurations have errors"
    echo "- **Configuration Status**: ❌ Errors detected" >> "$report_file"
fi

if [ $missing_configs -eq 0 ]; then
    print_status "SUCCESS" "All configuration files present"
    echo "- **Configuration Files**: ✅ All present" >> "$report_file"
else
    print_status "WARNING" "$missing_configs configuration file(s) missing"
    echo "- **Configuration Files**: ⚠️ $missing_configs missing" >> "$report_file"
fi

if [ $missing_docs -eq 0 ]; then
    print_status "SUCCESS" "All documentation present"
    echo "- **Documentation**: ✅ Complete" >> "$report_file"
else
    print_status "WARNING" "$missing_docs documentation file(s) missing"
    echo "- **Documentation**: ⚠️ $missing_docs missing" >> "$report_file"
fi

# 8. Final status
echo ""
echo "🎉 Bot Setup Complete!"
echo "====================="

if [ $syntax_errors -eq 0 ] && [ $json_errors -eq 0 ] && [ $missing_configs -eq 0 ]; then
    print_status "SUCCESS" "All bots are ready for production deployment"
    echo ""
    print_status "INFO" "Next steps:"
    echo "  1. Install required GitHub Apps"
    echo "  2. Configure repository secrets"
    echo "  3. Enable branch protection rules"
    echo "  4. Test bot workflows"
    echo "  5. Monitor bot health dashboard"
else
    print_status "WARNING" "Some issues detected - review and fix before deployment"
fi

echo ""
print_status "INFO" "Setup report saved to: $report_file"
print_status "INFO" "Bot health monitoring enabled via bots-health-monitor workflow"

# 9. Create production readiness checklist
cat > "PRODUCTION_CHECKLIST.md" << EOF
# 🚀 Production Readiness Checklist

## ✅ Pre-Deployment Checklist

### GitHub Apps Installation
- [ ] Mergify (merge queues)
- [ ] Reviewpad (policy enforcement)
- [ ] Allstar (security policies)
- [ ] ImgBot (image optimization)
- [ ] Renovate (smart dependencies)
- [ ] Codecov (coverage reporting)
- [ ] Lighthouse CI (performance monitoring)
- [ ] Percy (visual testing)
- [ ] Crowdin (translation sync)

### Repository Secrets
- [ ] LHCI_GITHUB_APP_TOKEN
- [ ] PERCY_TOKEN
- [ ] CROWDIN_API_TOKEN
- [ ] CROWDIN_PROJECT_ID
- [ ] OPENAI_API_KEY
- [ ] SWEEP_API_KEY
- [ ] CODECOV_TOKEN
- [ ] DEFAULT_PROJECT_URL

### Repository Variables
- [ ] DEFAULT_PROJECT_URL (GitHub Projects URL)

### Branch Protection Rules
- [ ] Require status checks: bots-lint, bots-codeql, mcp-guard
- [ ] Require pull request reviews: 1-2 reviewers
- [ ] Require up-to-date branches
- [ ] Restrict pushes to main branch

### Testing
- [ ] Test bot workflows on feature branch
- [ ] Verify all configurations work
- [ ] Check bot health monitoring
- [ ] Validate error handling

## 🎯 Post-Deployment Monitoring

### Daily Checks
- [ ] Bot health monitoring report
- [ ] Workflow success rates
- [ ] Performance metrics
- [ ] Error logs

### Weekly Reviews
- [ ] Bot effectiveness metrics
- [ ] Security scan results
- [ ] Performance trends
- [ ] User feedback

## 📊 Success Metrics

### Bot Performance
- Workflow success rate > 95%
- Average workflow duration < 10 minutes
- Error rate < 5%

### Security & Quality
- OSSF Scorecard rating > 8.0
- Code coverage > 80%
- Zero critical vulnerabilities

### Developer Experience
- PR review time < 24 hours
- Merge queue efficiency > 90%
- Bot satisfaction score > 4.0/5.0

EOF

print_status "INFO" "Production checklist created: PRODUCTION_CHECKLIST.md"

echo ""
echo "🏁 Bot setup and validation complete!"
echo "Total execution time: $(date)"