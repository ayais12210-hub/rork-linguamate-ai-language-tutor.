# Quality Playbook

## Overview

This document explains the quality assessment system for Linguamate AI, including how scores are calculated, how to run assessments locally, and how to improve quality metrics.

## Quality Scoring System

### Overall Score: 0-100

The overall quality score is computed from 7 weighted categories:

| Category | Weight | Description |
|----------|--------|-------------|
| Testing | 25% | Code coverage, E2E stability, integration quality, a11y tests |
| Performance | 20% | Lighthouse scores, bundle size, optimizations, asset handling |
| Security | 20% | Vulnerabilities, Semgrep patterns, secrets, dependencies, headers |
| Maintainability | 15% | ESLint compliance, code complexity, TypeScript strictness, modularity |
| Accessibility | 10% | Axe violations, focus management, ARIA, live regions |
| Reliability | 5% | Error handling, offline mode, retry logic |
| DevEx & CI | 5% | CI speed, artifact quality, developer experience |

### Hard Gates (Build Fails If)

- Overall score < 75
- Coverage < 85% lines
- Any Critical/High security vulnerabilities
- Lighthouse Performance < 85
- Any serious/critical accessibility violations

## Running Quality Assessments Locally

### Prerequisites

```bash
bun install
```

### Full Quality Suite

```bash
bun run quality
```

This runs:
1. Lint
2. Type check
3. Unit & integration tests with coverage
4. E2E tests
5. Accessibility tests
6. Security scans
7. Score computation

### Individual Checks

```bash
# Linting
bun run lint
bun run lint:fix

# Type checking
bun run typecheck

# Tests
bun run test              # Unit tests
bun run test:coverage     # With coverage report
bun run test:watch        # Watch mode

# E2E
bun run e2e               # Headless
bun run e2e:ui            # Interactive UI
bun run e2e:debug         # Debug mode

# Accessibility
bun run a11y

# Performance
bun run perf              # Lighthouse CI

# Security
bun run audit             # npm audit
bun run security          # Semgrep scan

# Score
bun run score             # Compute quality score
```

## Understanding Reports

### Quality Report (`reports/quality-report.md`)

Human-readable markdown report with:
- Overall score and status
- Category breakdown table
- Detailed criterion scores
- Recommendations
- Green path to 90+

### Quality JSON (`reports/quality-report.json`)

Machine-readable JSON with:
- Overall score
- Category scores
- Metadata (coverage, lighthouse, audit data)
- Timestamp

### Scorecard CSV (`reports/scorecard.csv`)

Spreadsheet-friendly format:
```csv
Category,Criterion,Score,MaxScore
testing,coverage,10,10
testing,e2eStability,5,5
...
```

## Improving Your Score

### Testing (25 points)

**Coverage (10 points)**
- Target: 90%+ lines, branches, functions
- Focus on: Business logic, state management, API integration
- Tools: Jest with coverage enabled

```bash
bun run test:coverage
open coverage/lcov-report/index.html
```

**E2E Stability (5 points)**
- Target: 98%+ pass rate
- Use: Playwright with retry logic
- Best practices: Stable selectors, wait strategies, isolated tests

**Integration Quality (5 points)**
- Mock external APIs with MSW
- Test error paths and edge cases
- Validate contract adherence

**A11y Tests (5 points)**
- Use jest-axe for component tests
- Playwright + axe-core for E2E
- Test keyboard navigation, screen readers

### Performance (20 points)

**Lighthouse (7 points)**
- Target: 90+ for Performance and Accessibility
- Optimize: Images, code splitting, lazy loading
- Tools: Lighthouse CI

```bash
bun run perf
```

**Bundle Size (5 points)**
- Monitor bundle growth
- Use dynamic imports
- Tree-shake unused code

**Optimizations (5 points)**
- React.memo() for expensive components
- useMemo/useCallback for heavy computations
- Virtualize long lists

**Assets (3 points)**
- Compress images (WebP, AVIF)
- Use CDN for static assets
- Implement lazy loading

### Security (20 points)

**Vulnerabilities (7 points)**
- Zero critical/high vulnerabilities
- Run `bun run audit:fix` regularly
- Update dependencies monthly

**Semgrep (5 points)**
- No critical security patterns
- Custom rules in `.semgrep.yml`
- Review findings in `reports/security/semgrep.json`

**Secrets (3 points)**
- No hardcoded secrets
- Use environment variables
- Scan with git-secrets or similar

**Dependencies (3 points)**
- Keep dependencies up-to-date
- Use Dependabot
- Review security advisories

**Headers (2 points)**
- CSP, X-Frame-Options, HSTS
- Configured in `backend/middleware/securityHeaders.ts`

### Maintainability (15 points)

**ESLint (5 points)**
- Zero errors, minimal warnings
- Fix with `bun run lint:fix`
- Enforce import order, no-console rules

**Complexity (4 points)**
- Keep functions small (<50 lines)
- Cyclomatic complexity <10
- Extract reusable utilities

**TypeScript (4 points)**
- Strict mode enabled
- No `any` types (use `unknown` + type guards)
- Explicit return types for public APIs

**Modularity (2 points)**
- Clear module boundaries
- Avoid circular dependencies
- Follow feature-based structure

### Accessibility (10 points)

**Axe Violations (6 points)**
- Zero serious/critical violations
- Test with `bun run a11y`
- Fix: Missing labels, color contrast, ARIA

**Focus Management (2 points)**
- Logical tab order
- Visible focus indicators
- Trap focus in modals

**Live Regions (2 points)**
- Announce dynamic content
- Use `aria-live`, `role="status"`
- Test with screen readers

### Reliability (5 points)

**Error Handling (2 points)**
- Try-catch blocks for async operations
- User-friendly error messages
- Error boundaries for React components

**Offline Mode (2 points)**
- Detect network status
- Queue failed requests
- Show offline banner

**Retries (1 point)**
- Exponential backoff for API calls
- Retry transient failures
- Configured in tRPC client

### DevEx & CI (5 points)

**CI Speed (3 points)**
- Target: <10 minutes
- Use caching for dependencies
- Parallelize jobs

**Artifacts (2 points)**
- Upload test reports
- Store coverage data
- Preserve Playwright traces

## CI/CD Integration

### GitHub Actions Workflow

The quality assessment runs automatically on:
- Pull requests
- Pushes to `main` or `develop`
- Weekly schedule (Sundays at midnight)

### PR Comments

The CI bot comments on PRs with:
- Overall score
- Category breakdown
- Link to detailed artifacts

### Artifacts

Available for 30 days:
- `quality-reports/` - All reports
- `playwright-report/` - E2E test results
- `coverage/` - Code coverage

## Troubleshooting

### Score Lower Than Expected

1. Check `reports/quality-report.md` for specific issues
2. Review category breakdown
3. Focus on lowest-scoring categories first
4. Run individual checks locally to debug

### CI Failures

1. Check GitHub Actions logs
2. Download artifacts for detailed reports
3. Reproduce locally with same commands
4. Ensure all dependencies are installed

### False Positives

1. Security: Review `reports/security/` for context
2. A11y: Some violations may be acceptable (document exceptions)
3. Lint: Disable specific rules with inline comments (sparingly)

## Best Practices

1. **Run quality checks before committing**
   ```bash
   bun run lint && bun run typecheck && bun run test
   ```

2. **Monitor score trends**
   - Track score over time
   - Set team goals (e.g., maintain 85+)
   - Celebrate improvements

3. **Address issues incrementally**
   - Fix one category at a time
   - Create focused PRs
   - Document decisions

4. **Automate where possible**
   - Pre-commit hooks (Husky + lint-staged)
   - Auto-fix on save (ESLint, Prettier)
   - Dependabot for updates

5. **Review reports regularly**
   - Weekly team review
   - Discuss trends and blockers
   - Prioritize high-impact fixes

## Resources

- [Testing Strategy](./testing-strategy.md)
- [Accessibility Guide](./accessibility.md)
- [Performance Guide](./performance.md)
- [Security Best Practices](../SECURITY.md)

---

*Last updated: 2025-01-03*
