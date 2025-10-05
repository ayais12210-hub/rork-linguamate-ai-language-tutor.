import { AppError, toAppError, createNetworkError, createAuthError, createValidationError, createServerError, createUnexpectedError } from '@/lib/errors';

describe('AppError', () => {
  describe('constructor', () => {
    it('should create an AppError with all properties', () => {
      const error = new AppError({
        kind: 'Network',
        message: 'Connection failed',
        code: 'NETWORK_TIMEOUT',
        details: { timeout: 30000 },
        requestId: 'req_123',
        userMessage: 'Please check your connection',
        isRecoverable: true,
      });

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
      expect(error.kind).toBe('Network');
      expect(error.message).toBe('Connection failed');
      expect(error.code).toBe('NETWORK_TIMEOUT');
      expect(error.details).toEqual({ timeout: 30000 });
      expect(error.requestId).toBe('req_123');
      expect(error.userMessage).toBe('Please check your connection');
      expect(error.isRecoverable).toBe(true);
      expect(error.errorId).toMatch(/^error_\d+_[a-z0-9]+$/);
      expect(error.timestamp).toBeGreaterThan(0);
    });

    it('should default isRecoverable to true', () => {
      const error = new AppError({
        kind: 'Server',
        message: 'Internal error',
      });

      expect(error.isRecoverable).toBe(true);
    });

    it('should preserve stack trace from cause', () => {
      const cause = new Error('Original error');
      const error = new AppError({
        kind: 'Unexpected',
        message: 'Wrapped error',
        cause,
      });

      expect(error.stack).toBe(cause.stack);
    });
  });

  describe('getUserMessage', () => {
    it('should return custom user message when provided', () => {
      const error = new AppError({
        kind: 'Validation',
        message: 'Technical validation error',
        userMessage: 'Please enter a valid email',
      });

      expect(error.getUserMessage()).toBe('Please enter a valid email');
    });

    it('should return default message for Network errors', () => {
      const error = new AppError({
        kind: 'Network',
        message: 'ECONNREFUSED',
      });

      expect(error.getUserMessage()).toBe("Can't reach server right now. Please check your connection.");
    });

    it('should return default message for Auth errors', () => {
      const error = new AppError({
        kind: 'Auth',
        message: 'Token expired',
      });

      expect(error.getUserMessage()).toBe('Please sign in again to continue.');
    });

    it('should return default message for Validation errors', () => {
      const error = new AppError({
        kind: 'Validation',
        message: 'Invalid input',
      });

      expect(error.getUserMessage()).toBe('Please check your input and try again.');
    });

    it('should return default message for Server errors', () => {
      const error = new AppError({
        kind: 'Server',
        message: 'Database connection failed',
      });

      expect(error.getUserMessage()).toBe('Something went wrong on our end. Please try again later.');
    });

    it('should return default message for Unexpected errors', () => {
      const error = new AppError({
        kind: 'Unexpected',
        message: 'Unknown error',
      });

      expect(error.getUserMessage()).toBe('Something went wrong. Please try again.');
    });
  });

  describe('toJSON', () => {
    it('should serialize error to JSON', () => {
      const error = new AppError({
        kind: 'Auth',
        message: 'Unauthorized',
        code: 'AUTH_FAILED',
        details: { userId: '123' },
        requestId: 'req_456',
        userMessage: 'Invalid credentials',
        isRecoverable: false,
      });

      const json = error.toJSON();

      expect(json).toMatchObject({
        errorId: error.errorId,
        name: 'AppError',
        kind: 'Auth',
        code: 'AUTH_FAILED',
        message: 'Unauthorized',
        userMessage: 'Invalid credentials',
        details: { userId: '123' },
        requestId: 'req_456',
        isRecoverable: false,
        timestamp: error.timestamp,
      });
      expect(json.stack).toBeDefined();
    });
  });
});

describe('toAppError', () => {
  it('should return AppError unchanged', () => {
    const appError = new AppError({
      kind: 'Network',
      message: 'Test error',
    });

    const result = toAppError(appError);
    expect(result).toBe(appError);
  });

  describe('Standard Error conversion', () => {
    it('should convert NetworkError to Network kind', () => {
      const error = new Error('Network request failed');
      error.name = 'NetworkError';

      const result = toAppError(error);
      expect(result.kind).toBe('Network');
      expect(result.message).toBe('Network request failed');
      expect(result.cause).toBe(error);
    });

    it('should convert AbortError to Network kind', () => {
      const error = new Error('Request aborted');
      error.name = 'AbortError';

      const result = toAppError(error);
      expect(result.kind).toBe('Network');
    });

    it('should detect network errors by message', () => {
      const error = new Error('fetch failed');

      const result = toAppError(error);
      expect(result.kind).toBe('Network');
    });

    it('should convert TypeError to Validation kind', () => {
      const error = new TypeError('Cannot read property of undefined');

      const result = toAppError(error);
      expect(result.kind).toBe('Validation');
    });

    it('should convert ValidationError to Validation kind', () => {
      const error = new Error('Input validation failed');
      error.name = 'ValidationError';

      const result = toAppError(error);
      expect(result.kind).toBe('Validation');
    });

    it('should detect auth errors by message', () => {
      const error = new Error('Unauthorized access');

      const result = toAppError(error);
      expect(result.kind).toBe('Auth');
    });

    it('should convert unknown errors to Unexpected kind', () => {
      const error = new Error('Something went wrong');

      const result = toAppError(error);
      expect(result.kind).toBe('Unexpected');
    });
  });

  describe('tRPC error conversion', () => {
    it('should convert tRPC UNAUTHORIZED to Auth kind', () => {
      const trpcError = {
        message: 'Unauthorized',
        data: {
          code: 'UNAUTHORIZED',
          requestId: 'req_123',
        },
      };

      const result = toAppError(trpcError);
      expect(result.kind).toBe('Auth');
      expect(result.code).toBe('UNAUTHORIZED');
      expect(result.requestId).toBe('req_123');
    });

    it('should convert tRPC BAD_REQUEST to Validation kind', () => {
      const trpcError = {
        message: 'Invalid input',
        data: {
          code: 'BAD_REQUEST',
        },
      };

      const result = toAppError(trpcError);
      expect(result.kind).toBe('Validation');
    });

    it('should convert tRPC TIMEOUT to Network kind', () => {
      const trpcError = {
        message: 'Request timeout',
        data: {
          code: 'TIMEOUT',
        },
      };

      const result = toAppError(trpcError);
      expect(result.kind).toBe('Network');
    });

    it('should convert other tRPC errors to Server kind', () => {
      const trpcError = {
        message: 'Internal server error',
        data: {
          code: 'INTERNAL_SERVER_ERROR',
        },
      };

      const result = toAppError(trpcError);
      expect(result.kind).toBe('Server');
    });
  });

  describe('HTTP response error conversion', () => {
    it('should convert 401 status to Auth kind', () => {
      const httpError = {
        status: 401,
        statusText: 'Unauthorized',
      };

      const result = toAppError(httpError);
      expect(result.kind).toBe('Auth');
      expect(result.code).toBe('HTTP_401');
    });

    it('should convert 403 status to Auth kind', () => {
      const httpError = {
        status: 403,
        statusText: 'Forbidden',
      };

      const result = toAppError(httpError);
      expect(result.kind).toBe('Auth');
    });

    it('should convert 400 status to Validation kind', () => {
      const httpError = {
        status: 400,
        statusText: 'Bad Request',
      };

      const result = toAppError(httpError);
      expect(result.kind).toBe('Validation');
    });

    it('should convert 408 status to Network kind', () => {
      const httpError = {
        status: 408,
        statusText: 'Request Timeout',
      };

      const result = toAppError(httpError);
      expect(result.kind).toBe('Network');
    });

    it('should convert 5xx status to Server kind', () => {
      const httpError = {
        status: 500,
        statusText: 'Internal Server Error',
      };

      const result = toAppError(httpError);
      expect(result.kind).toBe('Server');
    });

    it('should handle status 0 as Network error', () => {
      const httpError = {
        status: 0,
      };

      const result = toAppError(httpError);
      expect(result.kind).toBe('Network');
    });
  });

  describe('Zod error conversion', () => {
    it('should convert Zod validation errors', () => {
      const zodError = {
        issues: [
          {
            path: ['email'],
            message: 'Invalid email format',
          },
          {
            path: ['password', 'length'],
            message: 'Password too short',
          },
        ],
      };

      const result = toAppError(zodError);
      expect(result.kind).toBe('Validation');
      expect(result.code).toBe('VALIDATION_ERROR');
      expect(result.details).toEqual({
        issues: [
          { path: 'email', message: 'Invalid email format' },
          { path: 'password.length', message: 'Password too short' },
        ],
      });
      expect(result.userMessage).toBe('Invalid email format');
    });

    it('should handle empty Zod issues', () => {
      const zodError = {
        issues: [],
      };

      const result = toAppError(zodError);
      expect(result.kind).toBe('Validation');
      expect(result.userMessage).toBe('Please check your input');
    });
  });

  describe('Edge cases', () => {
    it('should handle null input', () => {
      const result = toAppError(null);
      expect(result.kind).toBe('Unexpected');
      expect(result.message).toBe('null');
    });

    it('should handle undefined input', () => {
      const result = toAppError(undefined);
      expect(result.kind).toBe('Unexpected');
      expect(result.message).toBe('undefined');
    });

    it('should handle string input', () => {
      const result = toAppError('Something went wrong');
      expect(result.kind).toBe('Unexpected');
      expect(result.message).toBe('Something went wrong');
    });

    it('should handle number input', () => {
      const result = toAppError(404);
      expect(result.kind).toBe('Unexpected');
      expect(result.message).toBe('404');
    });

    it('should handle object without error properties', () => {
      const result = toAppError({ foo: 'bar' });
      expect(result.kind).toBe('Unexpected');
      expect(result.details).toEqual({ originalError: { foo: 'bar' } });
    });
  });
});

describe('Error factory functions', () => {
  describe('createNetworkError', () => {
    it('should create Network error with defaults', () => {
      const error = createNetworkError('Connection failed');
      
      expect(error.kind).toBe('Network');
      expect(error.message).toBe('Connection failed');
      expect(error.isRecoverable).toBe(true);
    });

    it('should accept additional options', () => {
      const error = createNetworkError('Timeout', {
        code: 'TIMEOUT',
        requestId: 'req_123',
        details: { timeout: 30000 },
      });
      
      expect(error.code).toBe('TIMEOUT');
      expect(error.requestId).toBe('req_123');
      expect(error.details).toEqual({ timeout: 30000 });
    });
  });

  describe('createAuthError', () => {
    it('should create Auth error with isRecoverable false', () => {
      const error = createAuthError('Invalid token');
      
      expect(error.kind).toBe('Auth');
      expect(error.message).toBe('Invalid token');
      expect(error.isRecoverable).toBe(false);
    });
  });

  describe('createValidationError', () => {
    it('should create Validation error', () => {
      const error = createValidationError('Invalid email format');
      
      expect(error.kind).toBe('Validation');
      expect(error.message).toBe('Invalid email format');
      expect(error.isRecoverable).toBe(true);
    });
  });

  describe('createServerError', () => {
    it('should create Server error', () => {
      const error = createServerError('Database connection failed');
      
      expect(error.kind).toBe('Server');
      expect(error.message).toBe('Database connection failed');
      expect(error.isRecoverable).toBe(true);
    });
  });

  describe('createUnexpectedError', () => {
    it('should create Unexpected error with isRecoverable false', () => {
      const error = createUnexpectedError('Unknown error occurred');
      
      expect(error.kind).toBe('Unexpected');
      expect(error.message).toBe('Unknown error occurred');
      expect(error.isRecoverable).toBe(false);
    });
  });
});