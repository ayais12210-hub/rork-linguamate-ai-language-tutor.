# Backend Test Plan

## Overview

This document outlines the testing strategy for the Linguamate backend, including unit tests, integration tests, and end-to-end tests.

## Test Strategy

### Testing Pyramid

```
        /\
       /E2E\      <- End-to-end tests (few, critical paths)
      /------\
     /  INT   \   <- Integration tests (API & service tests)
    /----------\
   /    UNIT    \ <- Unit tests (many, fast, isolated)
  /--------------\
```

### Coverage Goals

- **Overall**: 80% line coverage minimum
- **Critical Paths**: 95% coverage (auth, payments)
- **New Code**: 85% coverage required
- **Backend Specific**: 90% for validation, security

## Test Categories

### 1. Unit Tests

**Location**: `backend/__tests__/*.test.ts`

**Scope**: Individual functions, classes, utilities

**Examples**:
- Middleware functions
- Validation logic
- Utility functions
- Business logic

**Run**: `bun run backend:test`

### 2. Integration Tests

**Location**: `tests/integration/backend/*.test.ts`

**Scope**: API endpoints, service interactions

**Examples**:
- tRPC procedure calls
- HTTP endpoint responses
- Middleware chains
- External service mocks

**Run**: `bun run test:integration`

### 3. End-to-End Tests

**Location**: `tests/e2e/backend/*.test.ts`

**Scope**: Complete user flows through the API

**Examples**:
- Authentication flow
- Lesson completion flow
- Chat conversation flow

**Run**: `bun run e2e`

## Test Utilities

### Mock Factories

```typescript
// tests/factories/user.factory.ts
export const createMockUser = (overrides = {}) => ({
  id: faker.string.uuid(),
  email: faker.internet.email(),
  name: faker.person.fullName(),
  ...overrides,
});
```

### Test Helpers

```typescript
// tests/helpers/auth.helper.ts
export const createAuthenticatedContext = () => {
  const user = createMockUser();
  const token = signJwt({ userId: user.id });
  return { user, token };
};
```

### MSW Handlers

```typescript
// tests/mocks/handlers/toolkit.ts
export const toolkitHandlers = [
  rest.post('*/stt/transcribe', (req, res, ctx) => {
    return res(ctx.json({ text: 'mocked transcription' }));
  }),
];
```

## Test Scenarios

### Authentication Tests

1. **Login Flow**
   - Valid credentials → success + tokens
   - Invalid credentials → 401 error
   - Rate limiting → 429 after X attempts
   - Account locked → specific error

2. **Token Management**
   - Token validation
   - Token refresh
   - Token expiration
   - Concurrent sessions

### API Endpoint Tests

1. **Health Checks**
   - Basic health → always 200
   - Detailed health → system status
   - Degraded state → 200 with warnings
   - Unhealthy state → 503

2. **Rate Limiting**
   - Under limit → success
   - Over limit → 429 + retry headers
   - Reset after window
   - Per-route limits

3. **Input Validation**
   - Valid input → processed
   - Invalid input → 400 + errors
   - Missing required → 400
   - XSS attempts → sanitized

### Security Tests

1. **CORS**
   - Allowed origin → headers present
   - Disallowed origin → blocked
   - No origin → handled appropriately
   - Preflight requests → proper response

2. **Authorization**
   - Valid token → access granted
   - Expired token → 401
   - Invalid token → 401
   - Missing token → 401
   - Insufficient role → 403

### Reliability Tests

1. **Circuit Breakers**
   - Service healthy → normal operation
   - Service failing → circuit opens
   - Circuit open → fast failures
   - Recovery → circuit closes

2. **Timeouts**
   - Fast response → success
   - Slow response → 408 timeout
   - Hanging request → killed

3. **Retries**
   - Transient failure → retry succeeds
   - Persistent failure → eventual failure
   - Network errors → retried
   - 4xx errors → not retried

## Running Tests

### Local Development

```bash
# Run all backend tests
bun run backend:test

# Run with watch mode
bun run backend:test:watch

# Run specific test file
bun test backend/__tests__/rateLimit.test.ts

# Run with coverage
bun run backend:test --coverage

# Run integration tests
NODE_ENV=test bun test tests/integration/backend
```

### CI Pipeline

Tests run automatically on:
- Pull requests (backend files changed)
- Pushes to main/develop
- Manual trigger

### Test Environment

```bash
# Required environment variables for tests
NODE_ENV=test
JWT_SECRET=test-secret-key-for-testing-only-32chars
LOG_LEVEL=error  # Reduce noise in tests
```

## Coverage Reports

### Viewing Coverage

```bash
# Generate HTML report
bun run backend:test --coverage

# Open in browser
open coverage/lcov-report/index.html
```

### Coverage Metrics

- **Statements**: All executable statements
- **Branches**: All conditional paths
- **Functions**: All defined functions
- **Lines**: All source lines

### Exclusions

```javascript
/* istanbul ignore next */  // Skip coverage for next line
/* istanbul ignore if */    // Skip coverage for if block
```

## Best Practices

### 1. Test Structure

```typescript
describe('ComponentName', () => {
  describe('methodName', () => {
    it('should handle success case', () => {
      // Arrange
      const input = createTestInput();
      
      // Act
      const result = method(input);
      
      // Assert
      expect(result).toEqual(expected);
    });
    
    it('should handle error case', () => {
      // Test error scenarios
    });
  });
});
```

### 2. Async Testing

```typescript
it('handles async operations', async () => {
  const promise = asyncOperation();
  
  await expect(promise).resolves.toEqual(expected);
  // or
  await expect(promise).rejects.toThrow(ErrorType);
});
```

### 3. Mocking

```typescript
// Mock external dependencies
jest.mock('@/lib/external-service');

// Mock environment
beforeEach(() => {
  process.env.FEATURE_FLAG = 'true';
});

afterEach(() => {
  delete process.env.FEATURE_FLAG;
});
```

### 4. Test Data

- Use factories for consistent test data
- Avoid hardcoded values
- Clean up after tests
- Use realistic data

### 5. Performance

- Keep unit tests under 50ms
- Mock heavy operations
- Use test doubles for external services
- Parallelize where possible

## Debugging Tests

### VS Code Launch Config

```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Backend Tests",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": [
    "--runInBand",
    "--testPathPattern=backend",
    "${file}"
  ],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

### Common Issues

1. **Timeout Errors**
   - Increase jest timeout: `jest.setTimeout(10000)`
   - Check for missing async/await
   - Ensure promises resolve/reject

2. **Port Conflicts**
   - Use dynamic ports in tests
   - Clean up servers after tests
   - Run tests serially if needed

3. **Environment Issues**
   - Check required env vars
   - Use test-specific configs
   - Clear module cache between tests

## Continuous Improvement

1. **Monitor Coverage Trends**
   - Track coverage over time
   - Set coverage gates
   - Review uncovered code

2. **Test Performance**
   - Monitor test execution time
   - Optimize slow tests
   - Parallelize test suites

3. **Flaky Tests**
   - Identify and fix flaky tests
   - Add retry logic for integration tests
   - Improve test isolation

4. **Test Maintenance**
   - Regular test refactoring
   - Update tests with code changes
   - Remove obsolete tests