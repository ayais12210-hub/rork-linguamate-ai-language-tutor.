#!/usr/bin/env tsx
import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';

const SERVER_DIR = 'servers';
const ENV_FILE = '.env.example';

function collectKeys(): string[] {
  const files = fs.readdirSync(SERVER_DIR).filter(f => f.endsWith('.yaml'));
  const keys = new Set<string>();
  
  for (const f of files) {
    const y = YAML.parse(fs.readFileSync(path.join(SERVER_DIR, f), 'utf8'));
    if (y?.env) {
      for (const k of Object.keys(y.env)) {
        keys.add(k);
      }
    }
  }
  
  return [...keys].sort();
}

function generateEnvExample(): string {
  const keys = collectKeys();
  
  const header = `# Omni-MCP Environment Variables
# This file is auto-generated from server configurations
# Run 'pnpm tsx scripts/generate-dotenv.ts' to update

# === CORE CONFIGURATION ===
NODE_ENV=development
OTEL_ENABLED=false
SENTRY_DSN=

# === AUTO-GENERATED SERVER KEYS ===
`;

  const body = keys.map(k => `${k}=`).join('\n');
  
  return header + body + '\n';
}

function main(): void {
  const keys = collectKeys();
  const existing = fs.existsSync(ENV_FILE) ? fs.readFileSync(ENV_FILE, 'utf8') : '';
  const body = generateEnvExample();
  
  if (process.argv.includes('--check')) {
    if (existing.trim() !== body.trim()) {
      console.error('.env.example is out of date. Run: pnpm tsx scripts/generate-dotenv.ts');
      process.exit(1);
    }
    console.log('✅ .env.example is up to date');
    process.exit(0);
  }
  
  fs.writeFileSync(ENV_FILE, body);
  console.log(`✅ Updated .env.example with ${keys.length} environment variables`);
  console.log('Keys:', keys.join(', '));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}