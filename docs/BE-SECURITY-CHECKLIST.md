# Backend Security Checklist

## Overview

This checklist ensures all backend code follows security best practices before deployment.

## Pre-Deployment Checklist

### Authentication & Authorization

- [ ] **JWT Secret:** Strong random value (64+ bytes), not committed to git
- [ ] **Token Expiration:** Access tokens expire within 15 minutes
- [ ] **Refresh Tokens:** Stored securely, expire within 7 days, rotated on use
- [ ] **Password Hashing:** Use bcrypt/argon2 (not simple hash)
- [ ] **Session Management:** Sessions invalidated on logout
- [ ] **Multi-Factor Auth:** Implemented for sensitive operations
- [ ] **Brute Force Protection:** Rate limiting on login endpoint
- [ ] **Account Lockout:** Lock account after N failed attempts
- [ ] **Protected Procedures:** All sensitive endpoints require auth

### Input Validation

- [ ] **Zod Schemas:** All inputs validated with Zod
- [ ] **Whitelist Validation:** Accept only known-good values
- [ ] **Length Limits:** Max length on all string inputs
- [ ] **Type Safety:** TypeScript strict mode enabled
- [ ] **Sanitization:** All inputs sanitized before processing
- [ ] **File Uploads:** Validate MIME type, size, extension
- [ ] **SQL Injection:** Use parameterized queries (when DB implemented)
- [ ] **NoSQL Injection:** Validate MongoDB queries (if applicable)
- [ ] **XSS Prevention:** Sanitize HTML, escape output
- [ ] **Command Injection:** Never pass user input to `exec()`

### Output Encoding

- [ ] **Error Messages:** Generic messages to clients (no stack traces)
- [ ] **Logging:** Sensitive data (passwords, tokens) redacted
- [ ] **API Responses:** Consistent error format
- [ ] **Content-Type:** Always set correct Content-Type header
- [ ] **JSON Responses:** Use `c.json()`, not string concatenation

### Network Security

- [ ] **HTTPS:** Enforce HTTPS in production (HSTS header)
- [ ] **CORS:** Allowlist specific origins (not "*")
- [ ] **CSRF:** CSRF tokens on state-changing operations (if cookie auth)
- [ ] **Rate Limiting:** Applied to all public endpoints
- [ ] **DDoS Protection:** Cloudflare or similar in front of API
- [ ] **IP Allowlist:** Restrict admin endpoints to known IPs
- [ ] **Request Timeouts:** Global timeout (30s max)
- [ ] **Body Size Limit:** Max request body size (10MB)

### Data Protection

- [ ] **Encryption at Rest:** Database encrypted
- [ ] **Encryption in Transit:** TLS 1.3 only
- [ ] **PII Handling:** Minimize collection, encrypt sensitive fields
- [ ] **Secure Cookies:** `HttpOnly`, `Secure`, `SameSite` flags
- [ ] **Secret Management:** Secrets in env vars, not code
- [ ] **Backup Encryption:** Backups encrypted at rest
- [ ] **Data Retention:** Automatic deletion per policy

### Logging & Monitoring

- [ ] **Audit Logs:** All security events logged
- [ ] **Log Redaction:** Tokens, passwords, PII redacted
- [ ] **Correlation IDs:** All requests tracked
- [ ] **Security Events:** Failed logins, auth failures, validation errors
- [ ] **Error Tracking:** Sentry or similar configured
- [ ] **Alerting:** Alerts for anomalies, errors, downtime
- [ ] **Log Retention:** Secure storage, compliant retention periods

### Third-Party Dependencies

- [ ] **Dependency Audit:** `npm audit` passes with no high/critical
- [ ] **Automated Updates:** Dependabot or Renovate enabled
- [ ] **License Compliance:** All dependencies have compatible licenses
- [ ] **SBOM:** Software Bill of Materials generated
- [ ] **Vulnerability Scanning:** Semgrep, Snyk, or similar in CI

### Code Quality

- [ ] **TypeScript:** Strict mode, no `any` types
- [ ] **ESLint:** No errors, max 0 warnings
- [ ] **Prettier:** Code formatted consistently
- [ ] **Code Review:** All PRs reviewed by 2+ engineers
- [ ] **Tests:** 80% coverage, all critical paths tested
- [ ] **Static Analysis:** Semgrep rules passing
- [ ] **Secrets Scan:** Gitleaks passing, no secrets in code

### Infrastructure

- [ ] **Least Privilege:** Service accounts have minimal permissions
- [ ] **Network Isolation:** Database not publicly accessible
- [ ] **Firewall Rules:** Only required ports open
- [ ] **Container Security:** Base images scanned, no root user
- [ ] **Secrets Storage:** Use Vault, AWS Secrets Manager, etc.
- [ ] **Access Control:** 2FA for all production access
- [ ] **Audit Logging:** All infra changes logged

## Security Controls by Layer

### Application Layer

| Control                  | Status | Implementation                     |
|--------------------------|--------|------------------------------------|
| Input Validation         | ✅     | Zod schemas on all endpoints       |
| Output Encoding          | ✅     | JSON responses, error sanitization |
| Authentication           | ⚠️     | JWT implemented, mock storage      |
| Authorization            | ✅     | Protected procedures with middleware|
| Session Management       | ⚠️     | In-memory sessions (not persistent)|
| Cryptography             | ✅     | JWT HS256, bcrypt planned          |
| Error Handling           | ✅     | tRPC error codes, safe messages    |
| Logging                  | ✅     | Pino structured logs               |
| Rate Limiting            | ⚠️     | In-memory only (not distributed)   |
| CORS                     | ❌     | Allows all origins                 |

### Network Layer

| Control                  | Status | Implementation                     |
|--------------------------|--------|------------------------------------|
| HTTPS/TLS                | ✅     | HSTS header in production          |
| CORS                     | ❌     | Needs production allowlist         |
| Request Timeout          | ❌     | Not implemented                    |
| Body Size Limit          | ❌     | Not implemented                    |
| Security Headers         | ✅     | CSP, X-Frame-Options, etc.         |

### Data Layer

| Control                  | Status | Implementation                     |
|--------------------------|--------|------------------------------------|
| Database Encryption      | N/A    | No database yet (mock storage)     |
| Backup Encryption        | N/A    | No backups yet                     |
| Data Sanitization        | ✅     | sanitiseDeep() on all inputs       |
| PII Protection           | ⚠️     | Logs redact auth headers           |

## OWASP Top 10 Mitigation

### A01:2021 – Broken Access Control

- [x] Protected procedures require valid JWT
- [x] Authorization checks on sensitive operations
- [ ] **TODO:** Role-based access control (RBAC)
- [ ] **TODO:** Resource-level permissions

### A02:2021 – Cryptographic Failures

- [x] JWT signatures use HS256
- [ ] **TODO:** Use bcrypt/argon2 for password hashing (currently mock hash)
- [x] HTTPS enforced via HSTS header
- [ ] **TODO:** Encrypt sensitive fields in database

### A03:2021 – Injection

- [x] Zod validation on all inputs
- [x] Input sanitization via sanitiseDeep()
- [ ] **TODO:** Parameterized queries (when DB implemented)
- [x] No user input in eval() or exec()

### A04:2021 – Insecure Design

- [x] Rate limiting on auth endpoints
- [x] Security event logging
- [ ] **TODO:** Circuit breaker for external calls
- [ ] **TODO:** Graceful degradation

### A05:2021 – Security Misconfiguration

- [x] Security headers configured
- [ ] **TODO:** CORS allowlist (currently allows all)
- [x] Secrets in environment variables
- [x] Error messages don't leak internals

### A06:2021 – Vulnerable and Outdated Components

- [x] Dependabot enabled
- [x] `npm audit` in CI
- [x] Semgrep scanning
- [ ] **TODO:** Automated dependency updates

### A07:2021 – Identification and Authentication Failures

- [x] JWT expiration enforced
- [x] Brute force protection (rate limiting)
- [ ] **TODO:** Account lockout after N failed attempts
- [ ] **TODO:** Multi-factor authentication

### A08:2021 – Software and Data Integrity Failures

- [x] HMAC signature on log ingestion
- [x] Clock skew check on signed requests
- [ ] **TODO:** Subresource Integrity (SRI) for CDN assets
- [ ] **TODO:** Code signing for releases

### A09:2021 – Security Logging and Monitoring Failures

- [x] Structured logging with Pino
- [x] Security events logged with high severity
- [x] Sentry error tracking
- [ ] **TODO:** Alerting on security anomalies
- [ ] **TODO:** Security dashboard

### A10:2021 – Server-Side Request Forgery (SSRF)

- [x] External URLs validated (toolkit proxy)
- [ ] **TODO:** Allowlist of external domains
- [ ] **TODO:** Network egress filtering
- [x] No user-controlled redirect URLs

## Common Vulnerabilities

### SQL Injection ✅

**Status:** Not applicable (no database yet)

**When Implemented:**
```typescript
// ✅ Good: Parameterized query
db.query('SELECT * FROM users WHERE id = $1', [userId]);

// ❌ Bad: String concatenation
db.query(`SELECT * FROM users WHERE id = '${userId}'`);
```

### XSS (Cross-Site Scripting) ✅

**Status:** Mitigated

**Current:**
- Input sanitization via `sanitiseHTML()`
- Output is JSON (not HTML)
- Security headers: `X-XSS-Protection`, `Content-Security-Policy`

### CSRF (Cross-Site Request Forgery) ⚠️

**Status:** Partially mitigated

**Current:**
- JWT in Authorization header (not cookie) → Not vulnerable to CSRF

**If Using Cookies:**
- [ ] Implement CSRF tokens
- [ ] `SameSite=Strict` cookie attribute

### Brute Force ✅

**Status:** Mitigated

**Current:**
- Rate limiting on login endpoint
- Security event logging

**TODO:**
- [ ] Account lockout after N failed attempts
- [ ] CAPTCHA after 3 failed attempts

### Session Hijacking ⚠️

**Status:** Partially mitigated

**Current:**
- JWT stored in Authorization header (not localStorage)
- Short expiration (15 minutes)

**TODO:**
- [ ] Bind session to IP address
- [ ] Device fingerprinting
- [ ] Rotate session on privilege escalation

## Incident Response

### Security Event Detected

1. **Identify:** Review security logs, correlation ID
2. **Contain:** Block IP, revoke tokens, disable feature
3. **Investigate:** Analyze logs, traces, database
4. **Remediate:** Fix vulnerability, deploy patch
5. **Notify:** Security team, affected users (if breach)
6. **Document:** Post-mortem, lessons learned

### Data Breach

1. **Assess:** Scope, affected users, data exposed
2. **Contain:** Revoke access, patch vulnerability
3. **Notify:** Legal, compliance, users (per GDPR)
4. **Investigate:** Root cause, timeline, attack vector
5. **Remediate:** Fix, harden, audit similar code
6. **Report:** Regulators (within 72h if GDPR)

## Compliance

### GDPR

- [ ] Data inventory (what PII we collect)
- [ ] Privacy policy published
- [ ] User consent for data collection
- [ ] Right to access (export user data)
- [ ] Right to deletion (delete user account)
- [ ] Data breach notification (within 72h)

### SOC 2

- [ ] Access logs retained 1 year
- [ ] Encryption at rest and in transit
- [ ] Audit trail for all changes
- [ ] Background checks for engineers
- [ ] Incident response plan documented

## Regular Security Tasks

### Weekly

- [ ] Review security logs for anomalies
- [ ] Check failed login attempts
- [ ] Review rate limit hits

### Monthly

- [ ] `npm audit` and update dependencies
- [ ] Review access control policies
- [ ] Test backup restore

### Quarterly

- [ ] Penetration testing
- [ ] Security training for team
- [ ] Review and update security policies
- [ ] Rotate secrets (JWT_SECRET, API keys)

### Annually

- [ ] External security audit
- [ ] Compliance audit (GDPR, SOC 2)
- [ ] Disaster recovery drill

---

**Last Updated:** 2025-10-06  
**Maintainer:** Security Team
