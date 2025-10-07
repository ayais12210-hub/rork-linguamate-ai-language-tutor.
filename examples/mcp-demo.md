# MCP Demo: Step-by-Step Usage Guide

This guide demonstrates how to use the MCP servers for common development tasks.

## Prerequisites

1. Install dependencies: `npm install`
2. Start MCP servers: `npm run mcp:dev`

## Demo 1: Reading and Analyzing Project Files

### Step 1: Read Package.json
```bash
# Start filesystem server
npm run mcp:files
```

Send JSON command:
```json
{"method": "readFile", "params": ["package.json"]}
```

Expected response:
```json
{
  "ok": true,
  "result": {
    "content": "{\n  \"name\": \"expo-app\",\n  \"version\": \"1.0.0\",\n  ...",
    "path": "package.json",
    "size": 1234
  }
}
```

### Step 2: List Project Structure
```json
{"method": "listDir", "params": ["src"]}
```

### Step 3: Check File Existence
```json
{"method": "exists", "params": ["README.md"]}
```

## Demo 2: Running Development Commands

### Step 1: Start Terminal Server
```bash
npm run mcp:term
```

### Step 2: Check Node Version
```json
{"cmd": "node -v"}
```

### Step 3: Run TypeScript Check
```json
{"cmd": "npm run typecheck"}
```

### Step 4: Run Tests
```json
{"cmd": "npm test"}
```

### Step 5: Check Git Status
```json
{"cmd": "git status"}
```

## Demo 3: Database Operations

### Step 1: Start SQLite Server
```bash
npm run mcp:sqlite
```

### Step 2: Create a Table
```json
{
  "method": "exec",
  "sql": "CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT, email TEXT)",
  "params": []
}
```

### Step 3: Insert Data
```json
{
  "method": "exec",
  "sql": "INSERT INTO users (name, email) VALUES (?, ?)",
  "params": ["John Doe", "john@example.com"]
}
```

### Step 4: Query Data
```json
{
  "method": "query",
  "sql": "SELECT * FROM users",
  "params": []
}
```

### Step 5: Try Dangerous Operation (Should Fail)
```json
{
  "method": "exec",
  "sql": "PRAGMA foreign_keys = ON",
  "params": []
}
```

Expected error:
```json
{
  "ok": false,
  "error": "Statement contains dangerous operations and is not allowed"
}
```

## Demo 4: Documentation Generation

### Step 1: Start Docs Server
```bash
npm run mcp:docs
```

### Step 2: Generate README
```json
{"action": "renderReadme"}
```

### Step 3: Update Changelog
```json
{"action": "updateChangelog"}
```

### Step 4: Generate Developer Guide
```json
{"action": "generateDeveloperGuide"}
```

## Demo 5: Complete Workflow

### Scenario: Add a New Feature

1. **Read existing component**:
   ```json
   {"method": "readFile", "params": ["components/Button.tsx"]}
   ```

2. **Create new component**:
   ```json
   {
     "method": "writeFile",
     "params": [
       "components/NewButton.tsx",
       "import React from 'react';\n\nexport const NewButton = () => {\n  return <button>New Button</button>;\n};"
     ]
   }
   ```

3. **Run typecheck**:
   ```json
   {"cmd": "npm run typecheck"}
   ```

4. **Run tests**:
   ```json
   {"cmd": "npm test"}
   ```

5. **Update documentation**:
   ```json
   {"action": "renderReadme"}
   ```

## Security Demonstrations

### Path Traversal Protection
```json
{"method": "readFile", "params": ["../../../etc/passwd"]}
```
Expected error: "Path traversal denied"

### Command Allowlist
```json
{"cmd": "rm -rf /"}
```
Expected error: "Command not allowed"

### SQL Injection Prevention
```json
{
  "method": "query",
  "sql": "SELECT * FROM users WHERE id = 1; DROP TABLE users;",
  "params": []
}
```
Expected: Safe execution with parameterized queries

## Troubleshooting

### Server Not Responding
- Check if server is running: `ps aux | grep node`
- Restart server: `npm run mcp:dev`
- Check logs for error messages

### Permission Errors
- Ensure `data/` directory is writable
- Check file permissions for target files
- Verify project directory access

### Database Issues
- Check if `data/dev.sqlite` exists
- Verify SQLite installation
- Check for database locks

## Best Practices

1. **Always validate inputs** before sending to servers
2. **Use parameterized queries** for database operations
3. **Check error responses** and handle appropriately
4. **Monitor server logs** for security issues
5. **Keep servers updated** with latest security patches

## Integration Examples

### With AI Tools
```python
# Python example for AI integration
import subprocess
import json

def call_mcp_server(server, command):
    process = subprocess.Popen(
        ['node', f'./mcp/servers/{server}/server.js'],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )
    
    stdout, stderr = process.communicate(input=json.dumps(command) + '\n')
    return json.loads(stdout)

# Usage
result = call_mcp_server('filesystem', {
    'method': 'readFile',
    'params': ['package.json']
})
```

### With Shell Scripts
```bash
#!/bin/bash
# Shell script example

echo '{"method": "readFile", "params": ["package.json"]}' | \
node ./mcp/servers/filesystem/server.js | \
jq -r '.result.content' | \
jq '.name'
```

This demo shows the power and safety of the MCP stack for AI-assisted development!