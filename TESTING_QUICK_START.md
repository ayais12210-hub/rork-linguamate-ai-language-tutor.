# Testing Quick Start Guide

> **TL;DR**: Complete testing infrastructure is ready. Follow these 3 steps to get started.

## 🚀 Quick Setup (3 Steps)

### Step 1: Update package.json

Add these scripts to your `package.json`:

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

### Step 2: Initialize Git Hooks

```bash
bun run prepare
```

### Step 3: Run Tests

```bash
# Run all tests
bun test

# Run E2E tests
bun e2e
```

## ✅ What's Included

- ✅ Jest for unit/integration tests
- ✅ Playwright for E2E tests
- ✅ MSW for API mocking
- ✅ Test factories for data generation
- ✅ Git hooks (pre-commit linting, commit validation)
- ✅ CI/CD pipeline with test gates
- ✅ Coverage thresholds (85% lines, 80% functions)
- ✅ Sample tests to get started

## 📝 Common Commands

```bash
# Testing
bun test              # Run unit tests
bun test:watch        # Watch mode
bun e2e               # E2E tests
bun e2e:ui            # E2E with UI

# Code Quality
bun typecheck         # Type check
bun lint              # Lint code
bun format            # Check formatting

# Development
bun dev               # Start dev server
bun web               # Start web server
```

## 📚 Full Documentation

- **[TESTING_IMPLEMENTATION_SUMMARY.md](docs/TESTING_IMPLEMENTATION_SUMMARY.md)** - Complete overview
- **[TESTING_SETUP.md](docs/TESTING_SETUP.md)** - Detailed setup guide
- **[TESTING_STRATEGY.md](docs/TESTING_STRATEGY.md)** - Testing strategy and best practices
- **[TESTID_CONVENTIONS.md](docs/TESTID_CONVENTIONS.md)** - TestID naming conventions

## 🎯 Coverage Targets

- **Lines**: 85%
- **Functions**: 80%
- **Branches**: 70%

## 🔧 File Structure

```
linguamate/
├── __tests__/           # Unit tests
├── tests/
│   ├── e2e/            # E2E tests
│   ├── factories/      # Test data
│   ├── msw/            # API mocks
│   └── utils/          # Test utilities
├── jest.config.ts      # Jest config
└── playwright.config.ts # Playwright config
```

## 💡 Writing Your First Test

### Unit Test

```typescript
// __tests__/myFeature.test.ts
import { myFunction } from '@/lib/myFeature';

describe('myFunction', () => {
  it('should do something', () => {
    expect(myFunction('input')).toBe('expected output');
  });
});
```

### E2E Test

```typescript
// tests/e2e/myFeature.spec.ts
import { test, expect } from '@playwright/test';

test('should navigate to feature', async ({ page }) => {
  await page.goto('/');
  await page.getByText('My Feature').click();
  await expect(page).toHaveURL(/.*feature/);
});
```

## 🐛 Troubleshooting

### Tests not running?
```bash
bun test --clearCache
rm -rf node_modules && bun install
```

### Git hooks not working?
```bash
bun run prepare
chmod +x .husky/*
```

### E2E tests failing?
```bash
bunx playwright install --force
```

## 🎉 You're Ready!

Start writing tests and enjoy the confidence that comes with comprehensive test coverage!

---

**Need Help?** Check the full documentation in `/docs` or ask in the team Slack channel.
