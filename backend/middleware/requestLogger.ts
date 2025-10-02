import type { Context, Next } from 'hono';
import { logger } from '../logging/pino';

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
      path,
      status,
      duration,
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
