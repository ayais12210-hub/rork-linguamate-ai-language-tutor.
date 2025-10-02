# Testing Implementation Checklist

Use this checklist to verify the testing infrastructure is properly set up and working.

## ✅ Installation & Setup

- [x] All testing dependencies installed
- [x] Jest configuration created (`jest.config.ts`)
- [x] Playwright configuration created (`playwright.config.ts`)
- [x] Git hooks configured (`.husky/`)
- [x] Prettier and ESLint configured
- [x] Commitlint configured
- [ ] **ACTION REQUIRED**: Add scripts to `package.json` (see `docs/PACKAGE_JSON_SCRIPTS.md`)
- [ ] **ACTION REQUIRED**: Run `bun run prepare` to initialize Husky

## ✅ Test Infrastructure

- [x] Jest setup file created (`tests/config/jest.setup.ts`)
- [x] MSW handlers created (`tests/msw/`)
- [x] Test utilities created (`tests/utils/`)
- [x] Test factories created (`tests/factories/`)
- [x] Sample unit tests created (`__tests__/`)
- [x] Sample E2E tests created (`tests/e2e/`)

## ✅ CI/CD

- [x] GitHub Actions workflow updated (`.github/workflows/ci.yml`)
- [x] PR template created (`.github/PULL_REQUEST_TEMPLATE.md`)
- [x] CODEOWNERS file created (`.github/CODEOWNERS`)
- [x] Release automation configured (`.github/release-please.yml`)
- [x] CHANGELOG.md created

## ✅ Documentation

- [x] Testing strategy documented (`docs/TESTING_STRATEGY.md`)
- [x] Setup guide created (`docs/TESTING_SETUP.md`)
- [x] TestID conventions documented (`docs/TESTID_CONVENTIONS.md`)
- [x] Script documentation created (`docs/PACKAGE_JSON_SCRIPTS.md`)
- [x] Implementation summary created (`docs/TESTING_IMPLEMENTATION_SUMMARY.md`)
- [x] Quick start guide created (`TESTING_QUICK_START.md`)
- [x] This checklist created (`TESTING_CHECKLIST.md`)

## 🔧 Manual Actions Required

### 1. Update package.json

Copy the scripts from `docs/PACKAGE_JSON_SCRIPTS.md` into your `package.json` file.

**Location**: Root `package.json` → `"scripts"` section

**Scripts to add**:
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

### 2. Initialize Husky

Run this command to set up git hooks:

```bash
bun run prepare
```

This will:
- Install Husky git hooks
- Enable pre-commit linting
- Enable commit message validation

### 3. Verify Installation

Run these commands to verify everything works:

```bash
# Type checking
bun typecheck

# Linting
bun lint

# Unit tests
bun test

# E2E tests (requires web server)
bun e2e
```

## ✅ Verification Tests

Run these commands and check that they pass:

### Type Checking
```bash
bun typecheck
```
**Expected**: No TypeScript errors

### Linting
```bash
bun lint
```
**Expected**: No ESLint errors (or only existing ones)

### Unit Tests
```bash
bun test
```
**Expected**: All tests pass, coverage report generated

### E2E Tests
```bash
bun e2e
```
**Expected**: All E2E tests pass (may need to start web server first)

### Git Hooks
```bash
# Try making a commit with invalid message
git commit -m "invalid commit message"
```
**Expected**: Commit should be rejected by commitlint

```bash
# Try committing with valid message
git commit -m "test: verify git hooks"
```
**Expected**: Pre-commit hook runs lint-staged

## 📋 Optional Enhancements

These are optional but recommended:

- [ ] Add testIDs to critical UI components (see `docs/TESTID_CONVENTIONS.md`)
- [ ] Write additional unit tests for your features
- [ ] Write E2E tests for critical user flows
- [ ] Set up code coverage badges
- [ ] Configure VS Code debugging (see `docs/TESTING_SETUP.md`)
- [ ] Update CODEOWNERS with your team structure
- [ ] Customize PR template for your workflow

## 🎯 Success Criteria

Your testing infrastructure is ready when:

- ✅ All verification tests pass
- ✅ Git hooks are working (pre-commit, commit-msg)
- ✅ CI pipeline passes on GitHub
- ✅ Coverage thresholds are met
- ✅ Team can run tests locally
- ✅ Documentation is accessible

## 📚 Next Steps

1. **Read the documentation**
   - Start with `TESTING_QUICK_START.md`
   - Review `docs/TESTING_STRATEGY.md` for best practices

2. **Write your first test**
   - Use test factories from `tests/factories/`
   - Follow examples in `__tests__/`

3. **Add testIDs to components**
   - Follow conventions in `docs/TESTID_CONVENTIONS.md`
   - Start with critical user flows

4. **Monitor coverage**
   - Run `bun test --coverage`
   - Open `coverage/lcov-report/index.html`

5. **Integrate with your workflow**
   - Make testing part of your development process
   - Write tests for new features
   - Fix failing tests immediately

## 🐛 Common Issues

### Issue: "Cannot find module '@/...'"
**Solution**: Check `tsconfig.json` has correct path mappings

### Issue: "Git hooks not running"
**Solution**: Run `bun run prepare` and `chmod +x .husky/*`

### Issue: "Tests failing in CI but passing locally"
**Solution**: Run `bun test:ci` locally to reproduce

### Issue: "Coverage below threshold"
**Solution**: Run `bun test --coverage` and check HTML report

### Issue: "E2E tests timing out"
**Solution**: Increase timeout in `playwright.config.ts`

## 📞 Getting Help

1. Check documentation in `/docs`
2. Review test examples in `__tests__/` and `tests/`
3. Search for similar issues in the repository
4. Ask in team Slack channel
5. Create an issue with detailed error information

## 🎉 Completion

Once all items are checked and verification tests pass, your testing infrastructure is fully operational!

---

**Status**: 🟡 Pending Manual Actions

**Required Actions**: 
1. Update package.json with scripts
2. Run `bun run prepare`
3. Verify all tests pass

**Estimated Time**: 5-10 minutes

---

**Last Updated**: 2025-01-02
