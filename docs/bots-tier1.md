# 🚀 Tier 1: Baseline Bot Stack

This document describes the foundational automation bots that form the baseline of the Linguamate AI Tutor bot ecosystem.

## 📋 Overview

The Tier 1 bot stack provides **core automation and basic quality gates** with:
- **Dependency Management** (Dependabot)
- **Security Scanning** (CodeQL)
- **Code Quality** (Super-Linter)
- **PR Governance** (Semantic PRs, Labeler)
- **Release Management** (Release Please)
- **Issue Management** (Stale Bot)
- **MCP Validation** (MCP Guard)

## 🤖 Bot Descriptions

### 1. Dependabot - Dependency Management
**File**: `.github/dependabot.yml`

**Purpose**: Automatically updates dependencies and GitHub Actions.

**Features**:
- Weekly dependency updates
- Security vulnerability alerts
- Automatic PR creation
- Auto-merge for patch updates

**Configuration**:
```yaml
version: 2
updates:
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule: { interval: "weekly" }
    labels: ["deps", "ci"]
```

### 2. CodeQL - Security Scanning
**File**: `.github/workflows/bots-codeql.yml`

**Purpose**: Advanced security analysis using GitHub's CodeQL engine.

**Features**:
- Static analysis security testing (SAST)
- JavaScript/TypeScript analysis
- SARIF report generation
- Security alerts integration

**Language Learning Focus**:
- Ensures secure handling of user data
- Validates authentication mechanisms
- Scans for common web vulnerabilities

### 3. Super-Linter - Code Quality
**File**: `.github/workflows/bots-lint.yml`

**Purpose**: Comprehensive linting across multiple languages and formats.

**Features**:
- JavaScript/TypeScript linting
- JSON/YAML validation
- Markdown formatting
- Dockerfile linting

**Supported Languages**:
- JavaScript, TypeScript
- JSON, YAML
- Markdown
- Dockerfile

### 4. Semantic Pull Requests - PR Governance
**File**: `.github/workflows/bots-semantic-pr.yml`

**Purpose**: Enforces Conventional Commits for PR titles.

**Features**:
- PR title validation
- Conventional Commits compliance
- Automated changelog generation
- Release automation

**Conventional Commits**:
- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation
- `style:` - Code style
- `refactor:` - Code refactoring
- `test:` - Tests
- `chore:` - Maintenance

### 5. Release Please - Release Management
**File**: `.github/workflows/bots-release-please.yml`

**Purpose**: Automated semantic versioning and changelog generation.

**Features**:
- Semantic versioning
- Automated changelog
- Release notes generation
- Version bump automation

**Release Types**:
- **Major**: Breaking changes
- **Minor**: New features
- **Patch**: Bug fixes

### 6. Labeler - Automatic Labeling
**File**: `.github/workflows/bots-labels.yml` + `.github/labeler.yml`

**Purpose**: Automatically labels PRs based on changed files.

**Features**:
- File path-based labeling
- Custom label rules
- PR categorization
- Workflow automation

**Label Categories**:
- `deps` - Dependency updates
- `ci` - CI/CD changes
- `frontend` - Frontend changes
- `backend` - Backend changes
- `docs` - Documentation
- `tests` - Test changes
- `mcp` - MCP changes

### 7. Stale Bot - Issue Management
**File**: `.github/workflows/bots-stale.yml`

**Purpose**: Manages stale issues and pull requests.

**Features**:
- Automatic stale marking
- Issue closure
- PR management
- Activity monitoring

**Configuration**:
- Stale after 30 days
- Close after 7 days of inactivity
- Exempt from stale: `pinned`, `security`

### 8. MCP Guard - MCP Validation
**File**: `.github/workflows/mcp-guard.yml`

**Purpose**: Validates MCP (Model Context Protocol) configurations.

**Features**:
- JSON/YAML syntax validation
- Secret scanning
- Configuration validation
- Security checks

**Language Learning Focus**:
- Validates AI model configurations
- Ensures secure MCP endpoints
- Scans for exposed credentials

## 🔧 Configuration Highlights

### Dependency Management
```yaml
# Dependabot configuration
version: 2
updates:
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule: { interval: "weekly" }
    labels: ["deps", "ci"]
```

### Code Quality
```yaml
# Super-Linter configuration
- name: Lint Code Base
  uses: github/super-linter@v4
  env:
    DEFAULT_BRANCH: main
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### Security Scanning
```yaml
# CodeQL configuration
- name: Initialize CodeQL
  uses: github/codeql-action/init@v3
  with:
    languages: javascript
```

## 🎯 Language Learning Benefits

### For Developers
- **Automated Dependency Updates**: Keeps language learning libraries current
- **Security Scanning**: Protects user data and authentication
- **Code Quality**: Ensures maintainable codebase
- **Release Automation**: Streamlined deployment process

### For Users
- **Secure Learning Platform**: Regular security updates
- **Reliable Performance**: Quality-assured code
- **Consistent Experience**: Automated testing and validation
- **Fast Updates**: Automated release process

### For Maintainers
- **Reduced Manual Work**: Automated processes
- **Quality Assurance**: Built-in quality gates
- **Security Compliance**: Regular security scanning
- **Release Management**: Automated versioning

## 🚨 Installation Requirements

### Required Permissions
- `contents: read` - For code analysis
- `pull-requests: write` - For PR comments
- `actions: read` - For workflow management
- `security-events: write` - For security alerts

### Optional Secrets
- `GITHUB_TOKEN` - Automatically provided
- `CODECOV_TOKEN` - For coverage reporting (if enabled)

## 🔄 Integration with Other Tiers

The Tier 1 bots provide the foundation for all other tiers:

1. **Dependabot** → **Renovate** (Tier 3) - Smart dependency management
2. **CodeQL** → **Semgrep** (Tier 3) - Advanced security scanning
3. **Super-Linter** → **MegaLinter** (Tier 4) - Comprehensive linting
4. **Semantic PRs** → **commitlint** (Tier 4) - Commit enforcement
5. **Release Please** → **Changesets** (Tier 3) - Release management
6. **Labeler** → **Auto-Assign** (Tier 4) - PR routing
7. **Stale Bot** → **Lock Threads** (Tier 4) - Issue management
8. **MCP Guard** → **All MCP Bots** - Security foundation

## 📊 Monitoring and Metrics

### Key Metrics to Track
- **Dependency Update Frequency**: Weekly
- **Security Scan Coverage**: 100% of codebase
- **Linting Success Rate**: > 95%
- **PR Label Accuracy**: > 90%
- **Release Automation**: 100% automated
- **Issue Resolution Time**: < 7 days

### Language Learning Specific Metrics
- **MCP Configuration Validity**: 100%
- **Security Vulnerability Count**: 0 critical
- **Code Quality Score**: > 8.0/10
- **Release Frequency**: Weekly
- **Issue Response Time**: < 24 hours

## 🛠️ Troubleshooting

### Common Issues
1. **Dependabot not creating PRs**: Check repository settings
2. **CodeQL failing**: Verify language detection
3. **Super-Linter errors**: Check file permissions
4. **Semantic PRs failing**: Verify PR title format
5. **Release Please not working**: Check branch protection

### Debug Steps
1. Check workflow logs in Actions tab
2. Verify repository permissions
3. Review configuration files
4. Test locally with same commands
5. Check GitHub API limits

## 🔮 Future Enhancements

Potential additions for Tier 1:
- **Advanced Security Scanning**: More comprehensive security checks
- **Performance Monitoring**: Basic performance metrics
- **Dependency Analytics**: Usage and security analytics
- **Automated Testing**: Basic test automation
- **Documentation Generation**: Automated docs

---

*This documentation is automatically updated when bot configurations change.*