import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { httpProbe } from '../src/probes/httpProbe.js';
import { stdioProbe } from '../src/probes/stdioProbe.js';

// Mock undici
vi.mock('undici', () => ({
  request: vi.fn(),
}));

// Mock child_process
vi.mock('node:child_process', () => ({
  spawn: vi.fn(),
}));

describe('httpProbe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return success for 200 status', async () => {
    const { request } = await import('undici');
    vi.mocked(request).mockResolvedValue({
      statusCode: 200,
    } as any);

    const result = await httpProbe('http://localhost:3000/health', 5000);
    
    expect(result.ok).toBe(true);
    expect(result.ms).toBeGreaterThan(0);
    expect(request).toHaveBeenCalledWith('http://localhost:3000/health', {
      method: 'GET',
      signal: expect.any(AbortSignal),
      headers: {
        'User-Agent': 'omni-mcp-health-checker',
      },
    });
  });

  it('should return failure for 500 status', async () => {
    const { request } = await import('undici');
    vi.mocked(request).mockResolvedValue({
      statusCode: 500,
    } as any);

    const result = await httpProbe('http://localhost:3000/health', 5000);
    
    expect(result.ok).toBe(false);
    expect(result.ms).toBeGreaterThan(0);
  });

  it('should handle timeout', async () => {
    const { request } = await import('undici');
    vi.mocked(request).mockImplementation(() => 
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error('timeout')), 100);
      })
    );

    const result = await httpProbe('http://localhost:3000/health', 50);
    
    expect(result.ok).toBe(false);
    expect(result.ms).toBeGreaterThan(0);
  });
});

describe('stdioProbe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return success for exit code 0', async () => {
    const { spawn } = await import('node:child_process');
    const mockChild = {
      on: vi.fn(),
      kill: vi.fn(),
    };
    
    vi.mocked(spawn).mockReturnValue(mockChild as any);

    // Mock successful exit
    mockChild.on.mockImplementation((event, callback) => {
      if (event === 'exit') {
        setTimeout(() => callback(0), 10);
      }
    });

    const result = await stdioProbe('node', ['--version'], 5000);
    
    expect(result.ok).toBe(true);
    expect(result.ms).toBeGreaterThan(0);
    expect(spawn).toHaveBeenCalledWith('node', ['--version', '--health'], {
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  });

  it('should return failure for non-zero exit code', async () => {
    const { spawn } = await import('node:child_process');
    const mockChild = {
      on: vi.fn(),
      kill: vi.fn(),
    };
    
    vi.mocked(spawn).mockReturnValue(mockChild as any);

    // Mock failed exit
    mockChild.on.mockImplementation((event, callback) => {
      if (event === 'exit') {
        setTimeout(() => callback(1), 10);
      }
    });

    const result = await stdioProbe('node', ['--version'], 5000);
    
    expect(result.ok).toBe(false);
    expect(result.ms).toBeGreaterThan(0);
  });

  it('should handle timeout', async () => {
    const { spawn } = await import('node:child_process');
    const mockChild = {
      on: vi.fn(),
      kill: vi.fn(),
    };
    
    vi.mocked(spawn).mockReturnValue(mockChild as any);

    // Mock no exit (timeout)
    mockChild.on.mockImplementation(() => {});

    const result = await stdioProbe('node', ['--version'], 50);
    
    expect(result.ok).toBe(false);
    expect(result.ms).toBeGreaterThan(0);
    expect(mockChild.kill).toHaveBeenCalled();
  });
});