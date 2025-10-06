import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import app from '../hono';

describe('Hono Backend Integration Tests', () => {
  describe('Health endpoints', () => {
    it('should return health status at root', async () => {
      const res = await app.request('/');
      expect(res.status).toBe(200);
      
      const data = await res.json();
      expect(data).toMatchObject({
        status: 'ok',
        message: 'Language Learning API is running',
        version: '1.0.0'
      });
      expect(data.timestamp).toBeDefined();
    });

    it('should return API info at /info', async () => {
      const res = await app.request('/info');
      expect(res.status).toBe(200);
      
      const data = await res.json();
      expect(data).toMatchObject({
        name: 'Language Learning Backend',
        version: '1.0.0',
        endpoints: {
          trpc: '/api/trpc',
          health: '/api',
          info: '/api/info',
          ingestLogs: '/api/ingest/logs'
        }
      });
    });

    it('should return health status at /health', async () => {
      const res = await app.request('/health');
      expect(res.status).toBe(200);
      
      const data = await res.json();
      expect(data).toMatchObject({
        status: 'ok',
        env: expect.any(String)
      });
      expect(data.timestamp).toBeDefined();
      expect(data.uptime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Security headers', () => {
    it('should include security headers in responses', async () => {
      const res = await app.request('/');
      
      expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
      expect(res.headers.get('X-Frame-Options')).toBe('DENY');
      expect(res.headers.get('X-XSS-Protection')).toBe('1; mode=block');
      expect(res.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
      expect(res.headers.get('Permissions-Policy')).toBe('geolocation=(), microphone=(), camera=()');
    });

    it('should include correlation ID header', async () => {
      const res = await app.request('/');
      expect(res.headers.get('x-correlation-id')).toBeDefined();
    });

    it('should preserve custom correlation ID', async () => {
      const customId = 'test-correlation-123';
      const res = await app.request('/', {
        headers: { 'x-correlation-id': customId }
      });
      expect(res.headers.get('x-correlation-id')).toBe(customId);
    });
  });

  describe('CORS configuration', () => {
    it('should handle CORS preflight requests', async () => {
      const res = await app.request('/', {
        method: 'OPTIONS',
        headers: {
          'Origin': 'http://localhost:3000',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type'
        }
      });

      expect(res.headers.get('Access-Control-Allow-Origin')).toBeDefined();
      expect(res.headers.get('Access-Control-Allow-Methods')).toContain('POST');
      expect(res.headers.get('Access-Control-Allow-Headers')).toContain('Content-Type');
    });
  });

  describe('Error handling', () => {
    it('should handle 404 for unknown routes', async () => {
      const res = await app.request('/nonexistent-route');
      expect(res.status).toBe(404);
    });

    it('should handle malformed requests gracefully', async () => {
      const res = await app.request('/trpc/invalid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json'
      });
      
      // Should not crash the server
      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('tRPC integration', () => {
    it('should mount tRPC router correctly', async () => {
      const res = await app.request('/trpc/example.hi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      
      // Should reach tRPC router (may return auth error or success)
      expect(res.status).toBeLessThan(500);
    });
  });
});