# Refactor Plan: Feature-First, Production-Ready Architecture

Date: 2025-10-02
Owner: Rork

Goals
- Transition to a feature-first structure without breaking runtime.
- Enforce quality gates (lint, typecheck, tests in CI).
- Improve data safety with zod-validated boundaries.
- Centralize networking via typed services; no fetch in components.
- Establish i18n, observability, and testing baselines.

Guardrails
- The app must boot at every step.
- Moves happen incrementally with alias barrels and re-exports.
- All new code: strict TS, explicit types for useState, exhaustive object creation.

Phases

1) Quality gates (now)
- Keep eslint + CI already added. Add typecheck to CI (done via bunx tsc in workflow).
- Target: CI fails on lint or type errors.

2) Service boundaries
- Create shared/services/api client around trpc + fetch with timeouts and error mapping.
- Migrate modules using direct fetch to use services.

3) Feature-first skeleton
- Create app/features/* folders and introduce barrels.
- Gradually move modules: lessons, practice, ai-tutor, speech, billing, profile.

4) i18n baseline
- Ensure all user-facing strings pass through lib/i18n.ts and constants/locales/*.
- Add missing keys as we touch screens.

5) Observability
- Confirm ErrorBoundary wraps app (done). Add Sentry adapter behind shared/services/analytics.
- Standardize DebugLogger + PerformanceMonitor usage.

6) Testing baseline
- Add Vitest + RTL + MSW scaffolding. Write one happy/failure test per moved feature.

7) CI hardening
- Expand workflow to run tests; later, semantic-release.

File Moves (incremental)
- modules/* → app/features/*/ (screens, components, hooks, services, state)
- hooks/* → app/shared/hooks/* or per-feature hooks.
- components/* reusable → app/shared/components/*
- lib/* → app/shared/lib/* except app entry glue.
- constants/* → app/shared/constants/*

Risks
- Web compatibility: keep RNW-safe APIs; avoid reanimated layout animations on web.
- Expo Go constraints: no native packages outside Expo Go v53 set.
- Routing: keep RootLayoutNav unchanged.

Acceptance
- CI green for lint+types.
- App boots with no runtime errors.
- No direct network calls from presentation components.
