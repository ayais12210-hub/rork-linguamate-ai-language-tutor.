# Backend Security Checklist

- CORS allow-list enforced in production (no `*`) via `ALLOWED_ORIGINS`
- All external inputs validated (zod for tRPC and Hono routes)
- Central error handler returns safe messages (no stack/PII)
- JWT verified in tRPC context; protected procedures for auth-only
- Rate limiting applied for sensitive routes; headers returned
- Outbound requests: timeout, retries, exponential backoff, circuit breaker
- Logs: redact PII/secrets; avoid raw request/response bodies
- Secrets only via env (`JWT_SECRET`, `TOOLKIT_API_KEY`); never committed
- Use HTTPS; HSTS header in production
- Regular Semgrep and dependency audits in CI
