import { z } from 'zod';
import { QueryKey, UseQueryOptions, useQuery } from '@tanstack/react-query';
import { Platform } from 'react-native';
import { trpc, trpcClient } from '@/lib/trpc';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type ApiResult<T> = {
  ok: boolean;
  data?: T;
  error?: ApiError;
  status: number;
};

export class ApiError extends Error {
  status: number;
  code?: string;
  details?: unknown;
  constructor(message: string, status: number, code?: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const DefaultTimeoutMs = 15000;

export function withTimeout(signal: AbortSignal | undefined, ms: number): AbortSignal {
  const controller = new AbortController();
  const outer = signal;
  const id = setTimeout(() => controller.abort(), ms);
  if (outer) outer.addEventListener('abort', () => controller.abort());
  controller.signal.addEventListener('abort', () => clearTimeout(id));
  return controller.signal;
}

export async function request<T>(params: {
  url: string;
  method?: HttpMethod;
  schema: z.ZodType<T>;
  headers?: Record<string, string>;
  body?: unknown;
  signal?: AbortSignal;
  timeoutMs?: number;
}): Promise<ApiResult<T>> {
  const res = await requestRaw({
    url: params.url,
    method: params.method,
    headers: params.headers,
    body: params.body,
    signal: params.signal,
    timeoutMs: params.timeoutMs,
  });
  if (!res.ok) return { ok: false, status: res.status, error: res.error };
  const parsed = params.schema.safeParse(res.data);
  if (!parsed.success) {
    return { ok: false, status: res.status, error: new ApiError('Invalid response shape', res.status, 'ZOD_PARSE_ERROR', parsed.error.flatten()) };
  }
  return { ok: true, status: res.status, data: parsed.data };
}

export async function requestWithRetry<T>(params: {
  url: string;
  method?: HttpMethod;
  schema: z.ZodType<T>;
  headers?: Record<string, string>;
  body?: unknown;
  signal?: AbortSignal;
  timeoutMs?: number;
  retries?: number;
  backoffMs?: number;
}): Promise<ApiResult<T>> {
  const retries = params.retries ?? 2;
  const backoffMs = params.backoffMs ?? 500;
  let attempt = 0;
  let lastErr: ApiError | undefined;
  while (attempt <= retries) {
    const res = await request<T>(params);
    if (res.ok) return res;
    lastErr = res.error;
    const status = res.status;
    const retryable = status === 0 || status === 429 || (status >= 500 && status < 600);
    if (!retryable || attempt === retries) return res;
    await delay(backoffMs * Math.pow(2, attempt));
    attempt++;
  }
  return { ok: false, status: lastErr?.status ?? 0, error: lastErr } as ApiResult<T>;
}

export async function requestRaw(params: {
  url: string;
  method?: HttpMethod;
  headers?: Record<string, string>;
  body?: unknown;
  signal?: AbortSignal;
  timeoutMs?: number;
}): Promise<ApiResult<unknown>> {
  const { url, method, headers, body } = params;
  const timeoutMs = params.timeoutMs ?? DefaultTimeoutMs;
  const signal = withTimeout(params.signal, timeoutMs);
  try {
    const res = await fetch(url, {
      method: method ?? 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: body == null ? undefined : JSON.stringify(body),
      signal,
    });
    const status = res.status;
    const text = await res.text();
    const json = text ? safeJsonParse(text) : undefined;
    if (!res.ok) {
      const msg = typeof json?.message === 'string' ? json?.message : res.statusText || 'Request failed';
      return { ok: false, status, error: new ApiError(msg, status, json?.code, json) };
    }
    return { ok: true, status, data: json };
  } catch (e: unknown) {
    const isAbort = e instanceof DOMException && e.name === 'AbortError';
    const status = isAbort ? 499 : 0;
    const message = isAbort ? 'Request aborted' : 'Network error';
    return { ok: false, status, error: new ApiError(message, status, undefined, redactedError(e)) };
  }
}

export function useApiQuery<T>(options: {
  key: QueryKey;
  url: string;
  schema: z.ZodType<T>;
  enabled?: boolean;
  staleTimeMs?: number;
} & Omit<UseQueryOptions<ApiResult<unknown>, ApiError, T, QueryKey>, 'queryKey' | 'queryFn' | 'select'>) {
  const { key, url, schema, enabled, staleTimeMs, ...rest } = options;
  return useQuery<ApiResult<unknown>, ApiError, T, QueryKey>({
    queryKey: [...(Array.isArray(key) ? key : [key]), url],
    queryFn: async () => requestRaw({ url }),
    enabled: enabled ?? true,
    staleTime: staleTimeMs ?? 60_000,
    select: (res) => {
      if (!res.ok) throw res.error ?? new ApiError('Unknown error', res.status);
      const parsed = schema.safeParse(res.data);
      if (!parsed.success) {
        throw new ApiError('Invalid response shape', res.status, 'ZOD_PARSE_ERROR', parsed.error.flatten());
      }
      return parsed.data as T;
    },
    ...rest,
  });
}

export const ApiPlatform = {
  isWeb: Platform.OS === 'web',
  os: Platform.OS,
};

export { trpc, trpcClient };

type JsonLike = { [k: string]: unknown; message?: string; code?: string };
function safeJsonParse(text: string): JsonLike {
  try {
    return JSON.parse(text) as JsonLike;
  } catch {
    return { message: 'Invalid JSON', code: 'INVALID_JSON' } as const;
  }
}

function redactedError(e: unknown): Record<string, unknown> {
  const base: Record<string, unknown> = { type: typeof e };
  if (e instanceof Error) {
    base.name = e.name;
    base.message = e.message;
  }
  return base;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
