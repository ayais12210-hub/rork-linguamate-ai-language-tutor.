# Package.json Scripts to Add

## ⚠️ IMPORTANT: Manual Action Required

The following scripts need to be manually added to your `package.json` file to complete the testing infrastructure setup.

## Scripts to Add

Open `package.json` and add these scripts to the `"scripts"` section:

```json
{
  "scripts": {
    "start": "bunx rork start -p vep9anbk6huqelg0fppmq --tunnel",
    "start-web": "bunx rork start -p vep9anbk6huqelg0fppmq --web --tunnel",
    "start-web-dev": "DEBUG=expo* bunx rork start -p vep9anbk6huqelg0fppmq --web --tunnel",
    "lint": "expo lint",
    
    // ADD THESE NEW SCRIPTS BELOW:
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

## Complete Scripts Section

Here's the complete `"scripts"` section with all scripts included:

```json
"scripts": {
  "start": "bunx rork start -p vep9anbk6huqelg0fppmq --tunnel",
  "start-web": "bunx rork start -p vep9anbk6huqelg0fppmq --web --tunnel",
  "start-web-dev": "DEBUG=expo* bunx rork start -p vep9anbk6huqelg0fppmq --web --tunnel",
  "lint": "expo lint",
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
```

## After Adding Scripts

Once you've added these scripts, run the following commands to complete setup:

```bash
# 1. Initialize Husky git hooks
bun run prepare

# 2. Install Playwright browsers
bunx playwright install --with-deps

# 3. Verify unit tests work
bun test

# 4. Verify E2E tests work
bun e2e

# 5. Check TypeScript
bun typecheck

# 6. Check formatting
bun format
```

## Script Descriptions

| Script | Description |
|--------|-------------|
| `web` | Start Expo web dev server without tunnel |
| `typecheck` | Run TypeScript type checking without emitting files |
| `format` | Check if files are formatted correctly with Prettier |
| `format:write` | Auto-format all files with Prettier |
| `test` | Run Jest unit tests with coverage report |
| `test:watch` | Run Jest in watch mode for development |
| `test:ci` | Run Jest in CI mode (no watch, with coverage) |
| `e2e` | Run Playwright end-to-end tests |
| `e2e:report` | Open Playwright HTML test report |
| `build:web` | Build production web bundle |
| `prepare` | Initialize Husky git hooks (runs automatically after install) |

## Why These Scripts Are Needed

1. **Testing Infrastructure**: The test scripts enable the complete testing setup documented in `README_TESTING.md`
2. **CI/CD Pipeline**: The `.github/workflows/ci.yml` file references these scripts
3. **Code Quality**: Git hooks (Husky) use these scripts for pre-commit checks
4. **Development Workflow**: Provides consistent commands across the team

## Troubleshooting

### If `bun run prepare` fails
```bash
# Manually create .husky directory
mkdir -p .husky
npx husky install
```

### If Playwright installation fails
```bash
# Try with npm instead
npx playwright install --with-deps
```

### If tests fail
```bash
# Clear Jest cache
bun test -- --clearCache

# Reinstall dependencies
rm -rf node_modules bun.lock
bun install
```

## Next Steps

After adding these scripts and running the setup commands:

1. ✅ Commit the changes
2. ✅ Push to trigger CI/CD pipeline
3. ✅ Verify GitHub Actions workflow passes
4. ✅ Start writing tests for new features

## Related Documentation

- `README_TESTING.md` - Complete testing guide
- `TESTING_QUICK_START.md` - Quick reference
- `docs/TESTING_SETUP.md` - Detailed setup instructions
- `docs/PACKAGE_JSON_SCRIPTS.md` - Script documentation

---

**Status**: ⚠️ Manual action required
**Priority**: HIGH - Required for testing infrastructure
**Estimated Time**: 2 minutes
