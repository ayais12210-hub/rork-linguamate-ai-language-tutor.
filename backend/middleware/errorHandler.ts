import type { Context, Next } from 'hono';
import { z } from 'zod';

/**
 * Global error handler middleware for Hono
 * Catches all unhandled errors and returns consistent error responses
 */
export function errorHandler() {
  return async (c: Context, next: Next) => {
    try {
      await next();
    } catch (error) {
      // Handle Zod validation errors
      if (error instanceof z.ZodError) {
        c.status(400);
        return c.json({
          error: 'Validation Error',
          message: 'Invalid request data',
          details: error.errors.map((err) => ({
            path: err.path.join('.'),
            message: err.message,
            code: err.code,
          })),
        });
      }

      // Handle known API errors
      if (error instanceof Error) {
        // Check for specific error types
        if (error.name === 'UnauthorizedError') {
          c.status(401);
          return c.json({
            error: 'Unauthorized',
            message: error.message || 'Authentication required',
          });
        }

        if (error.name === 'ForbiddenError') {
          c.status(403);
          return c.json({
            error: 'Forbidden',
            message: error.message || 'Access denied',
          });
        }

        if (error.name === 'NotFoundError') {
          c.status(404);
          return c.json({
            error: 'Not Found',
            message: error.message || 'Resource not found',
          });
        }

        if (error.name === 'ConflictError') {
          c.status(409);
          return c.json({
            error: 'Conflict',
            message: error.message || 'Resource conflict',
          });
        }

        if (error.name === 'ValidationError') {
          c.status(422);
          return c.json({
            error: 'Validation Error',
            message: error.message || 'Invalid data provided',
          });
        }

        // Log unexpected errors (without console.error)
        const errorId = crypto.randomUUID();
        const errorDetails = {
          errorId,
          message: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString(),
        };

        // In production, you'd send this to a logging service
        // For now, we'll include minimal info in the response
        c.status(500);
        return c.json({
          error: 'Internal Server Error',
          message: 'An unexpected error occurred',
          errorId,
        });
      }

      // Handle non-Error objects
      c.status(500);
      return c.json({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
      });
    }
  };
}

/**
 * Custom error classes for consistent error handling
 */
export class ApiError extends Error {
  constructor(
    public name: string,
    public message: string,
    public statusCode: number = 500,
    public details?: unknown
  ) {
    super(message);
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = 'Authentication required') {
    super('UnauthorizedError', message, 401);
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = 'Access denied') {
    super('ForbiddenError', message, 403);
  }
}

export class NotFoundError extends ApiError {
  constructor(message = 'Resource not found') {
    super('NotFoundError', message, 404);
  }
}

export class ConflictError extends ApiError {
  constructor(message = 'Resource conflict') {
    super('ConflictError', message, 409);
  }
}

export class ValidationError extends ApiError {
  constructor(message = 'Invalid data provided', details?: unknown) {
    super('ValidationError', message, 422, details);
  }
}

/**
 * Async error wrapper for route handlers
 * Catches async errors and passes them to the error handler
 */
export function asyncHandler<T extends (...args: any[]) => Promise<any>>(fn: T): T {
  return (async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (error) {
      throw error;
    }
  }) as T;
}

/**
 * Error response helper
 */
export function errorResponse(c: Context, statusCode: number, message: string, details?: unknown) {
  c.status(statusCode);
  return c.json({
    error: getErrorName(statusCode),
    message,
    ...(details && { details }),
  });
}

/**
 * Get error name from status code
 */
function getErrorName(statusCode: number): string {
  const errorNames: Record<number, string> = {
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    409: 'Conflict',
    422: 'Unprocessable Entity',
    429: 'Too Many Requests',
    500: 'Internal Server Error',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
  };
  return errorNames[statusCode] || 'Error';
}