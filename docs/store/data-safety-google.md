# 📋 Google Play Data Safety — Linguamate

This document maps **data types collected and processed** by the Linguamate AI Language Tutor app to the Google Play Data Safety form.  
It should be kept up to date whenever new features, SDKs, or third-party services are integrated.

---

## 1. Data Types Collected

### Audio (Microphone)
- **Collected:** Yes (user-initiated only)  
- **Purpose:**  
  - Speech-to-text transcription for pronunciation practice and dialogue exercises.  
  - Helps learners improve accuracy and fluency.  
- **Storage:**  
  - By default: audio streams are sent for transcription and discarded after processing.  
  - If the user explicitly chooses to save practice clips, they are stored **locally on device only**.  
- **Sharing:** Not shared with third parties.  
- **User Control:**  
  - User can choose never to grant microphone permission.  
  - Saved clips can be deleted in-app under *Profile → Privacy Controls*.  

---

### Diagnostics (Optional)
- **Collected:** Yes (if enabled by user).  
- **Purpose:**  
  - Crash logs, performance traces, and error events.  
  - Used to detect bugs, stability issues, and performance bottlenecks.  
- **Storage:** Retained securely for **90 days**.  
- **Sharing:**  
  - Processed by a crash reporting/observability provider (bound by Data Processing Agreement).  
  - Data is aggregated and does not include personal identifiers.  
- **User Control:**  
  - Can be disabled under *Settings → Privacy Controls → Diagnostics*.  

---

### Analytics (Optional)
- **Collected:** Yes (anonymised).  
- **Purpose:**  
  - Measure usage patterns (e.g., which lessons are most completed, feature engagement).  
  - Improve app design and learning pathways.  
- **Storage:**  
  - Retained in **aggregate form only**.  
  - No individual profiles are created.  
- **Sharing:**  
  - Processed by an analytics service provider under a Data Processing Agreement.  
- **User Control:**  
  - Can be disabled under *Settings → Privacy Controls → Analytics*.  

---

## 2. Data Not Collected

Linguamate does **not** collect or process:  
- Personally identifiable information (PII)  
- Location data (GPS, Wi-Fi, Bluetooth)  
- Contacts, calendar, or SMS data  
- Financial or payment information (all handled via Google Play Billing if in-app purchases are enabled)  
- Photos or videos from the device gallery  
- Health or fitness data  

---

## 3. Security Practices

- **Data Encryption:**  
  - All data in transit is protected with HTTPS/TLS 1.2+.  
  - Any locally stored practice clips are encrypted on device storage.  

- **Least Privilege Access:**  
  - App requests microphone permission only when the user explicitly taps “Record”.  
  - No background microphone or storage access.  

- **Secure Storage:**  
  - Diagnostic and analytics data stored by service providers is encrypted at rest.  
  - No secrets are hardcoded into the app.  

---

## 4. User Controls & Rights

- **Consent & Controls:**  
  - Analytics and diagnostics are **opt-in** (disabled by default in privacy-conscious regions).  
  - Microphone access must be explicitly granted per platform.  

- **Data Deletion:**  
  - Users can delete all saved practice clips in-app at any time.  
  - Users can request data export or deletion by contacting:  
    **privacy@linguamate.ai**  

- **Transparency:**  
  - Privacy Policy is always accessible in-app and via store listing.  
  - Clear in-app privacy settings under *Profile → Privacy Controls*.  

---

## 5. Retention Policy

- **Audio:**  
  - Real-time transcription audio discarded immediately after processing.  
  - Saved practice clips remain only on the device until manually deleted by the user.  

- **Diagnostics:**  
  - Retained for 90 days, then automatically purged.  

- **Analytics:**  
  - Retained in aggregate form (non-identifying) as per provider retention policy (typically 12–24 months).  

---

✅ **Compliance alignment:**  
This document is structured to match Google Play Console’s “Data Safety” sections: *Collected Data*, *Purpose*, *Sharing*, *Encryption*, *User Control*, *Retention*.  
It confirms Linguamate is **minimal, transparent, and privacy-first** in its handling of user data.