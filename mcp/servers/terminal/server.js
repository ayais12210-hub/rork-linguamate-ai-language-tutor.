const { spawn } = require('child_process');

const ALLOWED_COMMANDS = new Set([
  'node -v',
  'npm -v',
  'npm run typecheck',
  'npm run lint',
  'npm test',
  'npm run test:ci',
  'npm run format:check',
  'npm run format:fix',
  'npm run build',
  'npm run web:build',
  'git status',
  'git diff --name-only',
  'git rev-parse --abbrev-ref HEAD',
  'git log --oneline -5',
  'git branch -a',
  'npm audit --audit-level=high',
  'npm run scan',
  'npm run scan:full'
]);

function runCommand(cmd) {
  if (!ALLOWED_COMMANDS.has(cmd)) {
    throw new Error(`Command not allowed: ${cmd}. Allowed commands: ${Array.from(ALLOWED_COMMANDS).join(', ')}`);
  }
  
  const [bin, ...args] = cmd.split(' ');
  
  return new Promise((resolve, reject) => {
    const ps = spawn(bin, args, { 
      stdio: ['ignore', 'pipe', 'pipe'], 
      timeout: 120_000, // 2 minutes timeout
      cwd: process.cwd()
    });
    
    let stdout = '';
    let stderr = '';
    
    ps.stdout.on('data', data => {
      stdout += data.toString();
    });
    
    ps.stderr.on('data', data => {
      stderr += data.toString();
    });
    
    ps.on('close', code => {
      if (code === 0) {
        resolve({ 
          code, 
          stdout: stdout.trim(), 
          stderr: stderr.trim(),
          command: cmd
        });
      } else {
        reject(new Error(`Command failed with exit code ${code}: ${stderr || stdout}`));
      }
    });
    
    ps.on('error', err => {
      reject(new Error(`Failed to spawn process: ${err.message}`));
    });
  });
}

// Simple RPC over stdin/stdout
process.stdin.setEncoding('utf8');
let buf = '';

process.stdin.on('data', async chunk => {
  buf += chunk;
  if (!buf.endsWith('\n')) return;
  
  const line = buf.trim();
  buf = '';
  
  try {
    const { cmd } = JSON.parse(line);
    if (!cmd) {
      throw new Error('Missing cmd parameter');
    }
    
    const result = await runCommand(cmd);
    process.stdout.write(JSON.stringify({ ok: true, result }) + '\n');
  } catch (e) {
    process.stdout.write(JSON.stringify({ 
      ok: false, 
      error: e.message,
      stack: e.stack 
    }) + '\n');
  }
});

console.log('[mcp:terminal] ready - serving terminal operations');
console.log(`[mcp:terminal] allowed commands: ${Array.from(ALLOWED_COMMANDS).join(', ')}`);