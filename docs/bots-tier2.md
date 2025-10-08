# 🤖 Tier 2 Bot Stack Documentation

This document describes the advanced automation bots added to Linguamate AI Tutor for enhanced workflow management, security, and code quality.

## 🚀 Overview

The Tier 2 bot stack builds upon the baseline automation (Tier 1) with advanced features for:
- **Merge Queue Management** (Mergify)
- **Policy Enforcement** (Reviewpad)
- **Security Posture** (OSSF Scorecard + Allstar)
- **Asset Optimization** (ImgBot)

## 📋 Bot Descriptions

### 1. Mergify - Merge Queue Management
**File**: `.mergify.yml`

**Purpose**: Automates merge processes with intelligent queuing and batch processing.

**Features**:
- Auto-merge for dependency updates and documentation changes
- Merge queues for larger changes requiring review
- Batch processing to optimize CI/CD pipeline usage
- Smart merge strategies (fast-forward when possible)

**Rules**:
- `deps` label → Auto-merge after 1 approval + CI passes
- `docs` label → Auto-merge after 1 approval + linting passes
- `feat` label → Queue for review (2 approvals required)
- `fix` label → Queue for review (1 approval required)

### 2. Reviewpad - PR Policy Enforcement
**File**: `.reviewpad.yml`

**Purpose**: Enforces coding standards and review policies automatically.

**Features**:
- Requires tests for feature PRs
- Blocks large PRs without test coverage
- Auto-approves small documentation updates
- MCP change detection and validation reminders

**Policies**:
- Feature PRs must include test files
- PRs >500 lines require test coverage
- MCP changes trigger validation checks
- Documentation updates <100 lines auto-approve

### 3. OSSF Scorecard - Security Posture
**File**: `.github/workflows/bots-scorecard.yml`

**Purpose**: Rates repository security against open-source best practices.

**Features**:
- Weekly security posture assessment
- SARIF report generation
- Integration with GitHub Security tab
- Scores against 10+ security criteria

**Schedule**: Runs every Monday at 4 AM UTC

### 4. Allstar - Security Policy Enforcement
**File**: `.allstar.yml` + `.github/workflows/bots-allstar.yml`

**Purpose**: Enforces GitHub security policies and branch protection rules.

**Features**:
- Branch protection enforcement
- Required status checks validation
- Code owner review requirements
- Security policy compliance

**Policies**:
- Main branch protection with required checks
- Code owner reviews mandatory
- Security policy and advisories required

### 5. ImgBot - Image Optimization
**File**: `.github/workflows/bots-imgbot.yml`

**Purpose**: Automatically optimizes images to reduce file sizes.

**Features**:
- Lossless image compression
- Automatic PR creation for optimizations
- Configurable compression quality
- Support for PNG, JPG, JPEG, GIF, SVG

**Triggers**: On push to main or PR with image changes

## 🔧 Configuration Details

### Mergify Configuration
```yaml
# Auto-merge rules for different PR types
pull_request_rules:
  - Auto-merge minor/patch updates
  - Auto-merge documentation changes
  - Queue for review (major changes)
  - Queue for review (bug fixes)

# Queue processing settings
queue_rules:
  - max_batch_size: 3
  - batch_size_window: 30 seconds
  - Required checks: bots-lint, bots-codeql, mcp-guard
```

### Reviewpad Policies
```yaml
# Test requirements
- Feature PRs require test files
- Large PRs (>500 lines) must have tests
- MCP changes need validation

# Auto-approval rules
- Documentation updates <100 lines
- Small configuration changes
```

### Security Configuration
```yaml
# Branch protection
- Required status checks: bots-lint, bots-codeql, mcp-guard
- Code owner reviews: 1-2 depending on change type
- Security policy enforcement

# Scorecard criteria
- Dependency updates
- Code review requirements
- Security policy presence
- Branch protection rules
```

## 🎯 Benefits

### For Developers
- **Faster Reviews**: Auto-merge for safe changes
- **Clear Policies**: Automated enforcement of standards
- **Security Awareness**: Regular security posture updates
- **Asset Optimization**: Automatic image compression

### For Maintainers
- **Reduced Manual Work**: Automated merge management
- **Consistent Quality**: Policy enforcement
- **Security Compliance**: Automated security checks
- **Better Performance**: Optimized assets

### For the Project
- **Higher Quality**: Enforced testing and documentation
- **Better Security**: Regular security assessments
- **Faster Delivery**: Optimized CI/CD pipeline
- **Reduced Maintenance**: Automated cleanup and optimization

## 🚨 Important Notes

### Installation Requirements
1. **Mergify**: Install GitHub App from [Mergify](https://mergify.com)
2. **Reviewpad**: Install GitHub App from [Reviewpad](https://reviewpad.com)
3. **OSSF Scorecard**: No installation required (uses GitHub Actions)
4. **Allstar**: Install GitHub App from [Allstar](https://github.com/ossf/allstar)
5. **ImgBot**: Install GitHub App from [ImgBot](https://imgbot.net)

### Permissions Required
- `contents: read` - For code analysis
- `pull-requests: write` - For PR management
- `security-events: write` - For security reporting
- `id-token: write` - For OSSF Scorecard

### Integration Points
- Works with existing `bots-*` workflows
- Respects `linguamate-ci.yml` (no modifications)
- Integrates with MCP Guard for validation
- Compatible with existing label system

## 🔄 Workflow Integration

The Tier 2 bots integrate seamlessly with the existing Tier 1 stack:

1. **Dependabot** → **Mergify** (auto-merge dependency updates)
2. **Semantic PRs** → **Reviewpad** (policy enforcement)
3. **CodeQL** → **OSSF Scorecard** (security posture)
4. **MCP Guard** → **Allstar** (security policy enforcement)
5. **Super-Linter** → **ImgBot** (asset optimization)

## 📊 Monitoring and Metrics

### Key Metrics to Track
- **Merge Queue Efficiency**: Time from PR creation to merge
- **Policy Compliance**: Percentage of PRs meeting requirements
- **Security Score**: OSSF Scorecard rating trends
- **Asset Optimization**: Image size reduction percentages

### GitHub Insights
- Check Actions tab for bot workflow status
- Review Security tab for Scorecard results
- Monitor PR labels for policy enforcement
- Track merge queue performance in Mergify dashboard

## 🛠️ Troubleshooting

### Common Issues
1. **Mergify not auto-merging**: Check branch protection rules
2. **Reviewpad blocking PRs**: Verify test file requirements
3. **Scorecard failing**: Ensure proper permissions
4. **ImgBot not optimizing**: Check image file formats

### Debug Steps
1. Check workflow logs in Actions tab
2. Verify GitHub App installations
3. Review bot configuration files
4. Check repository permissions

## 🔮 Future Enhancements

Potential additions for Tier 3:
- **CodiumAI PR-Agent**: AI-powered code reviews
- **Sweep Bot**: AI issue resolution
- **CLA Assistant**: Contributor license agreements
- **Danger JS**: Custom PR rules engine

---

*This documentation is automatically updated when bot configurations change.*