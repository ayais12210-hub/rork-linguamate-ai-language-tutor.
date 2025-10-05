# Error Handling Architecture

This document describes the comprehensive error handling system implemented in the Linguamate AI Tutor application.

## Overview

The error handling system provides:

1. **Unified Error Types**: Consistent error categorization with `AppError` class
2. **Automatic Retries**: Exponential backoff with jitter for recoverable errors
3. **User-Friendly Messages**: Contextual error messages for users
4. **Observability**: Integrated logging and crash analytics with Sentry
5. **Offline Support**: Queue and retry mechanisms for network failures
6. **Type Safety**: Full TypeScript support with strict validation

## Error Architecture

### AppError Class

All errors in the application are normalized to the `AppError` class:

```typescript
type AppErrorKind = 'Network' | 'Auth' | 'Validation' | 'Server' | 'Unexpected';

class AppError extends Error {
  kind: AppErrorKind;
  code?: string;
  details?: unknown;
  requestId?: string;
  userMessage?: string;
  isRecoverable: boolean;
  errorId: string;
  timestamp: number;
}
```

### Error Normalization

The `toAppError()` function converts any error to `AppError`:

```typescript
try {
  await apiCall();
} catch (error) {
  const appError = toAppError(error);
  // Handle normalized error
}
```

### Error Categories

1. **Network**: Connection failures, timeouts, offline errors
2. **Auth**: Authentication/authorization failures
3. **Validation**: Input validation, schema mismatches
4. **Server**: 5xx errors, backend failures
5. **Unexpected**: Unknown errors, crashes

## HTTP Client

Enhanced HTTP client with built-in error handling:

```typescript
const client = new HttpClient({
  baseURL: 'https://api.example.com',
  timeout: 30000,
  retries: 3,
});

// With Zod validation
const userSchema = z.object({
  id: z.string(),
  name: z.string(),
});

const user = await client.get('/user/123', { schema: userSchema });
```

Features:
- Automatic retries for idempotent requests
- Timeout handling with AbortController
- Response validation with Zod
- Request ID tracking
- Offline detection and queuing

## React Integration

### Error Boundaries

Global and route-level error boundaries:

```typescript
<ErrorBoundary fallback={CustomErrorView}>
  <App />
</ErrorBoundary>
```

### useAsync Hook

Standardized async state management:

```typescript
const { state, execute, retry } = useAsync(async (userId: string) => {
  return await api.getUser(userId);
}, {
  onSuccess: (user) => console.log('User loaded:', user),
  onError: (error) => console.error('Failed:', error),
  retryCount: 2,
});

// State shape:
// - status: 'idle' | 'loading' | 'success' | 'error'
// - data: T | undefined
// - error: AppError | undefined
// - isLoading, isError, isSuccess: boolean
```

### Error UI Components

```typescript
// Full error view with retry
<ErrorView 
  error={error} 
  onRetry={handleRetry}
  showDetails={__DEV__}
/>

// Network boundary wrapper
<NetworkBoundary>
  <YourComponent />
</NetworkBoundary>
```

## Retry Mechanism

Exponential backoff with full jitter:

```typescript
await retry(
  () => apiCall(),
  {
    maxRetries: 5,
    baseDelay: 300,
    maxDelay: 30000,
    factor: 2,
    jitter: true,
    retryCondition: (error) => {
      // Only retry network errors
      return error instanceof AppError && error.kind === 'Network';
    },
  }
);
```

## Logging & Monitoring

### Logger

Structured logging with environment-based routing:

```typescript
import { logger } from '@/lib/log';

logger.info('UserAction', 'User logged in', { userId: '123' });
logger.error('APIError', 'Failed to fetch data', { endpoint: '/api/data' }, error);
```

### Sentry Integration

Automatic crash reporting in production:

```typescript
// Initialization (handled automatically)
logger.initSentry(Sentry, SENTRY_DSN, environment);

// Manual event capture
logger.captureEvent('Custom event', 'warning', { customData: 123 });
```

Features:
- Automatic PII sanitization
- Source map upload in CI
- Release tracking
- Performance monitoring

## Feature Flags

Safe feature rollouts with flags:

```typescript
// Check flag
if (featureFlags.isEnabled('error_handling_v1')) {
  // New error handling logic
}

// React hook
const isEnabled = useFeatureFlag('new_feature');

// HOC
const EnhancedComponent = withFeatureFlag('new_feature')(Component);
```

## Testing

### Contract Tests

API validation with Zod schemas:

```typescript
describe('User API', () => {
  it('should validate login response', () => {
    const response = {
      user: { id: '123', email: 'test@example.com' },
      accessToken: 'token',
    };
    
    expect(() => loginResponseSchema.parse(response)).not.toThrow();
  });
});
```

### Error Handling Tests

```typescript
it('should retry on network errors', async () => {
  mockApi.mockRejectedValueOnce(new NetworkError())
         .mockResolvedValueOnce({ data: 'success' });
  
  const result = await client.get('/data');
  
  expect(mockApi).toHaveBeenCalledTimes(2);
  expect(result).toEqual({ data: 'success' });
});
```

## CI/CD Integration

- ESLint with security plugins
- TypeScript strict mode
- Pre-commit hooks with Husky
- Automated Sentry releases
- Coverage reporting
- Contract test validation

## Best Practices

1. **Always normalize errors**: Use `toAppError()` for consistency
2. **Provide user-friendly messages**: Set `userMessage` on errors
3. **Track request IDs**: Include in error details for debugging
4. **Use appropriate error kinds**: Choose the right category
5. **Test error paths**: Include error scenarios in tests
6. **Monitor error rates**: Set up alerts for error spikes
7. **Document error codes**: Maintain a registry of error codes

## Migration Guide

### Before

```typescript
try {
  const data = await fetch('/api/data');
  return data.json();
} catch (error) {
  console.error(error);
  alert('Something went wrong');
}
```

### After

```typescript
try {
  const data = await httpClient.get('/api/data', {
    schema: dataSchema,
  });
  return data;
} catch (error) {
  const appError = toAppError(error);
  logger.error('DataFetch', 'Failed to load data', {}, appError);
  
  // User sees friendly message
  showToast(appError.getUserMessage());
  
  // Automatic retry for network errors
  if (appError.kind === 'Network' && appError.isRecoverable) {
    return retry(() => httpClient.get('/api/data'));
  }
}
```

## Rollback Plan

All error handling improvements are behind the `error_handling_v1` feature flag:

```typescript
// Disable in production if issues arise
featureFlags.setOverride('error_handling_v1', false);
```