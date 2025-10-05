import { z } from 'zod';
import { request as baseRequest, requestWithRetry as baseRequestWithRetry, ApiError } from '@/app/shared/services/api/client';
import { AppError, toAppError } from '@/lib/errors';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD';

const IdempotentMethods: ReadonlySet<HttpMethod> = new Set(['GET', 'HEAD']);

export async function fetchJson<T>(params: {
  url: string;
  method?: HttpMethod;
  schema: z.ZodType<T>;
  headers?: Record<string, string>;
  body?: unknown;
  timeoutMs?: number;
}): Promise<T> {
  const res = await baseRequest<T>({ ...params });
  if (!res.ok) throw toAppError(res.error ?? new ApiError('Unknown error', res.status));
  return res.data as T;
}

export async function fetchJsonWithRetry<T>(params: {
  url: string;
  method?: HttpMethod;
  schema: z.ZodType<T>;
  headers?: Record<string, string>;
  body?: unknown;
  timeoutMs?: number;
  retries?: number; // total attempts = retries + 1
  baseDelayMs?: number; // base for exponential backoff
}): Promise<T> {
  const retries = typeof params.retries === 'number' ? params.retries : 5;
  const baseDelayMs = params.baseDelayMs ?? 300;

  let attempt = 0;
  let lastError: AppError | undefined;
  const method = (params.method ?? 'GET') as HttpMethod;
  const isIdempotent = IdempotentMethods.has(method);

  while (attempt <= retries) {
    try {
      const res = await baseRequestWithRetry<T>({ ...params, retries: 0, backoffMs: baseDelayMs });
      if (!res.ok) throw toAppError(res.error ?? new ApiError('Unknown error', res.status));
      return res.data as T;
    } catch (e) {
      const appErr = toAppError(e);
      lastError = appErr;
      const shouldRetry =
        isIdempotent &&
        (appErr.kind === 'Network' || appErr.kind === 'Server');
      if (!shouldRetry || attempt === retries) throw appErr;
      const delay = jitter(exponentialBackoff(baseDelayMs, attempt));
      await sleep(delay);
      attempt++;
    }
  }

  throw lastError ?? new AppError({ kind: 'Unexpected', message: 'Unknown error' });
}

function exponentialBackoff(base: number, attempt: number): number {
  return base * Math.pow(2, attempt);
}

function jitter(ms: number): number {
  return Math.floor(Math.random() * ms);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
