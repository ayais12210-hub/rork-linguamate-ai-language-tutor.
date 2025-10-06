import { unwrap, Result, ok, err } from '@/lib/errors/result';

describe('Result unwrap improvements', () => {
  it('should handle errors without message property', () => {
    // Test with non-AppError error types
    const errorWithoutMessage = { code: 'ERROR', details: 'Something went wrong' };
    const result: Result<string, typeof errorWithoutMessage> = err(errorWithoutMessage);

    expect(() => unwrap(result)).toThrow('Called unwrap on error result: Unknown error');
  });

  it('should handle errors with message property', () => {
    const errorWithMessage = { message: 'Custom error message', code: 'ERROR' };
    const result: Result<string, typeof errorWithMessage> = err(errorWithMessage);

    expect(() => unwrap(result)).toThrow('Called unwrap on error result: Custom error message');
  });

  it('should handle null or undefined errors gracefully', () => {
    const nullResult = { ok: false, error: null } as any as Result<string, null>;
    const undefinedResult = { ok: false, error: undefined } as any as Result<string, undefined>;

    expect(() => unwrap(nullResult)).toThrow('Called unwrap on error result: Unknown error');
    expect(() => unwrap(undefinedResult)).toThrow('Called unwrap on error result: Unknown error');
  });

  it('should handle non-object errors', () => {
    const stringError: Result<string, string> = err('String error');
    const numberError: Result<string, number> = err(42);
    const booleanError: Result<string, boolean> = err(false);

    expect(() => unwrap(stringError)).toThrow('Called unwrap on error result: Unknown error');
    expect(() => unwrap(numberError)).toThrow('Called unwrap on error result: Unknown error');
    expect(() => unwrap(booleanError)).toThrow('Called unwrap on error result: Unknown error');
  });

  it('should successfully unwrap ok results', () => {
    const result = ok('success');
    expect(unwrap(result)).toBe('success');
  });
});