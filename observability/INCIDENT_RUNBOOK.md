# Incident Response Runbook

## Table of Contents

1. [Security Incidents](#security-incidents)
2. [Performance Degradation](#performance-degradation)
3. [Data Loss](#data-loss)
4. [Common Alerts](#common-alerts)
5. [Escalation](#escalation)

## Security Incidents

### SEC_AUTH_BRUTEFORCE Spike

**Alert**: Rate of brute force attempts > 20/min

**Symptoms**:
- High rate of `SEC_AUTH_BRUTEFORCE` events
- Multiple failed login attempts from same IP/user
- Potential credential stuffing attack

**Response**:

1. **Immediate** (< 5 min):
   ```bash
   # Query recent events
   curl -X POST http://opensearch:9200/logs-*/_search -d '{
     "query": {
       "bool": {
         "must": [
           { "term": { "evt": "SEC_AUTH_BRUTEFORCE" } },
           { "range": { "ts": { "gte": "now-15m" } } }
         ]
       }
     },
     "aggs": {
       "by_ip": { "terms": { "field": "req.ipHash" } }
     }
   }'
   
   # Identify attacking IPs
   # Block at firewall/WAF level
   ```

2. **Short-term** (< 30 min):
   - Enable CAPTCHA on login
   - Reduce rate limits temporarily
   - Notify affected users if accounts compromised
   - Force password reset for targeted accounts

3. **Follow-up** (< 24 hours):
   - Review authentication logs
   - Check for successful breaches
   - Update WAF rules
   - Document attack pattern
   - Post-mortem

**Prevention**:
- Implement progressive delays
- Add CAPTCHA after N failures
- Monitor for distributed attacks
- Use device fingerprinting

---

### SEC_AUTH_TOKEN_INVALID Spike

**Alert**: Rate of invalid tokens > 5/min

**Symptoms**:
- High rate of `SEC_AUTH_TOKEN_INVALID` events
- Users reporting "session expired" errors
- Potential token theft or replay attacks

**Response**:

1. **Immediate**:
   ```bash
   # Check token expiry patterns
   {app="linguamate"} | json | evt="SEC_AUTH_TOKEN_INVALID" | json reason
   
   # Look for:
   # - "expired": Normal, but high rate = clock skew or mass logout
   # - "invalid_signature": Tampering or key rotation issue
   # - "malformed": Attack or client bug
   ```

2. **If tampering suspected**:
   - Rotate JWT signing keys
   - Invalidate all sessions
   - Force re-authentication
   - Check for data breaches

3. **If clock skew**:
   - Verify NTP sync on servers
   - Adjust token expiry tolerance

4. **If client bug**:
   - Check recent app releases
   - Roll back if necessary
   - Push hotfix

**Prevention**:
- Short-lived access tokens (15 min)
- Refresh token rotation
- Token binding to device
- Monitor token reuse

---

### SEC_PAYMENT_ANOMALY

**Alert**: Payment anomaly detected

**Symptoms**:
- Unusual payment patterns
- Mismatched amounts
- Duplicate transactions
- Potential fraud

**Response**:

1. **Immediate**:
   ```bash
   # Get transaction details
   {app="linguamate"} | json | evt="SEC_PAYMENT_ANOMALY"
   ```

2. **Actions**:
   - Freeze affected transactions
   - Contact payment processor
   - Notify user via secure channel
   - Preserve evidence (logs, DB snapshots)

3. **Investigation**:
   - Review user account history
   - Check for account takeover
   - Verify payment method ownership
   - Look for patterns across users

4. **Resolution**:
   - Refund if fraudulent
   - Update fraud detection rules
   - Report to authorities if required
   - Document for compliance

**Prevention**:
- 3D Secure for cards
- Velocity checks
- Device fingerprinting
- Behavioral analytics

---

## Performance Degradation

### High Log Ingestion Latency

**Alert**: p95 ingestion latency > 500ms

**Symptoms**:
- Slow `/ingest/logs` endpoint
- Client queue growing
- Delayed log visibility

**Response**:

1. **Diagnose**:
   ```bash
   # Check transport performance
   curl http://localhost:8080/metrics | grep ingest_latency
   
   # Check disk I/O
   iostat -x 1
   
   # Check CPU
   top
   ```

2. **Quick fixes**:
   - Disable slow transports temporarily (OpenSearch, Loki)
   - Increase batch size to reduce overhead
   - Scale horizontally (add ingestion workers)

3. **Long-term**:
   - Optimize Zod validation (cache schemas)
   - Use async file writes
   - Batch external exports
   - Add caching layer (Redis)

---

### Client Queue Overflow

**Alert**: Client queue size > 1000 items

**Symptoms**:
- Logs not reaching server
- High memory usage on device
- Slow app performance

**Response**:

1. **Client-side**:
   ```typescript
   // Check queue status
   const queueSize = await getQueueSize();
   console.log('Queue size:', queueSize);
   
   // Force flush
   await flushQueue({ force: true });
   
   // Clear old items if necessary
   await clearOldQueueItems({ olderThan: Date.now() - 86400000 });
   ```

2. **Server-side**:
   - Check if `/ingest/logs` is healthy
   - Verify rate limits aren't too strict
   - Check for signature verification failures

3. **Prevention**:
   - Implement queue size limits
   - Drop low-priority logs when full
   - Increase flush frequency
   - Optimize batch size

---

## Data Loss

### Missing Logs

**Symptoms**:
- Gaps in log timeline
- Expected events not appearing
- Incomplete audit trail

**Response**:

1. **Identify scope**:
   ```bash
   # Check for gaps
   {app="linguamate"} | json | ts | sort
   
   # Check ingestion metrics
   curl http://localhost:8080/metrics | grep ingest_total
   ```

2. **Possible causes**:
   - Client queue overflow (dropped logs)
   - Server rejection (validation, signature)
   - Transport failure (disk full, network)
   - Retention policy (logs rotated)

3. **Recovery**:
   - Check client SQLite queue for unsent logs
   - Check server rejected logs (if logged)
   - Restore from backups if available
   - Document gap for compliance

4. **Prevention**:
   - Monitor queue health
   - Alert on high rejection rate
   - Implement log archival (S3)
   - Test backup/restore regularly

---

### Disk Full

**Alert**: Disk usage > 90%

**Symptoms**:
- Log writes failing
- Application errors
- Potential data loss

**Response**:

1. **Immediate**:
   ```bash
   # Check disk usage
   df -h
   
   # Find large log files
   du -sh /var/log/linguamate/* | sort -h
   
   # Emergency cleanup (if safe)
   find /var/log/linguamate -name "*.log" -mtime +7 -delete
   ```

2. **Short-term**:
   - Trigger manual rotation
   - Archive to S3/Backblaze
   - Increase disk size
   - Reduce retention periods

3. **Long-term**:
   - Implement automated archival
   - Set up disk usage alerts (80%, 90%)
   - Review retention policy
   - Consider log aggregation service

---

## Common Alerts

### Alert: BruteForceSpike

```yaml
alert: BruteForceSpike
expr: rate(sec_events_total{evt="SEC_AUTH_BRUTEFORCE"}[5m]) > 0.33
severity: critical
```

**Action**: See [SEC_AUTH_BRUTEFORCE Spike](#sec_auth_bruteforce-spike)

---

### Alert: InvalidSignatures

```yaml
alert: InvalidSignatures
expr: rate(ingest_reject_total{reason="signature_invalid"}[5m]) > 0.08
severity: warning
```

**Action**:
1. Check if `LOG_SIGNING_KEY` was rotated
2. Verify client and server keys match
3. Check for clock skew
4. Investigate potential tampering

---

### Alert: HighErrorRate

```yaml
alert: HighErrorRate
expr: rate(log_events_total{lvl="ERROR"}[5m]) > 1
severity: warning
```

**Action**:
1. Query recent errors:
   ```bash
   {app="linguamate"} | json | lvl="ERROR" | line_format "{{.evt}}: {{.msg}}"
   ```
2. Group by event type
3. Investigate root cause
4. Deploy fix or rollback

---

### Alert: QueueBacklog

```yaml
alert: QueueBacklog
expr: log_queue_size > 1000
severity: warning
```

**Action**: See [Client Queue Overflow](#client-queue-overflow)

---

## Escalation

### Severity Levels

**P0 - Critical** (< 15 min response):
- Active security breach
- Data loss in progress
- Complete service outage
- Payment fraud

**P1 - High** (< 1 hour response):
- Degraded performance
- Partial outage
- Security anomaly
- High error rate

**P2 - Medium** (< 4 hours response):
- Non-critical bugs
- Performance issues
- Configuration problems

**P3 - Low** (< 24 hours response):
- Minor issues
- Feature requests
- Documentation

### Escalation Path

1. **On-call engineer** (all severities)
2. **Team lead** (P0, P1)
3. **Engineering manager** (P0)
4. **CTO** (P0 with business impact)
5. **Legal/Compliance** (data breach, GDPR)

### Contact Information

```
On-call: PagerDuty rotation
Team Lead: Slack @team-lead
Eng Manager: Slack @eng-manager
Security: security@linguamate.ai
Legal: legal@linguamate.ai
```

### Communication

**Internal**:
- Slack #incidents channel
- Status page updates
- Post-mortem document

**External**:
- Status page (status.linguamate.ai)
- Email to affected users
- Social media (if major)

---

## Post-Incident

### Post-Mortem Template

```markdown
# Incident Post-Mortem: [Title]

**Date**: YYYY-MM-DD
**Duration**: X hours
**Severity**: P0/P1/P2/P3
**Responders**: @user1, @user2

## Summary
Brief description of what happened.

## Timeline
- HH:MM - Alert triggered
- HH:MM - Investigation started
- HH:MM - Root cause identified
- HH:MM - Fix deployed
- HH:MM - Incident resolved

## Root Cause
Technical explanation of what went wrong.

## Impact
- Users affected: X
- Downtime: X minutes
- Data loss: Yes/No
- Revenue impact: $X

## Resolution
What was done to fix it.

## Action Items
- [ ] Fix X (owner: @user, due: date)
- [ ] Improve monitoring Y (owner: @user, due: date)
- [ ] Update runbook Z (owner: @user, due: date)

## Lessons Learned
What we learned and how to prevent recurrence.
```

### Follow-up

1. Schedule post-mortem meeting (< 48 hours)
2. Document action items with owners
3. Update runbooks and alerts
4. Share learnings with team
5. Track action items to completion

---

## Tools & Resources

### Log Queries

**Loki**:
```logql
{app="linguamate"} | json | lvl="ERROR"
{app="linguamate"} |= "SEC_" | json
{app="linguamate"} | json | user_sub="abc123"
```

**OpenSearch**:
```bash
curl -X POST http://opensearch:9200/logs-*/_search -d '{
  "query": { "term": { "lvl": "ERROR" } },
  "sort": [{ "ts": "desc" }],
  "size": 100
}'
```

### Metrics

```bash
# Prometheus
curl http://localhost:8080/metrics

# Specific metric
curl http://localhost:8080/metrics | grep sec_events_total
```

### Health Checks

```bash
# Server health
curl http://localhost:8080/health

# Database
curl http://localhost:8080/health/db

# External services
curl http://localhost:8080/health/dependencies
```

---

## Training

New on-call engineers should:
1. Read this runbook
2. Review recent incidents
3. Shadow experienced engineer
4. Practice with test alerts
5. Have access to all tools

## Feedback

This runbook is a living document. Please update it after each incident with:
- New scenarios
- Improved procedures
- Better queries
- Lessons learned

Submit updates via PR to `observability/INCIDENT_RUNBOOK.md`.
