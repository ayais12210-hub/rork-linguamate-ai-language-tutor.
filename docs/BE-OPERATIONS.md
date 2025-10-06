# Backend Operations Guide

## Overview

This guide provides operational procedures for running, monitoring, and maintaining the Linguamate AI tutor backend in different environments.

## Environment Setup

### Development Environment

#### Prerequisites
- **Bun**: Latest version (recommended)
- **Node.js**: v20+ (fallback)
- **Git**: For version control

#### Setup Steps
```bash
# Clone repository
git clone <repository-url>
cd linguamate-ai-tutor

# Install dependencies
bun install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start development server
bun run backend:dev
```

#### Development Configuration
```bash
# .env for development
NODE_ENV=development
PORT=8080
HOST=0.0.0.0
JWT_SECRET=dev-secret-key-that-is-long-enough-for-security-requirements
CORS_ORIGIN=*
LOG_LEVEL=debug
```

### Production Environment

#### Prerequisites
- **Bun**: Latest version
- **Reverse Proxy**: Nginx or similar
- **SSL Certificate**: For HTTPS
- **Monitoring**: Log aggregation and monitoring

#### Setup Steps
```bash
# Install dependencies
bun install --production

# Set up environment variables
cp .env.example .env.production
# Edit .env.production with production values

# Start production server
bun run backend:start
```

#### Production Configuration
```bash
# .env.production
NODE_ENV=production
PORT=8080
HOST=0.0.0.0
JWT_SECRET=your-secure-production-secret-here
CORS_ORIGIN=https://linguamate.app,https://www.linguamate.app
LOG_LEVEL=info
```

## Server Management

### Starting the Server

#### Development
```bash
# Start with auto-reload
bun run backend:dev

# Start with specific port
PORT=3000 bun run backend:dev

# Start with debug logging
LOG_LEVEL=debug bun run backend:dev
```

#### Production
```bash
# Start production server
bun run backend:start

# Start with PM2 (recommended)
pm2 start backend/hono.ts --name "linguamate-backend"

# Start with systemd (Linux)
sudo systemctl start linguamate-backend
```

### Stopping the Server

#### Graceful Shutdown
```bash
# Send SIGTERM signal
kill -TERM <pid>

# With PM2
pm2 stop linguamate-backend

# With systemd
sudo systemctl stop linguamate-backend
```

#### Force Shutdown
```bash
# Send SIGKILL signal
kill -KILL <pid>

# With PM2
pm2 delete linguamate-backend
```

### Restarting the Server

#### Development
```bash
# Restart with auto-reload
bun run backend:dev
```

#### Production
```bash
# Restart with PM2
pm2 restart linguamate-backend

# Restart with systemd
sudo systemctl restart linguamate-backend
```

## Health Monitoring

### Health Check Endpoints

#### Basic Health Check
```bash
# Check server status
curl http://localhost:8080/api/

# Expected response
{
  "status": "ok",
  "message": "Language Learning API is running",
  "timestamp": "2024-10-06T21:34:32.807Z",
  "version": "1.0.0"
}
```

#### Detailed Health Check
```bash
# Get detailed server info
curl http://localhost:8080/api/info

# Expected response
{
  "name": "Language Learning Backend",
  "version": "1.0.0",
  "endpoints": {
    "trpc": "/api/trpc",
    "health": "/api/",
    "info": "/api/info",
    "ingestLogs": "/api/ingest/logs"
  }
}
```

### Monitoring Commands

#### Check Server Status
```bash
# Check if server is running
ps aux | grep "bun.*hono"

# Check port usage
netstat -tlnp | grep :8080

# Check with curl
curl -f http://localhost:8080/api/ || echo "Server not responding"
```

#### Check Logs
```bash
# View recent logs
tail -f logs/backend.log

# View error logs only
grep "ERROR" logs/backend.log

# View logs with timestamps
tail -f logs/backend.log | while read line; do echo "$(date): $line"; done
```

## Troubleshooting

### Common Issues

#### 1. Server Won't Start

**Symptoms**:
- Server fails to start
- Port already in use error
- JWT secret error

**Diagnosis**:
```bash
# Check if port is in use
netstat -tlnp | grep :8080

# Check JWT secret
echo $JWT_SECRET

# Check environment variables
env | grep -E "(NODE_ENV|PORT|JWT_SECRET)"
```

**Solutions**:
```bash
# Kill process using port
sudo kill -9 $(lsof -t -i:8080)

# Set JWT secret
export JWT_SECRET="your-secure-secret-here"

# Check configuration
bun run backend:typecheck
```

#### 2. Authentication Issues

**Symptoms**:
- 401 Unauthorized errors
- JWT validation failures
- Token expired errors

**Diagnosis**:
```bash
# Check JWT secret
echo $JWT_SECRET

# Test JWT validation
node -e "
const { verifyJwt } = require('./backend/validation/jwt');
console.log(verifyJwt('your-token-here'));
"
```

**Solutions**:
```bash
# Ensure JWT secret is set
export JWT_SECRET="your-secure-secret-here"

# Restart server
bun run backend:start
```

#### 3. CORS Issues

**Symptoms**:
- CORS errors in browser
- Requests blocked by browser
- 403 Forbidden errors

**Diagnosis**:
```bash
# Check CORS configuration
echo $CORS_ORIGIN

# Test CORS headers
curl -H "Origin: https://linguamate.app" -I http://localhost:8080/api/
```

**Solutions**:
```bash
# Set CORS origin
export CORS_ORIGIN="https://linguamate.app,https://www.linguamate.app"

# Restart server
bun run backend:start
```

#### 4. Rate Limiting Issues

**Symptoms**:
- 429 Too Many Requests errors
- Requests blocked unexpectedly
- Rate limit headers missing

**Diagnosis**:
```bash
# Check rate limit configuration
grep -r "rateLimit" backend/

# Test rate limiting
for i in {1..10}; do curl http://localhost:8080/api/sensitive/data; done
```

**Solutions**:
```bash
# Clear rate limit state (development)
# Restart server to clear in-memory rate limits

# Adjust rate limit configuration
# Edit backend/hono.ts rate limit settings
```

### Performance Issues

#### High Memory Usage

**Symptoms**:
- Server using excessive memory
- Out of memory errors
- Slow response times

**Diagnosis**:
```bash
# Check memory usage
ps aux | grep "bun.*hono"

# Monitor memory over time
while true; do ps aux | grep "bun.*hono" | awk '{print $4, $6}'; sleep 5; done
```

**Solutions**:
```bash
# Restart server
bun run backend:start

# Check for memory leaks
# Review code for potential memory leaks
# Consider implementing Redis for rate limiting
```

#### Slow Response Times

**Symptoms**:
- API responses are slow
- Timeout errors
- High latency

**Diagnosis**:
```bash
# Test response times
time curl http://localhost:8080/api/

# Check server load
top -p $(pgrep -f "bun.*hono")

# Check network connectivity
ping google.com
```

**Solutions**:
```bash
# Optimize code
# Add caching
# Scale horizontally
# Check external API performance
```

## Log Management

### Log Configuration

#### Log Levels
- **ERROR**: Error conditions
- **WARN**: Warning conditions
- **INFO**: Informational messages
- **DEBUG**: Debug-level messages

#### Log Format
```json
{
  "level": "INFO",
  "time": "2024-10-06T21:34:32.807Z",
  "msg": "Request processed",
  "req": {
    "method": "GET",
    "path": "/api/",
    "url": "http://localhost:8080/api/"
  },
  "corr": {
    "correlationId": "req_123456789"
  }
}
```

### Log Rotation

#### Manual Log Rotation
```bash
# Rotate logs
mv logs/backend.log logs/backend.log.old
touch logs/backend.log

# Restart server to use new log file
bun run backend:start
```

#### Automated Log Rotation
```bash
# Install logrotate
sudo apt-get install logrotate

# Create logrotate configuration
sudo tee /etc/logrotate.d/linguamate-backend << EOF
/var/log/linguamate-backend/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        systemctl reload linguamate-backend
    endscript
}
EOF
```

## Security Operations

### Security Monitoring

#### Check Security Headers
```bash
# Test security headers
curl -I http://localhost:8080/api/

# Expected headers
# X-Content-Type-Options: nosniff
# X-Frame-Options: DENY
# X-XSS-Protection: 1; mode=block
# Referrer-Policy: strict-origin-when-cross-origin
```

#### Monitor Authentication
```bash
# Check for failed authentication attempts
grep "UNAUTHORIZED" logs/backend.log

# Check for rate limiting
grep "Rate limit exceeded" logs/backend.log
```

### Security Updates

#### Update Dependencies
```bash
# Check for outdated packages
bun outdated

# Update dependencies
bun update

# Check for security vulnerabilities
bun audit
```

#### Rotate Secrets
```bash
# Generate new JWT secret
openssl rand -base64 32

# Update environment variable
export JWT_SECRET="new-secret-here"

# Restart server
bun run backend:start
```

## Backup and Recovery

### Configuration Backup
```bash
# Backup configuration files
tar -czf config-backup-$(date +%Y%m%d).tar.gz .env* backend/

# Store backup securely
# Upload to secure storage
```

### Log Backup
```bash
# Backup logs
tar -czf logs-backup-$(date +%Y%m%d).tar.gz logs/

# Store backup securely
# Upload to secure storage
```

### Recovery Procedures
```bash
# Restore configuration
tar -xzf config-backup-20241006.tar.gz

# Restore logs
tar -xzf logs-backup-20241006.tar.gz

# Restart server
bun run backend:start
```

## Scaling Operations

### Horizontal Scaling

#### Load Balancer Configuration
```nginx
# Nginx configuration
upstream linguamate_backend {
    server 127.0.0.1:8080;
    server 127.0.0.1:8081;
    server 127.0.0.1:8082;
}

server {
    listen 80;
    server_name api.linguamate.app;
    
    location / {
        proxy_pass http://linguamate_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

#### Multiple Instances
```bash
# Start multiple instances
PORT=8080 bun run backend:start &
PORT=8081 bun run backend:start &
PORT=8082 bun run backend:start &
```

### Vertical Scaling

#### Resource Monitoring
```bash
# Monitor CPU usage
top -p $(pgrep -f "bun.*hono")

# Monitor memory usage
free -h

# Monitor disk usage
df -h
```

#### Resource Optimization
```bash
# Optimize Node.js memory
export NODE_OPTIONS="--max-old-space-size=4096"

# Optimize Bun memory
export BUN_OPTIONS="--max-old-space-size=4096"
```

## Emergency Procedures

### Server Down

#### Immediate Response
1. Check server status
2. Check logs for errors
3. Restart server
4. Verify functionality
5. Notify team

#### Commands
```bash
# Check status
ps aux | grep "bun.*hono"

# Check logs
tail -f logs/backend.log

# Restart server
bun run backend:start

# Verify
curl http://localhost:8080/api/
```

### Security Incident

#### Immediate Response
1. Isolate affected systems
2. Preserve evidence
3. Notify security team
4. Document incident
5. Implement fixes

#### Commands
```bash
# Stop server
bun run backend:start

# Check logs
grep -i "security\|error\|unauthorized" logs/backend.log

# Check configuration
cat .env

# Restart with secure configuration
bun run backend:start
```

## Maintenance Windows

### Scheduled Maintenance

#### Weekly Maintenance
- Update dependencies
- Check logs
- Verify backups
- Performance review

#### Monthly Maintenance
- Security audit
- Configuration review
- Capacity planning
- Documentation update

### Maintenance Procedures

#### Pre-Maintenance
1. Notify users
2. Backup configuration
3. Test procedures
4. Prepare rollback plan

#### During Maintenance
1. Stop server
2. Apply changes
3. Test functionality
4. Monitor performance

#### Post-Maintenance
1. Verify functionality
2. Monitor logs
3. Notify users
4. Document changes

## Contact Information

### Team Contacts
- **Backend Team**: backend@linguamate.app
- **DevOps Team**: devops@linguamate.app
- **Security Team**: security@linguamate.app

### Emergency Contacts
- **On-Call Engineer**: +1-555-0123
- **Team Lead**: +1-555-0124
- **Manager**: +1-555-0125

### Documentation
- **Architecture**: docs/BE-ARCH.md
- **Test Plan**: docs/BE-TEST-PLAN.md
- **Security**: docs/BE-SECURITY-CHECKLIST.md