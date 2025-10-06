import type { Context, Next } from 'hono';
import { logger } from '../logging/pino';
import { ERROR_CODES } from '@/schemas/errors';

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    timestamp: string;
    requestId?: string;
  };
}

/**
 * Centralized error handling middleware for Hono
 * Handles all unhandled errors and provides consistent error responses
 */
export async function errorHandlerMiddleware(c: Context, next: Next) {
  try {
    await next();
  } catch (error) {
    const requestId = c.get('correlationId') || 'unknown';
    const timestamp = new Date().toISOString();
    
    // Log the error
    logger.error({
      evt: ERROR_CODES.VALIDATION_ERROR,
      cat: 'error',
      req: {
        method: c.req.method,
        path: c.req.path,
        url: c.req.url,
      },
      corr: {
        correlationId: requestId,
      },
      err: {
        name: error instanceof Error ? error.name : 'UnknownError',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
    }, 'Unhandled error in request');

    // Determine error response based on error type
    let statusCode = 500;
    let errorCode = 'INTERNAL_SERVER_ERROR';
    let message = 'An internal server error occurred';

    if (error instanceof Error) {
      // Handle specific error types
      if (error.name === 'ValidationException') {
        statusCode = 400;
        errorCode = 'VALIDATION_ERROR';
        message = error.message;
      } else if (error.name === 'UnauthorizedError') {
        statusCode = 401;
        errorCode = 'UNAUTHORIZED';
        message = 'Authentication required';
      } else if (error.name === 'ForbiddenError') {
        statusCode = 403;
        errorCode = 'FORBIDDEN';
        message = 'Access denied';
      } else if (error.name === 'NotFoundError') {
        statusCode = 404;
        errorCode = 'NOT_FOUND';
        message = 'Resource not found';
      } else if (error.name === 'ConflictError') {
        statusCode = 409;
        errorCode = 'CONFLICT';
        message = 'Resource conflict';
      } else if (error.name === 'RateLimitError') {
        statusCode = 429;
        errorCode = 'RATE_LIMIT_EXCEEDED';
        message = 'Rate limit exceeded';
      } else if (error.name === 'TimeoutError') {
        statusCode = 408;
        errorCode = 'REQUEST_TIMEOUT';
        message = 'Request timeout';
      } else if (error.message.includes('JWT_SECRET')) {
        statusCode = 500;
        errorCode = 'CONFIGURATION_ERROR';
        message = 'Server configuration error';
      } else if (error.message.includes('timeout')) {
        statusCode = 408;
        errorCode = 'REQUEST_TIMEOUT';
        message = 'Request timeout';
      }
    }

    // Don't expose internal errors in production
    if (process.env.NODE_ENV === 'production' && statusCode === 500) {
      message = 'An internal server error occurred';
    }

    const errorResponse: ErrorResponse = {
      error: {
        code: errorCode,
        message,
        timestamp,
        requestId,
      },
    };

    return c.json(errorResponse, statusCode);
  }
}

/**
 * Create a standardized error for throwing in procedures
 */
export function createError(
  code: string,
  message: string,
  statusCode: number = 400
): Error {
  const error = new Error(message);
  error.name = code;
  (error as any).statusCode = statusCode;
  return error;
}

/**
 * Handle external API errors with retry logic
 */
export async function handleExternalApiError(
  error: unknown,
  context: string,
  retryCount: number = 0
): Promise<never> {
  const isRetryable = retryCount < 3;
  const isTimeout = error instanceof Error && error.message.includes('timeout');
  const isNetworkError = error instanceof Error && (
    error.message.includes('fetch') ||
    error.message.includes('network') ||
    error.message.includes('ECONNREFUSED')
  );

  logger.error({
    evt: 'EXTERNAL_API_ERROR',
    cat: 'external_api',
    context,
    retryCount,
    isRetryable,
    err: {
      name: error instanceof Error ? error.name : 'UnknownError',
      message: error instanceof Error ? error.message : String(error),
    },
  }, `External API error in ${context}`);

  if (isRetryable && (isTimeout || isNetworkError)) {
    // Wait before retry (exponential backoff)
    const delay = Math.min(1000 * Math.pow(2, retryCount), 10000);
    await new Promise(resolve => setTimeout(resolve, delay));
    
    throw createError(
      'EXTERNAL_API_RETRY',
      `External API temporarily unavailable, retrying... (attempt ${retryCount + 1})`,
      503
    );
  }

  throw createError(
    'EXTERNAL_API_ERROR',
    `External API error in ${context}`,
    502
  );
}