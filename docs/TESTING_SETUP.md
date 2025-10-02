# Testing Setup Guide

## Prerequisites

- Node.js 20+
- Bun (recommended) or npm/yarn
- Git

## Installation

### 1. Install Dependencies

```bash
bun install
```

This will install all testing dependencies including:
- `jest` - Test runner
- `ts-jest` - TypeScript support for Jest
- `@testing-library/react` - React testing utilities
- `@testing-library/react-native` - React Native testing utilities
- `@testing-library/jest-native` - Custom matchers for RN
- `@playwright/test` - E2E testing framework
- `msw` - API mocking
- `husky` - Git hooks
- `lint-staged` - Pre-commit linting
- `commitlint` - Commit message linting

### 2. Initialize Husky

```bash
bun run prepare
```

This sets up Git hooks for:
- Pre-commit: Runs lint-staged (ESLint + Prettier on staged files)
- Commit-msg: Validates commit messages follow Conventional Commits

### 3. Install Playwright Browsers

```bash
bunx playwright install --with-deps
```

This installs Chromium and WebKit browsers for E2E testing.

## Configuration Files

### Jest Configuration
**File**: `jest.config.ts`

Key settings:
- Test environment: `jsdom` (for React Native Web compatibility)
- Setup file: `tests/config/jest.setup.ts`
- Module name mapping for path aliases
- Coverage thresholds
- Transform ignore patterns for React Native modules

### Playwright Configuration
**File**: `playwright.config.ts`

Key settings:
- Test directory: `tests/e2e`
- Base URL: `http://localhost:8081`
- Browsers: Chromium, WebKit
- Web server auto-start

### MSW Configuration
**Files**: 
- `tests/msw/handlers.ts` - Request handlers
- `tests/msw/server.ts` - Node server setup
- `tests/msw/browser.ts` - Browser worker setup

### Commit Quality
**Files**:
- `commitlint.config.cjs` - Commit message rules
- `.lintstagedrc.json` - Pre-commit checks
- `.husky/pre-commit` - Pre-commit hook
- `.husky/commit-msg` - Commit message hook

## Directory Structure

```
linguamate/
├── __tests__/              # Top-level unit tests
│   ├── schemas.lesson.test.ts
│   ├── factories.test.ts
│   └── lib.utils.test.ts
├── tests/
│   ├── config/            # Test configuration
│   │   ├── jest.setup.ts
│   │   ├── styleMock.js
│   │   └── fileMock.js
│   ├── e2e/               # End-to-end tests
│   │   ├── smoke.spec.ts
│   │   ├── navigation.spec.ts
│   │   └── auth.spec.ts
│   ├── factories/         # Test data factories
│   │   ├── lesson.ts
│   │   ├── user.ts
│   │   └── index.ts
│   ├── msw/               # API mocking
│   │   ├── handlers.ts
│   │   ├── server.ts
│   │   └── browser.ts
│   └── utils/             # Test utilities
│       ├── render.tsx
│       ├── trpcLocal.ts
│       └── index.ts
├── jest.config.ts
├── playwright.config.ts
└── commitlint.config.cjs
```

## Running Tests

### Unit & Integration Tests

```bash
# Run all tests
bun test

# Run tests in watch mode
bun test:watch

# Run with coverage
bun test -- --coverage

# Run specific test file
bun test __tests__/schemas.lesson.test.ts

# Run tests matching pattern
bun test -- --testNamePattern="Lesson"
```

### E2E Tests

```bash
# Run all E2E tests
bun e2e

# Run specific browser
bun e2e -- --project=chromium

# Run specific test file
bun e2e tests/e2e/smoke.spec.ts

# View test report
bun e2e:report

# Debug mode (headed browser)
bun e2e -- --headed --debug
```

### Linting & Formatting

```bash
# Run ESLint
bun lint

# Check formatting
bun format

# Fix formatting
bun format:write

# Type check
bun typecheck
```

## Writing Tests

### Unit Test Example

```typescript
// __tests__/utils.test.ts
import { formatDate } from '@lib/utils';

describe('formatDate', () => {
  test('formats date correctly', () => {
    const date = new Date('2024-01-15');
    expect(formatDate(date)).toBe('Jan 15, 2024');
  });
});
```

### Component Test Example

```typescript
// __tests__/Button.test.tsx
import { renderWithProviders, screen } from '../tests/utils';
import { Button } from '@components/Button';

describe('Button', () => {
  test('renders with text', () => {
    renderWithProviders(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  test('calls onClick when pressed', () => {
    const handleClick = jest.fn();
    renderWithProviders(<Button onPress={handleClick}>Click</Button>);
    
    fireEvent.press(screen.getByText('Click'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### E2E Test Example

```typescript
// tests/e2e/lesson.spec.ts
import { test, expect } from '@playwright/test';

test('completes a lesson', async ({ page }) => {
  await page.goto('/lessons');
  await page.getByTestId('lessons-list').waitFor();
  
  await page.getByText('Punjabi Basics').click();
  await page.getByRole('button', { name: 'Start' }).click();
  
  // Answer questions...
  
  await expect(page.getByText('Lesson Complete!')).toBeVisible();
});
```

## Troubleshooting

### Tests Failing Locally

1. **Clear Jest cache**:
   ```bash
   bun test -- --clearCache
   ```

2. **Update snapshots** (if using):
   ```bash
   bun test -- -u
   ```

3. **Check Node modules**:
   ```bash
   rm -rf node_modules bun.lock
   bun install
   ```

### E2E Tests Failing

1. **Reinstall browsers**:
   ```bash
   bunx playwright install --with-deps
   ```

2. **Check web server**:
   ```bash
   bun web
   # Visit http://localhost:8081 manually
   ```

3. **View trace**:
   ```bash
   bunx playwright show-trace trace.zip
   ```

### Coverage Not Meeting Thresholds

1. **View coverage report**:
   ```bash
   bun test -- --coverage
   open coverage/lcov-report/index.html
   ```

2. **Identify uncovered lines** and add tests

3. **Adjust thresholds** in `jest.config.ts` if needed (with team approval)

## CI/CD Integration

Tests run automatically in GitHub Actions on:
- Pull requests
- Pushes to `main` and `develop`

**Workflow**: `.github/workflows/ci.yml`

**Jobs**:
1. Install dependencies
2. Type check
3. Lint
4. Unit tests (with coverage)
5. E2E tests (web)
6. Build web

All jobs must pass for PR to be mergeable.

## Best Practices

1. **Write tests first** (TDD) when fixing bugs
2. **Keep tests fast** - mock external dependencies
3. **Use factories** for test data
4. **Test behavior, not implementation**
5. **Follow AAA pattern**: Arrange, Act, Assert
6. **Use descriptive test names**
7. **One assertion per test** (when possible)
8. **Clean up after tests** (no shared state)

## Resources

- [Testing Strategy](./TESTING_STRATEGY.md)
- [TestID Conventions](./TESTID_CONVENTIONS.md)
- [Package.json Scripts](./PACKAGE_JSON_SCRIPTS.md)
