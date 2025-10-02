# Package.json Scripts Documentation

## Development Scripts

### `npm run dev` or `npm start`
Starts the Expo development server with tunnel mode enabled.
```bash
npm start
```
- Opens Metro bundler
- Provides QR code for Expo Go
- Enables hot reload
- Tunnel mode for remote testing

### `npm run web`
Starts the Expo web development server.
```bash
npm run web
```
- Runs app in browser
- Hot reload enabled
- Useful for rapid UI iteration

### `npm run web:dev`
Starts web server with debug logging.
```bash
npm run web:dev
```
- Same as `web` but with verbose Expo logs
- Useful for debugging build issues

## Quality Assurance Scripts

### `npm run typecheck`
Runs TypeScript compiler in check mode (no emit).
```bash
npm run typecheck
```
- Validates all TypeScript types
- Checks for type errors
- No output files generated
- **Required to pass before merge**

### `npm run lint`
Runs ESLint on the codebase.
```bash
npm run lint
```
- Checks code style
- Identifies potential bugs
- Enforces conventions
- **Required to pass before merge**

### `npm run lint:fix`
Runs ESLint with auto-fix.
```bash
npm run lint:fix
```
- Automatically fixes fixable issues
- Useful before committing

### `npm run format`
Checks code formatting with Prettier.
```bash
npm run format
```
- Validates formatting
- Does not modify files
- Used in CI

### `npm run format:write`
Formats code with Prettier.
```bash
npm run format:write
```
- Automatically formats all files
- Useful before committing

## Testing Scripts

### `npm test`
Runs Jest test suite with coverage.
```bash
npm test
```
- Runs all unit and integration tests
- Generates coverage report
- Enforces coverage thresholds
- **Required to pass before merge**

### `npm run test:watch`
Runs Jest in watch mode.
```bash
npm run test:watch
```
- Re-runs tests on file changes
- Useful during development
- Interactive mode

### `npm run test:unit`
Runs only unit tests.
```bash
npm run test:unit
```
- Faster than full test suite
- Tests pure logic functions

### `npm run test:integration`
Runs only integration tests.
```bash
npm run test:integration
```
- Tests React Query hooks
- Tests tRPC integration
- Uses MSW for mocking

### `npm run e2e`
Runs Playwright end-to-end tests (web only).
```bash
npm run e2e
```
- Tests full user flows
- Runs against local dev server
- **Required to pass before merge**

### `npm run e2e:ui`
Opens Playwright UI mode.
```bash
npm run e2e:ui
```
- Interactive test runner
- Useful for debugging E2E tests
- Shows browser actions

### `npm run e2e:report`
Opens Playwright HTML report.
```bash
npm run e2e:report
```
- Shows test results
- Includes screenshots/videos
- Useful after CI failures

## Build Scripts

### `npm run build:web`
Builds static web bundle.
```bash
npm run build:web
```
- Exports to `dist/` folder
- Production-optimized
- Ready for deployment
- **Required to pass before merge**

### `npm run build:analyze`
Builds web bundle with bundle analyzer.
```bash
npm run build:analyze
```
- Shows bundle size breakdown
- Identifies large dependencies
- Useful for optimization

## Maintenance Scripts

### `npm run clean`
Cleans build artifacts and caches.
```bash
npm run clean
```
- Removes `node_modules/.cache`
- Removes `.expo` folder
- Removes `dist/` folder
- Useful when troubleshooting

### `npm run clean:install`
Clean install of dependencies.
```bash
npm run clean:install
```
- Removes `node_modules`
- Removes lock file
- Fresh install
- Useful for dependency issues

### `npm run prepare`
Installs Husky git hooks.
```bash
npm run prepare
```
- Runs automatically after `npm install`
- Sets up pre-commit hooks
- Sets up commit-msg hooks

## Git Hooks (via Husky)

### Pre-commit
Runs automatically before each commit.
- Runs `lint-staged` on staged files
- Runs ESLint with auto-fix
- Runs Prettier with auto-format
- Blocks commit if errors

### Commit-msg
Runs automatically on commit message.
- Validates commit message format
- Enforces Conventional Commits
- Blocks commit if invalid format

## CI/CD Scripts

### `npm run ci:typecheck`
Typecheck for CI (same as `typecheck`).
```bash
npm run ci:typecheck
```

### `npm run ci:lint`
Lint for CI (fails on warnings).
```bash
npm run ci:lint
```

### `npm run ci:test`
Test for CI (with coverage upload).
```bash
npm run ci:test
```
- Runs in CI mode
- Generates coverage report
- Uploads to coverage service

### `npm run ci:e2e`
E2E tests for CI.
```bash
npm run ci:e2e
```
- Runs headless
- Generates artifacts on failure

### `npm run ci:build`
Build for CI (with validation).
```bash
npm run ci:build
```
- Builds web bundle
- Validates output
- Uploads artifacts

## Workflow Examples

### Before Committing
```bash
npm run typecheck
npm run lint:fix
npm run format:write
npm test
git add .
git commit -m "feat: add new feature"
```

### Before Creating PR
```bash
npm run typecheck
npm run lint
npm run format
npm test
npm run e2e
npm run build:web
```

### Debugging Test Failures
```bash
npm run test:watch
# Make changes
# Tests re-run automatically
```

### Debugging E2E Failures
```bash
npm run e2e:ui
# Click on failed test
# Step through actions
# Inspect DOM
```

### Optimizing Bundle Size
```bash
npm run build:analyze
# Review large dependencies
# Consider alternatives or lazy loading
```

## Script Composition

Many scripts can be chained:

```bash
# Run all quality checks
npm run typecheck && npm run lint && npm test

# Full CI simulation
npm run typecheck && npm run lint && npm run format && npm test && npm run e2e && npm run build:web

# Clean slate
npm run clean && npm install && npm test
```

## Environment Variables

Some scripts respect environment variables:

```bash
# Run tests with coverage
CI=true npm test

# Run E2E in headed mode
HEADED=true npm run e2e

# Build with source maps
GENERATE_SOURCEMAP=true npm run build:web

# Increase Node memory
NODE_OPTIONS=--max_old_space_size=4096 npm run build:web
```

## Troubleshooting

### "Out of memory" errors
```bash
NODE_OPTIONS=--max_old_space_size=4096 npm run <script>
```

### "Port already in use"
```bash
# Kill process on port 8081
npx kill-port 8081
npm start
```

### "Module not found" errors
```bash
npm run clean:install
```

### "Type errors after update"
```bash
rm -rf node_modules/.cache
npm run typecheck
```

### "Tests failing after merge"
```bash
npm run clean
npm install
npm test
```

## Adding New Scripts

When adding new scripts to `package.json`:

1. **Use descriptive names**: `test:unit` not `tu`
2. **Group by category**: dev, qa, test, build, ci
3. **Document in this file**: Add section above
4. **Consider cross-platform**: Use `cross-env` for env vars
5. **Chain with `&&`**: For sequential execution
6. **Use `--` for args**: `npm test -- --watch`

Example:
```json
{
  "scripts": {
    "test:unit": "jest --testPathPattern=unit",
    "test:integration": "jest --testPathPattern=integration",
    "test:all": "npm run test:unit && npm run test:integration"
  }
}
```

## Performance Tips

- **Use `--` for args**: `npm test -- --watch` (faster than separate script)
- **Cache dependencies**: CI should cache `node_modules`
- **Parallel execution**: Use `npm-run-all -p` for parallel scripts
- **Skip unnecessary steps**: Use `--no-verify` to skip hooks (use sparingly)

## Summary

| Script | Purpose | Required for PR |
|--------|---------|-----------------|
| `typecheck` | Validate types | ✅ Yes |
| `lint` | Check code style | ✅ Yes |
| `format` | Check formatting | ✅ Yes |
| `test` | Run tests | ✅ Yes |
| `e2e` | Run E2E tests | ✅ Yes |
| `build:web` | Build web bundle | ✅ Yes |
| `start` | Dev server | ❌ No |
| `test:watch` | Watch mode | ❌ No |
| `e2e:ui` | E2E UI mode | ❌ No |
