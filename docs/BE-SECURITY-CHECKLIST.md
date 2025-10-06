# Backend Security Checklist

## Pre-Deployment Security Checklist

### Environment & Configuration ✓

- [ ] **JWT_SECRET** is set and >= 32 characters
- [ ] **CORS_ALLOWED_ORIGINS** explicitly configured for production
- [ ] All sensitive environment variables use secure values
- [ ] No hardcoded secrets in codebase
- [ ] `.env` files are in `.gitignore`
- [ ] Environment validation runs on startup

### Authentication & Authorization ✓

- [ ] JWT tokens expire appropriately (7d default)
- [ ] Refresh tokens implemented and secure
- [ ] Password requirements enforced (min 8 chars, complexity)
- [ ] Rate limiting on auth endpoints (5 attempts/minute)
- [ ] Account lockout after failed attempts
- [ ] Session management limits concurrent sessions

### Input Validation & Sanitization ✓

- [ ] All endpoints have Zod schema validation
- [ ] Request body size limits enforced
- [ ] File upload restrictions in place
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention via input sanitization
- [ ] Path traversal protection

### API Security ✓

- [ ] HTTPS enforced in production
- [ ] Security headers configured (HSTS, X-Frame-Options, etc.)
- [ ] API versioning strategy defined
- [ ] Rate limiting configured globally and per-route
- [ ] Request timeout protection (30s default)
- [ ] CORS properly configured (no wildcards in prod)

### Error Handling & Logging ✓

- [ ] Generic error messages for clients
- [ ] Detailed errors logged server-side only
- [ ] Sensitive data redacted from logs
- [ ] Stack traces hidden in production
- [ ] Correlation IDs for request tracking
- [ ] No PII in logs

### Data Protection ✓

- [ ] Encryption at rest for sensitive data
- [ ] Encryption in transit (TLS 1.2+)
- [ ] PII handling compliance
- [ ] Data retention policies implemented
- [ ] Secure password hashing (bcrypt/argon2)
- [ ] API keys/tokens properly stored

### Third-Party Dependencies ✓

- [ ] Dependencies audited for vulnerabilities
- [ ] Lock files committed and used
- [ ] Regular dependency updates scheduled
- [ ] License compliance verified
- [ ] Supply chain security checks
- [ ] No deprecated packages

### Infrastructure Security ✓

- [ ] Secrets management system used
- [ ] Least privilege principle applied
- [ ] Network segmentation configured
- [ ] Firewall rules restrictive
- [ ] DDoS protection enabled
- [ ] Backup encryption configured

## Development Security Practices

### Code Review Checklist

Before merging any PR:

- [ ] No hardcoded credentials
- [ ] Input validation on all user inputs
- [ ] Error messages don't leak sensitive info
- [ ] New endpoints have rate limiting
- [ ] Authentication/authorization properly implemented
- [ ] Logging doesn't include sensitive data
- [ ] Dependencies scanned for vulnerabilities

### Security Testing

- [ ] Run SAST tools (Semgrep)
- [ ] Dependency vulnerability scanning
- [ ] Penetration testing (quarterly)
- [ ] OWASP Top 10 compliance check
- [ ] API security testing
- [ ] Load testing includes security scenarios

### Incident Response

- [ ] Security incident runbook documented
- [ ] Contact list updated
- [ ] Log retention configured
- [ ] Forensics tools available
- [ ] Communication plan ready
- [ ] Post-mortem process defined

## Regular Security Tasks

### Daily
- [ ] Monitor authentication failures
- [ ] Check rate limit violations
- [ ] Review error logs for security issues
- [ ] Verify backup integrity

### Weekly
- [ ] Review access logs
- [ ] Check for unusual patterns
- [ ] Update security patches
- [ ] Audit user permissions

### Monthly
- [ ] Full dependency audit
- [ ] Security training/awareness
- [ ] Penetration test review
- [ ] Update security documentation

### Quarterly
- [ ] Comprehensive security audit
- [ ] Threat modeling review
- [ ] Disaster recovery test
- [ ] Compliance assessment

## Security Implementation Examples

### Secure Route Definition

```typescript
// ❌ Bad - No validation or protection
app.post('/api/user/update', async (c) => {
  const data = await c.req.json();
  await updateUser(data);
  return c.json({ success: true });
});

// ✅ Good - Validated, authenticated, rate-limited
app.post('/api/user/update',
  authenticate,
  rateLimit({ windowMs: 60000, max: 10 }),
  validateMiddleware({ body: UpdateUserSchema }),
  async (c) => {
    const user = c.get('user');
    const data = getValidatedBody<UpdateUserInput>(c);
    
    try {
      const updated = await updateUser(user.id, data);
      return c.json({ 
        success: true, 
        user: sanitizeUserResponse(updated) 
      });
    } catch (error) {
      logger.error({ error, userId: user.id }, 'User update failed');
      return c.json({ error: 'Update failed' }, 500);
    }
  }
);
```

### Secure External API Call

```typescript
// ❌ Bad - No protection
const response = await fetch(url);
const data = await response.json();

// ✅ Good - Circuit breaker, retry, timeout, validation
const circuitBreaker = getCircuitBreaker('external-api');
const result = await circuitBreaker.execute(async () => {
  return await retry(
    async () => {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(5000),
        headers: {
          'Authorization': `Bearer ${redactedToken}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      return ExternalApiSchema.parse(data);
    },
    { maxAttempts: 3, shouldRetry: (err) => err.status >= 500 }
  );
});
```

### Secure Logging

```typescript
// ❌ Bad - Logs sensitive data
logger.info({ 
  user: fullUserObject,
  password: req.body.password,
  token: authToken 
}, 'User login');

// ✅ Good - Redacted and safe
logger.info({ 
  userId: user.id,
  email: maskEmail(user.email),
  evt: 'user_login',
  cat: 'auth'
}, 'User login successful');
```

## Security Resources

### Tools
- **Semgrep**: Static analysis
- **OWASP ZAP**: Dynamic testing
- **Snyk**: Dependency scanning
- **GitLeaks**: Secret scanning

### References
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Checklist](https://blog.risingstack.com/node-js-security-checklist/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [CORS Security](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)

### Compliance
- GDPR (EU users)
- CCPA (California users)
- COPPA (children under 13)
- SOC 2 Type II (enterprise)

## Emergency Contacts

- **Security Team**: security@linguamate.com
- **On-Call Engineer**: Use PagerDuty
- **CTO**: For P0 incidents only
- **Legal**: For compliance issues

## Security Metrics

Track these KPIs:
- Failed authentication attempts
- Rate limit violations
- 4xx/5xx error rates
- Dependency vulnerabilities
- Time to patch critical issues
- Security training completion