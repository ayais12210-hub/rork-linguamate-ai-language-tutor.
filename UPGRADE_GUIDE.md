# LinguaMate Upgrade Implementation Guide

This guide documents all the new features and integrations added to the LinguaMate app for production-grade reliability, monetization, learning UX, performance, analytics, and CI/CD.

## 🎯 What's Been Added

### 1. Crash Reporting & Monitoring (Sentry)

**Location**: `app/providers/MonitoringProvider.tsx`

**Features**:
- Automatic crash and error reporting
- Session tracking
- Performance monitoring (20% sample rate in production)
- Release and environment tracking
- Source map support for EAS builds

**Setup**:
1. Get your Sentry DSN from [sentry.io](https://sentry.io)
2. Add to `.env`:
   ```bash
   EXPO_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.io/project-id
   ```
3. Already integrated in `app/_layout.tsx` ✅

**Usage**:
```typescript
import { captureException, captureMessage } from '@/app/providers/MonitoringProvider';

try {
  // Your code
} catch (error) {
  captureException(error, { context: 'lesson_completion' });
}
```

---

### 2. Analytics & Feature Flags (PostHog)

**Location**: `app/providers/AnalyticsProvider.tsx`

**Features**:
- Event tracking (lesson start/complete, word interactions, STT accuracy)
- Session replay (web only)
- Feature flags for gradual rollouts
- User identification
- Funnels and conversion tracking

**Setup**:
1. Get your PostHog API key from [posthog.com](https://posthog.com)
2. Add to `.env`:
   ```bash
   EXPO_PUBLIC_POSTHOG_KEY=phc_your_key_here
   EXPO_PUBLIC_POSTHOG_HOST=https://app.posthog.com
   ```
3. Already integrated in `app/_layout.tsx` ✅

**Usage**:
```typescript
import { analyticsEvents, identifyUser } from '@/app/providers/AnalyticsProvider';

// Track lesson events
analyticsEvents.lessonStarted('lesson-123', 'vocabulary', 'beginner');
analyticsEvents.lessonCompleted('lesson-123', 'vocabulary', 95, 120);

// Track speech events
analyticsEvents.wordHeard('hello', 'en-US', true);
analyticsEvents.sttAccuracy('hello', 'helo', 0.8);

// Identify user
identifyUser('user-123', { learningLanguage: 'pa', level: 'beginner' });
```

---

### 3. Subscriptions & Monetization (RevenueCat)

**Location**: `features/subscriptions/revenuecat.ts`, `hooks/usePremiumGate.ts`

**Features**:
- Cross-platform IAP management (iOS/Android/Web)
- Subscription entitlement checking
- Restore purchases
- Promo code support (iOS)
- Cross-device sync

**Setup**:
1. Create account at [revenuecat.com](https://revenuecat.com)
2. Configure your App Store and Google Play products
3. Add to `.env`:
   ```bash
   EXPO_PUBLIC_RC_API_KEY=your_revenuecat_public_key
   ```
4. Already integrated in `app/_layout.tsx` ✅

**Usage**:
```typescript
import { usePremiumGate } from '@/hooks/usePremiumGate';

function PremiumFeature() {
  const { isPremium, loading } = usePremiumGate();
  
  if (loading) return <Loading />;
  if (!isPremium) return <PaywallScreen />;
  
  return <YourPremiumContent />;
}
```

**See**: `components/examples/PremiumFeatureExample.tsx` for full example.

---

### 4. Internationalization (i18n)

**Location**: `src/i18n/`, `src/i18n/locales/*.json`

**Features**:
- Multi-language support (English, Punjabi, Hindi)
- Auto-detection of device locale
- Type-safe translations
- Easy language switching

**Setup**:
Already integrated in `app/_layout.tsx` ✅

**Usage**:
```typescript
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  
  return <Text>{t('lessons.start')}</Text>;
}
```

**Add new languages**:
1. Create `src/i18n/locales/[language-code].json`
2. Add translations matching the structure of `en.json`
3. Update `src/i18n/index.ts` to import and register the language

**See**: `components/examples/I18nExample.tsx` for full example.

---

### 5. Text-to-Speech (TTS)

**Location**: `hooks/useSpeech.ts`

**Features**:
- Language-specific pronunciation
- Adjustable speech rate and pitch
- Pause/resume support (iOS)
- Works on iOS, Android, and Web

**Setup**:
Already available via `expo-speech` (already installed) ✅

**Usage**:
```typescript
import { useSpeech } from '@/hooks/useSpeech';

function PronunciationLesson() {
  const { speak, stop, isSpeaking } = useSpeech();
  
  const handlePronounce = () => {
    speak('ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ', {
      language: 'pa-IN',
      rate: 0.9,
      onDone: () => console.log('Done!'),
    });
  };
  
  return <Button onPress={handlePronounce}>Speak</Button>;
}
```

**See**: `components/examples/SpeechExample.tsx` for full example.

---

### 6. Speech-to-Text (STT)

**Location**: `hooks/useSpeechRecognition.ts`

**Features**:
- Real-time transcription
- Language-specific recognition
- Confidence scores
- Pronunciation accuracy calculation

**Setup**:
⚠️ **Note**: Currently using mock implementation. To enable:

**Option A - expo-speech-recognition** (Recommended):
```bash
npx expo install expo-speech-recognition
```
Then update `hooks/useSpeechRecognition.ts` to use the actual SDK (see TODOs in file).

**Option B - @react-native-voice/voice**:
```bash
npm install @react-native-voice/voice
npx pod-install
```

**Usage**:
```typescript
import { useSpeechRecognition, calculateSpeechAccuracy } from '@/hooks/useSpeechRecognition';

function PronunciationPractice() {
  const { start, stop, result, isRecording } = useSpeechRecognition();
  const expected = 'hello';
  
  const handleRecord = async () => {
    if (isRecording) {
      await stop();
      const accuracy = calculateSpeechAccuracy(expected, result);
      console.log(`Accuracy: ${accuracy * 100}%`);
    } else {
      await start({ language: 'en-US' });
    }
  };
  
  return <Button onPress={handleRecord}>{isRecording ? 'Stop' : 'Record'}</Button>;
}
```

**See**: `components/examples/SpeechExample.tsx` for full example.

---

### 7. Ultra-Fast Storage (MMKV)

**Location**: `lib/mmkv-storage.ts`

**Features**:
- Up to 30x faster than AsyncStorage
- Encrypted storage
- Type-safe helpers
- Cache with TTL support
- React Query persistence

**Setup**:
Already installed and configured ✅

**Usage**:
```typescript
import { mmkvStorage, mmkvCache } from '@/lib/mmkv-storage';

// Simple storage
mmkvStorage.setString('user_name', 'John');
const name = mmkvStorage.getString('user_name');

// Object storage
mmkvStorage.setObject('user', { id: '123', name: 'John' });
const user = mmkvStorage.getObject<User>('user');

// Cache with TTL
mmkvCache.set('api_response', data, 5 * 60 * 1000); // 5 minutes
const cached = mmkvCache.get<ApiResponse>('api_response');
```

---

### 8. Performance Optimization (FlashList)

**What to do**:
Replace `FlatList` with `@shopify/flash-list` for 10-30% better performance on large lists.

**Current files using FlatList**:
- `components/forms/Select.tsx`

**How to replace**:
```typescript
// Before
import { FlatList } from 'react-native';
<FlatList data={items} renderItem={renderItem} />

// After
import { FlashList } from '@shopify/flash-list';
<FlashList data={items} renderItem={renderItem} estimatedItemSize={120} />
```

**Note**: Already installed ✅, just need to swap components.

---

### 9. Over-The-Air Updates (OTA)

**Location**: `app.json`, `eas.json`

**Features**:
- Ship JS/content fixes instantly
- No app store review needed
- Automatic fallback to cached version
- Channel-based deployment (preview/production)

**Setup**:
1. Create EAS account at [expo.dev](https://expo.dev)
2. Update `app.json` and `eas.json` with your project ID
3. Configure in `.env`:
   ```bash
   EAS_PROJECT_ID=your-project-id
   ```

**Deploy updates**:
```bash
# Preview channel
eas update --branch preview --message "Bug fixes"

# Production channel
eas update --branch production --message "New features"
```

**Check for updates in app**:
Already handled automatically by expo-updates ✅

---

### 10. CI/CD Enhancements

**Location**: `.github/workflows/ci.yml`

**What's already there**:
- ✅ Type checking
- ✅ Linting
- ✅ Unit tests with coverage
- ✅ E2E tests (Playwright)
- ✅ Security audit
- ✅ Web build

**Recommended additions**:

**A. EAS Build on CI** (`.github/workflows/eas-build.yml`):
```yaml
name: EAS Build
on:
  push:
    branches: [main, develop]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      - run: eas build --platform all --non-interactive
```

**B. Automated EAS Update on merge**:
```yaml
- name: Deploy EAS Update
  if: github.ref == 'refs/heads/main'
  run: eas update --branch production --message "${{ github.event.head_commit.message }}"
```

---

## 🔧 Environment Variables Setup

Update your `.env` file (use `.env.example` as template):

```bash
# Sentry
EXPO_PUBLIC_SENTRY_DSN=https://...@sentry.io/...

# PostHog
EXPO_PUBLIC_POSTHOG_KEY=phc_...
EXPO_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# RevenueCat
EXPO_PUBLIC_RC_API_KEY=...

# EAS (for OTA updates)
EAS_PROJECT_ID=...

# Optional: Feature Flags
EXPO_PUBLIC_STATSIG_CLIENT_KEY=...
```

---

## 📱 Testing Your Upgrades

### 1. Test Sentry
```typescript
// Throw a test error
import { captureMessage } from '@/app/providers/MonitoringProvider';
captureMessage('Test error from app', 'info');
```
Check your Sentry dashboard for the event.

### 2. Test PostHog
```typescript
import { analyticsEvents } from '@/app/providers/AnalyticsProvider';
analyticsEvents.featureUsed('test_feature', { timestamp: Date.now() });
```
Check PostHog dashboard for the event.

### 3. Test RevenueCat
```typescript
import { getOfferings } from '@/features/subscriptions/revenuecat';
const offerings = await getOfferings();
console.log('Available packages:', offerings);
```

### 4. Test i18n
```typescript
import { changeLanguage } from '@/src/i18n';
await changeLanguage('pa'); // Switch to Punjabi
```

### 5. Test TTS
```typescript
import { useSpeech } from '@/hooks/useSpeech';
const { speak } = useSpeech();
speak('Test', { language: 'en-US' });
```

---

## 🚀 Next Steps

### Immediate (Week 1)
1. ✅ Set up Sentry and PostHog accounts
2. ✅ Configure environment variables
3. ✅ Test all integrations in development
4. ⚠️ Replace mock STT with actual SDK
5. ⚠️ Swap FlatList → FlashList in heavy screens

### Short-term (Week 2-3)
1. Set up RevenueCat products and pricing
2. Design paywall screens
3. Add premium-gated features
4. Set up EAS for OTA updates
5. Create production builds

### Medium-term (Month 1)
1. Add notification system with expo-notifications
2. Set up PostHog feature flags for A/B testing
3. Implement streak reminders
4. Add more language translations
5. Performance profiling with FlashList

---

## 📚 Documentation Links

- [Sentry Expo Guide](https://docs.sentry.io/platforms/react-native/manual-setup/expo/)
- [PostHog React Native](https://posthog.com/docs/libraries/react-native)
- [RevenueCat Expo](https://www.revenuecat.com/docs/getting-started/installation/reactnative)
- [Expo Speech](https://docs.expo.dev/versions/latest/sdk/speech/)
- [FlashList](https://shopify.github.io/flash-list/)
- [MMKV Storage](https://github.com/mrousavy/react-native-mmkv)
- [EAS Update](https://docs.expo.dev/eas-update/introduction/)
- [react-i18next](https://react.i18next.com/)

---

## 🐛 Troubleshooting

### "Sentry is not initialized"
- Check that `EXPO_PUBLIC_SENTRY_DSN` is set in `.env`
- Ensure MonitoringProvider is wrapping your app in `_layout.tsx`

### "PostHog events not showing"
- Check that `EXPO_PUBLIC_POSTHOG_KEY` is set
- Events may take a few minutes to appear in dashboard
- Check console for initialization logs

### "RevenueCat products not loading"
- Verify `EXPO_PUBLIC_RC_API_KEY` is set
- Ensure products are configured in RevenueCat dashboard
- Check device has internet connection

### "Speech not working"
- Check microphone permissions in app settings
- TTS requires internet for some voices
- STT requires actual SDK (currently mock)

---

## ✅ Completed Features Checklist

- [x] Sentry crash reporting
- [x] PostHog analytics
- [x] RevenueCat subscriptions
- [x] i18n (English, Punjabi, Hindi)
- [x] Text-to-Speech
- [x] Speech-to-Text (hooks ready, needs SDK)
- [x] MMKV storage
- [x] FlashList ready (needs component updates)
- [x] expo-updates configured
- [x] Environment variables template
- [x] Example components
- [x] Documentation

---

**Need help?** Check the example components in `components/examples/` or refer to the documentation links above.
