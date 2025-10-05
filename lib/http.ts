import { ZodType, ZodError } from 'zod';
import { AppError, toAppError } from '@/lib/errors';
import { log } from '@/lib/log';

export type HttpMethod = 'GET' | 'HEAD' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

const DEFAULT_TIMEOUT_MS = 15000;
const MAX_RETRIES = 5;
const BASE_BACKOFF_MS = 300;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function withTimeout(signal: AbortSignal | undefined, ms: number): AbortSignal {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  if (signal) signal.addEventListener('abort', () => controller.abort());
  controller.signal.addEventListener('abort', () => clearTimeout(id));
  return controller.signal;
}

function isIdempotent(method: HttpMethod | undefined) {
  return method === 'GET' || method === 'HEAD';
}

function fullJitterDelay(base: number, attempt: number) {
  const cap = base * Math.pow(2, attempt);
  return Math.floor(Math.random() * cap);
}

export interface RequestParams<T> {
  url: string;
  method?: HttpMethod;
  headers?: Record<string, string>;
  body?: unknown;
  schema: ZodType<T>;
  timeoutMs?: number;
  signal?: AbortSignal;
}

export async function httpRequest<T>(params: RequestParams<T>): Promise<T> {
  const { url, method = 'GET', headers, body, schema, timeoutMs, signal } = params;
  const sig = withTimeout(signal, timeoutMs ?? DEFAULT_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', ...(headers ?? {}) },
      body: body == null ? undefined : JSON.stringify(body),
      signal: sig,
    });

    const requestId = res.headers.get('x-request-id') ?? undefined;
    const text = await res.text();
    const data = text ? JSON.parse(text) : undefined;

    if (!res.ok) {
      throw new AppError({ kind: res.status === 401 ? 'Auth' : res.status >= 500 ? 'Server' : 'Unexpected', message: data?.message || res.statusText || 'Request failed', code: (data?.code as string | undefined), details: data, requestId });
    }

    const parsed = schema.safeParse(data);
    if (!parsed.success) {
      throw new ZodError(parsed.error.issues);
    }

    return parsed.data;
  } catch (e) {
    throw toAppError(e);
  }
}

export async function httpRequestWithRetry<T>(params: RequestParams<T>): Promise<T> {
  const method = params.method ?? 'GET';
  const retryable = isIdempotent(method);
  let lastError: AppError | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await httpRequest<T>(params);
    } catch (e) {
      const err = toAppError(e);
      lastError = err;

      const shouldRetry = retryable && (err.kind === 'Network' || err.kind === 'Server');
      if (!shouldRetry || attempt === MAX_RETRIES) {
        log.error('http', 'request failed', { url: params.url, code: err.code, kind: err.kind });
        throw err;
      }

      const delay = fullJitterDelay(BASE_BACKOFF_MS, attempt);
      await sleep(delay);
    }
  }

  throw lastError ?? new AppError({ kind: 'Unexpected', message: 'Unknown error' });
}
