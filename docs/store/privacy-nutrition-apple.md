# 🍏 Apple Privacy Nutrition Label — LinguaMate AI

This document maps LinguaMate AI’s data collection and handling practices into the **App Store Connect Privacy Nutrition Label format**.  
It should be updated if features, SDKs, or data flows change.

---

## 📌 Data Not Linked to You

### Diagnostics (Optional)
- **Data Collected:** Crash logs, performance data, error traces  
- **Purpose:** Improve app stability, debug issues, fix performance bottlenecks  
- **Linked to User:** No — anonymised before storage  
- **Optional:** Yes — can be disabled in *Settings → Privacy Controls*  
- **Retention:** Stored securely by crash reporting provider, automatically deleted after **90 days**  

---

### Usage Data (Optional)
- **Data Collected:** Anonymous usage events (screen views, lesson completions, quiz activity)  
- **Purpose:** Improve user experience, identify feature adoption, prioritise updates  
- **Linked to User:** No — aggregated, non-identifying  
- **Optional:** Yes — can be disabled in *Settings → Privacy Controls*  
- **Retention:** Retained in aggregate/anonymised form indefinitely  

---

## 📌 Data Collected

### Audio Data
- **Purpose:** Speech recognition for pronunciation practice and dialogue exercises  
- **Processing:** Ephemeral — audio is processed in real time and discarded after transcription  
- **Storage:**  
  - By default: **Not stored**  
  - If user explicitly saves practice clips → stored **locally on the device only**  
- **Linked to User:** No — clips are not associated with an identity unless explicitly tied to an account system (not currently implemented)  
- **Retention:**  
  - Saved clips remain on device until user deletes them  
  - No server-side retention of audio  

---

## 📌 User Controls

Within *Settings → Privacy Controls*, users can:  
- ✅ Toggle analytics collection on/off  
- ✅ Toggle crash reporting on/off  
- ✅ Manage microphone permissions  
- ✅ View the in-app Privacy Policy  
- ✅ Request data deletion/export via **privacy@linguamate.ai**  

---

## 📌 Data Deletion

- **Saved Practice Clips:** User can delete manually from device at any time.  
- **Analytics & Crash Data:** Automatically removed on opt-out.  
- **User Requests:** Users may email **privacy@linguamate.ai** for full deletion of any associated account data (if account system is added in future).  

---

## 📌 Third-Party Services

- **Analytics Service (Optional)**  
  - Purpose: Aggregate anonymous usage metrics  
  - Linked to User: No  
  - Opt-out: Yes (Settings → Privacy Controls)  
  - Bound by Data Processing Agreement (DPA)  

- **Crash Reporting Service (Optional)**  
  - Purpose: Collect crash logs & performance data  
  - Linked to User: No  
  - Opt-out: Yes (Settings → Privacy Controls)  
  - Retention: 90 days  
  - Bound by Data Processing Agreement (DPA)  

---

## 📌 Security & Encryption

- All data transmission uses **HTTPS/TLS**  
- Audio clips (if saved) encrypted at rest on device  
- Crash logs anonymised before storage  
- No secrets or tokens hardcoded in client  

---

## 📌 Data Retention Summary

- **Audio (practice clips):** Local only, until user deletes  
- **Analytics:** Aggregated, retained indefinitely in anonymised form  
- **Crash Logs:** Retained for 90 days, then deleted automatically  

---

✅ **Compliance Note:**  
This Privacy Nutrition Label is structured according to Apple’s **Privacy Questionnaire categories**: *Data Types Collected*, *Linked/Not Linked to User*, *Optional Controls*, *Retention*, and *Third-Party Sharing*.  

It reflects Linguamate AI’s **minimal, transparent, and privacy-first data approach**.