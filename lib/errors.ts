import { ZodError } from 'zod';
import type { TRPCClientErrorLike } from '@trpc/client';
import type { AppRouter } from '@/backend/trpc/app-router';
import { ApiError } from '@/app/shared/services/api/client';

export type AppErrorKind = 'Network' | 'Auth' | 'Validation' | 'Server' | 'Unexpected';

export class AppError extends Error {
  kind: AppErrorKind;
  code?: string;
  details?: unknown;
  requestId?: string;
  cause?: unknown;

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
  }
}

export const toAppError = (e: unknown): AppError => {
  // ApiError from our HTTP client
  if (e instanceof ApiError) {
    const status = e.status;
    const isTimeout = status === 499;
    const isNetwork = status === 0 || isTimeout;
    const isValidation = e.code === 'ZOD_PARSE_ERROR';
    const isAuth = status === 401 || status === 403;
    const kind: AppErrorKind = isValidation
      ? 'Validation'
      : isAuth
      ? 'Auth'
      : isNetwork
      ? 'Network'
      : status >= 500
      ? 'Server'
      : 'Unexpected';
    const requestId = (e.details as any)?.requestId ?? (e.details as any)?.headers?.['x-request-id'];
    return new AppError({ kind, message: e.message, code: e.code, details: e.details, requestId, cause: e });
  }

  // Zod error
  if (e instanceof ZodError) {
    return new AppError({ kind: 'Validation', message: 'Invalid data received', code: 'ZOD_ERROR', details: e.flatten(), cause: e });
  }

  // TRPC client error (best-effort shape check to avoid hard dependency)
  const maybeTrpc = e as TRPCClientErrorLike<AppRouter> | any;
  if (
    maybeTrpc &&
    typeof maybeTrpc === 'object' &&
    'data' in maybeTrpc &&
    maybeTrpc.data &&
    typeof maybeTrpc.data === 'object' &&
    'code' in maybeTrpc.data
  ) {
    const code: string | undefined = (maybeTrpc.data as any).code;
    const message: string = (maybeTrpc.data as any).message || (maybeTrpc as any).message || 'Request failed';
    const requestId: string | undefined = (maybeTrpc.data as any).requestId;
    const kind: AppErrorKind =
      code === 'UNAUTHORIZED' || code === 'FORBIDDEN'
        ? 'Auth'
        : code === 'BAD_REQUEST' || code === 'PARSE_ERROR'
        ? 'Validation'
        : code === 'TIMEOUT'
        ? 'Network'
        : code === 'INTERNAL_SERVER_ERROR'
        ? 'Server'
        : 'Server';
    return new AppError({ kind, message, code, details: maybeTrpc.data, requestId, cause: e });
  }

  // AbortError (timeout)
  if (typeof e === 'object' && e && 'name' in e && (e as any).name === 'AbortError') {
    return new AppError({ kind: 'Network', message: 'Request timed out', code: 'TIMEOUT', cause: e });
  }

  // Generic error
  if (e instanceof Error) {
    return new AppError({ kind: 'Unexpected', message: e.message, cause: e });
  }

  return new AppError({ kind: 'Unexpected', message: 'Unknown error', details: e });
};

export const isAppError = (e: unknown): e is AppError => e instanceof AppError;
