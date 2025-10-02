# Implementations Log

This document is a running, append-only log of implementation changes made in this project. Newest entries go on top.

---

## 2025-10-02 — Feature-first scaffolding and shared services
- Created scaffold folders: app/features/lessons, app/shared/components, app/shared/services, app/shared/i18n.
- Added shared/services/api/client.ts re-exporting tRPC client for a stable import path.
- Added shared/services/analytics.ts thin adapter over MonitoringUtils.
- Added shared/i18n/index.ts to centralize i18n entry.

## 2025-10-02 — CI typecheck enforcement
- Updated .github/workflows/ci.yml to run TypeScript typecheck via `bunx tsc -p tsconfig.json --noEmit`.
- Ensures PRs fail on type errors even if lint passes.

## 2025-10-02 — Quality gates and infra
- Added .eslintrc.cjs with Expo preset to enforce linting across TS/TSX.
- Added .prettierrc for consistent formatting.
- Added GitHub Actions CI workflow (lint + typecheck) at .github/workflows/ci.yml.

## 2025-10-02 — API hardening
- Upgraded lib/api.ts to validate critical responses with Zod schemas and to use AbortController timeouts and safer error mapping to reduce "Failed to fetch" class issues.

## 2025-10-02 — i18n scaffold
- Introduced lightweight i18n helper at lib/i18n.ts with an English base dictionary at constants/locales/en.json.

## 2025-10-02 — Ratings and monitoring improvements
- Initialized comprehensive MonitoringUtils at app startup tied to current user in app/_layout.tsx via MonitoringInitializer component for better analytics and stability insights.
- Added global, cross-platform RatingPrompt component with smart prompt timing, web/mobile support, AsyncStorage persistence, and direct deep-links to store review pages.
- Wired RatingPrompt into RootLayout so it can surface from anywhere without extra wiring.

## 2025-10-02 — Baseline established for implementation tracking
- Created implementations.md to track all future implementation steps.
- Established current repository snapshot as baseline without attributing prior work to this log.
- High-level baseline inventory (pre-existing in repo):
  - App routing: Expo Router with tabs (learn, lessons, leaderboard, chat, modules, translator, profile), plus auth and legal routes.
  - Backend: Hono server with tRPC; routes for auth, user, lessons, learn, leaderboard, analytics, chat, and example/hi.
  - Components: DebugPanel, ErrorBoundary, LanguageSelector/Setup, OnboardingScreen, PhonicsTrainer, SecurityDashboard, UpgradeModal, AIQuiz, LiquidEther, TextType, StarBorder (web/native variants), Toast, Modal, Inputs, Buttons, ProgressBar, Tabs, Slider, Switch, Card, Divider, Checkbox, Avatar.
  - Modules: Alphabet, Vowels, Consonants, Syllables, Numbers, Grammar, Sentence, Dialogue, Culture, Pronunciation; shared ModuleShell and types.
  - Hooks/state: chat-store, user-store, use-learning-session, use-gamification, use-notifications, use-security, use-speech, use-vocabulary; state/learning-progress.
  - Lib: trpc client, api, audio, storage, theme, utils, validation, monitoring, debugging, error-handling, security, constants.
  - AI integration: modules/ai-engine/adaptive-learning and toolkit SDK wiring in lib (as present in codebase).
  - Assets/config: app.json, tsconfig.json, package.json, bun.lock; images; web and store preparation docs for iOS, Android, and Web.

> Note: Prior implementations before this date are considered baseline and not itemized here due to unavailable historical context in this log. All changes moving forward will be recorded below with precise details.
