import { describe, it, expect, vi, beforeEach } from 'vitest';
import { httpProbe } from './httpProbe.js';

// Mock undici
vi.mock('undici', () => ({
  request: vi.fn(),
}));

describe('httpProbe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return success for 2xx status codes', async () => {
    const { request } = await import('undici');
    vi.mocked(request).mockResolvedValue({
      statusCode: 200,
    } as any);

    const result = await httpProbe('http://localhost:3000/health', 5000);

    expect(result).toEqual({
      ok: true,
      ms: expect.any(Number),
    });
    expect(request).toHaveBeenCalledWith('http://localhost:3000/health', {
      method: 'GET',
      signal: expect.any(AbortSignal),
      headers: {
        'User-Agent': 'omni-mcp-health-checker',
      },
    });
  });

  it('should return failure for 4xx status codes', async () => {
    const { request } = await import('undici');
    vi.mocked(request).mockResolvedValue({
      statusCode: 404,
    } as any);

    const result = await httpProbe('http://localhost:3000/health', 5000);

    expect(result).toEqual({
      ok: false,
      ms: expect.any(Number),
    });
  });

  it('should return failure for 5xx status codes', async () => {
    const { request } = await import('undici');
    vi.mocked(request).mockResolvedValue({
      statusCode: 500,
    } as any);

    const result = await httpProbe('http://localhost:3000/health', 5000);

    expect(result).toEqual({
      ok: false,
      ms: expect.any(Number),
    });
  });

  it('should timeout and return failure when request takes too long', async () => {
    const { request } = await import('undici');
    vi.mocked(request).mockImplementation(() => 
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error('timeout')), 100);
      })
    );

    const result = await httpProbe('http://localhost:3000/health', 50);

    expect(result).toEqual({
      ok: false,
      ms: expect.any(Number),
    });
  });

  it('should handle network errors', async () => {
    const { request } = await import('undici');
    vi.mocked(request).mockRejectedValue(new Error('Network error'));

    const result = await httpProbe('http://localhost:3000/health', 5000);

    expect(result).toEqual({
      ok: false,
      ms: expect.any(Number),
    });
  });

  it('should handle abort signal', async () => {
    const { request } = await import('undici');
    vi.mocked(request).mockRejectedValue(new Error('The operation was aborted'));

    const result = await httpProbe('http://localhost:3000/health', 100);

    expect(result).toEqual({
      ok: false,
      ms: expect.any(Number),
    });
  });
});