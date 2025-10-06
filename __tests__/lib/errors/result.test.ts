import { ok, err, isOk, isErr, unwrap, unwrapOr, map, andThen, wrapAsync, wrapSync } from '@/lib/errors/result';
import { createAppError } from '@/lib/errors/AppError';

describe('Result helpers', () => {
  describe('ok and err', () => {
    it('should create ok result', () => {
      const result = ok('success');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe('success');
      }
    });

    it('should create err result', () => {
      const error = createAppError('NetworkError', 'Connection failed');
      const result = err(error);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe(error);
      }
    });
  });

  describe('isOk and isErr', () => {
    it('should identify ok results', () => {
      const result = ok('test');
      expect(isOk(result)).toBe(true);
      expect(isErr(result)).toBe(false);
    });

    it('should identify err results', () => {
      const error = createAppError('ValidationError', 'Invalid input');
      const result = err(error);
      expect(isOk(result)).toBe(false);
      expect(isErr(result)).toBe(true);
    });
  });

  describe('unwrap', () => {
    it('should return value for ok result', () => {
      const result = ok('test');
      expect(unwrap(result)).toBe('test');
    });

    it('should throw for err result', () => {
      const error = createAppError('NetworkError', 'Connection failed');
      const result = err(error);
      expect(() => unwrap(result)).toThrow('Called unwrap on error result: Connection failed');
    });
  });

  describe('unwrapOr', () => {
    it('should return value for ok result', () => {
      const result = ok('test');
      expect(unwrapOr(result, 'default')).toBe('test');
    });

    it('should return default for err result', () => {
      const error = createAppError('NetworkError', 'Connection failed');
      const result = err(error);
      expect(unwrapOr(result, 'default')).toBe('default');
    });
  });

  describe('map', () => {
    it('should transform ok result', () => {
      const result = ok(5);
      const mapped = map(result, x => x * 2);
      expect(mapped.ok).toBe(true);
      if (mapped.ok) {
        expect(mapped.value).toBe(10);
      }
    });

    it('should preserve err result', () => {
      const error = createAppError('ValidationError', 'Invalid input');
      const result = err(error);
      const mapped = map(result, x => x * 2);
      expect(mapped.ok).toBe(false);
      if (!mapped.ok) {
        expect(mapped.error).toBe(error);
      }
    });
  });

  describe('andThen', () => {
    it('should chain ok results', () => {
      const result = ok(5);
      const chained = andThen(result, x => ok(x * 2));
      expect(chained.ok).toBe(true);
      if (chained.ok) {
        expect(chained.value).toBe(10);
      }
    });

    it('should chain err results', () => {
      const error = createAppError('NetworkError', 'Connection failed');
      const result = err(error);
      const chained = andThen(result, x => ok(x * 2));
      expect(chained.ok).toBe(false);
      if (!chained.ok) {
        expect(chained.error).toBe(error);
      }
    });

    it('should handle chained errors', () => {
      const result = ok(5);
      const error = createAppError('ValidationError', 'Invalid input');
      const chained = andThen(result, () => err(error));
      expect(chained.ok).toBe(false);
      if (!chained.ok) {
        expect(chained.error).toBe(error);
      }
    });
  });

  describe('wrapAsync', () => {
    it('should wrap successful async function', async () => {
      const result = await wrapAsync(async () => 'success');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe('success');
      }
    });

    it('should wrap failed async function', async () => {
      const result = await wrapAsync(async () => {
        throw new Error('Async error');
      });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toBe('Async error');
      }
    });
  });

  describe('wrapSync', () => {
    it('should wrap successful sync function', () => {
      const result = wrapSync(() => 'success');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe('success');
      }
    });

    it('should wrap failed sync function', () => {
      const result = wrapSync(() => {
        throw new Error('Sync error');
      });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toBe('Sync error');
      }
    });
  });
});