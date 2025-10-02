# Testing & CI Infrastructure - Implementation Guide

## 🎉 What Was Built

A complete, production-ready testing infrastructure for Linguamate including:

- ✅ **Jest** - Unit & integration testing with coverage thresholds
- ✅ **Playwright** - E2E testing for web
- ✅ **MSW** - API mocking for isolated tests
- ✅ **React Testing Library** - Component testing
- ✅ **GitHub Actions** - Automated CI/CD pipeline
- ✅ **Husky** - Git hooks for code quality
- ✅ **32 Seed Tests** - Ready to run

## 🚀 Quick Start

### 1. Install Dependencies

The testing dependencies are already in `package.json`. You need to add these scripts:

```json
{
  "scripts": {
    "web": "expo start --web",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "format": "prettier --check .",
    "format:write": "prettier --write .",
    "test": "jest --coverage",
    "test:watch": "jest --watch",
    "test:ci": "jest --ci --runInBand --coverage",
    "e2e": "playwright test",
    "e2e:report": "playwright show-report",
    "build:web": "expo export --platform web",
    "prepare": "husky install"
  }
}
```

### 2. Initialize Git Hooks

```bash
bun run prepare
```

### 3. Install Playwright Browsers

```bash
bunx playwright install --with-deps
```

### 4. Run Tests

```bash
# Unit tests
bun test

# E2E tests
bun e2e
```

## 📁 What Was Created

### Configuration Files
- `jest.config.ts` - Jest configuration with coverage thresholds
- `playwright.config.ts` - Playwright E2E configuration
- `commitlint.config.cjs` - Commit message validation

### Test Infrastructure
```
tests/
├── config/
│   ├── jest.setup.ts       # Jest setup with MSW
│   ├── styleMock.js        # CSS mock
│   └── fileMock.js         # Asset mock
├── e2e/
│   ├── smoke.spec.ts       # Basic smoke tests
│   ├── navigation.spec.ts  # Navigation tests
│   └── auth.spec.ts        # Auth page tests
├── factories/
│   ├── lesson.ts           # Lesson test data
│   ├── user.ts             # User test data
│   └── index.ts
├── msw/
│   ├── handlers.ts         # API mock handlers
│   ├── server.ts           # Node MSW server
│   └── browser.ts          # Browser MSW worker
└── utils/
    ├── render.tsx          # React Testing Library wrapper
    ├── trpcLocal.ts        # tRPC testing utilities
    └── index.ts
```

### Seed Tests
```
__tests__/
├── schemas.lesson.test.ts  # Schema validation (9 tests)
├── factories.test.ts       # Factory functions (8 tests)
└── lib.utils.test.ts       # Utility functions (10 tests)
```

### CI/CD
- `.github/workflows/ci.yml` - Updated with test jobs
- `.github/PULL_REQUEST_TEMPLATE.md` - PR template
- `.github/CODEOWNERS` - Code ownership
- `.github/release-please.yml` - Automated releases

### Documentation
- `docs/TESTING_STRATEGY.md` - Testing approach
- `docs/TESTING_SETUP.md` - Detailed setup guide
- `docs/TESTING_IMPLEMENTATION_SUMMARY.md` - What was built
- `TESTING_QUICK_START.md` - Quick reference
- `TESTING_CHECKLIST.md` - Implementation checklist

## 📊 Coverage Thresholds

```typescript
{
  global: {
    branches: 70,
    functions: 80,
    lines: 85,
    statements: 85
  },
  schemas: {
    branches: 90,
    functions: 95,
    lines: 95,
    statements: 95
  },
  state: {
    branches: 75,
    functions: 85,
    lines: 85,
    statements: 85
  }
}
```

## 🎯 Test Count

- **Unit Tests**: 27 tests
- **E2E Tests**: 5 tests
- **Total**: 32 tests

## 🔧 Available Commands

### Testing
```bash
bun test              # Run all tests with coverage
bun test:watch        # Watch mode for development
bun test:ci           # CI mode (no watch, with coverage)
bun e2e               # Run E2E tests
bun e2e:report        # View E2E test report
```

### Code Quality
```bash
bun typecheck         # TypeScript type checking
bun lint              # Run ESLint
bun format            # Check Prettier formatting
bun format:write      # Fix Prettier formatting
```

### Building
```bash
bun build:web         # Build web bundle
bun web               # Start web dev server
```

## 🔄 CI/CD Pipeline

The GitHub Actions workflow runs on every PR and push to `main`/`develop`:

1. **Install** - Cache and install dependencies
2. **Typecheck** - Verify TypeScript types
3. **Lint** - Check code quality
4. **Test** - Run unit tests with coverage
5. **E2E** - Run Playwright tests
6. **Build** - Verify web build succeeds

All jobs must pass for PR to be mergeable.

## 🎨 Git Hooks

### Pre-commit
Runs `lint-staged` on staged files:
- ESLint with auto-fix
- Prettier with auto-format

### Commit-msg
Validates commit messages follow Conventional Commits:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `test:` - Tests
- `refactor:` - Code refactoring
- `chore:` - Maintenance

## 📝 Writing Tests

### Unit Test Example
```typescript
import { makeLesson } from '../tests/factories';

test('creates lesson with defaults', () => {
  const lesson = makeLesson();
  expect(lesson.language).toBe('pa');
  expect(lesson.xpReward).toBe(10);
});
```

### Component Test Example
```typescript
import { renderWithProviders, screen } from '../tests/utils';
import { MyComponent } from '@components/MyComponent';

test('renders correctly', () => {
  renderWithProviders(<MyComponent />);
  expect(screen.getByText('Hello')).toBeInTheDocument();
});
```

### E2E Test Example
```typescript
import { test, expect } from '@playwright/test';

test('navigates to lessons', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: /lessons/i }).click();
  await expect(page).toHaveURL(/.*lessons/);
});
```

## 🛠️ Troubleshooting

### Tests Failing
```bash
# Clear Jest cache
bun test -- --clearCache

# Reinstall dependencies
rm -rf node_modules bun.lock
bun install
```

### E2E Tests Failing
```bash
# Reinstall Playwright
bunx playwright install --with-deps

# Check web server
bun web
```

### Coverage Not Met
```bash
# View detailed report
bun test -- --coverage
open coverage/lcov-report/index.html
```

## 📚 Documentation

- **[Testing Strategy](./docs/TESTING_STRATEGY.md)** - Overall approach
- **[Testing Setup](./docs/TESTING_SETUP.md)** - Detailed guide
- **[Quick Start](./TESTING_QUICK_START.md)** - Get started fast
- **[Checklist](./TESTING_CHECKLIST.md)** - Implementation status

## ✅ Next Steps

1. **Add scripts to package.json** (see Quick Start section)
2. **Run `bun run prepare`** to initialize Husky
3. **Run `bunx playwright install --with-deps`**
4. **Run `bun test`** to verify unit tests
5. **Run `bun e2e`** to verify E2E tests
6. **Create a test PR** to verify CI pipeline
7. **Start adding tests** for existing features

## 🎓 Best Practices

- ✅ Write tests for new features
- ✅ Use factories for test data
- ✅ Mock external dependencies
- ✅ Keep tests fast and isolated
- ✅ Follow AAA pattern (Arrange, Act, Assert)
- ✅ Use descriptive test names
- ✅ Test behavior, not implementation

## 🆘 Support

- Check documentation in `docs/` folder
- Review existing tests in `__tests__/`
- Look at test utilities in `tests/utils/`
- Use factories in `tests/factories/`

---

**Status**: ✅ Implementation Complete

All files created, configurations in place, and seed tests ready to run. Just add the scripts to `package.json` and you're ready to go!
