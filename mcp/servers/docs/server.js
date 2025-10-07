const fs = require('fs/promises');
const path = require('path');

const ROOT = path.resolve(__dirname, '../../..');

async function readPackageJson() {
  try {
    const content = await fs.readFile(path.join(ROOT, 'package.json'), 'utf8');
    return JSON.parse(content);
  } catch (e) {
    return { name: 'expo-app', version: '1.0.0' };
  }
}

async function scanProjectStructure() {
  const structure = {
    app: [],
    components: [],
    modules: [],
    lib: [],
    hooks: [],
    state: [],
    schemas: []
  };

  for (const [dir, files] of Object.entries(structure)) {
    try {
      const dirPath = path.join(ROOT, dir);
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      files.push(...entries
        .filter(entry => entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')))
        .map(entry => entry.name)
        .sort()
      );
    } catch (e) {
      // Directory doesn't exist or can't be read
    }
  }

  return structure;
}

async function generateReadme(pkg, structure) {
  const sections = [
    '# README',
    '',
    `## ${pkg.name}`,
    '',
    `Version: ${pkg.version}`,
    '',
    '## Project Structure',
    '',
    '### App Components',
    structure.app.length > 0 ? structure.app.map(file => `- \`${file}\``).join('\n') : 'No app components found',
    '',
    '### UI Components',
    structure.components.length > 0 ? structure.components.map(file => `- \`${file}\``).join('\n') : 'No components found',
    '',
    '### Modules',
    structure.modules.length > 0 ? structure.modules.map(file => `- \`${file}\``).join('\n') : 'No modules found',
    '',
    '### Utilities',
    structure.lib.length > 0 ? structure.lib.map(file => `- \`${file}\``).join('\n') : 'No utilities found',
    '',
    '### Hooks',
    structure.hooks.length > 0 ? structure.hooks.map(file => `- \`${file}\``).join('\n') : 'No hooks found',
    '',
    '### State Management',
    structure.state.length > 0 ? structure.state.map(file => `- \`${file}\``).join('\n') : 'No state files found',
    '',
    '### Schemas',
    structure.schemas.length > 0 ? structure.schemas.map(file => `- \`${file}\``).join('\n') : 'No schemas found',
    '',
    '## Development',
    '',
    '### Available Scripts',
    Object.keys(pkg.scripts || {}).map(script => `- \`npm run ${script}\``).join('\n'),
    '',
    '### MCP Servers',
    '',
    'This project includes local MCP (Model Context Protocol) servers for enhanced development:',
    '',
    '- **Filesystem Server**: Safe file operations within project boundaries',
    '- **Terminal Server**: Controlled command execution with allowlist',
    '- **SQLite Server**: Local database operations with safety restrictions',
    '- **Docs Server**: Automated documentation generation',
    '',
    'Run all servers: `npm run mcp:dev`',
    '',
    '## Security',
    '',
    'All MCP servers implement security boundaries:',
    '- Path traversal protection',
    '- Command allowlists',
    '- SQL injection prevention',
    '- No external API keys required'
  ];

  return sections.join('\n');
}

async function updateChangelog(pkg) {
  const changelogPath = path.join(ROOT, 'CHANGELOG.md');
  let existingContent = '';
  
  try {
    existingContent = await fs.readFile(changelogPath, 'utf8');
  } catch (e) {
    // File doesn't exist, start fresh
  }

  const newEntry = `## [${pkg.version}] - ${new Date().toISOString().split('T')[0]}

### Added
- Local MCP stack with filesystem, terminal, SQLite, and docs servers
- Enhanced development tooling with ESLint, Prettier, Jest, and Husky
- GitHub Actions CI workflow for automated testing
- Comprehensive documentation and developer guide

### Security
- Path traversal protection in filesystem operations
- Command allowlist for terminal operations
- SQL injection prevention in database operations
- No external API keys or secrets required

`;

  const updatedContent = newEntry + (existingContent ? '\n' + existingContent : '');
  return updatedContent;
}

async function generateDeveloperGuide(pkg, structure) {
  const guide = `# Developer Guide

## Overview

This project uses Expo + React Native + TypeScript with a local MCP (Model Context Protocol) stack for enhanced development capabilities.

## MCP Servers

### Filesystem Server
- **Purpose**: Safe file operations within project boundaries
- **Commands**: \`readFile\`, \`writeFile\`, \`listDir\`, \`exists\`, \`getStats\`
- **Safety**: Path traversal protection, blocked directories (node_modules, .git, etc.)

### Terminal Server
- **Purpose**: Controlled command execution
- **Safety**: Deny-by-default allowlist of safe commands
- **Allowed Commands**: npm scripts, git status/diff, node/npm versions

### SQLite Server
- **Purpose**: Local database operations
- **Database**: \`data/dev.sqlite\`
- **Safety**: Blocks dangerous PRAGMA, ATTACH, DETACH, triggers, views

### Docs Server
- **Purpose**: Automated documentation generation
- **Commands**: \`renderReadme\`, \`updateChangelog\`, \`generateDeveloperGuide\`

## Development Workflow

1. **Start Development**:
   \`\`\`bash
   npm run mcp:dev  # Start all MCP servers
   npm run dev:full  # Start app + backend
   \`\`\`

2. **Code Quality**:
   \`\`\`bash
   npm run typecheck  # TypeScript checking
   npm run lint       # ESLint
   npm run format:fix # Prettier formatting
   npm test           # Jest tests
   \`\`\`

3. **CI/CD**:
   - GitHub Actions runs on PR/push
   - Tests: typecheck, lint, test, build
   - Coverage reporting

## Project Structure

${Object.entries(structure)
  .filter(([_, files]) => files.length > 0)
  .map(([dir, files]) => `### ${dir}/\n${files.map(file => `- \`${file}\``).join('\n')}`)
  .join('\n\n')}

## Troubleshooting

### Port Conflicts
- MCP servers use stdin/stdout communication
- No port conflicts expected

### ESM/CJS Issues
- All MCP servers use CommonJS for compatibility
- Project uses TypeScript with proper module resolution

### Database Issues
- SQLite database created automatically in \`data/dev.sqlite\`
- Falls back to sqlite3 if better-sqlite3 unavailable

## Security Boundaries

- **Filesystem**: Restricted to project root, blocks sensitive directories
- **Terminal**: Whitelist of safe commands only
- **SQLite**: Parameterized queries, dangerous operations blocked
- **No Secrets**: All operations are local, no API keys required
`;

  return guide;
}

const api = {
  async renderReadme() {
    const pkg = await readPackageJson();
    const structure = await scanProjectStructure();
    const content = await generateReadme(pkg, structure);
    
    return {
      content,
      path: 'README.md',
      size: content.length
    };
  },

  async updateChangelog() {
    const pkg = await readPackageJson();
    const content = await updateChangelog(pkg);
    
    return {
      content,
      path: 'CHANGELOG.md',
      size: content.length
    };
  },

  async generateDeveloperGuide() {
    const pkg = await readPackageJson();
    const structure = await scanProjectStructure();
    const content = await generateDeveloperGuide(pkg, structure);
    
    return {
      content,
      path: 'docs/DEVELOPER_GUIDE.md',
      size: content.length
    };
  }
};

// Simple RPC over stdin/stdout
process.stdin.setEncoding('utf8');
let buf = '';

process.stdin.on('data', async chunk => {
  buf += chunk;
  if (!buf.endsWith('\n')) return;
  
  const line = buf.trim();
  buf = '';
  
  try {
    const { action } = JSON.parse(line);
    if (!api[action]) {
      throw new Error(`Unknown action: ${action}`);
    }
    
    const result = await api[action]();
    process.stdout.write(JSON.stringify({ ok: true, result }) + '\n');
  } catch (e) {
    process.stdout.write(JSON.stringify({ 
      ok: false, 
      error: e.message,
      stack: e.stack 
    }) + '\n');
  }
});

console.log('[mcp:docs] ready - serving documentation operations');
console.log('[mcp:docs] available actions: renderReadme, updateChangelog, generateDeveloperGuide');