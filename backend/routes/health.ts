import { Hono } from 'hono';
import { getConfig } from '../config/env';
import { getAllCircuitBreakerStatuses } from '../utils/circuit-breaker';
import { logger } from '../logging/pino';

const app = new Hono();

interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  message?: string;
  details?: any;
}

interface HealthCheck {
  name: string;
  check: () => Promise<HealthCheckResult>;
  critical?: boolean;
}

// Health check functions
const healthChecks: HealthCheck[] = [
  {
    name: 'memory',
    check: async () => {
      const used = process.memoryUsage();
      const heapUsedMB = Math.round(used.heapUsed / 1024 / 1024);
      const heapTotalMB = Math.round(used.heapTotal / 1024 / 1024);
      const usage = (used.heapUsed / used.heapTotal) * 100;
      
      return {
        status: usage > 90 ? 'unhealthy' : usage > 75 ? 'degraded' : 'healthy',
        details: {
          heapUsedMB,
          heapTotalMB,
          usage: `${usage.toFixed(2)}%`,
        },
      };
    },
  },
  {
    name: 'circuitBreakers',
    check: async () => {
      const statuses = getAllCircuitBreakerStatuses();
      const openCircuits = Object.values(statuses).filter(
        (s: any) => s.state === 'OPEN'
      );
      
      return {
        status: openCircuits.length > 0 ? 'degraded' : 'healthy',
        details: {
          total: Object.keys(statuses).length,
          open: openCircuits.length,
          circuits: statuses,
        },
      };
    },
  },
  {
    name: 'environment',
    check: async () => {
      const requiredVars = ['JWT_SECRET', 'NODE_ENV'];
      const missing = requiredVars.filter(v => !process.env[v]);
      
      return {
        status: missing.length > 0 ? 'unhealthy' : 'healthy',
        details: {
          nodeEnv: process.env.NODE_ENV,
          missing,
        },
      };
    },
    critical: true,
  },
];

// Basic health endpoint (fast)
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    env: process.env.NODE_ENV,
    version: process.env.GIT_COMMIT_SHA || 'unknown',
  });
});

// Detailed health endpoint (slower, runs checks)
app.get('/health/detailed', async (c) => {
  const results: Record<string, HealthCheckResult> = {};
  let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
  
  // Run all health checks in parallel
  await Promise.all(
    healthChecks.map(async ({ name, check, critical }) => {
      try {
        const result = await check();
        results[name] = result;
        
        // Update overall status
        if (result.status === 'unhealthy') {
          overallStatus = critical ? 'unhealthy' : 'degraded';
        } else if (result.status === 'degraded' && overallStatus === 'healthy') {
          overallStatus = 'degraded';
        }
      } catch (error) {
        logger.error({ error, check: name }, 'Health check failed');
        results[name] = {
          status: 'unhealthy',
          message: error instanceof Error ? error.message : 'Check failed',
        };
        
        if (critical) {
          overallStatus = 'unhealthy';
        }
      }
    })
  );
  
  const response = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    env: process.env.NODE_ENV,
    version: process.env.GIT_COMMIT_SHA || 'unknown',
    checks: results,
  };
  
  // Set appropriate status code
  const statusCode = overallStatus === 'healthy' ? 200 : 
                    overallStatus === 'degraded' ? 200 : 503;
  
  c.status(statusCode as any);
  return c.json(response);
});

// Liveness probe (Kubernetes)
app.get('/health/live', (c) => {
  // Simple check - is the process alive?
  return c.json({ status: 'alive' });
});

// Readiness probe (Kubernetes)
app.get('/health/ready', async (c) => {
  // Check if we're ready to serve traffic
  try {
    // Add any startup checks here
    const isReady = true; // Add actual readiness logic
    
    if (isReady) {
      return c.json({ status: 'ready' });
    } else {
      c.status(503);
      return c.json({ status: 'not ready' });
    }
  } catch (error) {
    c.status(503);
    return c.json({ 
      status: 'not ready',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default app;
