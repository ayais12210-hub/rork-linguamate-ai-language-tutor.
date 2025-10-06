# Backend Test Plan

- Unit tests: Jest with ts-jest, JSDOM environment. Coverage thresholds configured in `jest.config.ts`.
- Targets:
  - Health route (`/api/health`)
  - Info route (`/api/info`)
  - tRPC happy path (example route) and invalid route
  - Validation error path (validation middleware and STT)
  - Upstream failure (toolkit proxy retriable and final failure)
  - Auth failure (protected tRPC without JWT)

How to run:

```bash
npm run backend:test
```

Coverage gates: >=80% lines overall; backend files included via `collectCoverageFrom`.
