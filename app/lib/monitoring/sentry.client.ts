import * as Sentry from '@sentry/react-native';

/**
 * Initialize Sentry for frontend monitoring
 * Only initializes if EXPO_PUBLIC_SENTRY_DSN is set
 */
export function initSentry() {
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
  
  if (!dsn) {
    console.log('[Sentry] DSN not configured, skipping initialization');
    return;
  }

  try {
    Sentry.init({
      dsn,
      integrations: [
        // Add React Native tracing for performance monitoring
        Sentry.reactNativeTracingIntegration(),
      ],
      // Adjust sample rates as needed
      tracesSampleRate: parseFloat(process.env.EXPO_PUBLIC_SENTRY_TRACES_SAMPLE_RATE || '0.2'),
      
      // Environment and release tracking
      environment: process.env.EXPO_PUBLIC_ENV || process.env.NODE_ENV || 'development',
      release: process.env.EXPO_PUBLIC_COMMIT_SHA || 'unknown',
      
      // Enable native crash reporting for React Native
      enableNative: true,
      enableNativeCrashHandling: true,
      
      // Filter out certain errors
      beforeSend(event, hint) {
        // Don't send development errors
        if (process.env.NODE_ENV === 'development') {
          console.log('[Sentry] Event captured (dev mode):', event);
          return null;
        }
        return event;
      },
    });

    console.log('[Sentry] Initialized successfully');
  } catch (error) {
    console.error('[Sentry] Failed to initialize:', error);
  }
}

/**
 * Manually capture an exception
 */
export function captureException(error: Error, context?: Record<string, any>) {
  if (context) {
    Sentry.setContext('custom', context);
  }
  Sentry.captureException(error);
}

/**
 * Capture a custom message
 */
export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info') {
  Sentry.captureMessage(message, level);
}

/**
 * Set user context for error tracking
 */
export function setUser(user: { id: string; email?: string; username?: string } | null) {
  Sentry.setUser(user);
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(breadcrumb: Sentry.Breadcrumb) {
  Sentry.addBreadcrumb(breadcrumb);
}
