import { Hono } from 'hono';
import type { Context } from 'hono';

const sttApp = new Hono();

const BASE: string = process.env.EXPO_PUBLIC_TOOLKIT_URL ?? 'https://toolkit.rork.com';
const API_KEY: string = process.env.TOOLKIT_API_KEY ?? '';

const rateMap = new Map<string, { count: number; windowStart: number }>();
const WINDOW_MS = Number.parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? '60000', 10);
const MAX_REQ = Number.parseInt(process.env.RATE_LIMIT_MAX_REQUESTS ?? '60', 10);

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

sttApp.post('/stt/transcribe', async (c: Context) => {
  console.log('[STT] Received transcription request');

  const ipHeader = c.req.header('x-forwarded-for') ?? c.req.header('cf-connecting-ip');
  const ip = (ipHeader ?? 'anon') as string;
  const rl = rateLimit(ip);

  c.header('X-RateLimit-Limit', String(MAX_REQ));
  c.header('X-RateLimit-Remaining', String(rl.remaining));
  c.header('X-RateLimit-Reset', String(Math.max(0, Math.ceil(rl.resetMs / 1000))));

  if (!rl.allowed) {
    console.log('[STT] Rate limit exceeded for IP:', ip);
    return c.status(429).json({ message: 'Rate limit exceeded. Please try again later.' });
  }

  const contentType = c.req.header('content-type') ?? '';
  if (!contentType.includes('multipart/form-data')) {
    console.log('[STT] Invalid content type:', contentType);
    return c.status(400).json({ message: 'Expected multipart/form-data' });
  }

  try {
    console.log('[STT] Parsing form data...');
    const formData = await c.req.formData();
    const audioFile = formData.get('audio');

    if (!audioFile) {
      console.log('[STT] No audio file in request');
      return c.status(400).json({ message: 'No audio file provided' });
    }

    console.log('[STT] Audio file received, forwarding to Toolkit API...');
    const url = new URL('/stt/transcribe/', BASE).toString();
    
    const proxyFormData = new FormData();
    proxyFormData.append('audio', audioFile);

    const language = formData.get('language');
    if (language) {
      proxyFormData.append('language', language as string);
    }

    const headers: Record<string, string> = {};
    if (API_KEY) {
      headers['Authorization'] = `Bearer ${API_KEY}`;
    }

    const correlationId = c.req.header('x-request-id') ?? 
      (globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2));
    headers['x-request-id'] = correlationId;

    console.log('[STT] Sending request to:', url);
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: proxyFormData,
    });

    const responseText = await response.text();
    console.log('[STT] Toolkit API response status:', response.status);

    if (!response.ok) {
      console.error('[STT] Toolkit API error:', responseText);
      // Forward the upstream status code
      
      let errorMessage = 'Speech-to-text service error';
      try {
        const errorJson = JSON.parse(responseText);
        errorMessage = errorJson.message || errorMessage;
      } catch {
        console.log('[STT] Could not parse error response as JSON');
      }
      
      return c.status(response.status).json({ 
        message: errorMessage,
        status: response.status 
      });
    }

    let result;
    try {
      result = JSON.parse(responseText);
      console.log('[STT] Transcription successful:', result.text ? 'text received' : 'no text');
    } catch (parseError) {
      console.error('[STT] Failed to parse response JSON:', parseError);
      return c.status(500).json({ message: 'Invalid response from speech-to-text service' });
    }

    return c.status(200).json(result);

  } catch (error: any) {
    console.error('[STT] Error processing request:', error);
    return c.status(503).json({ 
      message: 'Service temporarily unavailable', 
      error: error?.message || 'Unknown error'
    });
  }
});

sttApp.get('/stt/health', (c: Context) => {
  return c.status(200).json({ 
    ok: true, 
    service: 'speech-to-text',
    base: BASE, 
    rate: { windowMs: WINDOW_MS, max: MAX_REQ } 
  });
});

export default sttApp;
