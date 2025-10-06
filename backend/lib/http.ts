import { setTimeout as delay } from 'timers/promises';

export interface FetchRetryOptions {
  timeoutMs?: number;
  retries?: number;
  backoffMs?: number;
  backoffFactor?: number;
  retryOn?: (status: number) => boolean;
  breakerKey?: string;
}

interface BreakerState {
  failures: number;
  openedAt: number | null;
}

const circuitBreakers = new Map<string, BreakerState>();
const DEFAULT_TIMEOUT_MS = Number.parseInt(process.env.REQUEST_TIMEOUT_MS ?? '10000', 10);
const DEFAULT_RETRIES = Number.parseInt(process.env.REQUEST_RETRIES ?? '2', 10);
const DEFAULT_BACKOFF_MS = Number.parseInt(process.env.REQUEST_BACKOFF_MS ?? '300', 10);
const DEFAULT_BACKOFF_FACTOR = Number.parseFloat(process.env.REQUEST_BACKOFF_FACTOR ?? '2');
const BREAKER_THRESHOLD = Number.parseInt(process.env.REQUEST_BREAKER_THRESHOLD ?? '6', 10);
const BREAKER_COOLDOWN_MS = Number.parseInt(process.env.REQUEST_BREAKER_COOLDOWN_MS ?? '30000', 10);

function isBreakerOpen(key: string | undefined): boolean {
  if (!key) return false;
  const state = circuitBreakers.get(key);
  if (!state) return false;
  if (state.openedAt && Date.now() - state.openedAt < BREAKER_COOLDOWN_MS) return true;
  if (state.openedAt && Date.now() - state.openedAt >= BREAKER_COOLDOWN_MS) {
    // reset after cooldown
    circuitBreakers.set(key, { failures: 0, openedAt: null });
    return false;
  }
  return false;
}

function recordFailure(key: string | undefined): void {
  if (!key) return;
  const state = circuitBreakers.get(key) ?? { failures: 0, openedAt: null };
  state.failures += 1;
  if (state.failures >= BREAKER_THRESHOLD && !state.openedAt) {
    state.openedAt = Date.now();
  }
  circuitBreakers.set(key, state);
}

function recordSuccess(key: string | undefined): void {
  if (!key) return;
  circuitBreakers.set(key, { failures: 0, openedAt: null });
}

export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit = {},
  options: FetchRetryOptions = {}
): Promise<Response> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const retries = options.retries ?? DEFAULT_RETRIES;
  const backoffMs = options.backoffMs ?? DEFAULT_BACKOFF_MS;
  const backoffFactor = options.backoffFactor ?? DEFAULT_BACKOFF_FACTOR;
  const retryOn = options.retryOn ?? ((status) => status === 429 || status >= 500);
  const breakerKey = options.breakerKey;

  if (isBreakerOpen(breakerKey)) {
    throw new Error('CIRCUIT_OPEN');
  }

  let attempt = 0;
  let lastErr: unknown;

  while (attempt <= retries) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      const res = await fetch(input, { ...init, signal: controller.signal });
      clearTimeout(timer);
      if (!res.ok && retryOn(res.status) && attempt < retries) {
        attempt += 1;
        await delay(backoffMs * Math.pow(backoffFactor, attempt - 1));
        continue;
      }
      if (!res.ok) {
        recordFailure(breakerKey);
      } else {
        recordSuccess(breakerKey);
      }
      return res;
    } catch (e) {
      lastErr = e;
      if (attempt === retries) {
        recordFailure(breakerKey);
        throw e;
      }
      attempt += 1;
      await delay(backoffMs * Math.pow(backoffFactor, attempt - 1));
    }
  }

  // Should never reach here
  throw lastErr instanceof Error ? lastErr : new Error('UNKNOWN_ERROR');
}

export function getBreakerState(key: string): BreakerState | undefined {
  return circuitBreakers.get(key);
}
