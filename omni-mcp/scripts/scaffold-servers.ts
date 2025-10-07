#!/usr/bin/env tsx

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import yaml from 'js-yaml';

interface ServerManifest {
  name: string;
  pkg: string;
  bin?: string;
  envKeys: string[];
  probe: {
    type: 'stdio' | 'http';
    timeoutMs: number;
    url?: string;
  };
  notes?: string;
}

interface ManifestFile {
  $schema: string;
  servers: ServerManifest[];
}

// Load the manifest
function loadManifest(): ManifestFile {
  const manifestPath = join(process.cwd(), 'servers', 'servers.manifest.json');
  const content = readFileSync(manifestPath, 'utf8');
  return JSON.parse(content);
}

// Load template
function loadTemplate(): any {
  const templatePath = join(process.cwd(), 'servers', '_TEMPLATE.yaml');
  const content = readFileSync(templatePath, 'utf8');
  return yaml.load(content);
}

// Generate server YAML
function generateServerYaml(server: ServerManifest, template: any): any {
  const config = { ...template };
  
  config.name = server.name;
  config.enabled = false;
  config.command = 'npx';
  config.args = [server.bin || server.pkg, 'start'];
  
  // Generate env object from envKeys
  config.env = {};
  for (const envKey of server.envKeys) {
    config.env[envKey] = `\${${envKey}}`;
  }
  
  // Set health check from probe
  config.healthCheck = {
    type: server.probe.type,
    timeoutMs: server.probe.timeoutMs,
  };
  
  if (server.probe.url) {
    config.healthCheck.url = server.probe.url;
  }
  
  return config;
}

// Update default.yaml with server entries
function updateDefaultConfig(servers: ServerManifest[]): void {
  const configPath = join(process.cwd(), 'config', 'default.yaml');
  const content = readFileSync(configPath, 'utf8');
  const config = yaml.load(content) as any;
  
  // Ensure servers section exists
  if (!config.servers) {
    config.servers = {};
  }
  
  // Add/update server entries
  for (const server of servers) {
    const serverConfig = {
      name: server.name,
      enabled: false,
      command: 'npx',
      args: [server.bin || server.pkg, 'start'],
      env: {},
      healthCheck: {
        type: server.probe.type,
        timeoutMs: server.probe.timeoutMs,
      },
      scopes: [],
      limits: {
        rps: 3,
        burst: 6,
        timeoutMs: 30000,
      },
    };
    
    // Add env variables
    for (const envKey of server.envKeys) {
      serverConfig.env[envKey] = `\${${envKey}}`;
    }
    
    // Add URL if present
    if (server.probe.url) {
      serverConfig.healthCheck.url = server.probe.url;
    }
    
    config.servers[server.name] = serverConfig;
  }
  
  // Write back to file
  const yamlContent = yaml.dump(config, { 
    lineWidth: 120,
    noRefs: true,
    sortKeys: false 
  });
  writeFileSync(configPath, yamlContent, 'utf8');
}

// Generate .env.example
function generateEnvExample(servers: ServerManifest[]): void {
  const envPath = join(process.cwd(), '.env.example');
  const lines: string[] = [];
  
  lines.push('# Omni-MCP Environment Variables');
  lines.push('# Copy this file to .env and fill in your actual values');
  lines.push('');
  
  // Collect all unique env keys
  const allEnvKeys = new Set<string>();
  for (const server of servers) {
    for (const envKey of server.envKeys) {
      allEnvKeys.add(envKey);
    }
  }
  
  // Sort and add to lines
  const sortedKeys = Array.from(allEnvKeys).sort();
  for (const key of sortedKeys) {
    lines.push(`# ${key} - Required for various MCP servers`);
    lines.push(`${key}=`);
    lines.push('');
  }
  
  writeFileSync(envPath, lines.join('\n'), 'utf8');
}

// Main execution
function main(): void {
  console.log('🚀 Starting server scaffolding...');
  
  try {
    // Load manifest and template
    const manifest = loadManifest();
    const template = loadTemplate();
    
    console.log(`📋 Found ${manifest.servers.length} servers in manifest`);
    
    // Generate YAML files for each server
    for (const server of manifest.servers) {
      const yamlPath = join(process.cwd(), 'servers', `${server.name}.yaml`);
      
      // Only create if doesn't exist
      if (!existsSync(yamlPath)) {
        const serverConfig = generateServerYaml(server, template);
        const yamlContent = yaml.dump(serverConfig, { 
          lineWidth: 120,
          noRefs: true,
          sortKeys: false 
        });
        writeFileSync(yamlPath, yamlContent, 'utf8');
        console.log(`✅ Created ${server.name}.yaml`);
      } else {
        console.log(`⏭️  Skipped ${server.name}.yaml (already exists)`);
      }
    }
    
    // Update default.yaml
    console.log('📝 Updating config/default.yaml...');
    updateDefaultConfig(manifest.servers);
    
    // Generate .env.example
    console.log('🔧 Generating .env.example...');
    generateEnvExample(manifest.servers);
    
    console.log('🎉 Scaffolding complete!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Copy .env.example to .env and fill in your values');
    console.log('2. Enable desired servers in config/default.yaml');
    console.log('3. Run: pnpm dev');
    
  } catch (error) {
    console.error('❌ Scaffolding failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}