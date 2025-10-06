import { ReactNode, useEffect } from 'react';
import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * MonitoringProvider - Initializes Sentry crash reporting and error tracking
 * 
 * Features:
 * - Automatic crash and error reporting
 * - Session tracking
 * - Performance monitoring
 * - Release and environment tracking
 * - Source map support for EAS builds
 */

// Initialize Sentry
const initSentry = () => {
  const dsn = Constants.expoConfig?.extra?.sentryDsn || process.env.EXPO_PUBLIC_SENTRY_DSN;
  
  if (!dsn) {
    console.warn('[MonitoringProvider] Sentry DSN not configured, skipping initialization');
    return;
  }

  Sentry.init({
    dsn,
    enableAutoSessionTracking: true,
    sessionTrackingIntervalMillis: 10000,
    
    // Performance monitoring
    tracesSampleRate: __DEV__ ? 1.0 : 0.2, // 100% in dev, 20% in production
    
    // Environment and release tracking
    environment: __DEV__ ? 'development' : 'production',
    release: Constants.expoConfig?.version || '1.0.0',
    dist: Platform.select({
      ios: Constants.expoConfig?.ios?.buildNumber,
      android: Constants.expoConfig?.android?.versionCode?.toString(),
    }),
    
    // Enable native crash reporting
    enableNative: true,
    enableNativeCrashHandling: true,
    enableNativeNagger: __DEV__,
    
    // Debug options
    debug: __DEV__,
    
    // Filter out sensitive data
    beforeSend: (event) => {
      // Remove any sensitive user data
      if (event.user?.email) {
        event.user.email = event.user.email.replace(/(.{2}).*(@.*)/, '$1***$2');
      }
      return event;
    },
  });

  console.log('[MonitoringProvider] Sentry initialized');
};

interface MonitoringProviderProps {
  children: ReactNode;
}

export function MonitoringProvider({ children }: MonitoringProviderProps) {
  useEffect(() => {
    initSentry();
    
    return () => {
      // Cleanup if needed
      Sentry.close();
    };
  }, []);

  return <>{children}</>;
}

// Export Sentry instance for manual error reporting
export { Sentry };

// Helper functions
export const captureException = (error: Error, context?: Record<string, any>) => {
  Sentry.captureException(error, { contexts: context });
};

export const captureMessage = (message: string, level: Sentry.SeverityLevel = 'info') => {
  Sentry.captureMessage(message, level);
};

export const setUser = (user: { id: string; email?: string; username?: string }) => {
  Sentry.setUser(user);
};

export const clearUser = () => {
  Sentry.setUser(null);
};

export const addBreadcrumb = (breadcrumb: Sentry.Breadcrumb) => {
  Sentry.addBreadcrumb(breadcrumb);
};
