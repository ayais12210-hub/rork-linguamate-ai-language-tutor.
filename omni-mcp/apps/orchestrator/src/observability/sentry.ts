export function initSentry(dsn?: string): void {
  if (!dsn) {
    return;
  }

  try {
    // Dynamic import to avoid requiring Sentry dependencies when not enabled
    import('@sentry/node' as any).then((Sentry: any) => {
      Sentry.init({
        dsn,
        environment: process.env.NODE_ENV || 'development',
        release: process.env.GIT_SHA || 'unknown',
        tracesSampleRate: 0.1,
      });
      console.log('✅ Sentry initialized');
    }).catch((error: any) => {
      console.warn('⚠️ Sentry initialization failed:', error.message);
    });
  } catch (error) {
    console.warn('⚠️ Sentry not available:', error instanceof Error ? error.message : 'Unknown error');
  }
}