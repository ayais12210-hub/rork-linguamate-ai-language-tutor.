# Backend Test Plan

## Overview

This document outlines the comprehensive testing strategy for the Linguamate AI tutor backend, ensuring reliability, security, and performance.

## Test Categories

### 1. Unit Tests
**Purpose**: Test individual functions and components in isolation

**Coverage Areas**:
- Middleware functions (rate limiting, validation, error handling)
- Utility functions (JWT validation, input sanitization)
- Zod schemas and validation logic
- Business logic functions

**Test Files**:
- `backend/__tests__/rateLimit.test.ts`
- `backend/__tests__/validation.middleware.test.ts`
- `backend/__tests__/stt.validation.test.ts`
- `backend/__tests__/security.integration.test.ts`

**Coverage Target**: 80%+ for all backend code

### 2. Integration Tests
**Purpose**: Test the interaction between different components

**Coverage Areas**:
- API endpoint functionality
- Middleware integration
- Error handling across components
- Security features integration

**Test Files**:
- `backend/__tests__/security.integration.test.ts`
- `backend/__tests__/api.integration.test.ts` (to be created)

**Coverage Target**: 90%+ for critical paths

### 3. Security Tests
**Purpose**: Validate security measures and prevent vulnerabilities

**Coverage Areas**:
- CORS configuration
- Rate limiting effectiveness
- JWT validation and security
- Input validation and sanitization
- Error handling security

**Test Files**:
- `backend/__tests__/security.integration.test.ts`

**Coverage Target**: 95%+ for security-critical code

## Test Execution

### Local Development
```bash
# Run all backend tests
npm run backend:test

# Run specific test file
npm run backend:test -- --testPathPatterns=rateLimit

# Run with coverage
npm run backend:test -- --coverage

# Run in watch mode
npm run backend:test -- --watch
```

### CI/CD Pipeline
```bash
# Backend-specific CI
.github/workflows/backend-ci.yml

# Main CI includes backend tests
.github/workflows/ci.yml
```

## Test Data Management

### Test Fixtures
- **Valid JWT Tokens**: For authentication tests
- **Invalid JWT Tokens**: For security tests
- **Sample Requests**: For API testing
- **Mock Data**: For business logic tests

### Test Environment
- **Environment Variables**: Test-specific configuration
- **Mock Services**: External API mocks
- **Test Database**: In-memory or test database

## Test Scenarios

### 1. Authentication & Authorization

#### Valid Authentication
```typescript
it('should authenticate valid JWT token', async () => {
  const validToken = generateValidJWT();
  const response = await request(app)
    .get('/api/trpc/user/get')
    .set('Authorization', `Bearer ${validToken}`);
  
  expect(response.status).toBe(200);
});
```

#### Invalid Authentication
```typescript
it('should reject invalid JWT token', async () => {
  const invalidToken = 'invalid-token';
  const response = await request(app)
    .get('/api/trpc/user/get')
    .set('Authorization', `Bearer ${invalidToken}`);
  
  expect(response.status).toBe(401);
});
```

#### Missing Authentication
```typescript
it('should require authentication for protected routes', async () => {
  const response = await request(app)
    .get('/api/trpc/user/get');
  
  expect(response.status).toBe(401);
});
```

### 2. Rate Limiting

#### Under Rate Limit
```typescript
it('should allow requests under rate limit', async () => {
  const requests = Array(4).fill(null).map(() => 
    request(app).get('/api/sensitive/data')
  );
  
  const responses = await Promise.all(requests);
  responses.forEach(response => {
    expect(response.status).toBe(200);
  });
});
```

#### Over Rate Limit
```typescript
it('should block requests exceeding rate limit', async () => {
  // Make requests up to the limit
  for (let i = 0; i < 5; i++) {
    await request(app).get('/api/sensitive/data');
  }
  
  // This should be rate limited
  const response = await request(app).get('/api/sensitive/data');
  expect(response.status).toBe(429);
});
```

### 3. Input Validation

#### Valid Input
```typescript
it('should accept valid input', async () => {
  const validInput = {
    email: 'test@example.com',
    password: 'SecurePassword123'
  };
  
  const response = await request(app)
    .post('/api/trpc/auth/login')
    .send(validInput);
  
  expect(response.status).toBe(200);
});
```

#### Invalid Input
```typescript
it('should reject invalid input', async () => {
  const invalidInput = {
    email: 'invalid-email',
    password: '123'
  };
  
  const response = await request(app)
    .post('/api/trpc/auth/login')
    .send(invalidInput);
  
  expect(response.status).toBe(400);
  expect(response.body.error.code).toBe('VALIDATION_ERROR');
});
```

### 4. Error Handling

#### Generic Errors
```typescript
it('should handle generic errors gracefully', async () => {
  const response = await request(app).get('/api/error');
  
  expect(response.status).toBe(500);
  expect(response.body.error).toHaveProperty('code');
  expect(response.body.error).toHaveProperty('message');
  expect(response.body.error).toHaveProperty('timestamp');
});
```

#### Validation Errors
```typescript
it('should handle validation errors with proper status', async () => {
  const response = await request(app).get('/api/validation-error');
  
  expect(response.status).toBe(400);
  expect(response.body.error.code).toBe('VALIDATION_ERROR');
});
```

### 5. CORS Configuration

#### Allowed Origins
```typescript
it('should allow requests from allowed origins', async () => {
  const response = await request(app)
    .get('/api/')
    .set('Origin', 'https://linguamate.app');
  
  expect(response.status).toBe(200);
  expect(response.headers['access-control-allow-origin']).toBe('https://linguamate.app');
});
```

#### Disallowed Origins
```typescript
it('should reject requests from disallowed origins', async () => {
  const response = await request(app)
    .get('/api/')
    .set('Origin', 'https://malicious.com');
  
  expect(response.status).toBe(200); // CORS is handled by browser
  expect(response.headers['access-control-allow-origin']).toBeUndefined();
});
```

## Performance Testing

### Response Time Tests
```typescript
it('should respond within acceptable time limits', async () => {
  const start = Date.now();
  const response = await request(app).get('/api/');
  const duration = Date.now() - start;
  
  expect(response.status).toBe(200);
  expect(duration).toBeLessThan(1000); // 1 second
});
```

### Load Testing (Future)
- **Concurrent Requests**: Test with multiple simultaneous requests
- **Rate Limit Testing**: Verify rate limiting under load
- **Memory Usage**: Monitor memory usage during tests

## Security Testing

### JWT Security
```typescript
it('should validate JWT secret requirements', () => {
  // Test missing secret
  delete process.env.JWT_SECRET;
  expect(() => {
    signJwt({ sub: 'test', expInSec: 3600 });
  }).toThrow('JWT_SECRET environment variable is required');
  
  // Test weak secret
  process.env.JWT_SECRET = 'weak';
  expect(() => {
    signJWT({ sub: 'test', expInSec: 3600 });
  }).toThrow('JWT_SECRET must be a secure random string');
});
```

### Input Sanitization
```typescript
it('should sanitize malicious input', () => {
  const maliciousInput = '<script>alert("xss")</script>';
  const sanitized = sanitiseInput(maliciousInput);
  
  expect(sanitized).not.toContain('<script>');
  expect(sanitized).not.toContain('alert');
});
```

## Test Coverage Requirements

### Minimum Coverage Targets
- **Overall Backend Code**: 80%
- **Security Functions**: 95%
- **Validation Logic**: 90%
- **Error Handling**: 85%
- **Middleware**: 90%

### Coverage Reporting
```bash
# Generate coverage report
npm run backend:test -- --coverage

# View coverage report
open coverage/lcov-report/index.html
```

## Test Environment Setup

### Required Environment Variables
```bash
# Test environment
NODE_ENV=test
JWT_SECRET=test-secret-key-that-is-long-enough-for-security-requirements
CORS_ORIGIN=https://test.com
LOG_LEVEL=error
```

### Test Database (Future)
- **In-Memory Database**: For unit tests
- **Test Database**: For integration tests
- **Mock Services**: For external API tests

## Continuous Integration

### Pre-commit Hooks
- **Lint Check**: Ensure code quality
- **Type Check**: Verify TypeScript types
- **Unit Tests**: Run fast unit tests

### CI Pipeline
- **Full Test Suite**: All tests on every PR
- **Coverage Check**: Ensure coverage targets are met
- **Security Scan**: Automated security testing
- **Performance Test**: Basic performance validation

### Deployment Testing
- **Health Check**: Verify server starts correctly
- **API Validation**: Test critical endpoints
- **Configuration Check**: Verify environment setup

## Test Maintenance

### Regular Updates
- **Test Data**: Update test fixtures regularly
- **Dependencies**: Keep test dependencies updated
- **Coverage**: Monitor and improve coverage
- **Performance**: Update performance benchmarks

### Test Documentation
- **Test Cases**: Document all test scenarios
- **Test Data**: Document test data requirements
- **Environment**: Document test environment setup
- **Troubleshooting**: Document common test issues

## Troubleshooting

### Common Test Issues
1. **JWT Secret Error**: Ensure JWT_SECRET is set in test environment
2. **CORS Issues**: Check CORS_ORIGIN configuration
3. **Rate Limiting**: Clear rate limit state between tests
4. **Timeout Issues**: Check timeout configuration

### Debugging Tests
```bash
# Run tests with verbose output
npm run backend:test -- --verbose

# Run specific test with debug info
npm run backend:test -- --testNamePattern="rate limit" --verbose

# Run tests in debug mode
DEBUG=* npm run backend:test
```

### Test Data Issues
- **Clean State**: Ensure tests start with clean state
- **Isolation**: Tests should not depend on each other
- **Mocking**: Use mocks for external dependencies
- **Cleanup**: Clean up after tests complete

## Future Enhancements

### Advanced Testing
- **Property-Based Testing**: Generate test cases automatically
- **Mutation Testing**: Test test quality
- **Chaos Engineering**: Test system resilience
- **Load Testing**: Performance under load

### Test Automation
- **Test Generation**: Automatically generate test cases
- **Test Optimization**: Optimize test execution time
- **Test Reporting**: Enhanced test reporting
- **Test Analytics**: Test quality metrics