# Google Play Preparation

This document outlines preparation steps and assets typically required to publish the app on Google Play. It is educational guidance for organizing materials and validating the build locally.

## App Identity
- Package name: com.yourcompany.yourapp
- Minimum SDK: 24+
- Target SDK: 34
- Architecture: Expo Go v53, React Native Web compatible

## Assets Checklist
- App icon: 512×512 PNG, < 1MB
- Feature graphic: 1024×500 PNG/JPG
- Screenshots: 1080×1920 or 1242×2208 (portrait), at least 3
- Promo video (optional): YouTube link

## Content Rating Inputs
- Target audience: 13+
- Contains user‑generated content: Yes (chat/AI prompts) with moderation
- Location access: No native location; web geolocation not required by default
- Ads: No (unless you enable later)
- Gambling: No

## Signing and App Integrity
- Managed Play App Signing recommended
- Keep upload keystore secure and backed up

## Privacy
- Link to Privacy Policy: /privacy-policy (in-app route) and public URL
- Link to Terms: /terms (in-app route) and public URL

## Permissions Statement
- Microphone: Optional, for speech-to-text (web uses MediaRecorder; Android uses expo-av). Rationale shown before request.
- Network: Required for API access (tRPC) and images
- Storage (scoped): Only for caching; no broad file access

## Release Types
- Internal testing: up to 100 testers via email list
- Closed testing: Play console track
- Open testing: Public listing

## Versioning
- versionName = semantic version (e.g., 1.0.0)
- versionCode = incrementing integer per release

## Contact Information
- Support email: support@yourcompany.com
- Developer website: https://example.com

## Pre-Launch Report Readiness
- Enable automatic crawler login path: not required
- Add deep links if used: none by default

## Localization Plan
- Store listing primary language: English (US)
- In-app multilingual: User native language + learning language selection

