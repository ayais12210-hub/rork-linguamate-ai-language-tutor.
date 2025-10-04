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

### 🧑‍💻 Dev Notes
- Tested on Android SDK 24+ with React Native / Expo Go v53.
- tRPC endpoints validated against staging + production APIs.
- STT now proxied via `/api/stt/transcribe` with rate limiting and JSON error handling.
- Codebase includes **seed tests** for lessons, chat, and modules.
- Logging improved with correlation IDs for better debugging.

---

## 📋 Template for Future Releases

### ✨ Features
- (List all new features introduced in this version.)

### 🛠 Improvements
- (Document performance, UX, or architecture improvements.)

### 🐞 Fixes
- (List bug fixes with context or issue numbers.)

### 🧑‍💻 Dev Notes
- (Include developer notes such as testing environment, API changes, migrations, or known limitations.)