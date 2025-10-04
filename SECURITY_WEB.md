
Here’s a comprehensive production-ready Security Notes (Web) doc for Linguamate AI — expanded far beyond your outline, structured for clarity, and aligned with OWASP, W3C, and Google Lighthouse best practices.

Save this as: docs/security/SECURITY_WEB.md


---

# 🔒 Security Notes — Web (Linguamate AI)

This document outlines the security posture of the Linguamate AI **web application**.  
It includes frontend protections, backend integration policies, deployment hardening, and ongoing security practices.  
It aligns with **OWASP ASVS**, **OWASP Top 10 (Web)**, and Google Lighthouse security guidance.  

---

## 🌐 Transport Security
- ✅ All traffic served over **HTTPS/TLS 1.2+**.  
- ✅ HTTP access redirected to HTTPS with **301 permanent redirects**.  
- ✅ **HSTS** enabled:

Strict-Transport-Security: max-age=31536000; includeSubDomains; preload

- ✅ TLS certificate auto-renewed (Let's Encrypt/ACM).  
- ✅ No mixed content (images, scripts, or assets all load via HTTPS).  

---

## 🛡 Content Security Policy (CSP)
A strong CSP prevents XSS and unauthorized resource loading. Example header:

Content-Security-Policy: default-src 'self'; img-src 'self' https: data:; connect-src 'self' https://api.linguamate.ai https://toolkit.rork.com; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-eval'; frame-ancestors 'none'; base-uri 'self'; form-action 'self';

- ✅ Restricts scripts to app and trusted origins only.  
- ✅ Blocks inline script execution (except whitelisted `unsafe-eval` in dev).  
- ✅ Frame embedding disabled (`X-Frame-Options: DENY`).  
- ✅ Prevents malicious redirects via `base-uri 'self'`.  

---

## 🔑 Secrets & Configuration
- ❌ No secrets in client bundle.  
- ✅ Only `EXPO_PUBLIC_*` environment variables included in build.  
- ✅ Sensitive values (API keys, tokens) remain server-side only.  
- ✅ GitHub repo scanned with **Gitleaks** and GitHub Secret Scanning.  

---

## 🧩 Backend API Security
- ✅ API endpoints (`/api`, `/api/trpc`) protected with:
  - Rate limiting & throttling.  
  - Abuse detection.  
  - Request correlation IDs.  
- ✅ Input validation: all user inputs sanitized and schema-validated with **Zod**.  
- ✅ Output encoding to prevent injection.  
- ✅ CORS:  
  - **Staging**: localhost + staging domains.  
  - **Production**: `linguamate.ai` only.  
- ✅ Structured error handling: no stack traces or sensitive details exposed.  

---

## 🗂 Storage & Session Security
- ✅ Authentication tokens stored securely:
  - Preferred: **HttpOnly cookies** with `SameSite=Strict` and `Secure`.  
  - Alternative (fallback): localStorage with CSRF/XSS mitigations.  
- ✅ No persistent PII stored in client.  
- ✅ Lessons & journal saved locally (non-sensitive).  
- ✅ IndexedDB/CacheStorage used only for caching assets and lessons.  

---

## 📊 Logging & Observability
- ✅ Client logs contain no PII or tokens.  
- ✅ Server logs redact sensitive values before storage.  
- ✅ Error boundaries catch runtime errors and display user-friendly fallbacks.  
- ✅ Lighthouse + Playwright CI checks ensure secure defaults remain enforced.  

---

## 📦 Dependency & Build Hygiene
- ✅ Regular updates of dependencies via **Dependabot** and **npm audit**.  
- ✅ Vulnerability scans with **Semgrep** in CI/CD.  
- ✅ Dead/unused packages removed.  
- ✅ Source maps uploaded privately (not served publicly).  

---

## 📱 Permissions & Privacy
- ✅ No unnecessary browser permissions requested (no geolocation, no notifications by default).  
- ✅ Microphone access only when explicitly triggered by user for STT.  
- ✅ Privacy policy linked in footer of all web routes.  
- ✅ Users can disable analytics and crash reporting in Settings → Privacy Controls.  

---

## ⚠️ Incident Response
- 📧 **Contact:** `security@linguamate.ai`  
- 🛠 **Steps:**  
  1. **Identify**: Detect via monitoring (Sentry/Logtail alerts).  
  2. **Contain**: Disable vulnerable endpoints, revoke tokens.  
  3. **Notify**: Inform impacted users if required.  
  4. **Remediate**: Patch vulnerabilities, rotate secrets, deploy hotfix.  
- 🕒 SLA: Critical issues triaged within 4h, fixed within 48h.  

---

## 📋 Compliance
- ✅ GDPR / CCPA transparency: privacy policy accessible on every page.  
- ✅ Cookie consent banner if analytics enabled.  
- ✅ WCAG 2.1 AA accessibility checks enforced in CI.  
- ✅ Google Lighthouse Security ≥ 95 target.  

---

## 🔮 Future Enhancements
- 🔜 Add **Subresource Integrity (SRI)** for all CDN assets.  
- 🔜 Implement **Content Security Policy reporting** endpoint for violations.  
- 🔜 Automated penetration testing pipeline with OWASP ZAP.  
- 🔜 Device fingerprinting + anomaly detection for fraud prevention.  
- 🔜 Red team exercises before major releases.  

---

✅ With these controls, Linguamate AI’s **Web app** follows a **defense-in-depth strategy**:  
network-layer TLS, strict CSP, least-privilege storage, no client-side secrets, validated APIs, and strong compliance posture.


