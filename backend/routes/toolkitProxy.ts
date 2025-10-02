import { Hono } from 'hono';

const toolkitApp = new Hono();

const BASE = process.env.EXPO_PUBLIC_TOOLKIT_URL || 'https://toolkit.rork.com';
const API_KEY = process.env.TOOLKIT_API_KEY || '';

const rateMap = new Map<string, { count: number; windowStart: number }>();
const WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10);
const MAX_REQ = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '60', 10);

function rateLimit(ip: string): boolean {
  const now = Date.now();
  const rec = rateMap.get(ip) ?? { count: 0, windowStart: now };
  if (now - rec.windowStart > WINDOW_MS) {
    rec.count = 0; rec.windowStart = now;
  }
  rec.count += 1;
  rateMap.set(ip, rec);
  return rec.count <= MAX_REQ;
}

async function proxyJson(c: any, path: string, body?: unknown, init?: RequestInit) {
  const ip = (c.req.header('x-forwarded-for') ?? c.req.header('cf-connecting-ip') ?? 'anon') as string;
  if (!rateLimit(ip)) return c.json({ message: 'Rate limit exceeded' }, 429);

  const url = new URL(path, BASE).toString();
  const retries = 2;
  let attempt = 0;
  let lastErr: any;
  while (attempt <= retries) {
    try {
      const res = await fetch(url, {
        ...init,
        method: init?.method ?? 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': API_KEY ? `Bearer ${API_KEY}` : undefined,
          ...init?.headers,
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      const text = await res.text();
      const json = text ? JSON.parse(text) : {};
      if (!res.ok) {
        if ((res.status === 429 || res.status >= 500) && attempt < retries) {
          await new Promise(r => setTimeout(r, 500 * Math.pow(2, attempt)));
          attempt++; continue;
        }
        return c.json({ message: json?.message ?? 'Upstream error', status: res.status }, res.status);
      }
      return c.json(json, res.status);
    } catch (e: any) {
      lastErr = e;
      if (attempt === retries) {
        return c.json({ message: 'Service temporarily unavailable', error: e?.message }, 503);
      }
      await new Promise(r => setTimeout(r, 500 * Math.pow(2, attempt)));
      attempt++;
    }
  }
  return c.json({ message: 'Unknown error', error: lastErr?.message }, 500);
}

// Text LLM proxy
toolkitApp.post('/toolkit/text/llm', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  return proxyJson(c, '/text/llm/', body);
});

// STT proxy - forward as-is, but ensure form-data content type
toolkitApp.post('/toolkit/stt/transcribe', async (c) => {
  const contentType = c.req.header('content-type') || '';
  if (!contentType.includes('multipart/form-data')) {
    return c.json({ message: 'Expected multipart/form-data' }, 400);
  }
  const url = new URL('/stt/transcribe/', BASE).toString();
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': API_KEY ? `Bearer ${API_KEY}` : undefined,
      },
      body: c.req.raw.body as any,
    } as RequestInit);
    const text = await res.text();
    const json = text ? JSON.parse(text) : {};
    return c.json(json, res.status);
  } catch (e: any) {
    return c.json({ message: 'Service temporarily unavailable', error: e?.message }, 503);
  }
});

export default toolkitApp;