# Security Notes (Android)

- Transport security: HTTPS only
- No hardcoded secrets in client; use environment variables for base URLs
- Rate limiting and abuse controls on backend (tRPC/Hono)
- Content moderation for AI prompts/outputs server-side where applicable
- Least-privilege permissions; avoid background access
- Logging: Avoid PII in logs; redact tokens
- Secure storage: Use SecureStore for tokens on device when native build is produced; on web, fallback to cookies/local storage with care
- Dependency review: Update Expo SDKs and libraries regularly

