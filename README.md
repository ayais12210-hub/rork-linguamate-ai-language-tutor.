# rork-linguamate-ai-language-tutor.
Created by Rork

Linguamate — AI Language Tutor (Expo + tRPC)
Created by Rork

Overview
- Cross‑platform (iOS/Android/Web) language learning app built with Expo Router, React Native, TypeScript, and tRPC (Hono backend).
- Five primary tabs: Learn, Lessons, Modules, Chat, Profile. Translator is embedded in Chat; Leaderboard is inside Profile.
- Modern, production‑grade UI with accessible components, testIDs, robust error handling, and offline awareness.
- Designed for Expo Go v53 and React Native Web (no custom native modules required).

Key Features
- AI Coach Chat: Practice conversations, suggestion chips, inline “coach translator” pane, message limits for non‑premium.
- Learn Hub: Alphabet, numbers, vocabulary, phonics, phrases, grammar, dialogues, AI tips, swipeable flashcards, quick quiz, progress.
- Lessons: On‑demand AI‑generated lessons with multiple exercise types (MCQ, fill‑blank, match pairs, typing, word order, listening/speaking placeholders), XP rewards, perfect bonus, recap.
- Advanced Modules: Alphabet, Numbers, Vowels, Consonants, Syllables, Grammar, Sentence, Dialogue, Pronunciation, Culture; post‑module AI Quiz.
- Profile + Leaderboard: Stats, achievements, weekly goals, quick stats, personal journal (local only), leaderboard with filters/sorts and details modal.
- Offline UX: Online status sync, offline banner, queues, optimistic flows.
- Observability: Client/server logging, correlation IDs, security headers, health endpoints.
- i18n Scaffold: Simple utilities and seeds (en), easy to extend.

Architecture
- Navigation: Expo Router
  - Root stack in app/_layout.tsx
  - Tab layout in app/(tabs)/_layout.tsx with 5 tabs (Learn, Lessons, Modules, Chat, Profile)
  - Hidden routes inside tabs (translator, leaderboard) surfaced within Chat/Profile screens
- State
  - Server state: React Query (lib/react-query.ts)
  - Local UI: useState; scoped providers for user, chat, learning progress, offline
- Backend
  - Hono server under backend/hono.ts mounted at /api
  - tRPC router at /api/trpc (backend/trpc/app-router.ts)
  - CORS, security headers, request logging, health/info routes
- tRPC Client (lib/trpc.ts)
  - Auto base‑URL detection (native/web), SuperJSON transformer, batched HTTP with HTML‑guard, 15s timeout
- Theming & Dark Mode (lib/theme.ts)
  - useTheme() respects user.settings.darkMode
  - Semantic colors, spacing, radii, shadows, component presets for buttons, inputs, cards, toasts
- Error Handling
  - components/ErrorBoundary.tsx with retry/reset, structured debugging in dev

Navigation & Layout
- Tabs: Learn, Lessons, Modules, Chat, Profile
- Translator: app/(tabs)/translator.tsx (hidden tab); embedded UI inside Chat tab switcher
- Leaderboard: app/(tabs)/leaderboard.tsx (hidden tab); rendered as a section within Profile
- Onboarding flows: app/index.tsx decides onboarding, language setup, then routes to Chat (coach)

Main Screens
- Learn (app/(tabs)/learn.tsx)
  - Alphabet grid/list (play pronunciation), Numbers, Phrases, Grammar, Dialogues, Phonics (incl. trainer), AI tips, Flashcards, Quick Quiz, Progress
  - tRPC content fetch with safe fallback and optional AI “repair” for translations
- Lessons (app/(tabs)/lessons.tsx)
  - AI‑generated lesson content via toolkit.rork.com; multiple exercise types; XP, perfect bonus, recap; persisted lesson cache & completion list
- Modules (app/(tabs)/modules.tsx)
  - Advanced modules by skill type; per‑module progress derived from learning-progress state; AI Quiz (components/AIQuiz.tsx) grant bonus XP
- Chat (app/(tabs)/chat.tsx)
  - AI coach with suggestion chips, embedded Translator tab, draft translation (LLM), premium gating, remaining messages indicator
- Profile (app/(tabs)/profile.tsx)
  - Auth (signin/signup views), stats cards, achievements, weekly goals, friends activity mock, Leaderboard section with filters/sorts, personal journal saved locally, premium upsell

AI & Media
- LLM Text
  - @rork/toolkit-sdk generateObject (typed AI output) for AIQuiz
  - Direct POST to https://toolkit.rork.com/text/llm/ for Learn tips and Lessons generation
- STT (hooks/use-speech.ts)
  - Web: MediaRecorder → FormData → https://toolkit.rork.com/stt/transcribe/
  - Native: expo-av recording (HIGH_QUALITY preset) → FormData → same endpoint
- TTS
  - Expo Go/web compatible mock speak() with console logs (no expo-speech dependency to avoid compatibility issues)

Data Usage & Privacy
- Local Storage (AsyncStorage)
  - Lessons: completion list, generated lessons cache
  - Profile: personal journal
  - Lightweight UI preferences
  - No sensitive data persisted
- Network
  - tRPC under /api/trpc (user, lessons, learn, analytics, chat utilities)
  - LLM endpoints (toolkit.rork.com) for generation/transcription; payloads minimized
- Logging/Analytics
  - Client logging modules; server request logging with correlation IDs; health checks
- Privacy
  - No secrets in client repo
  - API base URL configured via EXPO_PUBLIC_BACKEND_URL
  - Structured, minimally revealing error messages

Backend
- Hono server (backend/hono.ts)
  - Middlewares: correlation, securityHeaders, requestLogger, CORS
  - Routes: /api (health), /api/info, /api/trpc, /api/ingest/logs
- tRPC Router (backend/trpc/app-router.ts)
  - Namespaces: auth, user, lessons, learn, chat, analytics, leaderboard, example.hi
- Deployment Note
  - Dev served on same origin by rork start; for remote API set EXPO_PUBLIC_BACKEND_URL

Theming & Dark Mode
- Toggle via user.settings.darkMode (useTheme() returns theme or darkTheme)
- Tabs/headers reflect theme in app/(tabs)/_layout.tsx

Haptics
- expo-haptics included. Use guarded calls:
  - if (Platform.OS !== 'web') await Haptics.selectionAsync();

Offline & Caching
- React Query defaults: sane stale/gc times for mobile
- OnlineStatusSync: browser online/offline → React Query onlineManager
- Offline provider + banners and queue helpers

Accessibility & Testing
- Accessible labels, adequate touch targets
- testID attributes for critical UI elements across screens
- ErrorBoundary recovery controls with dev diagnostics in __DEV__

Web Compatibility
- Only web‑safe APIs without guards; native‑only features are guarded
- Reanimated layout limitations on web are respected or avoided
- FormData for uploads: no manual Content‑Type on web
- Media: MediaRecorder used on web for audio

Project Structure (selected)
- app/                       Routes (Stack + Tabs)
- app/(tabs)                 Main tabs and hidden companion screens
- backend/                   Hono + tRPC server
- components/                Shared UI (ErrorBoundary, AIQuiz, banners)
- hooks/                     chat store, user store, speech, etc.
- lib/                       trpc client, theme, i18n, react-query config
- modules/                   Learning feature modules and engines
- state/                     Learning progress provider
- constants/, schemas/       Configs, validation scaffolding

Environment Variables
- EXPO_PUBLIC_BACKEND_URL
  - Full origin to your API (no trailing slash)
  - Example: https://api.example.com
- EXPO_PUBLIC_TOOLKIT_URL
  - Base for @rork/toolkit-sdk agent endpoints (optional)

Getting Started
1) Install
   bun i
2) Run (with tunnel)
   bunx rork start --tunnel
   or scripts: npm run start, npm run start-web
3) Open
   - Scan QR with Expo Go (iOS/Android)
   - Or open the web URL in your browser

Troubleshooting
- TRPCClientError: Failed to fetch
  - Ensure API is reachable at ${EXPO_PUBLIC_BACKEND_URL}/api
  - On web dev, base URL defaults to same origin; set EXPO_PUBLIC_BACKEND_URL if API is remote
  - Check console: “[tRPC] Final API URL: …”
- “Failed to load split bundle … @tanstack/query-devtools … ngrok”
  - This is a devtools lazy‑bundle route failing due to offline tunnel; remove/disable devtools or ensure tunnel is alive
- Suggestions/AI: Failed to fetch
  - Verify internet and CORS to toolkit.rork.com; endpoints are public for dev
- Audio recording (web)
  - Grant mic permission; MediaRecorder emits webm; we wrap into File for FormData
- Audio recording (native)
  - Expo AV HIGH_QUALITY preset; ensure mic permission is granted

Quality & CI
- Strict TypeScript patterns: explicit useState types, nullish guards, complete object creation
- Console logs for step‑by‑step debugging
- CI workflow (/.github/workflows/ci.yml) for lint/typecheck/test

Security Notes
- Never commit secrets; only EXPO_PUBLIC_* envs read at runtime
- CORS wide in dev; harden for prod
- Structured errors; never echo raw user input

Design System
- Centralized tokens (colors, spacing, radii, shadows) in home/project/constants and lib/theme.ts
- Clean, modern design influenced by iOS/Airbnb/Coinbase with subtle depth and strong contrast

Known Limitations (Expo Go)
- Advanced TTS paths are mocked for compatibility
- Reanimated layout animations limited on web; guarded/fallbacks applied

Contributing
- Prefer React Query + tRPC for server state
- Keep components typed, accessible, and web‑safe
- Add testIDs to new interactive components

License
- Proprietary. © 2025 Rork. All rights reserved.

