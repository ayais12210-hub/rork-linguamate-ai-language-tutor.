# Package.json Scripts Update

Add these scripts to your `package.json` file:

```json
{
  "scripts": {
    "start": "bunx rork start -p vep9anbk6huqelg0fppmq --tunnel",
    "start-web": "bunx rork start -p vep9anbk6huqelg0fppmq --web --tunnel",
    "start-web-dev": "DEBUG=expo* bunx rork start -p vep9anbk6huqelg0fppmq --web --tunnel",
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

## Script Descriptions

### Development
- `start` - Start Expo dev server with tunnel
- `start-web` - Start Expo web dev server with tunnel
- `start-web-dev` - Start Expo web with debug logging
- `dev` - Start Expo dev server (local)
- `web` - Start Expo web dev server (local)

### Code Quality
- `typecheck` - Run TypeScript type checking
- `lint` - Run ESLint on TypeScript files
- `lint:fix` - Run ESLint and auto-fix issues
- `format` - Check code formatting with Prettier
- `format:write` - Format code with Prettier

### Testing
- `test` - Run Jest tests with coverage
- `test:watch` - Run Jest in watch mode
- `test:ci` - Run Jest in CI mode (no watch, sequential)
- `e2e` - Run Playwright E2E tests
- `e2e:ui` - Run Playwright with UI mode
- `e2e:report` - Show Playwright test report
- `e2e:debug` - Run Playwright in debug mode

### Build & Deploy
- `build:web` - Build web app for production

### Git Hooks
- `prepare` - Install Husky git hooks
- `lint-staged` - Run lint-staged (used by pre-commit hook)

## Usage Examples

```bash
# Run tests
bun test

# Run tests in watch mode
bun test:watch

# Run E2E tests
bun e2e

# Type check
bun typecheck

# Lint and format
bun lint
bun format

# Build for production
bun build:web
```
