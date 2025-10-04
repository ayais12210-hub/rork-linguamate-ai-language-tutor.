# 📋 Data Safety Mapping (Android)

This document maps Linguamate’s in-app data flows to the Google Play Data Safety form.  
It should be updated whenever new features or SDKs are integrated.

---

## 1. Collected Data Types

**Personal info**  
- Email address: Only if user creates an account (not required in current anonymous flow).  
- No other personal identifiers collected by default.  

**Audio**  
- Microphone recordings: Collected when user initiates speech-to-text.  
- Processed server-side, discarded after transcription.  

**App activity**  
- General in-app interactions (screen views, lesson completions, quiz scores, chat usage).  
- Aggregated and non-identifying.  

**Diagnostics**  
- Crash logs and performance metrics (device type, OS version, error traces).  
- Used for debugging and stability improvements.  

**Device / Other identifiers**  
- Random session IDs or correlation IDs generated in app.  
- No persistent device identifiers (IMEI, MAC address, Advertising ID) are collected.  

---

## 2. Data Handling

- **Encryption in transit:** All data sent via HTTPS/TLS 1.2+.  
- **Encryption at rest:** Backend databases and storage are encrypted at rest.  
- **Data deletion:**  
  - Anonymous users: audio and logs discarded per retention policy.  
  - If accounts are added: users may request deletion via in-app settings or support email.  
- **No sale of data:** Data is never sold to third parties.  

---

## 3. Purposes of Collection

**App functionality**  
- Speech-to-text transcription (microphone recordings).  
- Personalisation of lessons/quizzes.  
- Progress tracking and XP rewards.  

**Analytics**  
- Aggregate interaction patterns for feature improvement.  
- Crash and performance metrics for app stability.  

**Security & compliance**  
- Rate limiting, abuse detection, and fraud prevention.  
- Moderation of AI prompts/outputs (server-side).  

---

## 4. Sharing

- **Third-party processors only:**  
  - Hosting providers (e.g. cloud infrastructure).  
  - Analytics tools (e.g. Expo/React Native telemetry, crash reporting).  
- Bound by **Data Processing Agreements (DPA)**.  
- **No sale or marketing use.**  

---

## 5. Retention

- **Audio uploads:** Kept only during active transcription request; discarded immediately after processing.  
- **App activity & analytics:** Retained in aggregate form per analytics provider’s policy (typically 12–24 months).  
- **Diagnostics:** Retained for debugging for up to 18 months.  
- **Personal info (if accounts added):** Retained until account is deleted or a support deletion request is fulfilled.  

---

## 6. Permissions

- **RECORD_AUDIO**  
  - Purpose: Speech-to-text.  
  - Requested only in-context (when user taps microphone).  
  - Explicit rationale displayed before permission prompt.  
  - No background microphone access.  

- **INTERNET**  
  - Required for API requests (tRPC, AI endpoints).  

- **ACCESS_NETWORK_STATE**  
  - Used to detect offline/online state for caching.  

- **WRITE/READ_STORAGE** (scoped only, if any)  
  - Used by React Native/Expo for caching assets in app sandbox.  
  - No broad file system access.  

---

## 7. Compliance Notes

- **Children:** App targets 13+; no child-directed data collection.  
- **Sensitive categories:** No collection of contacts, calendar, SMS, or location.  
- **Transparency:** Privacy policy and terms linked both in-app and on Play listing.  
- **Future readiness:** If premium billing is added, only purchase tokens are processed through Google Play Billing.  

---

✅ This version is aligned with Google Play Data Safety form sections: **Collected Data, Purpose, Sharing, Retention, Security, Permissions.**  
It avoids grey areas (e.g. “may collect Advertising ID”) since Linguamate doesn’t rely on ads.