import type { Context, Next } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { logger } from '../logging/pino';
import { redactError, redactObject } from '../utils/log-redactor';

export interface SafeErrorResponse {
  error: string;
  code: string;
  timestamp: string;
  correlationId?: string;
  details?: any;
}

/**
 * Global error handler middleware
 */
export async function errorHandlerMiddleware(c: Context, next: Next) {
  try {
    await next();
  } catch (error) {
    const correlationId = c.get('correlationId');
    const timestamp = new Date().toISOString();
    
    // Log the error with redaction
    const redactedError = error instanceof Error ? redactError(error) : redactObject(error);
    logger.error({
      evt: 'unhandled_error',
      cat: 'error',
      error: redactedError,
      corr: { correlationId },
      req: {
        method: c.req.method,
        path: c.req.path,
        userAgent: c.req.header('user-agent'),
        ip: c.req.header('x-forwarded-for') || c.req.header('x-real-ip')
      }
    }, 'Unhandled error in request');

    // Handle different error types
    if (error instanceof HTTPException) {
      return c.json(createSafeErrorResponse(
        error.message,
        `HTTP_${error.status}`,
        timestamp,
        correlationId,
        error.status
      ), error.status as any);
    }

    if (error instanceof Error) {
      // Map common error types to safe responses
      const safeResponse = mapErrorToSafeResponse(error, timestamp, correlationId);
      return c.json(safeResponse.body, safeResponse.status);
    }

    // Fallback for unknown errors
    return c.json(createSafeErrorResponse(
      'An unexpected error occurred',
      'INTERNAL_ERROR',
      timestamp,
      correlationId
    ), 500);
  }
}

/**
 * Create a safe error response that doesn't leak sensitive information
 */
function createSafeErrorResponse(
  message: string,
  code: string,
  timestamp: string,
  correlationId?: string,
  status: number = 500
): SafeErrorResponse {
  const response: SafeErrorResponse = {
    error: message,
    code,
    timestamp,
  };

  if (correlationId) {
    response.correlationId = correlationId;
  }

  // Only include details in development
  if (process.env.NODE_ENV === 'development' && status >= 500) {
    response.details = 'Check server logs for more information';
  }

  return response;
}

/**
 * Map different error types to safe responses
 */
function mapErrorToSafeResponse(error: Error, timestamp: string, correlationId?: string): { body: SafeErrorResponse; status: number } {
  // Validation errors
  if (error.name === 'ValidationException' || error.message.includes('validation')) {
    return {
      body: createSafeErrorResponse(
        'Invalid input provided',
        'VALIDATION_ERROR',
        timestamp,
        correlationId,
        400
      ),
      status: 400
    };
  }

  // Authentication errors
  if (error.message.includes('unauthorized') || error.message.includes('authentication')) {
    return {
      body: createSafeErrorResponse(
        'Authentication required',
        'UNAUTHORIZED',
        timestamp,
        correlationId,
        401
      ),
      status: 401
    };
  }

  // Authorization errors
  if (error.message.includes('forbidden') || error.message.includes('permission')) {
    return {
      body: createSafeErrorResponse(
        'Insufficient permissions',
        'FORBIDDEN',
        timestamp,
        correlationId,
        403
      ),
      status: 403
    };
  }

  // Not found errors
  if (error.message.includes('not found')) {
    return {
      body: createSafeErrorResponse(
        'Resource not found',
        'NOT_FOUND',
        timestamp,
        correlationId,
        404
      ),
      status: 404
    };
  }

  // Rate limiting errors
  if (error.message.includes('rate limit') || error.message.includes('too many requests')) {
    return {
      body: createSafeErrorResponse(
        'Too many requests. Please try again later.',
        'RATE_LIMITED',
        timestamp,
        correlationId,
        429
      ),
      status: 429
    };
  }

  // Timeout errors
  if (error.message.includes('timeout') || error.name === 'TimeoutError') {
    return {
      body: createSafeErrorResponse(
        'Request timeout. Please try again.',
        'TIMEOUT',
        timestamp,
        correlationId,
        408
      ),
      status: 408
    };
  }

  // Network/external service errors
  if (error.message.includes('fetch') || error.message.includes('network')) {
    return {
      body: createSafeErrorResponse(
        'Service temporarily unavailable',
        'SERVICE_UNAVAILABLE',
        timestamp,
        correlationId,
        503
      ),
      status: 503
    };
  }

  // Default server error
  return {
    body: createSafeErrorResponse(
      'Internal server error',
      'INTERNAL_ERROR',
      timestamp,
      correlationId,
      500
    ),
    status: 500
  };
}

/**
 * Handle async errors in middleware
 */
export function asyncHandler(fn: (c: Context, next: Next) => Promise<any>) {
  return async (c: Context, next: Next) => {
    try {
      return await fn(c, next);
    } catch (error) {
      throw error; // Let the error handler middleware handle it
    }
  };
}