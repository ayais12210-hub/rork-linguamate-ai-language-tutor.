# Error Handling System

This document describes the comprehensive error handling system implemented in the Linguamate app. The system provides typed error handling, graceful degradation, and observability across all layers of the application.

## Overview

The error handling system is built around several key principles:

1. **Typed Errors**: All errors are strongly typed with `AppError` discriminated unions
2. **Result Pattern**: Functions return `Result<T, E>` instead of throwing exceptions
3. **Graceful Degradation**: Components gracefully handle errors with fallbacks
4. **Observability**: All errors are tracked and reported for debugging
5. **User-Friendly**: Errors are presented to users in a clear, actionable way

## Core Components

### 1. Error Types (`lib/errors/`)

#### AppError
```typescript
export type AppErrorCode =
  | 'NetworkError'
  | 'TimeoutError'
  | 'ValidationError'
  | 'AuthError'
  | 'UnknownError'
  | 'StorageError'
  | 'PermissionError'
  | 'OfflineError';

export interface AppError {
  code: AppErrorCode;
  message: string;
  cause?: unknown;
  hint?: string;
  retryable?: boolean;
  errorId?: string;
  timestamp?: number;
  context?: Record<string, unknown>;
}
```

#### Result Pattern
```typescript
export type Result<T, E = AppError> = 
  | { ok: true; value: T }
  | { ok: false; error: E };

// Helper functions
const result = ok('success');
const error = err(createAppError('NetworkError', 'Connection failed'));

// Safe unwrapping
const value = unwrapOr(result, 'default');
const mapped = map(result, x => x.toUpperCase());
```

### 2. Error Boundaries (`components/boundaries/`)

#### AppErrorBoundary
Catches React errors and displays a recovery screen:

```tsx
<AppErrorBoundary>
  <YourApp />
</AppErrorBoundary>
```

#### Screen-Level Boundaries
Wrap individual screens with error boundaries:

```tsx
const SafeTranslatorScreen = withScreenBoundary(TranslatorScreen, 'translator');
```

### 3. Network Error Handling (`lib/net/http.ts`)

Safe HTTP client with automatic retries and validation:

```typescript
import { getJson, postJson, withRetry } from '@/lib/net/http';
import { UserSchema } from '@/schemas/user';

// Basic request
const result = await getJson('/api/user', UserSchema);

// With retry logic
const result = await withRetry(async () => {
  return getJson('/api/user', UserSchema);
}, { maxRetries: 3 });
```

### 4. Offline Resilience (`lib/offline/`)

#### Network Status Detection
```typescript
import { useNetworkStatus } from '@/lib/offline/netStatus';

function MyComponent() {
  const { isOnline, checkConnection } = useNetworkStatus();
  
  if (!isOnline) {
    return <OfflineMessage />;
  }
}
```

#### Retry Queue
```typescript
import { retryQueue } from '@/lib/offline/retryQueue';

// Add action to retry queue
await retryQueue.addAction('sync_progress', { userId, progress });

// Register handler
retryQueue.registerActionHandler('sync_progress', async (payload) => {
  // Sync logic here
  return { ok: true, value: null };
});
```

### 5. Form Validation (`lib/validation/zodResolver.ts`)

Enhanced form validation with error handling:

```typescript
import { useFormValidation } from '@/lib/validation/zodResolver';
import { UserRegistrationSchema } from '@/schemas/user';

function RegistrationForm() {
  const {
    values,
    errors,
    validate,
    setValue,
  } = useFormValidation(UserRegistrationSchema, {
    email: '',
    password: '',
    displayName: '',
    acceptTerms: false,
  });

  const handleSubmit = async () => {
    const isValid = await validate();
    if (isValid) {
      // Submit form
    }
  };

  return (
    <View>
      <TextInput
        value={values.email}
        onChangeText={(text) => setValue('email', text)}
      />
      {errors.email && <FormError error={null} field="email" />}
    </View>
  );
}
```

### 6. Storage Safety (`lib/state/safeStorage.ts`)

Safe storage wrapper with corruption handling:

```typescript
import { safeGetItem, safeSetItem } from '@/lib/state/safeStorage';
import { UserSchema } from '@/schemas/user';

// Safe storage operations
const result = await safeGetItem('user', { validate: UserSchema });
if (result.ok) {
  console.log('User data:', result.value);
}

// Set with validation
await safeSetItem('user', userData, { validate: UserSchema });
```

### 7. Speech Error Handling (`lib/stt/enhancedSTT.ts`)

Enhanced STT/TTS with comprehensive error handling:

```typescript
import { getSTT, getTTS } from '@/lib/stt';

const stt = getSTT();
const tts = getTTS();

// Start speech recognition
const result = await stt.start(
  (partial) => console.log('Partial:', partial.text),
  (error) => console.error('STT Error:', error)
);

// Speak text
const speakResult = await tts.speak('Hello world', {
  onError: (error) => console.error('TTS Error:', error)
});
```

### 8. Error UI Components (`components/feedback/`)

#### InlineError
```tsx
<InlineError error={error} />
```

#### FormError
```tsx
<FormError error={error} field="email" />
```

#### ToastInfo
```tsx
<ToastInfo 
  error={error} 
  onDismiss={() => setError(null)}
  duration={5000}
/>
```

### 9. Observability (`observability/telemetry.ts`)

Comprehensive error tracking:

```typescript
import { trackError, trackAction, trackScreen } from '@/observability/telemetry';

// Track errors
await trackError('api_call_failed', {
  error: appError,
  context: { endpoint: '/api/users' },
});

// Track user actions
await trackAction('button_click', {
  actionType: 'navigation',
  screen: 'home',
});

// Track screen views
await trackScreen('translator', {
  routeParams: { language: 'es' },
});
```

## Usage Patterns

### 1. API Calls
```typescript
const result = await withRetry(async () => {
  return getJson('/api/data', DataSchema);
});

if (result.ok) {
  // Handle success
  setData(result.value);
} else {
  // Handle error
  setError(result.error);
  await trackError('api_call_failed', { error: result.error });
}
```

### 2. Form Handling
```typescript
const handleSubmit = async () => {
  const isValid = await validate();
  if (!isValid) return;

  const result = await submitForm(values);
  if (result.ok) {
    // Success
    navigation.navigate('success');
  } else {
    // Show error
    setFormError(result.error);
  }
};
```

### 3. Storage Operations
```typescript
const loadUserData = async () => {
  const result = await safeGetItem('user', { 
    validate: UserSchema,
    defaultValue: null 
  });
  
  if (result.ok) {
    setUser(result.value);
  } else {
    // Handle storage error
    console.error('Failed to load user data:', result.error);
  }
};
```

### 4. Speech Operations
```typescript
const handleVoiceInput = async () => {
  const stt = getSTT();
  
  const result = await stt.start(
    (partial) => setText(partial.text),
    (error) => {
      setSpeechError(error);
      // Fallback to text input
      setShowTextInput(true);
    }
  );
  
  if (!result.ok) {
    // Handle start error
    setSpeechError(result.error);
  }
};
```

## Error Recovery Strategies

### 1. Automatic Retry
- Network requests with exponential backoff
- Storage operations with corruption handling
- Speech recognition with fallback providers

### 2. Graceful Degradation
- Offline mode with limited functionality
- Fallback to text input when speech fails
- Cached data when network is unavailable

### 3. User Guidance
- Clear error messages with actionable hints
- Recovery buttons (retry, reset, report)
- Progressive disclosure of technical details

## Testing

### Unit Tests
```typescript
import { ok, err, unwrapOr } from '@/lib/errors/result';

describe('Result helpers', () => {
  it('should handle success', () => {
    const result = ok('success');
    expect(unwrapOr(result, 'default')).toBe('success');
  });
});
```

### Integration Tests
```typescript
describe('Error boundaries', () => {
  it('should catch and display errors', () => {
    const { getByText } = render(
      <AppErrorBoundary>
        <FailingComponent />
      </AppErrorBoundary>
    );
    
    expect(getByText('Something went wrong')).toBeInTheDocument();
  });
});
```

## Best Practices

1. **Always use Result pattern** for async operations
2. **Validate all external data** with Zod schemas
3. **Provide user-friendly error messages** with actionable hints
4. **Track errors** for debugging and monitoring
5. **Implement fallbacks** for critical functionality
6. **Test error scenarios** thoroughly
7. **Use error boundaries** to prevent app crashes
8. **Handle offline scenarios** gracefully

## Migration Guide

### From try/catch to Result pattern:
```typescript
// Before
try {
  const data = await fetchData();
  setData(data);
} catch (error) {
  setError(error);
}

// After
const result = await fetchData();
if (result.ok) {
  setData(result.value);
} else {
  setError(result.error);
}
```

### From manual error handling to error boundaries:
```tsx
// Before
<ComponentThatMightFail />

// After
<AppErrorBoundary>
  <ComponentThatMightFail />
</AppErrorBoundary>
```

This error handling system provides a robust foundation for building reliable, user-friendly applications that gracefully handle failures and provide excellent user experience even when things go wrong.