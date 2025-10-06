# LinguaMate Upgrade - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Install Dependencies (Already Done ✅)
All packages have been installed. If you need to reinstall:
```bash
npm install --legacy-peer-deps
```

### Step 2: Configure Environment Variables

Copy `.env.example` to `.env` and fill in your API keys:

```bash
# Minimum required for testing:
EXPO_PUBLIC_SENTRY_DSN=your-sentry-dsn-here
EXPO_PUBLIC_POSTHOG_KEY=your-posthog-key-here
EXPO_PUBLIC_RC_API_KEY=your-revenuecat-key-here
```

**Get your keys:**
- Sentry: [sentry.io](https://sentry.io) (Free tier available)
- PostHog: [posthog.com](https://posthog.com) (Free tier available)
- RevenueCat: [revenuecat.com](https://revenuecat.com) (Free for testing)

### Step 3: Test the New Features

Run the app:
```bash
npm start
```

Try these new features:

1. **Test Sentry** - Crashes are automatically reported
2. **Test Analytics** - Events are tracked to PostHog
3. **Test TTS** - Use `useSpeech()` hook in any component
4. **Test i18n** - Change language with `changeLanguage('pa')`
5. **Test Notifications** - Schedule a test reminder

### Step 4: See Examples

Check out the example components in `components/examples/`:
- `PremiumFeatureExample.tsx` - Subscription gates
- `SpeechExample.tsx` - TTS and STT
- `I18nExample.tsx` - Language switching
- `NotificationsExample.tsx` - Reminders

### Step 5: Build Your Features

Use the new hooks and utilities:

```typescript
// Premium features
import { usePremiumGate } from '@/hooks/usePremiumGate';

// Speech
import { useSpeech } from '@/hooks/useSpeech';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';

// Analytics
import { analyticsEvents } from '@/app/providers/AnalyticsProvider';

// Translations
import { useTranslation } from 'react-i18next';

// Notifications
import { useNotifications } from '@/hooks/useNotifications';

// Fast storage
import { mmkvStorage } from '@/lib/mmkv-storage';
```

---

## 🎯 What You Can Build Now

### 1. Premium Subscription Flow
Gate advanced lessons behind a paywall:
```typescript
function AdvancedLesson() {
  const { isPremium } = usePremiumGate();
  if (!isPremium) return <UpgradePrompt />;
  return <LessonContent />;
}
```

### 2. Pronunciation Practice
Add voice feedback:
```typescript
function PronunciationPractice() {
  const { speak } = useSpeech();
  const { start, result } = useSpeechRecognition();
  
  // Speak the word
  speak(word, { language: 'pa-IN' });
  
  // Listen to user
  await start({ language: 'pa-IN' });
  
  // Check accuracy
  const score = calculateSpeechAccuracy(word, result);
}
```

### 3. Multi-Language UI
Switch languages instantly:
```typescript
function SettingsScreen() {
  const { t } = useTranslation();
  return <Text>{t('settings.title')}</Text>;
}
```

### 4. Daily Streak Reminders
Keep users engaged:
```typescript
function StreakManager() {
  const { scheduleStreakReminder } = useNotifications();
  
  useEffect(() => {
    scheduleStreakReminder(20, 0); // 8 PM daily
  }, []);
}
```

### 5. Analytics-Driven Features
Track what users love:
```typescript
function Lesson() {
  useEffect(() => {
    analyticsEvents.lessonStarted(id, type, difficulty);
    
    return () => {
      analyticsEvents.lessonCompleted(id, type, score, duration);
    };
  }, []);
}
```

---

## 🔥 Pro Tips

### Testing Without API Keys
Most features will fail gracefully without keys:
- Sentry: Logs warning, continues
- PostHog: Disables analytics, continues
- RevenueCat: Returns no subscriptions

### STT Integration
The STT hook is ready but uses a mock. To enable:
```bash
npx expo install expo-speech-recognition
```
Then update `hooks/useSpeechRecognition.ts` (see TODOs in file).

### Performance
Replace heavy `FlatList` components with `FlashList`:
```diff
- import { FlatList } from 'react-native';
+ import { FlashList } from '@shopify/flash-list';

- <FlatList data={items} renderItem={renderItem} />
+ <FlashList 
+   data={items} 
+   renderItem={renderItem}
+   estimatedItemSize={80}
+ />
```

### OTA Updates
Deploy updates without app store review:
```bash
# First setup
eas update:configure

# Deploy
eas update --branch production --message "Bug fixes"
```

---

## 📖 Full Documentation

- **UPGRADE_GUIDE.md** - Complete setup and configuration
- **IMPLEMENTATION_SUMMARY.md** - What was built and how
- **Example Components** - `components/examples/*.tsx`

---

## ❓ FAQ

**Q: Do I need all the API keys to test?**  
A: No. The app will work without them, features will just be disabled.

**Q: How do I test subscriptions without real money?**  
A: RevenueCat provides sandbox testing for iOS (TestFlight) and Android (Internal Testing).

**Q: Can I use different analytics/crash reporting?**  
A: Yes! The providers are modular. Replace or add alternatives.

**Q: What about iOS vs Android differences?**  
A: All features work cross-platform. Some (like pause/resume TTS) are iOS-only.

**Q: How do I deploy OTA updates?**  
A: Set up EAS, then `eas update --branch [channel]`. Updates download automatically.

---

## 🎓 Learning Resources

1. **RevenueCat Paywall Design**: [docs.revenuecat.com/docs/offerings](https://docs.revenuecat.com/docs/offerings)
2. **PostHog Feature Flags**: [posthog.com/docs/feature-flags](https://posthog.com/docs/feature-flags)
3. **expo-speech Examples**: [docs.expo.dev/versions/latest/sdk/speech/](https://docs.expo.dev/versions/latest/sdk/speech/)
4. **i18n Best Practices**: [react.i18next.com/guides/quick-start](https://react.i18next.com/guides/quick-start)

---

## 🚨 Need Help?

1. Check the example components for working code
2. Read the troubleshooting section in UPGRADE_GUIDE.md
3. Review the documentation links above
4. Check package documentation for specific APIs

---

## ✅ Next Steps

- [ ] Get API keys from Sentry, PostHog, RevenueCat
- [ ] Configure .env file
- [ ] Test each feature in development
- [ ] Design your paywall screen
- [ ] Add analytics to key user flows
- [ ] Set up EAS for OTA updates
- [ ] Add pronunciation practice to lessons
- [ ] Implement daily reminders
- [ ] Translate UI to additional languages
- [ ] Test on physical devices

**You're ready to build! 🎉**

Start with the examples, then build your own features using the hooks and utilities provided.
