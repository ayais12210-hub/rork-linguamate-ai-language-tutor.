# MCP (Model Context Protocol) Local Stack

This directory contains a local MCP server implementation that provides safe, controlled access to development tools without requiring any external API keys or secrets.

## What is MCP?

MCP (Model Context Protocol) is a protocol for connecting AI assistants to external tools and data sources. This implementation provides local servers that can be used by AI agents to interact with your development environment safely.

## Available Servers

### 🗂️ Filesystem Server (`filesystem`)
- **Purpose**: Safe file operations within project boundaries
- **Operations**: `readFile`, `writeFile`, `listDir`, `exists`, `getStats`
- **Safety**: 
  - Path traversal protection
  - Blocks access to `node_modules`, `.git`, `.expo`, `coverage`, `dist`, `build`
  - Blocks hidden files except `.env.example`

### 💻 Terminal Server (`terminal`)
- **Purpose**: Controlled command execution
- **Safety**: Deny-by-default allowlist of safe commands
- **Allowed Commands**:
  - `node -v`, `npm -v`
  - `npm run typecheck`, `npm run lint`, `npm test`, `npm run test:ci`
  - `npm run format:check`, `npm run format:fix`
  - `npm run build`, `npm run web:build`
  - `git status`, `git diff --name-only`, `git rev-parse --abbrev-ref HEAD`
  - `git log --oneline -5`, `git branch -a`
  - `npm audit --audit-level=high`
  - `npm run scan`, `npm run scan:full`

### 🗄️ SQLite Server (`sqlite`)
- **Purpose**: Local database operations
- **Database**: `data/dev.sqlite` (created automatically)
- **Operations**: `query`, `exec`
- **Safety**:
  - Blocks dangerous PRAGMA statements
  - Blocks ATTACH/DETACH operations
  - Blocks `.read` file operations
  - Blocks triggers, views, VACUUM, ANALYZE, REINDEX
  - Uses parameterized queries to prevent SQL injection

### 📚 Docs Server (`docs`)
- **Purpose**: Automated documentation generation
- **Operations**: `renderReadme`, `updateChangelog`, `generateDeveloperGuide`
- **Features**:
  - Scans project structure automatically
  - Generates README with project overview
  - Updates CHANGELOG with new entries
  - Creates comprehensive developer guide

## Usage

### Starting All Servers
```bash
npm run mcp:dev
```

### Starting Individual Servers
```bash
npm run mcp:files    # Filesystem server
npm run mcp:term     # Terminal server  
npm run mcp:sqlite   # SQLite server
npm run mcp:docs     # Docs server
```

### Communication Protocol

All servers use a simple JSON-RPC protocol over stdin/stdout:

**Filesystem Server**:
```json
{"method": "readFile", "params": ["package.json"]}
{"method": "writeFile", "params": ["test.txt", "Hello World"]}
{"method": "listDir", "params": ["src"]}
```

**Terminal Server**:
```json
{"cmd": "npm run typecheck"}
{"cmd": "git status"}
```

**SQLite Server**:
```json
{"method": "query", "sql": "SELECT * FROM users", "params": []}
{"method": "exec", "sql": "CREATE TABLE test (id INTEGER PRIMARY KEY)", "params": []}
```

**Docs Server**:
```json
{"action": "renderReadme"}
{"action": "updateChangelog"}
{"action": "generateDeveloperGuide"}
```

## Security Features

### 🔒 Path Traversal Protection
All file operations are restricted to the project root directory. Attempts to access files outside the project are blocked.

### 🚫 Command Allowlist
Terminal operations are restricted to a predefined list of safe commands. Any attempt to execute unauthorized commands is rejected.

### 🛡️ SQL Injection Prevention
Database operations use parameterized queries and block dangerous SQL statements.

### 🔐 No External Dependencies
All operations are local - no API keys, tokens, or external services required.

## Configuration

The MCP configuration is defined in `config/mcp.config.json` and validated against `config/schema/mcp.config.schema.json`.

## Troubleshooting

### Server Not Starting
- Check that Node.js is installed and accessible
- Verify the server script files exist and are executable
- Check for port conflicts (servers use stdin/stdout, not network ports)

### Permission Errors
- Ensure the `data/` directory is writable for SQLite operations
- Check file permissions for filesystem operations

### Database Issues
- The SQLite database is created automatically in `data/dev.sqlite`
- If using better-sqlite3, it will be used; otherwise falls back to sqlite3
- Database operations are restricted to prevent data corruption

## Development

To modify or extend the MCP servers:

1. Edit the server files in `servers/`
2. Update the configuration in `config/mcp.config.json`
3. Test changes with `npm run mcp:dev`
4. Update documentation as needed

## Safety Notes

- All servers implement security boundaries to prevent malicious operations
- File operations are restricted to the project directory
- Terminal commands are limited to safe development operations
- Database operations block dangerous SQL statements
- No external network access or API keys are used

This MCP stack provides a safe, local development environment for AI-assisted coding without compromising security or requiring external dependencies.