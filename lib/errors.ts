// Enhanced error handling system with standardised AppError types
// Follows the specification for Network, Auth, Validation, Server, Unexpected error kinds

import { Platform } from 'react-native';
import { z } from 'zod';

export type AppErrorKind = 'Network' | 'Auth' | 'Validation' | 'Server' | 'Unexpected';

export class AppError extends Error {
  kind: AppErrorKind;
  code?: string;
  details?: unknown;
  requestId?: string;
  cause?: unknown;
  timestamp: number;

  constructor(params: {
    kind: AppErrorKind;
    message: string;
    code?: string;
    details?: unknown;
    requestId?: string;
    cause?: unknown;
  }) {
    super(params.message);
    this.name = 'AppError';
    this.kind = params.kind;
    this.code = params.code;
    this.details = params.details;
    this.requestId = params.requestId;
    this.cause = params.cause;
    this.timestamp = Date.now();

    // Preserve stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }

  toJSON() {
    return {
      name: this.name,
      kind: this.kind,
      message: this.message,
      code: this.code,
      details: this.details,
      requestId: this.requestId,
      timestamp: this.timestamp,
      stack: this.stack,
      platform: Platform.OS,
    };
  }

  getUserMessage(): string {
    switch (this.kind) {
      case 'Network':
        return "Can't reach server right now. Please check your connection and try again.";
      case 'Auth':
        return 'Please sign in again to continue.';
      case 'Validation':
        return 'Please check your input and try again.';
      case 'Server':
        return 'Something went wrong on our end. Please try again in a moment.';
      case 'Unexpected':
      default:
        return 'Something unexpected happened. Please try again.';
    }
  }

  getTechnicalHint(): string {
    let hint = `${this.kind} error`;
    if (this.code) hint += ` (${this.code})`;
    if (this.requestId) hint += ` • Request ID: ${this.requestId}`;
    return hint;
  }
}

// Error normaliser that converts any error to AppError
export const toAppError = (e: unknown, requestId?: string): AppError => {
  // Already an AppError
  if (e instanceof AppError) {
    return e;
  }

  // Standard Error
  if (e instanceof Error) {
    // Network errors
    if (
      e.name === 'NetworkError' ||
      e.message.includes('fetch') ||
      e.message.includes('network') ||
      e.message.includes('timeout') ||
      e.message.includes('NETWORK_REQUEST_FAILED')
    ) {
      return new AppError({
        kind: 'Network',
        message: e.message,
        code: 'NETWORK_ERROR',
        requestId,
        cause: e,
      });
    }

    // Authentication errors
    if (
      e.name === 'AuthenticationError' ||
      e.message.includes('unauthorized') ||
      e.message.includes('authentication') ||
      e.message.includes('401')
    ) {
      return new AppError({
        kind: 'Auth',
        message: e.message,
        code: 'AUTH_ERROR',
        requestId,
        cause: e,
      });
    }

    // Validation errors (Zod)
    if (e.name === 'ZodError' || e instanceof z.ZodError) {
      const zodError = e as z.ZodError;
      return new AppError({
        kind: 'Validation',
        message: 'Invalid data format',
        code: 'VALIDATION_ERROR',
        details: zodError.errors,
        requestId,
        cause: e,
      });
    }

    // Type errors (likely programming errors)
    if (e.name === 'TypeError' || e.name === 'ReferenceError') {
      return new AppError({
        kind: 'Unexpected',
        message: e.message,
        code: 'TYPE_ERROR',
        requestId,
        cause: e,
      });
    }

    // Default to unexpected
    return new AppError({
      kind: 'Unexpected',
      message: e.message,
      code: 'UNKNOWN_ERROR',
      requestId,
      cause: e,
    });
  }

  // HTTP Response-like objects
  if (typeof e === 'object' && e !== null && 'status' in e) {
    const response = e as { status: number; statusText?: string; data?: any };
    
    if (response.status >= 400 && response.status < 500) {
      const kind: AppErrorKind = response.status === 401 || response.status === 403 ? 'Auth' : 'Validation';
      return new AppError({
        kind,
        message: response.statusText || `HTTP ${response.status}`,
        code: `HTTP_${response.status}`,
        details: response.data,
        requestId,
        cause: e,
      });
    }

    if (response.status >= 500) {
      return new AppError({
        kind: 'Server',
        message: response.statusText || `Server error ${response.status}`,
        code: `HTTP_${response.status}`,
        details: response.data,
        requestId,
        cause: e,
      });
    }
  }

  // tRPC errors
  if (typeof e === 'object' && e !== null && 'data' in e && 'code' in e) {
    const trpcError = e as { code: string; message: string; data?: any };
    
    let kind: AppErrorKind = 'Server';
    if (trpcError.code === 'UNAUTHORIZED') kind = 'Auth';
    else if (trpcError.code === 'BAD_REQUEST') kind = 'Validation';
    else if (trpcError.code === 'INTERNAL_SERVER_ERROR') kind = 'Server';

    return new AppError({
      kind,
      message: trpcError.message,
      code: trpcError.code,
      details: trpcError.data,
      requestId,
      cause: e,
    });
  }

  // String errors
  if (typeof e === 'string') {
    return new AppError({
      kind: 'Unexpected',
      message: e,
      code: 'STRING_ERROR',
      requestId,
      cause: e,
    });
  }

  // Unknown error type
  return new AppError({
    kind: 'Unexpected',
    message: 'An unknown error occurred',
    code: 'UNKNOWN_ERROR',
    details: e,
    requestId,
    cause: e,
  });
};

// Error factory functions for common scenarios
export const createNetworkError = (message: string, requestId?: string): AppError => {
  return new AppError({
    kind: 'Network',
    message,
    code: 'NETWORK_ERROR',
    requestId,
  });
};

export const createAuthError = (message: string, requestId?: string): AppError => {
  return new AppError({
    kind: 'Auth',
    message,
    code: 'AUTH_ERROR',
    requestId,
  });
};

export const createValidationError = (message: string, details?: unknown, requestId?: string): AppError => {
  return new AppError({
    kind: 'Validation',
    message,
    code: 'VALIDATION_ERROR',
    details,
    requestId,
  });
};

export const createServerError = (message: string, code?: string, requestId?: string): AppError => {
  return new AppError({
    kind: 'Server',
    message,
    code: code || 'SERVER_ERROR',
    requestId,
  });
};

export const createTimeoutError = (operation: string, timeout: number, requestId?: string): AppError => {
  return new AppError({
    kind: 'Network',
    message: `Operation '${operation}' timed out after ${timeout}ms`,
    code: 'TIMEOUT_ERROR',
    requestId,
  });
};

// Utility to check if error is retryable
export const isRetryableError = (error: AppError): boolean => {
  switch (error.kind) {
    case 'Network':
      return true;
    case 'Server':
      // Only retry 5xx errors, not 4xx
      return error.code?.startsWith('HTTP_5') ?? true;
    case 'Auth':
    case 'Validation':
    case 'Unexpected':
    default:
      return false;
  }
};

// Utility to get retry delay with exponential backoff
export const getRetryDelay = (attempt: number, baseDelay = 300): number => {
  // Exponential backoff with full jitter
  const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
  const maxDelay = 30000; // 30 seconds max
  const delay = Math.min(exponentialDelay, maxDelay);
  
  // Add full jitter (0 to delay)
  return Math.floor(Math.random() * delay);
};