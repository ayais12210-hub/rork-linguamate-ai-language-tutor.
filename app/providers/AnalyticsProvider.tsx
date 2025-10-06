import { ReactNode, useEffect, useState } from 'react';
import { PostHogProvider as PostHogProviderBase, PostHog } from 'posthog-react-native';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * AnalyticsProvider - Initializes PostHog analytics and feature flags
 * 
 * Features:
 * - Event tracking (lesson start/complete, word interactions, STT accuracy)
 * - Session replay (on web)
 * - Feature flags for gradual rollouts
 * - User identification
 * - Funnels and conversion tracking
 */

let posthogClient: PostHog | null = null;

const initPostHog = (): PostHog | null => {
  const apiKey = Constants.expoConfig?.extra?.posthogKey || process.env.EXPO_PUBLIC_POSTHOG_KEY;
  const host = Constants.expoConfig?.extra?.posthogHost || process.env.EXPO_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com';
  
  if (!apiKey) {
    console.warn('[AnalyticsProvider] PostHog API key not configured, analytics disabled');
    return null;
  }

  const client = new PostHog(apiKey, {
    host,
    // Automatically capture events
    captureAppLifecycleEvents: true,
  });
  console.log('[AnalyticsProvider] PostHog initialized');
  return client;
};

interface AnalyticsProviderProps {
  children: ReactNode;
}


export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  const [client, setClient] = useState<PostHog | null>(posthogClient);

  useEffect(() => {
    if (!client) {
      const initialized = initPostHog();
      posthogClient = initialized;
      setClient(initialized);
    }
  }, [client]);

  if (!client) {
    // If PostHog is not configured, just render children without provider
    return <>{children}</>;
  }

  return (
    <PostHogProviderBase client={client}>
      {children}
    </PostHogProviderBase>
  );
}

// Export PostHog client for direct access
export const getPostHogClient = () => posthogClient;

// Helper functions for common analytics events
export const analyticsEvents = {
  // Learning events
  lessonStarted: (lessonId: string, lessonType: string, difficulty?: string) => {
    posthogClient?.capture('lesson_started', {
      lessonId,
      lessonType,
      difficulty: difficulty ?? '',
    });
  },

  lessonCompleted: (lessonId: string, lessonType: string, score: number, duration: number) => {
    posthogClient?.capture('lesson_completed', {
      lessonId,
      lessonType,
      score,
      duration,
    });
  },

  lessonFailed: (lessonId: string, lessonType: string, reason?: string) => {
    posthogClient?.capture('lesson_failed', {
      lessonId,
      lessonType,
      reason: reason ?? '',
    });
  },

  // Speech events
  wordHeard: (word: string, language: string, success: boolean) => {
    posthogClient?.capture('word_heard', {
      word: word || '',
      language: language || '',
      success: success || false,
    });
  },

  sttAccuracy: (expected: string, received: string, accuracy: number) => {
    posthogClient?.capture('stt_accuracy', {
      expected: expected || '',
      received: received || '',
      accuracy: accuracy || 0,
    });
  },

  ttsUsed: (text: string, language: string) => {
    posthogClient?.capture('tts_used', {
      text,
      language,
    });
  },

  // User events
  userSignup: (method: string) => {
    posthogClient?.capture('user_signup', { method });
  },

  userLogin: (method: string) => {
    posthogClient?.capture('user_login', { method });
  },

  // Subscription events
  subscriptionViewed: (plan: string) => {
    posthogClient?.capture('subscription_viewed', { plan });
  },

  subscriptionPurchased: (plan: string, price: number, currency: string) => {
    posthogClient?.capture('subscription_purchased', {
      plan,
      price,
      currency,
    });
  },

  // Feature usage
  featureUsed: (featureName: string, properties?: Record<string, string | number | boolean>) => {
    posthogClient?.capture('feature_used', {
      featureName,
      ...(properties ?? {}),
    });
  },

  // Screen views
  screenViewed: (screenName: string, properties?: Record<string, string | number | boolean>) => {
    posthogClient?.capture('screen_viewed', {
      screenName,
      ...(properties ?? {}),
    });
  },
};

// User identification
export const identifyUser = (userId: string, properties?: Record<string, string | number | boolean>) => {
  posthogClient?.identify(userId, properties ?? {});
};

export const resetUser = () => {
  posthogClient?.reset();
};

// Feature flags
export const isFeatureEnabled = async (flagKey: string): Promise<boolean> => {
  if (!posthogClient) return false;
  const enabled = await posthogClient.isFeatureEnabled(flagKey);
  return enabled ?? false;
};

export const getFeatureFlag = async (flagKey: string): Promise<string | boolean | undefined> => {
  if (!posthogClient) return undefined;
  return await posthogClient.getFeatureFlag(flagKey);
};
