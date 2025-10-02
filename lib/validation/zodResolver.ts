import { z } from 'zod';

export interface FieldError {
  message: string;
  type: string;
}

export interface FieldErrors {
  [key: string]: FieldError | undefined;
}

export interface ResolverResult<T> {
  values: T;
  errors: FieldErrors;
}

export function zodResolver<T extends z.ZodType>(
  schema: T
): (values: unknown) => ResolverResult<z.infer<T>> {
  return (values: unknown) => {
    const result = schema.safeParse(values);

    if (result.success) {
      return {
        values: result.data,
        errors: {},
      };
    }

    const errors: FieldErrors = {};

    result.error.issues.forEach((issue) => {
      const path = issue.path.join('.');
      if (path) {
        errors[path] = {
          message: issue.message,
          type: issue.code,
        };
      }
    });

    return {
      values: values as z.infer<T>,
      errors,
    };
  };
}
