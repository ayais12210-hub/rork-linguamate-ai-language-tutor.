# Backend Security Checklist

## Overview

This checklist ensures the Linguamate backend follows security best practices and maintains a strong security posture. Use this for security reviews, audits, and deployment verification.

## ✅ Authentication & Authorization

### JWT Security
- [ ] **Strong JWT Secret**: Minimum 32 characters, cryptographically random
  ```bash
  # Generate secure secret
  openssl rand -base64 32
  ```
- [ ] **Token Expiration**: Access tokens expire within 1 hour
- [ ] **Refresh Token Rotation**: Refresh tokens are rotated on use
- [ ] **Signature Verification**: All tokens verified with HMAC-SHA256
- [ ] **No Sensitive Data**: Tokens contain only user ID and session ID
- [ ] **Secure Token Storage**: Client-side secure storage (not localStorage)

### Session Management
- [ ] **Session Invalidation**: Logout invalidates server-side sessions
- [ ] **Concurrent Session Limits**: Prevent unlimited concurrent sessions
- [ ] **Session Timeout**: Automatic timeout after inactivity
- [ ] **Session Hijacking Protection**: Correlation IDs and IP validation

### Password Security (Future Database Integration)
- [ ] **Strong Hashing**: bcrypt with minimum 12 rounds
- [ ] **Salt Generation**: Unique salt per password
- [ ] **Password Complexity**: Minimum requirements enforced
- [ ] **Password History**: Prevent reuse of recent passwords
- [ ] **Account Lockout**: Temporary lockout after failed attempts

## ✅ Input Validation & Sanitization

### Request Validation
- [ ] **Zod Schema Validation**: All inputs validated with Zod schemas
- [ ] **Type Safety**: TypeScript strict mode enabled
- [ ] **Size Limits**: Request body size limits enforced
- [ ] **File Upload Validation**: File type and size restrictions
- [ ] **JSON Parsing**: Safe JSON parsing with error handling

### XSS Prevention
- [ ] **Output Encoding**: All user content properly encoded
- [ ] **Content Security Policy**: CSP headers configured
- [ ] **Script Tag Filtering**: Remove/escape script tags
- [ ] **HTML Sanitization**: Clean HTML input when needed

### SQL Injection Prevention (Future)
- [ ] **Parameterized Queries**: No string concatenation in queries
- [ ] **ORM Usage**: Use Prisma or similar ORM
- [ ] **Input Escaping**: Escape special characters
- [ ] **Query Validation**: Validate query parameters

### Command Injection Prevention
- [ ] **No Shell Execution**: Avoid `exec()` and `spawn()` with user input
- [ ] **Path Validation**: Validate file paths and prevent traversal
- [ ] **Environment Variable Safety**: No user input in env vars

## ✅ Network Security

### HTTPS/TLS
- [ ] **HTTPS Enforcement**: All traffic over HTTPS in production
- [ ] **TLS Version**: Minimum TLS 1.2, prefer TLS 1.3
- [ ] **Certificate Validation**: Valid SSL certificates
- [ ] **HSTS Headers**: Strict-Transport-Security header set
- [ ] **Certificate Monitoring**: Alert on certificate expiration

### CORS Configuration
- [ ] **Specific Origins**: No wildcard (*) origins in production
- [ ] **Allowed Methods**: Only necessary HTTP methods
- [ ] **Allowed Headers**: Minimal required headers
- [ ] **Credentials Handling**: Secure credential passing
- [ ] **Preflight Caching**: Appropriate preflight cache times

### Security Headers
- [ ] **X-Content-Type-Options**: Set to `nosniff`
- [ ] **X-Frame-Options**: Set to `DENY` or `SAMEORIGIN`
- [ ] **X-XSS-Protection**: Set to `1; mode=block`
- [ ] **Referrer-Policy**: Set to `strict-origin-when-cross-origin`
- [ ] **Permissions-Policy**: Restrict dangerous features
- [ ] **Content-Security-Policy**: Comprehensive CSP policy

## ✅ Rate Limiting & DDoS Protection

### Rate Limiting
- [ ] **Global Rate Limits**: 100 requests/minute per IP
- [ ] **Auth Endpoint Limits**: 10 auth requests/minute per IP
- [ ] **Rate Limit Headers**: Proper rate limit headers in responses
- [ ] **Rate Limit Storage**: Redis for production (not in-memory)
- [ ] **Bypass for Health Checks**: Health endpoints not rate limited

### DDoS Protection
- [ ] **Request Size Limits**: Maximum request body size
- [ ] **Connection Limits**: Maximum concurrent connections
- [ ] **Timeout Configuration**: Request timeouts configured
- [ ] **Circuit Breakers**: External service circuit breakers
- [ ] **Load Balancer**: DDoS protection at infrastructure level

## ✅ Data Protection

### Sensitive Data Handling
- [ ] **Data Classification**: Identify and classify sensitive data
- [ ] **Encryption at Rest**: Sensitive data encrypted in storage
- [ ] **Encryption in Transit**: All data encrypted in transit
- [ ] **Key Management**: Secure key storage and rotation
- [ ] **Data Minimization**: Collect only necessary data

### Logging Security
- [ ] **Log Redaction**: Automatic redaction of sensitive data
- [ ] **No Passwords in Logs**: Never log passwords or tokens
- [ ] **Structured Logging**: Consistent log format
- [ ] **Log Retention**: Appropriate log retention policies
- [ ] **Log Access Control**: Restricted access to logs

### Error Handling
- [ ] **Safe Error Messages**: No sensitive data in error responses
- [ ] **Stack Trace Protection**: No stack traces in production
- [ ] **Error Logging**: Detailed errors logged server-side only
- [ ] **Correlation IDs**: Track errors without exposing internals

## ✅ External Service Security

### API Security
- [ ] **API Key Protection**: Secure storage of API keys
- [ ] **Request Signing**: Sign requests to external services
- [ ] **Timeout Configuration**: Proper timeouts for external calls
- [ ] **Retry Logic**: Secure retry mechanisms
- [ ] **Circuit Breakers**: Prevent cascade failures

### Third-Party Dependencies
- [ ] **Dependency Scanning**: Regular vulnerability scans
- [ ] **Version Pinning**: Pin dependency versions
- [ ] **License Compliance**: Check dependency licenses
- [ ] **Minimal Dependencies**: Only necessary dependencies
- [ ] **Regular Updates**: Keep dependencies updated

## ✅ Infrastructure Security

### Server Security
- [ ] **OS Hardening**: Secure server configuration
- [ ] **Firewall Rules**: Restrict network access
- [ ] **SSH Security**: Key-based SSH access only
- [ ] **User Privileges**: Principle of least privilege
- [ ] **Security Updates**: Regular security patches

### Container Security (If Applicable)
- [ ] **Base Image Security**: Use minimal, secure base images
- [ ] **Image Scanning**: Scan images for vulnerabilities
- [ ] **Non-Root User**: Run containers as non-root
- [ ] **Secret Management**: Secure secret injection
- [ ] **Resource Limits**: Set appropriate resource limits

### Environment Security
- [ ] **Environment Separation**: Separate dev/staging/prod environments
- [ ] **Secret Management**: Use secret management systems
- [ ] **Access Control**: Role-based access to environments
- [ ] **Audit Logging**: Log all administrative actions
- [ ] **Backup Security**: Secure backup storage and access

## ✅ Monitoring & Incident Response

### Security Monitoring
- [ ] **Failed Auth Monitoring**: Alert on failed authentication attempts
- [ ] **Anomaly Detection**: Detect unusual traffic patterns
- [ ] **Error Rate Monitoring**: Alert on high error rates
- [ ] **Performance Monitoring**: Monitor for performance attacks
- [ ] **Security Event Logging**: Log all security-relevant events

### Incident Response
- [ ] **Incident Response Plan**: Documented response procedures
- [ ] **Security Contacts**: Emergency contact information
- [ ] **Forensic Capabilities**: Ability to investigate incidents
- [ ] **Recovery Procedures**: Documented recovery steps
- [ ] **Communication Plan**: Incident communication procedures

### Vulnerability Management
- [ ] **Regular Security Scans**: Automated vulnerability scanning
- [ ] **Penetration Testing**: Regular pen testing
- [ ] **Bug Bounty Program**: Consider bug bounty program
- [ ] **Vulnerability Disclosure**: Responsible disclosure process
- [ ] **Patch Management**: Rapid security patch deployment

## ✅ Compliance & Governance

### Data Privacy
- [ ] **GDPR Compliance**: EU data protection compliance
- [ ] **CCPA Compliance**: California privacy law compliance
- [ ] **Data Retention**: Appropriate data retention policies
- [ ] **Right to Deletion**: User data deletion capabilities
- [ ] **Privacy Policy**: Clear privacy policy

### Security Governance
- [ ] **Security Policies**: Documented security policies
- [ ] **Security Training**: Team security awareness training
- [ ] **Code Reviews**: Security-focused code reviews
- [ ] **Security Testing**: Integrated security testing
- [ ] **Risk Assessment**: Regular security risk assessments

## ✅ Development Security

### Secure Development
- [ ] **Security by Design**: Security considered in design phase
- [ ] **Threat Modeling**: Identify and mitigate threats
- [ ] **Secure Coding Standards**: Follow secure coding practices
- [ ] **Static Analysis**: Automated static code analysis
- [ ] **Dynamic Testing**: Runtime security testing

### Code Security
- [ ] **Secret Scanning**: Scan for hardcoded secrets
- [ ] **Dependency Checking**: Check for vulnerable dependencies
- [ ] **License Scanning**: Verify dependency licenses
- [ ] **Code Quality**: Maintain high code quality standards
- [ ] **Security Linting**: Use security-focused linters

## 🔧 Security Testing Commands

### Manual Security Testing
```bash
# Test CORS configuration
curl -H "Origin: https://malicious.com" \
     -H "Access-Control-Request-Method: POST" \
     -X OPTIONS https://api.linguamate.app/api/health

# Check security headers
curl -I https://api.linguamate.app/api/health | grep -E "(X-|Strict-|Content-Security)"

# Test rate limiting
for i in {1..15}; do
  curl -s https://api.linguamate.app/api/trpc/auth.login
done

# Test JWT validation
curl -H "Authorization: Bearer invalid-token" \
     https://api.linguamate.app/api/trpc/user.get

# Test input validation
curl -X POST https://api.linguamate.app/api/trpc/auth.login \
     -H "Content-Type: application/json" \
     -d '{"email": "<script>alert(1)</script>", "password": "test"}'
```

### Automated Security Scanning
```bash
# Run Semgrep security scan
semgrep --config=p/security-audit backend/

# Dependency vulnerability scan
npm audit --audit-level=high

# Check for secrets in code
git-secrets --scan

# SSL/TLS testing
testssl.sh https://api.linguamate.app
```

## 📋 Pre-Deployment Security Checklist

Before deploying to production, verify:

- [ ] All environment variables properly configured
- [ ] JWT secret is strong and unique
- [ ] CORS origins are production domains only
- [ ] Rate limiting is enabled and configured
- [ ] Security headers are properly set
- [ ] HTTPS is enforced
- [ ] Error messages don't leak sensitive information
- [ ] Logging is configured with redaction
- [ ] Health checks are working
- [ ] External service timeouts are configured
- [ ] All tests pass including security tests
- [ ] Dependency vulnerabilities are resolved
- [ ] Security scan results are reviewed

## 🚨 Security Incident Procedures

### Immediate Response
1. **Assess Impact**: Determine scope and severity
2. **Contain Threat**: Block malicious IPs, rotate secrets
3. **Preserve Evidence**: Don't destroy logs or evidence
4. **Notify Stakeholders**: Alert security team and management
5. **Document Everything**: Keep detailed incident log

### Investigation Steps
1. **Analyze Logs**: Review access and error logs
2. **Check Integrity**: Verify system and data integrity
3. **Identify Root Cause**: Determine how breach occurred
4. **Assess Damage**: Evaluate what data was compromised
5. **Collect Evidence**: Gather forensic evidence

### Recovery Actions
1. **Patch Vulnerabilities**: Fix security issues
2. **Restore Systems**: Restore from clean backups if needed
3. **Reset Credentials**: Rotate all potentially compromised credentials
4. **Update Security Controls**: Strengthen security measures
5. **Monitor Closely**: Increased monitoring post-incident

### Post-Incident
1. **Lessons Learned**: Document what went wrong and why
2. **Update Procedures**: Improve security procedures
3. **Security Training**: Additional team training if needed
4. **Compliance Reporting**: Report to regulators if required
5. **Customer Communication**: Notify affected users if required