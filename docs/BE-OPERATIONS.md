# Backend Operations Guide

## Local Development

### Prerequisites

- **Node.js:** 18+ (or Bun latest)
- **Package Manager:** npm (with `--legacy-peer-deps`) or Bun
- **Environment Variables:** Copy `.env.example` to `.env` and configure

### Setup

```bash
# Install dependencies
npm install --legacy-peer-deps

# Copy environment template
cp .env.example .env

# Edit .env and set required values
nano .env
```

### Required Environment Variables

```bash
# Minimal setup for local dev
NODE_ENV=development
PORT=8080
LOG_LEVEL=debug
JWT_SECRET=local-dev-secret-change-me-in-prod
CORS_ORIGIN=http://localhost:8081,http://localhost:19006
```

### Start Backend

```bash
# Using Bun (recommended for dev speed)
bun run dev:server

# Or using npm (if bun not installed)
npm run dev:server
```

The backend will start on `http://localhost:8080`.

### Verify Backend

```bash
# Health check
curl http://localhost:8080/api/

# Expected response:
# {
#   "status": "ok",
#   "message": "Language Learning API is running",
#   "timestamp": "2025-10-06T...",
#   "version": "1.0.0"
# }
```

### Run Tests

```bash
# All tests
npm run test

# Backend tests only
npm run test -- --testPathPattern=backend

# With coverage
npm run test:ci

# Watch mode
npm run test:watch
```

### Type Checking

```bash
npm run typecheck
```

### Linting

```bash
# Check
npm run lint

# Auto-fix
npm run lint -- --fix
```

## Production Deployment

### Environment Variables (Production)

```bash
# Runtime
NODE_ENV=production
PORT=8080

# Logging
LOG_LEVEL=info
LOG_SIGNING_KEY=<strong-random-secret-32-bytes>
EXPO_PUBLIC_LOG_SIGNING_KEY=<same-as-above>

# Security
JWT_SECRET=<strong-random-secret-64-bytes>
CORS_ORIGIN=https://app.linguamate.com,https://www.linguamate.com
ALLOWED_HOSTS=linguamate.com,www.linguamate.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# External Services
TOOLKIT_API_KEY=<your-toolkit-api-key>
EXPO_PUBLIC_TOOLKIT_URL=https://toolkit.rork.com

# Monitoring
SENTRY_DSN=<your-sentry-dsn>
SENTRY_TRACES_SAMPLE_RATE=0.2
SENTRY_PROFILES_SAMPLE_RATE=0.1

# Database (when implemented)
DATABASE_URL=postgresql://user:pass@host:5432/linguamate
REDIS_URL=redis://user:pass@host:6379/0
```

### Build

**TODO:** Add backend build script

```bash
npm run backend:build
```

### Start

```bash
npm run backend:start
```

### Health Checks

Production health endpoint should include:
- Server status
- Database connectivity
- Redis connectivity
- External API status
- Build SHA / version
- Uptime

```bash
curl https://api.linguamate.com/api/health
```

## Monitoring & Observability

### Logs

**Development:**
- Human-readable logs via `pino-pretty`
- Logs to stdout

**Production:**
- Structured JSON logs
- Ship to centralized logging (Loki, OpenSearch, Datadog)
- Retention policies configured in `.env.example`

**Log Levels:**
- `TRACE`: Very verbose (disabled in prod)
- `DEBUG`: Development debugging (disabled in prod)
- `INFO`: Normal operations
- `NOTICE`: Significant events
- `WARN`: Warnings, degraded state
- `ERROR`: Errors, failures
- `FATAL`: Critical failures
- `SECURITY`: Security events (always logged)

**Key Log Fields:**
```json
{
  "level": "INFO",
  "time": "2025-10-06T12:34:56.789Z",
  "env": "production",
  "evt": "http_request",
  "cat": "http",
  "corr": {
    "correlationId": "550e8400-e29b-41d4-a716-446655440000"
  },
  "req": {
    "method": "POST",
    "path": "/api/trpc/auth.login",
    "ip": "192.168.1.1"
  },
  "data": {
    "status": 200,
    "duration": 234
  },
  "msg": "Request completed"
}
```

### Metrics

**TODO:** Add Prometheus metrics exporter

**Key Metrics:**
- Request count (by route, status, method)
- Request duration (p50, p95, p99)
- Error rate (by route, error type)
- Rate limit hits (by IP, route)
- External API calls (count, duration, errors)
- JWT verification failures
- Active sessions

### Tracing

**Sentry Traces:**
- 20% of requests sampled
- Transaction name = route path
- Spans for database queries, external calls
- User context attached to traces

**Correlation IDs:**
- Generated per request
- Propagated to all downstream services
- Included in all log messages
- Returned in `X-Correlation-ID` response header

### Alerts

**TODO:** Configure alerting rules

**Critical Alerts:**
- Error rate > 5% (P1, page on-call)
- P95 latency > 2s (P2, notify team)
- Health check failing (P1, page on-call)
- Rate limit > 80% of max (P3, investigate)
- External API down (P2, notify team)

**Warning Alerts:**
- Error rate > 1% (investigate)
- P95 latency > 1s (investigate)
- Security events spiking (investigate)

## Database Operations

**Current State:** In-memory mock storage (not suitable for production)

**Required Before Production:**

### PostgreSQL Setup

```bash
# Create database
createdb linguamate

# Run migrations (once implemented)
npm run db:migrate

# Seed data (optional)
npm run db:seed
```

### Connection Pooling

```typescript
// Use pg-pool or Prisma
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

### Backups

- Daily automated backups
- Retention: 30 days
- Point-in-time recovery enabled
- Test restore monthly

### Migrations

```bash
# Create migration
npm run db:migrate:create add_users_table

# Run migrations
npm run db:migrate:up

# Rollback
npm run db:migrate:down
```

## Common Operations

### Rotate JWT Secret

1. Generate new secret: `openssl rand -base64 64`
2. Update `JWT_SECRET` in production env
3. Restart backend servers (rolling deployment)
4. **Note:** All existing JWTs will be invalidated; users must re-login

### Clear Rate Limits

**In-Memory (current):**
- Restart server (clears all rate limits)

**Redis (future):**
```bash
redis-cli -h <host> -p <port> -a <password>
> KEYS rate:*
> DEL rate:<key>
```

### Invalidate Sessions

**In-Memory (current):**
- Restart server (clears all sessions)

**Redis (future):**
```bash
redis-cli -h <host> -p <port> -a <password>
> KEYS session:*
> DEL session:<sessionId>
```

### View Active Sessions

**TODO:** Implement session management API

```bash
# List active sessions for user
curl -H "Authorization: Bearer $TOKEN" \
  https://api.linguamate.com/api/user/sessions

# Revoke session
curl -X DELETE \
  -H "Authorization: Bearer $TOKEN" \
  https://api.linguamate.com/api/user/sessions/<sessionId>
```

## Troubleshooting

### Backend Won't Start

**Error:** `Error: JWT_SECRET is required`

**Solution:**
```bash
# Set JWT_SECRET in .env
echo 'JWT_SECRET=your-secret-here' >> .env
```

**Error:** `EADDRINUSE: address already in use`

**Solution:**
```bash
# Kill process on port 8080
lsof -ti :8080 | xargs kill -9

# Or change PORT in .env
echo 'PORT=8081' >> .env
```

### High Error Rate

**Symptoms:**
- 500 errors in logs
- Sentry alerts firing
- Users reporting failures

**Investigation:**
1. Check Sentry error details
2. Search logs for `level:ERROR` with correlation ID
3. Check external API status (toolkit, database)
4. Review recent deployments/changes

**Mitigation:**
1. Rollback to last known good version
2. Disable failing feature flag
3. Scale up servers if capacity issue
4. Contact external service if upstream issue

### Rate Limiting Too Aggressive

**Symptoms:**
- Legitimate users getting 429 errors
- `X-RateLimit-Remaining: 0` on normal usage

**Investigation:**
1. Check rate limit config in `.env`
2. Review IP addresses being rate limited
3. Check if single IP or distributed

**Mitigation:**
1. Increase `RATE_LIMIT_MAX_REQUESTS` temporarily
2. Whitelist trusted IPs (once implemented)
3. Implement user-based rate limiting (vs. IP-based)

### JWT Expiration Issues

**Symptoms:**
- Users logged out unexpectedly
- 401 errors on valid tokens

**Investigation:**
1. Check JWT expiration time (`exp` claim)
2. Verify server time is correct (NTP sync)
3. Check `JWT_SECRET` matches across instances

**Mitigation:**
1. Increase access token TTL (15min → 1hr)
2. Implement refresh token rotation
3. Check server clocks for skew

### External API Failures

**Symptoms:**
- STT transcription failing
- Toolkit API errors
- 503 errors in logs

**Investigation:**
1. Check toolkit health: `curl https://toolkit.rork.com/health`
2. Review retry logic in logs
3. Check `TOOLKIT_API_KEY` is valid

**Mitigation:**
1. Enable circuit breaker (once implemented)
2. Return cached/fallback responses
3. Contact toolkit support

### Memory Leaks

**Symptoms:**
- Memory usage growing over time
- Server becoming unresponsive
- Out of memory crashes

**Investigation:**
1. Take heap snapshot: `node --inspect`
2. Check rate limit map size (in-memory)
3. Check session map size (in-memory)
4. Review unclosed connections, timers

**Mitigation:**
1. Restart server (temporary)
2. Implement cleanup intervals (rate limits, sessions)
3. Migrate to Redis for state

## Runbooks

### Database Connection Lost

1. Check database status
2. Check network connectivity
3. Restart connection pool
4. If persistent, restart backend
5. Investigate root cause (max connections, network issue)

### High CPU Usage

1. Check for slow queries (database)
2. Check for infinite loops (code bug)
3. Check for DDoS attack (rate limiting)
4. Scale horizontally if load is legitimate

### Deployment Rollback

```bash
# Using Vercel
vercel rollback <deployment-url>

# Using Railway
railway rollback

# Using Docker
docker pull linguamate/backend:v1.2.3
docker-compose up -d
```

## Performance Optimization

### Response Time

**Target:** P95 < 500ms, P99 < 1s

**Optimizations:**
- Database indexes on frequent queries
- Connection pooling (reduce DB handshake)
- Redis caching for hot data
- Compression middleware (gzip/brotli)
- CDN for static assets

### Throughput

**Target:** 1000 req/s per instance

**Optimizations:**
- Horizontal scaling (multiple instances)
- Load balancer (sticky sessions for auth)
- Async processing (queue for heavy tasks)
- Rate limiting to prevent abuse

### Memory

**Target:** < 512MB per instance

**Optimizations:**
- Redis for sessions (not in-memory)
- Redis for rate limiting (not in-memory)
- Limit log buffering
- Periodic cleanup of stale data

## Security Operations

### Incident Response

1. **Detect:** Alerts, security logs, user reports
2. **Triage:** Severity, impact, scope
3. **Contain:** Disable feature, block IP, revoke tokens
4. **Investigate:** Logs, traces, database
5. **Remediate:** Fix vulnerability, patch, deploy
6. **Review:** Post-mortem, lessons learned

### Security Events to Monitor

- Brute force login attempts
- JWT signature failures
- SQL injection attempts
- XSS payloads in inputs
- Unusual API usage patterns
- Privilege escalation attempts

### Compliance

**GDPR:**
- User data export: `GET /api/user/export`
- User data deletion: `DELETE /api/user`
- Audit logs retention: 90 days

**SOC 2:**
- Access logs retention: 1 year
- Change logs: All deployments logged
- Encryption: TLS 1.3, JWT HS256

---

**Last Updated:** 2025-10-06  
**Maintainer:** DevOps Team
