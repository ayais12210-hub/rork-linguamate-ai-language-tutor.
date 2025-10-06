import type { Context, Next } from 'hono';
import { logger } from '../logging/pino';
import { redactHeaders, redactUrl } from '../utils/log-redactor';

export async function requestLoggerMiddleware(c: Context, next: Next) {
  const start = Date.now();
  const method = c.req.method;
  const path = c.req.path;
  const correlationId = c.get('correlationId');

  await next();

  const duration = Date.now() - start;
  const status = c.res.status;

  const logData = {
    evt: 'http_request',
    cat: 'api',
    req: {
      method,
      path: redactUrl(`${c.req.url}`).replace(c.req.url.split('?')[0], path), // Only redact query params
      status,
      duration,
      userAgent: c.req.header('user-agent')?.substring(0, 200), // Limit length
      ip: c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown',
    },
    corr: {
      correlationId,
      sessionId: c.get('sessionId'),
    },
  };

  if (status >= 500) {
    logger.error(logData, `${method} ${path} ${status} ${duration}ms`);
  } else if (status >= 400) {
    logger.warn(logData, `${method} ${path} ${status} ${duration}ms`);
  } else {
    logger.info(logData, `${method} ${path} ${status} ${duration}ms`);
  }
}
