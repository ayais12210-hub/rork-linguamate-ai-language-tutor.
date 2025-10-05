import { ZodError } from 'zod';

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
    Object.assign(this, params);
    this.name = 'AppError';
  }
}

// Type guards for common error shapes across the app
type JsonLike = { [k: string]: unknown; message?: string; code?: string; requestId?: string };

function isApiErrorLike(e: unknown): e is { status: number; code?: string; details?: unknown; message: string } {
  return typeof e === 'object' && e !== null &&
    typeof (e as any).status === 'number' && typeof (e as any).message === 'string';
}

function isFetchResponseLike(e: unknown): e is { ok: boolean; status: number; statusText: string } {
  return typeof e === 'object' && e !== null &&
    typeof (e as any).ok === 'boolean' && typeof (e as any).status === 'number';
}

function isTRPCLikeError(e: unknown): e is { data?: { code?: string; httpStatus?: number }; message: string } {
  return typeof e === 'object' && e !== null && typeof (e as any).message === 'string' && 'data' in (e as any);
}

function extractRequestId(from: unknown): string | undefined {
  if (!from || typeof from !== 'object') return undefined;
  const obj = from as JsonLike;
  if (typeof obj.requestId === 'string') return obj.requestId;
  if ('data' in obj && typeof (obj as any).data?.requestId === 'string') return (obj as any).data.requestId;
  return undefined;
}

export const toAppError = (e: unknown): AppError => {
  // Zod validation failures
  if (e instanceof ZodError) {
    return new AppError({
      kind: 'Validation',
      message: 'Invalid response shape',
      code: 'ZOD_PARSE_ERROR',
      details: e.flatten(),
    });
  }

  // Timeout/Abort
  if (typeof DOMException !== 'undefined' && e instanceof DOMException && e.name === 'AbortError') {
    return new AppError({ kind: 'Network', message: 'Network timeout', code: 'TIMEOUT', cause: e });
  }

  // Our ApiError or similar shape
  if (isApiErrorLike(e)) {
    const status = e.status;
    const kind: AppErrorKind = status === 401
      ? 'Auth'
      : status >= 500
        ? 'Server'
        : status >= 400
          ? 'Unexpected'
          : 'Unexpected';
    return new AppError({
      kind,
      message: e.message || 'Request failed',
      code: e.code,
      details: e.details,
      requestId: extractRequestId(e.details),
    });
  }

  // tRPC client error-like
  if (isTRPCLikeError(e)) {
    const http = (e as any).data?.httpStatus as number | undefined;
    const code = (e as any).data?.code as string | undefined;
    const kind: AppErrorKind = code === 'UNAUTHORIZED' || http === 401
      ? 'Auth'
      : http && http >= 500
        ? 'Server'
        : 'Unexpected';
    return new AppError({ kind, message: (e as any).message ?? 'Request failed', code });
  }

  // Fetch Response with non-ok status
  if (isFetchResponseLike(e) && !e.ok) {
    const kind: AppErrorKind = e.status === 401 ? 'Auth' : e.status >= 500 ? 'Server' : 'Unexpected';
    return new AppError({ kind, message: e.statusText || 'Request failed' });
  }

  // Generic network errors
  if (e instanceof Error && /network/i.test(e.message)) {
    return new AppError({ kind: 'Network', message: 'Network error', cause: e });
  }

  // Fallback
  const msg = e instanceof Error ? e.message : 'Unexpected error';
  return new AppError({ kind: 'Unexpected', message: msg, cause: e });
};

export function isAppError(e: unknown): e is AppError {
  return e instanceof AppError;
}
