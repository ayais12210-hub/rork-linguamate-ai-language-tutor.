#!/usr/bin/env node

/**
 * Dummy MCP Server for E2E Testing
 * 
 * This is a minimal MCP server that:
 * - Responds to --health with exit code 0 (or 1 if DUMMY_HEALTH_FAIL=1)
 * - Otherwise runs indefinitely, printing a line every 500ms
 * - Used for testing orchestrator health checks and recovery
 */

// Handle health check
if (process.argv.includes('--health')) {
  const shouldFail = process.env.DUMMY_HEALTH_FAIL === '1';
  process.exit(shouldFail ? 1 : 0);
}

// Main loop - print a tick every 500ms
console.log('dummy-mcp: Starting dummy MCP server...');
console.log('dummy-mcp: Use --health to check health status');
console.log('dummy-mcp: Set DUMMY_HEALTH_FAIL=1 to make health check fail');

let tickCount = 0;
setInterval(() => {
  tickCount++;
  process.stdout.write(`dummy:tick:${tickCount}\n`);
}, 500);

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('dummy-mcp: Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('dummy-mcp: Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

// Keep the process alive
process.stdin.resume();