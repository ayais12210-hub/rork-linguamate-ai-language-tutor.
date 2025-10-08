# Cursor Rules — Linguamate AI Tutor

- Use **Conventional Commits** for PR titles (e.g., `feat:`, `fix:`, `chore:`).
- Prefer **pnpm**; require **node >= 20**.
- Never commit `.env` or secrets; use **GitHub Actions secrets/variables**.
- Keep bot workflows under `.github/workflows/bots-*.yml`; do **not** modify `linguamate-ci.yml`.
- For **MCP changes** (under `omni-mcp/**`):
  - JSON/YAML must parse cleanly.
  - No obvious secrets (keys/tokens) in tracked files.
  - Keep schemas in `omni-mcp/schemas/**` and data/workflows in `omni-mcp/workflows/**`.
- CI must pass: `pnpm lint`, `pnpm test`, `pnpm typecheck` (where defined).