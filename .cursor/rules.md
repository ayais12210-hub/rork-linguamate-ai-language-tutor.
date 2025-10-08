# Cursor Rules — Linguamate AI Tutor

## Core Development Rules
- Use **Conventional Commits** for PR titles (e.g., `feat:`, `fix:`, `chore:`).
- Prefer **pnpm**; require **node >= 20**.
- Never commit `.env` or secrets; use **GitHub Actions secrets/variables**.
- Keep bot workflows under `.github/workflows/bots-*.yml`; do **not** modify `linguamate-ci.yml`.
- CI must pass: `pnpm lint`, `pnpm test`, `pnpm typecheck` (where defined).

## MCP Guidelines
For **MCP changes** (under `omni-mcp/**`):
- JSON/YAML must parse cleanly.
- No obvious secrets (keys/tokens) in tracked files.
- Keep schemas in `omni-mcp/schemas/**` and data/workflows in `omni-mcp/workflows/**`.

## Bot Automation Stack
### Tier 1 (Baseline) - Already Active
- **Dependabot**: Automated dependency updates
- **CodeQL**: Security vulnerability scanning
- **Super-Linter**: Multi-language code linting
- **Semantic PRs**: Conventional commit enforcement
- **Release Please**: Automated semantic releases
- **Stale Bot**: Issue/PR cleanup
- **MCP Guard**: MCP validation and secret scanning

### Tier 2 (Advanced) - New Additions
- **Mergify**: Merge queues and automerge rules
- **Reviewpad**: PR policy enforcement (tests, docs, size limits)
- **OSSF Scorecard**: Security posture rating
- **Allstar**: Security policy enforcement
- **ImgBot**: Automatic image optimization

### Tier 4 (AI-Powered & Advanced) - Latest Additions
- **CodiumAI PR-Agent**: AI-powered code reviews and suggestions
- **Sweep Bot**: AI agent for automatic issue resolution
- **Danger JS**: Custom PR rules engine for project-specific requirements
- **MegaLinter**: Comprehensive linting with 70+ linters
- **SLSA Generator**: Build provenance for supply chain security
- **All-Contributors Bot**: Automatic contributor recognition
- **Welcome Bot**: New contributor onboarding and guidance
- **commitlint**: Conventional commit message enforcement
- **Auto-Assign**: Smart reviewer assignment based on file paths

## PR Requirements
- Feature PRs (`feat:`) require tests and documentation
- Large PRs (>500 lines) must include test coverage
- MCP changes trigger additional validation
- Documentation updates auto-approve if <100 lines
- All PRs must pass security scans and linting
- Vulnerable dependencies are blocked automatically
- Test coverage threshold: 80% minimum
- AI-powered reviews provide intelligent suggestions
- Custom PR rules enforce project-specific requirements
- Conventional commit format is mandatory