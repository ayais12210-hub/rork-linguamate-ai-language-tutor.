const path = require('path');
const fs = require('fs');

// Try to use better-sqlite3 first, fallback to sqlite3
let Database;
let useBetterSqlite3 = false;

try {
  Database = require('better-sqlite3');
  useBetterSqlite3 = true;
  console.log('[mcp:sqlite] Using better-sqlite3');
} catch (e) {
  try {
    const sqlite3 = require('sqlite3').verbose();
    Database = sqlite3.Database;
    useBetterSqlite3 = false;
    console.log('[mcp:sqlite] Using sqlite3 fallback');
  } catch (e2) {
    console.error('[mcp:sqlite] Neither better-sqlite3 nor sqlite3 available');
    process.exit(1);
  }
}

const dbPath = path.resolve(__dirname, '../../..', 'data', 'dev.sqlite');

// Ensure data directory exists
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

// Dangerous patterns to block
const DANGEROUS_PATTERNS = [
  /PRAGMA\s+(?!table_info|index_list|index_info)/i,
  /ATTACH\s+/i,
  /DETACH\s+/i,
  /\.read\s+/i,
  /CREATE\s+TRIGGER/i,
  /DROP\s+TRIGGER/i,
  /CREATE\s+VIEW/i,
  /DROP\s+VIEW/i,
  /VACUUM/i,
  /ANALYZE/i,
  /REINDEX/i
];

function isDangerous(sql) {
  return DANGEROUS_PATTERNS.some(pattern => pattern.test(sql));
}

function openDatabase() {
  if (useBetterSqlite3) {
    return new Database(dbPath);
  } else {
    return new Database(dbPath);
  }
}

// Simple RPC over stdin/stdout
process.stdin.setEncoding('utf8');
let buf = '';

process.stdin.on('data', chunk => {
  buf += chunk;
  if (!buf.endsWith('\n')) return;
  
  const line = buf.trim();
  buf = '';
  
  (async () => {
    try {
      const { method, sql, params = [] } = JSON.parse(line);
      
      if (!sql) {
        throw new Error('Missing sql parameter');
      }
      
      if (isDangerous(sql)) {
        throw new Error('Statement contains dangerous operations and is not allowed');
      }
      
      const db = openDatabase();
      
      if (useBetterSqlite3) {
        // better-sqlite3 synchronous API
        try {
          if (method === 'query') {
            const stmt = db.prepare(sql);
            const rows = stmt.all(params);
            db.close();
            process.stdout.write(JSON.stringify({ ok: true, rows }) + '\n');
          } else if (method === 'exec') {
            const info = db.prepare(sql).run(params);
            db.close();
            process.stdout.write(JSON.stringify({ ok: true, info }) + '\n');
          } else {
            throw new Error(`Unknown method: ${method}`);
          }
        } catch (dbError) {
          db.close();
          throw dbError;
        }
      } else {
        // sqlite3 async API
        if (method === 'query') {
          db.all(sql, params, (err, rows) => {
            if (err) {
              db.close();
              return process.stdout.write(JSON.stringify({ 
                ok: false, 
                error: err.message 
              }) + '\n');
            }
            db.close();
            process.stdout.write(JSON.stringify({ ok: true, rows }) + '\n');
          });
        } else if (method === 'exec') {
          db.run(sql, params, function(err) {
            if (err) {
              db.close();
              return process.stdout.write(JSON.stringify({ 
                ok: false, 
                error: err.message 
              }) + '\n');
            }
            db.close();
            process.stdout.write(JSON.stringify({ 
              ok: true, 
              info: { 
                changes: this.changes, 
                lastInsertRowid: this.lastID 
              } 
            }) + '\n');
          });
        } else {
          throw new Error(`Unknown method: ${method}`);
        }
      }
    } catch (e) {
      process.stdout.write(JSON.stringify({ 
        ok: false, 
        error: e.message,
        stack: e.stack 
      }) + '\n');
    }
  })();
});

console.log('[mcp:sqlite] ready - serving SQLite operations');
console.log(`[mcp:sqlite] database: ${dbPath}`);
console.log('[mcp:sqlite] dangerous operations blocked: PRAGMA, ATTACH, DETACH, .read, triggers, views, VACUUM, ANALYZE, REINDEX');