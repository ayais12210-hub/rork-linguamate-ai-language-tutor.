# Backend Operations

## Environments
- Local: run `npm run backend:dev` (served by Bun directly)
- Staging/Prod: mount `backend/hono.ts` under `/api` with platform adapter; set `ALLOWED_ORIGINS`, `JWT_SECRET`, `TOOLKIT_API_KEY`

## Health & Info
- `/api` returns status and timestamps
- `/api/info` returns version, environment, and endpoint map

## Config
- `.env.example` documents variables. Never commit real secrets.
- Request tuning: `REQUEST_TIMEOUT_MS`, retries, backoff, and circuit-breaker params

## Rate Limiting
- In-memory; for multi-instance use Redis/Upstash. Tune `RATE_LIMIT_*`.

## Logs
- Pino structured logs; redact PII via `modules/logging` helpers; set `LOG_LEVEL`

## Common Failures
- 429s from upstream: increase backoff or retries; verify API key
- CORS blocked in prod: update `ALLOWED_ORIGINS`
- Circuit open: check upstream health; breaker auto-resets after cooldown
