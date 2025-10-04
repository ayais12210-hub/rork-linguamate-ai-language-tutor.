
🌐 Linguamate — AI Language Tutor

Cross-Platform AI-Powered Language Learning App
(Expo + React Native + TypeScript + tRPC, with Rork Toolkit integration)


---

✨ Overview

Linguamate is a production-grade, cross-platform AI tutor designed for iOS, Android, and Web.
It provides structured lessons, conversational practice, and advanced learning modules — all built on a modern Expo + tRPC stack with AI-driven insights.

🚀 Expo Router Navigation (Expo Go v53 compatible)

🧩 5 Primary Tabs: Learn · Lessons · Modules · Chat · Profile

💬 AI Coach Chat: Translator, practice dialogues, message gating

📚 Learn Hub: Alphabet, numbers, vocabulary, grammar, phonics, flashcards, quizzes

🎓 Lessons: AI-generated exercises, XP rewards, recap flows

📖 Modules: Advanced units (Alphabet → Culture) with post-module AI Quiz

👤 Profile: Stats, achievements, journal, leaderboard with filters

📡 Offline UX: Optimistic updates, banners, sync & retry

🔍 Observability: Structured logs, correlation IDs, health checks

🌍 i18n Scaffold: English seed, ready for extensions


## 📑 Compliance & Store Docs
- Android: [`DATA_SAFETY_MAPPING.md`](./DATA_SAFETY_MAPPING.md), [`GOOGLE_PLAY_STORE_INFO.md`](./GOOGLE_PLAY_STORE_INFO.md)
- iOS: [`APP_STORE_LISTING_INFO.md`](./APP_STORE_LISTING_INFO.md), [`APP_STORE_PREPARATION.md`](./APP_STORE_PREPARATION.md)
- Web: [`DATA_PRIVACY_MAPPING_WEB.md`](./DATA_PRIVACY_MAPPING_WEB.md)
- Security: [`SECURITY.md`](./SECURITY.md)


---

📱 Features in Depth

🗣️ AI Coach Chat

Inline translator panel embedded in Chat

Suggestion chips for guided dialogue

Premium gating (message limits for free tier)

Remaining messages counter


📖 Learn Hub

Alphabet + Numbers with pronunciation playback

Vocabulary, phrases, grammar, dialogues

Phonics trainer & quick flashcards

AI Tips and Quick Quiz


🎯 Lessons

AI-generated via toolkit.rork.com

Exercise types: multiple choice, fill-blank, match pairs, word order, listening/speaking placeholders

XP rewards, “perfect” bonus, recap summaries

Lessons cache persisted in local storage


🧑‍🏫 Advanced Modules

Alphabet, Numbers, Vowels, Consonants, Syllables

Grammar, Sentences, Dialogue, Pronunciation, Culture

Per-module XP tracking and AI Quiz bonus


👤 Profile & Leaderboard

Stats, achievements, weekly goals

Local personal journal

Leaderboard with filters, sorts, and detail modals

Premium upsell paths


🔒 Offline UX

Online/offline banners, queue helpers, optimistic flows

React Query onlineManager integration


🧩 Observability & Logging

Structured logs with correlation IDs

Client/server error boundaries

Health endpoints for monitoring



---

🏗 Architecture

Navigation

Root stack: app/_layout.tsx

Tabs layout: app/(tabs)/_layout.tsx (Learn, Lessons, Modules, Chat, Profile)

Hidden routes: Translator (in Chat), Leaderboard (in Profile)


State Management

Server state: React Query (lib/react-query.ts)

Local UI state: React hooks + scoped providers (state/)


Backend

Hono server (backend/hono.ts) with security middleware

tRPC router: backend/trpc/app-router.ts

Auth · User · Lessons · Learn · Chat · Analytics · Leaderboard



tRPC Client

Auto base URL detection (native/web)

Batched HTTP with HTML guard & SuperJSON transformer

15s timeout, typed results


Theming

Dark mode aware (lib/theme.ts)

Semantic tokens: colors, spacing, radii, shadows

Pre-styled components (buttons, inputs, cards, toasts)


Error Handling

components/ErrorBoundary.tsx with retry/reset

Structured debugging output in dev mode



---

🎤 AI & Media

LLM: @rork/toolkit-sdk generateObject for AIQuiz; POST /text/llm/ for lessons/tips

Speech-to-Text (STT):

Web: MediaRecorder → FormData → /stt/transcribe

Native: expo-av HIGH_QUALITY → FormData → /stt/transcribe


Text-to-Speech (TTS):

Mock speak() logs for Expo Go/Web (no expo-speech dependency)




---

📡 Data Usage & Privacy

Local Storage (AsyncStorage):

Lessons completion & cache

Profile journal

UI preferences only


Network:

tRPC endpoints under /api/trpc

LLM endpoints: toolkit.rork.com


Privacy & Security:

No secrets in client repo

EXPO_PUBLIC_BACKEND_URL and EXPO_PUBLIC_TOOLKIT_URL for configs

Error messages structured & minimal




---

⚙️ Environment Variables

EXPO_PUBLIC_BACKEND_URL=https://api.example.com
EXPO_PUBLIC_TOOLKIT_URL=https://toolkit.rork.com

Both required at runtime

Backend must expose /api + /api/trpc routes



---

📂 Project Structure (simplified)

app/                # Screens & navigation
  (tabs)/           # Main tabs + hidden routes
backend/            # Hono server + tRPC
components/         # Shared UI (AIQuiz, ErrorBoundary, banners)
hooks/              # Chat store, user store, speech recorder
lib/                # tRPC client, theme, i18n, React Query
modules/            # Learning feature modules
state/              # Providers for learning progress
schemas/            # Validation schemas
constants/          # App constants


---

🚀 Getting Started

# Install dependencies
bun install

# Run with tunnel
bunx rork start --tunnel

# Or standard scripts
npm run start
npm run start-web

Scan QR with Expo Go on iOS/Android

Open browser for Web build



---

🛠 Troubleshooting

tRPCClientError: Failed to fetch

Ensure ${EXPO_PUBLIC_BACKEND_URL}/api is reachable


Split bundle error (@tanstack/query-devtools)

Disable devtools or keep ngrok tunnel alive


STT / Audio recording fails

Check mic permissions (Web: MediaRecorder; Native: expo-av preset)


CORS / AI fetch errors

Verify toolkit.rork.com is reachable




---

✅ Quality & CI/CD

CI Pipelines: Lint · Typecheck · Tests · Coverage (Codecov)

EAS Preview Builds: Android APK + iOS Simulator on pushes

EAS Release Builds: AAB + IPA on tags (vX.Y.Z)

Quality Gate: Semgrep, Gitleaks, Audit, A11y, Lighthouse, Playwright E2E

Badges: Quality, Coverage, Security, Accessibility



---

🔒 Security Notes

Never commit secrets; only use EXPO_PUBLIC_*

Wide CORS allowed in dev only; harden for production

Strict error boundaries; no user input echoed



---

🎨 Design System

Centralized tokens for colors, radii, shadows, spacing

Theme-aware components across tabs and headers

Modern style inspired by iOS, Airbnb, Coinbase



---

♿ Accessibility

Accessible labels & touch targets

Contrast-checked themes

TestIDs on critical UI components

A11y tests run in CI



---

🧪 Testing Strategy

Unit & integration tests (Jest + RTL)

Playwright E2E (Web, Chromium/WebKit)

Quality reports uploaded as artifacts in CI



---

🚦 Release Process

1. Create feature branch → PR → CI passes


2. Merge into develop → preview builds on EAS


3. Tag vX.Y.Z → Release workflows auto-build AAB/IPA


4. Changelog auto-drafted by Release Drafter


5. Store checklist (docs/store/Release-Checklist-Store.md)




---

📊 Observability

Logs: Correlation IDs, structured JSON logs

Metrics: API health endpoints /api/health /api/info

Reports: CI uploads Lighthouse, A11y, Coverage, Security artifacts



---

🤝 Contributing

PRs must pass lint/typecheck/tests before merge

Add testIDs to new UI elements

Prefer tRPC + React Query for server state

Follow commit conventions (semantic/Conventional Commits)



---

📜 License

Proprietary. © 2025 Rork.
All rights reserved.


---

📌 Roadmap

[ ] Expanded i18n packs (multi-locale metadata & UI strings)

[ ] Real TTS integration with expo-speech / cloud fallback

[ ] Advanced AI conversation modes (roleplay, open-ended chat)

[ ] Offline lesson authoring & sync

[ ] Educator dashboard + classroom leaderboard




