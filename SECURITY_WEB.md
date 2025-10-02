# Security Notes (Web)

- TLS only; enable HSTS
- CSP example: default-src 'self'; img-src 'self' https: data:; connect-src 'self' https:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-eval';
- No secrets in client code; EXPO_PUBLIC_ only
- Rate limiting on backend API
- Input validation and output encoding
- Regular dependency updates

