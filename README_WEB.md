# Web Readme

This document centralizes web deployment and operations guidance for the Linguamate — AI Language Tutor app running with React Native Web. It does not perform or automate hosting provider steps.

## App Overview
- Single codebase for iOS/Android/Web with five tabs: Learn, Lessons, Modules, Chat, Profile
  - Translator embedded within Chat
  - Leaderboard embedded within Profile
- Expo Router + React Native Web

## Tech & Architecture
- Client: Expo (web), React Query, strict TypeScript
- Backend: Hono at /api with tRPC at /api/trpc
- Web audio: MediaRecorder for STT; FormData uploads without manual Content‑Type headers
- Env:
  - EXPO_PUBLIC_BACKEND_URL: https://your.api.origin (if backend hosted separately)
  - EXPO_PUBLIC_TOOLKIT_URL: https://toolkit.rork.com (optional)

## Local Development
- bun i
- npm run start-web (or bunx rork start and open web)
- Ensure backend reachable from web origin or set EXPO_PUBLIC_BACKEND_URL

## Web Deployment Preparation
See WEB_DEPLOYMENT_PREPARATION.md and WEB_APP_INFO.md.
- Choose hosting (e.g., static hosting with a server proxy for /api)
- Configure rewrites:
  - /* → index.html (SPA)
  - /api/* → your backend origin
  - /api/trpc/* → your backend origin
- Ensure CORS matches web origin

## Features Snapshot (for screenshots and site metadata)
- Learn Hub, Lessons (AI‑assisted), Modules, Chat + Translator, Profile + Leaderboard
- Error boundaries and offline indicators

## Accessibility & Performance
- testID and accessible labels across interactive components
- Image optimization: use expo‑image with basic web support; prefer network URLs
- Avoid layout animations from reanimated on web; use RN Animated or static fallbacks

## Testing & QA
- PRE_DEPLOYMENT_TESTING_WEB.md for scenarios
- Validate:
  - SPA routing works on reload and deep links
  - tRPC endpoints reachable via same origin or configured EXPO_PUBLIC_BACKEND_URL
  - MediaRecorder permissions and upload path to STT endpoint
  - Offline banner shows and recovers
  - All five tabs render correctly

## Troubleshooting
- TRPCClientError: Failed to fetch
  - If backend is on another origin, set EXPO_PUBLIC_BACKEND_URL
  - Verify proxy/rewrites for /api and /api/trpc
- Failed to load split bundle … @tanstack/query-devtools …
  - If tunnel/CDN is offline, disable devtools or ensure network path is valid
- STT upload failures
  - Do not set Content‑Type manually; let the browser define multipart boundaries

## Release Notes & Versioning
- Maintain RELEASE_NOTES_WEB.md
- Keep site metadata aligned with WEB_APP_INFO.md

## Security & Compliance
- Review SECURITY_WEB.md and POLICY_COMPLIANCE_CHECKLIST_WEB.md
- Confirm privacy policy content aligns with DATA_PRIVACY_MAPPING_WEB.md

## Operations
- Backend health: /api/health
- Structured logs with correlation IDs
- Incident runbook: observability/INCIDENT_RUNBOOK.md

This file is informational and does not include hosting provider deployment procedures.