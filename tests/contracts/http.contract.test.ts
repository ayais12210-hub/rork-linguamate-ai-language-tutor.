import { z } from 'zod';
import { fetchJson, fetchJsonWithRetry } from '@/lib/http';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer();

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const UserSchema = z.object({ id: z.string(), name: z.string() });

test('200 success', async () => {
  server.use(
    http.get('https://example.com/user', () => HttpResponse.json({ id: 'u1', name: 'Jane' }))
  );
  const res = await fetchJson({ url: 'https://example.com/user', schema: UserSchema });
  expect(res).toEqual({ id: 'u1', name: 'Jane' });
});

test('500 server error -> AppError(Server)', async () => {
  server.use(http.get('https://example.com/user', () => HttpResponse.json({ message: 'boom' }, { status: 500 })));
  await expect(fetchJson({ url: 'https://example.com/user', schema: UserSchema })).rejects.toMatchObject({ kind: 'Server' });
});

test('timeout -> AppError(Network) with retry attempts', async () => {
  let calls = 0;
  server.use(
    http.get('https://example.com/slow', async () => {
      calls++;
      await new Promise((r) => setTimeout(r, 200));
      return HttpResponse.json({ ok: true });
    })
  );
  await expect(
    fetchJsonWithRetry({ url: 'https://example.com/slow', schema: z.object({ ok: z.boolean() }), baseDelayMs: 10, retries: 1, timeoutMs: 50 })
  ).rejects.toMatchObject({ kind: 'Network' });
  expect(calls).toBeGreaterThanOrEqual(2);
});

test('invalid JSON shape -> AppError(Validation)', async () => {
  server.use(http.get('https://example.com/user', () => HttpResponse.json({ wrong: true })));
  await expect(fetchJson({ url: 'https://example.com/user', schema: UserSchema })).rejects.toMatchObject({ kind: 'Validation' });
});
