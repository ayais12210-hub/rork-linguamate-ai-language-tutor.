import {
  redactString,
  redactObject,
  redactError,
  redactHeaders,
} from '@/backend/utils/log-redaction';

describe('Log Redaction', () => {
  describe('redactString', () => {
    it('redacts JWT tokens', () => {
      const input = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
      const result = redactString(input);
      expect(result).toBe('[REDACTED]');
    });

    it('redacts API keys', () => {
      const input = 'api_key=sk-1234567890abcdef1234567890abcdef';
      const result = redactString(input);
      expect(result).toBe('[REDACTED]');
    });

    it('redacts passwords', () => {
      const input = 'password: mysecretpassword123';
      const result = redactString(input);
      expect(result).toBe('[REDACTED]');
    });

    it('redacts credit card numbers', () => {
      const input = 'Card: 4111 1111 1111 1111';
      const result = redactString(input);
      expect(result).toBe('Card: [REDACTED]');
    });

    it('redacts SSN', () => {
      const input = 'SSN: 123-45-6789';
      const result = redactString(input);
      expect(result).toBe('SSN: [REDACTED]');
    });

    it('preserves non-sensitive content', () => {
      const input = 'This is a normal log message with no sensitive data';
      const result = redactString(input);
      expect(result).toBe(input);
    });
  });

  describe('redactObject', () => {
    it('redacts sensitive fields', () => {
      const input = {
        username: 'john',
        password: 'secret123',
        apiKey: 'sk-12345',
        data: 'normal data',
      };
      
      const result = redactObject(input);
      expect(result).toEqual({
        username: 'john',
        password: '[REDACTED]',
        apiKey: '[REDACTED]',
        data: 'normal data',
      });
    });

    it('redacts nested objects', () => {
      const input = {
        user: {
          id: 123,
          auth: {
            token: 'jwt.token.here',
            refreshToken: 'refresh.token.here',
          },
        },
        config: {
          apiUrl: 'https://api.example.com',
          secret: 'supersecret',
        },
      };
      
      const result = redactObject(input);
      expect(result).toEqual({
        user: {
          id: 123,
          auth: {
            token: '[REDACTED]',
            refreshToken: '[REDACTED]',
          },
        },
        config: {
          apiUrl: 'https://api.example.com',
          secret: '[REDACTED]',
        },
      });
    });

    it('redacts arrays', () => {
      const input = {
        tokens: ['token1', 'token2', 'token3'],
        users: [
          { name: 'John', password: 'pass1' },
          { name: 'Jane', password: 'pass2' },
        ],
      };
      
      const result = redactObject(input);
      expect(result).toEqual({
        tokens: ['token1', 'token2', 'token3'],
        users: [
          { name: 'John', password: '[REDACTED]' },
          { name: 'Jane', password: '[REDACTED]' },
        ],
      });
    });

    it('handles null and undefined', () => {
      const input = {
        nullValue: null,
        undefinedValue: undefined,
        password: null,
      };
      
      const result = redactObject(input);
      expect(result).toEqual({
        nullValue: null,
        undefinedValue: undefined,
        password: '[REDACTED]',
      });
    });

    it('prevents infinite recursion', () => {
      const circular: any = { data: 'test' };
      circular.self = circular;
      
      const result = redactObject(circular, 2);
      expect(result.data).toBe('test');
      expect(result.self.self).toBe('[MAX_DEPTH_REACHED]');
    });
  });

  describe('redactError', () => {
    it('redacts error message', () => {
      const error = new Error('Failed to authenticate with password: secret123');
      const result = redactError(error);
      
      expect(result.message).toBe('Failed to authenticate with [REDACTED]');
      expect(result.name).toBe('Error');
    });

    it('redacts error stack', () => {
      const error = new Error('Error');
      error.stack = 'Error: password=secret123\n    at test.js:10';
      
      const result = redactError(error);
      expect(result.stack).toContain('[REDACTED]');
      expect(result.stack).not.toContain('secret123');
    });

    it('redacts custom error properties', () => {
      const error: any = new Error('Failed');
      error.code = 'AUTH_FAILED';
      error.details = {
        username: 'john',
        password: 'secret',
        apiKey: 'key123',
      };
      
      const result = redactError(error) as any;
      expect(result.code).toBe('AUTH_FAILED');
      expect(result.details).toEqual({
        username: 'john',
        password: '[REDACTED]',
        apiKey: '[REDACTED]',
      });
    });
  });

  describe('redactHeaders', () => {
    it('redacts sensitive headers', () => {
      const headers = {
        'content-type': 'application/json',
        'authorization': 'Bearer token123',
        'x-api-key': 'secret-key',
        'user-agent': 'Mozilla/5.0',
      };
      
      const result = redactHeaders(headers);
      expect(result).toEqual({
        'content-type': 'application/json',
        'authorization': '[REDACTED]',
        'x-api-key': '[REDACTED]',
        'user-agent': 'Mozilla/5.0',
      });
    });

    it('handles case-insensitive headers', () => {
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer token123',
        'X-API-KEY': 'secret-key',
      };
      
      const result = redactHeaders(headers);
      expect(result['Authorization']).toBe('[REDACTED]');
      expect(result['X-API-KEY']).toBe('[REDACTED]');
    });

    it('preserves non-sensitive headers', () => {
      const headers = {
        'content-type': 'application/json',
        'accept': 'application/json',
        'cache-control': 'no-cache',
      };
      
      const result = redactHeaders(headers);
      expect(result).toEqual(headers);
    });
  });
});