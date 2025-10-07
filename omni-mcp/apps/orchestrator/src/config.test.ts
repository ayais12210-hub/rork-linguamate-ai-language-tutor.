import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadConfig, hasRequiredEnvs, resolveEnv } from './config/schema.js';
import { ServerRegistry } from './registry.js';
import { HealthChecker } from './health.js';
import { RateLimiterGuard } from './guards/rateLimiter.js';
import { CircuitBreakerGuard } from './guards/circuitBreaker.js';
import { TimeoutGuard } from './guards/timeouts.js';
import { AuthScopesGuard } from './guards/authScopes.js';

describe('Config System', () => {
  it('should load default configuration', () => {
    const config = loadConfig();
    expect(config).toBeDefined();
    expect(config.features).toBeDefined();
    expect(config.servers).toBeDefined();
    expect(config.runtime).toBeDefined();
  });

  it('should validate environment variable interpolation', () => {
    process.env.TEST_VAR = 'test-value';
    const result = resolveEnv({ TEST_VAR: '${TEST_VAR}' });
    expect(result.TEST_VAR).toBe('test-value');
  });

  it('should check required environment variables', () => {
    process.env.REQUIRED_VAR = 'present';
    const hasEnvs = hasRequiredEnvs({ REQUIRED_VAR: '${REQUIRED_VAR}' });
    expect(hasEnvs).toBe(true);
  });

  it('should fail when required environment variables are missing', () => {
    delete process.env.MISSING_VAR;
    const hasEnvs = hasRequiredEnvs({ MISSING_VAR: '${MISSING_VAR}' });
    expect(hasEnvs).toBe(false);
  });
});

describe('Server Registry', () => {
  let registry: ServerRegistry;
  let config: any;

  beforeEach(() => {
    config = loadConfig();
    registry = new ServerRegistry(config);
  });

  it('should load server configurations', () => {
    const servers = registry.getAllServers();
    expect(servers.size).toBeGreaterThan(0);
  });

  it('should identify enabled servers', () => {
    const enabledServers = registry.getEnabledServers();
    expect(Array.isArray(enabledServers)).toBe(true);
  });

  it('should check server health status', () => {
    const healthStatus = registry.getServerHealthStatus();
    expect(healthStatus).toBeDefined();
  });
});

describe('Health Checker', () => {
  let healthChecker: HealthChecker;

  beforeEach(() => {
    healthChecker = new HealthChecker();
  });

  it('should create health checker instance', () => {
    expect(healthChecker).toBeDefined();
  });

  it('should track overall health status', () => {
    const overallHealth = healthChecker.getOverallHealth();
    expect(typeof overallHealth).toBe('boolean');
  });
});

describe('Rate Limiter Guard', () => {
  let rateLimiter: RateLimiterGuard;

  beforeEach(() => {
    rateLimiter = new RateLimiterGuard();
  });

  it('should create rate limiter instance', () => {
    expect(rateLimiter).toBeDefined();
  });

  it('should check rate limits', async () => {
    const result = await rateLimiter.checkLimit('test-server');
    expect(typeof result).toBe('boolean');
  });
});

describe('Circuit Breaker Guard', () => {
  let circuitBreaker: CircuitBreakerGuard;

  beforeEach(() => {
    circuitBreaker = new CircuitBreakerGuard();
  });

  it('should create circuit breaker instance', () => {
    expect(circuitBreaker).toBeDefined();
  });

  it('should get breaker state', () => {
    const state = circuitBreaker.getBreakerState('test-server');
    expect(state).toBeUndefined(); // No breaker created yet
  });
});

describe('Timeout Guard', () => {
  let timeoutGuard: TimeoutGuard;

  beforeEach(() => {
    timeoutGuard = new TimeoutGuard();
  });

  it('should create timeout guard instance', () => {
    expect(timeoutGuard).toBeDefined();
  });

  it('should create timeout signal', () => {
    const signal = timeoutGuard.createTimeoutSignal(1000);
    expect(signal).toBeDefined();
    expect(signal.aborted).toBe(false);
  });
});

describe('Auth Scopes Guard', () => {
  let authScopes: AuthScopesGuard;

  beforeEach(() => {
    authScopes = new AuthScopesGuard();
  });

  it('should create auth scopes guard instance', () => {
    expect(authScopes).toBeDefined();
  });

  it('should validate scopes', () => {
    const isValid = authScopes.validateScope('test-server', 'test:scope');
    expect(typeof isValid).toBe('boolean');
  });
});