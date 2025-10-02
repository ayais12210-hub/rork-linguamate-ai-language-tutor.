# Input Validation & Sanitisation System

## Overview

This document describes the comprehensive input validation and sanitisation system implemented for the Linguamate AI Language Tutor app. The system provides schema-driven validation across both client and server, with robust sanitisation, security controls, and accessibility features.

## Architecture

### Shared Schemas (`/schemas`)

All validation schemas are defined using Zod and shared between client and server to ensure consistency.

**Key Files:**
- `schemas/common.ts` - Brand types and common validators
- `schemas/auth.ts` - Authentication schemas
- `schemas/profile.ts` - User profile schemas
- `schemas/lessons.ts` - Learning/lesson schemas
- `schemas/feedback.ts` - Feedback and reporting schemas
- `schemas/errors.ts` - Error codes and types

### Client-Side Validation (`/lib/validation`)

**Files:**
- `lib/validation/sanitise.ts` - Input sanitisation functions
- `lib/validation/errorMap.ts` - User-friendly error messages (UK English)
- `lib/validation/useAsyncValidate.ts` - Async validation hook with debouncing
- `lib/validation/zodResolver.ts` - Zod resolver for form validation

### Server-Side Validation (`/backend/validation`)

**Files:**
- `backend/validation/parser.ts` - Request validation helpers
- `backend/validation/sanitise.ts` - Server-side sanitisation
- `backend/middleware/validate.ts` - Validation middleware for routes

### Form Components (`/components/forms`)

Reusable, accessible form components with built-in validation:
- `TextField` - Text input with validation and character counting
- `Select` - Dropdown with validation
- `FilePicker` - File upload with MIME type and size validation

## Brand Types

Brand types provide type-safe wrappers around primitive types:

```typescript
import { Email, UUID, BCP47, ISODate } from '@/schemas/common';

// These are branded types that prevent accidental misuse
const email: Email = Email.parse('user@example.com');
const userId: UUID = UUID.parse('550e8400-e29b-41d4-a716-446655440000');
const locale: BCP47 = BCP47.parse('en-GB');
```

## Common Validators

### String Validators
- `BoundedString(min, max, code?)` - String with length constraints
- `safeRegexString(max?)` - String with regex timeout protection
- `SafeHTML` - HTML with XSS protection
- `PlainText` - Strips all HTML tags

### Number Validators
- `BoundedInt(min, max, code?)` - Integer within range
- `BoundedFloat(min, max, code?)` - Float within range
- `PositiveInt` - Positive integer
- `NonNegativeInt` - Zero or positive integer

### File Validators
- `AudioMIME` - Allowed audio MIME types
- `ImageMIME` - Allowed image MIME types
- `AudioFileRef` - Audio file with size/duration limits (max 8MB, 250ms-120s)
- `ImageFileRef` - Image file with size limits (max 5MB)

## Sanitisation

### Client-Side

```typescript
import { sanitiseInput, sanitiseEmail, sanitiseHTML } from '@/lib/validation';

// General input sanitisation
const clean = sanitiseInput(userInput);
// - Trims whitespace
// - Normalises to NFC
// - Removes control characters
// - Converts curly quotes to ASCII

// Email sanitisation
const email = sanitiseEmail('User@Example.COM'); // 'user@example.com'

// HTML sanitisation
const html = sanitiseHTML(input, ['b', 'i', 'em', 'strong']);
// - Removes script tags
// - Strips event handlers
// - Removes javascript: URLs
// - Allows only specified tags
```

### Server-Side

Server-side sanitisation includes additional protections:

```typescript
import { sanitiseInput, sanitiseHTML, sanitiseObject } from '@/backend/validation';

// Sanitise all string fields in an object
const sanitised = sanitiseObject(input, ['name', 'bio', 'description']);

// HTML sanitisation with stricter rules
const html = sanitiseHTML(input, ['b', 'i']);
// Also removes: data:, vbscript: URLs
```

## Error Handling

### Error Codes

All validation errors use stable error codes defined in `schemas/errors.ts`:

```typescript
export const ERROR_CODES = {
  INVALID_EMAIL: 'INVALID_EMAIL',
  PASSWORD_TOO_SHORT: 'PASSWORD_TOO_SHORT',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  // ... 60+ error codes
} as const;
```

### User-Friendly Messages

Error codes are mapped to UK English messages:

```typescript
import { getErrorMessage } from '@/lib/validation';

const message = getErrorMessage('PASSWORD_TOO_SHORT');
// "Password must be at least 8 characters"
```

### Structured Error Response

Server validation errors return structured responses:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request body validation failed: Email is required",
    "field": "email",
    "details": [
      { "path": "email", "code": "invalid_type" }
    ]
  }
}
```

## Client Usage

### Form Validation

```typescript
import { TextField } from '@/components/forms';
import { SignInSchema } from '@/schemas/auth';
import { zodResolver } from '@/lib/validation';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});

  const handleSubmit = () => {
    const resolver = zodResolver(SignInSchema);
    const result = resolver({ email, password });
    
    if (Object.keys(result.errors).length > 0) {
      setErrors(result.errors);
      return;
    }
    
    // Submit validated data
    submitLogin(result.values);
  };

  return (
    <View>
      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        error={errors.email?.message}
        keyboardType="email-address"
        autoCapitalize="none"
        required
      />
      <TextField
        label="Password"
        value={password}
        onChangeText={setPassword}
        error={errors.password?.message}
        secureTextEntry
        required
      />
    </View>
  );
}
```

### Async Validation

```typescript
import { useAsyncValidate } from '@/lib/validation';

function EmailField() {
  const [email, setEmail] = useState('');
  
  const { isValidating, error, isValid } = useAsyncValidate(email, {
    debounceMs: 500,
    validateFn: async (value) => {
      const response = await fetch(`/api/check-email?email=${value}`);
      const data = await response.json();
      return data.available || 'Email is already taken';
    },
    enabled: email.length > 0,
  });

  return (
    <TextField
      label="Email"
      value={email}
      onChangeText={setEmail}
      error={error}
      helperText={isValidating ? 'Checking availability...' : undefined}
    />
  );
}
```

## Server Usage

### Route Validation (tRPC)

```typescript
import { SignInSchema } from '@/schemas/auth';
import { publicProcedure } from './create-context';

export const loginProcedure = publicProcedure
  .input(SignInSchema)
  .mutation(async ({ input }) => {
    // input is fully validated and typed
    const { email, password } = input;
    // ...
  });
```

### Middleware Validation (Hono)

```typescript
import { validateMiddleware } from '@/backend/middleware/validate';
import { SignInSchema } from '@/schemas/auth';

app.post('/api/login',
  validateMiddleware({ body: SignInSchema }),
  async (c) => {
    const body = c.get('validatedBody');
    // body is fully validated and typed
  }
);
```

### Manual Validation

```typescript
import { parseBody, ValidationException } from '@/backend/validation';
import { SignInSchema } from '@/schemas/auth';

try {
  const validated = parseBody(SignInSchema, req.body);
  // Use validated data
} catch (error) {
  if (error instanceof ValidationException) {
    return c.json({ error: error.validationError }, error.statusCode);
  }
  throw error;
}
```

## Security Features

### XSS Protection

- All HTML inputs are sanitised
- Script tags and event handlers are stripped
- `javascript:`, `data:`, and `vbscript:` URLs are removed
- Only allowlisted tags are permitted

### SQL Injection Protection

- All inputs are validated before database queries
- Use parameterised queries only
- Never concatenate user input into SQL

### Path Traversal Protection

- Filenames are sanitised to remove path separators
- Only alphanumeric characters, dots, hyphens, and underscores allowed

### DoS Protection

- String length limits enforced
- File size limits enforced (8MB audio, 5MB images)
- Audio duration limits (250ms - 120s)
- Regex timeout protection

### Security Logging

Failed validations emit `SEC_INPUT_VALIDATION_FAIL` events:

```typescript
logger.warn({
  evt: 'SEC_INPUT_VALIDATION_FAIL',
  cat: 'security',
  req: { method, path },
  corr: { correlationId },
  data: { error: validationError },
}, 'Input validation failed');
```

## Accessibility

All form components include:

- Proper ARIA labels and hints
- Required field indicators
- Error announcements
- Keyboard navigation support
- Screen reader compatibility

```typescript
<TextField
  label="Email"
  required
  error="Please enter a valid email"
  helperText="We'll never share your email"
  testID="email-input"
/>
```

## File Constraints

### Audio Files
- **Formats:** webm, m4a, mp3, wav
- **Max Size:** 8 MB
- **Duration:** 250ms - 120s

### Image Files
- **Formats:** jpeg, png, webp, gif
- **Max Size:** 5 MB

## Testing

### Unit Tests

```typescript
// tests/validation/sanitise.spec.ts
import { sanitiseInput } from '@/lib/validation';

describe('sanitiseInput', () => {
  it('removes control characters', () => {
    expect(sanitiseInput('hello\x00world')).toBe('helloworld');
  });

  it('normalises whitespace', () => {
    expect(sanitiseInput('hello   world')).toBe('hello world');
  });

  it('converts curly quotes', () => {
    expect(sanitiseInput('"hello"')).toBe('"hello"');
  });
});
```

### Integration Tests

```typescript
// tests/api/validation.spec.ts
describe('POST /api/login', () => {
  it('rejects invalid email', async () => {
    const response = await request(app)
      .post('/api/login')
      .send({ email: 'invalid', password: 'password123' });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });
});
```

## Best Practices

1. **Always validate on both client and server** - Client validation improves UX, server validation ensures security

2. **Use shared schemas** - Import from `/schemas` to ensure consistency

3. **Sanitise before validation** - Clean input before parsing with Zod

4. **Provide helpful error messages** - Use UK English, be specific about requirements

5. **Log validation failures** - Emit security events for suspicious patterns

6. **Never echo raw input** - Always sanitise before displaying user input

7. **Use brand types** - Prevent accidental type misuse with branded types

8. **Test edge cases** - Include tests for boundary conditions and malicious input

## Extending the System

### Adding a New Schema

1. Create schema in `/schemas`:

```typescript
// schemas/newFeature.ts
import { z } from 'zod';
import { UUID, BoundedString } from './common';

export const CreateItemSchema = z.object({
  name: BoundedString(1, 100, 'NAME_INVALID'),
  description: BoundedString(0, 500, 'DESCRIPTION_TOO_LONG').optional(),
  categoryId: UUID,
});

export type CreateItemInput = z.infer<typeof CreateItemSchema>;
```

2. Add error codes to `schemas/errors.ts`:

```typescript
export const ERROR_CODES = {
  // ... existing codes
  NAME_INVALID: 'NAME_INVALID',
  DESCRIPTION_TOO_LONG: 'DESCRIPTION_TOO_LONG',
} as const;
```

3. Add error messages to `lib/validation/errorMap.ts`:

```typescript
export const ERROR_MESSAGES_EN: ErrorMessages = {
  // ... existing messages
  [ERROR_CODES.NAME_INVALID]: 'Name must be between 1 and 100 characters',
  [ERROR_CODES.DESCRIPTION_TOO_LONG]: 'Description is too long (max 500 characters)',
};
```

4. Use in routes:

```typescript
import { CreateItemSchema } from '@/schemas/newFeature';

export const createItemProcedure = protectedProcedure
  .input(CreateItemSchema)
  .mutation(async ({ input }) => {
    // Fully validated and typed
  });
```

## Privacy & GDPR

- **Minimal data in errors** - Never include PII in error messages or logs
- **Redacted logging** - Validation failures log field paths, not values
- **No secrets in logs** - Passwords, tokens, and keys are never logged
- **User consent** - Validation telemetry respects user privacy settings

## Performance

- **Pre-compiled schemas** - Schemas are defined once and reused
- **Debounced async validation** - Network requests are debounced (500ms default)
- **Cancellable requests** - Async validations are cancelled when input changes
- **Efficient sanitisation** - Regex operations are optimized and bounded

## Support

For questions or issues with the validation system:
1. Check this documentation
2. Review schema definitions in `/schemas`
3. Check error code mappings in `schemas/errors.ts`
4. Review security logs for `SEC_INPUT_VALIDATION_FAIL` events
