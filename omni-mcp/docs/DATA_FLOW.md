# Omni-MCP Data Flow & Process Lifecycle

```mermaid
sequenceDiagram
    participant Dev as Developer
    participant Config as Config System
    participant Bootstrap as Bootstrap Engine
    participant Registry as Server Registry
    participant ProcessMgr as Process Manager
    participant Health as Health Checker
    participant Guards as Resilience Guards
    participant MCP as MCP Server
    participant API as API Endpoints
    participant Obs as Observability

    %% Initialization Phase
    Dev->>Config: Load config files
    Note over Config: default.yaml → $ENV.yaml → local.yaml
    Config->>Config: Validate with Zod schema
    Config->>Bootstrap: Pass validated config

    Bootstrap->>Registry: Discover servers/*.yaml
    Registry->>Registry: Check feature flags
    Registry->>Registry: Validate required envs
    Registry->>Bootstrap: Return enabled servers

    Bootstrap->>Guards: Initialize resilience guards
    Bootstrap->>Obs: Initialize observability
    Bootstrap->>ProcessMgr: Start process manager

    %% Server Startup Phase
    loop For each enabled server
        ProcessMgr->>Guards: Apply rate limiting
        ProcessMgr->>ProcessMgr: Spawn MCP process
        ProcessMgr->>Health: Start health monitoring
        ProcessMgr->>Obs: Log server start event
        
        Health->>MCP: Probe health endpoint
        alt Health check passes
            MCP-->>Health: 200 OK
            Health->>Obs: Log healthy status
        else Health check fails
            MCP-->>Health: Error/Timeout
            Health->>Guards: Trigger circuit breaker
            Guards->>ProcessMgr: Schedule retry
            ProcessMgr->>Obs: Log failure event
        end
    end

    %% Runtime Phase
    loop Continuous monitoring
        Health->>MCP: Periodic health checks
        Guards->>ProcessMgr: Monitor rate limits
        ProcessMgr->>Obs: Emit metrics
        
        alt Server becomes unhealthy
            Guards->>Guards: Open circuit breaker
            Guards->>ProcessMgr: Stop forwarding requests
            ProcessMgr->>Obs: Log circuit breaker event
        end
    end

    %% API Request Phase
    Dev->>API: GET /readyz
    API->>Health: Check all server health
    Health->>MCP: Probe enabled servers
    MCP-->>Health: Health status
    Health-->>API: Overall health status
    API-->>Dev: 200 OK or 503 Service Unavailable

    %% Shutdown Phase
    Dev->>Bootstrap: SIGTERM/SIGINT
    Bootstrap->>ProcessMgr: Graceful shutdown
    ProcessMgr->>MCP: Send SIGTERM to all servers
    MCP-->>ProcessMgr: Process exit
    ProcessMgr->>Obs: Log shutdown events
    Bootstrap->>Obs: Flush logs and metrics
```

## Process Lifecycle Management

### 🚀 **Startup Sequence**

1. **Config Loading**: Load and validate configuration files
2. **Schema Validation**: Ensure all configs pass Zod validation
3. **Server Discovery**: Scan `/servers/*.yaml` for enabled servers
4. **Environment Check**: Verify required environment variables
5. **Guard Initialization**: Set up rate limiting, circuit breakers
6. **Process Spawning**: Start MCP server processes
7. **Health Monitoring**: Begin continuous health checks
8. **Observability Setup**: Initialize logging, metrics, tracing

### 🔄 **Runtime Monitoring**

- **Health Checks**: Periodic stdio/HTTP probes (configurable interval)
- **Rate Limiting**: Track RPS and burst limits per server
- **Circuit Breaker**: Monitor failure rates and trip thresholds
- **Process Management**: Handle crashes, restarts, and graceful shutdowns
- **Metrics Collection**: Emit Prometheus metrics for monitoring

### 🛑 **Shutdown Sequence**

1. **Signal Handling**: Catch SIGTERM/SIGINT signals
2. **Graceful Shutdown**: Send SIGTERM to all MCP processes
3. **Health Drain**: Wait for processes to exit gracefully
4. **Force Kill**: SIGKILL remaining processes after timeout
5. **Cleanup**: Flush logs, close connections, exit cleanly

## Error Handling & Recovery

### 🔧 **Retry Logic**
- **Exponential Backoff**: 500ms → 1s → 2s → 5s → 10s
- **Jitter**: Add random delay to prevent thundering herd
- **Max Retries**: Configurable per server (default: 5)
- **Circuit Breaker**: Temporary disable after repeated failures

### 🚨 **Failure Scenarios**
- **Process Crash**: Automatic restart with backoff
- **Health Check Failure**: Mark unhealthy, stop forwarding
- **Rate Limit Exceeded**: Queue requests or return 429
- **Timeout**: Cancel operation, log timeout event
- **Configuration Error**: Fail fast with clear error message

### 📊 **Observability Events**
- **Server Start**: Process spawned successfully
- **Server Stop**: Process exited (normal or error)
- **Health Change**: Server health status changed
- **Circuit Breaker**: Circuit opened/closed
- **Rate Limit**: Rate limit exceeded
- **Retry**: Operation retried after failure
- **Timeout**: Operation timed out
- **Config Error**: Configuration validation failed