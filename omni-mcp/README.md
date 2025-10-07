# Omni-MCP Framework

A production-grade MCP (Model Context Protocol) framework for orchestrating multiple MCP servers with enterprise-level reliability, security, and observability.

## Features

- 🚀 **Multi-Server Orchestration**: Manage 50+ MCP servers from a single orchestrator
- 🔒 **Security First**: Least-privilege tokens, rate limiting, circuit breakers, and audit logging
- 📊 **Observability**: OpenTelemetry traces, structured logging, and Prometheus metrics
- 🏥 **Health Monitoring**: Comprehensive health checks with automatic restart policies
- ⚡ **Feature Flags**: Enable/disable servers without code changes
- 🔧 **Developer Experience**: Hot reload, health CLI, and comprehensive tooling
- 🛡️ **Production Ready**: CI/CD pipelines, security scanning, and graceful shutdowns

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm 9+
- Git

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd omni-mcp

# Install dependencies
make install

# Set up development environment
make dev-setup

# Start development server
make up
```

### Enable Your First Server

1. Copy `.env.example` to `.env` and add your API keys
2. Edit `config/dev.yaml` to enable a server:

```yaml
features:
  github:
    enabled: true
```

3. Restart the orchestrator: `make up`

## Omni-MCP Capability Matrix

> **Legend**: HC = HealthCheck type; Limits = rps/burst/timeoutMs; Scopes are indicative least-privilege intents to document/enforce.

### Core & LLMs

| Server (name) | Purpose | Key env vars | Limits | HC | Scopes / Notes |
|---------------|---------|--------------|--------|----|----------------|
| **GitHub MCP** (github) | Repo read/ops | `GITHUB_TOKEN` | 5 / 10 / 30000 | stdio | `repo:read` |
| **Gemini Cloud Assist** (gemini-cloud-assist) | Google Gemini on GCP | `GOOGLE_PROJECT_ID`, `GOOGLE_APPLICATION_CREDENTIALS`, `GEMINI_API_KEY` | 3 / 6 / 45000 | http | `ml:invoke` |
| **Stesm Gemini MCP** (gemini) | Gemini alt | `GEMINI_API_KEY` | 3 / 6 / 45000 | http | `llm:query` |
| **DeepSeek R1** (deepseek-r1) | DeepSeek inference | `DEEPSEEK_API_KEY` | 3 / 6 / 45000 | http | `llm:query` |
| **Qwen Max** (qwen-max) | Qwen inference | `QWEN_API_KEY` | 3 / 6 / 45000 | http | `llm:query` |
| **Grok** (grok) | xAI Grok inference | `GROK_API_KEY` | 3 / 6 / 45000 | http | `llm:query` |
| **OpenRouter** (openrouter) | Multi-LLM router | `OPENROUTER_API_KEY` | 3 / 6 / 45000 | http | `llm:route` |
| **MiniMax** (minimax) | MiniMax LLMs | `MINIMAX_API_KEY` | 3 / 6 / 45000 | http | `llm:query` |
| **PPL / Perplexity MCP** (ppl-modelcontext / perplexity) | Web Q&A | `PPL_API_KEY` / `PERPLEXITY_API_KEY` | 2 / 4 / 40000 | http | `search:read` |
| **Berry RAG** (berry-rag) | Vector RAG | `BERRY_VECTOR_DB_URL`, `BERRY_VECTOR_DB_TOKEN` | 5 / 10 / 30000 | http | `rag:query` |
| **HF Space MCP** (hfspace) | HuggingFace Spaces | `HUGGINGFACE_TOKEN` | 2 / 4 / 45000 | http | `ml:invoke` |

### Data, Storage, and Backends

| Server | Purpose | Key env vars | Limits | HC | Scopes / Notes |
|--------|---------|--------------|--------|----|----------------|
| **Supabase** (supabase) | DB/Storage/Auth | `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | 10 / 20 / 30000 | http | `db:read`, `db:write` (SRK use sparingly) |
| **Neon** (neon) | Postgres serverless | `NEON_DATABASE_URL` | 10 / 20 / 30000 | http | `db:read`, `db:write` |
| **Context7 / Upstash** (context7) | KV / Redis REST | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | 5 / 10 / 25000 | http | `cache:read`, `cache:write` |
| **MCP Backup Server** (backup) | FS / cloud backup | `BACKUP_DIR` or `BACKUP_BUCKET`, `BACKUP_CREDENTIALS_JSON_PATH` | 1 / 2 / 60000 | stdio | `backup:write` |

### Automation, Browsers & Crawlers

| Server | Purpose | Key env vars | Limits | HC | Scopes / Notes |
|--------|---------|--------------|--------|----|----------------|
| **Playwright MCP** (playwright) | Headless browser | `PLAYWRIGHT_BROWSERS_PATH` | 2 / 4 / 60000 | http | `browser:launch` |
| **Chrome DevTools MCP** (chrome-devtools) | Chrome CDP control | `CHROME_BIN`, `CHROME_REMOTE_DEBUGGING_PORT` | 2 / 4 / 60000 | http | `browser:debug` |
| **Firecrawl MCP** (firecrawl) | Crawling & scrape | `FIRECRAWL_API_KEY` | 2 / 5 / 30000 | http | `crawl:read` |
| **Globalping MCP** (globalping) | Latency/diagnostics | `GLOBALPING_API_KEY` (opt) | 2 / 4 / 30000 | http | `net:probe` |

### Product & Work Management

| Server | Purpose | Key env vars | Limits | HC | Scopes / Notes |
|--------|---------|--------------|--------|----|----------------|
| **Notion MCP** (notion) | Docs/DB ops | `NOTION_TOKEN`, `NOTION_DATABASE_ID` | 3 / 6 / 30000 | http | `notion:read`, `notion:write` |
| **Asana MCP** (asana) | Tasks/PM | `ASANA_ACCESS_TOKEN` | 5 / 10 / 30000 | http | `tasks:read`, `tasks:write` |
| **Backlog MCP** (backlog, backlog-alt, backlog-manager) | Nulab Backlog | `BACKLOG_SPACE_ID`, `BACKLOG_API_KEY` | 3 / 6 / 30000 | http | `issues:*` |
| **Fast Intercom** (fast-intercom) | Intercom ops | `INTERCOM_ACCESS_TOKEN` | 3 / 6 / 30000 | http | `crm:*` |

### Payments, Ops & Integrations

| Server | Purpose | Key env vars | Limits | HC | Scopes / Notes |
|--------|---------|--------------|--------|----|----------------|
| **Stripe Agent Toolkit** (stripe) | Stripe ops | `STRIPE_API_KEY`, `STRIPE_WEBHOOK_SECRET` | 2 / 4 / 45000 | stdio | `stripe:read`, `stripe:write` |
| **alt Stripe** (atharvagupta2003/mcp-stripe) | Stripe alt | `STRIPE_API_KEY` | 2 / 4 / 45000 | stdio | Same scopes, pin version |
| **Zapier MCP** (zapier) | NLA workflows | `ZAPIER_NLA_API_KEY` | 3 / 5 / 25000 | http | `workflow:execute` |
| **Sentry MCP** (sentry) | Error ingestion | `SENTRY_DSN` | 3 / 6 / 30000 | http | `sentry:report` |
| **Windsor.ai** (windsor) | Marketing attrib | `WINDSOR_API_KEY` | 2 / 4 / 30000 | http | `analytics:read` |
| **Adobe Commerce** (CData) (adobe-commerce) | Commerce API | `ADOBE_COMMERCE_URL`, `ADOBE_COMMERCE_USERNAME`, `ADOBE_COMMERCE_PASSWORD` | 2 / 4 / 30000 | http | `commerce:*` |
| **Zapier/Integrations** (integration-app) | Generic hub | (per connector) | 2 / 4 / 30000 | http | Wrap cautiously |

### Media, Audio & Translation

| Server | Purpose | Key env vars | Limits | HC | Scopes / Notes |
|--------|---------|--------------|--------|----|----------------|
| **ElevenLabs** (elevenlabs) | TTS/voice gen | `ELEVENLABS_API_KEY` | 5 / 10 / 45000 | http | `audio:generate` |
| **Aivis Speech** (aivis-speech) | Speech I/O | `AIVIS_API_KEY` | 5 / 10 / 45000 | http | `audio:*` |
| **Audio MCP Server** (audio-mcp) | Audio tools | may use `OPENAI_API_KEY` | 3 / 6 / 45000 | http | Check model deps |
| **Audio Transcriber** (audio-transcriber) | STT | provider API key(s) | 3 / 6 / 45000 | http | `audio:transcribe` |
| **YouTube Translate MCP** (youtube-translate) | YT translate | `GOOGLE_YOUTUBE_API_KEY` | 2 / 4 / 40000 | http | `yt:read` |
| **LARA MCP** (lara) | Translation engine | `LARA_API_KEY` | 3 / 6 / 35000 | http | `translate:*` |
| **Translator-AI** (translator-ai) | Translation hub | provider keys | 3 / 6 / 35000 | http | `translate:*` |
| **AllVoiceLab** (allvoicelab) | Voice tools | provider keys | 3 / 6 / 45000 | http | `audio:*` |
| **GongRzhe Audio MCP** (audio-mcp-server) | Audio utils | provider keys | 3 / 6 / 45000 | http | `audio:*` |

### Design & Content

| Server | Purpose | Key env vars | Limits | HC | Scopes / Notes |
|--------|---------|--------------|--------|----|----------------|
| **Adobe Express MCP** (adobe-express) | Design gen | `ADOBE_EXPRESS_API_KEY` | 2 / 4 / 30000 | http | `adobe:express` |
| **v0 MCP** (v0) | App/UI gen | `V0_API_KEY` | 2 / 4 / 30000 | http | `gen:app` |
| **Startup Framework** (startup-framework) | Startup scaffolds | `STARTUP_FRAMEWORK_TOKEN` | 2 / 4 / 30000 | http | `scaffold:*` |

### Meta/Agent Infra

| Server | Purpose | Key env vars | Limits | HC | Scopes / Notes |
|--------|---------|--------------|--------|----|----------------|
| **AgentRPC** (agentrpc) | Agent bus/RPC | `AGENTRPC_TOKEN` | 5 / 10 / 30000 | http | `agent:invoke` |
| **A2A Gateway** (a2a-gateway) | Agent-to-agent | `A2A_GATEWAY_TOKEN` | 5 / 10 / 30000 | http | `agent:exchange` |
| **Microsoft MCP** (microsoft) | MS services | `AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET` | 3 / 6 / 40000 | http | `msgraph:*` |

### Notes & Guidance

- **Enablement rule**: A server is considered for boot only if `features.<name>.enabled = true` and required envs resolve non-empty.
- **Health policy**: Prefer http HC when the server exposes a `/health` or `/healthz`; otherwise default to stdio and rely on orchestrator process liveness.
- **Scopes**: Document exact vendor scopes per token in each server's YAML comment and in README (least-privilege only).
- **Rate limiting**: Defaults shown here are safe starting points; tune per vendor quotas.
- **Version pinning**: Prefer npx with pinned versions in package.json (no floating latest).
- **Outbound allow-list**: Set per server in config to restrict egress domains (especially for crawlers/browsers).

## Configuration

### Environment Variables

All configuration is done through environment variables. See `.env.example` for the complete list.

### Feature Flags

Enable/disable servers via configuration files:

```yaml
# config/dev.yaml
features:
  github:
    enabled: true
  stripe:
    enabled: false
```

### Server Configuration

Each server has its own configuration file in `servers/`:

```yaml
# servers/github.yaml
name: github
enabled: false
command: npx
args: [github-mcp-server, start]
env:
  GITHUB_TOKEN: "${GITHUB_TOKEN}"
healthCheck:
  type: stdio
  timeoutMs: 12000
scopes:
  - repo:read
limits:
  rps: 5
  burst: 10
  timeoutMs: 30000
```

## API Endpoints

### Health Endpoints

- `GET /healthz` - Overall health status
- `GET /readyz` - Readiness check (all servers healthy)
- `GET /metrics` - Prometheus metrics

### Server Management

- `GET /servers` - List all server statuses
- `GET /servers/:name` - Get specific server status

## Development

### Available Commands

```bash
# Development
make up              # Start development server
make down            # Stop development server
make dev-setup       # Set up development environment

# Testing & Quality
make test            # Run tests
make test-watch      # Run tests in watch mode
make lint            # Lint code
make typecheck       # Type check
make fmt             # Format code

# Health & Monitoring
make health          # Run health checks
make health-ci       # Run health checks in CI mode
make status          # Show server status
make health-status   # Show health status
make metrics         # Show metrics

# Utilities
make clean           # Clean build artifacts
make enable-server SERVER=github  # Show how to enable a server
```

### Registry Manifest & Generator

Omni-MCP uses a manifest-driven approach for server management. The `servers/servers.manifest.json` file contains metadata for all supported MCP servers, and the scaffolder generates configuration files automatically.

#### Adding a New Server

1. Add entry to `servers/servers.manifest.json`:

```json
{
  "name": "my-server",
  "pkg": "my-mcp-server",
  "envKeys": ["MY_API_KEY"],
  "probe": {
    "type": "stdio",
    "timeoutMs": 10000
  }
}
```

2. Run the scaffolder to generate files:

```bash
pnpm tsx scripts/scaffold-servers.ts
```

3. Copy `.env.example` to `.env` and add your API keys

4. Enable the server in `config/default.yaml`:

```yaml
features:
  my-server:
    enabled: true
```

5. Restart the orchestrator:

```bash
pnpm dev
```

#### Manual Server Configuration

For servers not in the manifest, create YAML files manually:

```yaml
# servers/my-server.yaml
name: my-server
enabled: false
command: npx
args: [my-mcp-server, start]
env:
  MY_API_KEY: "${MY_API_KEY}"
healthCheck:
  type: stdio
  timeoutMs: 10000
scopes:
  - my:scope
limits:
  rps: 3
  burst: 6
  timeoutMs: 30000
```

### E2E Dummy MCP

For testing and development, Omni-MCP includes a dummy MCP server that simulates server behavior without requiring external dependencies.

#### Running E2E Tests Locally

```bash
# Run E2E tests
pnpm vitest -t "orchestrator e2e"

# Run with coverage
pnpm test -- --coverage=false -t "orchestrator e2e"
```

#### Dummy Server Features

- **Health Check**: Responds to `--health` with configurable success/failure
- **Continuous Operation**: Prints status messages every 500ms
- **Environment Control**: Use `DUMMY_HEALTH_FAIL=1` to simulate failures
- **Graceful Shutdown**: Handles SIGTERM/SIGINT signals

#### Using Dummy Server for Testing

1. Enable dummy server in config:

```yaml
features:
  dummy:
    enabled: true
```

2. Test health transitions:

```bash
# Start with healthy dummy
pnpm dev

# Simulate failure
DUMMY_HEALTH_FAIL=1 pnpm dev

# Check orchestrator health endpoint
curl http://localhost:3000/readyz
```

The E2E tests automatically verify:
- Orchestrator startup and health checks
- Server failure detection and recovery
- Metrics collection and audit logging
- Configuration management

## Security

### Secrets Management

- Never commit secrets to the repository
- Use environment variables for all sensitive data
- Secrets are automatically redacted in logs (configurable)
- Support for Doppler, 1Password, and GitHub Actions Secrets

### Access Control

- Each server defines its required scopes
- Rate limiting per server
- Circuit breakers for fault tolerance
- Audit logging for all operations

### Network Security

- Outbound allowlist for production environments
- TLS/SSL for all external communications
- No inbound network exposure (servers communicate via stdio)

## Observability

### Logging

Structured JSON logging with automatic correlation:

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "level": "info",
  "server": "github",
  "event": "request_completed",
  "latency_ms": 150,
  "trace_id": "abc123"
}
```

### Metrics

Prometheus metrics available at `/metrics`:

- Server health status
- Request rates and latencies
- Error rates
- Circuit breaker states

### Tracing

OpenTelemetry traces with Jaeger integration:

- Distributed tracing across servers
- Performance monitoring
- Error tracking

## Production Deployment

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile
COPY . .
RUN pnpm build
EXPOSE 3000
CMD ["pnpm", "start"]
```

### Environment Setup

1. Set production environment variables
2. Configure `config/prod.yaml` with appropriate limits
3. Set up monitoring and alerting
4. Configure secrets management

### Health Checks

The orchestrator provides multiple health check endpoints:

- `/healthz` - Basic health check
- `/readyz` - Readiness probe (all servers healthy)
- `/metrics` - Prometheus metrics

## Troubleshooting

### Common Issues

**Server not starting:**
- Check required environment variables
- Verify server configuration
- Check logs for errors

**Health checks failing:**
- Ensure server supports health check protocol
- Check network connectivity
- Verify server is responding

**Rate limiting:**
- Adjust `rps` and `burst` limits in server config
- Check for excessive requests

### Debug Mode

Enable debug logging:

```bash
LOG_LEVEL=debug make up
```

### Health Check CLI

```bash
# Check all servers
make health

# Check specific server
pnpm tsx scripts/health.ts --server github
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Run `make test` and `make lint`
6. Submit a pull request

### Development Guidelines

- Follow TypeScript best practices
- Add tests for new features
- Update documentation
- Use conventional commits
- Ensure all CI checks pass

## License

MIT License - see [LICENSE](LICENSE) for details.

## Support

- 📖 [Documentation](docs/)
- 🐛 [Issues](https://github.com/your-org/omni-mcp/issues)
- 💬 [Discussions](https://github.com/your-org/omni-mcp/discussions)
- 📧 [Email](mailto:support@your-org.com)