# 🔒 Tier 3 Advanced Security & Quality Stack

This document describes the advanced security and quality automation bots added to Linguamate AI Tutor for comprehensive vulnerability scanning, dependency management, and code quality enforcement.

## 🚀 Overview

The Tier 3 bot stack focuses on **defense-in-depth security** and **advanced quality metrics** with:
- **Smart Dependency Management** (Renovate)
- **Hard Secret Scanning** (Gitleaks + Dependency Review)
- **Comprehensive Vulnerability Scanning** (Trivy)
- **Inline Code Quality** (reviewdog + Semgrep)
- **Coverage Reporting** (Codecov + Vitest)
- **Semantic Versioning** (Changesets)

## 📋 Bot Descriptions

### 1. Renovate - Smart Dependency Management
**File**: `.github/renovate.json`

**Purpose**: Smarter alternative to Dependabot with advanced grouping and rate limiting.

**Features**:
- Monorepo-aware dependency updates
- Custom grouping strategies (minor/patch vs major)
- Rate limiting (4 PRs/hour, 10 concurrent)
- Semantic commit enforcement
- Required status checks integration

**Configuration**:
- Groups minor/patch updates together
- Separates major updates for careful review
- Enforces conventional commits
- Integrates with existing bot workflows

### 2. Gitleaks - Hard Secret Scanning
**File**: `.github/workflows/bots-gitleaks.yml`

**Purpose**: Comprehensive secret detection beyond GitHub's built-in scanning.

**Features**:
- Scans entire git history (fetch-depth: 0)
- Detects API keys, tokens, passwords, certificates
- SARIF report generation for GitHub Security tab
- Runs on every PR and push to main

**Security Coverage**:
- API keys and tokens
- Database credentials
- SSH keys and certificates
- Cloud provider secrets
- OAuth tokens and refresh tokens

### 3. Dependency Review Action - Vulnerability Blocking
**File**: `.github/workflows/bots-dependency-review.yml`

**Purpose**: Blocks PRs that introduce known vulnerable dependencies.

**Features**:
- Fails on moderate+ severity vulnerabilities
- License compliance checking
- PR comment summaries
- Real-time vulnerability database

**Policy**:
- Blocks moderate, high, critical vulnerabilities
- Allows MIT, Apache-2.0, BSD licenses
- Denies GPL-1.0, AGPL licenses
- Always comments summary in PR

### 4. Trivy - Comprehensive Artifact Scanning
**File**: `.github/workflows/bots-trivy.yml`

**Purpose**: All-in-one vulnerability scanner for filesystem and git history.

**Features**:
- Filesystem scanning for dependencies
- Git history scanning for secrets
- SARIF report generation
- Multi-severity scanning (CRITICAL, HIGH, MEDIUM)

**Scan Types**:
- **Filesystem**: Scans current codebase for vulnerabilities
- **Git**: Scans entire git history for secrets and vulnerabilities

### 5. reviewdog - Inline Code Quality
**File**: `.github/workflows/bots-reviewdog-eslint.yml`

**Purpose**: Converts ESLint output into actionable inline PR comments.

**Features**:
- Inline PR comments for linting issues
- Diff-context filtering (only shows issues in changed lines)
- Warning-level reporting (non-blocking)
- GitHub PR review integration

**Benefits**:
- Immediate feedback on code quality issues
- Focuses on changed code only
- Non-blocking warnings for gradual improvement

### 6. Changesets - Semantic Versioning
**File**: `.changeset/config.json` + `.github/workflows/bots-changesets.yml`

**Purpose**: Human-in-the-loop semantic versioning with release management.

**Features**:
- Changeset files for version planning
- Automatic version bumping
- Release PR generation
- Changelog management

**Workflow**:
1. Developers create changeset files
2. Bot generates version bump PRs
3. Maintainers review and merge
4. Automatic release creation

### 7. Codecov - Coverage Reporting
**File**: `.github/workflows/bots-codecov.yml`

**Purpose**: Comprehensive test coverage reporting and PR status.

**Features**:
- Coverage trend tracking
- PR coverage status checks
- Coverage reports in PR comments
- Historical coverage data

**Integration**:
- Uploads coverage data to Codecov
- PR status checks for coverage changes
- Historical trend analysis

### 8. Vitest Coverage Comment - Inline Coverage
**File**: `.github/workflows/bots-vitest-coverage.yml`

**Purpose**: Inline coverage reports in PR comments.

**Features**:
- Coverage table in PR comments
- 80% threshold enforcement
- File-by-file coverage breakdown
- Coverage trend indicators

**Benefits**:
- Immediate visibility into test coverage
- Coverage threshold enforcement
- Detailed coverage breakdowns

### 9. Semgrep - Advanced Security Rules
**File**: `.github/workflows/bots-semgrep.yml`

**Purpose**: Advanced static analysis with TypeScript/React security rules.

**Features**:
- TypeScript security rules (p/tssec)
- React-specific security patterns (p/react)
- JavaScript security audit (p/javascript)
- Security audit rules (p/security-audit)

**Security Coverage**:
- XSS prevention patterns
- SQL injection detection
- Unsafe eval usage
- React security anti-patterns
- TypeScript-specific vulnerabilities

## 🔧 Configuration Details

### Renovate Configuration
```json
{
  "packageRules": [
    {
      "matchManagers": ["npm"],
      "groupName": "minor/patch deps",
      "matchUpdateTypes": ["minor", "patch"]
    }
  ],
  "prHourlyLimit": 4,
  "requiredStatusChecks": ["bots-lint", "bots-codeql", "mcp-guard"]
}
```

### Security Scanning
```yaml
# Gitleaks - Hard secret scanning
- fetch-depth: 0  # Full git history
- SARIF report generation

# Trivy - Multi-type scanning
- scan-type: [fs, git]
- severity: CRITICAL,HIGH,MEDIUM

# Dependency Review - Vulnerability blocking
- fail-on-severity: moderate
- license compliance checking
```

### Coverage Reporting
```yaml
# Codecov - Comprehensive coverage
- fail_ci_if_error: false
- verbose: true

# Vitest - Inline coverage
- threshold: 80
- working-directory: .
```

## 🎯 Benefits

### Security Benefits
- **Defense in Depth**: Multiple layers of security scanning
- **Secret Prevention**: Hard secret scanning prevents credential leaks
- **Vulnerability Blocking**: Stops vulnerable dependencies at PR time
- **Compliance**: License and security policy enforcement

### Quality Benefits
- **Inline Feedback**: Immediate code quality feedback in PRs
- **Coverage Visibility**: Clear test coverage metrics
- **Trend Tracking**: Historical quality and security metrics
- **Automated Enforcement**: Consistent quality standards

### Development Benefits
- **Smart Dependencies**: Intelligent dependency update management
- **Semantic Versioning**: Structured release management
- **Non-blocking Warnings**: Gradual quality improvement
- **Comprehensive Reporting**: Detailed metrics and trends

## 🚨 Installation Requirements

### GitHub Apps (Required)
1. **Renovate**: Install from [Renovate App](https://github.com/apps/renovate)
2. **Codecov**: Install from [Codecov App](https://github.com/apps/codecov)

### Optional Secrets
- `GITLEAKS_LICENSE`: For commercial Gitleaks usage
- `CODECOV_TOKEN`: For private repository coverage

### Permissions Required
- `contents: read` - For code analysis
- `pull-requests: write` - For PR comments
- `security-events: write` - For security reporting

## 🔄 Integration with Existing Stack

The Tier 3 bots integrate with Tier 1 and Tier 2:

1. **Renovate** → **Mergify** (smart dependency updates)
2. **Gitleaks** → **OSSF Scorecard** (security posture)
3. **Trivy** → **Allstar** (security policy enforcement)
4. **reviewdog** → **Super-Linter** (enhanced linting feedback)
5. **Codecov** → **Release Please** (coverage in releases)

## 📊 Monitoring and Metrics

### Key Metrics to Track
- **Security Score**: OSSF Scorecard rating trends
- **Coverage Trends**: Test coverage over time
- **Vulnerability Response**: Time to fix security issues
- **Dependency Health**: Outdated dependency counts

### GitHub Insights
- **Security Tab**: SARIF reports from Gitleaks, Trivy, Semgrep
- **Actions Tab**: Bot workflow status and performance
- **Pull Requests**: Inline comments and coverage reports
- **Releases**: Semantic versioning and changelog generation

## 🛠️ Troubleshooting

### Common Issues
1. **Renovate not creating PRs**: Check GitHub App installation
2. **Gitleaks false positives**: Review secret patterns
3. **Coverage not uploading**: Verify Codecov token
4. **Semgrep too noisy**: Adjust rule severity

### Debug Steps
1. Check workflow logs in Actions tab
2. Verify GitHub App installations
3. Review bot configuration files
4. Check repository permissions

## 🔮 Future Enhancements

Potential additions for Tier 4:
- **Snyk Bot**: Advanced dependency vulnerability scanning
- **SonarCloud**: Code quality and security analysis
- **DeepSource**: AI-powered code quality insights
- **Danger JS**: Custom PR rules engine

---

*This documentation is automatically updated when bot configurations change.*