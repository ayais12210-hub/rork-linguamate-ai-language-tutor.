# 📦 Release Notes — Linguamate AI

---

## 🚀 Version 1.0.0
**Date:** 2025-10-03  
**Platform:** Android (initial release)  

### ✨ Features
- Initial Android release of **Linguamate AI**.
- Core learning modules with **AI-powered quizzes** at the end of each section.
- Integrated audio playback on both **Learn** and **Modules** pages.
- Offline caching for lessons and progress tracking.
- Profile with basic stats and achievements.

### 🛠 Improvements
- Audio playback parity between **Learn** and **Modules** pages.
- Optimized loading speed for quizzes and lessons.
- Improved error messaging for offline or poor network conditions.
- Enhanced accessibility labels for major interactive elements.

### 🐞 Fixes
- Fixed crash when switching tabs rapidly on mid-tier devices.
- Resolved bug where AI quiz results sometimes failed to display on first attempt.
- Corrected lesson recap not persisting in offline mode.

### ⚠️ Known Issues
- Speech-to-text accuracy may vary by accent.  
- Offline mode does not cache audio clips.  

### 🧑‍💻 Dev Notes
- Tested on Android SDK 24+ with React Native / Expo Go v53.
- tRPC endpoints validated against staging + production APIs.
- STT now proxied via `/api/stt/transcribe` with rate limiting and JSON error handling.
- Codebase includes **seed tests** for lessons, chat, and modules.
- Logging improved with correlation IDs for better debugging.

---

## 🚀 Version 1.0.1
**Date:** 2025-10-15  
**Platform:** Android  

### ✨ Features
- Added **daily streaks** to encourage consistent learning.  
- Introduced **light/dark mode toggle** in profile settings.  
- New **phonics trainer** module added to Learn tab.  

### 🛠 Improvements
- Optimized offline sync to retry failed uploads more intelligently.  
- Accessibility: Improved screen reader support for quizzes.  
- Performance tuning: Reduced cold start time by 800ms on mid-tier devices.  

### 🐞 Fixes
- Fixed bug where quiz animations overlapped on certain screen sizes.  
- Patched memory leak in lessons cache.  
- Corrected XP calculation when user retries quizzes.  

### ⚠️ Known Issues
- Some users report delay in audio playback after offline recovery.  

### 🧑‍💻 Dev Notes
- Jest coverage raised from 65% → 78%.  
- CI/CD pipeline updated with Lighthouse audit stage.  
- Playwright E2E added for Learn + Quiz flows.  

---

## 🚀 Version 1.1.0
**Date:** 2025-11-01  
**Platform:** Android + Web  

### ✨ Features
- **Web deployment (beta)** via Vercel staging.  
- Added **Leaderboard** in Profile tab with weekly ranking.  
- New **AI tips panel** in Learn Hub to provide contextual advice.  

### 🛠 Improvements
- Lessons now prefetch next module for smoother navigation.  
- Reduced STT upload payload size by 40%.  
- Accessibility: Larger tap targets for lesson navigation.  

### 🐞 Fixes
- Fixed web SPA refresh bug (404 routing).  
- Patched error boundary not catching quiz timeout failures.  
- Fixed incorrect XP bonus on perfect quizzes.  

### ⚠️ Known Issues
- iOS support still pending (planned for v1.2.0).  
- Audio recording on Web Safari limited due to MediaRecorder API.  

### 🧑‍💻 Dev Notes
- Web build tested against Chrome, Firefox, Edge. Safari issues logged.  
- Added pre-submission testing scripts for Play Store.  
- Coverage: 84%.  

---

## 🚀 Version 1.2.0
**Date:** 2025-11-20  
**Platform:** Android + Web + iOS (first build)  

### ✨ Features
- **iOS support added** (tested on iOS 16/17 simulators).  
- Added **personal journal** in Profile (local-only).  
- New **achievements system**: badges for streaks, milestones.  

### 🛠 Improvements
- Audio pipeline unified across Android/iOS/Web.  
- Optimized bundle size (reduced by 22%).  
- Enhanced dark mode theming with semantic colors.  

### 🐞 Fixes
- Fixed crash in iOS build when microphone permission denied.  
- Corrected cache invalidation bug in offline mode.  
- Patched routing issue between Learn → Lessons → Modules.  

### ⚠️ Known Issues
- Playwright E2E on iOS simulator unstable.  

### 🧑‍💻 Dev Notes
- iOS App Store prep completed (`APP_STORE_PREPARATION_COMPLETED.md`).  
- Added detox framework for native UI testing.  
- CI pipeline includes iOS simulator builds (GitHub Actions + Mac runner).  

---

## 🚀 Version 2.0.0
**Date:** 2026-01-10  
**Platforms:** Android, iOS, Web  

### ✨ Features
- Major release introducing **open-ended AI conversations**.  
- Added **premium tier** with unlimited messages + advanced lessons.  
- Introduced **classroom mode** for educators (beta).  

### 🛠 Improvements
- Performance: cold start <2s across platforms.  
- New offline-first architecture with React Query cache hydration.  
- Updated AI model to reduce latency by 30%.  

### 🐞 Fixes
- Fixed intermittent STT transcription failures on low bandwidth.  
- Patched bug where streak resets incorrectly after timezone change.  
- Corrected leaderboard sorting logic.  

### ⚠️ Known Issues
- Premium upsell banner shown too aggressively in free tier (to be tuned).  

### 🧑‍💻 Dev Notes
- Premium billing via Google Play Billing + App Store IAP.  
- Web now supports PWA mode (installable).  
- Security: Semgrep scans integrated into CI.  

---

## 📋 Master Template for Future Releases

### ✨ Features
- (List new features introduced in this version.)  
- (Mark breaking changes if any.)  

### 🛠 Improvements
- (Performance, UX, accessibility, architecture improvements.)  

### 🐞 Fixes
- (Bug fixes with context, issue numbers, regression notes.)  

### ⚠️ Known Issues
- (Track unresolved bugs or platform limitations.)  

### 🧑‍💻 Dev Notes
- (Developer-facing notes: testing environment, migrations, CI/CD updates, coverage stats, release strategy.)