# Log Schema Reference

## Overview

All logs follow a consistent JSON schema validated with Zod on both client and server.

## Base Log Envelope

```typescript
interface LogEnvelope {
  ts: string;                    // ISO 8601 timestamp
  lvl: LogLevel;                 // Log level
  cat: string;                   // Category (e.g., 'auth', 'api', 'ui')
  evt: string;                   // Event name (e.g., 'user_login', 'SEC_AUTH_BRUTEFORCE')
  msg: string;                   // Human-readable message
  data?: Record<string, unknown>; // Additional structured data
  device?: DeviceInfo;           // Device information (client only)
  user?: UserInfo;               // User information (pseudonymized)
  req?: RequestInfo;             // Request information (server only)
  corr?: CorrelationInfo;        // Correlation IDs
  sig?: SignatureInfo;           // HMAC signature (client batches)
}
```

## Log Levels

```typescript
type LogLevel =
  | 'TRACE'      // Detailed debugging (dev only)
  | 'DEBUG'      // Development diagnostics
  | 'INFO'       // General informational events
  | 'NOTICE'     // Significant but normal events
  | 'WARN'       // Warning conditions
  | 'ERROR'      // Error conditions
  | 'FATAL'      // Critical failures
  | 'SECURITY';  // Security-related events
```

### Level Guidelines

- **TRACE**: Function entry/exit, variable values (dev only, never in production)
- **DEBUG**: Detailed flow, state changes, cache hits/misses
- **INFO**: User actions, API calls, background jobs
- **NOTICE**: Significant events (user registration, subscription changes)
- **WARN**: Recoverable errors, deprecated API usage, rate limit warnings
- **ERROR**: Unhandled exceptions, failed operations, data inconsistencies
- **FATAL**: System crashes, unrecoverable errors, data corruption
- **SECURITY**: All security-related events (use SEC_* prefix for evt)

## Categories

```typescript
type LogCategory =
  | 'auth'          // Authentication & authorization
  | 'api'           // API requests/responses
  | 'ui'            // User interface events
  | 'ai'            // AI/ML operations
  | 'payment'       // Payment & billing
  | 'lesson'        // Learning content
  | 'speech'        // TTS/STT operations
  | 'storage'       // Data persistence
  | 'network'       // Network operations
  | 'system'        // System events
  | 'security';     // Security events
```

## Device Info (Client)

```typescript
interface DeviceInfo {
  model?: string;        // Device model (e.g., 'iPhone 14 Pro')
  os?: string;           // OS version (e.g., 'iOS 17.2')
  appVer?: string;       // App version (e.g., '1.2.3')
  platform?: string;     // Platform (e.g., 'ios', 'android', 'web')
  locale?: string;       // User locale (e.g., 'en-US')
  timezone?: string;     // Timezone (e.g., 'America/New_York')
  fingerprint?: string;  // Salted device hash (non-reversible)
}
```

## User Info

```typescript
interface UserInfo {
  sub?: string;          // Hashed user ID (SHA-256 + salt)
  role?: string;         // User role (e.g., 'user', 'premium', 'admin')
  tier?: string;         // Subscription tier
  cohort?: string;       // A/B test cohort
  // Never include: email, name, phone, real user ID
}
```

## Request Info (Server)

```typescript
interface RequestInfo {
  method?: string;       // HTTP method (e.g., 'GET', 'POST')
  path?: string;         // Request path (e.g., '/api/lessons')
  status?: number;       // Response status code
  duration?: number;     // Request duration (ms)
  ipHash?: string;       // Hashed IP address (SHA-256 + salt)
  userAgent?: string;    // User agent (redacted)
  referer?: string;      // Referer header (redacted)
  // Never include: raw IP, full user agent, auth headers
}
```

## Correlation Info

```typescript
interface CorrelationInfo {
  correlationId: string; // Unique request ID (UUID v4)
  sessionId?: string;    // Session ID (persists across requests)
  parentId?: string;     // Parent span ID (for distributed tracing)
  traceId?: string;      // Trace ID (OpenTelemetry compatible)
}
```

## Signature Info (Client Batches)

```typescript
interface SignatureInfo {
  hmac: string;          // HMAC-SHA256 of payload
  algo: 'HMAC-SHA256';   // Algorithm identifier
  ts: string;            // Signature timestamp (ISO 8601)
}
```

## Security Event Taxonomy

All security events use `SECURITY` level and `SEC_*` prefix for `evt`.

### Authentication Events

```typescript
type AuthSecurityEvent =
  | 'SEC_AUTH_LOGIN_SUCCESS'           // Successful login
  | 'SEC_AUTH_LOGIN_FAILURE'           // Failed login attempt
  | 'SEC_AUTH_BRUTEFORCE'              // Brute force detected
  | 'SEC_AUTH_TOKEN_INVALID'           // Invalid token presented
  | 'SEC_AUTH_TOKEN_EXPIRED'           // Expired token used
  | 'SEC_AUTH_MFA_BYPASS_ATTEMPT'      // MFA bypass attempt
  | 'SEC_AUTH_SESSION_HIJACK'          // Session hijacking detected
  | 'SEC_AUTH_LOGOUT'                  // User logout
  | 'SEC_AUTH_PASSWORD_RESET'          // Password reset requested
  | 'SEC_AUTH_ACCOUNT_LOCKED';         // Account locked due to security
```

### Authorization Events

```typescript
type AuthzSecurityEvent =
  | 'SEC_AUTHZ_DENIED'                 // Permission denied
  | 'SEC_AUTHZ_PRIV_ESCALATION'        // Privilege escalation attempt
  | 'SEC_AUTHZ_ROLE_CHANGE'            // User role changed
  | 'SEC_AUTHZ_SCOPE_EXCEEDED';        // Requested scope exceeded
```

### Input Validation Events

```typescript
type ValidationSecurityEvent =
  | 'SEC_INPUT_VALIDATION_FAIL'        // Input validation failed
  | 'SEC_INPUT_SQL_INJECTION'          // SQL injection attempt
  | 'SEC_INPUT_XSS_ATTEMPT'            // XSS attempt detected
  | 'SEC_INPUT_PATH_TRAVERSAL'         // Path traversal attempt
  | 'SEC_INPUT_COMMAND_INJECTION';     // Command injection attempt
```

### Rate Limiting Events

```typescript
type RateLimitSecurityEvent =
  | 'SEC_RATE_LIMIT_TRIPPED'           // Rate limit exceeded
  | 'SEC_RATE_LIMIT_WARNING'           // Approaching rate limit
  | 'SEC_RATE_LIMIT_BANNED';           // IP/user banned
```

### CSRF & Request Forgery

```typescript
type CSRFSecurityEvent =
  | 'SEC_CSRF_DETECTED'                // CSRF token mismatch
  | 'SEC_CSRF_MISSING'                 // CSRF token missing
  | 'SEC_ORIGIN_MISMATCH';             // Origin header mismatch
```

### Configuration & Integrity

```typescript
type IntegritySecurityEvent =
  | 'SEC_CONFIG_TAMPERED'              // Configuration tampering
  | 'SEC_INTEGRITY_FAIL'               // Integrity check failed
  | 'SEC_SIGNATURE_INVALID'            // Invalid signature
  | 'SEC_CHECKSUM_MISMATCH';           // Checksum mismatch
```

### Cryptography Events

```typescript
type CryptoSecurityEvent =
  | 'SEC_CRYPTO_WEAK_KEY'              // Weak encryption key
  | 'SEC_CRYPTO_DECRYPT_FAIL'          // Decryption failed
  | 'SEC_CRYPTO_CERT_INVALID'          // Invalid certificate
  | 'SEC_CRYPTO_CERT_EXPIRED';         // Expired certificate
```

### Payment Events

```typescript
type PaymentSecurityEvent =
  | 'SEC_PAYMENT_ANOMALY'              // Payment anomaly detected
  | 'SEC_PAYMENT_FRAUD'                // Fraud detected
  | 'SEC_PAYMENT_DUPLICATE'            // Duplicate transaction
  | 'SEC_PAYMENT_AMOUNT_MISMATCH';     // Amount mismatch
```

### Data Access Events

```typescript
type DataAccessSecurityEvent =
  | 'SEC_DATA_ACCESS_DENIED'           // Data access denied
  | 'SEC_DATA_EXPORT'                  // Data exported (GDPR)
  | 'SEC_DATA_DELETE'                  // Data deleted (GDPR)
  | 'SEC_DATA_BREACH'                  // Data breach detected
  | 'SEC_PII_BLOCKED';                 // PII detected and blocked
```

### AI/ML Events

```typescript
type AISecurityEvent =
  | 'SEC_AI_OUTPUT_POLICY_BLOCKED'     // AI output blocked by policy
  | 'SEC_AI_PROMPT_INJECTION'          // Prompt injection detected
  | 'SEC_AI_JAILBREAK_ATTEMPT'         // Jailbreak attempt
  | 'SEC_AI_TOXIC_OUTPUT';             // Toxic content generated
```

## Example Logs

### Client: User Login

```json
{
  "ts": "2024-01-15T10:30:45.123Z",
  "lvl": "INFO",
  "cat": "auth",
  "evt": "user_login_attempt",
  "msg": "User attempting login",
  "data": {
    "method": "email"
  },
  "device": {
    "model": "iPhone 14 Pro",
    "os": "iOS 17.2",
    "appVer": "1.2.3",
    "platform": "ios",
    "locale": "en-US",
    "timezone": "America/New_York",
    "fingerprint": "a1b2c3d4e5f6..."
  },
  "corr": {
    "correlationId": "550e8400-e29b-41d4-a716-446655440000",
    "sessionId": "7c9e6679-7425-40de-944b-e07fc1f90ae7"
  }
}
```

### Server: Security Event

```json
{
  "ts": "2024-01-15T10:30:46.789Z",
  "lvl": "SECURITY",
  "cat": "security",
  "evt": "SEC_AUTH_BRUTEFORCE",
  "msg": "Brute force attack detected",
  "data": {
    "attempts": 15,
    "window": "5m",
    "action": "account_locked"
  },
  "user": {
    "sub": "sha256_hash_of_user_id",
    "role": "user"
  },
  "req": {
    "method": "POST",
    "path": "/api/auth/login",
    "status": 429,
    "duration": 45,
    "ipHash": "sha256_hash_of_ip"
  },
  "corr": {
    "correlationId": "550e8400-e29b-41d4-a716-446655440000",
    "sessionId": "7c9e6679-7425-40de-944b-e07fc1f90ae7"
  }
}
```

### Client: AI Interaction

```json
{
  "ts": "2024-01-15T10:35:12.456Z",
  "lvl": "INFO",
  "cat": "ai",
  "evt": "ai_lesson_started",
  "msg": "AI lesson session started",
  "data": {
    "lessonId": "lesson_123",
    "topic": "spanish_verbs",
    "difficulty": "intermediate"
  },
  "user": {
    "sub": "sha256_hash_of_user_id",
    "tier": "premium"
  },
  "device": {
    "platform": "android",
    "appVer": "1.2.3"
  },
  "corr": {
    "correlationId": "660f9511-f39c-52e5-b827-557766551111",
    "sessionId": "7c9e6679-7425-40de-944b-e07fc1f90ae7"
  }
}
```

### Server: Error

```json
{
  "ts": "2024-01-15T10:40:23.789Z",
  "lvl": "ERROR",
  "cat": "api",
  "evt": "api_error",
  "msg": "Failed to fetch lesson content",
  "data": {
    "error": "DatabaseConnectionError",
    "message": "Connection timeout",
    "lessonId": "lesson_123",
    "retryable": true
  },
  "req": {
    "method": "GET",
    "path": "/api/lessons/lesson_123",
    "status": 500,
    "duration": 5000
  },
  "corr": {
    "correlationId": "770g0622-g40d-63f6-c938-668877662222"
  }
}
```

### Client Batch with Signature

```json
{
  "logs": [
    { "ts": "...", "lvl": "INFO", "..." },
    { "ts": "...", "lvl": "DEBUG", "..." }
  ],
  "sig": {
    "hmac": "a1b2c3d4e5f6...",
    "algo": "HMAC-SHA256",
    "ts": "2024-01-15T10:45:00.000Z"
  }
}
```

## Zod Schemas

### Base Schema

```typescript
import { z } from 'zod';

export const LogLevelSchema = z.enum([
  'TRACE',
  'DEBUG',
  'INFO',
  'NOTICE',
  'WARN',
  'ERROR',
  'FATAL',
  'SECURITY'
]);

export const DeviceInfoSchema = z.object({
  model: z.string().optional(),
  os: z.string().optional(),
  appVer: z.string().optional(),
  platform: z.string().optional(),
  locale: z.string().optional(),
  timezone: z.string().optional(),
  fingerprint: z.string().optional()
});

export const UserInfoSchema = z.object({
  sub: z.string().optional(),
  role: z.string().optional(),
  tier: z.string().optional(),
  cohort: z.string().optional()
});

export const RequestInfoSchema = z.object({
  method: z.string().optional(),
  path: z.string().optional(),
  status: z.number().optional(),
  duration: z.number().optional(),
  ipHash: z.string().optional(),
  userAgent: z.string().optional(),
  referer: z.string().optional()
});

export const CorrelationInfoSchema = z.object({
  correlationId: z.string().uuid(),
  sessionId: z.string().uuid().optional(),
  parentId: z.string().optional(),
  traceId: z.string().optional()
});

export const SignatureInfoSchema = z.object({
  hmac: z.string(),
  algo: z.literal('HMAC-SHA256'),
  ts: z.string().datetime()
});

export const LogEnvelopeSchema = z.object({
  ts: z.string().datetime(),
  lvl: LogLevelSchema,
  cat: z.string(),
  evt: z.string(),
  msg: z.string(),
  data: z.record(z.unknown()).optional(),
  device: DeviceInfoSchema.optional(),
  user: UserInfoSchema.optional(),
  req: RequestInfoSchema.optional(),
  corr: CorrelationInfoSchema.optional(),
  sig: SignatureInfoSchema.optional()
});

export const LogBatchSchema = z.object({
  logs: z.array(LogEnvelopeSchema),
  sig: SignatureInfoSchema
});
```

## Redaction Rules

### Automatic Redaction

The following patterns are automatically redacted:

1. **Email addresses**: `[REDACTED_EMAIL]`
2. **Phone numbers**: `[REDACTED_PHONE]`
3. **JWT tokens**: `[REDACTED_TOKEN]`
4. **Session cookies**: `[REDACTED_COOKIE]`
5. **Credit card numbers**: `[REDACTED_PAN]`
6. **IBAN**: `[REDACTED_IBAN]`
7. **GPS coordinates**: `[REDACTED_GPS]`
8. **Physical addresses**: `[REDACTED_ADDRESS]`
9. **IP addresses**: Hashed with SHA-256 + salt
10. **User IDs**: Hashed with SHA-256 + salt

### Custom Redaction

```typescript
import { addRedactor } from '@/modules/logging/redactors';

// Redact custom sensitive fields
addRedactor('apiKey', (value) => {
  if (typeof value === 'string' && value.startsWith('sk_')) {
    return '[REDACTED_API_KEY]';
  }
  return value;
});
```

## Retention Policies

Default retention by level:

- **SECURITY**: 90 days
- **ERROR**: 90 days
- **WARN**: 90 days
- **NOTICE**: 30 days
- **INFO**: 30 days
- **DEBUG**: 7 days
- **TRACE**: 1 day (dev only)

Configurable via environment variables:
```bash
RETENTION_SECURITY_DAYS=90
RETENTION_ERROR_DAYS=90
RETENTION_WARN_DAYS=90
RETENTION_NOTICE_DAYS=30
RETENTION_INFO_DAYS=30
RETENTION_DEBUG_DAYS=7
RETENTION_TRACE_DAYS=1
```

## Compliance

### GDPR

- All user identifiers are pseudonymized (hashed)
- PII is automatically redacted
- Subject access requests supported
- Right to erasure supported
- Data minimization enforced
- Retention policies enforced

### OWASP

- Follows OWASP Logging Cheat Sheet
- No sensitive data in logs
- Structured logging for SIEM integration
- Tamper-evident (HMAC signatures)
- Secure transport (HTTPS, TLS)

### SOC 2

- Audit trail for all security events
- Access logging
- Change logging
- Retention policies
- Encryption at rest and in transit

## Best Practices

1. **Use structured data**: Always use `data` field for structured information
2. **Consistent event names**: Use snake_case, be specific (e.g., `user_login_success` not `login`)
3. **Security prefix**: Always use `SEC_` prefix for security events
4. **Correlation IDs**: Always include correlation IDs for tracing
5. **No secrets**: Never log passwords, tokens, keys, or PII
6. **Actionable messages**: Write messages that help debugging
7. **Appropriate levels**: Use correct log level for severity
8. **Categories**: Use consistent categories for filtering
9. **Redaction**: When in doubt, redact
10. **Testing**: Test log output in development

## Migration Guide

### From Console.log

```typescript
// Before
console.log('User logged in:', userId);

// After
log.info('user_login_success', 'User logged in successfully', {
  userId: hashUserId(userId) // Pseudonymized
});
```

### From Winston/Bunyan

```typescript
// Before
logger.info({ userId, action: 'login' }, 'User logged in');

// After
log.info('user_login_success', 'User logged in successfully', {
  userId: hashUserId(userId)
});
```

### Adding Correlation

```typescript
// Before
log.info('api_call', 'Calling external API');

// After
const correlationId = generateCorrelationId();
log.info('api_call', 'Calling external API', {
  correlationId,
  endpoint: '/api/external'
});
```

## Support

For questions or issues with logging:
1. Check [OBSERVABILITY.md](./OBSERVABILITY.md)
2. Review [INCIDENT_RUNBOOK.md](./INCIDENT_RUNBOOK.md)
3. Contact platform team

## Changelog

- **2024-01-15**: Initial schema definition
- **2024-01-15**: Added security event taxonomy
- **2024-01-15**: Added GDPR compliance notes
