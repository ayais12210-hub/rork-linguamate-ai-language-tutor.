import { z } from 'zod';
import { ERROR_CODES, createValidationError, type ValidationError } from '@/schemas/errors';

export class ValidationException extends Error {
  public readonly statusCode: number;
  public readonly validationError: ValidationError;

  constructor(validationError: ValidationError, statusCode: number = 400) {
    super(validationError.message);
    this.name = 'ValidationException';
    this.statusCode = statusCode;
    this.validationError = validationError;
  }
}

export function validate<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown,
  context?: string
): z.infer<T> {
  const result = schema.safeParse(data);

  if (!result.success) {
    const details = result.error.issues.map((issue) => ({
      path: issue.path.join('.'),
      code: issue.code,
    }));

    const firstIssue = result.error.issues[0];
    const field = firstIssue.path.join('.');
    const message = firstIssue.message;

    const validationError = createValidationError(
      ERROR_CODES.VALIDATION_ERROR,
      context ? `${context}: ${message}` : message,
      field,
      details
    );

    throw new ValidationException(validationError);
  }

  return result.data;
}

export function parseBody<T extends z.ZodTypeAny>(
  schema: T,
  body: unknown
): z.infer<T> {
  return validate(schema, body, 'Request body validation failed');
}

export function parseQuery<T extends z.ZodTypeAny>(
  schema: T,
  query: unknown
): z.infer<T> {
  return validate(schema, query, 'Query parameters validation failed');
}

export function parseParams<T extends z.ZodTypeAny>(
  schema: T,
  params: unknown
): z.infer<T> {
  return validate(schema, params, 'Path parameters validation failed');
}

export function parseHeaders<T extends z.ZodTypeAny>(
  schema: T,
  headers: unknown
): z.infer<T> {
  return validate(schema, headers, 'Headers validation failed');
}
