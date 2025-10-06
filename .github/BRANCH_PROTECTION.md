# Branch Protection Rules

This document outlines the recommended branch protection rules for the Linguamate repository.

## Main Branch Protection

### Required Status Checks
- **App CI (RN)** - React Native specific tests and quality checks
- **CI Full Scan** - Complete test suite with coverage
- **CodeQL** - Security analysis
- **Gitleaks** - Secret scanning
- **Lighthouse** - Performance and accessibility checks

### Optional Status Checks (until fixed)
- **Release-Notes** - Auto-drafting release notes
- **Semgrep** - Static analysis (currently optional due to configuration issues)

## Develop Branch Protection

### Required Status Checks
- **App CI (RN)** - React Native specific tests and quality checks
- **CI Full Scan** - Complete test suite with coverage
- **CodeQL** - Security analysis
- **Gitleaks** - Secret scanning

### Optional Status Checks
- **Lighthouse** - Performance checks (optional for develop)
- **Release-Notes** - Auto-drafting release notes
- **Semgrep** - Static analysis

## Configuration Steps

1. Go to repository Settings → Branches
2. Add rule for `main` branch
3. Enable "Require status checks to pass before merging"
4. Select the required checks listed above
5. Enable "Require branches to be up to date before merging"
6. Enable "Require linear history"
7. Enable "Restrict pushes that create files"
8. Add rule for `develop` branch with similar settings

## Quality Gates

### Coverage Thresholds
- Global: 75% branches, 80% functions, 80% lines, 80% statements
- Schemas: 90% branches, 95% functions, 95% lines, 95% statements
- State: 75% branches, 85% functions, 85% lines, 85% statements
- Lib: 70% branches, 75% functions, 75% lines, 75% statements
- Components: 70% branches, 75% functions, 75% lines, 75% statements

### Performance Budgets
- Initial page load: < 3 seconds
- LCP: < 2.5 seconds
- CLS: < 0.1
- FID: < 100ms
- Navigation: < 1 second

### Accessibility Standards
- WCAG 2.1 AA compliance
- Keyboard navigation support
- Screen reader compatibility
- Color contrast ratios
- Focus management

## Enforcement

- All PRs must pass required checks before merge
- Coverage must meet thresholds
- Performance budgets must be maintained
- Security scans must pass
- Accessibility standards must be met

## Exceptions

- Hotfixes may bypass some checks with maintainer approval
- Documentation-only changes may skip performance tests
- Security fixes may be fast-tracked with proper review