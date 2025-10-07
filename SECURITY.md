# Security Policy

## Overview

This document outlines the security measures implemented in the Linguamate MCP (Model Context Protocol) stack and provides guidelines for reporting security vulnerabilities.

## Security Boundaries

### 🔒 Filesystem Server Security

#### Path Traversal Protection
- All file operations are restricted to the project root directory
- Path resolution uses `path.resolve()` with prefix checking
- Attempts to access files outside the project are blocked with clear error messages
- Relative paths are resolved against the project root

#### Directory Access Control
- **Blocked Directories**: `node_modules`, `.git`, `.expo`, `coverage`, `dist`, `build`
- **Blocked Files**: Hidden files (starting with `.`) except `.env.example`
- **Allowed Operations**: `readFile`, `writeFile`, `listDir`, `exists`, `getStats`

#### Implementation Details
```javascript
const ROOT = path.resolve(__dirname, '../../..');
const BLOCKED = new Set(['node_modules', '.git', '.expo', 'coverage', 'dist', 'build']);

function safePath(p) {
  const abs = path.resolve(ROOT, p);
  if (!abs.startsWith(ROOT)) {
    throw new Error('Path traversal denied');
  }
  // Additional checks...
}
```

### 🚫 Terminal Server Security

#### Command Allowlist
- **Deny-by-Default**: All commands are blocked unless explicitly allowed
- **Allowed Commands**:
  - `node -v`, `npm -v` (version checks)
  - `npm run typecheck`, `npm run lint`, `npm test`, `npm run test:ci`
  - `npm run format:check`, `npm run format:fix`
  - `npm run build`, `npm run web:build`
  - `git status`, `git diff --name-only`, `git rev-parse --abbrev-ref HEAD`
  - `git log --oneline -5`, `git branch -a`
  - `npm audit --audit-level=high`
  - `npm run scan`, `npm run scan:full`

#### Process Safety
- **Timeout**: 2-minute timeout for all commands
- **Working Directory**: Commands run in project root
- **Output Capture**: Both stdout and stderr are captured
- **Error Handling**: Failed commands return structured error information

#### Implementation Details
```javascript
const ALLOWED_COMMANDS = new Set([
  'node -v', 'npm -v',
  'npm run typecheck', 'npm run lint', 'npm test',
  // ... other allowed commands
]);

function runCommand(cmd) {
  if (!ALLOWED_COMMANDS.has(cmd)) {
    throw new Error(`Command not allowed: ${cmd}`);
  }
  // Execute with timeout and safety measures...
}
```

### 🛡️ SQLite Server Security

#### SQL Injection Prevention
- **Parameterized Queries**: All queries use parameter binding
- **Statement Validation**: SQL statements are validated before execution
- **Dangerous Operation Blocking**: Blocks dangerous SQL operations

#### Blocked Operations
- **PRAGMA Statements**: Except `table_info`, `index_list`, `index_info`
- **ATTACH/DETACH**: Database attachment operations
- **File Operations**: `.read` commands
- **Schema Modifications**: Triggers, views, VACUUM, ANALYZE, REINDEX

#### Implementation Details
```javascript
const DANGEROUS_PATTERNS = [
  /PRAGMA\s+(?!table_info|index_list|index_info)/i,
  /ATTACH\s+/i,
  /DETACH\s+/i,
  /\.read\s+/i,
  /CREATE\s+TRIGGER/i,
  // ... other dangerous patterns
];

function isDangerous(sql) {
  return DANGEROUS_PATTERNS.some(pattern => pattern.test(sql));
}
```

### 🔐 General Security Measures

#### No External Dependencies
- **Local Operations Only**: All MCP operations are local
- **No API Keys**: No external API keys or secrets required
- **No Network Access**: Servers don't make external network requests
- **No File System Access**: Limited to project directory

#### Communication Security
- **JSON-RPC Protocol**: Simple, structured communication
- **Input Validation**: All inputs are validated before processing
- **Error Handling**: Structured error responses without sensitive information
- **Logging**: All operations are logged for audit purposes

## Security Best Practices

### For Developers

1. **Never Modify Security Boundaries**
   - Don't add commands to the terminal allowlist without review
   - Don't modify path traversal protection
   - Don't remove SQL injection prevention measures

2. **Input Validation**
   - Always validate inputs before processing
   - Use parameterized queries for database operations
   - Sanitize file paths and names

3. **Error Handling**
   - Don't expose sensitive information in error messages
   - Log security-related events
   - Use structured error responses

4. **Code Review**
   - All security-related changes require review
   - Test security boundaries thoroughly
   - Document security implications

### For Users

1. **Trust Boundaries**
   - Only use MCP servers from trusted sources
   - Review server implementations before use
   - Don't modify security configurations

2. **Monitoring**
   - Monitor server logs for suspicious activity
   - Report unexpected behavior immediately
   - Keep servers updated

## Vulnerability Reporting

### How to Report

If you discover a security vulnerability, please report it responsibly:

1. **Email**: security@linguamate.ai
2. **Subject**: "Security Vulnerability - MCP Stack"
3. **Include**:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### Response Process

1. **Acknowledgment**: We'll acknowledge receipt within 24 hours
2. **Investigation**: We'll investigate and validate the report
3. **Fix Development**: We'll develop and test a fix
4. **Disclosure**: We'll coordinate disclosure with the reporter
5. **Release**: We'll release the fix and security advisory

### Responsible Disclosure

- **Do not** publicly disclose vulnerabilities before we've had a chance to fix them
- **Do not** use vulnerabilities to access systems or data
- **Do** provide detailed information to help us reproduce and fix the issue
- **Do** allow reasonable time for fixes to be developed and deployed

## Security Updates

### Regular Updates

- **Dependencies**: Keep all dependencies updated
- **Security Patches**: Apply security patches promptly
- **Configuration**: Review and update security configurations regularly
- **Monitoring**: Monitor for new security threats and vulnerabilities

### Security Testing

- **Automated Scanning**: Regular automated security scans
- **Penetration Testing**: Periodic penetration testing
- **Code Review**: Security-focused code reviews
- **Audit Logs**: Regular review of audit logs

## Compliance

### Data Protection

- **No Personal Data**: MCP servers don't process personal data
- **Local Storage**: All data stays local to the development environment
- **No Tracking**: No user tracking or analytics

### Privacy

- **No External Communication**: Servers don't communicate externally
- **No Data Collection**: No data is collected or transmitted
- **Transparent Operation**: All operations are logged and auditable

## Contact

For security-related questions or concerns:

- **Email**: security@linguamate.ai
- **Documentation**: This security policy
- **Updates**: Check this file for security updates

## Changelog

- **2024-01-XX**: Initial security policy
- **2024-01-XX**: Added MCP stack security boundaries
- **2024-01-XX**: Enhanced vulnerability reporting process