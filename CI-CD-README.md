# 🚀 CI/CD Pipeline Documentation

## Overview

This repository has been optimized with a comprehensive CI/CD pipeline that ensures code quality, security, and reliable deployments. The pipeline is designed for a React Native Expo app with TypeScript, Jest, Playwright, and modern tooling.

## 🔧 Pipeline Architecture

### Main Workflows

1. **🚀 Main CI Pipeline** (`.github/workflows/ci-main.yml`)
   - Quick checks for PRs
   - Full CI pipeline for main/develop branches
   - Parallel execution for speed
   - Comprehensive testing and validation

2. **🔒 Enhanced Security Scan** (`.github/workflows/security-enhanced.yml`)
   - Dependency review
   - CodeQL analysis
   - NPM security audit
   - Semgrep security scan
   - Secret scanning with Gitleaks

3. **📱 EAS Mobile Builds** (`.github/workflows/eas-builds.yml`)
   - Preview builds for PRs and develop
   - Production builds for main branch and tags
   - Android APK/AAB and iOS Simulator/IPA builds

4. **🧹 Cleanup & Maintenance** (`.github/workflows/cleanup.yml`)
   - Daily cleanup of old artifacts
   - Workflow run cleanup
   - Security audits
   - Dependency update checks

## 🛠️ Key Features

### ✅ Fixed Issues

- **Package Manager Consistency**: Standardized on Bun with npm fallback
- **Dependency Caching**: Optimized caching for Bun and npm
- **Playwright Configuration**: Fixed E2E test commands
- **Missing Scripts**: Created quality score computation script
- **Workflow Concurrency**: Added auto-cancel for in-progress runs
- **Error Handling**: Improved error handling and reporting
- **Status Badges**: Generated status badges for README

### 🚀 Performance Optimizations

- **Parallel Execution**: Jobs run in parallel where possible
- **Smart Caching**: Dependencies cached across runs
- **Conditional Execution**: Different workflows for different triggers
- **Resource Optimization**: Appropriate timeouts and resource limits

### 🔒 Security Enhancements

- **Multi-layer Security**: CodeQL, Semgrep, NPM audit, Gitleaks
- **SARIF Integration**: Security results uploaded to GitHub Security tab
- **Dependency Review**: Automated dependency vulnerability scanning
- **Secret Scanning**: Prevents accidental secret commits

### 📊 Quality Gates

- **TypeScript**: Strict type checking
- **Linting**: ESLint with React Native rules
- **Formatting**: Prettier code formatting
- **Testing**: Jest unit tests with coverage
- **E2E Testing**: Playwright end-to-end tests
- **Accessibility**: A11y testing with Playwright
- **Performance**: Lighthouse CI for web builds

## 📋 Workflow Triggers

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| Main CI | PR, Push to main/develop | Core validation |
| Security Scan | PR, Push to main/develop, Weekly | Security validation |
| EAS Builds | PR, Push to main/develop, Tags | Mobile app builds |
| Cleanup | Daily, Manual | Maintenance |

## 🎯 Quality Metrics

### Coverage Thresholds
- **Global**: 80% lines, 80% functions, 75% branches, 80% statements
- **Schemas**: 95% coverage (critical business logic)
- **State Management**: 85% coverage
- **Components**: 75% coverage
- **Utilities**: 75% coverage

### Performance Targets
- **Lighthouse Performance**: 80+ score
- **Accessibility**: 90+ score
- **Best Practices**: 80+ score
- **SEO**: 80+ score

## 🔧 Environment Setup

### Required Secrets
- `EXPO_TOKEN`: Expo authentication token for builds
- `GITHUB_TOKEN`: Automatically provided
- `GITLEAKS_LICENSE`: Optional, for enhanced secret scanning

### Node.js Version
- **Primary**: Node.js 20.x
- **Package Manager**: Bun (with npm fallback)
- **Cache Strategy**: Bun lockfile + npm cache

## 📊 Status Badges

Add these badges to your README.md:

```markdown
[![CI Status](https://img.shields.io/badge/CI-Passing-green?style=flat-square&logo=github)](https://github.com/your-org/your-repo/actions/workflows/ci-main.yml)
[![Security Status](https://img.shields.io/badge/Security-Secure-green?style=flat-square&logo=security)](https://github.com/your-org/your-repo/actions/workflows/security-enhanced.yml)
[![Coverage](https://img.shields.io/badge/Coverage-85%25-green?style=flat-square&logo=codecov)](https://codecov.io/gh/your-org/your-repo)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)
```

## 🚀 Quick Start

### For Developers
1. **Pull Request**: Automatic CI runs on every PR
2. **Main Branch**: Full pipeline runs on every push
3. **Security**: Weekly security scans + PR security checks
4. **Mobile Builds**: Automatic builds for mobile platforms

### For Maintainers
1. **Monitor**: Check workflow status in GitHub Actions
2. **Security**: Review security findings in Security tab
3. **Artifacts**: Download build artifacts from workflow runs
4. **Maintenance**: Daily cleanup runs automatically

## 🔍 Troubleshooting

### Common Issues

1. **Build Failures**
   - Check Node.js version compatibility
   - Verify package manager (Bun vs npm)
   - Review dependency installation logs

2. **Test Failures**
   - Check Jest configuration
   - Verify test environment setup
   - Review coverage thresholds

3. **Security Failures**
   - Address Semgrep findings
   - Update vulnerable dependencies
   - Review secret scanning results

4. **E2E Failures**
   - Check Playwright configuration
   - Verify test server startup
   - Review browser installation

### Debug Commands

```bash
# Local testing
npm run typecheck
npm run lint
npm run test:ci
npm run e2e:ci

# Security checks
npm audit
bunx semgrep --config=.semgrep.yml

# Build verification
npm run web:build
```

## 📈 Monitoring

### Key Metrics to Monitor
- **Build Success Rate**: Should be >95%
- **Test Coverage**: Maintain >80% overall
- **Security Issues**: Address high/critical findings
- **Build Time**: Optimize for <10 minutes
- **Artifact Size**: Monitor build artifact sizes

### Alerts
- Failed builds trigger notifications
- Security findings appear in Security tab
- Coverage drops below threshold
- Dependency vulnerabilities detected

## 🔄 Maintenance

### Regular Tasks
- **Weekly**: Review security scan results
- **Monthly**: Update dependencies
- **Quarterly**: Review and update workflow configurations
- **As Needed**: Clean up old artifacts and runs

### Workflow Updates
- Update action versions regularly
- Review and update Node.js versions
- Optimize caching strategies
- Add new quality checks as needed

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Expo EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Playwright Testing](https://playwright.dev/)
- [Jest Testing Framework](https://jestjs.io/)
- [Semgrep Security Scanning](https://semgrep.dev/)

---

 **Last Updated**: 2025-10-06
**Pipeline Version**: 2.0.0
**Maintainer**: CI/CD Team