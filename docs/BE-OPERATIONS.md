# Backend Operations Guide

## Overview

This guide provides operational procedures for running, monitoring, and troubleshooting the Linguamate backend in different environments.

## Environment Setup

### Local Development

#### Prerequisites
- Node.js 18+ (recommend using nvm)
- npm or bun package manager
- Git for version control

#### Quick Start
```bash
# Clone repository
git clone <repository-url>
cd linguamate

# Install dependencies
npm install --legacy-peer-deps

# Set up environment
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm run backend:dev

# Verify server is running
curl http://localhost:8080/api/health
```

#### Development Commands
```bash
# Start backend only
npm run backend:dev

# Start full stack (frontend + backend)
npm run dev:full

# Run tests
npm run backend:test

# Type checking
npm run backend:typecheck

# Linting
npm run backend:lint

# Build for production
npm run backend:build
```

### Staging Environment

#### Deployment
```bash
# Build application
npm run backend:build

# Set production environment variables
export NODE_ENV=staging
export JWT_SECRET=<secure-staging-secret>
export CORS_ORIGIN=https://staging.linguamate.app

# Start server
node dist/backend/hono.js
```

#### Health Checks
```bash
# Basic health check
curl https://staging-api.linguamate.app/api/health

# Detailed health check
curl https://staging-api.linguamate.app/api/health/detailed

# Readiness probe
curl https://staging-api.linguamate.app/api/ready
```

### Production Environment

#### Environment Variables
```bash
# Critical - must be set
NODE_ENV=production
JWT_SECRET=<strong-random-secret-32chars+>
CORS_ORIGIN=https://linguamate.app,https://www.linguamate.app

# Optional but recommended
APP_VERSION=1.2.3
GIT_COMMIT_SHA=abc123def456
SENTRY_DSN=<sentry-dsn>
LOG_LEVEL=info

# External services
TOOLKIT_API_KEY=<production-api-key>
EXPO_PUBLIC_TOOLKIT_URL=https://toolkit.rork.com

# Rate limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

#### Production Deployment
```bash
# Build optimized version
NODE_ENV=production npm run backend:build

# Start with process manager (PM2 recommended)
pm2 start dist/backend/hono.js --name linguamate-api

# Or with systemd service
sudo systemctl start linguamate-api
```

## Monitoring & Observability

### Health Monitoring

#### Endpoints
- **Basic Health**: `GET /api/health`
  - Response time: < 50ms
  - Memory usage information
  - Server uptime

- **Detailed Health**: `GET /api/health/detailed`
  - External dependency checks
  - Response time: < 5s
  - Returns 503 if any dependency is unhealthy

- **Readiness**: `GET /api/ready`
  - Kubernetes readiness probe
  - Checks if server can accept traffic

- **Liveness**: `GET /api/live`
  - Kubernetes liveness probe
  - Basic server responsiveness

#### Monitoring Setup
```bash
# Set up health check monitoring
curl -f https://api.linguamate.app/api/health || alert "API down"

# Monitor response times
curl -w "@curl-format.txt" https://api.linguamate.app/api/health

# Check external dependencies
curl https://api.linguamate.app/api/health/detailed | jq '.checks'
```

### Logging

#### Log Levels
- **ERROR**: System errors, failed requests, security events
- **WARN**: Degraded performance, retries, rate limiting
- **INFO**: Normal operations, successful requests
- **DEBUG**: Detailed debugging information (dev only)

#### Log Format
```json
{
  "level": "INFO",
  "time": "2024-01-01T12:00:00.000Z",
  "evt": "http_request",
  "cat": "api",
  "req": {
    "method": "POST",
    "path": "/api/trpc/auth.login",
    "status": 200,
    "duration": 150,
    "ip": "192.168.1.1"
  },
  "corr": {
    "correlationId": "uuid-123",
    "sessionId": "session-456"
  },
  "msg": "POST /api/trpc/auth.login 200 150ms"
}
```

#### Log Management
```bash
# View logs in development
npm run backend:dev | pino-pretty

# Production log aggregation
tail -f /var/log/linguamate/app.log | jq '.'

# Filter by correlation ID
grep "correlation-id-123" /var/log/linguamate/app.log

# Monitor error rates
grep '"level":"ERROR"' /var/log/linguamate/app.log | wc -l
```

### Performance Monitoring

#### Key Metrics
- **Response Time**: P50, P95, P99 percentiles
- **Request Rate**: Requests per second
- **Error Rate**: 4xx and 5xx responses
- **Memory Usage**: Heap size and growth
- **CPU Usage**: Process CPU utilization

#### Monitoring Commands
```bash
# Real-time performance monitoring
curl -s https://api.linguamate.app/api/health | jq '.memory'

# Load testing
ab -n 1000 -c 10 https://api.linguamate.app/api/health

# Memory monitoring
ps aux | grep node
top -p $(pgrep -f "backend/hono")
```

## Security Operations

### Security Monitoring

#### Failed Authentication Attempts
```bash
# Monitor failed login attempts
grep "authentication.*failed" /var/log/linguamate/app.log

# Check for brute force attacks
grep "rate.*limit.*exceeded" /var/log/linguamate/app.log | \
  awk '{print $NF}' | sort | uniq -c | sort -nr
```

#### Security Headers Verification
```bash
# Check security headers
curl -I https://api.linguamate.app/api/health | grep -E "(X-|Strict-|Content-Security)"

# Verify CORS configuration
curl -H "Origin: https://malicious.com" \
     -H "Access-Control-Request-Method: POST" \
     -X OPTIONS https://api.linguamate.app/api/health
```

#### SSL/TLS Monitoring
```bash
# Check SSL certificate
openssl s_client -connect api.linguamate.app:443 -servername api.linguamate.app

# Verify certificate expiration
echo | openssl s_client -connect api.linguamate.app:443 2>/dev/null | \
  openssl x509 -noout -dates
```

### Security Incident Response

#### Suspected Breach
1. **Immediate Actions**:
   - Rotate JWT secrets
   - Invalidate all active sessions
   - Enable additional logging
   - Block suspicious IP addresses

2. **Investigation**:
   - Check access logs for unusual patterns
   - Review authentication failures
   - Analyze error logs for injection attempts
   - Check external API usage patterns

3. **Recovery**:
   - Deploy security patches
   - Update rate limiting rules
   - Notify affected users
   - Document incident and lessons learned

## Troubleshooting

### Common Issues

#### Server Won't Start
```bash
# Check port availability
lsof -i :8080

# Verify environment variables
env | grep -E "(JWT_SECRET|NODE_ENV|PORT)"

# Check for syntax errors
npm run backend:typecheck

# Review startup logs
npm run backend:dev 2>&1 | head -20
```

#### High Memory Usage
```bash
# Check memory usage
ps aux | grep node
cat /proc/$(pgrep -f backend)/status | grep VmRSS

# Generate heap dump
kill -USR2 $(pgrep -f backend)

# Analyze heap dump
node --inspect-brk --heap-prof backend/hono.js
```

#### Slow Response Times
```bash
# Check CPU usage
top -p $(pgrep -f backend)

# Monitor request queue
curl -s https://api.linguamate.app/api/health/detailed | jq '.responseTime'

# Check external dependencies
curl -w "%{time_total}" https://toolkit.rork.com/health

# Review slow query logs
grep '"duration":[5-9][0-9][0-9][0-9]' /var/log/linguamate/app.log
```

#### Rate Limiting Issues
```bash
# Check rate limit status
curl -I https://api.linguamate.app/api/trpc/auth.login | grep -i rate-limit

# Clear rate limits (development only)
curl -X DELETE http://localhost:8080/api/admin/rate-limits

# Monitor rate limit violations
grep "rate.*limit.*exceeded" /var/log/linguamate/app.log | tail -10
```

### Error Diagnosis

#### Authentication Errors
```bash
# Check JWT token validity
echo "eyJ..." | base64 -d | jq '.'

# Verify token signature
curl -H "Authorization: Bearer <token>" \
     https://api.linguamate.app/api/trpc/user.get

# Check token expiration
node -e "console.log(new Date(1234567890 * 1000))"
```

#### External Service Errors
```bash
# Test toolkit API connectivity
curl -H "Authorization: Bearer $TOOLKIT_API_KEY" \
     https://toolkit.rork.com/health

# Check circuit breaker status
curl https://api.linguamate.app/api/health/detailed | jq '.checks.toolkit'

# Review retry attempts
grep "http_retry" /var/log/linguamate/app.log | tail -5
```

#### Database Connection Issues (Future)
```bash
# Test database connectivity
psql $DATABASE_URL -c "SELECT 1;"

# Check connection pool status
curl https://api.linguamate.app/api/health/detailed | jq '.checks.database'

# Monitor slow queries
grep '"duration":[1-9][0-9][0-9][0-9]' /var/log/linguamate/app.log
```

## Maintenance Procedures

### Regular Maintenance

#### Daily Checks
- Monitor error rates and response times
- Check disk space and memory usage
- Review security logs for anomalies
- Verify external service health

#### Weekly Tasks
- Rotate log files
- Update dependencies (security patches)
- Review performance metrics
- Clean up temporary files

#### Monthly Tasks
- Security audit and penetration testing
- Performance optimization review
- Backup and recovery testing
- Documentation updates

### Deployment Procedures

#### Zero-Downtime Deployment
```bash
# 1. Build new version
npm run backend:build

# 2. Run health checks on new build
NODE_ENV=production node dist/backend/hono.js &
sleep 5
curl -f http://localhost:8081/api/health
kill %1

# 3. Deploy with rolling update
pm2 reload linguamate-api

# 4. Verify deployment
curl -f https://api.linguamate.app/api/health
curl https://api.linguamate.app/api/info | jq '.version'
```

#### Rollback Procedure
```bash
# 1. Identify previous version
pm2 list
git log --oneline -5

# 2. Rollback to previous version
git checkout <previous-commit>
npm run backend:build
pm2 reload linguamate-api

# 3. Verify rollback
curl https://api.linguamate.app/api/info | jq '.buildSha'
```

### Backup & Recovery

#### Configuration Backup
```bash
# Backup environment configuration
cp .env .env.backup.$(date +%Y%m%d)

# Backup SSL certificates
tar -czf ssl-backup-$(date +%Y%m%d).tar.gz /etc/ssl/certs/linguamate/
```

#### Application Recovery
```bash
# Restore from backup
git checkout <stable-commit>
npm install --legacy-peer-deps
npm run backend:build

# Restore configuration
cp .env.backup.20240101 .env

# Restart services
pm2 restart linguamate-api
```

## Performance Optimization

### Response Time Optimization
- Enable HTTP/2 and compression
- Implement response caching
- Optimize database queries
- Use CDN for static assets

### Memory Optimization
- Monitor heap usage trends
- Implement memory leak detection
- Optimize object creation patterns
- Use streaming for large responses

### Scaling Strategies
- Horizontal scaling with load balancer
- Database read replicas
- Redis for session storage
- Microservice decomposition

## Alerting & Notifications

### Critical Alerts
- Server downtime (immediate)
- High error rate (> 5%)
- Memory usage (> 80%)
- Response time degradation (> 2s)

### Warning Alerts
- External service degradation
- Rate limiting threshold reached
- SSL certificate expiring (< 30 days)
- Disk space low (< 20%)

### Alert Configuration
```bash
# Example monitoring script
#!/bin/bash
HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" https://api.linguamate.app/api/health)
if [ "$HEALTH_CHECK" != "200" ]; then
  echo "API health check failed: $HEALTH_CHECK" | mail -s "API Alert" ops@linguamate.app
fi
```