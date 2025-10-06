# Sentry MCP Server

This directory is for the Sentry Model Context Protocol server (optional).

## Setup

1. Install a Sentry MCP server implementation
2. Update `.cursor/mcp.json` (uncomment the sentry block)
3. Add to `.env`:
   ```
   SENTRY_DSN_RO=https://public@sentry.io/project-id
   ```

## Security

⚠️ Use a **read-only auth token** for Sentry API access.

Generate a token at: https://sentry.io/settings/account/api/auth-tokens/

Required scopes:
- `event:read`
- `project:read`
- `org:read`

## Usage

Once configured, you can:
- Fetch top crashes by platform (Android, iOS, Web)
- Analyze error trends over time
- Extract stack traces for debugging
- Create GitHub issues from Sentry events
- Monitor error frequency and affected users

## Example Prompts

```
"List top 5 crashes on Android in the last 7 days"
"Show me the stack trace for Sentry issue LING-123"
"Create a GitHub issue for all unresolved crashes with >100 occurrences"
```
