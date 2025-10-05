import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useAsync, useLazyAsync, useAsyncEffect } from '@/hooks/useAsync';
import { AppError } from '@/lib/errors';

describe('useAsync', () => {
  const mockAsyncFunction = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('basic functionality', () => {
    it('should start in idle state', () => {
      const { result } = renderHook(() => useAsync(mockAsyncFunction));

      expect(result.current.state).toMatchObject({
        status: 'idle',
        data: undefined,
        error: undefined,
        isLoading: false,
        isError: false,
        isSuccess: false,
      });
    });

    it('should execute async function and update state', async () => {
      const mockData = { id: 1, name: 'Test' };
      mockAsyncFunction.mockResolvedValueOnce(mockData);

      const { result } = renderHook(() => useAsync(mockAsyncFunction));

      act(() => {
        result.current.execute();
      });

      expect(result.current.state.status).toBe('loading');
      expect(result.current.state.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.state.status).toBe('success');
        expect(result.current.state.data).toEqual(mockData);
        expect(result.current.state.isSuccess).toBe(true);
        expect(result.current.state.isLoading).toBe(false);
      });
    });

    it('should handle errors and convert to AppError', async () => {
      const mockError = new Error('Test error');
      mockAsyncFunction.mockRejectedValueOnce(mockError);

      const { result } = renderHook(() => useAsync(mockAsyncFunction));

      act(() => {
        result.current.execute();
      });

      await waitFor(() => {
        expect(result.current.state.status).toBe('error');
        expect(result.current.state.error).toBeInstanceOf(AppError);
        expect(result.current.state.error?.message).toBe('Test error');
        expect(result.current.state.isError).toBe(true);
      });
    });

    it('should pass parameters to async function', async () => {
      const params = { userId: '123' };
      mockAsyncFunction.mockResolvedValueOnce({ success: true });

      const { result } = renderHook(() => useAsync(mockAsyncFunction));

      act(() => {
        result.current.execute(params);
      });

      await waitFor(() => {
        expect(mockAsyncFunction).toHaveBeenCalledWith(params);
      });
    });
  });

  describe('options', () => {
    it('should call onSuccess callback', async () => {
      const mockData = { id: 1 };
      const onSuccess = jest.fn();
      mockAsyncFunction.mockResolvedValueOnce(mockData);

      const { result } = renderHook(() => 
        useAsync(mockAsyncFunction, { onSuccess })
      );

      act(() => {
        result.current.execute();
      });

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledWith(mockData);
      });
    });

    it('should call onError callback', async () => {
      const mockError = new Error('Test error');
      const onError = jest.fn();
      mockAsyncFunction.mockRejectedValueOnce(mockError);

      const { result } = renderHook(() => 
        useAsync(mockAsyncFunction, { onError })
      );

      act(() => {
        result.current.execute();
      });

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(expect.any(AppError));
      });
    });

    it('should execute immediately when immediate option is true', async () => {
      mockAsyncFunction.mockResolvedValueOnce({ data: 'test' });

      renderHook(() => 
        useAsync(mockAsyncFunction, { immediate: true })
      );

      await waitFor(() => {
        expect(mockAsyncFunction).toHaveBeenCalled();
      });
    });

    it('should retry on recoverable errors', async () => {
      const recoverableError = new AppError({
        kind: 'Network',
        message: 'Network error',
        isRecoverable: true,
      });

      mockAsyncFunction
        .mockRejectedValueOnce(recoverableError)
        .mockResolvedValueOnce({ success: true });

      const { result } = renderHook(() => 
        useAsync(mockAsyncFunction, { retryCount: 1 })
      );

      act(() => {
        result.current.execute();
      });

      await waitFor(() => {
        expect(mockAsyncFunction).toHaveBeenCalledTimes(2);
        expect(result.current.state.status).toBe('success');
      });
    });

    it('should not retry on non-recoverable errors', async () => {
      const nonRecoverableError = new AppError({
        kind: 'Auth',
        message: 'Authentication failed',
        isRecoverable: false,
      });

      mockAsyncFunction.mockRejectedValueOnce(nonRecoverableError);

      const { result } = renderHook(() => 
        useAsync(mockAsyncFunction, { retryCount: 3 })
      );

      act(() => {
        result.current.execute();
      });

      await waitFor(() => {
        expect(mockAsyncFunction).toHaveBeenCalledTimes(1);
        expect(result.current.state.status).toBe('error');
      });
    });

    it('should respect max retry count', async () => {
      const error = new AppError({
        kind: 'Network',
        message: 'Network error',
        isRecoverable: true,
      });

      mockAsyncFunction.mockRejectedValue(error);

      const { result } = renderHook(() => 
        useAsync(mockAsyncFunction, { retryCount: 2 })
      );

      act(() => {
        result.current.execute();
      });

      await waitFor(() => {
        expect(mockAsyncFunction).toHaveBeenCalledTimes(3); // Initial + 2 retries
        expect(result.current.state.status).toBe('error');
      });
    });
  });

  describe('manual controls', () => {
    it('should reset state', async () => {
      mockAsyncFunction.mockResolvedValueOnce({ data: 'test' });

      const { result } = renderHook(() => useAsync(mockAsyncFunction));

      act(() => {
        result.current.execute();
      });

      await waitFor(() => {
        expect(result.current.state.status).toBe('success');
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.state.status).toBe('idle');
      expect(result.current.state.data).toBeUndefined();
    });

    it('should manually set data', () => {
      const { result } = renderHook(() => useAsync(mockAsyncFunction));

      const newData = { id: 1, value: 'manual' };

      act(() => {
        result.current.setData(newData);
      });

      expect(result.current.state.status).toBe('success');
      expect(result.current.state.data).toEqual(newData);
      expect(result.current.state.isSuccess).toBe(true);
    });

    it('should manually set error', () => {
      const { result } = renderHook(() => useAsync(mockAsyncFunction));

      const error = new Error('Manual error');

      act(() => {
        result.current.setError(error);
      });

      expect(result.current.state.status).toBe('error');
      expect(result.current.state.error).toBeInstanceOf(AppError);
      expect(result.current.state.error?.message).toBe('Manual error');
      expect(result.current.state.isError).toBe(true);
    });

    it('should retry with last parameters', async () => {
      const params = { retryParam: true };
      mockAsyncFunction
        .mockRejectedValueOnce(new Error('First attempt'))
        .mockResolvedValueOnce({ success: true });

      const { result } = renderHook(() => useAsync(mockAsyncFunction));

      act(() => {
        result.current.execute(params);
      });

      await waitFor(() => {
        expect(result.current.state.status).toBe('error');
      });

      act(() => {
        result.current.retry();
      });

      await waitFor(() => {
        expect(mockAsyncFunction).toHaveBeenLastCalledWith(params);
        expect(result.current.state.status).toBe('success');
      });
    });
  });

  describe('unmount behavior', () => {
    it('should not update state after unmount', async () => {
      mockAsyncFunction.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ data: 'delayed' }), 100))
      );

      const { result, unmount } = renderHook(() => useAsync(mockAsyncFunction));

      act(() => {
        result.current.execute();
      });

      unmount();

      await new Promise(resolve => setTimeout(resolve, 150));

      // No error should be thrown
    });

    it('should reset on unmount when resetOnUnmount is true', () => {
      mockAsyncFunction.mockResolvedValueOnce({ data: 'test' });

      const { result, unmount } = renderHook(() => 
        useAsync(mockAsyncFunction, { resetOnUnmount: true })
      );

      act(() => {
        result.current.setData({ data: 'manual' });
      });

      expect(result.current.state.status).toBe('success');

      unmount();

      // State should be reset (though we can't directly test it after unmount)
    });
  });
});

describe('useLazyAsync', () => {
  const mockAsyncFunction = jest.fn();

  it('should not execute immediately', () => {
    renderHook(() => useLazyAsync(mockAsyncFunction));

    expect(mockAsyncFunction).not.toHaveBeenCalled();
  });

  it('should execute on manual trigger', async () => {
    mockAsyncFunction.mockResolvedValueOnce({ data: 'lazy' });

    const { result } = renderHook(() => useLazyAsync(mockAsyncFunction));

    expect(result.current.state.status).toBe('idle');

    act(() => {
      result.current.execute();
    });

    await waitFor(() => {
      expect(mockAsyncFunction).toHaveBeenCalled();
      expect(result.current.state.status).toBe('success');
    });
  });
});

describe('useAsyncEffect', () => {
  const mockAsyncFunction = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should execute on mount and when dependencies change', async () => {
    mockAsyncFunction.mockResolvedValue({ data: 'effect' });

    const { rerender } = renderHook(
      ({ dep }) => useAsyncEffect(mockAsyncFunction, [dep]),
      { initialProps: { dep: 1 } }
    );

    await waitFor(() => {
      expect(mockAsyncFunction).toHaveBeenCalledTimes(1);
    });

    rerender({ dep: 2 });

    await waitFor(() => {
      expect(mockAsyncFunction).toHaveBeenCalledTimes(2);
    });
  });

  it('should not have execute method', () => {
    const { result } = renderHook(() => 
      useAsyncEffect(mockAsyncFunction, [])
    );

    expect(result.current).not.toHaveProperty('execute');
  });

  it('should handle errors in effect', async () => {
    const error = new Error('Effect error');
    mockAsyncFunction.mockRejectedValueOnce(error);

    const { result } = renderHook(() => 
      useAsyncEffect(mockAsyncFunction, [])
    );

    await waitFor(() => {
      expect(result.current.state.status).toBe('error');
      expect(result.current.state.error).toBeInstanceOf(AppError);
    });
  });

  it('should cancel previous effect on dependency change', async () => {
    let resolveFirst: (value: any) => void;
    const firstPromise = new Promise(resolve => {
      resolveFirst = resolve;
    });

    mockAsyncFunction
      .mockReturnValueOnce(firstPromise)
      .mockResolvedValueOnce({ data: 'second' });

    const { result, rerender } = renderHook(
      ({ dep }) => useAsyncEffect(mockAsyncFunction, [dep]),
      { initialProps: { dep: 1 } }
    );

    rerender({ dep: 2 });

    resolveFirst!({ data: 'first' });

    await waitFor(() => {
      // Only the second call's result should be set
      expect(result.current.state.data).toEqual({ data: 'second' });
    });
  });
});