import { Hono } from 'hono';
import { timeout, withTimeout } from '@/backend/middleware/timeout';

describe('Timeout Middleware', () => {
  let app: Hono;

  beforeEach(() => {
    app = new Hono();
  });

  it('allows requests that complete within timeout', async () => {
    app.use('/test', timeout({ ms: 1000 }));
    app.get('/test', async (c) => {
      await new Promise(resolve => setTimeout(resolve, 100));
      return c.json({ success: true });
    });

    const res = await app.fetch(new Request('http://localhost/test'));
    expect(res.status).toBe(200);
    
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it('times out requests that exceed limit', async () => {
    app.use('/test', timeout({ ms: 100 }));
    app.get('/test', async (c) => {
      await new Promise(resolve => setTimeout(resolve, 200));
      return c.json({ success: true });
    });

    const res = await app.fetch(new Request('http://localhost/test'));
    expect(res.status).toBe(408);
    
    const body = await res.json();
    expect(body.error).toBe('Request Timeout');
    expect(body.message).toContain('100ms');
  });

  it('includes correlation ID in timeout response', async () => {
    app.use((c, next) => {
      c.set('correlationId', 'test-123');
      return next();
    });
    app.use('/test', timeout({ ms: 50 }));
    app.get('/test', async (c) => {
      await new Promise(resolve => setTimeout(resolve, 100));
      return c.json({ success: true });
    });

    const res = await app.fetch(new Request('http://localhost/test'));
    const body = await res.json();
    expect(body.correlationId).toBe('test-123');
  });

  it('uses custom timeout message', async () => {
    app.use('/test', timeout({ ms: 50, message: 'Custom timeout' }));
    app.get('/test', async (c) => {
      await new Promise(resolve => setTimeout(resolve, 100));
      return c.json({ success: true });
    });

    const res = await app.fetch(new Request('http://localhost/test'));
    const body = await res.json();
    expect(body.message).toContain('50ms');
  });
});

describe('withTimeout helper', () => {
  it('resolves when operation completes in time', async () => {
    const result = await withTimeout(
      Promise.resolve('success'),
      1000
    );
    expect(result).toBe('success');
  });

  it('rejects when operation times out', async () => {
    const slowOperation = new Promise(resolve => 
      setTimeout(() => resolve('too late'), 200)
    );

    await expect(
      withTimeout(slowOperation, 50, 'Custom timeout')
    ).rejects.toThrow('Custom timeout');
  });

  it('preserves original error when operation fails', async () => {
    const failingOperation = Promise.reject(new Error('Original error'));

    await expect(
      withTimeout(failingOperation, 1000)
    ).rejects.toThrow('Original error');
  });
});