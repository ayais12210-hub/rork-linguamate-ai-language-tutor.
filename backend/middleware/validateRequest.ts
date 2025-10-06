import type { Context, Next } from 'hono';
import { z, ZodError, type ZodSchema } from 'zod';

/**
 * Validation middleware factory for Hono routes
 * Validates request body, query params, or form data against a Zod schema
 */
export function validateRequest<T extends ZodSchema>(
  schema: T,
  source: 'body' | 'query' | 'params' = 'body'
) {
  return async (c: Context, next: Next) => {
    try {
      let data: unknown;

      switch (source) {
        case 'body':
          data = await c.req.json();
          break;
        case 'query':
          data = c.req.query();
          break;
        case 'params':
          data = c.req.param();
          break;
        default:
          throw new Error(`Invalid source: ${source}`);
      }

      const validated = schema.parse(data);
      
      // Store validated data in context for use in route handler
      c.set('validatedData', validated);
      
      await next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map((err) => ({
          path: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));

        c.status(400);
        return c.json({
          message: 'Validation failed',
          errors: formattedErrors,
        });
      }

      // Re-throw non-validation errors
      throw error;
    }
  };
}

/**
 * Validation middleware for multipart/form-data requests
 * Validates form data fields against a Zod schema
 */
export function validateFormData<T extends ZodSchema>(
  schema: T,
  options?: {
    maxFileSize?: number;
    allowedMimeTypes?: string[];
  }
) {
  return async (c: Context, next: Next) => {
    try {
      const contentType = c.req.header('content-type') ?? '';
      
      if (!contentType.includes('multipart/form-data')) {
        c.status(400);
        return c.json({
          message: 'Expected multipart/form-data content type',
          receivedContentType: contentType,
        });
      }

      const formData = await c.req.formData();
      
      // Convert FormData to plain object for validation
      const formObject: Record<string, unknown> = {};
      
      for (const [key, value] of formData.entries()) {
        // Handle File/Blob objects
        if (value instanceof File || value instanceof Blob) {
          // Validate file size if specified
          if (options?.maxFileSize && value.size > options.maxFileSize) {
            c.status(413);
            return c.json({
              message: `File '${key}' exceeds maximum size of ${options.maxFileSize} bytes`,
              field: key,
              receivedSize: value.size,
              maxSize: options.maxFileSize,
            });
          }

          // Validate MIME type if specified
          if (options?.allowedMimeTypes && value instanceof File) {
            if (!options.allowedMimeTypes.includes(value.type)) {
              c.status(400);
              return c.json({
                message: `File '${key}' has invalid MIME type`,
                field: key,
                receivedType: value.type,
                allowedTypes: options.allowedMimeTypes,
              });
            }
          }

          formObject[key] = value;
        } else {
          formObject[key] = value;
        }
      }

      const validated = schema.parse(formObject);
      
      // Store validated data in context
      c.set('validatedData', validated);
      
      await next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map((err) => ({
          path: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));

        c.status(400);
        return c.json({
          message: 'Form data validation failed',
          errors: formattedErrors,
        });
      }

      // Re-throw non-validation errors
      throw error;
    }
  };
}

/**
 * Helper to get validated data from context
 * Use this in route handlers to access the validated data
 */
export function getValidatedData<T>(c: Context): T {
  const data = c.get('validatedData');
  if (!data) {
    throw new Error('No validated data found. Did you use validateRequest middleware?');
  }
  return data as T;
}

/**
 * Common validation schemas for reuse
 */
export const CommonSchemas = {
  /**
   * Pagination query parameters
   */
  pagination: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    offset: z.coerce.number().int().min(0).optional(),
  }),

  /**
   * Sorting parameters
   */
  sorting: z.object({
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).default('asc'),
  }),

  /**
   * Search parameters
   */
  search: z.object({
    q: z.string().min(1).max(256).optional(),
    query: z.string().min(1).max(256).optional(),
  }),

  /**
   * ID parameter (UUID format)
   */
  id: z.object({
    id: z.string().uuid(),
  }),

  /**
   * Language parameter (BCP47 format)
   */
  language: z.object({
    language: z.string().regex(/^[a-z]{2,3}(-[A-Z]{2})?$/),
  }),

  /**
   * Date range parameters
   */
  dateRange: z.object({
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
  }).refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return data.startDate <= data.endDate;
      }
      return true;
    },
    { message: 'startDate must be before or equal to endDate' }
  ),
};

/**
 * Type helper to infer validated data type from schema
 */
export type ValidatedData<T extends ZodSchema> = z.infer<T>;
