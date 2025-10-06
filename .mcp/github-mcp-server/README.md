# GitHub MCP Server

The GitHub MCP server is **already configured** and ready to use!

## Current Setup

The server uses the official npm package via `npx`:

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

**No installation needed** - `npx` automatically downloads the server when Cursor starts.

This directory exists as a placeholder for future local vendoring if needed, but it's not required for normal operation.

## Required Environment Variables

Add to your `.env`:
```
GITHUB_TOKEN=your_github_personal_access_token
```

**Token scopes required:**
- `repo` (for private repos) or `public_repo` (for public repos only)
- `read:org` (optional, for organization access)

## Usage

Once configured, you can:
- List, create, and close issues
- Create and merge pull requests
- Read workflow run logs
- Manage labels and milestones
- Review PR comments and changes

## Security

⚠️ Use a token with **minimal required scopes**. For Linguamate (public repo), `public_repo` is sufficient for most operations.

Do not commit your GitHub token to the repository - it should only exist in `.env` (gitignored).
