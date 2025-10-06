import { retry, RetryPolicies, RetryPolicy } from '@/backend/utils/retry';

describe('Retry Utility', () => {
  let attempt: number;
  let successAfterNFn: jest.Mock;
  let alwaysFailFn: jest.Mock;

  beforeEach(() => {
    attempt = 0;
    
    successAfterNFn = jest.fn().mockImplementation((n: number) => {
      attempt++;
      if (attempt < n) {
        const error = new Error(`Attempt ${attempt} failed`);
        (error as any).status = 500;
        throw error;
      }
      return `Success after ${attempt} attempts`;
    });

    alwaysFailFn = jest.fn().mockImplementation(() => {
      const error = new Error('Always fails');
      (error as any).status = 500;
      throw error;
    });
  });

  it('succeeds on first attempt', async () => {
    const successFn = jest.fn().mockResolvedValue('immediate success');
    
    const result = await retry(successFn);
    expect(result).toBe('immediate success');
    expect(successFn).toHaveBeenCalledTimes(1);
  });

  it('retries on failure and eventually succeeds', async () => {
    const result = await retry(
      () => successAfterNFn(3),
      { maxAttempts: 3, initialDelay: 10 }
    );
    
    expect(result).toBe('Success after 3 attempts');
    expect(successAfterNFn).toHaveBeenCalledTimes(3);
  });

  it('throws after max attempts', async () => {
    await expect(
      retry(alwaysFailFn, { maxAttempts: 3, initialDelay: 10 })
    ).rejects.toThrow('Always fails');
    
    expect(alwaysFailFn).toHaveBeenCalledTimes(3);
  });

  it('respects custom shouldRetry predicate', async () => {
    const error404 = new Error('Not found');
    (error404 as any).status = 404;
    
    const failWith404 = jest.fn().mockRejectedValue(error404);
    
    await expect(
      retry(failWith404, {
        maxAttempts: 3,
        shouldRetry: (error) => error.status !== 404,
      })
    ).rejects.toThrow('Not found');
    
    // Should not retry on 404
    expect(failWith404).toHaveBeenCalledTimes(1);
  });

  it('calls onRetry callback', async () => {
    const onRetry = jest.fn();
    
    await retry(
      () => successAfterNFn(3),
      {
        maxAttempts: 3,
        initialDelay: 10,
        onRetry,
      }
    );
    
    expect(onRetry).toHaveBeenCalledTimes(2);
    expect(onRetry).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Attempt 1 failed' }),
      1
    );
  });

  it('applies exponential backoff', async () => {
    const startTime = Date.now();
    
    await expect(
      retry(alwaysFailFn, {
        maxAttempts: 3,
        initialDelay: 100,
        backoffMultiplier: 2,
      })
    ).rejects.toThrow();
    
    const duration = Date.now() - startTime;
    // Should take at least 100 + 200 = 300ms (plus some jitter)
    expect(duration).toBeGreaterThanOrEqual(300);
  });

  it('respects max delay', async () => {
    const startTime = Date.now();
    
    await expect(
      retry(alwaysFailFn, {
        maxAttempts: 3,
        initialDelay: 100,
        maxDelay: 150,
        backoffMultiplier: 10,
      })
    ).rejects.toThrow();
    
    const duration = Date.now() - startTime;
    // Second delay should be capped at 150ms
    expect(duration).toBeLessThan(500);
  });

  it('retries on specific error codes', async () => {
    let callCount = 0;
    const networkErrorFn = jest.fn().mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        const error = new Error('Connection refused');
        (error as any).code = 'ECONNREFUSED';
        throw error;
      }
      return 'Connected';
    });
    
    const result = await retry(networkErrorFn, { initialDelay: 10 });
    expect(result).toBe('Connected');
    expect(networkErrorFn).toHaveBeenCalledTimes(2);
  });
});

describe('Retry Policies', () => {
  it('provides pre-configured policies', () => {
    expect(RetryPolicies.fast).toBeInstanceOf(RetryPolicy);
    expect(RetryPolicies.standard).toBeInstanceOf(RetryPolicy);
    expect(RetryPolicies.aggressive).toBeInstanceOf(RetryPolicy);
    expect(RetryPolicies.none).toBeInstanceOf(RetryPolicy);
  });

  it('allows policy customization', async () => {
    const customPolicy = RetryPolicies.fast.with({
      maxAttempts: 5,
    });
    
    let attempts = 0;
    const fn = jest.fn().mockImplementation(() => {
      attempts++;
      if (attempts < 5) {
        throw new Error('Fail');
      }
      return 'Success';
    });
    
    const result = await customPolicy.execute(fn);
    expect(result).toBe('Success');
    expect(fn).toHaveBeenCalledTimes(5);
  });
});