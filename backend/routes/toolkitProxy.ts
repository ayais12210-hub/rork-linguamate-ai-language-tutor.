import { Hono } from 'hono';
import type { Context } from 'hono';

const toolkitApp = new Hono();

const BASE: string = process.env.EXPO_PUBLIC_TOOLKIT_URL ?? 'https://toolkit.rork.com';
const API_KEY: string = process.env.TOOLKIT_API_KEY ?? '';

const rateMap = new Map<string, { count: number; windowStart: number }>();
const WINDOW_MS = Number.parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? '60000', 10);
const MAX_REQ = Number.parseInt(process.env.RATE_LIMIT_MAX_REQUESTS ?? '60', 10);
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_MAP_SIZE = 10000; // Prevent unlimited growth

// Cleanup old entries periodically
function cleanupRateMap() {
  const now = Date.now();
  const cutoff = now - (WINDOW_MS * 2); // Remove entries older than 2 windows

  for (const [ip, record] of rateMap.entries()) {
    if (record.windowStart < cutoff) {
      rateMap.delete(ip);
    }
  }

  // Also prevent the map from growing too large
  if (rateMap.size > MAX_MAP_SIZE) {
    const entries = Array.from(rateMap.entries()).sort((a, b) => a[1].windowStart - b[1].windowStart);
    const toRemove = entries.slice(0, Math.floor(MAX_MAP_SIZE * 0.2)); // Remove oldest 20%
    for (const [ip] of toRemove) {
      rateMap.delete(ip);
    }
  }
}

// Run cleanup every 5 minutes
setInterval(cleanupRateMap, CLEANUP_INTERVAL_MS);

function rateLimit(ip: string): { allowed: boolean; remaining: number; resetMs: number } {
  const now = Date.now();
  const rec = rateMap.get(ip) ?? { count: 0, windowStart: now };
  if (now - rec.windowStart > WINDOW_MS) {
    rec.count = 0;
    rec.windowStart = now;
  }
  rec.count += 1;
  rateMap.set(ip, rec);
  const remaining = Math.max(0, MAX_REQ - rec.count);
  const allowed = rec.count <= MAX_REQ;
  const resetMs = rec.windowStart + WINDOW_MS - now;
  return { allowed, remaining, resetMs };
}

function buildHeaders(initHeaders?: HeadersInit): HeadersInit {
  const base: Record<string, string> = { 'Content-Type': 'application/json' };
  if (API_KEY) base['Authorization'] = `Bearer ${API_KEY}`;
  if (initHeaders) {
    if (initHeaders instanceof Headers) {
      initHeaders.forEach((v, k) => {
        base[k] = v;
      });
    } else if (Array.isArray(initHeaders)) {
      for (const [k, v] of initHeaders) base[k] = v;
    } else {
      Object.assign(base, initHeaders as Record<string, string>);
    }
  }
  return base;
}

async function proxyJson(c: Context, path: string, body?: unknown, init?: RequestInit) {
  const ipHeader = c.req.header('x-forwarded-for') ?? c.req.header('cf-connecting-ip');
  const ip = (ipHeader ?? 'anon') as string;
  const rl = rateLimit(ip);
  c.header('X-RateLimit-Limit', String(MAX_REQ));
  c.header('X-RateLimit-Remaining', String(rl.remaining));
  c.header('X-RateLimit-Reset', String(Math.max(0, Math.ceil(rl.resetMs / 1000))));
  if (!rl.allowed) {
    c.status(429 as any);
    return c.json({ message: 'Rate limit exceeded' });
  }

  const correlationId = c.req.header('x-request-id') ?? (globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2));
  const url = new URL(path, BASE).toString();
  const retries = 2;
  let attempt = 0;
  let lastErr: unknown;
  while (attempt <= retries) {
    try {
      const res = await fetch(url, {
        ...init,
        method: init?.method ?? 'POST',
        headers: {
          ...buildHeaders(init?.headers),
          'x-request-id': correlationId,
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
      const text = await res.text();
      const json = text ? JSON.parse(text) : {};
      if (!res.ok) {
        if ((res.status === 429 || res.status >= 500) && attempt < retries) {
          await new Promise((r) => setTimeout(r, 500 * Math.pow(2, attempt)));
          attempt++;
          continue;
        }
        c.status(res.status as any);
        return c.json({ message: json?.message ?? 'Upstream error', status: res.status });
      }
      c.status(res.status as any);
      return c.json(json);
    } catch (e: any) {
      lastErr = e;
      if (attempt === retries) {
        c.status(503 as any);
        return c.json({ message: 'Service temporarily unavailable', error: e?.message });
      }
      await new Promise((r) => setTimeout(r, 500 * Math.pow(2, attempt)));
      attempt++;
    }
  }
  c.status(500 as any);
  return c.json({ message: 'Unknown error', error: (lastErr as any)?.message });
}

// Health & config visibility (no secrets)
toolkitApp.get('/toolkit/health', (c) => {
  c.status(200 as any);
  return c.json({ ok: true, base: BASE, rate: { windowMs: WINDOW_MS, max: MAX_REQ } });
});

// v1 namespaced routes
// Text LLM proxy
toolkitApp.post('/toolkit/v1/text/llm', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  return proxyJson(c, '/text/llm/', body);
});

// Back-compat path
toolkitApp.post('/toolkit/text/llm', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  return proxyJson(c, '/text/llm/', body);
});

// STT proxy - multipart passthrough with retry logic
async function proxySttRequest(c: Context, path: string) {
  const contentType = c.req.header('content-type') ?? '';
  if (!contentType.includes('multipart/form-data')) {
    c.status(400 as any);
    return c.json({ message: 'Expected multipart/form-data' });
  }

  const ipHeader = c.req.header('x-forwarded-for') ?? c.req.header('cf-connecting-ip');
  const ip = (ipHeader ?? 'anon') as string;
  const rl = rateLimit(ip);
  c.header('X-RateLimit-Limit', String(MAX_REQ));
  c.header('X-RateLimit-Remaining', String(rl.remaining));
  c.header('X-RateLimit-Reset', String(Math.max(0, Math.ceil(rl.resetMs / 1000))));
  if (!rl.allowed) {
    c.status(429 as any);
    return c.json({ message: 'Rate limit exceeded' });
  }

  const correlationId = c.req.header('x-request-id') ?? (globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2));
  const url = new URL(path, BASE).toString();
  const retries = 2;
  let attempt = 0;
  let lastErr: unknown;

  while (attempt <= retries) {
    try {
      const headers: Record<string, string> = {};
      if (API_KEY) headers['Authorization'] = `Bearer ${API_KEY}`;
      headers['x-request-id'] = correlationId;

      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: (c.req as any).raw?.body as unknown as BodyInit,
      });
      const text = await res.text();
      const json = text ? JSON.parse(text) : {};

      if (!res.ok) {
        if ((res.status === 429 || res.status >= 500) && attempt < retries) {
          await new Promise((r) => setTimeout(r, 500 * Math.pow(2, attempt)));
          attempt++;
          continue;
        }
        c.status(res.status as any);
        return c.json({ message: json?.message ?? 'Upstream error', status: res.status });
      }

      c.status(res.status as any);
      return c.json(json);
    } catch (e: any) {
      lastErr = e;
      if (attempt === retries) {
        c.status(503 as any);
        return c.json({ message: 'Service temporarily unavailable', error: e?.message });
      }
      await new Promise((r) => setTimeout(r, 500 * Math.pow(2, attempt)));
      attempt++;
    }
  }

  c.status(500 as any);
  return c.json({ message: 'Unknown error', error: (lastErr as any)?.message });
}

toolkitApp.post('/toolkit/v1/stt/transcribe', async (c) => {
  return proxySttRequest(c, '/stt/transcribe/');
});

// Back-compat path
toolkitApp.post('/toolkit/stt/transcribe', async (c) => {
  return proxySttRequest(c, '/stt/transcribe/');
});

// Image generation proxy
toolkitApp.post('/toolkit/v1/images/generate', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  return proxyJson(c, '/images/generate/', body);
});

// Image edit proxy (multipart) with retry logic
async function proxyImageEditRequest(c: Context, path: string) {
  const contentType = c.req.header('content-type') ?? '';
  const isMultipart = contentType.includes('multipart/form-data') || contentType.includes('application/json');
  if (!isMultipart) {
    c.status(400 as any);
    return c.json({ message: 'Expected multipart/form-data or JSON' });
  }

  const ipHeader = c.req.header('x-forwarded-for') ?? c.req.header('cf-connecting-ip');
  const ip = (ipHeader ?? 'anon') as string;
  const rl = rateLimit(ip);
  c.header('X-RateLimit-Limit', String(MAX_REQ));
  c.header('X-RateLimit-Remaining', String(rl.remaining));
  c.header('X-RateLimit-Reset', String(Math.max(0, Math.ceil(rl.resetMs / 1000))));
  if (!rl.allowed) {
    c.status(429 as any);
    return c.json({ message: 'Rate limit exceeded' });
  }

  const correlationId = c.req.header('x-request-id') ?? (globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2));
  const url = new URL(path, BASE).toString();
  const retries = 2;
  let attempt = 0;
  let lastErr: unknown;

  while (attempt <= retries) {
    try {
      const headers: Record<string, string> = { 'Content-Type': contentType };
      if (API_KEY) headers['Authorization'] = `Bearer ${API_KEY}`;
      headers['x-request-id'] = correlationId;

      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: (c.req as any).raw?.body as unknown as BodyInit,
      });
      const text = await res.text();
      const json = text ? JSON.parse(text) : {};

      if (!res.ok) {
        if ((res.status === 429 || res.status >= 500) && attempt < retries) {
          await new Promise((r) => setTimeout(r, 500 * Math.pow(2, attempt)));
          attempt++;
          continue;
        }
        c.status(res.status as any);
        return c.json({ message: json?.message ?? 'Upstream error', status: res.status });
      }

      c.status(res.status as any);
      return c.json(json);
    } catch (e: any) {
      lastErr = e;
      if (attempt === retries) {
        c.status(503 as any);
        return c.json({ message: 'Service temporarily unavailable', error: e?.message });
      }
      await new Promise((r) => setTimeout(r, 500 * Math.pow(2, attempt)));
      attempt++;
    }
  }

  c.status(500 as any);
  return c.json({ message: 'Unknown error', error: (lastErr as any)?.message });
}

toolkitApp.post('/toolkit/v1/images/edit', async (c) => {
  return proxyImageEditRequest(c, '/images/edit/');
});

export default toolkitApp;
