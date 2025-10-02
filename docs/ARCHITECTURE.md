# Linguamate Architecture

## Overview
Linguamate is a production-grade language learning application built with Expo Router (React Native + RN-web) and Hono/tRPC backend. The architecture follows domain-driven design principles with clear separation of concerns.

## Core Principles

1. **Domain-First Structure**: Features are organized by business domain (learn, lessons, chat, profile) rather than technical layers
2. **Strict Boundaries**: Each module owns its UI, data, logic, types, and tests
3. **Type Safety**: TypeScript strict mode with comprehensive Zod schemas
4. **Testability**: Every module includes co-located tests
5. **Path Aliases**: Absolute imports via `@modules/*`, `@components/*`, `@lib/*`, etc.

## Directory Structure

```
/app/                       # Expo Router (routes only, no domain logic)
  _layout.tsx               # Root layout with providers
  (tabs)/                   # Tab navigation
    _layout.tsx             # Tab bar configuration
    learn.tsx               # Thin route shell → imports from modules/learn
    lessons.tsx
    modules.tsx
    chat.tsx
    profile.tsx
  auth/                     # Authentication routes
  (shared)/                 # Shared route components
    ErrorBoundary.tsx
    SuspenseBoundary.tsx

/modules/                   # Domain features (DDD slices)
  learn/
    ui/                     # Screens + feature UI components
      LearnScreen.tsx
      Flashcard.tsx
      index.ts              # Barrel export
    data/                   # React Query hooks, tRPC calls
      learn.queries.ts
      learn.mutations.ts
      index.ts
    logic/                  # Pure functions, reducers, FSMs
      flow.ts
      scoring.ts
      index.ts
    types/
      learn.types.ts
      index.ts
    tests/
      learn.screen.test.tsx
      flow.test.ts
      queries.test.ts
  lessons/                  # Same structure
  chat/
  profile/
  shared/                   # Cross-feature utilities (non-UI)
    formatters/
    hooks/
    constants/

/components/                # App-wide UI primitives (presentational)
  ui/
    Button.tsx
    Card.tsx
    TextField.tsx
    index.ts
  feedback/
    Toast.tsx
    Banner.tsx
  layout/
    Screen.tsx
    Section.tsx
  index.ts                  # Top-level barrel

/lib/                       # Cross-cutting infrastructure
  trpcClient.ts
  storage.ts
  netinfo.ts
  speech.ts
  analytics.ts
  featureFlags.ts
  index.ts

/state/                     # Global stores (Zustand/Context)
  sessionStore.ts
  userStore.ts
  progressStore.ts
  chatStore.ts
  index.ts

/schemas/                   # Zod schemas (single source of truth)
  lesson.schema.ts
  exercise.schema.ts
  user.schema.ts
  chat.schema.ts
  persist.schema.ts
  index.ts

/backend/                   # Hono + tRPC backend
  server.ts
  trpc/
    router.ts
    procedures/
      lessons.ts
      chat.ts
      profile.ts
    context.ts
    index.ts
  middlewares/
    rateLimit.ts
    cors.ts
    auth.ts
  tests/

/observability/             # Logs, tracing, perf markers
  logger.ts
  redaction.ts
  perf.ts
  index.ts

/types/                     # Global TS types
  env.d.ts
  routing.d.ts
  index.d.ts

/tests/                     # Shared test infrastructure
  config/
    jest.setup.ts
  msw/
    handlers.ts
    server.ts
  utils/
    render.tsx
  e2e/
    smoke.spec.ts
```

## Data Flow

1. **Route → Module UI**: Routes in `/app` are thin shells that import screens from `/modules/*/ui`
2. **UI → Data Layer**: Screens use hooks from `/modules/*/data` (React Query + tRPC)
3. **Data → Backend**: tRPC client calls procedures in `/backend/trpc/procedures`
4. **Logic Layer**: Pure functions in `/modules/*/logic` handle business rules
5. **Global State**: Zustand stores in `/state` for cross-cutting concerns
6. **Schemas**: Zod schemas in `/schemas` validate all data boundaries

## Module Template

Every new feature module follows this structure:

```
modules/<feature>/
  ui/
    <Feature>Screen.tsx     # Main screen component
    components/             # Feature-specific components
    index.ts
  data/
    <feature>.queries.ts    # React Query queries
    <feature>.mutations.ts  # React Query mutations
    index.ts
  logic/
    fsm.ts                  # Finite state machines
    reducers.ts             # Pure reducers
    utils.ts                # Pure utility functions
    index.ts
  types/
    <feature>.types.ts      # TypeScript types
    index.ts
  tests/
    <feature>.screen.test.tsx
    logic.test.ts
    queries.test.ts
    index.ts
  index.ts                  # Top-level barrel
```

## Import Rules

1. **Use Path Aliases**: Always use `@modules/*`, `@components/*`, `@lib/*`, etc.
2. **No Deep Relative Imports**: Avoid `../../../` patterns
3. **Import Order**:
   - Node/external packages
   - Alias imports (`@modules/*`, `@lib/*`)
   - Relative imports (`./*`)
4. **Named Exports**: Prefer named exports for logic and types
5. **Barrel Exports**: Use `index.ts` files to expose public API

## Testing Strategy

1. **Co-located Tests**: Tests live in `tests/` subfolder within each module
2. **Coverage Thresholds**:
   - Global: 70% branches, 80% functions, 85% lines
   - Schemas: 90% branches, 95% functions
   - State: 75% branches, 85% functions
3. **Test Types**:
   - Unit: Pure logic functions
   - Integration: React Query hooks with MSW
   - Component: React Testing Library
   - E2E: Playwright (web only)

## Schema Contracts

All data crossing boundaries (API, storage, state) must be validated with Zod schemas from `/schemas`:

- **API Requests/Responses**: Validated in tRPC procedures
- **AsyncStorage**: Validated on read/write
- **State Hydration**: Validated on rehydration
- **Form Inputs**: Validated with `react-hook-form` + Zod resolver

## Observability

- **Logging**: Use `@observability/logger` with PII redaction
- **Correlation IDs**: Attached to all tRPC requests
- **Performance**: Mark critical paths with `@observability/perf`
- **Error Boundaries**: Wrap routes and critical components

## Adding a New Module

1. Create folder structure: `modules/<feature>/{ui,data,logic,types,tests}`
2. Add barrel exports (`index.ts`) in each subfolder
3. Create screen in `ui/<Feature>Screen.tsx` with `data-testid="<feature>-screen"`
4. Add data hooks in `data/<feature>.queries.ts` using tRPC client
5. Add pure logic in `logic/` (FSMs, reducers, utils)
6. Define types in `types/<feature>.types.ts`
7. Add tests in `tests/`
8. Create route in `app/(tabs)/<feature>.tsx` that imports the screen
9. Register route in `app/(tabs)/_layout.tsx`

## Performance Considerations

- **Code Splitting**: Lazy load heavy modules
- **Memoization**: Use `React.memo()`, `useMemo()`, `useCallback()` explicitly
- **Query Caching**: Configure React Query stale times appropriately
- **Offline Support**: Use offline queue for mutations
- **Bundle Size**: Monitor with `expo export --platform web`

## Security

- **Input Validation**: All inputs validated with Zod
- **PII Redaction**: Sensitive data redacted in logs
- **HTTPS Only**: All API calls over HTTPS
- **Token Storage**: Secure storage for auth tokens
- **Rate Limiting**: Backend rate limits on all endpoints

## Deployment

- **Web**: Static export via `expo export --platform web`
- **Mobile**: EAS Build (not covered in this scaffold)
- **Backend**: Hono server deployed separately
- **CI/CD**: GitHub Actions with typecheck, lint, test, e2e, build gates
