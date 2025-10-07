import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { stdioProbe } from './stdioProbe.js';
import { spawn } from 'node:child_process';

// Mock child_process
vi.mock('node:child_process', () => ({
  spawn: vi.fn(),
}));

describe('stdioProbe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return success when child process exits with code 0', async () => {
    const mockChild = {
      on: vi.fn(),
      kill: vi.fn(),
      stdout: { on: vi.fn() },
      stderr: { on: vi.fn() },
    };

    (spawn as any).mockReturnValue(mockChild);

    const promise = stdioProbe('test-cmd', ['arg1', 'arg2'], 5000);

    // Simulate successful exit
    const exitHandler = mockChild.on.mock.calls.find(call => call[0] === 'exit')[1];
    exitHandler(0);

    const result = await promise;

    expect(result).toEqual({
      ok: true,
      ms: expect.any(Number),
    });
    expect(spawn).toHaveBeenCalledWith('test-cmd', ['arg1', 'arg2', '--health'], {
      stdio: ['ignore', 'pipe', 'pipe']
    });
  });

  it('should return failure when child process exits with non-zero code', async () => {
    const mockChild = {
      on: vi.fn(),
      kill: vi.fn(),
      stdout: { on: vi.fn() },
      stderr: { on: vi.fn() },
    };

    (spawn as any).mockReturnValue(mockChild);

    const promise = stdioProbe('test-cmd', ['arg1'], 5000);

    // Simulate failed exit
    const exitHandler = mockChild.on.mock.calls.find(call => call[0] === 'exit')[1];
    exitHandler(1);

    const result = await promise;

    expect(result).toEqual({
      ok: false,
      ms: expect.any(Number),
      error: 'exit code 1',
    });
  });

  it('should timeout and return failure when process takes too long', async () => {
    const mockChild = {
      on: vi.fn(),
      kill: vi.fn(),
      stdout: { on: vi.fn() },
      stderr: { on: vi.fn() },
    };

    (spawn as any).mockReturnValue(mockChild);

    const promise = stdioProbe('test-cmd', ['arg1'], 100);

    // Don't call exit handler, let it timeout
    await new Promise(resolve => setTimeout(resolve, 200));

    const result = await promise;

    expect(result).toEqual({
      ok: false,
      ms: expect.any(Number),
      error: 'timeout',
    });
    expect(mockChild.kill).toHaveBeenCalled();
  });

  it('should handle spawn errors', async () => {
    const mockChild = {
      on: vi.fn(),
      kill: vi.fn(),
      stdout: { on: vi.fn() },
      stderr: { on: vi.fn() },
    };

    (spawn as any).mockReturnValue(mockChild);

    const promise = stdioProbe('test-cmd', ['arg1'], 5000);

    // Simulate error event
    const errorHandler = mockChild.on.mock.calls.find(call => call[0] === 'error')[1];
    errorHandler(new Error('spawn failed'));

    const result = await promise;

    expect(result).toEqual({
      ok: false,
      ms: expect.any(Number),
      error: 'spawn failed',
    });
  });
});