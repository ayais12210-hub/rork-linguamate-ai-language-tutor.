# 🔒 Gitleaks Secret Scanning Setup

This document explains the gitleaks configuration and usage for the Linguamate project.

## Overview

Gitleaks is a SAST tool for detecting and preventing hardcoded secrets like passwords, API keys, and tokens in git repos. It's integrated into our CI/CD pipeline and local development workflow.

## Configuration

### Main Configuration File
- **File**: `.gitleaks.toml`
- **Purpose**: Defines detection rules, allowlists, and project-specific patterns

### Key Features
- **Comprehensive allowlist**: Excludes test files, documentation, and common false positives
- **Project-specific rules**: Custom patterns for Expo/React Native development
- **Multiple file type support**: Scans all file types for secrets
- **Redaction**: Automatically redacts secrets in reports

## Usage

### Local Development

#### Install Gitleaks
```bash
# Option 1: Using npm (if available)
npm install -g gitleaks

# Option 2: Download binary
# Visit: https://github.com/gitleaks/gitleaks/releases
# Download appropriate binary for your OS
```

#### Run Scans
```bash
# Scan current working directory
npm run gitleaks:scan

# Scan only staged files (pre-commit)
npm run gitleaks:scan:staged

# Scan full git history
npm run gitleaks:scan:history

# Generate JSON report
npm run gitleaks:scan:report
```

#### Pre-commit Hook
Gitleaks automatically runs on staged files before each commit via lint-staged:
```bash
# This runs automatically when you commit
git add .
git commit -m "feat: add new feature"
# Gitleaks will scan staged files and block commit if secrets found
```

### CI/CD Pipeline

#### GitHub Actions
- **Workflow**: `.github/workflows/gitleaks.yml`
- **Triggers**: PRs, pushes to main/develop, nightly schedule
- **Reports**: SARIF format uploaded to GitHub Security tab

#### Security Workflow
- **Workflow**: `.github/workflows/security.yml`
- **Integration**: Part of comprehensive security scanning
- **Tools**: Gitleaks + CodeQL + Semgrep + NPM audit

## Configuration Details

### Allowlist Patterns

#### File Exclusions
```toml
files = [
  "**/*.test.*",           # Test files
  "**/__tests__/**",       # Test directories
  "**/coverage/**",        # Coverage reports
  "**/node_modules/**",    # Dependencies
  "**/.expo/**",           # Expo build artifacts
  "**/android/**",         # Android build files
  "**/ios/**",             # iOS build files
  "**/web-build/**",       # Web build output
]
```

#### Regex Exclusions
```toml
regexes = [
  # Test patterns
  '''(?i)(test|dummy|fake|mock)_(api|token|key|secret)_[0-9a-f]{8,32}''',
  
  # Development patterns
  '''localhost:[0-9]+''',
  '''127\.0\.0\.1:[0-9]+''',
  
  # Expo/React Native patterns
  '''expo://.*''',
  '''rork://.*''',
  
  # Common placeholders
  '''change_me.*''',
  '''your_.*_here''',
  '''<.*>''',
]
```

### Custom Rules

#### Project-Specific Patterns
```toml
[[rules]]
id = "linguamate-specific"
description = "Linguamate project specific patterns"
regex = '''(?i)(rork|linguamate|expo|react-native).*[0-9a-f]{8,32}'''
tags = ["linguamate", "expo", "react-native"]
```

## Common Scenarios

### Adding New Allowlist Entries

1. **Identify false positive**: Run gitleaks and note the detected pattern
2. **Add to allowlist**: Update `.gitleaks.toml` with appropriate regex
3. **Test locally**: Run `npm run gitleaks:scan` to verify
4. **Commit changes**: Update configuration and commit

### Handling Real Secrets

If gitleaks detects a real secret:

1. **Immediately rotate the secret** in your service
2. **Remove from code** and use environment variables
3. **Add to .env.example** if it's a required configuration
4. **Update documentation** to explain the required environment variable

### Environment Variables

Use these environment variables for secrets:
```bash
# API Keys
TOOLKIT_API_KEY=your_actual_key_here
EXPO_PUBLIC_RC_API_KEY=your_actual_key_here

# Database URLs
DATABASE_URL=postgresql://user:pass@host:port/db

# JWT Secrets
JWT_SECRET=your_super_secret_jwt_key

# Third-party services
SENTRY_DSN=your_sentry_dsn_here
DATADOG_API_KEY=your_datadog_key_here
```

## Troubleshooting

### Common Issues

#### False Positives
- **Symptom**: Gitleaks flags legitimate code as secrets
- **Solution**: Add appropriate regex to allowlist in `.gitleaks.toml`

#### Pre-commit Hook Fails
- **Symptom**: `gitleaks: command not found` during commit
- **Solution**: Install gitleaks locally or use `npx gitleaks`

#### CI Pipeline Fails
- **Symptom**: GitHub Actions gitleaks step fails
- **Solution**: Check workflow configuration and ensure `.gitleaks.toml` is valid

### Debugging

#### Verbose Output
```bash
# Run with verbose logging
gitleaks detect --config .gitleaks.toml --verbose

# Check specific file
gitleaks detect --config .gitleaks.toml --source /path/to/file
```

#### Validate Configuration
```bash
# Test configuration syntax
gitleaks detect --config .gitleaks.toml --dry-run
```

## Best Practices

### Development
1. **Never commit secrets** - Use environment variables
2. **Test locally** - Run gitleaks before pushing
3. **Update allowlist** - Add legitimate patterns as needed
4. **Document secrets** - Update `.env.example` for required variables

### CI/CD
1. **Monitor reports** - Check GitHub Security tab regularly
2. **Fix immediately** - Address any detected secrets promptly
3. **Rotate secrets** - If a secret is exposed, rotate it immediately
4. **Update documentation** - Keep this guide current

## Integration with Other Tools

### Security Stack
- **Gitleaks**: Secret detection
- **CodeQL**: Code analysis
- **Semgrep**: Security patterns
- **NPM Audit**: Dependency vulnerabilities
- **Dependency Review**: License compliance

### Development Tools
- **Husky**: Git hooks
- **Lint-staged**: Pre-commit checks
- **ESLint**: Code quality
- **Prettier**: Code formatting

## Resources

- [Gitleaks Documentation](https://github.com/gitleaks/gitleaks)
- [GitHub Secret Scanning](https://docs.github.com/en/code-security/secret-scanning)
- [OWASP Secrets Management](https://owasp.org/www-project-secrets-management/)
- [Environment Variables Best Practices](https://12factor.net/config)

## Support

For issues with gitleaks configuration or false positives:
1. Check this documentation first
2. Review `.gitleaks.toml` configuration
3. Test locally with verbose output
4. Create issue with detailed information