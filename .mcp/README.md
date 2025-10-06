# MCP Server Directory

This directory contains local installations of MCP servers used by Linguamate.

## Directory Structure

```
.mcp/
├── github-mcp-server/     # GitHub integration server
│   └── dist/
│       └── index.js       # Built server file
├── postgres-mcp-server/   # PostgreSQL integration (optional)
├── redis-mcp-server/      # Redis integration (optional)
├── vercel-mcp-server/     # Vercel deployment (optional)
├── eas-mcp-server/        # Expo EAS integration (optional)
├── sentry-mcp-server/     # Sentry observability (optional)
├── revenuecat-mcp-server/ # RevenueCat billing (optional)
└── stripe-mcp-server/     # Stripe billing (optional)
```

## Installation Notes

### GitHub MCP Server (Required)
1. Clone the GitHub MCP server repository
2. Build it and place the output in `github-mcp-server/dist/`
3. Alternatively, update `.cursor/mcp.json` to use an npm package

### Optional Servers
Other servers are optional and should be installed only when needed.
Each server requires corresponding environment variables in `.env`.

## Security
- This directory is gitignored to prevent accidental commits of server binaries
- Always use read-only credentials where possible
- Limit server permissions to minimum required scope