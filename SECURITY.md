🔒 Security Notes (Android)

Transport Security (Network Layer)

All traffic is served over HTTPS/TLS 1.2+; cleartext HTTP is blocked by default (android:usesCleartextTraffic="false" in AndroidManifest.xml).

Enforce strong cipher suites on backend (Hono) and consider certificate pinning in the client for high-sensitivity endpoints.


Secrets Management

No hardcoded API keys or credentials in the client.

Only public, non-sensitive config is exposed via EXPO_PUBLIC_* environment variables.

Sensitive secrets (API keys, tokens) remain server-side or in CI/CD secrets.


Backend Hardening (tRPC/Hono)

Rate limiting, abuse detection, and request throttling applied at API gateway level.

Structured error messages; avoid exposing stack traces or internal details.

CORS tightened for production origins only (wide open only in dev).

Security headers (CSP, HSTS, X-Frame-Options, etc.) enabled.


Content Moderation (AI)

AI prompt/response moderation enforced server-side before delivery to clients.

Filters applied for inappropriate or harmful output, reducing client exposure.

Audit logs store moderation events only, never raw prompts.


Permissions Model (Least Privilege)

Only request microphone access, and only when the user explicitly triggers speech-to-text.

No background or persistent microphone access.

No unnecessary permissions (location, contacts, SMS, external storage) requested.


Logging & Observability

Logs exclude PII, secrets, or raw tokens.

Correlation IDs used for tracing requests end-to-end.

Sensitive values (JWTs, API keys) are redacted before logging.


Secure Storage

On native builds: tokens stored in expo-secure-store (encrypted at rest).

On web: fallback to HttpOnly cookies or localStorage (with CSRF/XSS safeguards).

Session expiry enforced; refresh tokens short-lived and revocable.


Dependency & SDK Hygiene

Regular updates of Expo SDK, React Native, and third-party libraries.

Use GitHub Dependabot + CI audits (npm audit, semgrep, gitleaks) for continuous monitoring.

Remove unused packages to reduce attack surface.


Play Store & Device Compliance

Meets Google Play Data Safety requirements: microphone optional, storage limited to app sandbox.

Implements runtime permission rationale before microphone access (educates user why it’s needed).

Android App Integrity enabled via Play App Signing.


Future Enhancements (Planned)

Explore device attestation (Play Integrity API) to detect tampered/rooted devices.

Server-side anomaly detection for unusual API usage (token reuse, high-volume requests).

Add penetration test reports to docs/security/ before each major release.


