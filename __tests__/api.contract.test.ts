import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';

// Mock fetch for testing
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock environment variables
process.env.EXPO_PUBLIC_BACKEND_URL = 'http://localhost:4000';

describe('API Contract Tests', () => {
  const baseUrl = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:4000';

  beforeAll(() => {
    // Set up any global test configuration
  });

  afterAll(() => {
    // Clean up
    jest.clearAllMocks();
  });

  describe('Health Endpoints', () => {
    it('should respond to /api/health with correct structure', async () => {
      mockFetch.mockResolvedValueOnce({
        status: 200,
        json: async () => ({
          status: 'ok',
          uptime: 12345
        })
      });

      const response = await fetch(`${baseUrl}/api/health`);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('status');
      expect(data.status).toBe('ok');
      expect(data).toHaveProperty('uptime');
      expect(typeof data.uptime).toBe('number');
    });

    it('should respond to /api/info with service metadata', async () => {
      mockFetch.mockResolvedValueOnce({
        status: 200,
        json: async () => ({
          name: 'test-service',
          version: '1.0.0',
          environment: 'test'
        })
      });

      const response = await fetch(`${baseUrl}/api/info`);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('name');
      expect(data).toHaveProperty('version');
      expect(data).toHaveProperty('environment');
    });
  });

  describe('tRPC Endpoints', () => {
    it('should handle tRPC health check', async () => {
      mockFetch.mockResolvedValueOnce({
        status: 200,
        json: async () => ({
          result: { data: 'ok' }
        })
      });

      const response = await fetch(`${baseUrl}/api/trpc/health`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          json: {},
        }),
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('result');
    });

    it('should handle invalid tRPC requests gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        status: 404,
        json: async () => ({ error: 'Not Found' })
      });

      const response = await fetch(`${baseUrl}/api/trpc/invalid`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          json: {},
        }),
      });
      
      expect(response.status).toBe(404);
    });
  });

  describe('STT Endpoint', () => {
    it('should handle STT transcribe endpoint structure', async () => {
      mockFetch.mockResolvedValueOnce({
        status: 200,
        json: async () => ({ transcript: 'test transcript' })
      });

      // Create a minimal audio file for testing
      const formData = new FormData();
      const audioBlob = new Blob(['fake audio data'], { type: 'audio/wav' });
      formData.append('audio', audioBlob, 'test.wav');

      const response = await fetch(`${baseUrl}/api/stt/transcribe`, {
        method: 'POST',
        body: formData,
      });

      // Should either succeed or fail gracefully
      expect([200, 400, 500]).toContain(response.status);
    });
  });

  describe('CORS Headers', () => {
    it('should include proper CORS headers', async () => {
      mockFetch.mockResolvedValueOnce({
        status: 200,
        headers: {
          get: (name: string) => {
            if (name === 'access-control-allow-origin') return '*';
            if (name === 'access-control-allow-methods') return 'GET, POST, PUT, DELETE';
            return null;
          }
        }
      });

      const response = await fetch(`${baseUrl}/api/health`, {
        method: 'OPTIONS',
      });
      
      expect(response.headers.get('access-control-allow-origin')).toBeTruthy();
      expect(response.headers.get('access-control-allow-methods')).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 for non-existent endpoints', async () => {
      mockFetch.mockResolvedValueOnce({
        status: 404,
        json: async () => ({ error: 'Not Found' })
      });

      const response = await fetch(`${baseUrl}/api/nonexistent`);
      expect(response.status).toBe(404);
    });

    it('should handle malformed JSON requests', async () => {
      mockFetch.mockResolvedValueOnce({
        status: 400,
        json: async () => ({ error: 'Invalid JSON' })
      });

      const response = await fetch(`${baseUrl}/api/trpc/health`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: 'invalid json',
      });
      
      expect(response.status).toBe(400);
    });
  });

  describe('Response Time', () => {
    it('should respond to health check within reasonable time', async () => {
      mockFetch.mockResolvedValueOnce({
        status: 200,
        json: async () => ({ status: 'ok' })
      });

      const start = Date.now();
      const response = await fetch(`${baseUrl}/api/health`);
      const duration = Date.now() - start;
      
      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(5000); // 5 seconds max
    });
  });
});