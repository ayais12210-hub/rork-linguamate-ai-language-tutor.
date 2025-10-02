# Testing Strategy - Linguamate

This document outlines the comprehensive testing strategy for the Linguamate language learning application.

## Table of Contents

1. [Overview](#overview)
2. [Testing Pyramid](#testing-pyramid)
3. [Test Types](#test-types)
4. [Coverage Requirements](#coverage-requirements)
5. [Testing Tools](#testing-tools)
6. [Best Practices](#best-practices)
7. [CI/CD Integration](#cicd-integration)
8. [Running Tests](#running-tests)

## Overview

Linguamate employs a multi-layered testing approach to ensure code quality, reliability, and maintainability across web and mobile platforms. Our testing strategy emphasizes:

- **Fast feedback loops** through unit tests
- **Integration confidence** through component and API tests
- **User experience validation** through E2E tests
- **Type safety** through TypeScript strict mode
- **Code quality** through linting and formatting

## Testing Pyramid

We follow the testing pyramid principle:

```
        /\
       /  \      E2E Tests (Thin)
      /____\     - Critical user flows
     /      \    - Smoke tests
    /        \   
   /__________\  Integration Tests (Focused)
  /            \ - Component tests
 /              \- API tests
/________________\ Unit Tests (Broad)
                  - Pure functions
                  - Utilities
                  - Schemas
                  - Business logic
```

### Distribution Target

- **Unit Tests**: 70% of test suite
- **Integration Tests**: 25% of test suite
- **E2E Tests**: 5% of test suite

## Test Types

### 1. Unit Tests

**Purpose**: Test individual functions, utilities, and pure logic in isolation.

**Location**: `__tests__/` and co-located `*.test.ts` files

**Tools**: Jest, @testing-library/react

**Coverage Target**: 85% lines, 80% functions, 70% branches

**Examples**:
- Schema validation (Zod schemas)
- Utility functions (text, date, number utils)
- Pure business logic
- State management logic
- Data transformations

**Sample Test**:
```typescript
import { textUtils } from '@/lib/utils';

describe('textUtils', () => {
  it('should capitalize strings', () => {
    expect(textUtils.capitalize('hello')).toBe('Hello');
  });
});
```

### 2. Integration Tests

**Purpose**: Test component interactions, API calls, and state management.

**Location**: `tests/integration/`

**Tools**: Jest, React Testing Library, MSW

**Coverage Target**: 75% lines, 70% branches

**Examples**:
- React component rendering
- User interactions (clicks, inputs)
- API request/response handling
- State updates and side effects
- Context providers

**Sample Test**:
```typescript
import { render, screen, fireEvent } from '@/tests/utils/render';
import LessonCard from '@/components/LessonCard';

test('should start lesson on button click', async () => {
  const onStart = jest.fn();
  render(<LessonCard lesson={mockLesson} onStart={onStart} />);
  
  fireEvent.click(screen.getByText('Start Lesson'));
  
  expect(onStart).toHaveBeenCalledWith(mockLesson.id);
});
```

### 3. E2E Tests (Web)

**Purpose**: Validate critical user flows and ensure the app works end-to-end.

**Location**: `tests/e2e/`

**Tools**: Playwright

**Coverage Target**: Critical paths only

**Examples**:
- User authentication flow
- Lesson completion flow
- Navigation between tabs
- Profile updates
- Leaderboard interactions

**Sample Test**:
```typescript
import { test, expect } from '@playwright/test';

test('should complete a lesson', async ({ page }) => {
  await page.goto('/lessons');
  await page.getByTestId('lesson-card-1').click();
  await page.getByTestId('lesson-start-button').click();
  
  // Complete exercises...
  
  await expect(page.getByText('Lesson Complete!')).toBeVisible();
});
```

### 4. Backend Tests

**Purpose**: Test tRPC procedures, API routes, and backend logic.

**Location**: `backend/tests/`

**Tools**: Jest, tRPC testing utilities

**Examples**:
- tRPC procedure execution
- Input validation
- Authorization checks
- Database operations (mocked)
- Error handling

**Sample Test**:
```typescript
import { callProcedure, createAuthenticatedContext } from '@/tests/utils/trpcLocal';

test('should fetch user lessons', async () => {
  const ctx = await createAuthenticatedContext('user-123');
  const lessons = await callProcedure('lessons.list', {}, ctx);
  
  expect(lessons).toHaveLength(5);
});
```

## Coverage Requirements

### Global Thresholds

Enforced in `jest.config.ts`:

```typescript
coverageThreshold: {
  global: {
    branches: 70,
    functions: 80,
    lines: 85,
    statements: 85,
  }
}
```

### Per-Directory Thresholds

- **Schemas** (`./schemas/**`): 95% lines, 90% branches
- **State** (`./state/**`): 85% lines, 75% branches
- **Backend** (`./backend/**`): 85% lines, 75% branches

### Exemptions

The following are excluded from coverage:
- Type definition files (`*.d.ts`)
- Test files (`*.test.ts`, `*.spec.ts`)
- Configuration files
- Mock data and fixtures

## Testing Tools

### Core Testing Libraries

| Tool | Purpose | Version |
|------|---------|---------|
| Jest | Unit & integration test runner | Latest |
| @testing-library/react | React component testing | Latest |
| @testing-library/react-native | RN component testing | Latest |
| Playwright | E2E testing (web) | Latest |
| MSW | API mocking | Latest |
| @faker-js/faker | Test data generation | Latest |

### Supporting Tools

- **ts-jest**: TypeScript support for Jest
- **react-test-renderer**: React Native snapshot testing
- **@testing-library/jest-native**: Custom matchers for RN
- **@testing-library/jest-dom**: Custom matchers for DOM

## Best Practices

### 1. Test Naming

Use descriptive test names that explain the behavior:

```typescript
// ✅ Good
test('should display error message when email is invalid', () => {});

// ❌ Bad
test('email validation', () => {});
```

### 2. Arrange-Act-Assert Pattern

Structure tests clearly:

```typescript
test('should add item to cart', () => {
  // Arrange
  const cart = createCart();
  const item = makeItem();
  
  // Act
  cart.addItem(item);
  
  // Assert
  expect(cart.items).toContain(item);
});
```

### 3. Use Test Factories

Leverage factories for consistent test data:

```typescript
import { makeLesson, makeUser } from '@/tests/factories';

const lesson = makeLesson({ level: 'A1' });
const user = makeUser({ email: 'test@example.com' });
```

### 4. Mock External Dependencies

Use MSW for API mocking:

```typescript
import { server } from '@/tests/msw/server';
import { http, HttpResponse } from 'msw';

server.use(
  http.get('/api/lessons', () => {
    return HttpResponse.json([mockLesson]);
  })
);
```

### 5. Test User Behavior, Not Implementation

```typescript
// ✅ Good - tests user behavior
test('should show success message after form submission', async () => {
  render(<ContactForm />);
  
  await userEvent.type(screen.getByLabelText('Email'), 'test@example.com');
  await userEvent.click(screen.getByRole('button', { name: 'Submit' }));
  
  expect(screen.getByText('Message sent!')).toBeInTheDocument();
});

// ❌ Bad - tests implementation details
test('should call handleSubmit when form is submitted', () => {
  const handleSubmit = jest.fn();
  render(<ContactForm onSubmit={handleSubmit} />);
  
  // ...
  
  expect(handleSubmit).toHaveBeenCalled();
});
```

### 6. Use TestIDs Sparingly

Prefer semantic queries, use testIDs as fallback:

```typescript
// ✅ Best - semantic query
screen.getByRole('button', { name: 'Start Lesson' });

// ✅ Good - label query
screen.getByLabelText('Email address');

// ⚠️ Acceptable - testID for complex elements
screen.getByTestId('lesson-card-123');

// ❌ Avoid - text content (brittle)
screen.getByText('Click here');
```

### 7. Avoid Test Interdependence

Each test should be independent:

```typescript
// ✅ Good
describe('User authentication', () => {
  beforeEach(() => {
    // Fresh state for each test
    resetAuthState();
  });
  
  test('should login successfully', () => {});
  test('should handle login error', () => {});
});

// ❌ Bad - tests depend on execution order
test('should login', () => { /* sets global state */ });
test('should access protected route', () => { /* depends on previous test */ });
```

### 8. Test Error Scenarios

Don't just test the happy path:

```typescript
describe('Lesson API', () => {
  test('should fetch lessons successfully', async () => {});
  test('should handle network error', async () => {});
  test('should handle 404 not found', async () => {});
  test('should handle unauthorized access', async () => {});
});
```

## CI/CD Integration

### GitHub Actions Workflow

Our CI pipeline runs on every PR and push to main:

1. **Install Dependencies** - Cache and install npm packages
2. **Type Check** - Run TypeScript compiler
3. **Lint** - Run ESLint and Prettier
4. **Unit Tests** - Run Jest with coverage
5. **E2E Tests** - Run Playwright tests (web)
6. **Build** - Build web app

### PR Requirements

PRs must pass all checks:
- ✅ Type checking
- ✅ Linting
- ✅ Unit tests with coverage thresholds
- ✅ E2E tests (critical paths)
- ✅ Build succeeds

### Coverage Reporting

Coverage reports are uploaded to Codecov and displayed on PRs.

## Running Tests

### Local Development

```bash
# Run all unit tests
bun test

# Run tests in watch mode
bun test:watch

# Run tests with coverage
bun test --coverage

# Run E2E tests
bun e2e

# Run E2E tests with UI
bun e2e:ui

# Run specific test file
bun test path/to/test.test.ts

# Run tests matching pattern
bun test --testNamePattern="should validate email"
```

### CI Environment

```bash
# Run tests in CI mode (no watch, sequential)
bun test:ci

# Run E2E tests in CI
bun e2e
```

### Debugging Tests

```bash
# Debug E2E tests
bun e2e:debug

# Debug Jest tests with Node inspector
node --inspect-brk node_modules/.bin/jest --runInTest

# Run single test file in watch mode
bun test:watch path/to/test.test.ts
```

## Test Organization

```
linguamate/
├── __tests__/              # Top-level unit tests
│   ├── schemas.lesson.test.ts
│   ├── lib.utils.test.ts
│   └── factories.test.ts
├── tests/
│   ├── config/            # Test configuration
│   │   ├── jest.setup.ts
│   │   ├── styleMock.js
│   │   └── fileMock.js
│   ├── e2e/               # E2E tests
│   │   ├── smoke.spec.ts
│   │   ├── navigation.spec.ts
│   │   └── auth.spec.ts
│   ├── factories/         # Test data factories
│   │   ├── lesson.ts
│   │   ├── user.ts
│   │   └── index.ts
│   ├── msw/               # MSW handlers
│   │   ├── handlers.ts
│   │   ├── server.ts
│   │   └── browser.ts
│   └── utils/             # Test utilities
│       ├── render.tsx
│       ├── trpcLocal.ts
│       └── index.ts
├── backend/tests/         # Backend tests
├── jest.config.ts         # Jest configuration
└── playwright.config.ts   # Playwright configuration
```

## Flake Prevention

### Strategies to Avoid Flaky Tests

1. **Use Fake Timers**
   ```typescript
   jest.useFakeTimers();
   // ... test code
   jest.advanceTimersByTime(1000);
   jest.useRealTimers();
   ```

2. **Wait for Async Operations**
   ```typescript
   await waitFor(() => {
     expect(screen.getByText('Loaded')).toBeInTheDocument();
   });
   ```

3. **Deterministic Test Data**
   ```typescript
   // Use fixed seeds for random data
   faker.seed(123);
   ```

4. **Avoid Hard-Coded Timeouts**
   ```typescript
   // ❌ Bad
   await new Promise(resolve => setTimeout(resolve, 1000));
   
   // ✅ Good
   await waitFor(() => expect(element).toBeVisible());
   ```

## Continuous Improvement

### Metrics to Track

- Test execution time
- Test flakiness rate
- Coverage trends
- PR test failure rate

### Regular Reviews

- Monthly test suite audit
- Quarterly testing strategy review
- Remove obsolete tests
- Refactor slow tests
- Update test documentation

## Resources

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [MSW Documentation](https://mswjs.io/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

---

**Last Updated**: 2025-01-02

**Maintained By**: QA Team (@linguamate/qa-team)
