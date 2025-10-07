# Developer Guide

## Overview

This project uses Expo + React Native + TypeScript with a local MCP (Model Context Protocol) stack for enhanced development capabilities. The MCP stack provides safe, controlled access to development tools without requiring any external API keys or secrets.

## 🚀 Local MCP Stack (No API Keys)

### What is MCP?

MCP (Model Context Protocol) is a protocol for connecting AI assistants to external tools and data sources. This implementation provides local servers that can be used by AI agents to interact with your development environment safely.

### Available Servers

#### 🗂️ Filesystem Server
- **Purpose**: Safe file operations within project boundaries
- **Commands**: `readFile`, `writeFile`, `listDir`, `exists`, `getStats`
- **Safety**: 
  - Path traversal protection
  - Blocks access to `node_modules`, `.git`, `.expo`, `coverage`, `dist`, `build`
  - Blocks hidden files except `.env.example`

#### 💻 Terminal Server
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

#### 🗄️ SQLite Server
- **Purpose**: Local database operations
- **Database**: `data/dev.sqlite` (created automatically)
- **Operations**: `query`, `exec`
- **Safety**:
  - Blocks dangerous PRAGMA statements
  - Blocks ATTACH/DETACH operations
  - Blocks `.read` file operations
  - Blocks triggers, views, VACUUM, ANALYZE, REINDEX
  - Uses parameterized queries to prevent SQL injection

#### 📚 Docs Server
- **Purpose**: Automated documentation generation
- **Operations**: `renderReadme`, `updateChangelog`, `generateDeveloperGuide`
- **Features**:
  - Scans project structure automatically
  - Generates README with project overview
  - Updates CHANGELOG with new entries
  - Creates comprehensive developer guide

## Development Workflow

### 1. Start Development
```bash
# Start all MCP servers
npm run mcp:dev

# Start app + backend
npm run dev:full

# Start individual servers
npm run mcp:files    # Filesystem server
npm run mcp:term     # Terminal server  
npm run mcp:sqlite   # SQLite server
npm run mcp:docs     # Docs server
```

### 2. Code Quality
```bash
# TypeScript checking
npm run typecheck

# ESLint
npm run lint

# Prettier formatting
npm run format:fix

# Jest tests
npm test

# Full scan
npm run scan
```

### 3. CI/CD
- GitHub Actions runs on PR/push
- Tests: typecheck, lint, test, build
- Coverage reporting
- Security scanning

## Communication Protocol

All servers use a simple JSON-RPC protocol over stdin/stdout:

### Filesystem Server
```json
{"method": "readFile", "params": ["package.json"]}
{"method": "writeFile", "params": ["test.txt", "Hello World"]}
{"method": "listDir", "params": ["src"]}
```

### Terminal Server
```json
{"cmd": "npm run typecheck"}
{"cmd": "git status"}
```

### SQLite Server
```json
{"method": "query", "sql": "SELECT * FROM users", "params": []}
{"method": "exec", "sql": "CREATE TABLE test (id INTEGER PRIMARY KEY)", "params": []}
```

### Docs Server
```json
{"action": "renderReadme"}
{"action": "updateChangelog"}
{"action": "generateDeveloperGuide"}
```

## Project Structure

### Core Directories
- `app/` - Expo Router pages and layouts
- `components/` - Reusable UI components
- `modules/` - Feature modules and business logic
- `lib/` - Utility functions and helpers
- `hooks/` - Custom React hooks
- `state/` - State management (Zustand)
- `schemas/` - Zod validation schemas
- `backend/` - Hono API server
- `mcp/` - MCP server implementations

### Configuration Files
- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript configuration
- `eslint.config.cjs` - ESLint rules
- `jest.config.ts` - Jest test configuration
- `.prettierrc.json` - Prettier formatting rules
- `mcp.config.json` - MCP server configuration

## Testing

### Unit Tests
```bash
npm test                    # Run tests
npm run test:watch         # Watch mode
npm run test:changed       # Test changed files
npm run test:ci            # CI mode with coverage
```

### E2E Tests
```bash
npm run e2e                # Playwright tests
npm run e2e:ci             # CI mode
npm run a11y               # Accessibility tests
```

### Coverage
- Target: 85%+ diff coverage on changed lines
- Jest + @testing-library/react-native
- MSW for network mocking

## Security Boundaries

### 🔒 Path Traversal Protection
All file operations are restricted to the project root directory. Attempts to access files outside the project are blocked.

### 🚫 Command Allowlist
Terminal operations are restricted to a predefined list of safe commands. Any attempt to execute unauthorized commands is rejected.

### 🛡️ SQL Injection Prevention
Database operations use parameterized queries and block dangerous SQL statements.

### 🔐 No External Dependencies
All operations are local - no API keys, tokens, or external services required.

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

### ESM/CJS Issues
- All MCP servers use CommonJS for compatibility
- Project uses TypeScript with proper module resolution

### Port Conflicts
- MCP servers use stdin/stdout communication
- No port conflicts expected

## Development Tips

### Using MCP Servers with AI
1. Start MCP servers: `npm run mcp:dev`
2. Use AI tools that support MCP protocol
3. Servers provide safe, controlled access to development environment
4. All operations are logged and auditable

### Code Quality
- Use TypeScript strict mode
- Follow ESLint rules (no unused vars, import order)
- Use Prettier for consistent formatting
- Write tests for new features
- Use conventional commits

### Performance
- Use React.memo for expensive components
- Implement proper error boundaries
- Use React Query for data fetching
- Optimize images and assets

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `npm run scan`
5. Commit your changes: `git commit -m 'feat: add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Commit Convention
- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `test:` - Test additions/changes
- `refactor:` - Code refactoring
- `chore:` - Build/tooling changes
- `perf:` - Performance improvements

## Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/)
- [Jest Documentation](https://jestjs.io/)
- [ESLint Documentation](https://eslint.org/)
- [Prettier Documentation](https://prettier.io/)
- [MCP Protocol](https://modelcontextprotocol.io/)