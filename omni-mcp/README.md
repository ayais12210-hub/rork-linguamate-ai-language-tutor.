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

## Server Matrix

| Server | Purpose | Required Env | Default Limits | Status |
|--------|---------|--------------|----------------|--------|
| **Core Services** |
| github | Git repository management | `GITHUB_TOKEN` | 5 RPS, 10 burst | ✅ |
| stripe | Payment processing | `STRIPE_API_KEY` | 2 RPS, 4 burst | ✅ |
| notion | Note-taking and databases | `NOTION_TOKEN` | 3 RPS, 6 burst | ✅ |
| supabase | Database and auth | `SUPABASE_URL`, `SUPABASE_ANON_KEY` | 5 RPS, 10 burst | ✅ |
| **AI & ML** |
| firecrawl | Web scraping | `FIRECRAWL_API_KEY` | 3 RPS, 6 burst | ✅ |
| elevenlabs | Text-to-speech | `ELEVENLABS_API_KEY` | 2 RPS, 4 burst | ✅ |
| perplexity | AI search | `PERPLEXITY_API_KEY` | 3 RPS, 6 burst | ✅ |
| **Browser Automation** |
| chrome-devtools | Chrome debugging | `CHROME_BIN` (optional) | 2 RPS, 4 burst | ✅ |
| playwright | Browser automation | `PLAYWRIGHT_BROWSERS_PATH` (optional) | 2 RPS, 4 burst | ✅ |
| **Integrations** |
| zapier | Workflow automation | `ZAPIER_NLA_API_KEY` | 3 RPS, 6 burst | ✅ |
| backup | Data backup | `BACKUP_DIR` | 1 RPS, 2 burst | ✅ |

*See [Server Configurations](#server-configurations) for the complete list.*

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

### Adding a New Server

1. Create a new YAML file in `servers/`:

```yaml
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

2. Add the server to `.env.example`:

```bash
# My Server MCP
MY_API_KEY=
```

3. Add feature flag to `config/default.yaml`:

```yaml
features:
  my-server:
    enabled: false
```

4. Test the server:

```bash
make health
```

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