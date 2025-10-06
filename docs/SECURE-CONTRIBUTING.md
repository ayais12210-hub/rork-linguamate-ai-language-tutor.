# Contributing Securely to Linguamate

> Read this before opening a PR. For how we handle reports, see [SECURITY.md](../SECURITY.md).

## 0) Golden Rules

- **No secrets in code or logs.** Use `.env` and CI secrets. Never commit tokens, keys, or credentials.
- **Least privilege.** Narrow scopes for tokens, DB users (prefer read-only), S3 buckets, MCP servers.
- **Guard the edges.** Validate inputs/outputs (zod), sanitize untrusted content, and handle errors predictably.
- **PRs only.** No direct pushes to main. Security-affecting PRs must be reviewed by at least one maintainer.

---

## 1) Local Setup (secure defaults)

```bash
cp .env.example .env   # fill locally; never commit .env
pnpm i                 # or npm i
pnpm run typecheck
pnpm run lint
```

- Use Node 18+ (or repo-pinned version).
- If you need test tokens, create throwaway keys with minimal scopes; never reuse prod keys.

---

## 2) Secrets Hygiene Checklist

- [ ] No secrets appear in diffs, tests, snapshots, or storybook fixtures.
- [ ] Redact tokens in logs (`****`), avoid `console.log(err)` that may leak.
- [ ] `.env`, `.env.*` on `.gitignore`.
- [ ] Add new secret names to secret-scanners (see CI below).

---

## 3) Dependency & Supply-Chain Safety

- [ ] Prefer well-maintained packages; avoid unknown post-install scripts.
- [ ] Lockfile updated; no `git://` or arbitrary tarball urls.
- [ ] Run:

```bash
pnpm audit --audit-level=moderate
pnpm fund           # (informational)
```

- [ ] If adding native modules, confirm Expo compatibility and platform perms.

---

## 4) Type-Safe Boundaries (tRPC / Hono)

- [ ] `zod` on every external boundary (`router.input`, `router.output`).
- [ ] Never trust client-provided IDs/roles; fetch from server session/context.
- [ ] Enforce CORS allow-list in production; deny `*`.
- [ ] Timeouts, retries, and circuit breakers for upstream calls.

---

## 5) Frontend (Expo / RN / Web)

- [ ] Disallow rendering untrusted HTML. If unavoidable, sanitise first.
- [ ] No text nodes directly under `<View>` (RN crash risk).
- [ ] Permissions flows (mic/camera) gated and explained; degrade gracefully.
- [ ] No `eval`, no dynamic `Function` or unsafe regex from user input.
- [ ] Feature flags default off for risky features.

---

## 6) AI/LLM Safety

- [ ] Strip PII before sending to LLMs; log only request hash + metadata.
- [ ] Prompt-injection defense: don't let LLM outputs call privileged actions without explicit allow-lists and confirmations.
- [ ] Cap context size; limit tool calls; set conservative timeouts.
- [ ] Cache benign, static prompts; avoid replaying user secrets to models.

---

## 7) MCP (Model Context Protocol) Hardening

- [ ] Filesystem server write scope limited to: `tests/`, `.github/`, `docs/`, `schemas/`.
- [ ] HTTP server host allow-list only (match `.cursor/mcp.json`).
- [ ] GitHub MCP uses token with `repo:status`, `pull_request` scopes; opens PRs (no direct pushes).
- [ ] Optional DB/Redis servers start read-only; promote temporarily if needed with maintainer approval.
- [ ] Document any new MCP server in `docs/mcp.md`.

---

## 8) Data Protection & Telemetry

- [ ] Define & use a `redactLog(obj)` helper before logging.
- [ ] Don't log payload bodies by default; only whitelisted fields.
- [ ] Group metrics: latency, error rates, retries, user impact.
- [ ] Respect platform privacy settings; no hidden tracking.

---

## 9) Authentication & Authorisation

- [ ] Server-side checks only (client checks are UX).
- [ ] Token refresh and revocation paths tested.
- [ ] Rate limits for sensitive routes; add IP-based + user-based buckets.
- [ ] Admin routes behind explicit role checks, not "isStaff" booleans in the client.

---

## 10) Testing (security-relevant)

- [ ] Add tests for: auth bypass attempts, schema validation failures, overflow inputs, STT/TTS error paths, offline queues & replay.
- [ ] E2E tests must assert no PII in UI crash overlays.
- [ ] Include a failing test before fixing a reported vuln where possible.

---

## 11) PR Hygiene Checklist (copy this into your PR body)

- [ ] No secrets added; `.env` untouched; screenshots scrubbed.
- [ ] New endpoints validated with zod; errors mapped to safe messages.
- [ ] Logs redact tokens/PII; added tests for failure paths.
- [ ] Dependencies audited; no risky postinstall scripts.
- [ ] MCP scopes unchanged or narrowed; documented in `docs/mcp.md`.

---

## Example PR Template

See [.github/pull_request_template.md](../.github/pull_request_template.md) for the full template.

---

## Reporting Security Issues

Found something critical while contributing? **Stop. Do not open a public issue.**

Follow [SECURITY.md](../SECURITY.md): use a private advisory or email security@linguamate.dev.

---

## Quick References

- **Input validation:** `zod.safeParse`, explicit error mapping.
- **Logging:** never log raw headers/cookies/tokens; use `redactLog`.
- **MCP:** keep FS writes limited; PR-only GitHub ops; allow-list HTTP hosts.
- **LLMs:** strip PII, defend against prompt injection, confirm privileged tool calls.