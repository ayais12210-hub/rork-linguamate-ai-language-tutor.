import app from '@/backend/hono';

describe('Health and Info endpoints', () => {
  it('GET /api (mounted) responds with ok', async () => {
    const res = await app.request('http://localhost/');
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.status).toBe('ok');
    expect(json).toHaveProperty('timestamp');
  });

  it('GET /api/info responds with metadata', async () => {
    const res = await app.request('http://localhost/info');
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveProperty('name');
    expect(json).toHaveProperty('version');
    expect(json).toHaveProperty('endpoints');
  });

  it('returns 404 for unknown route', async () => {
    const res = await app.request('http://localhost/unknown');
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error?.code).toBe('NOT_FOUND');
  });
});
