// Unified error handling architecture with kind union pattern

export type AppErrorKind = 'Network' | 'Auth' | 'Validation' | 'Server' | 'Unexpected';

export interface AppErrorParams {
  kind: AppErrorKind;
  message: string;
  code?: string;
  details?: unknown;
  requestId?: string;
  cause?: unknown;
  userMessage?: string;
  isRecoverable?: boolean;
}

export class AppError extends Error {
  readonly kind: AppErrorKind;
  readonly code?: string;
  readonly details?: unknown;
  readonly requestId?: string;
  readonly cause?: unknown;
  readonly userMessage?: string;
  readonly isRecoverable: boolean;
  readonly timestamp: number;
  readonly errorId: string;

  constructor(params: AppErrorParams) {
    super(params.message);
    this.name = 'AppError';
    this.kind = params.kind;
    this.code = params.code;
    this.details = params.details;
    this.requestId = params.requestId;
    this.cause = params.cause;
    this.userMessage = params.userMessage;
    this.isRecoverable = params.isRecoverable ?? true;
    this.timestamp = Date.now();
    this.errorId = this.generateErrorId();

    // Preserve stack trace from cause if available
    if (params.cause instanceof Error) {
      this.stack = params.cause.stack;
    } else if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }

  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  toJSON(): Record<string, unknown> {
    return {
      errorId: this.errorId,
      name: this.name,
      kind: this.kind,
      code: this.code,
      message: this.message,
      userMessage: this.userMessage,
      details: this.details,
      requestId: this.requestId,
      isRecoverable: this.isRecoverable,
      timestamp: this.timestamp,
      stack: this.stack,
    };
  }

  getUserMessage(): string {
    return this.userMessage || this.getDefaultUserMessage();
  }

  private getDefaultUserMessage(): string {
    switch (this.kind) {
      case 'Network':
        return 'Can\'t reach server right now. Please check your connection.';
      case 'Auth':
        return 'Please sign in again to continue.';
      case 'Validation':
        return 'Please check your input and try again.';
      case 'Server':
        return 'Something went wrong on our end. Please try again later.';
      case 'Unexpected':
      default:
        return 'Something went wrong. Please try again.';
    }
  }
}

// Error normaliser to convert any error to AppError
export const toAppError = (error: unknown): AppError => {
  // Already an AppError
  if (error instanceof AppError) {
    return error;
  }

  // Standard Error object
  if (error instanceof Error) {
    // Network errors
    if (error.name === 'NetworkError' || 
        error.name === 'AbortError' ||
        error.message.toLowerCase().includes('network') ||
        error.message.toLowerCase().includes('fetch')) {
      return new AppError({
        kind: 'Network',
        message: error.message,
        cause: error,
      });
    }

    // Type errors often indicate validation issues
    if (error.name === 'TypeError' || error.name === 'ValidationError') {
      return new AppError({
        kind: 'Validation',
        message: error.message,
        cause: error,
      });
    }

    // Auth errors
    if (error.name === 'AuthenticationError' || 
        error.message.toLowerCase().includes('unauthorized') ||
        error.message.toLowerCase().includes('forbidden')) {
      return new AppError({
        kind: 'Auth',
        message: error.message,
        cause: error,
      });
    }

    // Default to unexpected
    return new AppError({
      kind: 'Unexpected',
      message: error.message,
      cause: error,
    });
  }

  // tRPC errors
  if (typeof error === 'object' && error !== null) {
    const obj = error as any;
    
    // Check for tRPC error shape
    if (obj.data?.code) {
      const code = obj.data.code;
      let kind: AppErrorKind = 'Server';
      
      if (code === 'UNAUTHORIZED' || code === 'FORBIDDEN') {
        kind = 'Auth';
      } else if (code === 'BAD_REQUEST' || code === 'PARSE_ERROR') {
        kind = 'Validation';
      } else if (code === 'TIMEOUT' || code === 'CLIENT_CLOSED_REQUEST') {
        kind = 'Network';
      }

      return new AppError({
        kind,
        message: obj.message || 'Server error',
        code: obj.data.code,
        details: obj.data,
        requestId: obj.data.requestId,
      });
    }

    // HTTP response errors
    if (obj.status !== undefined) {
      const status = obj.status;
      let kind: AppErrorKind = 'Server';
      
      if (status === 401 || status === 403) {
        kind = 'Auth';
      } else if (status === 400 || status === 422) {
        kind = 'Validation';
      } else if (status === 408 || status === 504 || status === 0) {
        kind = 'Network';
      }

      return new AppError({
        kind,
        message: obj.statusText || `HTTP ${status} error`,
        code: `HTTP_${status}`,
        details: { status, response: obj },
      });
    }

    // Zod validation errors
    if (obj.issues && Array.isArray(obj.issues)) {
      const issues = obj.issues.map((issue: any) => ({
        path: issue.path?.join('.'),
        message: issue.message,
      }));

      return new AppError({
        kind: 'Validation',
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: { issues },
        userMessage: issues[0]?.message || 'Please check your input',
      });
    }
  }

  // Fallback for unknown errors
  return new AppError({
    kind: 'Unexpected',
    message: String(error),
    details: { originalError: error },
  });
};

// Utility functions for creating specific error types
export const createNetworkError = (
  message: string,
  options?: Partial<AppErrorParams>
): AppError => {
  return new AppError({
    kind: 'Network',
    message,
    ...options,
  });
};

export const createAuthError = (
  message: string,
  options?: Partial<AppErrorParams>
): AppError => {
  return new AppError({
    kind: 'Auth',
    message,
    isRecoverable: false,
    ...options,
  });
};

export const createValidationError = (
  message: string,
  options?: Partial<AppErrorParams>
): AppError => {
  return new AppError({
    kind: 'Validation',
    message,
    ...options,
  });
};

export const createServerError = (
  message: string,
  options?: Partial<AppErrorParams>
): AppError => {
  return new AppError({
    kind: 'Server',
    message,
    ...options,
  });
};

export const createUnexpectedError = (
  message: string,
  options?: Partial<AppErrorParams>
): AppError => {
  return new AppError({
    kind: 'Unexpected',
    message,
    isRecoverable: false,
    ...options,
  });
};