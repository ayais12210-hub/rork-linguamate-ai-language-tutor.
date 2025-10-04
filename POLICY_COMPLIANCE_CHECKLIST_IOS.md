# ✅ Policy Compliance Checklist — iOS (Linguamate AI)

This checklist ensures **Linguamate AI** complies with Apple App Store Review Guidelines, App Privacy requirements, and related regulatory standards.  
Complete this before each App Store submission.  

---

## 1. 🛡 Safety
- [ ] No harmful or unsafe content (violence, self-harm, illegal activities).  
- [ ] AI-generated or UGC content moderated server-side before delivery.  
- [ ] Reporting path provided for inappropriate AI outputs.  
- [ ] No dangerous functionality (e.g., malware, exploits).  

**Evidence/Screens:**  
- Screenshot of moderation flow.  
- Documentation of filters and blocked phrases.  

---

## 2. 🔒 Privacy
- [ ] Data collection minimized; only microphone (STT) and optional analytics/crash logs.  
- [ ] **Privacy Policy** accessible in-app (Settings → Privacy) and on website.  
- [ ] Analytics and crash reporting **opt-in** only.  
- [ ] Data deletion/export available upon request.  

**Evidence/Screens:**  
- Screenshot: Privacy Policy in-app.  
- Screenshot: toggle for analytics/crash reporting.  

---

## 3. 👀 Tracking (ATT)
- [ ] App does **not** track users across apps/sites by default.  
- [ ] ATT (AppTrackingTransparency) **not required** unless ads or cross-app tracking later added.  
- [ ] If tracking added, ATT rationale string prepared:  
  > “Linguamate may request permission if you enable personalized ads or usage insights. Your data is never sold.”  

**Evidence/Screens:**  
- Screenshot: Info.plist entry for ATT (if applicable).  

---

## 4. 🏥 Health / Medical (if applicable)
- [ ] App does **not** provide regulated medical/health advice.  
- [ ] If health data added in future: proper disclosures in App Store Connect.  
- [ ] No use of HealthKit, ResearchKit, or sensitive medical records.  

**Evidence/Screens:**  
- N/A for current release.  

---

## 5. 👶 Kids Category (if targeting children)
- [ ] App **not primarily targeted** at children <13.  
- [ ] If Kids Category later required: all guidelines met (no ads, COPPA-compliant).  

**Evidence/Screens:**  
- N/A for current release.  

---

## 6. © Intellectual Property
- [ ] All assets (icons, screenshots, audio, illustrations) owned or licensed.  
- [ ] No copyrighted text, images, or music used without authorization.  
- [ ] All branding (Linguamate, logos) original or authorized.  

**Evidence/Screens:**  
- License file or asset ownership document.  

---

## 7. 💳 Payments
- [ ] Digital goods (premium lessons, unlimited chat) sold **only** via Apple In-App Purchases (IAP).  
- [ ] No external purchase links (PayPal, Stripe) for digital content.  
- [ ] IAP tested in sandbox with restore purchases flow.  

**Evidence/Screens:**  
- Screenshot: IAP product IDs in App Store Connect.  
- Screen recording: restore purchases working.  

---

## 8. 🔐 Encryption
- [ ] TLS enforced; no cleartext HTTP.  
- [ ] If strong encryption used (TLS, crypto libs): export compliance answered in App Store Connect.  
- [ ] No unapproved cryptography included.  

**Evidence/Screens:**  
- Screenshot: Export compliance section filled in App Store Connect.  

---

## 9. 📍 Location / Microphone / Camera
- [ ] **Microphone** used only for STT, with rationale in Info.plist:  
  > “Linguamate uses your microphone only when you practise speaking. Audio is not stored unless you save it.”  
- [ ] **Camera/Location** not used in current version.  
- [ ] No hidden background access to hardware features.  

**Evidence/Screens:**  
- Screenshot: Info.plist with `NSMicrophoneUsageDescription`.  

---

## 10. 👤 Account Deletion
- [ ] Current version supports anonymous use (no account required).  
- [ ] If accounts later added: **in-app deletion path** visible and functional.  
- [ ] Deletion triggers backend purge job + confirmation email.  

**Evidence/Screens:**  
- Screenshot: Settings → Delete Account (future).  

---

## 11. 🍏 Sign in with Apple
- [ ] No third-party sign-in (Google/Facebook) in current version.  
- [ ] If third-party login added: **Sign in with Apple** also offered, same level of service.  

**Evidence/Screens:**  
- N/A for current release.  

---

## 12. 📑 Documentation & Evidence Links
- Privacy Policy: https://linguamate.ai/privacy  
- Terms of Service: https://linguamate.ai/terms  
- Data Safety Mapping: `docs/store/data-privacy-mapping-ios.md`  
- Privacy Nutrition Label: `docs/store/privacy-nutrition-apple.md`  
- Export Compliance: App Store Connect → App Information → Encryption  

---

✅ When all boxes are checked and evidence/screenshots attached, Linguamate AI is **ready for App Store submission**.