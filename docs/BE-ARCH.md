# Backend Architecture

## Overview

Linguamate backend is a TypeScript-based HTTP API built on **Hono** (HTTP framework) and **tRPC** (type-safe RPC), running on Node.js 18+/Bun runtime.

**Stack:**
- **Runtime:** Node 18+ / Bun
- **HTTP Server:** Hono v4.9.7
- **RPC:** tRPC v11.5.1
- **Validation:** Zod v4.1.8
- **Logging:** Pino v9.13.0
- **Monitoring:** Sentry Node v10.17.0
- **Auth:** JWT (HS256) with custom implementation

## Directory Structure

```
backend/
├── hono.ts                    # Main Hono app & middleware stack
├── logging/
│   └── pino.ts                # Structured logging with Pino
├── middleware/
│   ├── correlation.ts         # Correlation ID middleware
│   ├── rateLimit.ts           # In-memory rate limiting
│   ├── requestLogger.ts       # Request/response logging
│   ├── securityHeaders.ts     # Security headers (CSP, XSS, etc.)
│   ├── validate.ts            # Zod validation middleware
│   └── validateRequest.ts     # Legacy validation helpers
├── monitoring/
│   └── sentry.ts              # Sentry error tracking
├── routes/
│   ├── health.ts              # Health check endpoint
│   ├── ingestLogs.ts          # Client log ingestion
│   ├── stt.ts                 # Speech-to-text proxy
│   └── toolkitProxy.ts        # External toolkit API proxy
├── trpc/
│   ├── app-router.ts          # Main tRPC router
│   ├── create-context.ts      # tRPC context & auth middleware
│   └── routes/
│       ├── analytics/         # Analytics & tracking
│       ├── auth/              # Authentication & user management
│       ├── chat/              # AI chat & translation
│       ├── dialogue/          # Dialogue system
│       ├── leaderboard/       # User rankings
│       ├── learn/             # Learning content
│       ├── lessons/           # Lesson management
│       ├── preferences/       # User preferences
│       └── user/              # User profile & stats
├── validation/
│   ├── index.ts               # Validation utilities
│   ├── jwt.ts                 # JWT sign/verify
│   ├── parser.ts              # Zod parsers
│   └── sanitise.ts            # Input sanitization
└── __tests__/                 # Backend unit tests
    ├── rateLimit.test.ts
    ├── stt.validation.test.ts
    └── validation.middleware.test.ts
```

## Request Flow

```
Client Request
    ↓
[Hono Middleware Stack]
    ↓
1. Correlation ID Middleware      → Injects x-correlation-id
2. Security Headers Middleware    → Sets CSP, X-Frame-Options, etc.
3. Request Logger Middleware      → Logs request start
4. CORS Middleware                → Allows cross-origin requests
    ↓
[Route Matching]
    ↓
┌─────────────────────────────────────┐
│ /api/                               │ → Root health check
│ /api/info                           │ → API metadata
│ /api/health                         │ → Detailed health
│ /api/ingest/logs                    │ → Client log ingestion
│ /api/stt/*                          │ → Speech-to-text
│ /api/toolkit/*                      │ → External toolkit proxy
│ /api/trpc/*                         │ → tRPC router
└─────────────────────────────────────┘
    ↓
[tRPC Context Creation]
    ↓
1. Extract JWT from Authorization header
2. Verify JWT signature & expiration
3. Attach userId & sessionId to context
    ↓
[tRPC Procedure Execution]
    ↓
1. Input validation (Zod schemas)
2. Authorization check (public vs. protected)
3. Business logic (mock DB operations)
4. Response serialization (SuperJSON)
    ↓
[Response] → Client
```

## Middleware

### Global Middleware (applied to all routes)

1. **Correlation ID (`correlation.ts`)**
   - Extracts or generates `x-correlation-id` header
   - Propagates correlation ID to logs and downstream services
   - Uses crypto.randomUUID() or Math.random() fallback

2. **Security Headers (`securityHeaders.ts`)**
   - `X-Content-Type-Options: nosniff`
   - `X-Frame-Options: DENY`
   - `X-XSS-Protection: 1; mode=block`
   - `Referrer-Policy: strict-origin-when-cross-origin`
   - `Permissions-Policy: geolocation=(), microphone=(), camera=()`
   - `Strict-Transport-Security` (production only)

3. **Request Logger (`requestLogger.ts`)**
   - Logs all incoming requests with method, path, IP, correlation ID
   - Logs response status, duration, and errors

4. **CORS (`hono.ts`)**
   - ⚠️ **ISSUE:** Currently allows all origins (`origin: "*"`)
   - **TODO:** Implement production allowlist from env var

### Route-Specific Middleware

1. **Rate Limiting (`rateLimit.ts`)**
   - In-memory rate limiting by IP + route
   - Configurable window (default: 60s) and max requests (default: 30)
   - Returns 429 with `X-RateLimit-*` headers
   - ⚠️ **ISSUE:** Not suitable for multi-instance deployments
   - **TODO:** Migrate to Redis (Upstash) for distributed rate limiting

2. **Validation (`validate.ts`)**
   - Zod schema validation for body, query, params
   - Auto-sanitizes inputs via `sanitiseDeep()`
   - Returns 400 with structured error on validation failure
   - Logs validation failures as security events

## tRPC Architecture

### Context (`create-context.ts`)

```typescript
interface Context {
  req: Request;
  userId: string | null;      // Extracted from JWT
  sessionId: string | null;   // Extracted from JWT
}
```

### Procedures

- **`publicProcedure`**: No auth required
- **`protectedProcedure`**: Requires valid JWT with userId

### Error Handling

- Uses tRPC error codes: `UNAUTHORIZED`, `BAD_REQUEST`, `NOT_FOUND`, `TOO_MANY_REQUESTS`, etc.
- Zod validation errors are automatically formatted and returned in `error.data.zodError`
- SuperJSON serialization preserves Date, Map, Set, undefined, etc.

### Routers

| Router          | Procedures                                                                 | Auth       |
|-----------------|---------------------------------------------------------------------------|------------|
| `auth`          | login, signup, logout, refreshToken, verifyEmail, resetPassword, etc.     | Public     |
| `user`          | get, update, completeOnboarding, upgradeToPremium, canSendMessage         | Protected  |
| `lessons`       | getAll, getById, getUserProgress, updateProgress, generate, submit        | Protected  |
| `chat`          | getHistory, sendMessage, translate, analyzePronunciation                  | Protected  |
| `analytics`     | trackEvent, getLearningAnalytics, getLeaderboard, generateReport          | Protected  |
| `learn`         | getContent                                                                | Protected  |
| `preferences`   | get, update                                                               | Protected  |
| `leaderboard`   | get, searchUsers, getUserStats, compareUsers                              | Protected  |
| `dialogue`      | (nested router with dialogue system logic)                                | Protected  |

## External Dependencies

### Toolkit API Proxy (`/api/toolkit/*`)

- Proxies requests to external `EXPO_PUBLIC_TOOLKIT_URL` (default: https://toolkit.rork.com)
- Endpoints:
  - `/toolkit/text/llm` → Text LLM generation
  - `/toolkit/stt/transcribe` → Speech-to-text
  - `/toolkit/images/generate` → Image generation
  - `/toolkit/images/edit` → Image editing
- Features:
  - Authorization via `TOOLKIT_API_KEY` env var
  - Rate limiting (60 req/min per IP)
  - Retry logic (2 retries with exponential backoff)
  - Correlation ID propagation

### Speech-to-Text (`/api/stt/transcribe`)

- Dedicated STT endpoint with enhanced validation
- File upload (multipart/form-data)
- Max file size: 10MB
- Allowed MIME types: audio/webm, audio/m4a, audio/mp3, audio/wav, audio/mpeg, audio/ogg
- Language code validation (BCP47 format)
- Options: punctuation, formatting, alternatives, autoDetectLanguage

## Authentication & Authorization

### JWT Tokens

- **Algorithm:** HS256 (HMAC-SHA256)
- **Secret:** `process.env.JWT_SECRET` (fallback: `"dev-secret-change-me"`)
- **Payload:**
  ```typescript
  {
    sub: string;        // User ID
    sid?: string;       // Session ID
    iat: number;        // Issued at (Unix timestamp)
    exp: number;        // Expiration (Unix timestamp)
    type: 'access' | 'refresh';
  }
  ```
- **Expiration:**
  - Access tokens: 15 minutes (configurable via `expInSec`)
  - Refresh tokens: 7 days (configurable)

### Auth Flow

1. **Login:** `auth.login({ email, password })` → Returns access + refresh tokens
2. **Request:** Client sends `Authorization: Bearer <access_token>`
3. **Verification:** `verifyJwt()` checks signature + expiration
4. **Context:** `userId` and `sessionId` attached to tRPC context
5. **Protected Procedure:** `protectedProcedure` middleware throws `UNAUTHORIZED` if no userId

⚠️ **IMPORTANT:** Current implementation uses **in-memory mock storage** for users/sessions. Replace with a real database (PostgreSQL, MongoDB, etc.) before production.

## Logging

### Pino Logger (`logging/pino.ts`)

- **Levels:** TRACE, DEBUG, INFO, NOTICE, WARN, ERROR, FATAL, SECURITY
- **Transport:**
  - Development: `pino-pretty` (colorized, human-readable)
  - Production: JSON (structured logs for centralized logging)
- **Fields:**
  - `level`: Log level
  - `time`: ISO 8601 timestamp
  - `env`: NODE_ENV
  - `evt`: Event code (e.g., `SEC_INPUT_VALIDATION_FAIL`)
  - `cat`: Category (e.g., `security`, `http`)
  - `corr.correlationId`: Request correlation ID
  - `req`: Request metadata (method, path, ip)
  - `data`: Custom data

### Security Events

All security-related events are logged with `lvl: 'SECURITY'` and high visibility:
- Failed login attempts
- Rate limit exceeded
- Input validation failures
- JWT signature mismatches
- Clock skew on log ingestion

## Monitoring

### Sentry (`monitoring/sentry.ts`)

- **Initialization:** `initSentry()` (called on server start)
- **Configuration:**
  - DSN: `process.env.SENTRY_DSN`
  - Environment: `process.env.NODE_ENV`
  - Release: `process.env.GIT_COMMIT_SHA`
  - Sample rates: 20% traces, 10% profiles
- **Redaction:** Removes `authorization` and `cookie` headers before sending
- **Utilities:**
  - `withSentry(fn)`: Wraps async functions with error capturing
  - `captureException(error, context)`: Manual exception capture
  - `setUser(user)`: Attach user context to errors

## Environment Variables

| Variable                        | Required | Default                          | Description                          |
|---------------------------------|----------|----------------------------------|--------------------------------------|
| `NODE_ENV`                      | No       | `development`                    | Runtime environment                  |
| `PORT`                          | No       | `8080`                           | HTTP server port                     |
| `LOG_LEVEL`                     | No       | `INFO`                           | Pino log level                       |
| `JWT_SECRET`                    | **YES**  | `dev-secret-change-me`           | HMAC secret for JWT signing          |
| `CORS_ORIGIN`                   | No       | `*`                              | CORS allowed origins (comma-separated)|
| `RATE_LIMIT_WINDOW_MS`          | No       | `60000`                          | Rate limit window (ms)               |
| `RATE_LIMIT_MAX_REQUESTS`       | No       | `100`                            | Max requests per window              |
| `TOOLKIT_API_KEY`               | No       | (empty)                          | API key for toolkit proxy            |
| `EXPO_PUBLIC_TOOLKIT_URL`       | No       | `https://toolkit.rork.com`       | External toolkit base URL            |
| `SENTRY_DSN`                    | No       | (empty)                          | Sentry error tracking DSN            |

⚠️ **Security Note:** Never commit secrets to version control. Use `.env.example` as a template.

## Database

**Current State:** Mock in-memory storage (`Map` objects)

**Required for Production:**
- [ ] User database (PostgreSQL, MongoDB, Supabase, etc.)
- [ ] Session storage (Redis for refresh tokens)
- [ ] Connection pooling & error handling
- [ ] Migrations & schema versioning
- [ ] Read replicas for scale

## Deployment

### Hosting Options

1. **Vercel/Netlify:** Edge functions (limited to Node.js serverless)
2. **Railway/Render:** Full Node.js/Bun runtime
3. **Fly.io/AWS Fargate:** Containerized deployment
4. **Cloudflare Workers:** Edge runtime (Hono-first)

### Build

```bash
npm run backend:build   # TODO: Add this script
```

### Start

```bash
npm run backend:dev     # Development with hot reload
npm run dev:server      # Current script (bun run backend/hono.ts)
```

## Performance Considerations

- **Rate Limiting:** In-memory only; not suitable for horizontal scaling
- **Sessions:** In-memory; lost on restart
- **CORS:** Wildcard origin adds latency; use allowlist
- **Timeouts:** No global timeout on external calls (toolkit proxy has retry but no timeout)
- **Connection Pooling:** No database connection pooling (mock DB)

## Security Hardening Checklist

- [ ] **CORS:** Replace `origin: "*"` with production allowlist
- [ ] **Rate Limiting:** Migrate to Redis/Upstash for distributed rate limiting
- [ ] **Secrets:** Rotate JWT_SECRET and use strong random value (32+ bytes)
- [ ] **HTTPS:** Enforce HTTPS in production (HSTS header already set)
- [ ] **Input Validation:** All endpoints use Zod schemas ✅
- [ ] **Request Timeouts:** Add global timeout middleware (30s max)
- [ ] **Database:** Replace mock storage with real DB + prepared statements
- [ ] **Audit Logs:** Persist security events to separate audit log store

## Next Steps

1. **Database Integration:** Replace mock storage
2. **Distributed Rate Limiting:** Use Redis
3. **OpenAPI/tRPC Docs:** Generate API documentation
4. **Health Endpoint:** Add build SHA, uptime, dependencies status
5. **Circuit Breaker:** Add circuit breaker for external calls
6. **Metrics:** Export Prometheus metrics (request count, duration, errors)
7. **CI/CD:** Add backend-specific tests, linting, typecheck to CI

---

**Last Updated:** 2025-10-06  
**Maintainer:** Backend Team
