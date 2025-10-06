import React from 'react';
import { z } from 'zod';
import { Result, ok, err } from '@/lib/errors/result';
import { AppError, createAppError } from '@/lib/errors/AppError';

export interface FieldError {
  message: string;
  type: string;
  field?: string;
}

export interface FieldErrors {
  [key: string]: FieldError | undefined;
}

export interface ResolverResult<T> {
  values: T;
  errors: FieldErrors;
}

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: FieldErrors;
  appError?: AppError;
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
          field: path,
        };
      }
    });

    return {
      values: values as z.infer<T>,
      errors,
    };
  };
}

export function validateWithZod<T extends z.ZodType>(
  schema: T,
  data: unknown
): Result<z.infer<T>, AppError> {
  const result = schema.safeParse(data);

  if (result.success) {
    return ok(result.data);
  }

  const appError = createAppError(
    'ValidationError',
    'Form validation failed',
    {
      cause: result.error,
      context: {
        validationErrors: result.error.errors.map(issue => ({
          path: issue.path.join('.'),
          message: issue.message,
          code: issue.code,
        })),
      },
    }
  );

  return err(appError);
}

export function validateFormData<T extends z.ZodType>(
  schema: T,
  data: unknown
): ValidationResult<z.infer<T>> {
  const result = validateWithZod(schema, data);

  if (result.ok) {
    return {
      success: true,
      data: result.value,
    };
  }

  // Convert AppError to field errors
  const errors: FieldErrors = {};
  if (result.error.context?.validationErrors) {
    const validationErrors = result.error.context.validationErrors as Array<{
      path: string;
      message: string;
      code: string;
    }>;

    validationErrors.forEach(({ path, message, code }) => {
      if (path) {
        errors[path] = {
          message,
          type: code,
          field: path,
        };
      }
    });
  }

  return {
    success: false,
    errors,
    appError: result.error,
  };
}

// Hook for form validation with error handling
export function useFormValidation<T extends z.ZodType>(
  schema: T,
  initialValues: z.infer<T>
) {
  const [values, setValues] = React.useState(initialValues);
  const [errors, setErrors] = React.useState<FieldErrors>({});
  const [isValidating, setIsValidating] = React.useState(false);

  const validate = React.useCallback(async (): Promise<boolean> => {
    setIsValidating(true);
    const result = validateFormData(schema, values);
    
    if (result.success) {
      setErrors({});
      setIsValidating(false);
      return true;
    } else {
      setErrors(result.errors || {});
      setIsValidating(false);
      return false;
    }
  }, [schema, values]);

  const setValue = React.useCallback((field: string, value: unknown) => {
    setValues(prev => ({
      ...prev,
      [field]: value,
    }));
    
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors]);

  const setFieldError = React.useCallback((field: string, error: FieldError) => {
    setErrors(prev => ({
      ...prev,
      [field]: error,
    }));
  }, []);

  const clearErrors = React.useCallback(() => {
    setErrors({});
  }, []);

  const reset = React.useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setIsValidating(false);
  }, [initialValues]);

  return {
    values,
    errors,
    isValidating,
    validate,
    setValue,
    setFieldError,
    clearErrors,
    reset,
  };
}
