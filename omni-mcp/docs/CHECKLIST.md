# Pre-Merge Checklist
- [ ] Lint, typecheck, tests green (≥80% coverage).
- [ ] `.env.example` regenerated & committed (`pnpm dotenv:gen`).
- [ ] Registry validation green (`pnpm validate:registry`).
- [ ] README server matrix regenerated (`pnpm docs:registry` or `make prd`).
- [ ] No secrets added to repo; diff check done.
- [ ] If new server: YAML + env schema + notes in PRD.