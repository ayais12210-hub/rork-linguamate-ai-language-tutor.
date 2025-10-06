# EAS (Expo Application Services) MCP Server

This directory is for the EAS Model Context Protocol server (optional).

## Setup

1. Install an EAS MCP server or use EAS API via HTTP MCP
2. Update `.cursor/mcp.json` (uncomment the eas block)
3. Add to `.env`:
   ```
   EAS_TOKEN=your_eas_token
   ```

## Security

Generate an EAS token:
```bash
eas login
eas build:configure  # if not already configured
# Token is stored in ~/.expo/state.json
```

Or create a token at: https://expo.dev/accounts/[account]/settings/access-tokens

⚠️ Use a token with **read-only** access for most agent tasks.

## Usage

Once configured, you can:
- Check Android/iOS build status
- Fetch build logs for failed builds
- List update channels and deployments
- Verify build credentials
- Monitor build queue times

## Example Prompts

```
"Show me the latest Android and iOS build status"
"Fetch logs for the failed iOS build"
"List all builds from the last 48 hours"
"Check which update channel is active for production"
```

## Notes

Linguamate uses EAS for:
- Native Android builds (Google Play)
- Native iOS builds (App Store)
- OTA updates via EAS Update

This MCP server helps automate build monitoring and debugging.
