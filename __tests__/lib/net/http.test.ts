import { getJson, postJson, withRetry } from '@/lib/net/http';
import { z } from 'zod';

// Mock fetch
global.fetch = jest.fn();

const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('HTTP client', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('getJson', () => {
    const TestSchema = z.object({
      id: z.string(),
      name: z.string(),
    });

    it('should handle successful request', async () => {
      const mockResponse = { id: '1', name: 'Test' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const result = await getJson('/test', TestSchema);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual(mockResponse);
      }
    });

    it('should handle network error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as Response);

      const result = await getJson('/test', TestSchema);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('NetworkError');
        expect(result.error.retryable).toBe(true);
      }
    });

    it('should handle validation error', async () => {
      const invalidResponse = { id: 123, name: null };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(invalidResponse),
      } as Response);

      const result = await getJson('/test', TestSchema);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('ValidationError');
      }
    });

    it('should handle timeout', async () => {
      mockFetch.mockImplementationOnce(() => {
        return new Promise((_, reject) => {
          setTimeout(() => {
            const error = new Error('Request timed out');
            error.name = 'AbortError';
            reject(error);
          }, 100);
        });
      });

      const result = await getJson('/test', TestSchema, { timeout: 50 });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('TimeoutError');
        expect(result.error.retryable).toBe(true);
      }
    });
  });

  describe('postJson', () => {
    const TestSchema = z.object({
      id: z.string(),
      message: z.string(),
    });

    it('should handle successful POST request', async () => {
      const mockResponse = { id: '1', message: 'Success' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const result = await postJson('/test', { data: 'test' }, TestSchema);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual(mockResponse);
      }
    });

    it('should handle POST validation error', async () => {
      const invalidResponse = { id: 123 };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(invalidResponse),
      } as Response);

      const result = await postJson('/test', { data: 'test' }, TestSchema);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('ValidationError');
      }
    });
  });

  describe('withRetry', () => {
    it('should retry on retryable errors', async () => {
      let attemptCount = 0;
      const mockFn = jest.fn().mockImplementation(() => {
        attemptCount++;
        if (attemptCount < 3) {
          return Promise.resolve({
            ok: false,
            error: {
              code: 'NetworkError',
              message: 'Temporary failure',
              retryable: true,
            },
          });
        }
        return Promise.resolve({ ok: true, value: 'success' });
      });

      const result = await withRetry(mockFn, { maxRetries: 3 });

      expect(attemptCount).toBe(3);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe('success');
      }
    });

    it('should not retry on non-retryable errors', async () => {
      const mockFn = jest.fn().mockResolvedValue({
        ok: false,
        error: {
          code: 'ValidationError',
          message: 'Invalid input',
          retryable: false,
        },
      });

      const result = await withRetry(mockFn, { maxRetries: 3 });

      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(result.ok).toBe(false);
    });

    it('should respect max retries', async () => {
      const mockFn = jest.fn().mockResolvedValue({
        ok: false,
        error: {
          code: 'NetworkError',
          message: 'Persistent failure',
          retryable: true,
        },
      });

      const result = await withRetry(mockFn, { maxRetries: 2 });

      expect(mockFn).toHaveBeenCalledTimes(3); // Initial + 2 retries
      expect(result.ok).toBe(false);
    });
  });
});