# 🛡️ Policy Compliance Checklist — Linguamate (Web)

This checklist ensures the Linguamate web app complies with **privacy, security, accessibility, and legal obligations** before public deployment.  
It aligns with **GDPR, CCPA, COPPA (where applicable), Apple App Store, and Google Play requirements**.  
Every item should be verified before production release.

---

## 📜 Privacy & Legal

### Privacy Policy
- [ ] A **Privacy Policy link** is accessible in the **footer of every page**.  
- [ ] The policy matches `docs/store/privacy-policy.md` and is up to date.  
- [ ] States clearly:
  - What data is collected (audio, analytics, crash logs).
  - How data is used (speech recognition, app improvements).
  - Data sharing (none for marketing; only processors under DPA).
  - Retention timelines (90 days crash logs, indefinite anonymized analytics).
  - User rights: access, delete, export, withdraw consent.
  - Contact email: `privacy@linguamate.ai`.  

### Terms of Service
- [ ] Terms of Service link is in the **footer of every page**.  
- [ ] Document matches `docs/store/terms-of-service.md`.  
- [ ] Covers:
  - User responsibilities and prohibited use.
  - Liability limitations.
  - Intellectual property.
  - Billing/refunds for premium features.
  - Right to suspend/terminate accounts.  

### Cookie Consent & User Rights
- [ ] **Cookie banner** shown on first load in GDPR/CCPA regions.  
- [ ] Includes options: **Accept / Reject / Manage Preferences**.  
- [ ] Analytics and crash reporting are **off by default** unless user consents.  
- [ ] Consent status stored securely (`localStorage` or first-party cookies).  
- [ ] Provides a **link to Privacy Policy** and **cookie settings panel**.  

### Data Subject Rights (GDPR / CCPA)
- [ ] Users can:
  - Request access to data.
  - Request deletion (“right to be forgotten”).
  - Opt out of data collection.
  - Request export of data in machine-readable format.
- [ ] Requests handled within **30 days**.  
- [ ] Contact route: `privacy@linguamate.ai` or in-app form.  

### Age Restrictions & Compliance
- [ ] Primary audience = **13+** (store listings match).  
- [ ] App does not knowingly collect data from children <13.  
- [ ] No child-directed advertising or profiling.  
- [ ] COPPA compliance documented (if app expands to <13).  

---

## ♿ Accessibility (WCAG 2.1 AA)

### Visual Design
- [ ] All text contrast ratio ≥ 4.5:1 (normal text), ≥ 3:1 (large text).  
- [ ] Dark mode + light mode maintain sufficient contrast.  
- [ ] No content relies solely on **color cues**.  

### Navigation & Interaction
- [ ] App is fully navigable using **keyboard only**.  
- [ ] Focus indicators are visible and consistent.  
- [ ] Skip-to-content link available.  
- [ ] Forms include proper labels, placeholders, and error hints.  

### Screen Reader Compatibility
- [ ] All interactive elements labeled with **ARIA attributes**.  
- [ ] Images include descriptive `alt` text.  
- [ ] Dynamic content (modals, errors) announced with `aria-live`.  
- [ ] Landmarks defined for `<header>`, `<main>`, `<footer>`, `<nav>`.  

### Testing
- [ ] Automated accessibility checks via **Lighthouse** and **axe-core**.  
- [ ] Manual testing with:
  - VoiceOver (iOS/Mac).
  - NVDA (Windows).
  - ChromeVox (Chrome).  

---

## 🔒 Security & Technical Compliance

### HTTPS & TLS
- [ ] Entire site served over **HTTPS** (no HTTP fallback).  
- [ ] TLS ≥ 1.2 enforced.  
- [ ] Certificate A+ rating verified via **SSL Labs Test**.  

### Security Headers
- [ ] `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`  
- [ ] `Content-Security-Policy: default-src 'self'; connect-src 'self' https://api.linguamate.ai https://toolkit.rork.com`  
- [ ] `X-Content-Type-Options: nosniff`  
- [ ] `Referrer-Policy: strict-origin-when-cross-origin`  
- [ ] `Permissions-Policy: camera=(), microphone=(), geolocation=()`  

### Content Security Policy (CSP)
- [ ] Restricts:
  - Scripts/styles to trusted domains only.  
  - Images to self + HTTPS/CDN.  
  - API calls only to backend + toolkit.  
- [ ] Validated in browser console with **no CSP errors**.  

### Data Retention & Deletion
- [ ] Practice clips remain on-device only.  
- [ ] Analytics: anonymized, aggregated, indefinite retention.  
- [ ] Crash logs: retained max 90 days.  
- [ ] Users can delete/export data on request.  

### Logging & Observability
- [ ] No PII in client/server logs.  
- [ ] Logs use **correlation IDs** instead of personal identifiers.  
- [ ] Error reports strip query parameters and tokens.  

### Third-Party Services
- [ ] Analytics + crash services covered by **DPA**.  
- [ ] No data resold or repurposed for ads.  
- [ ] SDKs updated to latest versions, reviewed quarterly.  

---

## 📊 Compliance Monitoring

- [ ] **Data Safety Google Play**: docs/store/data-safety-google.md up to date.  
- [ ] **Apple Privacy Nutrition**: docs/store/privacy-nutrition-apple.md aligned.  
- [ ] **Web Data Privacy Mapping**: docs/store/data-privacy-web.md aligned.  
- [ ] Internal audits run **quarterly**.  

---

## ✅ Final Launch Gate (Web Compliance)

Before going live, confirm:
- [ ] Privacy Policy + Terms visible and functional in footer.  
- [ ] Cookie banner tested (EU + California IP).  
- [ ] Accessibility: Lighthouse A11y ≥ 90 + manual tests passed.  
- [ ] HTTPS enforced, HSTS header present.  
- [ ] CSP strict and validated.  
- [ ] No mixed content (no `http://` assets).  
- [ ] Logs scrubbed, no PII.  
- [ ] Store docs (App Store + Google Play) consistent with in-app policy.  
- [ ] Age rating declared correctly (13+).  
- [ ] Documentation in `docs/store/` reviewed and synced.  

---

📌 **Note:** This checklist should be reviewed and signed off before **each deployment to production**. Store a signed PDF version for compliance evidence.