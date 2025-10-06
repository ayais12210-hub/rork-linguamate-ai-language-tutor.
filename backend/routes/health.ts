import { Hono } from 'hono';
import { logger } from '../logging/pino';

const app = new Hono();

// Basic health check
app.get('/health', (c) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    env: process.env.NODE_ENV,
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      external: Math.round(process.memoryUsage().external / 1024 / 1024),
    },
    pid: process.pid,
  };

  return c.json(health);
});

// Detailed health check with dependencies
app.get('/health/detailed', async (c) => {
  const startTime = Date.now();
  const checks: Record<string, any> = {};
  
  // Check external dependencies
  try {
    const toolkitUrl = process.env.EXPO_PUBLIC_TOOLKIT_URL;
    if (toolkitUrl) {
      const checkStart = Date.now();
      const response = await fetch(`${toolkitUrl}/health`, { 
        method: 'GET',
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      checks.toolkit = {
        status: response.ok ? 'healthy' : 'unhealthy',
        responseTime: Date.now() - checkStart,
        statusCode: response.status
      };
    }
  } catch (error) {
    checks.toolkit = {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }

  const overallStatus = Object.values(checks).every(check => check.status === 'healthy') ? 'healthy' : 'degraded';
  
  const health = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    env: process.env.NODE_ENV,
    version: process.env.APP_VERSION || '1.0.0',
    buildSha: process.env.GIT_COMMIT_SHA || process.env.EXPO_PUBLIC_COMMIT_SHA || 'unknown',
    checks,
    responseTime: Date.now() - startTime,
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
      external: Math.round(process.memoryUsage().external / 1024 / 1024),
    },
    pid: process.pid,
  };

  // Log health check for monitoring
  logger.info({
    evt: 'health_check',
    cat: 'monitoring',
    status: overallStatus,
    responseTime: health.responseTime,
    checks: Object.keys(checks).length
  }, 'Health check performed');

  const statusCode = overallStatus === 'healthy' ? 200 : 503;
  return c.json(health, statusCode);
});

// Readiness check (for Kubernetes)
app.get('/ready', (c) => {
  // Add any startup checks here
  const ready = {
    status: 'ready',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  };

  return c.json(ready);
});

// Liveness check (for Kubernetes)
app.get('/live', (c) => {
  const live = {
    status: 'alive',
    timestamp: new Date().toISOString(),
    pid: process.pid,
  };

  return c.json(live);
});

export default app;
