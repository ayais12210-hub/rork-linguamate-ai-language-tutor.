# Backend Test Plan

## Overview

This document outlines the comprehensive testing strategy for the Linguamate backend, covering unit tests, integration tests, security tests, and performance tests.

## Test Strategy

### Test Pyramid
1. **Unit Tests** (70%): Fast, isolated tests for individual functions
2. **Integration Tests** (20%): Test component interactions
3. **End-to-End Tests** (10%): Full system behavior tests

### Coverage Goals
- **Overall Coverage**: 85%+
- **Critical Paths**: 95%+ (auth, validation, security)
- **New Code**: 90%+ (enforced in CI)
- **Backend-specific**: 90%+ (backend/ directory)

## Test Categories

### 1. Unit Tests

#### Authentication & JWT
- **File**: `backend/__tests__/auth.test.ts`
- **Coverage**: JWT signing/verification, context creation, token validation
- **Test Cases**:
  - Valid token creation and verification
  - Expired token rejection
  - Malformed token handling
  - Token type validation (access vs refresh)
  - Context creation with/without auth

#### Input Validation
- **File**: `backend/__tests__/security.test.ts`
- **Coverage**: Zod schema validation, error handling
- **Test Cases**:
  - Valid input acceptance
  - Invalid input rejection
  - Structured error responses
  - Edge cases and boundary conditions
  - XSS/injection attempt blocking

#### Rate Limiting
- **File**: `backend/__tests__/rateLimit.test.ts`
- **Coverage**: Rate limit enforcement, header handling
- **Test Cases**:
  - Requests under limit allowed
  - Requests over limit blocked
  - Rate limit headers present
  - Window reset functionality
  - Different IP isolation

#### Middleware
- **Files**: Various middleware test files
- **Coverage**: Security headers, CORS, logging, error handling
- **Test Cases**:
  - Security headers applied correctly
  - CORS configuration enforcement
  - Request logging with redaction
  - Error handling and safe responses

### 2. Integration Tests

#### HTTP Server Integration
- **File**: `backend/__tests__/hono.integration.test.ts`
- **Coverage**: Full HTTP request/response cycle
- **Test Cases**:
  - Health endpoint responses
  - Security headers in responses
  - CORS preflight handling
  - Error response formats
  - tRPC router mounting

#### API Endpoint Tests
- **Coverage**: tRPC procedures, HTTP routes
- **Test Cases**:
  - Authentication flow (login/logout)
  - Protected vs public procedures
  - Input validation on real endpoints
  - Error responses from procedures
  - Rate limiting on specific routes

#### External Service Integration
- **Coverage**: Toolkit API, STT service proxies
- **Test Cases**:
  - Successful proxy requests
  - Timeout handling
  - Retry logic verification
  - Circuit breaker functionality
  - Error propagation

### 3. Security Tests

#### Authentication Security
- **Test Cases**:
  - Token tampering detection
  - Expired token rejection
  - Invalid signature detection
  - Session hijacking prevention
  - Brute force protection

#### Input Security
- **Test Cases**:
  - SQL injection attempts
  - XSS payload blocking
  - Command injection prevention
  - Path traversal blocking
  - File upload validation

#### Network Security
- **Test Cases**:
  - CORS policy enforcement
  - Security header presence
  - HTTPS redirection (production)
  - Rate limiting effectiveness
  - DDoS protection

### 4. Error Handling Tests

#### Error Response Tests
- **File**: `backend/__tests__/error-handling.test.ts`
- **Coverage**: Error middleware, safe error responses
- **Test Cases**:
  - 404 for unknown routes
  - Malformed JSON handling
  - Oversized request handling
  - Rate limit error format
  - No sensitive data in errors

#### Logging Security
- **Test Cases**:
  - Sensitive data redaction
  - Structured error logging
  - Correlation ID tracking
  - Log level filtering
  - Performance impact minimal

### 5. Performance Tests

#### Response Time Tests
- **Targets**:
  - Health checks: < 50ms
  - Simple tRPC calls: < 200ms
  - Complex operations: < 2s
  - External API calls: < 30s (with timeout)

#### Load Tests
- **Scenarios**:
  - Concurrent user simulation
  - Rate limit boundary testing
  - Memory usage under load
  - Connection pool exhaustion
  - Graceful degradation

#### Memory Tests
- **Monitoring**:
  - Heap usage growth
  - Memory leak detection
  - Garbage collection impact
  - Rate limit map cleanup

## Test Environment Setup

### Local Development
```bash
# Install dependencies
npm install

# Run all backend tests
npm run backend:test

# Run with coverage
npm run backend:test -- --coverage

# Run specific test file
npm run backend:test -- auth.test.ts

# Run in watch mode
npm run backend:test -- --watch
```

### CI Environment
```bash
# Environment variables for testing
NODE_ENV=test
JWT_SECRET=test-secret-for-ci-only
TOOLKIT_API_KEY=test-api-key
LOG_LEVEL=error

# Coverage thresholds enforced
COVERAGE_THRESHOLD=85
```

### Test Database
- **Mock Data**: Currently using in-memory mock data
- **Future**: Test database with fixtures and cleanup
- **Isolation**: Each test gets fresh data state

## Test Data Management

### Mock Data Strategy
```typescript
// User mock data
const mockUsers = new Map([
  ['user-123', {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    createdAt: new Date('2024-01-01')
  }]
]);

// JWT test tokens
const validToken = signJwt({
  sub: 'user-123',
  type: 'access',
  expInSec: 3600
});
```

### Test Fixtures
- **Consistent Data**: Same test data across all tests
- **Edge Cases**: Boundary conditions and error states
- **Security**: Invalid tokens, malicious inputs
- **Performance**: Large datasets for load testing

## Continuous Integration

### GitHub Actions Workflow
- **File**: `.github/workflows/backend-ci.yml`
- **Triggers**: PR changes to backend/, push to main/develop
- **Jobs**:
  1. Type checking
  2. Linting
  3. Unit tests with coverage
  4. Security scanning
  5. Integration tests
  6. Build verification

### Coverage Reporting
- **Tool**: Jest with Istanbul
- **Upload**: Codecov for coverage tracking
- **Enforcement**: CI fails if coverage drops below threshold
- **Reports**: Per-file and per-function coverage

### Security Scanning
- **Tool**: Semgrep for static analysis
- **Rules**: Security-focused rule sets
- **SARIF**: Upload results to GitHub Security tab
- **Blocking**: High-severity issues fail CI

## Test Maintenance

### Test Organization
```
backend/__tests__/
├── auth.test.ts              # Authentication tests
├── error-handling.test.ts    # Error handling tests
├── hono.integration.test.ts  # HTTP integration tests
├── rateLimit.test.ts         # Rate limiting tests
├── security.test.ts          # Security validation tests
├── stt.validation.test.ts    # STT service tests
└── validation.middleware.test.ts # Input validation tests
```

### Best Practices
- **Descriptive Names**: Clear test descriptions
- **Isolation**: No test dependencies
- **Fast Execution**: Unit tests < 100ms each
- **Deterministic**: Same results every run
- **Cleanup**: Proper teardown after tests

### Code Quality
- **ESLint**: Enforce testing best practices
- **TypeScript**: Strong typing in tests
- **DRY Principle**: Shared test utilities
- **Documentation**: Comments for complex test logic

## Performance Benchmarks

### Response Time Targets
| Endpoint Type | Target | Acceptable | Alert |
|---------------|--------|------------|-------|
| Health checks | < 50ms | < 100ms | > 200ms |
| Auth endpoints | < 500ms | < 1s | > 2s |
| Data queries | < 200ms | < 500ms | > 1s |
| File uploads | < 5s | < 10s | > 30s |

### Load Testing Targets
- **Concurrent Users**: 100 simultaneous users
- **Requests/Second**: 1000 RPS sustained
- **Memory Usage**: < 512MB under load
- **Error Rate**: < 0.1% under normal load

## Monitoring & Alerting

### Test Metrics
- **Test Execution Time**: Track slow tests
- **Flaky Test Detection**: Tests that fail intermittently
- **Coverage Trends**: Monitor coverage over time
- **CI Pipeline Duration**: Optimize for speed

### Production Monitoring
- **Health Check Monitoring**: Automated uptime checks
- **Error Rate Tracking**: Alert on error spikes
- **Performance Monitoring**: Response time degradation
- **Security Event Tracking**: Failed auth attempts

## Future Enhancements

### Advanced Testing
- **Property-Based Testing**: Generate test cases automatically
- **Mutation Testing**: Verify test quality
- **Contract Testing**: API contract verification
- **Chaos Engineering**: Failure injection testing

### Test Infrastructure
- **Test Containers**: Isolated test environments
- **Parallel Execution**: Speed up test runs
- **Visual Regression**: UI component testing
- **Accessibility Testing**: A11y compliance

### Automation
- **Auto-Generated Tests**: From OpenAPI specs
- **Test Data Generation**: Realistic fake data
- **Performance Regression**: Automated benchmarking
- **Security Regression**: Continuous security testing

## Troubleshooting

### Common Issues
1. **Test Timeouts**: Increase timeout for slow operations
2. **Memory Leaks**: Check for unclosed resources
3. **Flaky Tests**: Add proper async/await handling
4. **Coverage Gaps**: Add tests for uncovered branches

### Debug Commands
```bash
# Run single test with debug info
npm run backend:test -- --verbose auth.test.ts

# Debug with Node inspector
node --inspect-brk node_modules/.bin/jest auth.test.ts

# Memory usage analysis
npm run backend:test -- --logHeapUsage

# Coverage report
npm run backend:test -- --coverage --coverageReporters=html
```