# Vercel MCP Server

This directory is for the Vercel Model Context Protocol server (optional).

## Setup

1. Install a Vercel MCP server or use their API via HTTP MCP
2. Update `.cursor/mcp.json` (uncomment the vercel block)
3. Add to `.env`:
   ```
   VERCEL_TOKEN=your_vercel_token
   ```

## Security

Generate a Vercel token at: https://vercel.com/account/tokens

⚠️ Use a token with **minimal scopes**:
- Read-only access is sufficient for most agent tasks
- Only enable deployment permissions if needed

## Usage

Once configured, you can:
- Check deployment status
- Fetch build logs
- List preview deployments
- Promote deployments to production (with approval)
- Monitor edge function performance

## Example Prompts

```
"Show me the latest web deployment status"
"Fetch build logs for the failed deployment"
"List all preview deployments from the last 3 days"
"Promote preview deployment abc123 to production"
```

## Notes

Linguamate web deployments go through Vercel. This server is useful for:
- Automated deployment verification
- Log analysis for failed builds
- Rollback coordination
