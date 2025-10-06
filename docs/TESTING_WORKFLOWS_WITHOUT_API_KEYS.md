# Testing GitHub Workflows Without API Keys

This guide demonstrates how to test GitHub workflows without hardcoding API keys, ensuring security and proper configuration validation.

## Overview

The repository includes several test workflows that demonstrate how to:
- Validate workflow syntax without executing API calls
- Test with mock secrets and environment variables
- Run dry-run validations for various tools
- Ensure proper secret management

## Test Workflows

### 1. General Workflow Testing (`test-workflows-without-api-keys.yml`)

This workflow provides comprehensive testing capabilities:

#### Features:
- **Dry Run Validation**: Tests workflow syntax without executing API calls
- **Mock Secrets Testing**: Uses mock environment variables for testing
- **Syntax Validation**: Validates YAML syntax and workflow structure
- **Secret Detection**: Scans for hardcoded secrets in workflow files
- **Trigger Validation**: Validates workflow triggers and conditions

#### Usage:
```bash
# Manual trigger with specific test type
gh workflow run test-workflows-without-api-keys.yml -f test_type=dry-run

# Available test types:
# - dry-run: Basic syntax and secret validation
# - mock-secrets: Test with mock environment variables
# - syntax-validation: Comprehensive syntax checking
# - all: Run all tests
```

### 2. EAS Build Testing (`test-eas-builds-dry-run.yml`)

Tests EAS (Expo Application Services) configuration without requiring actual API keys:

#### Features:
- **EAS Configuration Validation**: Checks `eas.json` and app configuration
- **Build Profile Testing**: Validates build profiles without executing builds
- **Expo Configuration**: Tests Expo CLI setup and configuration
- **Build Simulation**: Simulates build process without compilation

#### Usage:
```bash
# Test specific platform and profile
gh workflow run test-eas-builds-dry-run.yml -f platform=android -f profile=preview
```

### 3. Security Workflow Testing (`test-security-workflows-dry-run.yml`)

Tests security scanning tools without requiring API keys:

#### Features:
- **Semgrep Testing**: Tests static analysis without API calls
- **Gitleaks Testing**: Tests secret scanning with local rules
- **CodeQL Testing**: Validates CodeQL configuration
- **NPM Audit Testing**: Tests dependency vulnerability scanning
- **Security Configuration**: Validates security-related files

#### Usage:
```bash
# Test specific security tool
gh workflow run test-security-workflows-dry-run.yml -f security_tool=semgrep

# Available tools:
# - all: Test all security tools
# - semgrep: Test static analysis
# - gitleaks: Test secret scanning
# - codeql: Test CodeQL configuration
# - npm-audit: Test dependency scanning
```

## Best Practices

### 1. Secret Management

#### ✅ Good Practices:
```yaml
# Use GitHub secrets
env:
  EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
  GITLEAKS_LICENSE: ${{ secrets.GITLEAKS_LICENSE }}

# Use environment variables
run: |
  echo "Testing with mock token: ${MOCK_TOKEN:0:10}..."
```

#### ❌ Avoid:
```yaml
# Never hardcode secrets
env:
  EXPO_TOKEN: "sk-1234567890abcdef"
  API_KEY: "hardcoded-key-here"
```

### 2. Dry Run Testing

#### EAS Builds:
```yaml
# Test EAS configuration without builds
- name: Test EAS config
  run: |
    eas build --help
    eas whoami || echo "Expected to fail without token"
```

#### Security Tools:
```yaml
# Test Semgrep without API calls
- name: Test Semgrep
  run: |
    semgrep --config=auto --dry-run .
    semgrep --config=p/security-audit --dry-run .
```

### 3. Mock Environment Variables

```yaml
# Set mock environment for testing
- name: Test with mock env
  run: |
    export EXPO_TOKEN="mock-expo-token-12345"
    export GITLEAKS_LICENSE="mock-gitleaks-license-67890"
    # Test your application logic
```

### 4. Configuration Validation

```yaml
# Validate configuration files
- name: Validate config
  run: |
    # Check if required files exist
    [ -f "eas.json" ] || exit 1
    [ -f "app.json" ] || exit 1
    
    # Validate JSON syntax
    jq '.' eas.json > /dev/null
    jq '.' app.json > /dev/null
```

## Running Tests

### Manual Execution

1. **Via GitHub UI**:
   - Go to Actions tab
   - Select the test workflow
   - Click "Run workflow"
   - Choose test parameters

2. **Via GitHub CLI**:
   ```bash
   # Test all workflows
   gh workflow run test-workflows-without-api-keys.yml
   
   # Test EAS builds
   gh workflow run test-eas-builds-dry-run.yml
   
   # Test security workflows
   gh workflow run test-security-workflows-dry-run.yml
   ```

### Automated Execution

The test workflows run automatically on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches
- Manual workflow dispatch

## Expected Results

### Successful Test Run:
- ✅ No hardcoded secrets detected
- ✅ Workflow syntax is valid
- ✅ Configuration files are properly structured
- ✅ Mock testing environment works correctly
- ✅ Security tools can run without API calls

### Common Issues and Solutions:

1. **Hardcoded Secrets Found**:
   - Replace with `${{ secrets.SECRET_NAME }}`
   - Use environment variables for testing

2. **Configuration Validation Failed**:
   - Check file syntax (JSON/YAML)
   - Verify required fields are present
   - Ensure proper file structure

3. **Mock Testing Failed**:
   - Verify environment variable names
   - Check application logic handles missing values
   - Ensure proper error handling

## Security Considerations

1. **Never commit secrets** to the repository
2. **Use GitHub secrets** for sensitive data
3. **Test with mock data** before using real secrets
4. **Validate configurations** before deployment
5. **Use dry-run modes** when available

## Troubleshooting

### Common Commands:

```bash
# Check workflow syntax
yamllint .github/workflows/*.yml

# Validate JSON files
jq '.' eas.json
jq '.' app.json

# Test EAS configuration
eas build --help
eas whoami

# Test security tools
semgrep --version
gitleaks version
npm audit --version
```

### Debug Mode:

Add debug output to workflows:
```yaml
- name: Debug information
  run: |
    echo "Current directory: $(pwd)"
    echo "Available files: $(ls -la)"
    echo "Environment variables: $(env | grep -E '(EXPO|GITHUB|NODE)')"
```

## Conclusion

These test workflows provide a comprehensive way to validate GitHub workflows without exposing sensitive API keys. They ensure proper configuration, security best practices, and help catch issues before they reach production.

For questions or issues, refer to the workflow logs and this documentation.