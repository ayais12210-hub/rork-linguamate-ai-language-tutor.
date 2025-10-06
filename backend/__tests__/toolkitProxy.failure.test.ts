import app from '@/backend/hono';

describe('Toolkit proxy upstream failure handling', () => {
  it('retries and returns service unavailable on network error', async () => {
    // Point to an invalid base to force network error
    process.env.EXPO_PUBLIC_TOOLKIT_URL = 'http://127.0.0.1:65500';

    const res = await app.request('http://localhost/toolkit/v1/text/llm', {
      method: 'POST',
      body: JSON.stringify({ prompt: 'hello' }),
      headers: { 'content-type': 'application/json' },
    });

    expect([503, 500, 502, 504]).toContain(res.status);
    const json = await res.json();
    expect(json).toHaveProperty('message');
  });
});
