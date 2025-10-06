# MCP Servers Directory

This directory contains locally vendored Model Context Protocol (MCP) servers for the Linguamate project.

## Directory Structure

```
.mcp/
├── github-mcp-server/      # GitHub operations (issues, PRs, Actions logs)
├── postgres-mcp-server/    # Database introspection (read-only recommended)
├── redis-mcp-server/       # Cache/queue inspection (read-only recommended)
├── sentry-mcp-server/      # Error tracking and crash analysis
├── vercel-mcp-server/      # Deployment orchestration
├── eas-mcp-server/         # Expo build management
├── stripe-mcp-server/      # Payment analytics (read-only recommended)
└── revenuecat-mcp-server/  # Subscription analytics (read-only recommended)
```

## Setup Instructions

### 1. GitHub MCP Server (Active)

The GitHub server is **already configured** in `.cursor/mcp.json` and uses the official npm package:

```json
"github": {
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-github"],
  "env": {
    "GITHUB_TOKEN": "${env:GITHUB_TOKEN}",
    "GITHUB_REPO": "ayais12210-hub/Linguamate-ai-tutor"
  }
}
```

**No installation required** - `npx` automatically downloads and runs the server when Cursor starts.

**What you need**: Just add `GITHUB_TOKEN` to your `.env` file (see instructions below).

### 2. Optional Servers

Other servers can be installed similarly. Check the [MCP Server Directory](https://github.com/modelcontextprotocol/servers) for available implementations.

#### Filesystem & HTTP Servers
These are provided by `@modelcontextprotocol` packages and run via `npx` - no local setup needed.

#### Database/Redis Servers
For Postgres and Redis MCP servers, ensure you:
1. Use **read-only** database users for safety
2. Restrict access to non-production databases initially
3. Add connection strings to `.env` (never commit secrets!)

#### API Servers (Sentry, Vercel, EAS, Stripe, RevenueCat)
For third-party service integrations:
1. Generate **read-only** or **limited-scope** API tokens
2. Store tokens in `.env` with `_RO` suffix to indicate read-only
3. Enable servers only when needed (uncomment in `.cursor/mcp.json`)

## Security Guidelines

⚠️ **CRITICAL**: Always follow these security practices:

1. **Read-Only First**: Start with read-only access for all servers. Upgrade to write access only after testing.

2. **Scoped Tokens**: Use the minimum permission scopes required for each server.

3. **No Secrets in Git**: All API tokens, database URLs, and credentials must be in `.env` (gitignored).

4. **Audit Write Access**: The CI workflow (`.github/workflows/mcp-sanity.yml`) enforces that filesystem write access is limited to safe directories.

5. **Review Agent Changes**: Always review agent-generated PRs before merging, especially for:
   - Schema changes
   - API modifications
   - Security-related code

## Testing MCP Servers

To verify a server is working:

1. **Start Cursor** and ensure `.cursor/mcp.json` is loaded
2. **Open Cursor AI Chat**
3. **Test with a simple prompt**, e.g.:
   - GitHub: "List open issues labeled 'bug'"
   - Filesystem: "Read the contents of README.md"
   - HTTP: "Fetch https://api.github.com/repos/ayais12210-hub/Linguamate-ai-tutor"

4. **Check for errors** in Cursor's MCP logs (View → Output → Model Context Protocol)

## Troubleshooting

### Server not found
- Check the `command` and `args` paths in `.cursor/mcp.json`
- For local servers, ensure `dist/index.js` exists
- For npm packages, ensure you're using `npx` correctly

### Permission denied (filesystem)
- Check the `permissions` object in `.cursor/mcp.json`
- Ensure the path you're trying to access is in the `read` or `write` array

### Connection refused (DB/Redis)
- Verify the connection string in `.env`
- Ensure the database/Redis instance is running and accessible
- Check network firewalls and security groups

### HTTP request blocked
- Add the host to `MCP_HTTP_ALLOWED_HOSTS` in `.cursor/mcp.json`
- Restart Cursor after changing the config

## Resources

- [Official MCP Documentation](https://modelcontextprotocol.io)
- [Cursor MCP Guide](https://docs.cursor.com/advanced/model-context-protocol)
- [MCP Server Repository](https://github.com/modelcontextprotocol/servers)
- [Linguamate MCP Guide](../docs/mcp.md)
- [MCP Prompt Pack](../docs/mcp-prompts.md)

## Contributing

When adding a new MCP server:

1. Create a subdirectory: `.mcp/<server-name>/`
2. Add setup instructions to this README
3. Add environment variables to `.env.example`
4. Document usage in `docs/mcp.md`
5. Add sample prompts to `docs/mcp-prompts.md`
6. Update `.cursor/mcp.json` with the new server config (commented out)
7. Open a PR for review

---

**Last updated**: 2025-10-06
