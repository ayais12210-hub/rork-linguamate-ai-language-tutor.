# iOS Readme

This document centralizes iOS‑specific guidance for the Linguamate — AI Language Tutor app. It complements, not replaces, your internal docs. It does not perform or automate App Store Connect submission steps.

## App Overview
- Expo app with five tabs: Learn, Lessons, Modules, Chat, Profile
  - Translator embedded in Chat
  - Leaderboard embedded in Profile
- Expo Go v53 compatible; React Native Web support

## Tech & Architecture
- Client: Expo Router + React Query + TypeScript
- Backend: Hono at /api with tRPC at /api/trpc
- Env:
  - EXPO_PUBLIC_BACKEND_URL: https://your.api.origin
  - EXPO_PUBLIC_TOOLKIT_URL: https://toolkit.rork.com (optional)

## Build & Run (Development)
- Install: bun i
- Start: bunx rork start or npm run start
- Web preview: npm run start-web
- Open in Expo Go (iOS device)

Note: Designed to run in Expo Go. Avoid adding custom native packages not available in Expo Go.

## App Store Listing Content
Use these internal docs while preparing metadata:
- APP_STORE_PREPARATION.md — checklist for assets and copy gathering
- APP_STORE_LISTING_INFO.md — name, subtitle, description, keywords, marketing URLs
- DATA_PRIVACY_MAPPING_IOS.md — privacy nutrition labels mapping for this app
- PRE_SUBMISSION_TESTING_IOS.md — QA scenarios
- SECURITY_IOS.md — platform‑specific security notes
- RELEASE_NOTES_IOS.md — version history for iOS

Suggested assets (see preparation doc for sizes):
- App icon (from assets/images)
- iPhone screenshots highlighting: Learn, Lessons, Modules, Chat (with Translator), Profile (with Leaderboard)
- App Preview video (optional)

## Features Snapshot (for screenshots and copy)
- Learn Hub: alphabet, numbers, phrases, grammar, dialogues, phonics trainer, flashcards, quick quiz, progress
- Lessons: AI‑assisted exercises with XP and recap
- Modules: core language skill modules + AI quiz
- Chat Coach: conversation practice, suggestion chips, embedded translator
- Profile: stats, goals, journal, and Leaderboard
- Offline‑aware UX and structured error handling

## Privacy Nutrition Label Mapping
See DATA_PRIVACY_MAPPING_IOS.md. High‑level:
- Data types: usage analytics and non‑sensitive diagnostics
- Not linked to user identity by default; adjust if you add authentication PII
- On‑device storage limited to preferences, journal, and lesson cache (non‑sensitive)

## Testing & QA (Pre‑submission)
Follow PRE_SUBMISSION_TESTING_IOS.md. Key checks:
- App boots reliably in Expo Go on iOS
- API connectivity via EXPO_PUBLIC_BACKEND_URL
- Offline banner and recovery flows
- Audio recording on iOS (Expo AV configuration; permission prompts)
- Five‑tab layout integrity, deep navigation and ErrorBoundary recovery

## Troubleshooting
- TRPCClientError: Failed to fetch
  - Verify ${EXPO_PUBLIC_BACKEND_URL}/api is reachable; check CORS and device network
- Devtools lazy bundle errors
  - Disable React Query devtools on device if your tunnel is offline
- Media upload failures (STT)
  - Append audio as { uri, name, type } in FormData; avoid manual Content‑Type on iOS

## Release Notes & Versioning
- Maintain RELEASE_NOTES_IOS.md
- Keep app.json version/build consistent with listing metadata

## Legal & Compliance
- Review POLICY_COMPLIANCE_CHECKLIST_IOS.md and SECURITY_IOS.md
- Ensure privacy policy URL matches DATA_PRIVACY_MAPPING_IOS.md

## Support Runbook
- Health endpoint under /api/health
- Correlated request logs on server; client logs with structured fields
- Incident playbooks: observability/INCIDENT_RUNBOOK.md

This file is informational and does not include App Store submission procedures.