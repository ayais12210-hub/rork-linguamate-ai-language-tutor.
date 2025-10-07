# Product Design Requirement (PDR)

**Project:** Omni-MCP Orchestrator Framework  
**Author:** Senior MCP Developer (System Design / Backend)  
**Date:** 2025-01-07  
**Status:** Draft v1.0  

---

## 1. Purpose & Context

The Omni-MCP Framework provides a production-grade orchestration layer for integrating and operating multiple MCP (Model Context Protocol) servers in a unified, secure, and maintainable manner.

The system must support heterogeneous MCP servers (LLMs, SaaS connectors, infra tools, observability agents) while enforcing:

- **Modularity** (pluggable registry of servers)
- **Resilience** (timeouts, retries, circuit breakers)
- **Security** (least-privilege, no hard-coded secrets, outbound allow-list)
- **Observability** (logs, metrics, traces, audit events)
- **DevEx** (config-driven, pnpm workspace, feature flags, CI gates)

---

## 2. Objectives

- Build a config-driven orchestrator that can start, stop, monitor, and health-check MCP servers.
- Support dozens of third-party MCP servers, each independently enabled/disabled via config and environment variables.
- Ensure reliability and maintainability: type-safe codebase, strong CI/CD gates, minimal risk of runtime failures.
- Deliver security & compliance: zero secrets in repo, OIDC preferred over static tokens, strict env schema.
- Provide developer productivity: clear DX (pnpm commands, Makefile, YAML config, .env.example, CI) and fast onboarding.

---

## 3. Scope

### In Scope
- **Omni-MCP Orchestrator** (TypeScript, Node 20+, pnpm)
- **Registry system**: loads `/servers/*.yaml` with env mapping and health checks
- **Config system**: layered YAML (`default.yaml`, `$ENV.yaml`, `local.yaml`), Zod schema validation
- **Resilience features**: rate limiting, circuit breakers, timeouts, retries with exponential backoff
- **Health/Ready/Metrics endpoints** via Fastify & Prometheus client
- **CI/CD pipelines** (lint, typecheck, test, health probe)
- **Observability**: Pino JSON logs, OpenTelemetry hooks, optional Sentry
- **Security**: redaction, outbound allow-list, audit logging
- **Documentation**: README, .env.example, capability matrix

### Out of Scope (initial release)
- UI dashboards for MCP orchestration
- Multi-tenant deployments
- Dynamic scaling (Kubernetes operators, autoscaling)
- Cloud-native secrets management (to be handled by hosting infra: Doppler, Vault, 1Password, etc.)

---

## 4. Stakeholders

- **Engineering**: Backend developers, Infra engineers, CI/CD maintainers
- **Product/Platform**: Internal developer platform owners (consuming MCP services)
- **Security**: CloudSec, AppSec for secrets and scope enforcement
- **Operations**: DevOps/SRE for monitoring health, logs, metrics

---

## 5. Functional Requirements

### Orchestrator
- Must spawn MCP servers defined in `/servers/*.yaml`.
- Must respect `features.<name>.enabled` flag AND presence of required envs.
- Must support per-server isolation: independent retries, backoff, logging.
- Must gracefully handle shutdown and restart.

### Config System
- Schema-validated with Zod.
- Environment interpolation: `${ENV_KEY}` from `process.env`.
- Default OFF for all servers; enable explicitly.
- `config/local.yaml` is git-ignored and used for developer overrides.

### Health & Metrics
- `/healthz`: basic liveness
- `/readyz`: returns 200 if all enabled servers report healthy
- `/metrics`: Prometheus metrics including process info, per-server stats
- `scripts/health.ts`: CLI health probe, used in CI

### Observability
- Logs in structured JSON (`srv`, `event`, `latency_ms`, `trace_id`)
- Sensitive values redacted
- OTEL traces optional (flag in config)
- Audit log: NDJSON stream of server events (start, exit, retry, failure)

### Resilience
- Timeouts per server request/process
- Retries with exponential backoff (e.g., 500ms → 1s → 2s → 5s)
- Circuit breaker: disable server temporarily if failing repeatedly
- Rate limiting per server (RPS + burst)

### Security
- All envs are declared in `.env.example` (no secrets committed)
- Least-privilege scopes documented per server (e.g., `repo:read` for GitHub, not `repo:all`)
- Outbound allow-list restricts which domains servers can call
- Audit log ensures accountability for operations

---

## 6. Non-Functional Requirements

- **Performance**: Orchestrator overhead ≤ 10% of server CPU usage
- **Scalability**: Handle 50+ servers concurrently on a single node
- **Reliability**: No crash loops; restart policies in place
- **Maintainability**: Code fully type-checked; ESLint + Prettier enforced; Vitest coverage ≥ 80%
- **Portability**: Should run on Linux, MacOS, containerised environments
- **Security**: No plaintext secrets; strict lint for `process.env` references

---

## 7. Deliverables

### Codebase:
- `apps/orchestrator/` with `index.ts`, `bootstrap.ts`, `registry.ts`, `config/schema.ts`, `guards/`, `observability/`
- `/servers/*.yaml` stubs for supported MCP servers
- `.env.example` documenting all env vars
- `config/` YAMLs with schema enforcement
- CI workflows: `ci.yml`, `nightly-health.yml`, `security.yml`
- `scripts/health.ts` for CLI probing

### Docs:
- README with quickstart, enabling a server, troubleshooting
- Server capability matrix (name, purpose, env keys, scopes, limits)

---

## 8. Risks & Mitigations

- **Secrets leakage** → Mitigation: `.env` git-ignored, redact in logs, use secret managers
- **Crash loops** → Mitigation: exponential backoff, max restarts per minute
- **Over-scoped tokens** → Mitigation: document minimal scopes per server, enforce reviews
- **Vendor server changes** → Mitigation: version pinning in `package.json`, health probes detect failure early
- **Scaling limits** → Mitigation: design orchestration for horizontal scaling (future operator)

---

## 9. Roadmap & Iterations

- **v1.0 (MVP)**: Orchestrator, config system, 10–15 servers stubbed, CI, health, metrics, logs
- **v1.1**: Add full server set, audit log export, resilience guards (circuit breaker)
- **v1.2**: Add OTEL tracing, optional Sentry integration, outbound allow-list enforcement
- **v1.3**: Add coverage on integration tests, server matrix in docs
- **v2.0**: Investigate Kubernetes operator, multi-tenant deployments, UI dashboard

---

## 10. Acceptance Criteria

- [ ] Orchestrator runs with zero enabled servers (no errors)
- [ ] Enabling any single server works via config + envs (no code changes)
- [ ] `/readyz` returns 200 when enabled servers are healthy
- [ ] CI passes: lint, typecheck, test, health
- [ ] Logs structured + secrets redacted
- [ ] `.env.example` documents all envs required
- [ ] Coverage ≥ 80% for config loader, guards, bootstrap

---

⚡ **In short**: Omni-MCP provides a secure, config-driven, observable, resilient framework to orchestrate dozens of MCP servers. It is designed to be maintainable, auditable, and extensible, with CI/CD enforcement and best practices from the start.