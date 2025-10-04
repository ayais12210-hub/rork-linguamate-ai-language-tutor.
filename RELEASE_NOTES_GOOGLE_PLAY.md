# 📦 Release Notes — Linguamate AI (Google Play)

---

## 🚀 Version 1.0.0
**Date:** 2025-10-03  
**Platform:** Android (initial release)  

### 📝 User-Facing Notes (for Google Play Store)
- 🎉 First Android release of Linguamate AI!  
- Learn alphabets, numbers, vocabulary, and grammar with ease.  
- AI-powered quizzes after every module.  
- Practice conversations with the AI Coach Chat.  
- Offline learning supported.  
- Track progress with achievements and streaks.  

### 🧑‍💻 Dev Notes
- Tested on Android SDK 24+.  
- Expo Go v53 build, deployed via EAS.  
- STT proxied through `/api/stt/transcribe`.  
- CI/CD pipeline includes unit + E2E Playwright tests.  
- Coverage: 76%.  

---

## 🚀 Version 1.0.1
**Date:** 2025-10-20  

### 📝 User-Facing Notes
- New streak counter to keep your learning habit strong.  
- Phonics trainer module added.  
- Dark mode toggle in Profile settings.  
- Bug fixes and stability improvements.  

### 🧑‍💻 Dev Notes
- Optimized offline queue with retry mechanism.  
- Reduced cold start time by ~1s.  
- Accessibility: larger tap targets for buttons.  
- CI/CD updated with Lighthouse checks.  

---

## 🚀 Version 1.1.0
**Date:** 2025-11-05  

### 📝 User-Facing Notes
- Added Leaderboard to see how you rank with friends.  
- AI Tips panel in Learn Hub for smarter guidance.  
- Faster navigation and smoother transitions.  
- General performance improvements.  

### 🧑‍💻 Dev Notes
- Prefetching enabled for next lesson content.  
- Web + Android parity ensured for Learn Hub.  
- Logging improved with correlation IDs.  
- Coverage: 82%.  

---

## 🚀 Version 1.2.0
**Date:** 2025-11-20  

### 📝 User-Facing Notes
- Personal Journal added in Profile.  
- Achievements system introduced (badges for milestones).  
- Better dark mode experience.  
- Important bug fixes.  

### 🧑‍💻 Dev Notes
- Audio system unified across Android/iOS/Web.  
- Cache invalidation patched in offline mode.  
- CI pipeline now runs Semgrep + Gitleaks.  
- Coverage: 85%.  

---

## 🚀 Version 2.0.0
**Date:** 2026-01-10  

### 📝 User-Facing Notes
- 💎 Premium tier now available (unlimited chat & advanced lessons).  
- Open-ended AI conversations introduced.  
- Classroom Mode (beta) for educators.  
- Offline mode more powerful.  
- Many bug fixes and UX improvements.  

### 🧑‍💻 Dev Notes
- Billing integrated with Google Play Billing.  
- STT pipeline improved for low-bandwidth scenarios.  
- PWA support tested (installable web app).  
- Coverage: 89%.  

---

## 📋 Template for Future Releases (Google Play)

### 📝 User-Facing Notes
- (Keep this short, simple, and end-user friendly.  
  Focus on: new features, performance improvements, and bug fixes.)  

### 🧑‍💻 Dev Notes
- (Add developer-only context: API changes, infra updates, CI/CD details, coverage stats, known issues.)