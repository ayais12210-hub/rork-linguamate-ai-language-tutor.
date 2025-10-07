# Omni-MCP Server Capability Matrix

## Overview

This matrix provides a comprehensive overview of all supported MCP servers, their capabilities, configuration requirements, and operational characteristics.

## Server Registry

| Server | Purpose | Environment Variables | Required Scopes | Rate Limits | Health Check | Port |
|--------|---------|----------------------|-----------------|-------------|--------------|------|
| **firecrawl** | Web scraping & crawling | `FIRECRAWL_API_KEY` | `crawl:read` | 2 RPS, 5 burst | HTTP:3000/healthz | 3000 |
| **context7** | Redis caching & context | `UPSTASH_REDIS_REST_URL`<br/>`UPSTASH_REDIS_REST_TOKEN` | `cache:read`, `cache:write` | 5 RPS, 10 burst | HTTP:3001/healthz | 3001 |
| **supabase** | Database & auth | `SUPABASE_URL`<br/>`SUPABASE_ANON_KEY`<br/>`SUPABASE_SERVICE_ROLE_KEY` | `db:read`, `db:write` | 10 RPS, 20 burst | HTTP:3002/health | 3002 |
| **playwright** | Browser automation | `PLAYWRIGHT_BROWSERS_PATH` (opt) | `browser:launch` | 2 RPS, 4 burst | HTTP:3003/health | 3003 |
| **elevenlabs** | Text-to-speech | `ELEVENLABS_API_KEY` | `audio:generate` | 5 RPS, 10 burst | HTTP:3004/health | 3004 |
| **sentry** | Error reporting | `SENTRY_DSN` | `sentry:report` | 3 RPS, 6 burst | HTTP:3005/health | 3005 |
| **zapier** | Workflow automation | `ZAPIER_NLA_API_KEY` | `workflow:execute` | 3 RPS, 5 burst | HTTP:3006/health | 3006 |
| **notion** | Note-taking & databases | `NOTION_TOKEN`<br/>`NOTION_DATABASE_ID` (opt) | `notion:read`, `notion:write` | 3 RPS, 6 burst | HTTP:3007/health | 3007 |
| **adobe-express** | Adobe Express integration | `ADOBE_EXPRESS_API_KEY` | `adobe:express` | 2 RPS, 4 burst | HTTP:3008/health | 3008 |
| **berry-rag** | Vector DB & RAG | `BERRY_VECTOR_DB_URL`<br/>`BERRY_VECTOR_DB_TOKEN` | `rag:query` | 5 RPS, 10 burst | HTTP:3009/health | 3009 |
| **v0** | Application generation | `V0_API_KEY` | `gen:app` | 2 RPS, 4 burst | HTTP:3010/health | 3010 |
| **deepseek-r1** | DeepSeek R1 LLM | `DEEPSEEK_API_KEY` | `llm:query` | 3 RPS, 6 burst | HTTP:3011/health | 3011 |
| **qwen-max** | Qwen Max LLM | `QWEN_API_KEY` | `llm:query` | 3 RPS, 6 burst | HTTP:3012/health | 3012 |
| **grok** | Grok LLM | `GROK_API_KEY` | `llm:query` | 3 RPS, 6 burst | HTTP:3013/health | 3013 |
| **asana** | Task management | `ASANA_ACCESS_TOKEN` | `tasks:read`, `tasks:write` | 5 RPS, 10 burst | HTTP:3014/health | 3014 |
| **github** | Git repository management | `GITHUB_TOKEN` | `repo:read`, `repo:write` | 5 RPS, 10 burst | HTTP:3015/health | 3015 |
| **stripe** | Payment processing | `STRIPE_API_KEY`<br/>`STRIPE_WEBHOOK_SECRET` | `payments:read`, `payments:write` | 10 RPS, 20 burst | HTTP:3016/health | 3016 |
| **chrome-devtools** | Browser debugging | `CHROME_BIN`<br/>`CHROME_REMOTE_DEBUGGING_PORT` | `browser:debug` | 2 RPS, 4 burst | HTTP:3017/health | 3017 |
| **backup** | Data backup & restore | `BACKUP_DIR`<br/>`BACKUP_BUCKET`<br/>`BACKUP_CREDENTIALS_JSON_PATH` | `backup:read`, `backup:write` | 1 RPS, 2 burst | HTTP:3018/health | 3018 |

## Server Categories

### 🤖 **AI/LLM Services**
- **deepseek-r1**: DeepSeek R1 reasoning model
- **qwen-max**: Qwen Max language model  
- **grok**: Grok AI model integration
- **v0**: Application generation AI

### 🌐 **Web & Browser Tools**
- **firecrawl**: Web scraping and crawling
- **playwright**: Browser automation
- **chrome-devtools**: Browser debugging

### 💾 **Data & Storage**
- **supabase**: PostgreSQL database with auth
- **context7**: Redis caching layer
- **berry-rag**: Vector database and RAG
- **backup**: Data backup and restore

### 🔧 **Development & DevOps**
- **github**: Git repository management
- **sentry**: Error monitoring and reporting
- **zapier**: Workflow automation

### 💼 **Business & Productivity**
- **notion**: Note-taking and databases
- **asana**: Task and project management
- **stripe**: Payment processing
- **adobe-express**: Adobe Express integration

### 🎵 **Media & Content**
- **elevenlabs**: Text-to-speech generation

## Configuration Patterns

### **Standard Configuration Template**
```yaml
name: server-name
enabled: false
command: npx
args: ["server-package", "start"]
env:
  REQUIRED_KEY: "${REQUIRED_KEY}"
  OPTIONAL_KEY: "${OPTIONAL_KEY:-default}"
healthCheck:
  type: http
  url: "http://localhost:PORT/health"
  timeoutMs: 10000
scopes: ["scope:action"]
limits: 
  rps: 5
  burst: 10
  timeoutMs: 30000
```

### **Environment Variable Patterns**
- **API Keys**: `{SERVICE}_API_KEY`
- **URLs**: `{SERVICE}_URL`
- **Tokens**: `{SERVICE}_TOKEN` or `{SERVICE}_ACCESS_TOKEN`
- **Secrets**: `{SERVICE}_SECRET` or `{SERVICE}_WEBHOOK_SECRET`
- **Optional**: Use `${KEY:-default}` syntax

### **Health Check Types**
- **HTTP**: `type: http` with specific endpoint
- **STDIO**: `type: stdio` (default, manual verification)
- **Timeout**: Configurable per server (default: 10s)

### **Rate Limiting Patterns**
- **LLM Services**: 3 RPS, 6 burst (high latency)
- **Database Services**: 5-10 RPS, 10-20 burst
- **Browser Tools**: 2 RPS, 4 burst (resource intensive)
- **API Services**: 3-5 RPS, 5-10 burst

## Security Considerations

### **Scope Definitions**
- **Read-only**: `{service}:read`
- **Write access**: `{service}:write`
- **Specific actions**: `{service}:{action}` (e.g., `repo:push`)
- **Admin access**: `{service}:admin` (use sparingly)

### **Secret Management**
- All secrets stored in environment variables
- No hardcoded credentials in repository
- Secret redaction in logs and metrics
- Support for external secret managers (Doppler, Vault, 1Password)

### **Network Security**
- Outbound allow-list for external API calls
- Rate limiting to prevent abuse
- Circuit breakers to handle failures gracefully
- Audit logging for all operations

## Operational Characteristics

### **Startup Time**
- **Fast**: HTTP services (1-3 seconds)
- **Medium**: Database connections (3-10 seconds)
- **Slow**: Browser automation (10-30 seconds)

### **Resource Usage**
- **Low**: API clients (minimal CPU/memory)
- **Medium**: Database connections (moderate resources)
- **High**: Browser automation (significant CPU/memory)

### **Failure Modes**
- **Network**: API timeouts, connection failures
- **Authentication**: Invalid tokens, expired credentials
- **Rate Limits**: API quota exceeded
- **Resource**: Memory leaks, CPU exhaustion

## Monitoring & Observability

### **Key Metrics**
- **Health Status**: Per-server health check results
- **Response Time**: API call latency
- **Error Rate**: Failed requests percentage
- **Rate Limit**: Requests per second usage
- **Circuit Breaker**: Open/closed state

### **Logging Events**
- **Server Start**: Process spawned successfully
- **Server Stop**: Process exited (normal or error)
- **Health Change**: Health status transitions
- **Rate Limit**: Rate limit exceeded
- **Circuit Breaker**: Circuit state changes
- **Authentication**: Token validation failures

### **Alerting Thresholds**
- **Critical**: Server down for >5 minutes
- **Warning**: Health check failures >10%
- **Info**: Rate limit usage >80%
- **Debug**: Circuit breaker state changes

## Troubleshooting Guide

### **Common Issues**
1. **Server won't start**: Check environment variables and permissions
2. **Health checks failing**: Verify server is running and accessible
3. **Rate limit exceeded**: Reduce request frequency or increase limits
4. **Authentication errors**: Verify API keys and token scopes
5. **Memory issues**: Monitor resource usage and restart if needed

### **Debug Commands**
```bash
# Check server status
pnpm health

# View logs
tail -f logs/orchestrator.log

# Test specific server
curl http://localhost:PORT/health

# Check environment
env | grep SERVICE_KEY
```

### **Recovery Procedures**
1. **Restart server**: `pnpm dev` or `make reload`
2. **Clear circuit breaker**: Wait for cooldown period
3. **Reset rate limits**: Restart orchestrator
4. **Verify configuration**: Check YAML syntax and env vars
5. **Check dependencies**: Ensure all required packages installed