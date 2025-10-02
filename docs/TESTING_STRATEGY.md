# Testing Strategy

## Overview

Linguamate follows a comprehensive testing strategy that ensures code quality, reliability, and maintainability across the entire application stack.

## Testing Pyramid

Our testing approach follows the testing pyramid principle:

### 1. Unit Tests (Broad Base)
- **Schemas & Pure Logic**: Extensive coverage of Zod schemas, utility functions, and business logic
- **Coverage Target**: 85%+ lines, 80%+ functions, 70%+ branches
- **Tools**: Jest, ts-jest
- **Location**: `__tests__/` and `tests/`

### 2. Integration & Component Tests (Middle Layer)
- **UI Components**: React Native components with React Testing Library
- **API Integration**: tRPC procedures with local invocation
- **Coverage Target**: 85%+ lines, 80%+ functions
- **Tools**: Jest, @testing-library/react, @testing-library/react-native
- **Location**: `__tests__/` and `tests/`

### 3. End-to-End Tests (Thin Top)
- **Critical User Flows**: Authentication, lesson completion, navigation
- **Platform**: Web only (via Playwright)
- **Coverage**: Key user journeys and smoke tests
- **Tools**: Playwright
- **Location**: `tests/e2e/`

## Coverage Thresholds

Coverage thresholds are enforced via Jest configuration and CI:

```typescript
{
  global: {
    branches: 70,
    functions: 80,
    lines: 85,
    statements: 85
  },
  './schemas/**': {
    branches: 90,
    functions: 95,
    lines: 95,
    statements: 95
  },
  './state/**': {
    branches: 75,
    functions: 85,
    lines: 85,
    statements: 85
  }
}
```

## Testing Conventions

### TestID Policy

All navigable screens and critical UI elements must have `data-testid` attributes:

- `learn-surface` - Learn screen root
- `lessons-list` - Lessons list container
- `modules-grid` - Modules grid container
- `chat-input` - Chat input field
- `profile-leaderboard` - Profile/leaderboard view

### Accessibility

For React Native Web components:
- Set `accessibilityRole` for semantic meaning
- Set `accessibilityLabel` for screen readers
- Optional: Use `jest-axe` for automated a11y checks on key screens

## Network Mocking

### MSW (Mock Service Worker)

We use MSW for network isolation in tests:

**Location**: `tests/msw/handlers.ts`

**Usage**:
```typescript
import { server } from '../tests/msw/server';

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

**Customizing Handlers**:
```typescript
server.use(
  http.post('**/api/trpc/lessons.submit', () => {
    return HttpResponse.json({ result: { data: { success: true } } });
  })
);
```

## tRPC Testing

### Local Procedure Invocation

For backend unit tests, invoke tRPC procedures directly without HTTP:

**Location**: `tests/utils/trpcLocal.ts`

**Usage**:
```typescript
import { callProcedure } from '../tests/utils/trpcLocal';

const result = await callProcedure('lessons.getAll', { language: 'pa' });
```

## Test Data Factories

Factories provide consistent, reusable test data:

**Location**: `tests/factories/`

**Available Factories**:
- `makeLesson()` - Creates lesson objects
- `makeExercise()` - Creates exercise objects
- `makeUser()` - Creates user objects
- `makeUserProfile()` - Creates user profile with preferences

**Usage**:
```typescript
import { makeLesson } from '../tests/factories';

const lesson = makeLesson({ xpReward: 50, level: 'B1' });
```

## Flake Prevention

### Deterministic Seeds
- Use factories with predictable data
- Avoid random values in assertions
- Use `crypto.randomUUID()` for IDs (polyfilled in tests)

### Fake Timers
```typescript
jest.useFakeTimers();
// ... test code
jest.advanceTimersByTime(1000);
jest.useRealTimers();
```

### Network Stability
- All network calls mocked via MSW
- No real API calls in unit/integration tests
- E2E tests use stable test environment

## CI Gates

All PRs must pass:
1. **Typecheck** - `tsc --noEmit`
2. **Lint** - ESLint + Prettier
3. **Unit Tests** - Jest with coverage thresholds
4. **E2E Tests** - Playwright (web)
5. **Build** - Web build succeeds

## Running Tests

### Local Development

```bash
# Run all unit tests
bun test

# Run tests in watch mode
bun test:watch

# Run E2E tests
bun e2e

# View E2E report
bun e2e:report

# Run with coverage
bun test -- --coverage
```

### CI Environment

Tests run automatically on:
- Pull requests
- Pushes to `main` and `develop` branches

## Best Practices

### DO
✅ Write tests for new features and bug fixes
✅ Use factories for test data
✅ Mock external dependencies
✅ Test error cases and edge conditions
✅ Keep tests focused and isolated
✅ Use descriptive test names
✅ Follow AAA pattern (Arrange, Act, Assert)

### DON'T
❌ Test implementation details
❌ Make real API calls in unit tests
❌ Share state between tests
❌ Use hardcoded IDs or timestamps
❌ Skip tests without good reason
❌ Write tests that depend on execution order

## Resources

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [MSW Documentation](https://mswjs.io/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
