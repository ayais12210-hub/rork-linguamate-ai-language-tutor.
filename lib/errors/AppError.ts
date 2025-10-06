export type AppErrorCode =
  | 'NetworkError'
  | 'TimeoutError'
  | 'ValidationError'
  | 'AuthError'
  | 'UnknownError'
  | 'StorageError'
  | 'PermissionError'
  | 'OfflineError';

export interface AppError {
  code: AppErrorCode;
  message: string;
  cause?: unknown;
  hint?: string;
  retryable?: boolean;
  errorId?: string;
  timestamp?: number;
  context?: Record<string, unknown>;
}

export const createAppError = (
  code: AppErrorCode,
  message: string,
  options: {
    cause?: unknown;
    hint?: string;
    retryable?: boolean;
    context?: Record<string, unknown>;
  } = {}
): AppError => ({
  code,
  message,
  cause: options.cause,
  hint: options.hint,
  retryable: options.retryable ?? false,
  errorId: generateErrorId(),
  timestamp: Date.now(),
  context: options.context,
});

export const asAppError = (e: unknown, fallback: AppErrorCode = 'UnknownError'): AppError => {
  if (e && typeof e === 'object' && 'code' in e && 'message' in e) {
    return e as AppError;
  }
  
  if (e instanceof Error) {
    return createAppError(fallback, e.message, { cause: e });
  }
  
  return createAppError(fallback, 'Unexpected error', { cause: e });
};

export const isRetryableError = (error: AppError): boolean => {
  return error.retryable ?? false;
};

export const isNetworkError = (error: AppError): boolean => {
  return error.code === 'NetworkError' || error.code === 'TimeoutError' || error.code === 'OfflineError';
};

export const isValidationError = (error: AppError): boolean => {
  return error.code === 'ValidationError';
};

export const isAuthError = (error: AppError): boolean => {
  return error.code === 'AuthError';
};

// Helper to generate unique error IDs
function generateErrorId(): string {
  return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Error severity levels
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

export const getErrorSeverity = (error: AppError): ErrorSeverity => {
  switch (error.code) {
    case 'AuthError':
      return 'high';
    case 'StorageError':
      return 'medium';
    case 'NetworkError':
    case 'TimeoutError':
      return 'low';
    case 'ValidationError':
      return 'low';
    case 'PermissionError':
      return 'medium';
    case 'OfflineError':
      return 'low';
    case 'UnknownError':
    default:
      return 'high';
  }
};

// User-friendly error messages
export const getUserFriendlyMessage = (error: AppError): string => {
  switch (error.code) {
    case 'NetworkError':
      return 'Connection issue—check internet or try again.';
    case 'TimeoutError':
      return 'Request timed out—please try again.';
    case 'ValidationError':
      return 'Some inputs don\'t look right—fix the highlighted fields.';
    case 'AuthError':
      return 'Session expired—please sign in again.';
    case 'StorageError':
      return 'Storage issue—please try again or restart the app.';
    case 'PermissionError':
      return 'Permission required—please enable in settings.';
    case 'OfflineError':
      return 'You\'re offline—some features may be limited.';
    case 'UnknownError':
    default:
      return 'Something went wrong—please try again.';
  }
};