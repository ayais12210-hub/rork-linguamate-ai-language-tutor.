const path = require('path');
const fs = require('fs/promises');

const ROOT = path.resolve(__dirname, '../../..');
const BLOCKED = new Set(['node_modules', '.git', '.expo', 'coverage', 'dist', 'build']);

function safePath(p) {
  const abs = path.resolve(ROOT, p);
  if (!abs.startsWith(ROOT)) {
    throw new Error('Path traversal denied');
  }
  const parts = path.relative(ROOT, abs).split(path.sep);
  if (parts.some(seg => BLOCKED.has(seg) || (seg.startsWith('.') && seg !== '.env.example'))) {
    throw new Error('Access to this path is blocked');
  }
  return abs;
}

const api = {
  async listDir(p = '.') {
    const abs = safePath(p);
    const entries = await fs.readdir(abs, { withFileTypes: true });
    return entries
      .filter(entry => !entry.name.startsWith('.') || entry.name === '.env.example')
      .map(entry => ({
        name: entry.name,
        type: entry.isDirectory() ? 'directory' : 'file',
        path: path.relative(ROOT, path.join(abs, entry.name))
      }))
      .sort((a, b) => {
        if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
  },

  async readFile(p) {
    const abs = safePath(p);
    const content = await fs.readFile(abs, 'utf8');
    return {
      content,
      path: p,
      size: content.length
    };
  },

  async writeFile(p, data) {
    const abs = safePath(p);
    await fs.mkdir(path.dirname(abs), { recursive: true });
    await fs.writeFile(abs, data, 'utf8');
    return { 
      ok: true, 
      path: p,
      size: data.length
    };
  },

  async exists(p) {
    try {
      await fs.access(safePath(p));
      return true;
    } catch {
      return false;
    }
  },

  async getStats(p) {
    const abs = safePath(p);
    const stats = await fs.stat(abs);
    return {
      isFile: stats.isFile(),
      isDirectory: stats.isDirectory(),
      size: stats.size,
      mtime: stats.mtime.toISOString(),
      ctime: stats.ctime.toISOString()
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
    const { method, params = [] } = JSON.parse(line);
    if (!api[method]) {
      throw new Error(`Unknown method: ${method}`);
    }
    
    const result = await api[method](...params);
    process.stdout.write(JSON.stringify({ ok: true, result }) + '\n');
  } catch (e) {
    process.stdout.write(JSON.stringify({ 
      ok: false, 
      error: e.message,
      stack: e.stack 
    }) + '\n');
  }
});

console.log('[mcp:filesystem] ready - serving filesystem operations');