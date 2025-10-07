import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MCPOrchestrator } from '../src/bootstrap.js';

describe('MCPOrchestrator Smoke Tests', () => {
  let orchestrator: MCPOrchestrator;

  beforeAll(async () => {
    orchestrator = new MCPOrchestrator();
    await orchestrator.start();
  });

  afterAll(async () => {
    await orchestrator.gracefulShutdown();
  });

  it('should start successfully', () => {
    expect(orchestrator).toBeDefined();
  });

  it('should have readiness status', () => {
    const status = orchestrator.getReadinessStatus();
    expect(status).toBeDefined();
    expect(typeof status.ready).toBe('boolean');
    expect(['ok', 'degraded', 'down']).toContain(status.status);
  });

  it('should have health status', () => {
    const health = orchestrator.getHealthStatus();
    expect(health).toBeDefined();
    expect(typeof health.healthy).toBe('boolean');
  });

  it('should have metrics', () => {
    const metrics = orchestrator.getMetrics();
    expect(metrics).toBeDefined();
    expect(typeof metrics).toBe('string');
    expect(metrics).toContain('mcp_server_spawn_total');
  });

  it('should have egress controller', () => {
    const egressController = orchestrator.getEgressController();
    expect(egressController).toBeDefined();
  });
});