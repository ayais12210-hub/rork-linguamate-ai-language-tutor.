import { Hono } from 'hono';

const app = new Hono();

/**
 * Basic health check endpoint
 * Returns server status, uptime, environment, and version info
 */
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    env: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0',
    buildSha: process.env.GIT_COMMIT_SHA?.substring(0, 7) || 'unknown',
  });
});

/**
 * Detailed health check with dependencies
 * TODO: Add database, Redis, and external API checks when implemented
 */
app.get('/health/detailed', async (c) => {
  const dependencies: Record<string, string> = {
    // TODO: Add dependency health checks
    // database: await checkDatabase(),
    // redis: await checkRedis(),
    // toolkit: await checkToolkitAPI(),
  };

  const allHealthy = Object.values(dependencies).every(status => status === 'ok');
  const overallStatus = allHealthy ? 'ok' : 'degraded';
  const statusCode = allHealthy ? 200 : 503;

  return c.json({
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    env: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0',
    buildSha: process.env.GIT_COMMIT_SHA?.substring(0, 7) || 'unknown',
    dependencies,
  }, statusCode);
});

export default app;
