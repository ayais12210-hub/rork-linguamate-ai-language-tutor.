# MCP Tools (No-Key Baseline)

This repo enables Model Context Protocol (MCP) servers that require **no API keys**, giving agents safe powers without secrets.

## Enabled
- **Filesystem (fs-local)**  
  - Read: app/, components/, backend/, lib/, tests/, schemas/, .github/, docs  
  - Write: tests/, docs/, .github/, schemas  
  - Use cases: generate tests/docs, edit workflows, scaffold schemas.

- **HTTP (allow-listed)**  
  - Hosts: api.coingecko.com, registry.npmjs.org, en.wikipedia.org, raw.githubusercontent.com  
  - Use cases: fetch public data, npm metadata, docs; no auth.

## Optional (add when packages exist)
- **Shell** (`@modelcontextprotocol/server-shell`)  
  - Allowed commands: pnpm, tsc, eslint, jest  
  - Use cases: run typecheck/lint/tests from MCP.

- **Git Local** (`@modelcontextprotocol/server-git`)  
  - Use cases: explain diffs, list recent commits, annotate blame.

- **Diagnostics** (`@modelcontextprotocol/server-diagnostics`)  
  - Use cases: report Node/OS info for CI debugging.

## Security Notes
- No secrets; env is not required for these servers.  
- Filesystem write scope is intentionally narrow.  
- HTTP allow-list blocks unknown hosts. Expand deliberately.  
- Prefer PRs; avoid direct writes outside allowed folders.

## Quick Start
1. Restart Cursor to pick up `.cursor/mcp.json`.
2. Ask the agent:  
   - "Scan tests/ and add missing unit tests for backend routes."  
   - "Fetch npm metadata for `hono` from registry.npmjs.org and summarise."  
   - "Propose doc edits in docs/, open a PR."