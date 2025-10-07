const { spawn } = require('child_process');
const path = require('path');

const servers = [
  { name: 'filesystem', script: './mcp/servers/filesystem/server.js' },
  { name: 'terminal', script: './mcp/servers/terminal/server.js' },
  { name: 'sqlite', script: './mcp/servers/sqlite/server.js' },
  { name: 'docs', script: './mcp/servers/docs/server.js' }
];

const processes = [];

console.log('🚀 Starting MCP servers...\n');

servers.forEach(({ name, script }) => {
  console.log(`Starting ${name} server...`);
  
  const proc = spawn('node', [script], {
    stdio: ['pipe', 'pipe', 'pipe'],
    cwd: process.cwd()
  });

  proc.stdout.on('data', (data) => {
    const output = data.toString().trim();
    if (output) {
      console.log(`[${name}] ${output}`);
    }
  });

  proc.stderr.on('data', (data) => {
    const output = data.toString().trim();
    if (output) {
      console.error(`[${name}] ERROR: ${output}`);
    }
  });

  proc.on('close', (code) => {
    if (code !== 0) {
      console.error(`[${name}] Process exited with code ${code}`);
    }
  });

  processes.push({ name, process: proc });
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down MCP servers...');
  processes.forEach(({ name, process: proc }) => {
    console.log(`Stopping ${name} server...`);
    proc.kill('SIGTERM');
  });
  
  setTimeout(() => {
    processes.forEach(({ name, process: proc }) => {
      if (!proc.killed) {
        console.log(`Force killing ${name} server...`);
        proc.kill('SIGKILL');
      }
    });
    process.exit(0);
  }, 5000);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down...');
  processes.forEach(({ name, process: proc }) => {
    proc.kill('SIGTERM');
  });
});

console.log('\n✅ All MCP servers started successfully!');
console.log('📝 Available servers:');
servers.forEach(({ name }) => {
  console.log(`   - ${name}`);
});
console.log('\n💡 Press Ctrl+C to stop all servers');
console.log('🔧 Use the servers via stdin/stdout communication\n');