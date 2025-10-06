# Backend Architecture

This backend uses Hono for HTTP routing and tRPC for type-safe RPC procedures.

- Entry: `backend/hono.ts` (mounted under `/api` by host)
- Global middleware: `correlation`, `securityHeaders`, `requestLogger`
- CORS: Allow-list in production via `ALLOWED_ORIGINS`
- Routes:
  - `/` and `/info`: health and info
  - `/ingest/logs`: batched log ingestion with integrity checks
  - `/stt/*`: speech-to-text proxy and validations
  - `/toolkit/*`: upstream toolkit proxy with rate limits
  - `/trpc/*`: tRPC app router
- tRPC context: `backend/trpc/create-context.ts` (JWT verification)
- Validation: zod via middleware and per-procedure inputs
- Reliability: `backend/lib/http.ts` adds timeouts, retries, circuit breaker
- Logging: pino-based structured logs; redaction utilities in `modules/logging`
- Security: security headers, rate limits, JWT verification, input sanitization

