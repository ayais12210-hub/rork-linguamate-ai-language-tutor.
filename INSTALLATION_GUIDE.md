# Installation & Setup Guide

This guide walks you through enabling all reliability features in the Linguamate AI Tutor app.

---

## Prerequisites

- Node.js 20+
- npm or bun
- Expo CLI
- Git

---

## Step 1: Install Dependencies

### Required Dependencies

```bash
# Sentry for crash reporting
npm install @sentry/react-native sentry-expo

# Already installed (verify in package.json):
# - husky (pre-commit hooks)
# - lint-staged (staged file linting)
# - zod (schema validation)
# - @react-native-community/netinfo (network detection)
# - @tanstack/react-query (data fetching)
```

### Optional Dependencies (Recommended)

```bash
# ESLint plugins for security and code quality
npm install --save-dev eslint-plugin-security eslint-plugin-unicorn
```

After installing security/unicorn plugins, uncomment the relevant lines in `.eslintrc.cjs`:

```javascript
// Uncomment these lines:
extends: [
  // ...
  'plugin:security/recommended',
  'plugin:unicorn/recommended',
],
plugins: [
  // ...
  'security',
  'unicorn',
],
```

---

## Step 2: Configure Sentry

### 2.1 Create Sentry Account

1. Go to https://sentry.io
2. Create a new project for React Native
3. Copy your DSN (Data Source Name)

### 2.2 Add Environment Variable

Create or update `.env`:

```env
EXPO_PUBLIC_SENTRY_DSN=https://your-key@o123456.ingest.sentry.io/123456
```

### 2.3 Initialize Sentry in App

Update `app/_layout.tsx`:

```typescript
import { initializeSentry } from '@/lib/sentry';
import { useEffect } from 'react';

export default function RootLayout() {
  useEffect(() => {
    // Initialize Sentry
    initializeSentry({
      dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
      environment: __DEV__ ? 'development' : 'production',
      enableInExpoDevelopment: false, // Set to true to test in dev
      tracesSampleRate: 0.2, // Sample 20% of transactions
    });
  }, []);

  return (
    // ... rest of your app
  );
}
```

### 2.4 Add Sentry Secrets to GitHub (CI)

For automated Sentry releases in CI:

1. Go to GitHub repo → Settings → Secrets and variables → Actions
2. Add these secrets:
   - `SENTRY_AUTH_TOKEN`: Get from https://sentry.io/settings/account/api/auth-tokens/
   - `SENTRY_ORG`: Your Sentry organization slug
   - `SENTRY_PROJECT`: Your Sentry project slug

---

## Step 3: Initialize Feature Flags

Update `app/_layout.tsx`:

```typescript
import { FeatureFlagManager } from '@/lib/flags';
import { useEffect } from 'react';

export default function RootLayout() {
  useEffect(() => {
    // Initialize feature flags
    FeatureFlagManager.initialize().catch(console.error);
    
    // Initialize Sentry (from Step 2)
    initializeSentry({ ... });
  }, []);

  return (
    // ... rest of your app
  );
}
```

---

## Step 4: Setup Husky (Pre-commit Hooks)

```bash
# Install Husky hooks
npm run prepare

# Verify installation
ls -la .husky/pre-commit
# Should show executable file

# Test the hook (make a dummy change and commit)
git add .
git commit -m "test: verify pre-commit hook"
# Should run ESLint and Prettier
```

**What the pre-commit hook does:**
- Lints staged TypeScript/JavaScript files
- Formats staged files with Prettier
- Aborts commit if any errors found

---

## Step 5: Wrap App with Network Boundary

Update your main layout or screen:

```typescript
import NetworkBoundary from '@/components/NetworkBoundary';

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <NetworkBoundary
        showBanner={true}
        onNetworkChange={(isConnected) => {
          console.log('Network status:', isConnected);
        }}
      >
        {/* Your app content */}
        <Stack>
          <Stack.Screen name="index" />
          {/* ... other screens */}
        </Stack>
      </NetworkBoundary>
    </QueryClientProvider>
  );
}
```

---

## Step 6: Verify Installation

### 6.1 TypeScript

```bash
npm run typecheck
# Should complete with no errors
```

### 6.2 Linting

```bash
npm run lint
# Should complete with 0 warnings
```

### 6.3 Formatting

```bash
npm run format
# Should show all files are formatted
```

### 6.4 Tests

```bash
# Run all tests with coverage
npm run test:ci

# Run contract tests
npm run test:contracts

# Run regression tests
npm run test:regression
```

### 6.5 Pre-commit Hook

```bash
# Make a test change
echo "// test" >> lib/flags.ts

# Try to commit
git add lib/flags.ts
git commit -m "test: verify hook"

# Hook should run ESLint, Prettier, and abort if errors

# Revert test change
git checkout lib/flags.ts
```

---

## Step 7: Update Existing Code (Optional)

### 7.1 Replace Manual Async State with `useAsync`

**Before:**
```typescript
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);
const [data, setData] = useState(null);

const fetchData = async () => {
  setLoading(true);
  try {
    const result = await api.getData();
    setData(result);
  } catch (err) {
    setError(err);
  } finally {
    setLoading(false);
  }
};
```

**After:**
```typescript
import { useAsync } from '@/hooks/useAsync';

const { data, isLoading, error, execute } = useAsync(
  async () => await api.getData(),
  { executeOnMount: true }
);
```

### 7.2 Add Error Views

```typescript
import ErrorView from '@/components/ErrorView';

function MyScreen() {
  const { data, isLoading, error, retry } = useAsync(...);

  if (error) {
    return <ErrorView error={error} onRetry={retry} fullScreen />;
  }

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return <View>{/* Your content */}</View>;
}
```

### 7.3 Use Feature Flags

```typescript
import { useFeatureFlag } from '@/lib/flags';

function MyComponent() {
  const isOfflineEnabled = useFeatureFlag('offline_mode');

  return (
    <View>
      {isOfflineEnabled && <OfflineIndicator />}
      {/* rest of component */}
    </View>
  );
}
```

### 7.4 Add Retry Logic to Network Calls

```typescript
import { retry } from '@/scripts/retry';

// Simple retry:
const data = await retry(
  () => fetch('https://api.example.com/data'),
  { maxRetries: 3, baseDelayMs: 500 }
);

// Or create a wrapper:
import { createRetryWrapper } from '@/scripts/retry';

const fetchWithRetry = createRetryWrapper(fetch, {
  maxRetries: 3,
  baseDelayMs: 300,
  useJitter: true,
});

const response = await fetchWithRetry('https://api.example.com/data');
```

---

## Step 8: Configure GitHub Actions

No manual steps needed! The CI workflow (`.github/workflows/ci.yml`) is already configured.

**What it does:**
1. Installs dependencies (with caching)
2. Runs TypeScript type-check
3. Runs ESLint with zero warnings
4. Runs tests with coverage
5. Posts coverage comments on PRs
6. Builds web app
7. Creates Sentry release (if secrets are set)

---

## Step 9: Enable Dependabot (Auto-Updates)

No manual steps needed! The Dependabot config (`.github/dependabot.yml`) is already set up.

**What it does:**
- Weekly dependency updates (Mondays at 9am)
- Groups related packages (Expo, React, Testing, etc.)
- Ignores major version updates for critical packages
- Auto-labels PRs with `dependencies`

**To customize:**
- Edit `.github/dependabot.yml`
- Change schedule, groups, or ignore rules

---

## Step 10: Test Sentry Integration

### 10.1 Trigger a Test Error

Add a test button to any screen:

```typescript
import { captureSentryException } from '@/lib/sentry';

<Button
  title="Test Sentry"
  onPress={() => {
    try {
      throw new Error('Test error from Sentry integration');
    } catch (error) {
      captureSentryException(error as Error, {
        screen: 'TestScreen',
        action: 'test_button',
      });
    }
  }}
/>
```

### 10.2 Verify in Sentry Dashboard

1. Go to https://sentry.io
2. Navigate to your project
3. Check "Issues" tab
4. You should see "Test error from Sentry integration"

### 10.3 Test Breadcrumbs

```typescript
import { addSentryBreadcrumb } from '@/lib/sentry';

// Add breadcrumbs before error:
addSentryBreadcrumb('User logged in', 'auth', 'info', { userId: '123' });
addSentryBreadcrumb('Navigated to settings', 'navigation', 'info');

// Trigger error:
throw new Error('Test with breadcrumbs');

// In Sentry, you'll see the breadcrumb trail leading to the error
```

---

## Troubleshooting

### Husky hook not working

```bash
# Reinstall Husky
rm -rf .husky
npm run prepare

# Make hook executable
chmod +x .husky/pre-commit

# Verify
ls -la .husky/pre-commit
```

### TypeScript errors after strict mode

```typescript
// Before (error with noUncheckedIndexedAccess):
const user = users[0];

// After:
const user = users[0];
if (!user) {
  // Handle undefined case
  return;
}
```

### Sentry not capturing errors

1. Check DSN is set: `echo $EXPO_PUBLIC_SENTRY_DSN`
2. Enable in development:
   ```typescript
   initializeSentry({
     enableInExpoDevelopment: true, // Test in dev
   });
   ```
3. Check Sentry project settings allow this DSN
4. Verify initialization runs before error occurs

### Pre-commit hook too slow

Edit `.lintstagedrc.json` to only lint changed files:

```json
{
  "*.{ts,tsx}": [
    "eslint --fix --max-warnings=0"
  ]
}
```

### CI failing on coverage threshold

Update `jest.config.ts`:

```typescript
coverageThreshold: {
  global: {
    branches: 70, // Adjust as needed
    functions: 80,
    lines: 85,
    statements: 85
  }
}
```

---

## Next Steps

1. **Read `RELIABILITY_IMPLEMENTATION.md`** for detailed feature docs
2. **Set up Sentry alerts** for critical errors
3. **Configure feature flags** for your features
4. **Write contract tests** for your API schemas
5. **Add error boundaries** to all route components
6. **Test offline mode** on real devices

---

## Support

- **Sentry Docs**: https://docs.sentry.io/platforms/react-native/
- **Husky Docs**: https://typicode.github.io/husky/
- **Dependabot Docs**: https://docs.github.com/en/code-security/dependabot

---

**Installation complete!** 🎉

Your app now has:
- ✅ Comprehensive error handling
- ✅ Crash reporting with Sentry
- ✅ Automated dependency updates
- ✅ Pre-commit code quality checks
- ✅ Feature flag system
- ✅ Enhanced retry logic
- ✅ Offline UX
- ✅ Contract & regression tests
