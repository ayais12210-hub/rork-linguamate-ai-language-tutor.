import { Hono } from 'hono';
import { rateLimit, clearRateLimits } from '@/backend/middleware/rateLimit';

describe('Rate Limit Middleware', () => {
  let app: Hono;

  beforeEach(() => {
    clearRateLimits();
    app = new Hono();
    app.use('/api/test', rateLimit({ windowMs: 1000, max: 3 }));
    app.post('/api/test', (c) => c.json({ ok: true }));
  });

  afterEach(() => {
    clearRateLimits();
  });

  it('allows requests under limit', async () => {
    const mockRequest = (ip: string) =>
      new Request('http://localhost/api/test', {
        method: 'POST',
        headers: { 'x-forwarded-for': ip },
      });

    const res1 = await app.fetch(mockRequest('1.1.1.1'));
    expect(res1.status).toBe(200);

    const res2 = await app.fetch(mockRequest('1.1.1.1'));
    expect(res2.status).toBe(200);

    const res3 = await app.fetch(mockRequest('1.1.1.1'));
    expect(res3.status).toBe(200);
  });

  it('blocks requests exceeding limit', async () => {
    const mockRequest = () =>
      new Request('http://localhost/api/test', {
        method: 'POST',
        headers: { 'x-forwarded-for': '2.2.2.2' },
      });

    // First 3 should succeed
    await app.fetch(mockRequest());
    await app.fetch(mockRequest());
    await app.fetch(mockRequest());

    // 4th should be rate limited
    const res4 = await app.fetch(mockRequest());
    expect(res4.status).toBe(429);

    const body = await res4.json();
    expect(body).toHaveProperty('error');
    expect(body.error).toContain('Rate limit exceeded');
  });

  it('includes rate limit headers', async () => {
    const mockRequest = () =>
      new Request('http://localhost/api/test', {
        method: 'POST',
        headers: { 'x-forwarded-for': '3.3.3.3' },
      });

    const res = await app.fetch(mockRequest());
    expect(res.headers.get('X-RateLimit-Limit')).toBe('3');
    expect(res.headers.get('X-RateLimit-Remaining')).toBeTruthy();
    expect(res.headers.get('X-RateLimit-Reset')).toBeTruthy();
  });

  it('resets count after window expires', async () => {
    const mockRequest = () =>
      new Request('http://localhost/api/test', {
        method: 'POST',
        headers: { 'x-forwarded-for': '4.4.4.4' },
      });

    // Use up the limit
    await app.fetch(mockRequest());
    await app.fetch(mockRequest());
    await app.fetch(mockRequest());

    // Wait for window to expire
    await new Promise((resolve) => setTimeout(resolve, 1100));

    // Should allow new requests
    const res = await app.fetch(mockRequest());
    expect(res.status).toBe(200);
  });

  it('tracks different IPs independently', async () => {
    const mockRequest = (ip: string) =>
      new Request('http://localhost/api/test', {
        method: 'POST',
        headers: { 'x-forwarded-for': ip },
      });

    // IP 1 uses all requests
    await app.fetch(mockRequest('5.5.5.5'));
    await app.fetch(mockRequest('5.5.5.5'));
    await app.fetch(mockRequest('5.5.5.5'));

    const res1 = await app.fetch(mockRequest('5.5.5.5'));
    expect(res1.status).toBe(429);

    // IP 2 should still have full limit
    const res2 = await app.fetch(mockRequest('6.6.6.6'));
    expect(res2.status).toBe(200);
  });
});
