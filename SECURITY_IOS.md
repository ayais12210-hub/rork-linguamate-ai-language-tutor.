# 🔒 Security Notes — iOS (Linguamate AI)

This document describes the security measures implemented in the iOS version of Linguamate AI.  
It covers client protections, backend hardening, secrets handling, App Store compliance, and incident response procedures.  
Practices align with OWASP MASVS, Apple App Store Review Guidelines, and GDPR/CCPA obligations.

---

## 🔑 Secrets & Configuration
- ❌ No secrets or credentials stored in the repo.  
- ✅ Only **public runtime configs** exposed via `EXPO_PUBLIC_*` environment variables.  
- ✅ Sensitive values (API keys, signing tokens) remain server-side or in CI/CD secret managers.  
- ✅ On iOS builds, secrets injected via `process.env` at runtime.  
- ✅ GitHub repo monitored with **Gitleaks** and **secret scanning**.

---

## 🌐 Network Security
- ✅ All traffic over **HTTPS/TLS 1.2+**.  
- ❌ Certificate pinning not enabled by default (planned for high-sensitivity endpoints).  
- ✅ HSTS enforced on backend (`Strict-Transport-Security`).  
- ✅ No mixed content allowed (all assets over HTTPS).  
- ✅ AppTransportSecurity (ATS) enabled in Info.plist:  
  - `NSAllowsArbitraryLoads = false`  
  - `NSExceptionDomains` scoped to approved API domains only.

---

## 🔐 Storage & Data Handling
- ✅ Tokens and sensitive values stored in **SecureStore** (encrypted at rest with iOS Keychain).  
- ✅ On web fallback: HttpOnly cookies preferred, with CSRF/XSS safeguards.  
- ✅ No broad file access; all data sandboxed to app container.  
- ✅ Lessons/journal stored locally in AsyncStorage; no sensitive PII persisted.  
- ✅ Session tokens short-lived and refreshable.  

---

## 📊 Logging & Observability
- ✅ No PII, raw prompts, or secrets in logs.  
- ✅ Structured logs with correlation IDs for tracing.  
- ✅ Production builds minimize console/debug output.  
- ✅ Analytics and crash reporting are **opt-in only** via Settings → Privacy Controls.

---

## 🛡 Privacy-by-Default
- ✅ App operates without requiring account creation (anonymous mode).  
- ✅ Analytics collection is optional and opt-in.  
- ✅ Crash reporting optional and anonymized.  
- ✅ Users can request data deletion/export via in-app path or `privacy@linguamate.ai`.  
- ✅ Privacy Policy and Terms are accessible from the app footer and App Store listing.  

---

## 🗑 Data Deletion & Retention
- ✅ In-app delete account/data path provided (if user creates an account in future).  
- ✅ Backend supports purge jobs to delete user data on request.  
- ✅ Practice audio clips: ephemeral unless explicitly saved by the user.  
- ✅ Crash logs: retained for 90 days (if enabled).  
- ✅ Analytics data: aggregated and anonymized.  

---

## 📱 Permissions Model (Least Privilege)
- 🎤 **Microphone**: requested only when user initiates speech-to-text.  
- ❌ No background or persistent microphone access.  
- ✅ No access requested for location, contacts, photos, or SMS.  
- ✅ Clear rationale shown in iOS permission dialog:  
  > “Linguamate uses your microphone only when you choose to practise speaking. Audio is never stored without your consent.”  

---

## 🧩 Backend Hardening (tRPC + Hono)
- ✅ API gateway enforces rate limiting, throttling, and abuse detection.  
- ✅ CORS restricted to production domains (`linguamate.ai`, `app.linguamate.ai`).  
- ✅ Structured error messages; stack traces hidden.  
- ✅ Security headers (CSP, HSTS, X-Content-Type-Options, Permissions-Policy).  

---

## ⚠️ Incident Response
- 📧 **Contact:** `security@linguamate.ai`  
- 🛠 **Steps:**  
  1. **Identify**: detect anomaly via monitoring/alerts.  
  2. **Contain**: revoke affected tokens, disable compromised endpoints.  
  3. **Notify**: report impact to affected users if required by law.  
  4. **Remediate**: patch vulnerabilities, rotate secrets, issue hotfix release.  
- 🕒 SLA: Critical incidents triaged within 4 hours, patched within 48 hours.  

---

## 📋 App Store Compliance
- ✅ Meets Apple **App Privacy** disclosures (Privacy Nutrition Labels).  
- ✅ No third-party SDKs for ads or tracking.  
- ✅ All optional analytics/crash reporting user-controlled.  
- ✅ ATT prompt not shown (no cross-app tracking).  
- ✅ In-app purchases use **StoreKit** only (no external billing).  

---

## 🔮 Future Enhancements
- 🔜 Implement certificate pinning for sensitive endpoints.  
- 🔜 Add **Play Integrity API equivalent** (DeviceCheck / App Attest) for fraud prevention.  
- 🔜 Integrate Sentry/Logtail with privacy filters for structured error monitoring.  
- 🔜 Conduct external penetration tests prior to major releases.  

---

✅ With these measures, Linguamate AI for iOS follows **least privilege, privacy-by-design, and App Store security standards**.