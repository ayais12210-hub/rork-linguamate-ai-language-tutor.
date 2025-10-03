📦 Google Play Preparation Document

This guide outlines all the assets, metadata, and compliance information needed to publish Linguamate: AI Language Tutor on Google Play.


---

1. App Identity

Package name: com.linguamate.app
(choose a unique reverse-DNS name; Expo config sets this in android.package)

Minimum SDK: 24 (Android 7.0)

Target SDK: 34 (Android 14)

Architecture: Expo Go v53 (React Native Web compatible)



---

2. Assets Checklist

✅ Must have before upload:

App Icon → 512×512 PNG, < 1MB, square, no rounded corners.

Feature Graphic → 1024×500 PNG/JPG, < 1MB.

Used at the top of the Play Store listing.

Simple gradient background + mascot/wordmark works best.


Screenshots → at least 3 required, max 8 recommended.

Size: 1080×1920 (phones), 1242×2208 (high-res portrait).

Suggested order:

1. AI Coach Chat with corrections


2. Learn Hub (Alphabet, Grammar, Flashcards)


3. AI Lesson (exercise types + XP rewards)


4. Leaderboard & Profile stats


5. Offline banner / learn anywhere




Promo Video (optional) → YouTube link.

Short (30–60s), with captions + demo.




---

3. Content Rating Inputs

Target audience: 13+ (safe for teens; learning app).

User-generated content: Yes (AI chat).

Mitigation: moderation + reporting option.


Location access: None (no geolocation APIs used).

Ads: None (unless you integrate later — then disclose “Yes”).

Gambling: None.



---

4. Signing & Integrity

Play App Signing: ✅ Recommended (Google holds release key).

Upload key: Generate locally, keep in secure password manager.

Example command (from Expo EAS):

eas credentials


Backup: Keep .jks + password safe.



---

5. Privacy & Compliance

Privacy Policy: https://example.com/privacy

Terms of Use: https://example.com/terms

In-App Routes:

/privacy-policy → shows same content in-app

/terms → shows terms in-app



Data Safety Form (Google Play Console):

Microphone → optional, for STT.

Network → required (tRPC API + images).

Storage (scoped) → local cache only, no broad file access.



---

6. Permissions Statement

Microphone

Used only for Speech-to-Text.

Clear rationale shown in app before permission prompt.


Network

Required to fetch lessons, chat, analytics, translations.


Storage

Used for caching lesson content + preferences.

No broad “all files” access requested.




---

7. Release Types

Internal testing: Up to 100 testers (email whitelist).

Closed testing: Invite beta users via Google Groups/Play track.

Open testing: Public listing, with “Beta” label.

Production release: After testing tracks validated.



---

8. Versioning

versionName: Semantic version, e.g. 1.0.0.

versionCode: Integer, must increment per release (e.g., 1, 2, 3…).


(Expo EAS builds handle this via android.versionCode in app.json.)


---

9. Contact Information

Support Email: support@linguamate.ai (or your company domain)

Developer Website: https://linguamate.ai

Support Page: https://linguamate.ai/support



---

10. Pre-Launch Report Readiness

Automatic crawler login: Not required (no login wall).

Deep links: None by default; add if you later implement universal links.



---

11. Localization Plan

Primary listing language: English (US).

Future locales:

en-GB (UK English)

es (Spanish)

pa (Punjabi)

hi (Hindi)


In-App: User chooses native language + target learning language.



---

12. Store Listing Content (Google Play)

App Title (30 chars max):
Linguamate: AI Language Tutor

Short Description (80 chars max):
Learn faster with your AI language coach — lessons, chat, quizzes & progress.

Full Description (4000 chars max):
(Google Play allows longer than iOS; keep keyword-rich but readable)

> Learn languages smarter with AI-powered coaching.
Linguamate is your personal tutor for iOS, Android, and Web — built with cutting-edge AI to help you practice conversations, complete lessons, and track progress.



Key Features:

🧠 AI Coach Chat — talk naturally, get corrections & translations.

📚 Learn Hub — alphabets, vocabulary, grammar, dialogues, flashcards.

🎯 AI Lessons — auto-generated quizzes and exercises with XP rewards.

🏆 Profile + Leaderboard — compare progress, earn achievements.

🔒 Offline Support — keep learning anywhere.


Why Linguamate?

Adaptive: adjusts to your pace and goals.

Accessible: dark mode, screen reader friendly.

Engaging: gamified XP, streaks, achievements.

Private: no sensitive data stored locally.


Upgrade to Premium for unlimited AI chat, bonus content, and exclusive challenges.


---

13. Screenshots Captions (Google Play)

1. “Chat naturally with your AI language coach”


2. “Learn alphabets, grammar, vocabulary & more”


3. “AI-generated lessons: quizzes, listening & speaking”


4. “Track progress, earn XP, and climb the leaderboard”


5. “Works offline — learn anytime, anywhere”




---

✅ This doc gives you every field and asset requirement so you can walk into Google Play Console and fill it out step by step.


