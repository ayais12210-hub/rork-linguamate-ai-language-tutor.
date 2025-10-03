# Pre-Submission Testing (Android)

Use this as a lightweight QA script before promoting a build.

## Smoke Tests
- Cold start < 3s on mid-tier device
- Navigate tabs: Learn, Lessons, Modules, Leaderboard, Chat, Profile
- AI Quiz loads after module section; handles errors gracefully

## Audio
- On Modules page, play/stop audio samples; confirm parity with Learn page
- Microphone permission prompt appears only when recording
- STT upload and transcription success + error handling

Status: STT now proxied via /api/stt/transcribe with rate limiting and robust JSON/error handling. Client updated to use proxy and validated manually on web + native dev.

## Network & Errors
- Simulate offline: show friendly error UI; retry works
- tRPC endpoints: learn, lessons, leaderboard, user return valid data

## UI/UX
- Text legible at 200% font size
- Interactive controls have at least 44×44 touch targets
- No layout overflow on small screens and web

## Performance
- Lists scroll at 60fps
- No memory leaks when switching tabs repeatedly

## Security
- No secrets in code or logs
- TLS enforced for all API calls

## Play Console Tracks
- Install from Internal Testing; verify upgrade from prior build keeps local data

