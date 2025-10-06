# Backend Architecture

## Overview

The Linguamate backend is built using a modern, type-safe stack with Hono (HTTP framework) and tRPC (type-safe RPC) for API endpoints. The architecture prioritizes security, reliability, and developer experience.

## Tech Stack

- **Runtime**: Node.js 18+
- **HTTP Framework**: Hono (lightweight, fast, edge-compatible)
- **RPC Framework**: tRPC (type-safe client-server communication)
- **Validation**: Zod (runtime type validation)
- **Logging**: Pino (structured JSON logging)
- **Monitoring**: Sentry (error tracking)
- **Language**: TypeScript (strict mode)

## Directory Structure

```
backend/
├── __tests__/              # Backend-specific tests
├── hono.ts                 # Main HTTP server entry point
├── logging/                # Logging configuration
│   └── pino.ts            # Pino logger setup
├── middleware/             # HTTP middleware
│   ├── correlation.ts     # Request correlation IDs
│   ├── errorHandler.ts    # Global error handling
│   ├── rateLimit.ts       # Rate limiting
│   ├── requestLogger.ts   # Request/response logging
│   ├── securityHeaders.ts # Security headers
│   └── validate.ts        # Request validation
├── monitoring/             # Monitoring and observability
│   └── sentry.ts          # Sentry configuration
├── routes/                 # HTTP route handlers
│   ├── health.ts          # Health check endpoints
│   ├── ingestLogs.ts      # Log ingestion
│   ├── stt.ts             # Speech-to-text proxy
│   └── toolkitProxy.ts    # External API proxy
├── trpc/                   # tRPC configuration and routes
│   ├── app-router.ts      # Main tRPC router
│   ├── create-context.ts  # Request context creation
│   └── routes/            # tRPC procedure definitions
│       ├── auth/          # Authentication procedures
│       ├── chat/          # Chat and AI features
│       ├── lessons/       # Learning content
│       ├── user/          # User management
│       └── ...
├── utils/                  # Utility functions
│   ├── http-client.ts     # HTTP client with retries
│   └── log-redactor.ts    # Sensitive data redaction
└── validation/             # Input validation utilities
    ├── index.ts           # Validation exports
    ├── jwt.ts             # JWT utilities
    ├── parser.ts          # Zod validation helpers
    └── sanitise.ts        # Input sanitization
```

## Request Flow

1. **HTTP Request** → Hono server
2. **Middleware Chain**:
   - Error Handler (catches all errors)
   - Correlation ID (adds request tracking)
   - Security Headers (CSRF, XSS protection)
   - Request Logger (structured logging)
   - CORS (cross-origin handling)
   - Rate Limiting (per-IP and per-route)
3. **Route Matching**:
   - `/api/health/*` → Health check routes
   - `/api/trpc/*` → tRPC procedures
   - `/api/stt/*` → Speech-to-text proxy
   - `/api/toolkit/*` → External API proxy
4. **tRPC Processing** (for `/trpc/*`):
   - Context Creation (auth, correlation)
   - Input Validation (Zod schemas)
   - Procedure Execution
   - Output Serialization (SuperJSON)
5. **Response** → Client

## Authentication & Authorization

### JWT Authentication
- **Access Tokens**: Short-lived (1 hour), contain user ID and session ID
- **Refresh Tokens**: Long-lived (30 days), used to generate new access tokens
- **Token Validation**: HMAC-SHA256 signature verification
- **Context Creation**: Extracts user info from valid tokens

### Authorization Patterns
- **Public Procedures**: No authentication required
- **Protected Procedures**: Require valid access token
- **Role-based Access**: Future enhancement for admin/user roles

### Security Headers
```typescript
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
Strict-Transport-Security: max-age=31536000; includeSubDomains (production)
```

## Data Validation

### Input Validation
- **Zod Schemas**: Runtime type validation for all inputs
- **Sanitization**: HTML/script tag removal, SQL injection prevention
- **Error Handling**: Structured validation error responses

### Output Validation
- **Type Safety**: TypeScript ensures compile-time type checking
- **Serialization**: SuperJSON handles complex types (Date, Map, Set)
- **Response Schemas**: Consistent API response formats

## Error Handling

### Error Types
- **Validation Errors** (400): Invalid input data
- **Authentication Errors** (401): Missing/invalid tokens
- **Authorization Errors** (403): Insufficient permissions
- **Not Found Errors** (404): Resource not found
- **Rate Limit Errors** (429): Too many requests
- **Server Errors** (500): Internal server errors

### Error Response Format
```json
{
  "error": "Human-readable error message",
  "code": "MACHINE_READABLE_CODE",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "correlationId": "uuid-for-tracking"
}
```

### Security Considerations
- **No Stack Traces**: Never expose internal errors to clients
- **Sensitive Data Redaction**: Automatic removal of secrets from logs
- **Correlation IDs**: Track requests across services for debugging

## Rate Limiting

### Configuration
- **Global Limit**: 100 requests/minute per IP
- **Auth Endpoints**: 10 requests/minute per IP
- **Health Endpoints**: No rate limiting (monitoring)

### Implementation
- **In-Memory Store**: Simple Map-based storage (single instance)
- **Production**: Recommend Redis-based rate limiting for multi-instance deployments
- **Headers**: Standard rate limit headers in responses

## Monitoring & Observability

### Structured Logging
```json
{
  "level": "INFO",
  "time": "2024-01-01T00:00:00.000Z",
  "evt": "http_request",
  "cat": "api",
  "req": {
    "method": "POST",
    "path": "/api/trpc/auth.login",
    "status": 200,
    "duration": 150,
    "ip": "192.168.1.1"
  },
  "corr": {
    "correlationId": "uuid",
    "sessionId": "session-uuid"
  }
}
```

### Health Checks
- **Basic Health** (`/health`): Server status, memory usage
- **Detailed Health** (`/health/detailed`): External dependency checks
- **Readiness** (`/ready`): Kubernetes readiness probe
- **Liveness** (`/live`): Kubernetes liveness probe

### Error Tracking
- **Sentry Integration**: Automatic error reporting
- **Performance Monitoring**: Request timing and throughput
- **Custom Events**: Business logic tracking

## External Dependencies

### Toolkit API
- **Purpose**: AI/ML services for language learning
- **Timeout**: 30 seconds with 3 retries
- **Circuit Breaker**: Opens after 5 consecutive failures
- **Rate Limiting**: Applied at proxy level

### Speech-to-Text Service
- **Purpose**: Audio transcription for pronunciation practice
- **File Upload**: Multipart form data handling
- **Validation**: Audio format and size limits

## Environment Configuration

### Required Variables
```bash
# Security (CRITICAL)
JWT_SECRET=<strong-random-secret>
CORS_ORIGIN=<comma-separated-origins>

# External Services
TOOLKIT_API_KEY=<api-key>
EXPO_PUBLIC_TOOLKIT_URL=<service-url>

# Monitoring
SENTRY_DSN=<sentry-dsn>
LOG_LEVEL=info
```

### Optional Variables
```bash
# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# Build Info
APP_VERSION=1.0.0
GIT_COMMIT_SHA=<commit-hash>
```

## Performance Considerations

### Response Times
- **Health Checks**: < 50ms
- **Simple tRPC Calls**: < 200ms
- **External API Calls**: < 5s (with timeout)

### Memory Usage
- **Heap Size**: Monitor via health endpoints
- **Rate Limit Maps**: Automatic cleanup to prevent memory leaks

### Scalability
- **Stateless Design**: No server-side sessions (JWT-based)
- **Horizontal Scaling**: Multiple instances behind load balancer
- **Database**: Currently mock data, ready for real database integration

## Security Best Practices

### Input Validation
- All inputs validated with Zod schemas
- SQL injection prevention (parameterized queries when DB added)
- XSS protection via output encoding

### Authentication
- Secure JWT implementation with proper expiration
- No sensitive data in tokens
- Refresh token rotation

### Network Security
- HTTPS enforcement in production
- CORS properly configured
- Security headers on all responses

### Logging Security
- Automatic redaction of sensitive data
- No passwords or tokens in logs
- Correlation IDs for request tracking

## Future Enhancements

### Database Integration
- PostgreSQL with Prisma ORM
- Connection pooling and query optimization
- Database migrations and seeding

### Caching
- Redis for session storage and rate limiting
- Response caching for expensive operations
- CDN integration for static assets

### Advanced Monitoring
- Distributed tracing with OpenTelemetry
- Custom metrics and dashboards
- Alerting for critical errors

### Microservices
- Service decomposition as features grow
- Event-driven architecture
- API gateway for service orchestration