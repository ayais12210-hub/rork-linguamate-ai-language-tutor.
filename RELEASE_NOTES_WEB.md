# 🌐 Release Notes — Linguamate AI (Web)

---

## 🚀 Version 1.0.0
**Date:** 2025-11-01  
**Platform:** Web (initial beta release)  

### ✨ Features
- 🎉 First web release of **Linguamate AI**.  
- Deployed to **Vercel staging** (`staging.linguamate.ai`).  
- Learn Hub: alphabets, numbers, phrases, dialogues, phonics trainer.  
- **AI Coach Chat** with inline translator and suggestion chips.  
- AI-powered quizzes integrated into modules.  
- Offline banner + retry flow for unreliable connections.  
- Responsive design tested for desktop + mobile browsers.  

### 🛠 Improvements
- SPA refresh supported on deep routes (e.g., `/learn`, `/lessons`).  
- 404 redirect rules added for SPA compatibility.  
- Image optimization + lazy loading for faster load times.  
- Added Lighthouse baseline scoring: Perf 78, A11y 92, SEO 85.  

### 🐞 Fixes
- Fixed bug where quiz results did not render after refresh.  
- Corrected dark mode theme not persisting between sessions.  
- Patched Web Safari issue with phonics audio playback.  

### ⚠️ Known Issues
- Safari audio recording limited by MediaRecorder API.  
- First page load slower on 3G due to large bundle size.  

### 🧑‍💻 Dev Notes
- Deployed using `expo export --platform web` → `dist/`.  
- Hosting: Vercel (staging) with Netlify fallback for edge caching tests.  
- CI/CD pipeline includes Playwright E2E tests across Chrome, Firefox, Safari, Edge.  
- Logs show stable API connection to staging backend.  

---

## 🚀 Version 1.0.1
**Date:** 2025-11-15  
**Platform:** Web  

### ✨ Features
- Added **progress tracker** widget to Learn Hub.  
- New **phonics playback controls** with looping & speed adjustment.  
- Initial **SEO improvements**: meta tags, sitemap.xml, robots.txt.  

### 🛠 Improvements
- Improved page load: LCP reduced by 600ms.  
- Reduced CLS by fixing flash of unstyled text (FOUT).  
- Added service worker caching for static assets.  
- Preloaded fonts for smoother first paint.  

### 🐞 Fixes
- Patched bug where cached quizzes wouldn’t update with new content.  
- Fixed router fallback causing duplicate history entries.  
- Corrected accessibility labels for leaderboard controls.  

### ⚠️ Known Issues
- Offline mode caches lessons but not audio recordings yet.  
- CLS spikes on older iPads (WebKit bug).  

### 🧑‍💻 Dev Notes
- Lighthouse scores: Perf 84, A11y 94, SEO 92, Best Practices 96.  
- Added CI/CD stage for automated Lighthouse report uploads.  
- Feature flags scaffolded: `FEATURE_AI_QUIZ_V2`, `FEATURE_OFFLINE_CACHE_V2`.  

---

## 🚀 Version 1.1.0
**Date:** 2025-12-05  
**Platform:** Web  

### ✨ Features
- Added **Leaderboard** with weekly and monthly rankings.  
- New **“AI Tips” panel** in Learn Hub for contextual hints.  
- Introduced **progressive web app (PWA) support**: installable app with offline cache.  

### 🛠 Improvements
- Split bundles with dynamic imports for faster first load.  
- Optimized images with responsive sizes and CDN caching.  
- Added preconnect hints for faster API resolution.  
- Upgraded to React Query 5 for better caching.  

### 🐞 Fixes
- Fixed offline banner not disappearing after reconnect.  
- Patched bug where Safari users saw duplicated toasts.  
- Corrected issue where leaderboard sort didn’t persist after refresh.  

### ⚠️ Known Issues
- PWA audio recording not yet supported on iOS Safari.  
- Some users report slow XP sync when network is unstable.  

### 🧑‍💻 Dev Notes
- Deployed production domain: `linguamate.ai`.  
- Hosting: Vercel with CDN edge caching enabled.  
- CSP locked down to production domains.  
- Coverage: 87% (unit, integration, E2E).  

---

## 📋 Template for Future Releases

### ✨ Features
- (List new features introduced in this version.)

### 🛠 Improvements
- (Performance, SEO, caching, accessibility improvements.)

### 🐞 Fixes
- (List bug fixes with browser/platform context.)

### ⚠️ Known Issues
- (Known limitations or environment-specific issues.)

### 🧑‍💻 Dev Notes
- (Deployment info, CI/CD changes, coverage metrics, infra notes.)

