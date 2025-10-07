import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MCPOrchestrator } from './bootstrap.js';
import { loadConfig } from '../config/schema.js';

// Mock the config loading
vi.mock('../config/schema.js', () => ({
  loadConfig: vi.fn(),
}));

// Mock child_process
vi.mock('node:child_process', () => ({
  spawn: vi.fn(),
}));

// Mock the registry
vi.mock('../registry.js', () => ({
  ServerRegistry: vi.fn().mockImplementation(() => ({
    getEnabledServers: vi.fn().mockReturnValue(new Map()),
  })),
}));

// Mock observability modules
vi.mock('../observability/logger.js', () => ({
  createLogger: vi.fn().mockReturnValue({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
  logServerEvent: vi.fn(),
  logServerError: vi.fn(),
}));

vi.mock('../observability/otel.js', () => ({
  initializeOpenTelemetry: vi.fn().mockReturnValue(null),
  shutdownOpenTelemetry: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../observability/audit.js', () => ({
  logServerSpawn: vi.fn(),
  logServerExit: vi.fn(),
  logServerRestart: vi.fn(),
  logProbeSuccess: vi.fn(),
  logProbeFailure: vi.fn(),
}));

// Mock guards
vi.mock('../guards/rateLimiter.js', () => ({
  RateLimiterGuard: vi.fn().mockImplementation(() => ({
    createLimiter: vi.fn(),
  })),
}));

vi.mock('../guards/circuitBreaker.js', () => ({
  CircuitBreakerGuard: vi.fn().mockImplementation(() => ({
    createBreaker: vi.fn(),
  })),
}));

vi.mock('../guards/timeouts.js', () => ({
  TimeoutGuard: vi.fn().mockImplementation(() => ({})),
}));

vi.mock('../guards/authScopes.js', () => ({
  AuthScopesGuard: vi.fn().mockImplementation(() => ({
    registerServer: vi.fn(),
  })),
}));

describe('MCPOrchestrator Smoke Tests', () => {
  let orchestrator: MCPOrchestrator;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock config
    (loadConfig as any).mockReturnValue({
      features: {},
      servers: {},
      runtime: {
        maxConcurrency: 10,
        defaultTimeoutMs: 30000,
        retry: {
          attempts: 3,
          backoffMs: 1000,
        },
      },
      network: {
        outboundAllowlist: [],
      },
      observability: {
        otelEnabled: false,
        sampling: 0.1,
      },
      security: {
        auditLog: true,
        redactSecrets: true,
      },
    });

    orchestrator = new MCPOrchestrator();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize without errors', () => {
    expect(orchestrator).toBeDefined();
    expect(orchestrator.getHealthChecker).toBeDefined();
    expect(orchestrator.getEgressController).toBeDefined();
  });

  it('should start successfully with no servers', async () => {
    await expect(orchestrator.start()).resolves.not.toThrow();
  });

  it('should return readiness status', () => {
    const status = orchestrator.getReadinessStatus();
    
    expect(status).toHaveProperty('ready');
    expect(status).toHaveProperty('status');
    expect(status).toHaveProperty('details');
    expect(['ok', 'degraded', 'down']).toContain(status.status);
  });

  it('should return overall health status', () => {
    const health = orchestrator.getOverallHealth();
    expect(typeof health).toBe('boolean');
  });

  it('should return server statuses', () => {
    const statuses = orchestrator.getAllServerStatuses();
    expect(typeof statuses).toBe('object');
  });

  it('should return individual server status', () => {
    const status = orchestrator.getServerStatus('test-server');
    expect(status).toHaveProperty('running');
    expect(status).toHaveProperty('health');
    expect(status).toHaveProperty('restartCount');
    expect(status).toHaveProperty('uptime');
  });

  it('should handle graceful shutdown', async () => {
    await orchestrator.start();
    await expect(orchestrator.gracefulShutdown()).resolves.not.toThrow();
  });

  it('should provide egress controller', () => {
    const egressController = orchestrator.getEgressController();
    expect(egressController).toBeDefined();
    expect(egressController.isAllowed).toBeDefined();
    expect(egressController.validateOutbound).toBeDefined();
    expect(egressController.validateUrl).toBeDefined();
  });

  it('should provide health checker', () => {
    const healthChecker = orchestrator.getHealthChecker();
    expect(healthChecker).toBeDefined();
    expect(healthChecker.getReadinessStatus).toBeDefined();
    expect(healthChecker.getOverallHealth).toBeDefined();
    expect(healthChecker.getProbeStatuses).toBeDefined();
  });
});