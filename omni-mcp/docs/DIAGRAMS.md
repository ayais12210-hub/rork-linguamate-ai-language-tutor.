# Omni-MCP Framework Architecture Diagrams

## Component Architecture (C4-style)

```mermaid
flowchart LR
  subgraph DevEnv[Developer Environment]
    Dev[Engineer]
    CI[GitHub Actions CI/CD]
  end

  subgraph Orchestrator[Omni-MCP Orchestrator (Node/TS)]
    IDX[Index.ts / Fastify]
    BOOT[bootstrap.ts]
    REG[registry.ts]
    CFG[config/schema.ts (Zod + YAML)]
    G1[guards/timeouts]
    G2[guards/retries+backoff]
    G3[guards/circuitBreaker]
    G4[guards/rateLimiter]
    LOG[observability/logger.ts (JSON)]
    OTEL[observability/otel.ts (opt)]
    METRICS[/metrics (Prometheus)/]
    HEALTH[/healthz & /readyz/]
    AUDIT[(Audit Log NDJSON)]
  end

  subgraph Config[Configuration + Secrets]
    Y1[config/default.yaml]
    Y2[config/$ENV.yaml]
    Y3[config/local.yaml (gitignored)]
    ENV[(process.env)]
    SECRETS[(Secret Manager / OIDC)]
  end

  subgraph Servers[Registered MCP Servers]
    S0[servers/*.yaml (declarative)]
    S1[(GitHub MCP)]
    S2[(Stripe Toolkit)]
    S3[(Supabase MCP)]
    S4[(Playwright MCP)]
    S5[(Firecrawl MCP)]
    S6[(Context7 / Upstash)]
    S7[(Notion MCP)]
    S8[(ElevenLabs MCP)]
    S9[(Sentry MCP)]
    Sx[… others]]
  end

  Dev -->|enable flags, edit YAML| Config
  Dev --> CI
  CI --> IDX

  IDX --> BOOT
  IDX --> HEALTH
  IDX --> METRICS

  BOOT --> REG
  REG --> S0
  REG --> CFG
  CFG --> Y1
  CFG --> Y2
  CFG --> Y3
  CFG --> ENV
  ENV --> SECRETS

  BOOT -->|spawn/monitor via child_process| S1
  BOOT -->|spawn/monitor| S2
  BOOT -->|spawn/monitor| S3
  BOOT -->|spawn/monitor| S4
  BOOT -->|spawn/monitor| S5
  BOOT -->|spawn/monitor| S6
  BOOT -->|spawn/monitor| S7
  BOOT -->|spawn/monitor| S8
  BOOT -->|spawn/monitor| S9

  BOOT --> G1
  BOOT --> G2
  BOOT --> G3
  BOOT --> G4

  BOOT --> LOG
  BOOT --> OTEL
  BOOT --> AUDIT

  classDef svc fill:#0ea5e9,stroke:#0b7285,color:#fff
  classDef cfg fill:#fde68a,stroke:#ca8a04,color:#222
  classDef orch fill:#c7d2fe,stroke:#3730a3,color:#111
  classDef guard fill:#e2e8f0,stroke:#475569
  classDef obs fill:#bbf7d0,stroke:#16a34a
  class Orchestrator orch
  class CFG,Y1,Y2,Y3,ENV,SECRETS,S0 cfg
  class G1,G2,G3,G4 guard
  class LOG,OTEL,METRICS,HEALTH,AUDIT obs
  class S1,S2,S3,S4,S5,S6,S7,S8,S9 svc
```

## Boot & Health Sequence

```mermaid
sequenceDiagram
  autonumber
  participant Dev as Developer
  participant CI as CI Pipeline
  participant IDX as Orchestrator (index.ts)
  participant CFG as Config Loader (schema.ts)
  participant REG as Registry (servers/*.yaml)
  participant BOOT as Bootstrap (spawn)
  participant MCP as MCP Server (example)
  participant HC as scripts/health.ts

  Dev->>CI: push / PR
  CI->>IDX: start orchestrator (pnpm dev)
  IDX->>CFG: load layered YAML + env (Zod validate)
  CFG-->>IDX: validated config (features + servers)
  IDX->>REG: read servers/*.yaml
  REG-->>IDX: resolved server defs
  IDX->>BOOT: bootAll()
  loop enabled servers
    BOOT->>MCP: spawn via child_process (env injected)
    MCP-->>BOOT: stdout/stderr (tagged logs)
    BOOT->>BOOT: apply guards (timeout/retry/circuit breaker)
  end
  CI->>HC: run scripts/health.ts
  HC->>IDX: GET /readyz
  IDX-->>HC: 200 OK (if healthy)
  HC-->>CI: pass/fail
```

## PlantUML Component View

```plantuml
@startuml
skinparam componentStyle rectangle
skinparam shadowing false
skinparam monochrome false
skinparam defaultTextAlignment left

package "Omni-MCP Orchestrator (Node/TS)" {
  [index.ts / Fastify] as IDX
  [bootstrap.ts] as BOOT
  [registry.ts] as REG
  [config/schema.ts (Zod)] as CFG
  [guards: timeouts] as G1
  [guards: retries+backoff] as G2
  [guards: circuitBreaker] as G3
  [guards: rateLimiter] as G4
  [logger.ts (JSON)] as LOG
  [otel.ts (optional)] as OTEL
  [ /healthz | /readyz ] as HEALTH
  [ /metrics (Prometheus) ] as METRICS
  database "Audit Log (NDJSON)" as AUD
}

package "Configuration + Secrets" {
  [config/default.yaml] as Y1
  [config/$ENV.yaml] as Y2
  [config/local.yaml] as Y3
  [process.env] as ENV
  [Secret Manager / OIDC] as SEC
}

package "MCP Servers" {
  [servers/*.yaml] as S0
  [GitHub MCP] as S1
  [Stripe Toolkit] as S2
  [Supabase MCP] as S3
  [Playwright MCP] as S4
  [Firecrawl MCP] as S5
  [Context7 / Upstash] as S6
  [Notion MCP] as S7
  [ElevenLabs MCP] as S8
  [Sentry MCP] as S9
}

actor Dev as "Developer"
actor CI as "CI/CD"

Dev --> Y3 : enable flags, local overrides
Dev --> CI
CI --> IDX : start dev/CI

IDX --> CFG
CFG --> Y1
CFG --> Y2
CFG --> Y3
CFG --> ENV
ENV --> SEC

IDX --> REG
REG --> S0

IDX --> BOOT
BOOT --> S1 : spawn/monitor
BOOT --> S2
BOOT --> S3
BOOT --> S4
BOOT --> S5
BOOT --> S6
BOOT --> S7
BOOT --> S8
BOOT --> S9

BOOT --> G1
BOOT --> G2
BOOT --> G3
BOOT --> G4

IDX --> HEALTH
IDX --> METRICS
LOG -[hidden]-> IDX
BOOT --> LOG
BOOT --> OTEL
BOOT --> AUD

@enduml
```

## Usage Instructions

### Mermaid Diagrams
- **Markdown**: Drop code blocks into `.md` files
- **GitHub/GitLab**: Native rendering support
- **VS Code**: Use Mermaid extension for preview

### PlantUML Diagrams
- **VS Code**: PlantUML extension
- **CLI**: `java -jar plantuml.jar diagram.puml`
- **Online**: PlantUML server
- **CI**: Generate images in build pipeline