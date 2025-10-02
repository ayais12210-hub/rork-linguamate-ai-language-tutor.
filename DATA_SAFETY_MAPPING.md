# Data Safety Mapping (Android)

This document maps in-app data flows to the Google Play Data Safety form. Adjust to reflect final implementation.

## Collected Data Types
- Personal info: Email (only if user creates account; not in current anonymous flow)
- Audio: Microphone recordings for speech-to-text (user-initiated)
- App activity: In-app interactions for analytics (aggregated, non-identifying)
- Diagnostics: Crash and performance logs

## Data Handling
- Encryption in transit: Yes (HTTPS)
- Encryption at rest: Backend stores data encrypted at rest
- Data deletion: Users can request deletion via support email; if account system added, add in-app delete flow
- Optional: Do not sell data to third parties

## Purposes
- App functionality: STT, personalization, quiz generation
- Analytics: Improve quality and performance
- Compliance: Security and abuse prevention

## Sharing
- No data shared with third parties except processors (hosting, analytics) bound by DPA

## Retention
- Audio uploads retained only for transcription processing, then discarded; logs retained per policy

## Permissions
- RECORD_AUDIO: For STT only, requested in-context with explanation

