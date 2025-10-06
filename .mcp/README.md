# Local MCP Servers

This directory contains locally installed MCP servers for the Linguamate project.

## Structure

- `github-mcp-server/` - GitHub MCP server for repository operations
- `postgres-mcp-server/` - PostgreSQL MCP server (optional)
- `redis-mcp-server/` - Redis MCP server (optional)
- `sentry-mcp-server/` - Sentry MCP server (optional)
- `vercel-mcp-server/` - Vercel deployment MCP server (optional)
- `eas-mcp-server/` - EAS build MCP server (optional)
- `stripe-mcp-server/` - Stripe payments MCP server (optional)
- `revenuecat-mcp-server/` - RevenueCat subscriptions MCP server (optional)

## Installation

To install a local MCP server:

1. Clone the server repository
2. Build the server (`npm run build` or similar)
3. Place the built files in the appropriate subdirectory
4. Update `.cursor/mcp.json` to point to the correct path
5. Restart Cursor

## Alternative: NPM packages

Many MCP servers are available as NPM packages. You can use `npx` commands in `.cursor/mcp.json` instead of local installations:

```json
{
  "command": "npx",
  "args": ["@some/mcp-server-package"]
}
```