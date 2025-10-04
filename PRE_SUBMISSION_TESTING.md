# 🤖 Pre-Submission Testing (Android)

Use this as a lightweight QA script before promoting a build from **Internal** to **Closed/Open/Production** tracks.  
Run tests on at least one **mid-tier Android device** (Android 10+, ~3GB RAM) and one **low-tier device** if possible.

---

## 1. Smoke Tests
- ✅ Cold start: app launches to onboarding or main tab in < 3 seconds.  
- ✅ Navigate across all tabs without crash:  
  - Learn → Lessons → Modules → Leaderboard → Chat → Profile.  
- ✅ AI Quiz: loads after completing a Module section.  
  - Verify questions render, answers submit, XP awards correctly.  
  - Force error case (e.g. disable network) → shows error UI gracefully.  

---

## 2. Audio Functionality
- ✅ On **Modules page**, play/stop audio samples (letters, syllables).  
  - Confirm same playback quality/parity as Learn page.  
- ✅ Microphone:  
  - Permission prompt appears only when first recording attempt.  
  - Deny → graceful fallback with “Microphone required” message.  
  - Allow → recording begins, stops on user action.  
- ✅ STT (Speech-to-Text):  
  - Upload request sent to `/api/stt/transcribe`.  
  - On success → transcription displayed in chat/lesson.  
  - On error → user sees retry option + log captured (no crash).  
- **Status:** STT now proxied via `/api/stt/transcribe` with rate limiting + robust JSON/error handling. Client validated on web + native dev.  

---

## 3. Network & Errors
- ✅ Simulate offline (Airplane mode):  
  - Banner/overlay shows friendly “Offline” message.  
  - Retry after reconnect works.  
- ✅ tRPC endpoints (`learn`, `lessons`, `leaderboard`, `user`) return valid schema data.  
- ✅ Graceful fallback if endpoint returns error (e.g. 500).  

---

## 4. UI / UX
- ✅ Text remains legible at **200% font size** (Android accessibility setting).  
- ✅ Interactive controls (buttons, chips, list items) ≥ 44×44dp touch targets.  
- ✅ No layout overflow on:  
  - Small screens (≤5.5" devices).  
  - Web view / tablet landscape.  
- ✅ Dark mode: check color contrast and theming consistency.  

---

## 5. Performance
- ✅ Lesson and leaderboard lists scroll smoothly at ~60fps.  
- ✅ Memory check: switch tabs 20× repeatedly; no memory leaks or degraded FPS.  
- ✅ App returns to same state when resumed from background.  

---

## 6. Security
- ✅ Inspect logs: no secrets, API keys, or tokens printed.  
- ✅ Inspect API calls in dev tools:  
  - TLS enforced (`https://` only).  
  - No sensitive data in query strings.  
- ✅ Local storage: only non-sensitive values cached (no raw tokens).  

---

## 7. Play Console Tracks
- ✅ Install build via **Internal Testing** link.  
- ✅ Upgrade from previous version via Play Store → data persists (local lessons, profile stats remain intact).  
- ✅ Verify app signature and Play App Signing enabled.  

---

## ✅ Final Checklist Before Promotion
- [ ] Cold start < 3s  
- [ ] Tab navigation works without crash  
- [ ] AI Quiz loads + handles errors  
- [ ] Audio playback works (Learn/Modules parity)  
- [ ] Microphone/STT tested (success + error)  
- [ ] Offline mode tested (banner + retry)  
- [ ] tRPC endpoints validated  
- [ ] UI responsive (200% font, 44×44 touch, no overflow)  
- [ ] Smooth scrolling, no memory leaks  
- [ ] Security checks (TLS, logs, storage)  
- [ ] Internal → Closed/Open track upgrade keeps data  

---

✅ When all boxes are ticked, the build is ready to **promote from Internal Testing** to the next Play Console track.