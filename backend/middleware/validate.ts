import type { Context, Next } from 'hono';
import { z } from 'zod';
import { parseBody, parseQuery, parseParams, ValidationException } from '../validation/parser';
import { logger } from '../logging/pino';
import { ERROR_CODES } from '@/schemas/errors';
import { sanitiseDeep } from '@/backend/validation/sanitise';

export interface ValidationSchemas {
  body?: z.ZodTypeAny;
  query?: z.ZodTypeAny;
  params?: z.ZodTypeAny;
}

export function validateMiddleware(schemas: ValidationSchemas) {
  return async (c: Context, next: Next) => {
    try {
      if (schemas.body) {
        const raw = await c.req.json();
        const body = sanitiseDeep(raw);
        const validated = parseBody(schemas.body, body);
        c.set('validatedBody', validated);
      }

      if (schemas.query) {
        const rawQuery = c.req.query();
        const query = sanitiseDeep(rawQuery);
        const validated = parseQuery(schemas.query, query);
        c.set('validatedQuery', validated);
      }

      if (schemas.params) {
        const rawParams = c.req.param();
        const params = sanitiseDeep(rawParams);
        const validated = parseParams(schemas.params, params);
        c.set('validatedParams', validated);
      }

      await next();
    } catch (error) {
      if (error instanceof ValidationException) {
        logger.warn(
          {
            evt: ERROR_CODES.SEC_INPUT_VALIDATION_FAIL,
            cat: 'security',
            req: {
              method: c.req.method,
              path: c.req.path,
            },
            corr: {
              correlationId: c.get('correlationId'),
            },
            data: {
              error: error.validationError,
            },
          },
          'Input validation failed'
        );

        return c.status(error.statusCode).json({
          error: error.validationError,
        });
      }

      throw error;
    }
  };
}

export function getValidatedBody<T>(c: Context): T {
  return c.get('validatedBody') as T;
}

export function getValidatedQuery<T>(c: Context): T {
  return c.get('validatedQuery') as T;
}

export function getValidatedParams<T>(c: Context): T {
  return c.get('validatedParams') as T;
}
