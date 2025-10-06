import { Hono } from 'hono';
import { authRateLimit, unlockAccount, getLockoutStatus } from '@/backend/middleware/authRateLimit';

// Mock the config
jest.mock('@/backend/config/env', () => ({
  getConfig: {
    rateLimit: () => ({
      windowMs: 60000,
      maxRequests: 60,
      maxLoginAttempts: 3,
    }),
  },
}));

describe('Auth Rate Limit Middleware', () => {
  let app: Hono;

  beforeEach(() => {
    app = new Hono();
    
    // Apply auth rate limiting
    app.use('/auth/*', authRateLimit());
    
    // Mock login endpoint
    app.post('/auth/login', async (c) => {
      const body = c.get('parsedBody') || await c.req.json();
      
      if (body.email === 'valid@example.com' && body.password === 'correct') {
        return c.json({ success: true, token: 'mock-token' });
      }
      
      c.status(401);
      return c.json({ error: 'Invalid credentials' });
    });
  });

  afterEach(() => {
    // Clean up any locked accounts
    unlockAccount('invalid@example.com');
    unlockAccount('1.1.1.1');
  });

  it('allows successful login attempts', async () => {
    const res = await app.fetch(
      new Request('http://localhost/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'valid@example.com',
          password: 'correct',
        }),
      })
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it('tracks failed attempts by email', async () => {
    const makeRequest = () =>
      app.fetch(
        new Request('http://localhost/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'invalid@example.com',
            password: 'wrong',
          }),
        })
      );

    // First 3 attempts should fail with 401
    for (let i = 0; i < 3; i++) {
      const res = await makeRequest();
      expect(res.status).toBe(401);
      
      const remaining = res.headers.get('X-RateLimit-Remaining-Auth');
      expect(remaining).toBe(String(2 - i));
    }

    // Check status
    const status = getLockoutStatus('invalid@example.com');
    expect(status.locked).toBe(false);
    expect(status.attempts).toBe(3);
  });

  it('locks account after too many failures', async () => {
    const makeRequest = () =>
      app.fetch(
        new Request('http://localhost/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'lockme@example.com',
            password: 'wrong',
          }),
        })
      );

    // Make 6 failed attempts (2x threshold)
    for (let i = 0; i < 6; i++) {
      await makeRequest();
    }

    // Next attempt should be locked
    const res = await makeRequest();
    expect(res.status).toBe(429);
    
    const body = await res.json();
    expect(body.error).toBe('Too Many Attempts');
    expect(body.message).toContain('Account temporarily locked');
    expect(body.retryAfter).toBeGreaterThan(0);

    // Check status
    const status = getLockoutStatus('lockme@example.com');
    expect(status.locked).toBe(true);
    expect(status.remainingMinutes).toBeGreaterThan(0);
  });

  it('tracks failed attempts by IP when no email provided', async () => {
    const makeRequest = (ip: string) =>
      app.fetch(
        new Request('http://localhost/auth/login', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'x-forwarded-for': ip,
          },
          body: 'invalid-json',
        })
      );

    // Make failed attempts from same IP
    for (let i = 0; i < 3; i++) {
      const res = await makeRequest('10.0.0.1');
      expect(res.status).toBe(401);
    }

    // Check that IP is being tracked
    const status = getLockoutStatus('10.0.0.1');
    expect(status.attempts).toBe(3);
  });

  it('clears failed attempts on successful login', async () => {
    const email = 'cleared@example.com';
    
    // Make some failed attempts
    for (let i = 0; i < 2; i++) {
      await app.fetch(
        new Request('http://localhost/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password: 'wrong' }),
        })
      );
    }

    // Verify attempts were tracked
    expect(getLockoutStatus(email).attempts).toBe(2);

    // Successful login
    await app.fetch(
      new Request('http://localhost/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: 'valid@example.com', 
          password: 'correct',
        }),
      })
    );

    // Failed attempts should be cleared
    expect(getLockoutStatus('valid@example.com').attempts).toBe(0);
  });

  it('warns about approaching lockout', async () => {
    const makeRequest = () =>
      app.fetch(
        new Request('http://localhost/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'warning@example.com',
            password: 'wrong',
          }),
        })
      );

    // Make attempts up to the limit
    for (let i = 0; i < 2; i++) {
      await makeRequest();
    }

    // Last allowed attempt should include warning
    const res = await makeRequest();
    expect(res.status).toBe(401);
    
    const body = await res.json();
    expect(body.warning).toContain('Multiple failed attempts detected');
  });

  it('allows admin to unlock accounts', async () => {
    const email = 'unlock@example.com';
    
    // Lock the account
    for (let i = 0; i < 6; i++) {
      await app.fetch(
        new Request('http://localhost/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password: 'wrong' }),
        })
      );
    }

    // Verify locked
    expect(getLockoutStatus(email).locked).toBe(true);

    // Unlock
    const wasLocked = unlockAccount(email);
    expect(wasLocked).toBe(true);

    // Should be able to attempt login again
    const res = await app.fetch(
      new Request('http://localhost/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: 'wrong' }),
      })
    );
    expect(res.status).toBe(401); // Not 429
  });
});