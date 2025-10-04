# 🍏 Data Privacy Mapping (iOS)

| Data Type                     | Collected | Linked to User | Used for Tracking | Purpose             |
|--------------------------------|-----------|----------------|-------------------|---------------------|
| Contact Info: Email            | No (current) / Yes (if account added) | Yes (if collected) | No | Account creation & support |
| Identifiers: User ID           | No (current) / Yes (if account added) | Yes | No | App functionality (progress, XP) |
| Usage Data: Product Interaction | Yes       | No             | No                | Analytics (feature usage, lessons completed) |
| Diagnostics: Crash Data        | Yes       | No             | No                | App performance & stability |

---

## 📦 SDKs Used
- **Expo SDK / React Native** (core framework)  
- **React Query / tRPC** (state + API)  
- **Crash/analytics provider** (non-identifying diagnostics)  
- **No advertising or marketing SDKs integrated**  

---

## 📌 ATT (AppTrackingTransparency)
- **Required:** No (app does not track users across apps or websites).  
- If in the future ad-based personalisation is added:  
  - **Yes** → Show ATT prompt *after meaningful context screen*.  

---

## 🔗 Links
- **Privacy Policy:** https://linguamate.ai/privacy  
- **Support:** https://linguamate.ai/support