# Testing Setup Guide

This guide will help you set up and run the complete testing infrastructure for Linguamate.

## Quick Start

```bash
# 1. Install dependencies (already done)
bun install

# 2. Initialize Husky git hooks
bun run prepare

# 3. Run all tests
bun test

# 4. Run E2E tests
bun e2e
```

## Prerequisites

- Node.js 20+
- Bun 1.0+
- Git

## Installation

All testing dependencies have been installed. If you need to reinstall:

```bash
bun install
```

### Installed Testing Packages

- **jest** - Test runner
- **ts-jest** - TypeScript support for Jest
- **@testing-library/react** - React component testing
- **@testing-library/react-native** - React Native component testing
- **@testing-library/jest-native** - Custom matchers for RN
- **@testing-library/jest-dom** - Custom matchers for DOM
- **@playwright/test** - E2E testing framework
- **msw** - API mocking
- **@faker-js/faker** - Test data generation
- **husky** - Git hooks
- **lint-staged** - Pre-commit linting
- **@commitlint/cli** - Commit message linting
- **prettier** - Code formatting

## Configuration Files

### Jest Configuration

**File**: `jest.config.ts`

Key settings:
- Test environment: jsdom (for web compatibility)
- Coverage thresholds: 85% lines, 80% functions, 70% branches
- Module path mapping for `@/` imports
- Transform ignore patterns for React Native packages

### Playwright Configuration

**File**: `playwright.config.ts`

Key settings:
- Test directory: `tests/e2e/`
- Base URL: `http://localhost:8081`
- Browsers: Chromium, WebKit
- Auto-start web server for tests

### Husky Git Hooks

**Files**: `.husky/pre-commit`, `.husky/commit-msg`

Hooks:
- **pre-commit**: Runs lint-staged (ESLint + Prettier on staged files)
- **commit-msg**: Validates commit messages with commitlint

### Commitlint Configuration

**File**: `commitlint.config.cjs`

Enforces Conventional Commits format:
- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `test:` - Test additions/changes
- `refactor:` - Code refactoring
- `perf:` - Performance improvements
- `ci:` - CI/CD changes
- `chore:` - Maintenance tasks

## Package.json Scripts

You need to manually add these scripts to your `package.json`:

```json
{
  "scripts": {
    "dev": "expo start",
    "web": "expo start --web",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "lint": "eslint . --ext .ts,.tsx",
    "lint:fix": "eslint . --ext .ts,.tsx --fix",
    "format": "prettier --check .",
    "format:write": "prettier --write .",
    "test": "jest --coverage",
    "test:watch": "jest --watch",
    "test:ci": "jest --ci --runInBand --coverage",
    "e2e": "playwright test",
    "e2e:ui": "playwright test --ui",
    "e2e:report": "playwright show-report",
    "e2e:debug": "playwright test --debug",
    "build:web": "expo export --platform web",
    "prepare": "husky install",
    "lint-staged": "lint-staged"
  }
}
```

See `docs/PACKAGE_JSON_SCRIPTS.md` for detailed script descriptions.

## Running Tests

### Unit Tests

```bash
# Run all unit tests
bun test

# Run tests in watch mode (auto-rerun on file changes)
bun test:watch

# Run tests with coverage report
bun test --coverage

# Run specific test file
bun test __tests__/schemas.lesson.test.ts

# Run tests matching a pattern
bun test --testNamePattern="should validate"

# Run tests for changed files only
bun test --onlyChanged
```

### E2E Tests

```bash
# Run all E2E tests
bun e2e

# Run E2E tests with UI mode (interactive)
bun e2e:ui

# Run E2E tests in debug mode
bun e2e:debug

# Run specific E2E test file
bun e2e tests/e2e/smoke.spec.ts

# Run E2E tests in specific browser
bun e2e --project=chromium
bun e2e --project=webkit

# View last test report
bun e2e:report
```

### Type Checking

```bash
# Run TypeScript type checking
bun typecheck
```

### Linting & Formatting

```bash
# Run ESLint
bun lint

# Run ESLint and auto-fix issues
bun lint:fix

# Check code formatting
bun format

# Format code
bun format:write
```

## Test Structure

```
linguamate/
├── __tests__/                    # Unit tests
│   ├── schemas.lesson.test.ts   # Schema validation tests
│   ├── lib.utils.test.ts        # Utility function tests
│   └── factories.test.ts        # Factory tests
├── tests/
│   ├── config/                  # Test configuration
│   │   ├── jest.setup.ts        # Jest setup file
│   │   ├── styleMock.js         # CSS module mock
│   │   └── fileMock.js          # Asset mock
│   ├── e2e/                     # E2E tests
│   │   ├── smoke.spec.ts        # Smoke tests
│   │   ├── navigation.spec.ts   # Navigation tests
│   │   └── auth.spec.ts         # Auth flow tests
│   ├── factories/               # Test data factories
│   │   ├── lesson.ts            # Lesson factory
│   │   ├── user.ts              # User factory
│   │   └── index.ts             # Factory exports
│   ├── msw/                     # API mocking
│   │   ├── handlers.ts          # MSW request handlers
│   │   ├── server.ts            # MSW server (Node)
│   │   └── browser.ts           # MSW worker (Browser)
│   └── utils/                   # Test utilities
│       ├── render.tsx           # Custom render with providers
│       ├── trpcLocal.ts         # tRPC testing utilities
│       └── index.ts             # Utility exports
├── jest.config.ts               # Jest configuration
├── playwright.config.ts         # Playwright configuration
├── commitlint.config.cjs        # Commitlint configuration
├── .lintstagedrc.json          # lint-staged configuration
├── .prettierrc                  # Prettier configuration
└── .prettierignore             # Prettier ignore patterns
```

## Writing Tests

### Unit Test Example

```typescript
// __tests__/lib.utils.test.ts
import { textUtils } from '@/lib/utils';

describe('textUtils', () => {
  it('should capitalize strings', () => {
    expect(textUtils.capitalize('hello')).toBe('Hello');
  });

  it('should truncate long strings', () => {
    expect(textUtils.truncate('Hello World', 8)).toBe('Hello...');
  });
});
```

### Component Test Example

```typescript
// __tests__/components.LessonCard.test.tsx
import { render, screen, fireEvent } from '@/tests/utils/render';
import LessonCard from '@/components/LessonCard';
import { makeLesson } from '@/tests/factories';

describe('LessonCard', () => {
  it('should render lesson title', () => {
    const lesson = makeLesson({ title: 'Test Lesson' });
    render(<LessonCard lesson={lesson} />);
    
    expect(screen.getByText('Test Lesson')).toBeTruthy();
  });

  it('should call onStart when button is clicked', () => {
    const lesson = makeLesson();
    const onStart = jest.fn();
    
    render(<LessonCard lesson={lesson} onStart={onStart} />);
    fireEvent.press(screen.getByText('Start'));
    
    expect(onStart).toHaveBeenCalledWith(lesson.id);
  });
});
```

### E2E Test Example

```typescript
// tests/e2e/lessons.spec.ts
import { test, expect } from '@playwright/test';

test('should display lessons list', async ({ page }) => {
  await page.goto('/lessons');
  
  await expect(page.getByTestId('lessons-list')).toBeVisible();
  await expect(page.getByText('Punjabi Basics')).toBeVisible();
});

test('should start a lesson', async ({ page }) => {
  await page.goto('/lessons');
  
  await page.getByTestId('lesson-card-1').click();
  await page.getByTestId('lesson-start-button').click();
  
  await expect(page).toHaveURL(/.*learn/);
});
```

## Using Test Factories

Test factories help create consistent test data:

```typescript
import { makeLesson, makeUser, makeLessonList } from '@/tests/factories';

// Create a single lesson with defaults
const lesson = makeLesson();

// Create a lesson with custom properties
const customLesson = makeLesson({
  title: 'Advanced Punjabi',
  level: 'B2',
  xpReward: 50,
});

// Create multiple lessons
const lessons = makeLessonList(10);

// Create a user
const user = makeUser({
  email: 'test@example.com',
  name: 'Test User',
});
```

## API Mocking with MSW

MSW (Mock Service Worker) intercepts API requests:

```typescript
// tests/msw/handlers.ts
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/lessons', () => {
    return HttpResponse.json([
      { id: '1', title: 'Lesson 1' },
      { id: '2', title: 'Lesson 2' },
    ]);
  }),
  
  http.post('/api/auth/login', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      user: { id: '1', email: body.email },
      token: 'mock-token',
    });
  }),
];
```

MSW is automatically set up in `tests/config/jest.setup.ts`.

## CI/CD Integration

### GitHub Actions Workflow

The CI pipeline runs on every PR and push to main:

1. **Install** - Install and cache dependencies
2. **Type Check** - Run TypeScript compiler
3. **Lint** - Run ESLint and Prettier
4. **Test** - Run Jest with coverage
5. **E2E** - Run Playwright tests
6. **Build** - Build web app

### PR Requirements

All checks must pass before merging:
- ✅ Type checking passes
- ✅ Linting passes
- ✅ All tests pass
- ✅ Coverage thresholds met
- ✅ E2E tests pass
- ✅ Build succeeds

### Coverage Thresholds

PRs will fail if coverage drops below:
- **Global**: 85% lines, 80% functions, 70% branches
- **Schemas**: 95% lines, 90% branches
- **State**: 85% lines, 75% branches

## Debugging Tests

### Debugging Jest Tests

```bash
# Run tests with Node debugger
node --inspect-brk node_modules/.bin/jest --runInBand

# Then open chrome://inspect in Chrome
```

### Debugging Playwright Tests

```bash
# Run in debug mode (opens inspector)
bun e2e:debug

# Run with headed browser
bun e2e --headed

# Run with slow motion
bun e2e --slow-mo=1000
```

### Debugging in VS Code

Add to `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Jest: Current File",
      "program": "${workspaceFolder}/node_modules/.bin/jest",
      "args": ["${fileBasename}", "--runInBand"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

## Troubleshooting

### Tests Failing Locally

1. Clear Jest cache: `bun test --clearCache`
2. Delete `node_modules` and reinstall: `rm -rf node_modules && bun install`
3. Check for outdated snapshots: `bun test -u`

### E2E Tests Failing

1. Ensure web server is running: `bun web`
2. Clear Playwright cache: `bunx playwright install --force`
3. Check browser compatibility: `bunx playwright install --with-deps`

### Coverage Not Meeting Thresholds

1. Run coverage report: `bun test --coverage`
2. Open coverage report: `open coverage/lcov-report/index.html`
3. Identify uncovered lines and add tests

### Git Hooks Not Running

1. Reinstall Husky: `bun run prepare`
2. Check hook permissions: `chmod +x .husky/*`
3. Verify Git version: `git --version` (should be 2.9+)

## Best Practices

1. **Write tests first** (TDD) when fixing bugs
2. **Keep tests focused** - one assertion per test when possible
3. **Use descriptive test names** - explain what is being tested
4. **Avoid test interdependence** - each test should be independent
5. **Mock external dependencies** - use MSW for API calls
6. **Use factories** - for consistent test data
7. **Test user behavior** - not implementation details
8. **Keep tests fast** - unit tests should run in milliseconds

## Resources

- [Testing Strategy](./TESTING_STRATEGY.md) - Comprehensive testing strategy
- [TestID Conventions](./TESTID_CONVENTIONS.md) - TestID naming conventions
- [Package.json Scripts](./PACKAGE_JSON_SCRIPTS.md) - Script documentation
- [Jest Documentation](https://jestjs.io/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library](https://testing-library.com/)
- [MSW Documentation](https://mswjs.io/)

## Support

For questions or issues with the testing setup:

1. Check existing documentation in `/docs`
2. Review test examples in `__tests__/` and `tests/`
3. Ask in the team Slack channel
4. Create an issue in the repository

---

**Last Updated**: 2025-01-02

**Maintained By**: QA Team (@linguamate/qa-team)
