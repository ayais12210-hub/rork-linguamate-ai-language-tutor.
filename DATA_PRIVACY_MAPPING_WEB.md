# 🌐 Data Privacy Mapping (Web)

| Data Type            | Collected     | Purpose                               | Storage                                                         |
|----------------------|---------------|---------------------------------------|-----------------------------------------------------------------|
| Email                | No (current)  | N/A                                   | N/A                                                             |
| *(future: Yes)*      | *(if account system added)* | Account creation, login, support | Backend database (encrypted at rest)                            |
| Cookies              | Yes           | Session management, authentication    | Secure HttpOnly cookies (preferred) or localStorage fallback    |
| Analytics events     | Yes           | Product analytics, usage improvement  | Analytics provider retention (aggregate, anonymised, 12–24 mo.) |
| Audio (microphone)   | Yes (user-initiated) | Speech-to-text transcription        | Transient; uploaded to backend for processing, discarded after  |
| Diagnostics          | Yes           | Crash logs, performance metrics       | Retained by hosting/monitoring provider per policy              |
| App activity         | Yes           | Lesson completions, quiz attempts, chat usage | Backend logs + analytics pipeline (aggregate)             |

---

## Third Parties (Processors Only)
- **Hosting:** Cloud infrastructure provider (encrypted at rest, DPA in place)  
- **Analytics:** Third-party analytics (aggregated, anonymised, retained ~12–24 months)  
- **Error Reporting:** Crash/diagnostic provider (no PII)  
- **AI Services:** Toolkit endpoints (`toolkit.rork.com`) for LLM and STT (no long-term retention of audio/prompts)

---

## Notes
- No sensitive personal data (health, financial, contacts, location) collected  
- No sale or marketing-based sharing  
- Users can request deletion (if accounts exist) via in-app or support email  
- Only functional cookies used (no third-party advertising cookies)