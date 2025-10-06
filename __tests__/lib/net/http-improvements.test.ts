import { getJson, postJson } from '@/lib/net/http';
import { z } from 'zod';
import { isErr } from '@/lib/errors/result';

// Mock fetch
global.fetch = jest.fn();

describe('HTTP client error handling improvements', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const TestSchema = z.object({
    message: z.string(),
  });

  describe('getJson', () => {
    it('should handle empty response body gracefully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        text: async () => '',
        json: async () => { throw new Error('No JSON content'); },
      });

      const result = await getJson('https://api.example.com/test', TestSchema);

      expect(isErr(result)).toBe(true);
      if (!result.ok) {
        expect(result.error.code).toBe('ValidationError');
        expect(result.error.message).toContain('Invalid');
      }
    });

    it('should handle invalid JSON response', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        text: async () => 'Invalid JSON {',
        json: async () => { throw new Error('Invalid JSON'); },
      });

      const result = await getJson('https://api.example.com/test', TestSchema);

      expect(isErr(result)).toBe(true);
      if (!result.ok) {
        expect(result.error.code).toBe('ValidationError');
        expect(result.error.message).toBe('Invalid JSON response from server');
      }
    });

    it('should handle valid empty JSON object', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        text: async () => '',
      });

      const EmptySchema = z.object({});
      const result = await getJson('https://api.example.com/test', EmptySchema);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual({});
      }
    });

    it('should handle non-200 responses properly', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      const result = await getJson('https://api.example.com/test', TestSchema);

      expect(isErr(result)).toBe(true);
      if (!result.ok) {
        expect(result.error.code).toBe('NetworkError');
        expect(result.error.message).toBe('HTTP 404: Not Found');
        expect(result.error.retryable).toBe(false);
      }
    });

    it('should mark 5xx errors as retryable', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
      });

      const result = await getJson('https://api.example.com/test', TestSchema);

      expect(isErr(result)).toBe(true);
      if (!result.ok) {
        expect(result.error.code).toBe('NetworkError');
        expect(result.error.retryable).toBe(true);
      }
    });
  });

  describe('postJson', () => {
    it('should handle empty response body in POST requests', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        text: async () => '',
      });

      const result = await postJson(
        'https://api.example.com/test',
        { data: 'test' },
        z.object({})
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual({});
      }
    });

    it('should handle large JSON parsing errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        text: async () => '{"incomplete": "json',
      });

      const result = await postJson(
        'https://api.example.com/test',
        { data: 'test' },
        TestSchema
      );

      expect(isErr(result)).toBe(true);
      if (!result.ok) {
        expect(result.error.code).toBe('ValidationError');
        expect(result.error.message).toBe('Invalid JSON response from server');
      }
    });

    it('should include context in error objects', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
      });

      const url = 'https://api.example.com/test';
      const result = await postJson(url, { data: 'test' }, TestSchema);

      expect(isErr(result)).toBe(true);
      if (!result.ok) {
        expect(result.error.context).toMatchObject({
          status: 400,
          url,
        });
      }
    });
  });
});