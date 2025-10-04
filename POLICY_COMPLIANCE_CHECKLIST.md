# 📋 Google Play Policy Compliance Checklist — Linguamate AI

This checklist ensures Linguamate AI complies with **Google Play policies** before submission.  
It covers **Core Functionality, User Data & Privacy, Content, Monetization, IP, Accessibility, Store Integrity, Device/Network Handling, and Children & Families**.  
Every item should be verified before **uploading an APK/AAB** to the Play Console.

---

## 🟢 Core Requirements
- [ ] App provides **clear value** (AI-powered education/language learning).  
- [ ] Single, focused purpose — **not a generic shell app or template**.  
- [ ] No **deceptive behavior**:
  - No fake buttons, overlays, or misleading flows.  
  - No hidden ads, coin miners, or background trackers.  
- [ ] No **malware or obfuscated code**:
  - Code reviewed for hidden behaviors.  
  - No dynamic code loading from unverified hosts.  
- [ ] Permissions are **minimal and justifiable**:
  - `INTERNET` → required for API access.  
  - `RECORD_AUDIO` → only when user taps mic for STT.  
  - No background microphone use.  
  - No unnecessary access to contacts, location, SMS, or storage.  

---

## 🔐 User Data & Privacy
- [ ] **Data Safety form** in Play Console matches actual flows:
  - Audio (STT) → ephemeral, processed in real-time, not stored unless user saves clips.  
  - Analytics → anonymous, optional.  
  - Crash logs → optional, limited to 90 days.  
- [ ] **Privacy Policy**:
  - Linked in Play Store listing.  
  - Linked inside app (Settings → Privacy).  
  - Hosted publicly (https://linguamate.ai/privacy).  
- [ ] If accounts are added in future:
  - **Account deletion/export flow** must exist.  
  - “Delete my data” option inside the app.  
- [ ] **AI Transparency**:
  - Clearly disclose that conversations, translations, and exercises may be AI-generated.  
  - State limits of AI accuracy.  
- [ ] **Security**:
  - All traffic HTTPS/TLS 1.2+.  
  - No hardcoded secrets.  
  - Tokens stored in `SecureStore` (native) or secure cookies (web).  

---

## 🧑‍💻 Content Policy
- [ ] No **sexual content, nudity, or pornographic material**.  
- [ ] No **hate speech, extremist content, or harassment**.  
- [ ] No **illegal activities** (drugs, weapons, gambling).  
- [ ] **User-Generated Content (UGC)** & AI outputs:
  - Moderation pipeline in place for chat.  
  - Blocklist + heuristic filters for harmful content.  
  - In-app reporting option if harmful outputs appear.  
- [ ] Educational content reviewed for accuracy.  

---

## 💰 Ads & Monetization
- [ ] No ads in base version (no AdMob / third-party SDKs).  
- [ ] If ads are later added:
  - Must comply with **Google Play Ads Policy**.  
  - No disruptive formats (full-screen interstitials on launch, deceptive overlays).  
- [ ] If **in-app purchases (IAP)** or subscriptions:
  - All payments handled via **Google Play Billing** (no sideloaded payment flows).  
  - Pricing disclosed clearly in store listing + in-app.  
  - Subscription benefits (monthly, yearly) explained.  
  - Free tier functions without paywalling core app.  

---

## 🏷️ Intellectual Property
- [ ] All assets are **owned, licensed, or open source compliant**:  
  - App icon, screenshots, and feature graphics designed in-house.  
  - Fonts, sounds, and stock assets under valid license.  
  - AI outputs reviewed for copyright compliance.  
- [ ] No use of third-party IP (logos, brand names) without permission.  

---

## ♿ Accessibility (WCAG 2.1 AA, Android Accessibility)
- [ ] Supports **TalkBack**:
  - All interactive UI elements labeled.  
  - Images have `contentDescription`.  
- [ ] **Font scaling** supported (200%+).  
- [ ] **Color contrast** verified (meets 4.5:1 ratio).  
- [ ] No critical info conveyed **only by color**.  
- [ ] Touch targets ≥ 48×48 dp.  
- [ ] UI responsive across small/large screens.  

---

## 🖼️ Store Listing Integrity
- [ ] Title, short description, and long description **accurate and truthful**.  
- [ ] Screenshots taken from **current production build**.  
- [ ] No misleading claims (“100% fluency in 1 week” prohibited).  
- [ ] App category: **Education → Language Learning**.  
- [ ] Content rating form matches: “Everyone 3+” (with AI moderation).  
- [ ] Store assets comply:
  - Icon: 512×512 PNG, <1MB.  
  - Feature graphic: 1024×500.  
  - Screenshots: 1080×1920 (portrait).  
  - Promo video (optional).  

---

## 📶 Device & Network Handling
- [ ] App works offline where promised:
  - Lessons + phrasebook cached.  
  - Offline mode banner + retry shown.  
- [ ] Poor connectivity gracefully handled:
  - No infinite spinners.  
  - Errors explained (“Check your internet connection”).  
- [ ] Optimized for low/mid-tier devices:
  - Cold start < 3s.  
  - Memory leaks tested.  
- [ ] Battery drain minimized:
  - No background microphone use.  
  - No unnecessary wake locks.  

---

## 👶 Children & Families Policy (if targeted in future)
- [ ] Currently **13+ only** (not enrolled in Designed for Families).  
- [ ] If app expands to children:
  - COPPA compliance enforced.  
  - Ads limited to family-safe networks.  
  - Teacher/parental consent features required.  
  - Educational content reviewed for age-appropriateness.  

---

## ✅ Final Submission Gate
Before uploading to Google Play Console:
- [ ] Privacy Policy hosted, linked, tested.  
- [ ] Data Safety form 100% accurate.  
- [ ] Permissions list verified against manifest.  
- [ ] Screenshots + assets verified.  
- [ ] Store listing text reviewed by legal/compliance.  
- [ ] Build tested on multiple devices & network conditions.  
- [ ] No crashes in last internal/closed test.  
- [ ] Release notes + changelog added.  
- [ ] Internal/closed test groups configured if gradual rollout planned.  

---

📌 **Note:** Keep a signed PDF copy of this checklist per release for compliance evidence.  
This demonstrates due diligence if Google audits your app.