# Security Review Checklist

## Secrets Management ✅
- [ ] No secrets committed to repository
- [ ] `.env` file is git-ignored
- [ ] `.env.example` documents all required keys
- [ ] Secrets are redacted in logs (configurable)
- [ ] Environment variables used for all sensitive data

## Access Control ✅
- [ ] Each server defines required scopes
- [ ] Least-privilege token recommendations documented
- [ ] Rate limiting per server
- [ ] Circuit breakers for fault tolerance
- [ ] Audit logging for all operations

## Network Security ✅
- [ ] No inbound network exposure (stdio communication)
- [ ] Outbound allowlist for production environments
- [ ] TLS/SSL for external communications
- [ ] No hardcoded URLs or endpoints

## Code Security ✅
- [ ] No `eval()` or dynamic code execution
- [ ] Input validation with Zod schemas
- [ ] No SQL injection vectors
- [ ] Proper error handling without information leakage

## Dependencies ✅
- [ ] Regular dependency updates
- [ ] No known vulnerabilities in dependencies
- [ ] Minimal dependency footprint
- [ ] Locked dependency versions

## Configuration Security ✅
- [ ] Configuration validation
- [ ] No sensitive data in config files
- [ ] Environment-specific configurations
- [ ] Secure defaults

## Monitoring & Auditing ✅
- [ ] Structured logging
- [ ] Audit trail for all operations
- [ ] Health monitoring
- [ ] Error tracking
- [ ] Performance metrics

## Deployment Security ✅
- [ ] Container security (if using Docker)
- [ ] Process isolation
- [ ] Resource limits
- [ ] Graceful shutdown handling

## Token Scopes Documentation

### GitHub MCP
- **Required**: `repo:read` (read repository access)
- **Optional**: `user:read` (read user profile)
- **Avoid**: `repo:all` (full repository access)

### Stripe MCP
- **Required**: `read:charges`, `read:customers` (read-only access)
- **Optional**: `write:charges` (if creating charges)
- **Avoid**: `admin:all` (full admin access)

### Notion MCP
- **Required**: `read:content` (read pages and databases)
- **Optional**: `write:content` (if modifying content)
- **Avoid**: `full_access` (unnecessary permissions)

### Supabase MCP
- **Required**: `anon` key for read operations
- **Optional**: `service_role` key for admin operations
- **Avoid**: Exposing service role key in client code

## Security Best Practices

1. **Principle of Least Privilege**: Only grant necessary permissions
2. **Defense in Depth**: Multiple layers of security controls
3. **Fail Secure**: Default to secure configurations
4. **Audit Everything**: Log all operations for security analysis
5. **Regular Reviews**: Periodic security assessments
6. **Incident Response**: Plan for security incidents
7. **Dependency Management**: Keep dependencies updated
8. **Configuration Management**: Secure configuration handling