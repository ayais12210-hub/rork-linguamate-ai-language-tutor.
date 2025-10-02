# Google Play Readme

This document centralizes Android-specific guidance for the Linguamate — AI Language Tutor app. It complements, not replaces, your internal product docs. It does not perform or automate Play Console submission steps.

## App Overview
- Cross‑platform Expo app (Expo Router + React Native + TypeScript) with a Hono + tRPC backend
- Five tabs: Learn, Lessons, Modules, Chat, Profile
  - Translator lives inside Chat
  - Leaderboard lives inside Profile
- Designed for Expo Go v53 compatibility and React Native Web

## Tech & Architecture
- Client: Expo Router, React Query, strict TypeScript, RN Web compatible APIs
- Backend: Hono at /api + tRPC at /api/trpc
- Env:
  - EXPO_PUBLIC_BACKEND_URL: https://your.api.origin
  - EXPO_PUBLIC_TOOLKIT_URL: https://toolkit.rork.com (optional)

## Build & Run (Development)
- bun i
- bunx rork start or npm run start
- Web: npm run start-web
- Scan QR with Expo Go

Note: This project is designed to run in Expo Go and web. Avoid adding custom native modules not bundled with Expo Go.

## Play Store Listing Content
Use these internal docs while preparing listing content:
- GOOGLE_PLAY_PREPARATION.md — assets, app icons, feature graphics
- GOOGLE_PLAY_STORE_INFO.md — app name, short/long descriptions, screenshots guidance
- DATA_SAFETY_MAPPING.md — Play Data Safety mapping for this app
- POLICY_COMPLIANCE_CHECKLIST.md — self‑audit before submitting
- PRE_SUBMISSION_TESTING.md — QA scenarios
- SECURITY.md — security posture summary
- RELEASE_NOTES.md — version history

Suggested assets (see preparation doc for sizes):
- Adaptive icon (foreground/background) — already in assets/images
- Feature graphic
- Phone screenshots that show: Learn, Lessons, Modules, Chat (with Translator), Profile (with Leaderboard)
- Short promo video (optional)

## Features Snapshot (for screenshots and copy)
- Learn Hub: alphabet, numbers, phrases, grammar, dialogues, phonics trainer, flashcards, quick quiz, progress
- Lessons: AI‑assisted exercises (MCQ, fill‑blank, match pairs, typing, word order), XP rewards, recap
- Modules: Alphabet/Vowels/Consonants/Syllables/Grammar/Sentence/Dialogue/Pronunciation/Culture with post‑module AI quiz
- Chat Coach: conversation practice, suggestion chips, embedded translator
- Profile: stats, goals, journal, and Leaderboard
- Offline‑aware UI and robust error handling

## Data Safety Mapping (Play Console)
Reference DATA_SAFETY_MAPPING.md. High‑level:
- Data collected: usage analytics, non‑sensitive logs; optional LLM requests
- Data shared: none outside configured services
- Storage: local AsyncStorage for preferences/lesson cache/journal (non‑sensitive)
- Security: no client secrets; CORS controlled on backend

## Testing & QA (Pre‑submission)
Follow PRE_SUBMISSION_TESTING.md. Key checks:
- Network resilience (online/offline banners, retry)
- tRPC endpoints reachable via EXPO_PUBLIC_BACKEND_URL
- Web compatibility for all major flows (where applicable)
- Audio recording: on Android physical devices (permissions + MediaRecorder on web fallback)
- The five‑tab layout integrity and deep links
- ErrorBoundary behavior and recovery

## Troubleshooting
- TRPCClientError: Failed to fetch
  - Verify API at ${EXPO_PUBLIC_BACKEND_URL}/api is reachable and CORS enabled
  - Check the console logs for the final tRPC base URL
- Failed to load split bundle … @tanstack/query-devtools …
  - Ensure devtools lazy bundle isn’t blocked by tunnels; disable devtools if not needed
- Suggestions/AI fetch failures
  - Verify connectivity to toolkit.rork.com and do not override Content‑Type for FormData on web

## Release Notes & Versioning
- Maintain RELEASE_NOTES.md
- Increment app version metadata consistently across app.json and store listing

## Legal & Compliance
- Review POLICY_COMPLIANCE_CHECKLIST.md and SECURITY.md
- Ensure privacy policy URL is live and aligned with DATA_SAFETY_MAPPING.md

## Support Runbook
- Health: backend/routes/health.ts served under /api/health
- Logs: client logs + backend request logs with correlation IDs
- Incident response: see observability/INCIDENT_RUNBOOK.md

This file is informational and does not include Play Console submission procedures.