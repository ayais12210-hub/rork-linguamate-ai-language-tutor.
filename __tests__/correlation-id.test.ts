import { 
  CorrelationIdManager, 
  correlationIdManager, 
  withCorrelationId, 
  logWithCorrelationId 
} from '@/lib/correlation-id';

describe('CorrelationIdManager', () => {
  let manager: CorrelationIdManager;

  beforeEach(() => {
    manager = correlationIdManager;
    manager.clear(); // Reset state between tests
  });

  it('should generate a new correlation ID', () => {
    const id = manager.generate();
    expect(id).toBeDefined();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  it('should return the current correlation ID', () => {
    const id = manager.generate();
    expect(manager.get()).toBe(id);
  });

  it('should set a specific correlation ID', () => {
    const testId = 'test-correlation-id';
    manager.set(testId);
    expect(manager.get()).toBe(testId);
  });

  it('should clear the correlation ID', () => {
    manager.generate();
    manager.clear();
    expect(manager.get()).toBeNull();
  });

  it('should return header with correlation ID', () => {
    const id = manager.generate();
    const headers = manager.getHeader();
    expect(headers).toHaveProperty('x-correlation-id');
    expect(headers['x-correlation-id']).toBe(id);
  });

  it('should return empty header when no correlation ID', () => {
    manager.clear();
    const headers = manager.getHeader();
    expect(headers).toEqual({});
  });

  it('should return log context with correlation ID', () => {
    const id = manager.generate();
    const context = manager.getLogContext();
    expect(context).toHaveProperty('correlationId');
    expect(context.correlationId).toBe(id);
  });
});

describe('correlationIdManager singleton', () => {
  it('should be the same instance', () => {
    const manager1 = correlationIdManager;
    const manager2 = correlationIdManager;
    expect(manager1).toBe(manager2);
  });
});

describe('withCorrelationId', () => {
  it('should wrap client with correlation ID headers', () => {
    const mockClient = {
      testMethod: jest.fn((args: any) => args),
    };

    const wrappedClient = withCorrelationId(mockClient);
    correlationIdManager.generate();

    const result = wrappedClient.testMethod({
      context: {
        headers: { 'existing-header': 'value' },
      },
    });

    expect(result.context.headers).toHaveProperty('x-correlation-id');
    expect(result.context.headers['existing-header']).toBe('value');
  });
});

describe('logWithCorrelationId', () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'info').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('should log with correlation ID', () => {
    correlationIdManager.generate();
    logWithCorrelationId('info', 'Test message', { extra: 'data' });

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringMatching(/\[.*\] Test message/),
      expect.objectContaining({
        correlationId: expect.any(String),
        extra: 'data',
      })
    );
  });

  it('should log without correlation ID when none set', () => {
    correlationIdManager.clear();
    logWithCorrelationId('info', 'Test message');

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringMatching(/\[no-id\] Test message/),
      expect.objectContaining({})
    );
  });
});
