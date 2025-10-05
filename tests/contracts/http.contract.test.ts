import { z } from 'zod';
import { httpRequestWithRetry } from '@/lib/http';
import { rest } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('http client contracts', () => {
  it('200 success with validation', async () => {
    const schema = z.object({ ok: z.literal(true), value: z.number() });
    server.use(rest.get('http://example.com/ok', (_req, res, ctx) => res(ctx.json({ ok: true, value: 42 }))));
    const data = await httpRequestWithRetry({ url: 'http://example.com/ok', method: 'GET', schema });
    expect(data.value).toBe(42);
  });

  it('500 server error surfaces Server kind', async () => {
    const schema = z.object({ ok: z.boolean() });
    server.use(rest.get('http://example.com/boom', (_req, res, ctx) => res(ctx.status(500), ctx.json({ message: 'fail' }))));
    await expect(httpRequestWithRetry({ url: 'http://example.com/boom', method: 'GET', schema })).rejects.toMatchObject({ kind: 'Server' });
  });

  it('timeout becomes Network kind and retries', async () => {
    const schema = z.object({ ok: z.boolean() });
    let hit = 0;
    server.use(rest.get('http://example.com/slow', async (_req, res, ctx) => {
      hit++;
      await new Promise((r) => setTimeout(r, 50));
      return res(ctx.json({ ok: true }));
    }));
    await expect(httpRequestWithRetry({ url: 'http://example.com/slow', method: 'GET', schema, timeoutMs: 1 })).rejects.toMatchObject({ kind: 'Network' });
    expect(hit).toBeGreaterThanOrEqual(1);
  });

  it('invalid JSON shape -> Validation', async () => {
    const schema = z.object({ ok: z.literal(true) });
    server.use(rest.get('http://example.com/bad', (_req, res, ctx) => res(ctx.json({ ok: false }))));
    await expect(httpRequestWithRetry({ url: 'http://example.com/bad', method: 'GET', schema })).rejects.toMatchObject({ kind: 'Validation' });
  });
});
