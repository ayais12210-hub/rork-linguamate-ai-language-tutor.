# Backend Test Plan

## Overview

This document outlines the testing strategy, test cases, and coverage requirements for the Linguamate backend.

## Testing Stack

- **Test Runner:** Jest v30.2.0
- **Test Environment:** Node (jsdom for React Native compatibility)
- **Assertion Library:** Jest + @testing-library/jest-native
- **Mocking:** MSW (Mock Service Worker) v2.11.3 for network mocking
- **Coverage Tool:** Jest coverage (c8/v8)

## Test Structure

```
backend/
└── __tests__/
    ├── rateLimit.test.ts           ✅ Rate limiting middleware
    ├── stt.validation.test.ts      ✅ STT validation
    ├── validation.middleware.test.ts ✅ Validation schemas
    └── [NEEDS MORE TESTS]
```

## Coverage Requirements

| Component          | Target | Current | Gap   |
|--------------------|--------|---------|-------|
| **Middleware**     | 85%    | ~60%    | -25%  |
| **Routes**         | 80%    | ~30%    | -50%  |
| **tRPC Procedures**| 75%    | ~20%    | -55%  |
| **Validation**     | 95%    | ~80%    | -15%  |
| **Overall Backend**| 80%    | ~40%    | -40%  |

## Test Categories

### 1. Unit Tests

Test individual functions, middleware, and utilities in isolation.

#### Middleware Tests

**Rate Limiting (`rateLimit.test.ts`)** ✅
- [x] Allows requests under limit
- [x] Blocks requests exceeding limit
- [x] Includes rate limit headers
- [x] Resets count after window expires
- [x] Tracks different IPs independently

**Validation Middleware (`validation.middleware.test.ts`)** ✅
- [x] Pagination schema validation
- [x] Sorting schema validation
- [x] Search schema validation
- [x] ID (UUID) schema validation
- [x] Language code schema validation
- [x] Date range schema validation
- [x] Error formatting
- [x] Schema composition

**STT Validation (`stt.validation.test.ts`)** ✅
- [x] Language code validation
- [x] File size validation
- [x] MIME type validation
- [x] Form data parsing

**TODO: Add Tests**
- [ ] Security headers middleware
- [ ] Correlation ID middleware
- [ ] Request logger middleware
- [ ] JWT sign/verify functions
- [ ] Input sanitization functions
- [ ] Validation parsers

#### Utility Tests

**TODO: Add Tests**
- [ ] `sanitiseString()` - removes control chars, normalizes whitespace
- [ ] `sanitiseEmail()` - lowercases, trims, normalizes
- [ ] `sanitiseHTML()` - removes scripts, event handlers
- [ ] `sanitiseFilename()` - removes invalid chars
- [ ] `sanitiseDeep()` - recursively sanitizes objects/arrays
- [ ] `signJwt()` - creates valid JWT with correct payload
- [ ] `verifyJwt()` - validates signature, checks expiration

### 2. Integration Tests

Test complete request/response flows through the API.

#### Health Endpoints

**TODO: Add Tests**
- [ ] `GET /api/` - Returns 200 with status "ok"
- [ ] `GET /api/info` - Returns API metadata
- [ ] `GET /api/health` - Returns health status, uptime, env
- [ ] `GET /api/stt/health` - Returns STT service health
- [ ] `GET /api/toolkit/health` - Returns toolkit health

#### tRPC Procedures

**Authentication (`auth` router)** - TODO
- [ ] `auth.login` - Valid credentials → Returns tokens
- [ ] `auth.login` - Invalid email → Returns UNAUTHORIZED
- [ ] `auth.login` - Invalid password → Returns UNAUTHORIZED
- [ ] `auth.login` - Rate limit exceeded → Returns TOO_MANY_REQUESTS
- [ ] `auth.signup` - Valid data → Creates user + returns tokens
- [ ] `auth.signup` - Duplicate email → Returns BAD_REQUEST
- [ ] `auth.signup` - Weak password → Returns BAD_REQUEST
- [ ] `auth.refreshToken` - Valid refresh token → Returns new access token
- [ ] `auth.refreshToken` - Expired token → Returns UNAUTHORIZED
- [ ] `auth.logout` - Valid session → Invalidates session
- [ ] `auth.resetPassword` - Valid code → Resets password
- [ ] `auth.getCurrentUser` - Protected → Returns user data
- [ ] `auth.getCurrentUser` - No auth → Returns UNAUTHORIZED

**User Management (`user` router)** - TODO
- [ ] `user.get` - Protected → Returns user profile
- [ ] `user.update` - Protected + valid data → Updates profile
- [ ] `user.completeOnboarding` - Protected → Marks onboarding complete
- [ ] `user.upgradeToPremium` - Protected → Upgrades to premium
- [ ] `user.canSendMessage` - Protected → Checks message limit
- [ ] `user.incrementMessageCount` - Protected → Increments count

**Lessons (`lessons` router)** - TODO
- [ ] `lessons.getAll` - Protected → Returns lesson list
- [ ] `lessons.getById` - Protected + valid ID → Returns lesson
- [ ] `lessons.getById` - Invalid ID → Returns NOT_FOUND
- [ ] `lessons.getUserProgress` - Protected → Returns progress
- [ ] `lessons.updateProgress` - Protected + valid data → Updates progress
- [ ] `lessons.generate` - Protected → Generates new lesson
- [ ] `lessons.submit` - Protected + valid answers → Grades lesson

**Chat (`chat` router)** - TODO
- [ ] `chat.sendMessage` - Protected + valid message → Returns AI response
- [ ] `chat.translate` - Protected + valid text → Returns translation
- [ ] `chat.getHistory` - Protected → Returns chat history
- [ ] `chat.analyzePronunciation` - Protected + audio → Returns analysis

#### External Proxies

**Toolkit Proxy** - TODO
- [ ] `POST /api/toolkit/text/llm` - Valid request → Proxies to toolkit API
- [ ] `POST /api/toolkit/text/llm` - Rate limited → Returns 429
- [ ] `POST /api/toolkit/text/llm` - Upstream 500 → Retries 2x → Returns 503
- [ ] `POST /api/toolkit/stt/transcribe` - Valid audio → Returns transcription
- [ ] `POST /api/toolkit/stt/transcribe` - Invalid file → Returns 400

**STT Route** - TODO
- [ ] `POST /api/stt/transcribe` - Valid audio + language → Returns transcription
- [ ] `POST /api/stt/transcribe` - File too large → Returns 413
- [ ] `POST /api/stt/transcribe` - Invalid MIME type → Returns 400
- [ ] `POST /api/stt/transcribe` - Invalid language code → Returns 400
- [ ] `POST /api/stt/transcribe` - Rate limited → Returns 429

### 3. Security Tests

Test authentication, authorization, and security hardening.

**TODO: Add Tests**
- [ ] JWT signature verification rejects tampered tokens
- [ ] JWT expiration is enforced
- [ ] Protected procedures reject requests without auth
- [ ] Protected procedures reject requests with invalid auth
- [ ] Rate limiting applies per-IP and per-route
- [ ] Input sanitization removes XSS payloads
- [ ] CORS headers are set correctly
- [ ] Security headers (CSP, X-Frame-Options, etc.) are present
- [ ] Log ingestion rejects invalid HMAC signatures
- [ ] Log ingestion rejects requests with clock skew > 5 minutes

### 4. Error Handling Tests

Test graceful error handling and safe error messages.

**TODO: Add Tests**
- [ ] Zod validation errors return 400 with structured error
- [ ] Missing required fields return 400
- [ ] Database errors return 500 without leaking internals
- [ ] External API failures return 503
- [ ] Unauthorized access returns 401
- [ ] Forbidden access returns 403
- [ ] Not found resources return 404
- [ ] Rate limit exceeded returns 429 with retry-after

### 5. Performance Tests

Test rate limiting, timeouts, and concurrency.

**TODO: Add Tests**
- [ ] Rate limiting resets after window expires
- [ ] Rate limiting allows burst up to limit
- [ ] External calls timeout after 30s (once implemented)
- [ ] Concurrent requests are handled correctly
- [ ] Memory leaks in rate limit map cleanup

## Test Execution

### Local Development

```bash
# Run all tests
npm run test

# Run backend tests only
npm run backend:test  # TODO: Add this script

# Run with coverage
npm run test -- --coverage

# Run specific test file
npm run test backend/__tests__/rateLimit.test.ts

# Watch mode
npm run test:watch
```

### CI Pipeline

```bash
# CI test command (no watch, with coverage)
npm run test:ci
```

**CI Requirements:**
- All tests must pass
- Backend coverage >= 80% (lines, statements)
- No leaked secrets in test snapshots
- No disabled tests without explanation

## Mocking Strategy

### External Services

Use MSW to mock external HTTP calls:

```typescript
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  http.post('https://toolkit.rork.com/text/llm/', () => {
    return HttpResponse.json({ text: 'Mocked response' });
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### Database

Use in-memory mock (current approach) or:
- **Option 1:** Test against real DB with docker-compose
- **Option 2:** Use SQLite in-memory for tests
- **Option 3:** Mock database layer with jest.mock()

### Time-Dependent Tests

Use `jest.useFakeTimers()` for rate limiting, JWT expiration, etc.:

```typescript
jest.useFakeTimers();
// ... make request
jest.advanceTimersByTime(60000); // Fast-forward 1 minute
// ... verify rate limit reset
jest.useRealTimers();
```

## Coverage Reporting

### Generate Coverage Report

```bash
npm run test:ci
open coverage/lcov-report/index.html
```

### Coverage Thresholds

Configured in `jest.config.ts`:

```typescript
coverageThreshold: {
  global: {
    branches: 75,
    functions: 80,
    lines: 80,
    statements: 80,
  },
  './backend/**': {
    branches: 75,
    functions: 80,
    lines: 80,
    statements: 80,
  },
}
```

## Test Conventions

### Naming

- Test files: `*.test.ts` or `*.test.tsx`
- Test suites: `describe('ComponentName', () => {})`
- Test cases: `it('should do something when condition', async () => {})`

### Structure

```typescript
describe('FeatureName', () => {
  // Setup
  beforeEach(() => {
    // Reset state, mocks, etc.
  });

  afterEach(() => {
    // Cleanup
  });

  describe('happy path', () => {
    it('should succeed with valid input', async () => {
      // Arrange
      const input = { valid: 'data' };

      // Act
      const result = await functionUnderTest(input);

      // Assert
      expect(result).toBe(expected);
    });
  });

  describe('error cases', () => {
    it('should throw error with invalid input', async () => {
      // Arrange
      const input = { invalid: 'data' };

      // Act & Assert
      await expect(functionUnderTest(input)).rejects.toThrow('Error message');
    });
  });
});
```

### Assertions

- Use `expect(actual).toBe(expected)` for primitives
- Use `expect(actual).toEqual(expected)` for objects/arrays
- Use `expect(actual).toMatchObject(subset)` for partial matches
- Use `expect(fn).toThrow(error)` for error assertions
- Use `expect(spy).toHaveBeenCalledWith(args)` for mocks

## Test Data

### Factories

Create test data factories for common entities:

```typescript
// tests/factories/user.ts
export function makeUser(overrides?: Partial<User>): User {
  return {
    id: crypto.randomUUID(),
    email: 'test@example.com',
    name: 'Test User',
    createdAt: Date.now(),
    ...overrides,
  };
}
```

### Fixtures

Store static test data in `tests/fixtures/`:

```
tests/
└── fixtures/
    ├── users.json
    ├── lessons.json
    └── audio/
        ├── sample.webm
        └── sample.wav
```

## Acceptance Criteria

### Before Merging PR

- [ ] All existing tests pass
- [ ] New code has >= 80% test coverage
- [ ] No skipped/disabled tests without explanation
- [ ] No console.log/console.error in tests (use logger)
- [ ] No hardcoded secrets or PII in test data
- [ ] MSW handlers clean up after each test

### Backend Test Checklist

- [ ] Health endpoints tested (200, uptime, version)
- [ ] At least 1 happy path per tRPC procedure
- [ ] At least 1 validation error per input schema
- [ ] At least 1 auth failure (protected procedure without JWT)
- [ ] At least 1 upstream failure (mocked external API 500)
- [ ] Rate limiting tested (under limit, over limit, reset)
- [ ] JWT sign/verify tested (valid, expired, invalid signature)
- [ ] Input sanitization tested (XSS, script injection)

## Next Steps

1. **Baseline:** Run existing tests, document current coverage
2. **Fill Gaps:** Add missing middleware tests (security headers, correlation, logger)
3. **Integration Tests:** Add tRPC procedure tests for auth, user, lessons
4. **E2E Tests:** Add full request/response flows with MSW mocks
5. **CI Integration:** Add backend test job to GitHub Actions
6. **Coverage Gates:** Enforce 80% coverage threshold in CI

---

**Last Updated:** 2025-10-06  
**Maintainer:** QA Team
