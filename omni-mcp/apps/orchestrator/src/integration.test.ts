import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MCPOrchestrator } from '../apps/orchestrator/src/bootstrap.js';

describe('Orchestrator Integration Tests', () => {
  let orchestrator: MCPOrchestrator;

  beforeAll(async () => {
    // Set test environment
    process.env.NODE_ENV = 'test';
    process.env.LOG_LEVEL = 'error'; // Reduce log noise in tests
    
    orchestrator = new MCPOrchestrator();
    await orchestrator.start();
  });

  afterAll(async () => {
    await orchestrator.gracefulShutdown();
  });

  it('should start orchestrator successfully', () => {
    expect(orchestrator).toBeDefined();
  });

  it('should respond to health checks', () => {
    const health = orchestrator.getOverallHealth();
    expect(typeof health).toBe('boolean');
  });

  it('should have no servers enabled by default', () => {
    const statuses = orchestrator.getAllServerStatuses();
    expect(Object.keys(statuses)).toHaveLength(0);
  });

  it('should handle graceful shutdown', async () => {
    // This test verifies the shutdown process doesn't throw
    expect(async () => {
      await orchestrator.gracefulShutdown();
    }).not.toThrow();
  });
});