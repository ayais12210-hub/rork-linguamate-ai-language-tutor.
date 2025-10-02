# Testing Quick Start Guide

## 🚀 Get Started in 3 Steps

### 1. Install Dependencies

```bash
bun install
```

### 2. Initialize Git Hooks

```bash
bun run prepare
```

### 3. Install Playwright Browsers

```bash
bunx playwright install --with-deps
```

## ✅ Verify Installation

```bash
# Run unit tests
bun test

# Run E2E tests
bun e2e
```

## 📝 Common Commands

### Testing

```bash
# Run all tests with coverage
bun test

# Watch mode for development
bun test:watch

# Run E2E tests
bun e2e

# View E2E report
bun e2e:report
```

### Code Quality

```bash
# Type check
bun typecheck

# Lint code
bun lint

# Check formatting
bun format

# Fix formatting
bun format:write
```

### Building

```bash
# Build web app
bun build:web

# Start web dev server
bun web
```

## 📚 Documentation

- **[Testing Strategy](./docs/TESTING_STRATEGY.md)** - Overall testing approach
- **[Testing Setup](./docs/TESTING_SETUP.md)** - Detailed setup guide
- **[Implementation Summary](./docs/TESTING_IMPLEMENTATION_SUMMARY.md)** - What was built
- **[TestID Conventions](./docs/TESTID_CONVENTIONS.md)** - UI testing standards

## 🎯 What's Included

### Test Infrastructure
- ✅ Jest for unit & integration tests
- ✅ Playwright for E2E tests
- ✅ MSW for API mocking
- ✅ React Testing Library
- ✅ Test utilities & factories

### CI/CD
- ✅ GitHub Actions workflow
- ✅ Automated testing on PRs
- ✅ Coverage enforcement
- ✅ Build verification

### Code Quality
- ✅ Husky git hooks
- ✅ Lint-staged pre-commit
- ✅ Commitlint for conventional commits
- ✅ ESLint + Prettier

### Seed Tests
- ✅ 27 unit tests
- ✅ 5 E2E tests
- ✅ Schema validation tests
- ✅ Factory tests
- ✅ Utility tests

## 🔍 Coverage Thresholds

- **Global**: 70% branches, 80% functions, 85% lines
- **Schemas**: 90% branches, 95% functions, 95% lines
- **State**: 75% branches, 85% functions, 85% lines

## 🛠️ Troubleshooting

### Tests failing?

```bash
# Clear Jest cache
bun test -- --clearCache

# Reinstall dependencies
rm -rf node_modules bun.lock
bun install
```

### E2E tests failing?

```bash
# Reinstall Playwright browsers
bunx playwright install --with-deps

# Check web server
bun web
```

### Coverage not meeting thresholds?

```bash
# View detailed coverage report
bun test -- --coverage
open coverage/lcov-report/index.html
```

## 📖 Writing Your First Test

### Unit Test

```typescript
// __tests__/myFeature.test.ts
describe('myFeature', () => {
  test('does something', () => {
    expect(true).toBe(true);
  });
});
```

### Component Test

```typescript
// __tests__/MyComponent.test.tsx
import { renderWithProviders, screen } from '../tests/utils';
import { MyComponent } from '@components/MyComponent';

test('renders correctly', () => {
  renderWithProviders(<MyComponent />);
  expect(screen.getByText('Hello')).toBeInTheDocument();
});
```

### E2E Test

```typescript
// tests/e2e/myFlow.spec.ts
import { test, expect } from '@playwright/test';

test('completes user flow', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Welcome')).toBeVisible();
});
```

## 🎓 Next Steps

1. **Read the docs** - Start with [Testing Strategy](./docs/TESTING_STRATEGY.md)
2. **Write tests** - Add tests for new features
3. **Increase coverage** - Aim for 85%+ coverage
4. **Monitor CI** - Check GitHub Actions for failures
5. **Follow conventions** - Use testIDs, factories, and best practices

## 💡 Tips

- Use `test:watch` during development
- Use factories for test data
- Mock external dependencies with MSW
- Keep tests fast and isolated
- Follow the AAA pattern (Arrange, Act, Assert)

## 🆘 Need Help?

- Check [Testing Setup](./docs/TESTING_SETUP.md) for detailed guides
- Review [Testing Strategy](./docs/TESTING_STRATEGY.md) for best practices
- Look at existing tests in `__tests__/` for examples

---

**Ready to test?** Run `bun test` and start building with confidence! 🚀
