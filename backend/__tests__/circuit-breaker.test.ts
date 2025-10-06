import { CircuitBreaker, getCircuitBreaker } from '@/backend/utils/circuit-breaker';

describe('Circuit Breaker', () => {
  let breaker: CircuitBreaker;
  let successFn: jest.Mock;
  let failFn: jest.Mock;

  beforeEach(() => {
    breaker = new CircuitBreaker('test', {
      failureThreshold: 3,
      resetTimeout: 1000,
      requestTimeout: 500,
      volumeThreshold: 1,
    });
    
    successFn = jest.fn().mockResolvedValue('success');
    failFn = jest.fn().mockRejectedValue(new Error('failure'));
  });

  afterEach(() => {
    breaker.reset();
  });

  it('allows successful requests through', async () => {
    const result = await breaker.execute(successFn);
    expect(result).toBe('success');
    expect(successFn).toHaveBeenCalledTimes(1);
  });

  it('opens circuit after failure threshold', async () => {
    // Fail 3 times
    for (let i = 0; i < 3; i++) {
      await expect(breaker.execute(failFn)).rejects.toThrow('failure');
    }

    // Circuit should now be open
    await expect(breaker.execute(successFn)).rejects.toThrow('Circuit breaker is OPEN');
    expect(successFn).not.toHaveBeenCalled();
  });

  it('enters half-open state after reset timeout', async () => {
    // Open the circuit
    for (let i = 0; i < 3; i++) {
      await expect(breaker.execute(failFn)).rejects.toThrow('failure');
    }

    // Wait for reset timeout
    await new Promise(resolve => setTimeout(resolve, 1100));

    // Should allow one request through (half-open)
    const result = await breaker.execute(successFn);
    expect(result).toBe('success');

    // Circuit should be closed now
    const status = breaker.getStatus();
    expect(status.state).toBe('CLOSED');
  });

  it('reopens circuit if request fails in half-open state', async () => {
    // Open the circuit
    for (let i = 0; i < 3; i++) {
      await expect(breaker.execute(failFn)).rejects.toThrow('failure');
    }

    // Wait for reset timeout
    await new Promise(resolve => setTimeout(resolve, 1100));

    // Fail in half-open state
    await expect(breaker.execute(failFn)).rejects.toThrow('failure');

    // Circuit should be open again
    await expect(breaker.execute(successFn)).rejects.toThrow('Circuit breaker is OPEN');
  });

  it('enforces request timeout', async () => {
    const slowFn = jest.fn().mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve('slow'), 1000))
    );

    await expect(breaker.execute(slowFn)).rejects.toThrow('Request timeout after 500ms');
  });

  it('tracks circuit breaker status', () => {
    const status = breaker.getStatus();
    expect(status).toMatchObject({
      name: 'test',
      state: 'CLOSED',
      failures: 0,
      successes: 0,
      totalRequests: 0,
    });
  });

  it('requires minimum volume before opening', async () => {
    const volumeBreaker = new CircuitBreaker('volume-test', {
      failureThreshold: 2,
      volumeThreshold: 5,
    });

    // Fail twice but volume is too low
    await expect(volumeBreaker.execute(failFn)).rejects.toThrow('failure');
    await expect(volumeBreaker.execute(failFn)).rejects.toThrow('failure');

    // Circuit should still be closed
    const status = volumeBreaker.getStatus();
    expect(status.state).toBe('CLOSED');

    // Add more requests to meet volume
    await volumeBreaker.execute(successFn);
    await volumeBreaker.execute(successFn);
    await volumeBreaker.execute(successFn);

    // Now another failure should open it
    await expect(volumeBreaker.execute(failFn)).rejects.toThrow('failure');
    
    const newStatus = volumeBreaker.getStatus();
    expect(newStatus.state).toBe('OPEN');
  });
});

describe('Circuit Breaker Registry', () => {
  it('returns same instance for same name', () => {
    const breaker1 = getCircuitBreaker('api-service');
    const breaker2 = getCircuitBreaker('api-service');
    
    expect(breaker1).toBe(breaker2);
  });

  it('creates different instances for different names', () => {
    const breaker1 = getCircuitBreaker('service-1');
    const breaker2 = getCircuitBreaker('service-2');
    
    expect(breaker1).not.toBe(breaker2);
  });
});