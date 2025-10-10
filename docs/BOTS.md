# 🤖 Bot Orchestration Matrix & Runbook

This document provides a comprehensive overview of all automated bots and workflows in the Linguamate AI Tutor repository.

## 📊 Install Matrix

| Name | Type | Needs Secrets? | Trigger | Status | How to Enable |
|------|------|----------------|---------|--------|---------------|
| **Baseline Bots** |
| Dependabot | GitHub App | No | Schedule | ✅ Active | Built-in |
| CodeQL | GitHub Action | No | PR/Push | ✅ Active | Built-in |
| Super-Linter | GitHub Action | No | PR/Push | ✅ Active | Built-in |
| Semantic PRs | GitHub Action | No | PR | ✅ Active | Built-in |
| Release Please | GitHub Action | No | Push | ✅ Active | Built-in |
| Labeler | GitHub Action | No | PR | ✅ Active | Built-in |
| Stale Bot | GitHub Action | No | Schedule | ✅ Active | Built-in |
| MCP Guard | GitHub Action | No | PR/Push | ✅ Active | Built-in |
| **Tier 2 Bots** |
| Mergify | GitHub App | No | PR | ✅ Active | Install Mergify App |
| Reviewpad | GitHub App | No | PR | ✅ Active | Install Reviewpad App |
| OSSF Scorecard | GitHub Action | No | Schedule | ✅ Active | Built-in |
| Allstar | GitHub App | No | PR | ✅ Active | Install Allstar App |
| ImgBot | GitHub App | No | Push/PR | ✅ Active | Install ImgBot App |
| **Advanced Bots** |
| Renovate | GitHub App | No | Schedule | ✅ Active | Install Renovate App |
| Gitleaks | GitHub Action | No | PR/Push | ✅ Active | Built-in |
| Semgrep | GitHub Action | No | PR | ✅ Active | Built-in |
| Trivy | GitHub Action | No | PR | ✅ Active | Built-in |
| Syft+Grype | GitHub Action | No | PR | ✅ Active | Built-in |
| Dependency Review | GitHub Action | No | PR | ✅ Active | Built-in |
| Changesets | GitHub Action | No | PR | ✅ Active | Built-in |
| Codecov | GitHub App | Optional | PR/Push | ✅ Active | Install Codecov App |
| Vitest Coverage | GitHub Action | No | PR | ✅ Active | Built-in |
| reviewdog | GitHub Action | No | PR | ✅ Active | Built-in |
| **AI-Powered Bots** |
| CodiumAI PR-Agent | GitHub Action | OpenAI API Key | PR | ✅ Active | Add OPENAI_API_KEY |
| Sweep Bot | GitHub Action | Sweep API Key | Issue | ✅ Active | Add SWEEP_API_KEY |
| Danger JS | GitHub Action | No | PR | ✅ Active | Built-in |
| MegaLinter | GitHub Action | No | PR/Push | ✅ Active | Built-in |
| SLSA Generator | GitHub Action | No | Push | ✅ Active | Built-in |
| All-Contributors | GitHub Action | No | PR/Issue | ✅ Active | Built-in |
| Welcome Bot | GitHub Action | No | PR/Issue | ✅ Active | Built-in |
| commitlint | GitHub Action | No | PR | ✅ Active | Built-in |
| Auto-Assign | GitHub Action | No | PR | ✅ Active | Built-in |
| **Tier 5: Language Learning & App Store** |
| Lighthouse CI | GitHub Action | LHCI Token | PR | ✅ Active | Add LHCI_GITHUB_APP_TOKEN |
| Percy | GitHub Action | Percy Token | PR | ✅ Active | Add PERCY_TOKEN |
| LinguiJS | GitHub Action | No | PR | ✅ Active | Built-in |
| Fastlane | GitHub Action | No | PR | ✅ Active | Built-in |
| Bundlewatch | GitHub Action | Optional | PR | ✅ Active | Built-in |
| License Checker | GitHub Action | No | PR | ✅ Active | Built-in |
| Crowdin | GitHub Action | Crowdin API | PR | ✅ Active | Add CROWDIN_API_TOKEN |
| Pa11y CI | GitHub Action | No | PR | ✅ Active | Built-in |
| EAS Update | GitHub Action | Optional | PR | ✅ Active | Built-in |
| Mermaid | GitHub Action | No | PR | ✅ Active | Built-in |

## 🚀 Enablement Checklist (Post-Merge)

### Required GitHub Apps
- [ ] **Mergify**: Install from [Mergify App](https://github.com/apps/mergify)
- [ ] **Reviewpad**: Install from [Reviewpad App](https://github.com/apps/reviewpad)
- [ ] **Allstar**: Install from [Allstar App](https://github.com/apps/allstar)
- [ ] **ImgBot**: Install from [ImgBot App](https://github.com/apps/imgbot)
- [ ] **Renovate**: Install from [Renovate App](https://github.com/apps/renovate)
- [ ] **Codecov**: Install from [Codecov App](https://github.com/apps/codecov)

### Optional Secrets (for Enhanced Features)
- [ ] **OPENAI_API_KEY**: For CodiumAI PR-Agent AI reviews
- [ ] **SWEEP_API_KEY**: For Sweep Bot AI issue resolution
- [ ] **CODECOV_TOKEN**: For private repository coverage
- [ ] **DEFAULT_PROJECT_URL**: For Add-to-Project routing

### Repository Variables
- [ ] **DEFAULT_PROJECT_URL**: Set to your GitHub Projects URL for automatic routing

## 🔧 Conflict Rules & De-duplication

### Renovate vs Dependabot
- **Rule**: Prefer Renovate for npm dependencies
- **Implementation**: Dependabot restricted to github-actions only
- **Status**: ✅ Configured

### Codecov Requirements
- **Rule**: Requires test files to be meaningful
- **Implementation**: Workflow disabled by default, enabled when tests exist
- **Status**: ✅ Active (tests detected)

### Sweep Bot Gating
- **Rule**: Only runs on issues labeled with "sweep"
- **Implementation**: Conditional workflow trigger
- **Status**: ✅ Configured

## 🛠️ Rollback Procedures

### Complete Rollback
```bash
# Remove all bot workflows
git rm .github/workflows/bots-*.yml

# Restore original Dependabot config
git checkout main -- .github/dependabot.yml

# Uninstall GitHub Apps
# - Mergify, Reviewpad, Allstar, Imgbot, Renovate, Codecov
```

### Partial Rollback
```bash
# Remove specific bot
git rm .github/workflows/bots-{bot-name}.yml

# Re-run label sync (optional)
gh workflow run bots-label-sync
```

### Emergency Disable
```bash
# Disable all bot workflows by renaming
for file in .github/workflows/bots-*.yml; do
  mv "$file" "${file}.disabled"
done
```

## 📈 Bot Performance Metrics

### Resource Usage
- **Tier 1 (Baseline)**: ~5 minutes total runtime
- **Tier 2 (Advanced)**: ~10 minutes total runtime  
- **Tier 3 (Security)**: ~15 minutes total runtime
- **Tier 4 (AI-Powered)**: ~20 minutes total runtime

### Concurrency Management
- All workflows use `concurrency: { group: bots-{name}-${{ github.ref }}, cancel-in-progress: true }`
- Rate limiting: Renovate (4 PRs/hour), Mergify (3 PRs/batch)

## 🔍 Monitoring & Troubleshooting

### Key Metrics to Track
- **Security**: OSSF Scorecard rating, vulnerability count
- **Quality**: Coverage percentage, linting issues
- **Performance**: Bot response time, success rate
- **Engagement**: Contributor count, PR velocity

### Common Issues
1. **Bot not triggering**: Check workflow file syntax and triggers
2. **App not working**: Verify GitHub App installation
3. **Secrets missing**: Check repository secrets configuration
4. **Conflicts**: Review de-duplication rules

### Debug Commands
```bash
# Check workflow syntax
yamllint .github/workflows/bots-*.yml

# Validate JSON configs
jq . .github/renovate.json
jq . .github/label-sync.yml

# List active workflows
gh workflow list
```

## 🎯 Bot Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│  🎯 Tier 4: AI-Powered & Advanced (9 bots)                 │
│  CodiumAI │ Sweep │ Danger │ MegaLinter │ SLSA │ Welcome   │
├─────────────────────────────────────────────────────────────┤
│  🛡️ Tier 3: Security & Quality (9 bots)                   │
│  Renovate │ Gitleaks │ Trivy │ Semgrep │ Codecov │ Vitest  │
├─────────────────────────────────────────────────────────────┤
│  ⚙️ Tier 2: Advanced Automation (5 bots)                   │
│  Mergify │ Reviewpad │ OSSF Scorecard │ Allstar │ ImgBot   │
├─────────────────────────────────────────────────────────────┤
│  🚀 Tier 1: Baseline (8 bots)                              │
│  Dependabot │ CodeQL │ Super-Linter │ Semantic PRs │ MCP   │
└─────────────────────────────────────────────────────────────┘
```

**Total: 31 Enterprise-Grade Bots** across 4 progressive tiers!

## 📚 Additional Resources

- [Bot Architecture Documentation](docs/bot-architecture.md)
- [Tier 1 Bot Documentation](docs/bots-tier1.md)
- [Tier 2 Bot Documentation](docs/bots-tier2.md)
- [Tier 3 Bot Documentation](docs/bots-tier3.md)
- [Tier 4 Bot Documentation](docs/bots-tier4.md)

---

*This documentation is automatically updated when bot configurations change.*