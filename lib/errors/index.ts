export * from './AppError';
export * from './result';

// Re-export the asAppError function as toAppError for backwards compatibility
import { AppError } from './AppError';

export function toAppError(e: unknown): AppError {
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