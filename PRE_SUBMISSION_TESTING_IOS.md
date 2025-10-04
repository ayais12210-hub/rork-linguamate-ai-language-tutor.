

✅ Pre-Submission Testing (iOS) — Linguamate AI

This checklist must be completed before submitting to App Store Connect (TestFlight → App Review).
Scope: iPhone + iPad, iOS 14–18 (as available), both light/dark modes, and English baseline locale.


---

0) Test Build & Environment

[ ] Build: vX.Y.Z (build N) (TestFlight/Internal)

[ ] Commit/Tag: vX.Y.Z

[ ] Backend: Production/Staging (pick one)

[ ] Feature flags frozen for release

[ ] Crash/analytics opt-in default respected



---

1) Device Matrix & Pass Criteria

Device	OS	Form Factor	Mode	Network	Status

iPhone 15 Pro	iOS 18	Phone	Light/Dark	Wi-Fi/4G	☐
iPhone 13	iOS 17	Phone	Light/Dark	Wi-Fi/4G	☐
iPhone SE (2nd/3rd gen)	iOS 16	Small Phone	Light/Dark	Wi-Fi/4G	☐
iPad Pro 12.9"	iPadOS 17	Tablet	Light/Dark	Wi-Fi	☐
iPad (10th gen)	iPadOS 16	Tablet	Light/Dark	Wi-Fi	☐


Pass criteria: All priority P0/P1 tests below must pass on at least 1 recent iPhone and 1 iPad. No known-crash regressions.


---

2) Launch & Layout (Safe Areas, Clipping)

[ ] Cold launch to Home/Onboarding in < 3s on mid-tier iPhone (e.g., iPhone 13).

[ ] No UI elements under the notch, home indicator, or status bar.

[ ] All tab bars, headers, toasts respect safe areas in portrait/landscape (iPad).

[ ] Dynamic Type: UI scales at L, XL, XXL without truncation.

[ ] Right-to-left mirroring (optional check) doesn’t break layout.


Record: launch time (ms), screenshots of key screens (Learn, Lessons, Modules, Chat, Profile).


---

3) Offline Behaviour

Steps:

1. Launch online → navigate to Learn and Lessons; wait for initial data.


2. Toggle Airplane mode.


3. Attempt: open cached items; start a lesson; open Chat (expect graceful error); return to Learn.



Expected:

[ ] Offline banner appears with retry CTA.

[ ] Cached lessons remain accessible; new network calls fail with friendly copy.

[ ] No infinite spinners; errors are recoverable once back online.


Bonus: Simulate flaky 3G via Network Link Conditioner and repeat.


---

4) Permission Flows (Strings & Timing)

[ ] Microphone: Request only when user taps “Record” in Chat/Lessons.

NSMicrophoneUsageDescription text is accurate, friendly, and non-scary.


[ ] Camera/Photos/Location/Notifications: Not requested unless feature exists; strings accurate if used.

[ ] Deny → Retry flow: app explains how to enable in Settings.


Expected copy (example):

> “Linguamate uses your microphone only while you’re practising speaking. Audio isn’t stored unless you choose to save it.”




---

5) Authentication (If Accounts Enabled)

[ ] Sign Up: valid/invalid inputs; password rules enforced; error copy helpful.

[ ] Email verification (if applicable): link opens app correctly.

[ ] Sign In: success and wrong-password handling.

[ ] Reset Password: link deep-links back to the right screen.

[ ] Sign Out: clears tokens; returns to onboarding; no residual user data.

[ ] Account Deletion/Export (if implemented): path visible and functional.



---

6) Purchases (If Premium Enabled)

[ ] Purchase (StoreKit Sandbox): monthly/annual SKUs visible with correct price/locale.

[ ] Buy flow succeeds; entitlement immediately applied (messages limits lifted, etc.).

[ ] Restore Purchases works on fresh install/second device.

[ ] Cancellation reflected (grace period handled, no crashes).

[ ] Receipt validation doesn’t block base functionality.


Note: Capture sandbox tester Apple ID used and screenshots of receipts in Dev Notes.


---

7) Deep Links / Universal Links

[ ] Tapping https://linguamate.ai/learn opens app to Learn.

[ ] .../lessons/:id opens the correct lesson detail.

[ ] .../profile opens Profile.

[ ] Backgrounded app resumes to target screen.


Setup reminders:

Associated Domains: applinks:linguamate.ai, applinks:app.linguamate.ai.

AASA file valid, reachable, and includes paths.



---

8) Background / Foreground Transitions

[ ] Background for >30s, then foreground: state preserved in all tabs.

[ ] Audio playback paused/resumed correctly; no double-play.

[ ] Active quiz timer pauses during background; resumes safely.

[ ] Microphone session re-initialises after backgrounding.



---

9) Performance

[ ] Cold start: < 3s on iPhone 13; < 4s on iPad (first run).

[ ] Warm start: < 1.5s.

[ ] Scroll perf: 60fps in Learn/Modules lists; no jank on older devices.

[ ] Memory: no sustained growth after 20x tab switches.

[ ] Bundle size within target (note size for release log).


Tools: Xcode Instruments (Time Profiler), MetricKit, manual stopwatch for UX.


---

10) Accessibility (WCAG 2.1 AA + iOS HIG)

[ ] VoiceOver reads labels for all actionable items; order is logical.

[ ] Dynamic Type: content usable up to XXL; no cut-off.

[ ] Contrast ≥ 4.5:1 for body text; 3:1 for large text/icons.

[ ] Hit targets ≥ 44×44 pt.

[ ] Focus indicators visible; keyboard navigation (external) reasonable on iPad.



---

11) Stability (Crashes & Hangs)

[ ] Zero crashes across all devices during test session.

[ ] No infinite spinners or dead-end screens.

[ ] Error boundaries show actionable recovery.


If crash occurs: capture device, OS, steps, logs, and symbolicated stack.


---

12) Feature-Specific Smoke Tests

Learn

[ ] Alphabet/Numbers cards open; audio plays; close works.

[ ] Phonics trainer: play/loop/speed controls working.


Lessons

[ ] AI-generated lesson loads; exercise types render (MCQ/fill/match/order).

[ ] Submitting answers updates XP; “perfect” bonus triggers correctly.

[ ] Recap summary persists and reloads after app restart.


Modules

[ ] Progress and XP tracked across sections.

[ ] Post-module AI Quiz returns valid prompts and scoring.


Chat

[ ] AI Coach sends/receives; suggestion chips clickable.

[ ] Translator pane opens; inline translation usable.

[ ] Message limit banners (free tier) appear at the correct thresholds.


Profile

[ ] Stats & achievements display; streak increments daily edge case OK.

[ ] Journal (local only) creates/edits/deletes notes.



---

13) Networking & Error Paths

[ ] tRPC endpoints (user/lessons/learn/leaderboard/chat) return expected shapes; error states show friendly copy.

[ ] Timeouts (simulate 10–15s): UI provides retry.

[ ] HTTP 401/403/500: toasts/dialogs are understandable; no raw errors.



---

14) Compliance & Store Requirements

[ ] App Privacy section matches Privacy Policy (data types & purposes).

[ ] Privacy Policy & Terms linked in Settings and app footer (if present).

[ ] No restricted APIs (SMS/Call logs/Background recording).

[ ] Age rating accurate; no child-directed content unless enrolled in DFF.

[ ] App icon, screenshots, preview video match current build.



---

15) Localization & Theming

[ ] English baseline copy proof-read; no lorem ipsum.

[ ] Special characters (diacritics/RTL sample) render correctly.

[ ] Light/Dark mode parity; no illegible text in either theme.



---

16) Telemetry (Opt-In)

[ ] Analytics/crash reporting opt-in respected.

[ ] If enabled, events show no PII; session/device IDs anonymised.

[ ] Opt-out immediately stops tracking.



---

17) Results Log Template (Fill During Testing)

Session Info

Tester:

Date/Time:

Build: vX.Y.Z (N)

Device/OS:


Findings

P0 (blockers):

P1 (major):

P2 (minor):


Screenshots/Recordings

Links:


Conclusion

Ready for submission: ☐ Yes ☐ No

Notes:



---

18) Known Issues (if any)

[ ] (ID/Title) — Workaround:

[ ] (ID/Title) — Target fix: vX.Y.Z+1



---

19) Sign-Off

QA/Test Owner: __________________  Date: __________

Eng Lead: ________________________  Date: __________

Product: _________________________  Date: __________



---

Appendix A — Quick Commands & Tips

Reset app state: uninstall → reinstall from TestFlight.

Network: Settings → Wi-Fi off (Airplane on) → test offline paths.

Screen recordings: iOS Control Centre → Screen Recording (include audio for STT demos).

Logs: Xcode → Devices & Simulators → open logs for the device.

Symbolication: ensure dSYMs uploaded to your crash service.



---

> Submission Gate: All P0/P1 issues resolved; performance, stability, and accessibility criteria met; store metadata/screenshots updated to reflect this build.



---

