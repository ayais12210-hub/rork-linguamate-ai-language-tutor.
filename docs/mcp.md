# Linguamate — MCP Guide

This project uses **Model Context Protocol (MCP)** to let AI coding agents safely:
- read/write limited parts of the repo,
- open issues and PRs on GitHub,
- call approved external APIs (HTTP allow-list).

## Quick start (Cursor)

1. Copy `.env.example` → `.env` and fill in required keys.
2. Ensure `node` and `pnpm`/`npm` available locally.
3. Install MCP servers used by this repo:
   - Filesystem + HTTP servers come from `npx @modelcontextprotocol/...` on demand.
   - GitHub server: place its built `dist/index.js` in `/.mcp/github-mcp-server/` **or** switch to its published `npx` package in `.cursor/mcp.json`.
4. Restart Cursor so it picks up `.cursor/mcp.json`.

## Security model

- **Filesystem**: read → `app, components, backend, lib, tests, schemas, .github, docs`; write → `tests, docs, .github, schemas`.
- **GitHub**: opens PRs, not direct pushes. Keep the token **least-privilege** (repo:status, repo:public_repo).
- **HTTP**: only the hosts in `MCP_HTTP_ALLOWED_HOSTS`. Add/remove deliberately.
- **Secrets**: use local `.env` and CI secrets; never commit secrets.

## Typical tasks

### 1) Fix failing CI and open a PR
> "Read the latest GitHub Actions logs for main. Identify the failing step and propose a patch. Create a PR named `ci/fix-<slug>` with the change, include a summary in the PR body, and link the run URL."

### 2) Generate tests for a component
> "Scan `components/PhonicsTrainer.tsx` and create `tests/components/PhonicsTrainer.test.tsx` covering initial render, props, and error boundaries. Don't modify other files."

### 3) Safe refactor via FS write scope
> "Refactor `lib/speech/` to expose a `useSpeech()` hook. Write files only under `lib/speech` and update imports in `app/(tabs)/translator.tsx` via a separate commit."

### 4) Pull top crashes and turn into issues (optional Sentry)
> "List top 5 crashes (Android, 7d). For each, draft an issue with steps to reproduce and suspected module. Label `bug`, `mobile`, `priority:high`."

### 5) RAG seeding (optional vector/DB)
> "Fetch Punjabi phrasebook v1 (CSV at https://… allowed host). Produce `schemas/phrasebook.v1.json` and open a PR adding it to the seed pipeline."

## Troubleshooting

- **MCP server not found**: check the `command`/`args` path or switch to an `npx` package if available.
- **Permission denied**: you tried writing outside the allowed FS paths — expand `write` scopes only if necessary.
- **HTTP blocked**: host is not in `MCP_HTTP_ALLOWED_HOSTS`. Add it and restart Cursor.

## Optional servers

The `.cursor/mcp.json` includes commented-out configurations for additional servers:
- **postgres-ro**: Read-only database introspection for analytics, query optimization
- **redis-ro**: Inspect rate-limit buckets, job queues, cache state
- **sentry**: Pull error traces and crash reports
- **vercel**: Deploy orchestration and log inspection
- **eas**: Expo build management
- **stripe** / **revenuecat**: Monetization analytics (read-only)

To enable any optional server:
1. Set up the server locally in `/.mcp/<server-name>/`
2. Add the required environment variables to `.env`
3. Uncomment the relevant block in `.cursor/mcp.json`
4. Restart Cursor

## MCP server directory structure

If you vendor MCP servers locally, use this structure:

```
.mcp/
  github-mcp-server/
    dist/
      index.js
  postgres-mcp-server/      # optional
  redis-mcp-server/          # optional
  sentry-mcp-server/         # optional
  vercel-mcp-server/         # optional
  eas-mcp-server/            # optional
  stripe-mcp-server/         # optional
  revenuecat-mcp-server/     # optional
```

## Resources

- [Official MCP Documentation](https://modelcontextprotocol.io)
- [Cursor MCP Guide](https://docs.cursor.com/advanced/model-context-protocol)
- [MCP Server Directory](https://github.com/modelcontextprotocol/servers)
