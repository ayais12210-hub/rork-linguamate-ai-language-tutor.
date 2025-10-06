import { AppError } from './AppError';

export type Result<T, E = AppError> = 
  | { ok: true; value: T }
  | { ok: false; error: E };

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });

export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });

export const isOk = <T, E>(result: Result<T, E>): result is { ok: true; value: T } => {
  return result.ok;
};

export const isErr = <T, E>(result: Result<T, E>): result is { ok: false; error: E } => {
  return !result.ok;
};

export const unwrap = <T, E>(result: Result<T, E>): T => {
  if (result.ok) {
    return result.value;
  }
  const errorMessage = result.error && typeof result.error === 'object' && 'message' in result.error
    ? String(result.error.message)
    : 'Unknown error';
  throw new Error(`Called unwrap on error result: ${errorMessage}`);
};

export const unwrapOr = <T, E>(result: Result<T, E>, defaultValue: T): T => {
  return result.ok ? result.value : defaultValue;
};

export const unwrapOrElse = <T, E>(result: Result<T, E>, fn: (error: E) => T): T => {
  return result.ok ? result.value : fn(result.error);
};

export const map = <T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> => {
  return result.ok ? ok(fn(result.value)) : result;
};

export const mapErr = <T, E, F>(result: Result<T, E>, fn: (error: E) => F): Result<T, F> => {
  return result.ok ? result : err(fn(result.error));
};

export const andThen = <T, U, E>(result: Result<T, E>, fn: (value: T) => Result<U, E>): Result<U, E> => {
  return result.ok ? fn(result.value) : result;
};

export const orElse = <T, E, F>(result: Result<T, E>, fn: (error: E) => Result<T, F>): Result<T, F> => {
  return result.ok ? result : fn(result.error);
};

// Async wrappers
export const wrapAsync = async <T>(fn: () => Promise<T>): Promise<Result<T>> => {
  try {
    const value = await fn();
    return ok(value);
  } catch (e) {
    return err(asAppError(e));
  }
};

export const wrapSync = <T>(fn: () => T): Result<T> => {
  try {
    const value = fn();
    return ok(value);
  } catch (e) {
    return err(asAppError(e));
  }
};

// Helper to convert unknown error to AppError
function asAppError(e: unknown): AppError {
  if (e && typeof e === 'object' && 'code' in e && 'message' in e) {
    return e as AppError;
  }
  
  if (e instanceof Error) {
    return {
      code: 'UnknownError',
      message: e.message,
      cause: e,
      retryable: false,
      errorId: `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };
  }
  
  return {
    code: 'UnknownError',
    message: 'Unexpected error',
    cause: e,
    retryable: false,
    errorId: `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
  };
}

// Utility to handle multiple results
export const all = <T, E>(results: Result<T, E>[]): Result<T[], E> => {
  const values: T[] = [];
  for (const result of results) {
    if (!result.ok) {
      return result;
    }
    values.push(result.value);
  }
  return ok(values);
};

export const any = <T, E>(results: Result<T, E>[]): Result<T, E[]> => {
  const errors: E[] = [];
  for (const result of results) {
    if (result.ok) {
      return result;
    }
    errors.push(result.error);
  }
  return err(errors);
};