import { serve } from '@hono/node-server';
import app from './hono';

const PORT = Number(process.env.PORT || 8080);

serve({
  fetch: (req, env, ctx) => app.fetch(req, env, ctx),
  port: PORT,
  hostname: '0.0.0.0',
});

// eslint-disable-next-line no-console
console.log(`Hono server listening on http://localhost:${PORT}/api`);
