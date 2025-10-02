# Observability Playbook

## Table of Contents

1. [Setup](#setup)
2. [Client Integration](#client-integration)
3. [Server Integration](#server-integration)
4. [Privacy & Consent](#privacy--consent)
5. [Monitoring & Dashboards](#monitoring--dashboards)
6. [Troubleshooting](#troubleshooting)
7. [GDPR Procedures](#gdpr-procedures)

## Setup

### Prerequisites

- Node.js 20+
- Bun or npm
- SQLite (client-side)
- Optional: OpenTelemetry Collector, Loki, OpenSearch

### Installation

```bash
# Install dependencies
bun install

# Generate environment file
cp .env.example .env

# Set required secrets
# LOG_SIGNING_KEY: Generate with `openssl rand -hex 32`
```

### Environment Configuration

```bash
# Required
LOG_SIGNING_KEY=your-secret-key-here
NODE_ENV=production

# Optional transports
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
LOKI_ENDPOINT=http://localhost:3100
OPENSEARCH_ENDPOINT=http://localhost:9200
OPENSEARCH_USER=admin
OPENSEARCH_PASS=admin
```

## Client Integration

### Basic Usage

```typescript
import { useLogger } from '@/hooks/useLogger';

function MyComponent() {
  const log = useLogger();

  const handleAction = async () => {
    log.info('button_clicked', 'User clicked submit', {
      buttonId: 'submit',
      screen: 'profile'
    });

    try {
      await submitForm();
      log.notice('form_submitted', 'Form submitted successfully');
    } catch (error) {
      log.error('form_error', 'Form submission failed', {
        error: error.message
      });
    }
  };

  return <Button onPress={handleAction}>Submit</Button>;
}
```

### Security Events

```typescript
import { useSecurityTelemetry } from '@/hooks/useSecurityTelemetry';

function LoginScreen() {
  const security = useSecurityTelemetry();

  const handleLogin = async (email: string, password: string) => {
    try {
      await login(email, password);
    } catch (error) {
      if (error.code === 'INVALID_CREDENTIALS') {
        security.logAuthFailure('SEC_AUTH_INVALID_CREDENTIALS', {
          email: email, // Will be redacted automatically
          attempts: failedAttempts
        });
      }
    }
  };
}
```

### Correlation Context

```typescript
import { withCorrelation } from '@/modules/logging/context';

// Wrap navigation handlers
const handleNavigate = withCorrelation((screen: string) => {
  navigation.navigate(screen);
});

// Wrap API calls
const fetchData = withCorrelation(async () => {
  const response = await api.get('/data');
  return response.data;
});
```

### Offline Queue

The client automatically queues logs when offline and flushes when connectivity returns.

Configuration:
```typescript
// modules/logging/queue.ts
const QUEUE_CONFIG = {
  maxSize: 1000,           // Max queued items
  maxBatchSize: 200,       // Items per flush
  maxBatchBytes: 200_000,  // Bytes per flush
  retryAttempts: 5,
  backoffBase: 1000,       // 1s base
  backoffMax: 300_000,     // 5min cap
  jitterPercent: 15
};
```

## Server Integration

### Middleware Setup

```typescript
import { createLogger } from './logging/pino';
import { correlationMiddleware } from './middleware/correlation';
import { requestLoggerMiddleware } from './middleware/requestLogger';
import { rateLimitMiddleware } from './middleware/rateLimit';

const logger = createLogger();

app.use(correlationMiddleware);
app.use(requestLoggerMiddleware(logger));
app.use(rateLimitMiddleware);
```

### Logging in Routes

```typescript
import { getLogger } from './logging/pino';

app.post('/api/lessons', async (req, res) => {
  const log = getLogger();
  
  log.info({
    evt: 'lesson_created',
    userId: req.user.id,
    lessonId: lesson.id
  }, 'Lesson created');

  try {
    const lesson = await createLesson(req.body);
    res.json(lesson);
  } catch (error) {
    log.error({
      evt: 'lesson_create_error',
      error: error.message,
      stack: error.stack
    }, 'Failed to create lesson');
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

### Security Logging

```typescript
import { logSecurityEvent } from './logging/pino';

// Rate limit exceeded
logSecurityEvent('SEC_RATE_LIMIT_TRIPPED', {
  ip: req.ip,
  path: req.path,
  limit: 100
});

// Invalid token
logSecurityEvent('SEC_AUTH_TOKEN_INVALID', {
  tokenType: 'JWT',
  reason: 'expired'
});

// Permission denied
logSecurityEvent('SEC_PRIV_ESCALATION_DENIED', {
  userId: req.user.id,
  requestedRole: 'admin',
  currentRole: 'user'
});
```

## Privacy & Consent

### User Consent Management

Users can control telemetry via Settings:

```typescript
import { useConsent } from '@/modules/security/consent';

function TelemetrySettings() {
  const { consent, updateConsent } = useConsent();

  return (
    <Switch
      value={consent.diagnostics}
      onValueChange={(enabled) => 
        updateConsent({ diagnostics: enabled })
      }
    />
  );
}
```

### Consent Levels

1. **Security Minimum** (always enabled):
   - Authentication events
   - Security anomalies
   - Rate limiting
   - No personal identifiers

2. **Diagnostics** (opt-in):
   - Detailed error traces
   - Performance metrics
   - User journey analytics
   - Pseudonymized user IDs

### Redaction Rules

Built-in redactors:
- Email: `user@example.com` → `[REDACTED_EMAIL]`
- Phone: `+1234567890` → `[REDACTED_PHONE]`
- JWT: `eyJhbGc...` → `[REDACTED_TOKEN]`
- GPS: `{lat: 51.5, lon: -0.1}` → `[REDACTED_GPS]`
- IP: `192.168.1.1` → `sha256(ip + salt)`

Custom redaction:
```typescript
import { addRedactor } from '@/modules/logging/redactors';

addRedactor('customField', (value) => {
  if (typeof value === 'string' && value.startsWith('SECRET_')) {
    return '[REDACTED_CUSTOM]';
  }
  return value;
});
```

## Monitoring & Dashboards

### Prometheus Metrics

Scrape `/metrics` endpoint:

```yaml
scrape_configs:
  - job_name: 'linguamate-api'
    static_configs:
      - targets: ['localhost:8080']
```

### Grafana Dashboard

Import `dashboards/linguamate-observability.json` for:
- Request rate & latency
- Error rates by endpoint
- Security event timeline
- Queue health (client-side)
- Log ingestion rate

### Loki Queries

```logql
# All security events
{app="linguamate"} |= "SEC_"

# Failed logins
{app="linguamate"} | json | evt="SEC_AUTH_INVALID_CREDENTIALS"

# Errors by user
{app="linguamate"} | json | lvl="ERROR" | user_sub="abc123"

# High latency requests
{app="linguamate"} | json | duration > 1000
```

### OpenSearch Queries

```json
{
  "query": {
    "bool": {
      "must": [
        { "term": { "lvl": "SECURITY" } },
        { "range": { "ts": { "gte": "now-1h" } } }
      ]
    }
  }
}
```

## Troubleshooting

### Client Issues

**Logs not appearing:**
1. Check consent settings
2. Verify network connectivity
3. Check SQLite queue: `SELECT COUNT(*) FROM log_queue`
4. Verify HMAC key matches server

**Queue growing unbounded:**
1. Check flush worker status
2. Verify server `/ingest/logs` is reachable
3. Check for signature mismatches in server logs

### Server Issues

**High ingestion latency:**
1. Check transport performance (file I/O, network)
2. Verify Zod validation isn't bottleneck
3. Consider batching to external systems

**Signature verification failures:**
1. Verify `LOG_SIGNING_KEY` matches client
2. Check clock skew (max 5 minutes)
3. Inspect rejected payloads in logs

**Disk space issues:**
1. Check retention policy
2. Verify rotation is working
3. Consider external archival (S3)

## GDPR Procedures

### Subject Access Request (SAR)

```typescript
import { subjectAccessQuery } from './services/retention';

// Retrieve all logs for a user
const logs = await subjectAccessQuery({
  subHash: 'sha256_hash_of_user_id',
  from: '2024-01-01T00:00:00Z',
  to: '2024-12-31T23:59:59Z'
});

// Export as JSON
res.json({
  subject: subHash,
  period: { from, to },
  logs: logs.map(redactForExport)
});
```

### Right to Erasure

```typescript
import { eraseSubjectLogs } from './services/retention';

// Delete all logs for a user
await eraseSubjectLogs({
  subHash: 'sha256_hash_of_user_id'
});

// Verify deletion
const remaining = await subjectAccessQuery({ subHash });
console.assert(remaining.length === 0);
```

### Data Minimization

- User IDs are hashed (SHA-256 + salt)
- IP addresses are hashed
- GPS coordinates are redacted
- Emails/phones are redacted
- Retention periods enforced by level

### Audit Trail

All GDPR operations are logged:

```typescript
log.notice('gdpr_sar_executed', 'Subject access request completed', {
  subHash,
  requestedBy: adminId,
  recordCount: logs.length
});

log.notice('gdpr_erasure_executed', 'Subject data erased', {
  subHash,
  requestedBy: adminId,
  recordsDeleted: count
});
```

## Performance Tuning

### Client

- Adjust queue flush interval: `FLUSH_INTERVAL_MS`
- Tune batch size: `MAX_BATCH_SIZE`
- Disable TRACE/DEBUG in production

### Server

- Use Pino's `pino.destination()` for async file writes
- Enable Pino's `pino.multistream()` for parallel transports
- Batch external exports (Loki, OpenSearch)
- Use connection pooling for HTTP transports

## Security Hardening

1. **Rotate LOG_SIGNING_KEY** quarterly
2. **Monitor signature failures** for tampering attempts
3. **Rate limit `/ingest/logs`** per IP and user
4. **Encrypt logs at rest** (file system encryption)
5. **TLS for all transports** (HTTPS, OTLP/gRPC with TLS)
6. **Restrict `/metrics` endpoint** to internal networks
7. **Audit access to log storage** regularly

## Support

For incidents, see [INCIDENT_RUNBOOK.md](./INCIDENT_RUNBOOK.md).

For schema reference, see [SCHEMAS.md](./SCHEMAS.md).
