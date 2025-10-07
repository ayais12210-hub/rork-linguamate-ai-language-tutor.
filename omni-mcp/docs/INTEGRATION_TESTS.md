# Integration Test Example

This file demonstrates how to add integration tests for the orchestrator.

## Test Structure

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MCPOrchestrator } from '../apps/orchestrator/src/bootstrap.js';
import { loadConfig } from '../apps/orchestrator/src/config/schema.js';

describe('Orchestrator Integration Tests', () => {
  let orchestrator: MCPOrchestrator;

  beforeAll(async () => {
    // Load test configuration with free servers enabled
    process.env.NODE_ENV = 'test';
    orchestrator = new MCPOrchestrator();
    await orchestrator.start();
  });

  afterAll(async () => {
    await orchestrator.gracefulShutdown();
  });

  it('should start orchestrator successfully', () => {
    expect(orchestrator).toBeDefined();
  });

  it('should respond to health checks', async () => {
    const health = orchestrator.getOverallHealth();
    expect(typeof health).toBe('boolean');
  });

  it('should have structured logging', () => {
    // Test that logs are structured JSON
    // This would require mocking the logger
  });
});
```

## Suggested Test Scenarios

1. **Basic Orchestrator Lifecycle**
   - Start orchestrator
   - Verify health endpoints respond
   - Graceful shutdown

2. **Server Management**
   - Enable a free server (backup, chrome-devtools)
   - Verify server starts and is healthy
   - Disable server and verify it stops

3. **Configuration Validation**
   - Test invalid YAML configurations
   - Test missing environment variables
   - Test feature flag toggling

4. **Health Check System**
   - Test stdio health checks
   - Test HTTP health checks (if applicable)
   - Test timeout scenarios

5. **Security Guards**
   - Test rate limiting
   - Test circuit breaker behavior
   - Test scope validation

## Running Integration Tests

```bash
# Run integration tests
pnpm test:integration

# Run with coverage
pnpm test:integration --coverage
```