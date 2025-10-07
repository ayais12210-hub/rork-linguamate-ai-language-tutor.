# Reviewer Quick Start Guide

## Prerequisites
- Node.js 20+
- pnpm 9+
- Git

## Quick Verification (2-3 minutes)

### 1. Install and Start
```bash
cd omni-mcp
pnpm install
pnpm dev
```

### 2. Test Health Endpoints
In another terminal:
```bash
curl -fsS http://localhost:3000/healthz
curl -fsS http://localhost:3000/readyz
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "servers": {}
}
```

### 3. Enable Demo Server
Create `config/local.yaml`:
```yaml
features:
  github:
    enabled: true
```

Create `.env`:
```bash
GITHUB_TOKEN=ghp_your_token_with_repo_read_only
```

Restart: `pnpm dev`

### 4. Verify Server Integration
```bash
curl -fsS http://localhost:3000/readyz
curl -fsS http://localhost:3000/servers
```

## What to Look For

### ✅ Positive Indicators
- Health endpoints return 200 OK
- Structured JSON logs in console
- No secrets in logs (redacted as `[REDACTED]`)
- Server status shows running/enabled servers
- TypeScript compilation succeeds
- ESLint passes with minimal warnings

### ❌ Red Flags
- Health endpoints return 500 errors
- Secrets visible in logs
- TypeScript compilation errors
- ESLint errors (not warnings)
- Server processes crash immediately
- Missing environment variables

## Common Issues & Solutions

### Issue: "Cannot find module" errors
**Solution**: Run `pnpm install` to ensure all dependencies are installed

### Issue: Health check fails
**Solution**: Check that required environment variables are set in `.env`

### Issue: Server won't start
**Solution**: Verify the server package is available via `npx <package-name>`

### Issue: Port already in use
**Solution**: Change `PORT` environment variable or kill existing process

## Testing Different Scenarios

### Test Feature Flags
```yaml
# config/local.yaml
features:
  github:
    enabled: true
  stripe:
    enabled: false
```

### Test Error Handling
- Remove required environment variable
- Use invalid token
- Stop a running server process

### Test Security
- Check logs for secret redaction
- Verify no secrets in configuration files
- Test with minimal token scopes

## Expected Behavior

1. **Startup**: Orchestrator starts without errors
2. **Health**: `/healthz` returns healthy status
3. **Readiness**: `/readyz` returns ready when servers are healthy
4. **Logging**: Structured JSON logs with no secrets
5. **Shutdown**: Graceful shutdown on SIGTERM/SIGINT

## Performance Expectations

- Startup time: < 5 seconds
- Health check response: < 100ms
- Memory usage: < 100MB baseline
- CPU usage: < 5% idle

## Security Verification

- [ ] No secrets in repository
- [ ] Environment variables properly loaded
- [ ] Logs redact sensitive information
- [ ] Servers use least-privilege tokens
- [ ] Network access is minimal
- [ ] Configuration validation works