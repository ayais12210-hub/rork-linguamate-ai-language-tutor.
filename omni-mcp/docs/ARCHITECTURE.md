# Omni-MCP Framework Architecture

```mermaid
graph TB
    subgraph "External Systems"
        MCP1[GitHub MCP]
        MCP2[Stripe MCP]
        MCP3[Notion MCP]
        MCP4[Firecrawl MCP]
        MCP5[Supabase MCP]
        MCPN[... 50+ MCP Servers]
    end

    subgraph "Omni-MCP Orchestrator Framework"
        subgraph "Configuration Layer"
            CONFIG[Config System]
            DEFAULT[config/default.yaml]
            ENV[config/dev.yaml<br/>config/prod.yaml]
            LOCAL[config/local.yaml<br/>git-ignored]
            SCHEMA[Zod Schema Validation]
        end

        subgraph "Registry & Discovery"
            REGISTRY[Server Registry]
            YAML[servers/*.yaml]
            ENV_EXAMPLE[.env.example]
        end

        subgraph "Core Orchestrator"
            BOOTSTRAP[Bootstrap Engine]
            PROCESS_MGR[Process Manager]
            HEALTH[Health Checker]
            GUARDS[Resilience Guards]
        end

        subgraph "Resilience Layer"
            RATE_LIMIT[Rate Limiter]
            CIRCUIT[Circuit Breaker]
            TIMEOUT[Timeout Manager]
            RETRY[Retry Logic]
        end

        subgraph "Security Layer"
            AUTH_SCOPES[Auth Scopes]
            SECRET_REDACT[Secret Redaction]
            AUDIT_LOG[Audit Logging]
            ALLOW_LIST[Outbound Allow-list]
        end

        subgraph "Observability"
            LOGGER[Pino Logger]
            METRICS[Prometheus Metrics]
            TRACES[OpenTelemetry]
            SENTRY[Sentry Integration]
        end

        subgraph "API Endpoints"
            HEALTHZ[/healthz]
            READYZ[/readyz]
            METRICS_ENDPOINT[/metrics]
            SERVERS[/servers]
        end

        subgraph "CI/CD Pipeline"
            LINT[ESLint]
            TYPECHECK[TypeScript]
            TEST[Vitest]
            HEALTH_CHECK[Health Probe]
        end
    end

    subgraph "Infrastructure"
        PROMETHEUS[Prometheus]
        JAEGER[Jaeger]
        LOG_AGGREGATOR[Log Aggregator]
        SECRET_MANAGER[Secret Manager<br/>Doppler/Vault/1Password]
    end

    %% Configuration Flow
    DEFAULT --> CONFIG
    ENV --> CONFIG
    LOCAL --> CONFIG
    CONFIG --> SCHEMA
    SCHEMA --> BOOTSTRAP

    %% Registry Flow
    YAML --> REGISTRY
    ENV_EXAMPLE --> REGISTRY
    REGISTRY --> BOOTSTRAP

    %% Core Orchestration
    BOOTSTRAP --> PROCESS_MGR
    PROCESS_MGR --> HEALTH
    PROCESS_MGR --> GUARDS

    %% Resilience Integration
    GUARDS --> RATE_LIMIT
    GUARDS --> CIRCUIT
    GUARDS --> TIMEOUT
    GUARDS --> RETRY

    %% Security Integration
    BOOTSTRAP --> AUTH_SCOPES
    LOGGER --> SECRET_REDACT
    BOOTSTRAP --> AUDIT_LOG
    PROCESS_MGR --> ALLOW_LIST

    %% Observability Integration
    BOOTSTRAP --> LOGGER
    BOOTSTRAP --> METRICS
    BOOTSTRAP --> TRACES
    BOOTSTRAP --> SENTRY

    %% API Exposure
    HEALTH --> HEALTHZ
    HEALTH --> READYZ
    METRICS --> METRICS_ENDPOINT
    PROCESS_MGR --> SERVERS

    %% External Connections
    PROCESS_MGR --> MCP1
    PROCESS_MGR --> MCP2
    PROCESS_MGR --> MCP3
    PROCESS_MGR --> MCP4
    PROCESS_MGR --> MCP5
    PROCESS_MGR --> MCPN

    %% Infrastructure Connections
    METRICS --> PROMETHEUS
    TRACES --> JAEGER
    LOGGER --> LOG_AGGREGATOR
    BOOTSTRAP --> SECRET_MANAGER

    %% CI/CD Integration
    LINT --> HEALTH_CHECK
    TYPECHECK --> HEALTH_CHECK
    TEST --> HEALTH_CHECK
    HEALTH_CHECK --> HEALTHZ

    %% Styling
    classDef configClass fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef coreClass fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef resilienceClass fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef securityClass fill:#ffebee,stroke:#b71c1c,stroke-width:2px
    classDef observabilityClass fill:#e8f5e8,stroke:#1b5e20,stroke-width:2px
    classDef externalClass fill:#f5f5f5,stroke:#424242,stroke-width:2px

    class CONFIG,DEFAULT,ENV,LOCAL,SCHEMA,REGISTRY,YAML,ENV_EXAMPLE configClass
    class BOOTSTRAP,PROCESS_MGR,HEALTH,GUARDS coreClass
    class RATE_LIMIT,CIRCUIT,TIMEOUT,RETRY resilienceClass
    class AUTH_SCOPES,SECRET_REDACT,AUDIT_LOG,ALLOW_LIST securityClass
    class LOGGER,METRICS,TRACES,SENTRY,HEALTHZ,READYZ,METRICS_ENDPOINT,SERVERS observabilityClass
    class MCP1,MCP2,MCP3,MCP4,MCP5,MCPN,PROMETHEUS,JAEGER,LOG_AGGREGATOR,SECRET_MANAGER externalClass
```

## Architecture Overview

The Omni-MCP Framework follows a layered architecture pattern with clear separation of concerns:

### 🏗️ **Configuration Layer**
- **Layered YAML configs**: `default.yaml` → `$ENV.yaml` → `local.yaml` (git-ignored)
- **Zod schema validation**: Runtime type safety for all configuration
- **Environment interpolation**: `${ENV_KEY}` substitution from `process.env`

### 🔍 **Registry & Discovery**
- **Server definitions**: `/servers/*.yaml` files with metadata, health checks, scopes
- **Environment mapping**: `.env.example` documents all required variables
- **Feature flags**: Per-server enable/disable via configuration

### ⚙️ **Core Orchestrator**
- **Bootstrap engine**: Loads config, validates schemas, initializes components
- **Process manager**: Spawns, monitors, and manages MCP server processes
- **Health checker**: Implements stdio and HTTP health probes
- **Resilience guards**: Applies rate limiting, circuit breakers, timeouts

### 🛡️ **Resilience Layer**
- **Rate limiting**: Per-server RPS and burst controls
- **Circuit breaker**: Temporary disable failing servers
- **Timeout management**: Configurable timeouts per operation type
- **Retry logic**: Exponential backoff with jitter

### 🔒 **Security Layer**
- **Auth scopes**: Least-privilege permissions per server
- **Secret redaction**: Automatic redaction in logs and metrics
- **Audit logging**: NDJSON stream of all server events
- **Outbound allow-list**: Restrict external network calls

### 📊 **Observability**
- **Structured logging**: Pino JSON logs with trace correlation
- **Metrics**: Prometheus-compatible metrics for monitoring
- **Tracing**: OpenTelemetry integration for distributed tracing
- **Error reporting**: Optional Sentry integration

### 🌐 **API Endpoints**
- **`/healthz`**: Basic liveness probe
- **`/readyz`**: Readiness probe (all enabled servers healthy)
- **`/metrics`**: Prometheus metrics endpoint
- **`/servers`**: Server status and configuration

### 🔄 **CI/CD Pipeline**
- **Quality gates**: ESLint, TypeScript, Vitest with coverage
- **Health probes**: Automated health checking in CI
- **Security scanning**: Dependency and secret scanning

## Key Design Principles

1. **🔧 Configuration-Driven**: All behavior controlled via YAML configs
2. **🛡️ Security-First**: Zero secrets in repo, least-privilege scopes
3. **📈 Observable**: Comprehensive logging, metrics, and tracing
4. **🔄 Resilient**: Circuit breakers, retries, and graceful degradation
5. **🧪 Testable**: High test coverage with integration test support
6. **📚 Documented**: Clear docs, examples, and troubleshooting guides