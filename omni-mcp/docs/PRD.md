# Omni-MCP — Product Requirements Document (PRD)

## 1. Purpose
Operate a secure, observable, multi-server MCP orchestration platform with config-only toggles, strict secrets hygiene, and CI health gates.

## 2. Scope
- Spawn/orchestrate third-party MCP servers via declarative YAML + manifest.
- Health: stdio/http probes, retries, backoff, `/readyz` reflects **all enabled** health.
- Observability: JSON logs, Prometheus metrics, optional OTEL & Sentry.
- Security: least-privilege tokens, outbound allow-list, audit NDJSON with redaction.
- CI/CD: lint/typecheck/test/coverage, dotenv sync, registry validation.

## 3. Architecture
```mermaid
flowchart LR
  Dev[Dev/CI] -->|flags/env| Orchestrator
  subgraph Orchestrator
    Cfg[Config Loader] --> Reg[Server Registry]
    Reg --> Spawn[Spawner]
    Spawn --> Probes[Probes (stdio/http)]
    Probes --> Health[Health/Ready]
    Spawn --> Logs[JSON Logs]
    Logs --> Audit[Audit NDJSON]
    Orchestrator --> Metrics[/Prometheus/]
    Orchestrator --> OTEL[(OTEL)]
    Orchestrator --> Sentry[(Sentry)]
  end
  Servers[3rd-party MCP Servers] <--spawn--> Spawn
```

## 4. Config Schema (PRD)

Canonical schema in `apps/orchestrator/src/config/prd.schema.ts`:

- `servers.*`: command, args, env, probe, limits, retry, timeouts, scopes.
- `features.*.enabled`: enable/disable without code changes.

## 5. Security

- Tokens stored in env only; `.env.example` documents keys.
- Outbound allow-list enforced for probes; extend later for general egress.
- Logs & audit redact secrets.

## 6. Observability

- `/metrics` exposes: spawn/exit/restart counters; probe latency histogram; probe failures.
- OTEL flag-gated; non-blocking if misconfigured.

## 7. CI/CD

Gates: lint, typecheck, tests (≥80% cov), dotenv generator check, registry validation, optional e2e.

Nightly health jobs.

## 8. Risks & Mitigations

- Crash loops → restart backoff & cap restarts/minute.
- Misconfig → zod env schemas + generator + CI checks.
- Secret leakage → log redaction & audit filtering.

## 9. Roadmap

Helm chart, semantic-release, Docusaurus docs site, secrets providers (Doppler/1P/WI).