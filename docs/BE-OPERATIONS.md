# Backend Operations Guide

## Overview

This guide covers operational procedures for running, monitoring, and troubleshooting the Linguamate backend in different environments.

## Environments

### Local Development

**Setup**:
```bash
# Install dependencies
bun install

# Copy environment template
cp .env.example .env

# Edit .env with local values
# Minimum required:
JWT_SECRET=local-dev-secret-minimum-32-characters-long
NODE_ENV=development

# Start backend
bun run backend:dev
```

**Ports**:
- Backend API: http://localhost:3000
- Health check: http://localhost:3000/api/health

### Staging

**Configuration**:
- URL: https://staging-api.linguamate.com
- Node.js: 20.x LTS
- Environment: `NODE_ENV=staging`

**Deployment**:
```bash
# Build and verify
bun run backend:build
bun run backend:test

# Deploy (example with PM2)
pm2 start ecosystem.staging.json
pm2 save
```

### Production

**Configuration**:
- URL: https://api.linguamate.com
- Node.js: 20.x LTS
- Environment: `NODE_ENV=production`
- Replicas: 3+ (load balanced)

**Pre-deployment Checklist**:
- [ ] All tests passing
- [ ] Security scan clean
- [ ] Environment variables set
- [ ] Database migrations run
- [ ] Feature flags configured
- [ ] Monitoring alerts configured

## Common Operations

### Starting the Backend

**Development**:
```bash
# With auto-reload
bun run backend:dev

# Without auto-reload
bun run backend/hono.ts
```

**Production**:
```bash
# Using PM2
pm2 start ecosystem.production.json

# Using systemd
sudo systemctl start linguamate-backend

# Using Docker
docker run -d \
  --name linguamate-backend \
  -p 3000:3000 \
  --env-file .env.production \
  linguamate/backend:latest
```

### Health Monitoring

**Quick Health Check**:
```bash
curl http://localhost:3000/api/health
```

**Detailed Health Check**:
```bash
curl http://localhost:3000/api/health/detailed | jq
```

**Expected Response**:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600,
  "env": "production",
  "version": "abc123",
  "checks": {
    "memory": { "status": "healthy" },
    "circuitBreakers": { "status": "healthy" },
    "environment": { "status": "healthy" }
  }
}
```

### Log Management

**Viewing Logs**:
```bash
# Development (pretty printed)
LOG_PRETTY=true bun run backend:dev

# Production (JSON)
pm2 logs linguamate-backend --json

# Filter by level
pm2 logs linguamate-backend | jq 'select(.level >= 40)'

# Search for correlation ID
pm2 logs linguamate-backend | grep "corr-id-12345"
```

**Log Levels**:
- `10` - trace (very detailed)
- `20` - debug (detailed)
- `30` - info (normal)
- `40` - warn (warnings)
- `50` - error (errors)
- `60` - fatal (critical)

### Performance Monitoring

**Key Metrics**:
1. **Response Time**: Target < 200ms p95
2. **Error Rate**: Target < 0.1%
3. **Throughput**: Monitor RPS
4. **CPU Usage**: Target < 70%
5. **Memory Usage**: Target < 80%

**Monitoring Commands**:
```bash
# CPU and Memory
pm2 monit

# API metrics
curl http://localhost:3000/api/metrics

# Circuit breaker status
curl http://localhost:3000/api/health/detailed | jq '.checks.circuitBreakers'
```

## Troubleshooting

### Common Issues

#### 1. High Memory Usage

**Symptoms**:
- Increasing memory over time
- OOM errors
- Slow responses

**Diagnosis**:
```bash
# Check memory
pm2 describe linguamate-backend | grep memory

# Heap snapshot (development)
kill -USR2 <pid>

# Check for leaks
node --inspect backend/hono.ts
```

**Solutions**:
- Check for memory leaks in code
- Increase heap size: `--max-old-space-size=2048`
- Enable memory monitoring
- Review recent code changes

#### 2. Circuit Breaker Open

**Symptoms**:
- Specific features failing fast
- "Circuit breaker is OPEN" errors

**Diagnosis**:
```bash
# Check circuit status
curl http://localhost:3000/api/health/detailed | \
  jq '.checks.circuitBreakers.details.circuits'

# Check logs for root cause
pm2 logs linguamate-backend | grep "circuit.*opened"
```

**Solutions**:
- Check downstream service health
- Review timeout settings
- Manually reset if needed
- Investigate root cause

#### 3. Rate Limiting Issues

**Symptoms**:
- 429 responses
- "Rate limit exceeded" errors

**Diagnosis**:
```bash
# Check rate limit headers
curl -I http://localhost:3000/api/health

# Monitor rate limit hits
pm2 logs linguamate-backend | grep "rate_limit"
```

**Solutions**:
- Adjust rate limits if needed
- Add IP allowlist for services
- Implement backoff in clients
- Consider Redis for distributed limiting

#### 4. Authentication Failures

**Symptoms**:
- 401 errors
- "Invalid token" messages

**Diagnosis**:
```bash
# Verify JWT secret is set
echo $JWT_SECRET | wc -c  # Should be >= 32

# Check token expiry settings
curl http://localhost:3000/api/info

# Debug specific token
jwt decode <token>
```

**Solutions**:
- Ensure JWT_SECRET is consistent
- Check token expiration
- Verify CORS configuration
- Review auth middleware

### Emergency Procedures

#### 1. Service Degradation

```bash
# 1. Enable maintenance mode
export MAINTENANCE_MODE=true

# 2. Scale down non-critical features
export FEATURE_CHAT_ENABLED=false
export FEATURE_ANALYTICS_ENABLED=false

# 3. Increase cache TTL
export CACHE_TTL_SECONDS=300

# 4. Restart with limited features
pm2 restart linguamate-backend
```

#### 2. Complete Outage

```bash
# 1. Check basic connectivity
ping api.linguamate.com
nslookup api.linguamate.com

# 2. Check service status
systemctl status linguamate-backend

# 3. Review recent deployments
git log --oneline -10

# 4. Rollback if needed
pm2 deploy production revert 1

# 5. Check dependencies
curl https://toolkit.example.com/health
```

#### 3. Security Incident

```bash
# 1. Rotate secrets immediately
export JWT_SECRET=$(openssl rand -base64 32)

# 2. Invalidate all sessions
redis-cli FLUSHDB

# 3. Enable strict mode
export SECURITY_STRICT_MODE=true

# 4. Increase logging
export LOG_LEVEL=debug

# 5. Restart service
pm2 restart linguamate-backend --update-env
```

## Maintenance Tasks

### Daily
- [ ] Check error rates in logs
- [ ] Monitor memory usage trends
- [ ] Review rate limit violations
- [ ] Verify backup completion

### Weekly
- [ ] Review performance metrics
- [ ] Check security advisories
- [ ] Update dependencies (dev)
- [ ] Test disaster recovery

### Monthly
- [ ] Full security audit
- [ ] Performance profiling
- [ ] Capacity planning review
- [ ] Documentation updates

## Scaling Considerations

### Horizontal Scaling

```bash
# PM2 Cluster Mode
pm2 start ecosystem.json -i max

# Kubernetes
kubectl scale deployment linguamate-backend --replicas=5

# Docker Swarm
docker service scale linguamate-backend=5
```

### Performance Tuning

```javascript
// ecosystem.json
{
  "apps": [{
    "name": "linguamate-backend",
    "script": "./backend/hono.ts",
    "instances": "max",
    "exec_mode": "cluster",
    "env": {
      "NODE_ENV": "production",
      "UV_THREADPOOL_SIZE": "16"
    },
    "node_args": [
      "--max-old-space-size=2048",
      "--optimize-for-size",
      "--gc-interval=100"
    ]
  }]
}
```

### Database Optimization

- Connection pooling
- Query optimization
- Index management
- Read replicas

## Monitoring Integration

### Prometheus Metrics

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'linguamate-backend'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/api/metrics'
```

### Grafana Dashboards

Key panels:
- Request rate
- Response time (p50, p95, p99)
- Error rate by endpoint
- Circuit breaker status
- Memory/CPU usage

### Alerts

```yaml
# Critical
- name: Backend Down
  condition: up == 0
  for: 1m
  
- name: High Error Rate
  condition: error_rate > 0.05
  for: 5m

# Warning  
- name: High Memory Usage
  condition: memory_usage > 0.8
  for: 10m
  
- name: Circuit Breaker Open
  condition: circuit_breaker_open > 0
  for: 5m
```

## Runbooks

### Deployment Runbook

1. **Pre-deployment**
   - Run tests: `bun run test`
   - Build: `bun run backend:build`
   - Tag release: `git tag v1.2.3`

2. **Deployment**
   - Blue-green deployment
   - Health check new instances
   - Gradual traffic shift
   - Monitor metrics

3. **Post-deployment**
   - Smoke tests
   - Monitor error rates
   - Check performance
   - Update documentation

### Rollback Runbook

1. **Identify Issue**
   - Check metrics/alerts
   - Review error logs
   - Confirm rollback needed

2. **Execute Rollback**
   ```bash
   # PM2
   pm2 deploy production revert 1
   
   # Kubernetes
   kubectl rollout undo deployment linguamate-backend
   
   # Docker
   docker service update --image linguamate/backend:previous
   ```

3. **Verify**
   - Health checks passing
   - Error rates normal
   - Performance restored
   - Create incident report