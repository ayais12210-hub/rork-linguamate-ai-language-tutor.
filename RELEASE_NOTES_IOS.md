# 📦 Release Notes — Linguamate AI (iOS)

---

## 🚀 Version 1.0.0
**Date:** 2025-11-20  
**Platform:** iOS (initial release)  

### ✨ Features
- 🎉 First iOS release of **Linguamate AI**.  
- Core Learn Hub: alphabets, numbers, vocabulary, phonics, dialogues.  
- **AI-powered quizzes** with instant feedback after each module.  
- **AI Coach Chat**: practise conversations with live translation panel.  
- Offline caching for lessons and streak tracking.  
- Profile with achievements, journal, and leaderboard.  

### 🛠 Improvements
- Unified audio pipeline across iOS/Android/Web for playback and STT.  
- Optimized bundle size by 22% for faster downloads.  
- Dark mode with adaptive semantic colors.  

### 🐞 Fixes
- Fixed crash when microphone permission denied.  
- Corrected XP sync when offline → online transitions.  
- Patched routing issue when jumping between Learn → Lessons → Modules.  

### ⚠️ Known Issues
- Safari PWA build does not fully support audio recording.  
- Some VoiceOver gestures conflict with quiz animations.  

### 🧑‍💻 Dev Notes
- Tested on iOS 16 & iOS 17 simulators, iPhone 11 → iPhone 15 Pro Max.  
- Built with **Expo Go v53** and tested against App Store Connect pipelines.  
- Billing integration prepared but not enabled (planned for v1.1.0).  
- Detox added for native UI testing.  

---

## 🚀 Version 1.0.1
**Date:** 2025-12-05  
**Platform:** iOS  

### ✨ Features
- Added **daily streak counter** in Profile.  
- Push notification integration for streak reminders (opt-in).  
- New **phonics trainer** module added.  

### 🛠 Improvements
- Improved screen reader support for quizzes (VoiceOver).  
- Optimized lesson prefetching for faster navigation.  
- STT pipeline tuned for low-latency feedback.  

### 🐞 Fixes
- Patched lesson recap not saving on iPad devices.  
- Fixed crash when rotating device during AI Coach session.  
- Corrected bonus XP calculation for perfect streaks.  

### 🧑‍💻 Dev Notes
- Added CI/CD job for iOS simulator builds.  
- Lighthouse and accessibility audits run as part of QA pipeline.  

---

## 🚀 Version 1.1.0
**Date:** 2026-01-15  
**Platform:** iOS  

### ✨ Features
- **Premium tier unlocked** (monthly & annual plans).  
- **Achievements badges** added for XP milestones.  
- **Leaderboard filters** by weekly/monthly progress.  

### 🛠 Improvements
- Reduced app launch cold start to ~2s on iPhone 12.  
- Dark mode refined for OLED devices.  
- Accessibility: larger tap targets for navigation buttons.  

### 🐞 Fixes
- Fixed memory leak in lessons cache.  
- Patched bug causing microphone not to re-activate after backgrounding the app.  
- Fixed incorrect leaderboard sorting.  

### 🧑‍💻 Dev Notes
- In-app purchases integrated with **StoreKit** (Sandbox tested).  
- Code coverage: 82%.  
- TestFlight group expanded for beta testers.  

---

## 📋 Template for Future Releases

### ✨ Features
- (List all new features introduced in this version.)

### 🛠 Improvements
- (Performance, UX, or accessibility improvements.)

### 🐞 Fixes
- (List bug fixes with context or issue numbers.)

### ⚠️ Known Issues
- (Track unresolved bugs or limitations.)

### 🧑‍💻 Dev Notes
- (Include testing environments, API updates, CI/CD changes, coverage stats.)
