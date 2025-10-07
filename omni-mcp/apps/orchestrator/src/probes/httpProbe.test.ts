import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { httpProbe } from './httpProbe.js';

// Mock fetch
global.fetch = vi.fn();

describe('httpProbe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return success for 2xx status codes', async () => {
    const mockResponse = {
      status: 200,
      ok: true,
    };

    (fetch as any).mockResolvedValue(mockResponse);

    const result = await httpProbe('http://localhost:3000/health', 5000);

    expect(result).toEqual({
      ok: true,
      ms: expect.any(Number),
    });
    expect(fetch).toHaveBeenCalledWith('http://localhost:3000/health', {
      method: 'GET',
      signal: expect.any(AbortSignal),
      headers: {
        'User-Agent': 'omni-mcp-health-checker',
      },
    });
  });

  it('should return failure for 4xx status codes', async () => {
    const mockResponse = {
      status: 404,
      ok: false,
    };

    (fetch as any).mockResolvedValue(mockResponse);

    const result = await httpProbe('http://localhost:3000/health', 5000);

    expect(result).toEqual({
      ok: false,
      ms: expect.any(Number),
      error: 'HTTP 404',
    });
  });

  it('should return failure for 5xx status codes', async () => {
    const mockResponse = {
      status: 500,
      ok: false,
    };

    (fetch as any).mockResolvedValue(mockResponse);

    const result = await httpProbe('http://localhost:3000/health', 5000);

    expect(result).toEqual({
      ok: false,
      ms: expect.any(Number),
      error: 'HTTP 500',
    });
  });

  it('should timeout and return failure when request takes too long', async () => {
    // Mock fetch to never resolve
    (fetch as any).mockImplementation(() => new Promise(() => {}));

    const result = await httpProbe('http://localhost:3000/health', 50);

    expect(result).toEqual({
      ok: false,
      ms: expect.any(Number),
      error: expect.any(String),
    });
  });

  it('should handle network errors', async () => {
    (fetch as any).mockRejectedValue(new Error('Network error'));

    const result = await httpProbe('http://localhost:3000/health', 5000);

    expect(result).toEqual({
      ok: false,
      ms: expect.any(Number),
      error: 'Network error',
    });
  });

  it('should handle abort signal', async () => {
    const mockAbortError = new Error('The operation was aborted');
    mockAbortError.name = 'AbortError';
    
    (fetch as any).mockRejectedValue(mockAbortError);

    const result = await httpProbe('http://localhost:3000/health', 100);

    expect(result).toEqual({
      ok: false,
      ms: expect.any(Number),
      error: 'The operation was aborted',
    });
  });
});