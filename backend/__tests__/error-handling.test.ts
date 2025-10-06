import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { Hono } from 'hono';
import app from '../hono';
import { clearRateLimits } from '../middleware/rateLimit';

describe('Error Handling Tests', () => {
  beforeEach(() => {
    clearRateLimits();
  });

  afterEach(() => {
    clearRateLimits();
  });

  describe('HTTP Error Responses', () => {
    it('should return 404 for unknown routes', async () => {
      const res = await app.request('/unknown-route');
      expect(res.status).toBe(404);
    });

    it('should handle malformed JSON gracefully', async () => {
      const res = await app.request('/trpc/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json{'
      });
      
      // Should not crash the server
      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.status).toBeLessThan(500);
    });

    it('should handle oversized requests', async () => {
      const largePayload = 'x'.repeat(10 * 1024 * 1024); // 10MB
      const res = await app.request('/trpc/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: largePayload })
      });
      
      // Should handle gracefully (may be 413 or 400)
      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('Rate Limiting Error Handling', () => {
    it('should return proper error format when rate limited', async () => {
      // Create a test app with very low rate limits for testing
      const testApp = new Hono();
      const { rateLimit } = await import('../middleware/rateLimit');
      
      testApp.use('/test', rateLimit({ windowMs: 1000, max: 1 }));
      testApp.post('/test', (c: any) => c.json({ ok: true }));

      // First request should succeed
      const res1 = await testApp.request('/test', {
        method: 'POST',
        headers: { 'x-forwarded-for': '1.1.1.1' }
      });
      expect(res1.status).toBe(200);

      // Second request should be rate limited
      const res2 = await testApp.request('/test', {
        method: 'POST',
        headers: { 'x-forwarded-for': '1.1.1.1' }
      });
      expect(res2.status).toBe(429);

      const errorBody = await res2.json();
      expect(errorBody).toHaveProperty('error');
      expect(errorBody.error).toContain('Rate limit exceeded');
      expect(errorBody).toHaveProperty('retryAfter');
      expect(typeof errorBody.retryAfter).toBe('number');
    });

    it('should include rate limit headers in error response', async () => {
      const testApp = new Hono();
      const { rateLimit } = await import('../middleware/rateLimit');
      
      testApp.use('/test', rateLimit({ windowMs: 1000, max: 1 }));
      testApp.post('/test', (c: any) => c.json({ ok: true }));

      // Use up the limit
      await testApp.request('/test', {
        method: 'POST',
        headers: { 'x-forwarded-for': '2.2.2.2' }
      });

      // Next request should be rate limited with headers
      const res = await testApp.request('/test', {
        method: 'POST',
        headers: { 'x-forwarded-for': '2.2.2.2' }
      });

      expect(res.status).toBe(429);
      expect(res.headers.get('X-RateLimit-Limit')).toBe('1');
      expect(res.headers.get('X-RateLimit-Remaining')).toBe('0');
      expect(res.headers.get('X-RateLimit-Reset')).toBeTruthy();
    });
  });

  describe('tRPC Error Handling', () => {
    it('should format tRPC errors properly', async () => {
      // Test that tRPC errors are properly formatted
      const res = await app.request('/trpc/nonexistent.procedure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      expect(res.status).toBeGreaterThanOrEqual(400);
      
      // Should return JSON error response
      const contentType = res.headers.get('content-type');
      expect(contentType).toContain('application/json');
    });

    it('should handle unauthorized access gracefully', async () => {
      // Test protected procedure without auth
      const res = await app.request('/trpc/user.get', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      expect(res.status).toBe(401);
    });
  });

  describe('Validation Error Handling', () => {
    it('should return structured validation errors', async () => {
      // Test with invalid input to a tRPC procedure
      const res = await app.request('/trpc/example.hi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          json: { invalid: 'data' }
        })
      });

      // Should handle validation errors gracefully
      if (res.status >= 400) {
        const body = await res.json();
        expect(body).toBeDefined();
        // Should not expose internal error details
        expect(JSON.stringify(body)).not.toContain('stack');
        expect(JSON.stringify(body)).not.toContain('password');
        expect(JSON.stringify(body)).not.toContain('secret');
      }
    });
  });

  describe('Security Error Handling', () => {
    it('should not expose sensitive information in errors', async () => {
      const res = await app.request('/trpc/auth.login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          json: {
            email: 'test@example.com',
            password: 'wrongpassword'
          }
        })
      });

      if (res.status >= 400) {
        const body = await res.json();
        const bodyStr = JSON.stringify(body);
        
        // Should not expose sensitive data
        expect(bodyStr).not.toContain('wrongpassword');
        expect(bodyStr).not.toContain('JWT_SECRET');
        expect(bodyStr).not.toContain('database');
        expect(bodyStr).not.toContain('stack trace');
      }
    });

    it('should handle CORS errors properly', async () => {
      const res = await app.request('/', {
        method: 'POST',
        headers: {
          'Origin': 'https://malicious-site.com',
          'Content-Type': 'application/json'
        }
      });

      // Should handle CORS but not crash
      expect(res.status).toBeLessThan(500);
    });
  });
});