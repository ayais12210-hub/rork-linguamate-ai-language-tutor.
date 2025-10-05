import { HttpClient } from '@/lib/http';
import { AppError } from '@/lib/errors';
import { z } from 'zod';

// Mock fetch globally
global.fetch = jest.fn();

describe('HttpClient', () => {
  let client: HttpClient;

  beforeEach(() => {
    client = new HttpClient({
      baseURL: 'https://api.example.com',
      timeout: 5000,
      retries: 2,
    });
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with default options', () => {
      const defaultClient = new HttpClient();
      
      expect(defaultClient).toBeDefined();
    });

    it('should accept custom options', () => {
      const customClient = new HttpClient({
        baseURL: 'https://custom.api.com',
        timeout: 10000,
        headers: {
          'X-Custom-Header': 'value',
        },
        retries: 5,
        retryDelay: 500,
        validateResponse: false,
      });

      expect(customClient).toBeDefined();
    });
  });

  describe('request', () => {
    it('should make successful GET request', async () => {
      const mockResponse = { data: 'test' };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockResponse,
      });

      const result = await client.get('/test');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/test',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-Request-ID': expect.stringMatching(/^req_\d+_[a-z0-9]+$/),
          }),
          signal: expect.any(AbortSignal),
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should make successful POST request with body', async () => {
      const requestBody = { name: 'test', value: 123 };
      const mockResponse = { id: '123', ...requestBody };
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockResponse,
      });

      const result = await client.post('/items', requestBody);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/items',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(requestBody),
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should validate response with Zod schema', async () => {
      const schema = z.object({
        id: z.string(),
        name: z.string(),
        age: z.number(),
      });

      const mockResponse = { id: '123', name: 'John', age: 30 };
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockResponse,
      });

      const result = await client.get('/user', { schema });

      expect(result).toEqual(mockResponse);
    });

    it('should throw validation error for invalid response schema', async () => {
      const schema = z.object({
        id: z.string(),
        age: z.number(),
      });

      const mockResponse = { id: '123', age: 'thirty' }; // Invalid age type
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockResponse,
      });

      await expect(client.get('/user', { schema })).rejects.toThrow(AppError);
      await expect(client.get('/user', { schema })).rejects.toMatchObject({
        kind: 'Validation',
        code: 'RESPONSE_VALIDATION_ERROR',
      });
    });

    it('should handle text responses', async () => {
      const textResponse = 'Plain text response';
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'text/plain' }),
        text: async () => textResponse,
      });

      const result = await client.get('/text');

      expect(result).toBe(textResponse);
    });

    it('should handle blob responses', async () => {
      const blobData = new Blob(['binary data']);
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/octet-stream' }),
        blob: async () => blobData,
      });

      const result = await client.get('/file');

      expect(result).toBe(blobData);
    });

    it('should handle HTML error responses', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'text/html' }),
      });

      await expect(client.get('/test')).rejects.toThrow(AppError);
      await expect(client.get('/test')).rejects.toMatchObject({
        kind: 'Network',
        code: 'INVALID_RESPONSE_TYPE',
      });
    });

    it('should handle 401 Unauthorized', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ message: 'Invalid token' }),
      });

      await expect(client.get('/protected')).rejects.toThrow(AppError);
      await expect(client.get('/protected')).rejects.toMatchObject({
        kind: 'Auth',
        code: 'HTTP_401',
      });
    });

    it('should handle 400 Bad Request', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ code: 'INVALID_INPUT', message: 'Invalid email' }),
      });

      await expect(client.post('/users', {})).rejects.toThrow(AppError);
      await expect(client.post('/users', {})).rejects.toMatchObject({
        kind: 'Validation',
        code: 'INVALID_INPUT',
      });
    });

    it('should handle 500 Internal Server Error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({}),
      });

      await expect(client.get('/test')).rejects.toThrow(AppError);
      await expect(client.get('/test')).rejects.toMatchObject({
        kind: 'Server',
        code: 'HTTP_500',
      });
    });

    it('should handle timeout errors', async () => {
      const error = new Error('Request aborted');
      error.name = 'AbortError';
      (global.fetch as jest.Mock).mockRejectedValueOnce(error);

      await expect(client.get('/slow', { timeout: 100 })).rejects.toThrow(AppError);
      await expect(client.get('/slow', { timeout: 100 })).rejects.toMatchObject({
        kind: 'Network',
        code: 'TIMEOUT',
      });
    });

    it('should retry on network errors', async () => {
      const networkError = new Error('Network request failed');
      networkError.name = 'NetworkError';
      
      // Fail twice, succeed on third attempt
      (global.fetch as jest.Mock)
        .mockRejectedValueOnce(networkError)
        .mockRejectedValueOnce(networkError)
        .mockResolvedValueOnce({
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => ({ success: true }),
        });

      const result = await client.get('/flaky');

      expect(result).toEqual({ success: true });
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    it('should not retry non-idempotent requests by default', async () => {
      const networkError = new Error('Network request failed');
      networkError.name = 'NetworkError';
      
      (global.fetch as jest.Mock).mockRejectedValue(networkError);

      await expect(client.post('/create', {})).rejects.toThrow(AppError);
      expect(global.fetch).toHaveBeenCalledTimes(1); // No retries
    });

    it('should retry idempotent POST requests when specified', async () => {
      const networkError = new Error('Network request failed');
      networkError.name = 'NetworkError';
      
      (global.fetch as jest.Mock)
        .mockRejectedValueOnce(networkError)
        .mockResolvedValueOnce({
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => ({ success: true }),
        });

      const result = await client.post('/update', {}, { retryIdempotent: true });

      expect(result).toEqual({ success: true });
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should use custom request ID when provided', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({}),
      });

      await client.get('/test', { requestId: 'custom_req_123' });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Request-ID': 'custom_req_123',
          }),
        })
      );
    });

    it('should handle relative URLs', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({}),
      });

      await client.get('/api/users');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/api/users',
        expect.any(Object)
      );
    });

    it('should handle absolute URLs', async () => {
      const clientWithoutBase = new HttpClient();
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({}),
      });

      await clientWithoutBase.get('https://other.api.com/data');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://other.api.com/data',
        expect.any(Object)
      );
    });
  });

  describe('convenience methods', () => {
    beforeEach(() => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ success: true }),
      });
    });

    it('should support PUT method', async () => {
      await client.put('/resource/123', { name: 'Updated' });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ name: 'Updated' }),
        })
      );
    });

    it('should support PATCH method', async () => {
      await client.patch('/resource/123', { name: 'Patched' });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ name: 'Patched' }),
        })
      );
    });

    it('should support DELETE method', async () => {
      await client.delete('/resource/123');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });
  });
});