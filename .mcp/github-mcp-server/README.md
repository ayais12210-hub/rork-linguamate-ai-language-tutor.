# GitHub MCP Server

This directory is for the GitHub Model Context Protocol server.

## Setup

**Option A: Use npm package (recommended)**

Update `.cursor/mcp.json`:
```json
"github": {
  "command": "npx",
  "args": ["@modelcontextprotocol/server-github"],
  "env": {
    "GITHUB_TOKEN": "${env:GITHUB_TOKEN}",
    "GITHUB_REPO": "ayais12210-hub/Linguamate-ai-tutor"
  }
}
```

**Option B: Vendor locally**

```bash
cd .mcp/github-mcp-server
npm install @modelcontextprotocol/server-github
# Server will be available in node_modules
```

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
