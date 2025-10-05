/* Lightweight client logger with environment routing and Sentry bridge */
// In dev: console; In prod: Sentry (if configured) + console warn/error

let sentry: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const SentryExpo = require('sentry-expo');
  sentry = SentryExpo?.Sentry ?? null;
} catch {}

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export const log = {
  debug(scope: string, message: string, data?: unknown) {
    if (__DEV__) console.debug(`[${scope}] ${message}`, data ?? '');
  },
  info(scope: string, message: string, data?: unknown) {
    if (__DEV__) console.info(`[${scope}] ${message}`, data ?? '');
  },
  warn(scope: string, message: string, data?: unknown) {
    console.warn(`[${scope}] ${message}`, data ?? '');
    sentry?.addBreadcrumb?.({ category: scope, message, level: 'warning', data });
  },
  error(scope: string, message: string, data?: unknown) {
    console.error(`[${scope}] ${message}`, data ?? '');
    sentry?.captureMessage?.(`${scope}: ${message}`, { level: 'error', extra: data });
  },
};

export function initSentry(options?: {
  dsn?: string;
  environment?: string;
  release?: string;
}) {
  if (!sentry) return;
  if (!options?.dsn) return;
  try {
    sentry.init({
      dsn: options.dsn,
      environment: options.environment ?? process.env.NODE_ENV ?? 'development',
      release: options.release,
      enableInExpoDevelopment: true,
      debug: __DEV__,
      beforeSend(event: any) {
        // Basic scrubber: remove common PII
        if (event?.request?.headers) {
          delete event.request.headers['authorization'];
        }
        if (event?.user) {
          delete event.user.email;
          delete event.user.username;
        }
        return event;
      },
    });
  } catch (e) {
    console.warn('[Sentry] init failed', e);
  }
}

export function breadcrumb(category: string, message: string, level: LogLevel = 'info', data?: unknown) {
  try {
    sentry?.addBreadcrumb?.({ category, message, level, data });
  } catch {
    // noop
  }
}
