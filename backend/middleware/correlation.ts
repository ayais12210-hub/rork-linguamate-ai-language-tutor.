import type { Context, Next } from 'hono';
import { v4 as uuidv4 } from 'uuid';

export async function correlationMiddleware(c: Context, next: Next) {
  const correlationId = c.req.header('x-correlation-id') || uuidv4();
  const sessionId = c.req.header('x-session-id');

  c.set('correlationId', correlationId);
  if (sessionId) {
    c.set('sessionId', sessionId);
  }

  c.header('x-correlation-id', correlationId);

  await next();
}
