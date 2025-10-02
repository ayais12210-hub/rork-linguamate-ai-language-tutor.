# Project Implementation Plan

Date: 2025-10-02
Owner: Engineering (Rork)
Targets: Expo Go v53, React Native Web, iOS/Android via Expo Go

## Guiding Constraints
- Expo Go v53 only; no custom native packages beyond Expo Go inclusions
- Web compatibility required (React Native Web)
- TypeScript strict mode; explicit state types; StyleSheet for styling
- State: React Query for server state, local state via useState, shared state via @nkzw/create-context-hook
- Navigation: Expo Router; keep RootLayoutNav intact; tabs + nested stacks as needed
- Animations: prefer RN Animated; avoid reanimated layout animations on web
- Haptics/unsupported APIs must be guarded by Platform checks

---

## Phase 0: Foundations and Diagnostics

### Objectives
- Establish consistent error handling, logging, and Error Boundaries
- Verify tRPC client/server wiring and environment config

### Technical Requirements
- Ensure providers order: React Query Provider at top, then context providers
- Global ErrorBoundary wraps app trees not already covered by stack headers
- Strengthen lib/trpc.ts with baseUrl derivation and fetch polyfill on web if needed

### Testing Criteria
- Force an error in a sample screen; ErrorBoundary renders friendly UI
- tRPC example.hi returns data on web and mobile
- Console logs show request/response timing without leaking secrets

---

## Phase 1: Language Architecture (Native & Learning Language)

### Objectives
- Persist user’s nativeLanguage and learningLanguage
- Provide translation utilities and content rendering in both languages

### Technical Requirements
- Create LanguageProvider via @nkzw/create-context-hook
  - State: nativeLanguage: string, learningLanguage: string
  - Persistence: AsyncStorage (mobile) and localStorage (web) via Platform.select abstraction in provider
  - Methods: setNativeLanguage, setLearningLanguage
- Expose useLanguage hook and helper selectLanguageText(native, learning)
- Update components/LanguageSelector to bind to provider

### Testing Criteria
- Change languages in Settings -> reflected across Learn and Modules
- Storage persistence across reload
- Types: no implicit any, exhaustive props

---

## Phase 2: Learn Page Dual-Language Rendering

### Objectives
- Ensure text is shown in native language AND in selected learning language

### Technical Requirements
- Introduce a DualText component that receives { nativeText, learningText }
- Update app/(tabs)/learn.tsx to source content from constants or backend and render via DualText
- Add testId on DualText and learn screen sections

### Testing Criteria
- Visual: both lines visible, correct language codes
- Toggle language settings -> both lines update
- Web and mobile parity

---

## Phase 3: Phonics, Grammar, Dialogue Modules (Section-by-Section)

### Objectives
- Build module pages with real, relevant information in both languages
- Each section ends with an AI-powered quiz

### Technical Requirements
- For each module folder (phonics/pronunciation, grammar, dialogue):
  - Use modules/shared/ModuleShell for layout; ensure no SafeAreaView conflicts
  - Content objects: title, description, examples [{ native, learning }]
  - Render via DualText and lists
- AI Quiz integration (see Phase 4)
- Navigation routes: ensure discoverability from Learn and Modules tabs

### Testing Criteria
- Modules render localized content without crashes
- Section navigation smooth; back navigation correct
- Performance: no unnecessary re-renders (memoization where needed)

---

## Phase 4: AI Quiz System

### Objectives
- Fix AIQuiz build errors and make quizzes work after each module section

### Technical Requirements
- Fix components/AIQuiz.tsx variable hoisting error: define loadQuiz before usage; initialize with useCallback
- Use @rork/toolkit-sdk useRorkAgent with a tool submitAnswer
- Inputs include localized prompts: provide native+learning context
- Provide graceful error UI, retry, loading skeleton
- Add testIds for buttons and results

### Testing Criteria
- No TS errors; strict types for state and tool schemas
- Sending question yields assistant response and tool calls
- Offline/Failed request: user-friendly message and retry
- Web & mobile render identical behavior

---

## Phase 5: tRPC Connectivity and Learn Screen Data

### Objectives
- Resolve TRPCClientError: Failed to fetch on Learn

### Technical Requirements
- backend/hono.ts ensures /api route is mounted
- backend/trpc/app-router.ts exports routers; example.hi reachable
- lib/trpc.ts: baseUrl detection for web (window.location.origin) and native (Constants.expoConfig?.hostUri)
- CORS: allow GET/POST for /api on web dev

### Testing Criteria
- Learn screen data query returns without error
- Network tab shows 200 status and JSON
- Error boundary not triggered

---

## Phase 6: Audio Feature Parity on Module Pages

### Objectives
- Mirror working sound from Learn page on Module pages

### Technical Requirements
- Reuse lib/audio.ts helpers; ensure Platform guards
- Preload short clips where needed; release on unmount
- Add play buttons with testId per example line

### Testing Criteria
- Tap play: hears audio; multiple taps debounced
- Memory: no leaks; sounds unloaded
- Web: fallback to HTMLAudioElement if implemented in lib/audio.ts

---

## Phase 7: StarBorder UI Integration (Web-safe)

### Objectives
- Integrate StarBorder component without Tailwind dependency

### Technical Requirements
- Use existing components/StarBorder.tsx and platform split (.web/.native) where provided
- On web, rely on components/StarBorder.web.tsx + CSS (components/StarBorder.css)
- On native, use visual approximation via RN Animated gradients; no Tailwind
- Replace targeted CTA buttons with StarBorder where design calls for it

### Testing Criteria
- Web shows animated border per CSS
- Native renders performant approximation; no crashes
- Props: color, speed, thickness function as expected

---

## Phase 8: Settings Functionality

### Objectives
- Ensure settings are fully operational (language selection, audio toggles, accessibility)

### Technical Requirements
- app/settings.tsx integrates LanguageProvider
- Add toggles stored in provider or local state: soundEnabled, textSize (S/M/L)
- Validation via lib/validation.ts where appropriate
- testIds added for all inputs

### Testing Criteria
- Changing settings updates UI immediately
- Persisted where intended; non-critical view state not persisted
- Web and mobile parity

---

## Phase 9: Error Handling, Logging, Monitoring

### Objectives
- Uniform error messages and recovery flows

### Technical Requirements
- lib/error-handling.ts helpers for user-friendly messages
- components/ErrorBoundary.tsx already present; ensure usage across high-risk screens
- Extensive console logs for key actions guarded by __DEV__

### Testing Criteria
- Simulate failures (network off); friendly error + retry
- Logs contain context but no secrets

---

## Phase 10: Performance & Web Compatibility

### Objectives
- Optimize renders and ensure web support for all used APIs

### Technical Requirements
- Memoize heavy lists and derived data
- Avoid reanimated layout animations on web; use RN Animated or CSS on web
- Platform guards for APIs with partial/no web support

### Testing Criteria
- No warnings about unsupported APIs on web
- Interaction latency under 100ms for basic taps on mid devices

---

## Backend Enhancements (as needed)
- Add routes under backend/trpc/routes for learn content, quizzes, and user profile
- Use zod schemas for input/output
- Ensure CORS for web

Testing: tRPC e2e by calling trpcClient from a Node script or via client screens.

---

## QA Test Matrix

### Platforms
- Web (Chrome, Safari)
- iOS (Expo Go)
- Android (Expo Go)

### Areas & Acceptance Tests
- Language Provider
  - Persist, restore, react to changes
- Learn Screen
  - DualText renders both languages, audio plays, data fetch succeeds
- Modules (Phonics/Grammar/Dialogue)
  - Content localized; AI quiz appears after each section
- AI Quiz
  - Handles success, error, and retry; displays streamed tool states
- Settings
  - All toggles functional; language changes propagate
- StarBorder
  - Web animation visible; native approximation stable

---

## Rollout Plan
- Dev branch: feature flags per phase via simple booleans in lib/constants.ts
- Incremental shipping: Phase 1-2 first to unblock core experience
- Dogfood with internal users, collect feedback, iterate

---

## Risks & Mitigations
- Web API gaps: guard with Platform checks and provide fallbacks
- AI API latency: optimistic UI and cancellations
- State drift: single source via providers; avoid prop drilling
- Audio issues on web: fallback to HTMLAudioElement, preload small clips

---

## Definition of Done (Per Phase)
1) All Technical Requirements implemented
2) All Testing Criteria pass on Web, iOS, Android via Expo Go
3) TypeScript strict passes; no unused imports; no any
4) Lint passes; no runtime warnings in console during normal flows

---

## Checklist (Engineer Use)
- [ ] Provider order correct
- [ ] DualText in Learn & Modules
- [ ] AIQuiz fixed and integrated
- [ ] tRPC fetch works in Learn
- [ ] Audio parity on Modules
- [ ] StarBorder integrated web/native
- [ ] Settings fully functional
- [ ] Web compatibility reviewed
- [ ] Error handling paths covered
