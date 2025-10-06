import { Hono } from 'hono';
import type { Context } from 'hono';
import { z } from 'zod';
import { fetchWithTimeout } from '@/backend/lib/http';

const sttApp = new Hono();

const BASE: string = process.env.EXPO_PUBLIC_TOOLKIT_URL ?? 'https://toolkit.rork.com';
const API_KEY: string = process.env.TOOLKIT_API_KEY ?? '';

const rateMap = new Map<string, { count: number; windowStart: number }>();
const WINDOW_MS = Number.parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? '60000', 10);
const MAX_REQ = Number.parseInt(process.env.RATE_LIMIT_MAX_REQUESTS ?? '60', 10);

/**
 * Validation schema for language parameter
 */
const LanguageSchema = z.string().regex(/^[a-z]{2,3}(-[A-Z]{2})?$/, 'Invalid language code format (expected: en, es, pa-IN, etc.)').optional();

/**
 * Maximum audio file size (10MB)
 */
const MAX_AUDIO_SIZE = 10_000_000;

/**
 * Allowed audio MIME types
 */
const ALLOWED_AUDIO_TYPES = ['audio/webm', 'audio/m4a', 'audio/mp3', 'audio/wav', 'audio/mpeg', 'audio/ogg'];

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
    c.status(429 as any);
    return c.json({ message: 'Rate limit exceeded. Please try again later.' });
  }

  const contentType = c.req.header('content-type') ?? '';
  if (!contentType.includes('multipart/form-data')) {
    console.log('[STT] Invalid content type:', contentType);
    c.status(400 as any);
    return c.json({ message: 'Expected multipart/form-data' });
  }

  try {
    console.log('[STT] Parsing form data...');
    const formData = await c.req.formData();
    const audioFile = formData.get('audio');

    if (!audioFile) {
      console.log('[STT] No audio file in request');
      c.status(400 as any);
      return c.json({ message: 'No audio file provided' });
    }

    // Validate audio file
    if (!(audioFile instanceof File || audioFile instanceof Blob)) {
      console.log('[STT] Invalid audio file type');
      c.status(400 as any);
      return c.json({ message: 'Invalid audio file format' });
    }

    // Validate file size
    if (audioFile.size === 0) {
      console.log('[STT] Empty audio file');
      c.status(400 as any);
      return c.json({ message: 'Audio file is empty' });
    }

    if (audioFile.size > MAX_AUDIO_SIZE) {
      console.log('[STT] Audio file too large:', audioFile.size);
      c.status(413 as any);
      return c.json({ 
        message: `Audio file too large. Maximum size is ${MAX_AUDIO_SIZE / 1_000_000}MB`,
        maxSize: MAX_AUDIO_SIZE,
        receivedSize: audioFile.size
      });
    }

    // Validate MIME type
    const audioType = (audioFile as File).type || 'audio/unknown';
    if (!ALLOWED_AUDIO_TYPES.includes(audioType)) {
      console.log('[STT] Invalid audio MIME type:', audioType);
      c.status(400 as any);
      return c.json({ 
        message: `Invalid audio format. Allowed formats: ${ALLOWED_AUDIO_TYPES.join(', ')}`,
        receivedType: audioType,
        allowedTypes: ALLOWED_AUDIO_TYPES
      });
    }

    // Validate language parameter if provided
    const languageParam = formData.get('language');
    let validatedLanguage: string | undefined;
    
    if (languageParam) {
      try {
        validatedLanguage = LanguageSchema.parse(String(languageParam));
      } catch (error) {
        console.log('[STT] Invalid language parameter:', languageParam);
        c.status(400 as any);
        return c.json({ 
          message: 'Invalid language code format. Expected format: en, es, pa-IN, etc.',
          receivedLanguage: languageParam
        });
      }
    }

    // Get enhanced options
    const punctuation = formData.get('punctuation');
    const formatting = formData.get('formatting');
    const alternatives = formData.get('alternatives');
    const autoDetectLanguage = formData.get('autoDetectLanguage');

    console.log('[STT] Audio file validated successfully');
    console.log('[STT] File size:', audioFile.size, 'bytes');
    console.log('[STT] File type:', audioType);
    if (validatedLanguage) {
      console.log('[STT] Language:', validatedLanguage);
    }
    console.log('[STT] Enhanced options:', {
      punctuation: punctuation ? punctuation.toString() : 'default',
      formatting: formatting ? formatting.toString() : 'default',
      alternatives: alternatives ? alternatives.toString() : 'default',
      autoDetectLanguage: autoDetectLanguage ? autoDetectLanguage.toString() : 'default',
    });

    console.log('[STT] Forwarding to Toolkit API...');
    const url = new URL('/stt/transcribe/', BASE).toString();
    
    const proxyFormData = new FormData();
    proxyFormData.append('audio', audioFile);

    if (validatedLanguage) {
      proxyFormData.append('language', validatedLanguage);
    }

    // Add enhanced options to the request
    if (punctuation) {
      proxyFormData.append('punctuation', punctuation.toString());
    }
    if (formatting) {
      proxyFormData.append('formatting', formatting.toString());
    }
    if (alternatives) {
      proxyFormData.append('alternatives', alternatives.toString());
    }
    if (autoDetectLanguage) {
      proxyFormData.append('autoDetectLanguage', autoDetectLanguage.toString());
    }

    const headers: Record<string, string> = {};
    if (API_KEY) {
      headers['Authorization'] = `Bearer ${API_KEY}`;
    }

    const correlationId = c.req.header('x-request-id') ?? 
      (globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2));
    headers['x-request-id'] = correlationId;

    console.log('[STT] Sending request to:', url);
    const response = await fetchWithTimeout(url, {
      method: 'POST',
      headers,
      body: proxyFormData,
    }, { breakerKey: 'toolkit:stt', timeoutMs: 30000 });

    const responseText = await response.text();
    console.log('[STT] Toolkit API response status:', response.status);

    if (!response.ok) {
      console.error('[STT] Toolkit API error:', responseText);
      c.status(response.status as any);
      
      let errorMessage = 'Speech-to-text service error';
      try {
        const errorJson = JSON.parse(responseText);
        errorMessage = errorJson.message || errorMessage;
      } catch {
        console.log('[STT] Could not parse error response as JSON');
      }
      
      return c.json({ 
        message: errorMessage,
        status: response.status 
      });
    }

    let result;
    try {
      result = JSON.parse(responseText);
      console.log('[STT] Transcription successful:', result.text ? 'text received' : 'no text');
      
      // Enhance the result with additional processing if needed
      if (result.text && formatting === 'enhanced') {
        result.text = enhanceTranscriptionText(result.text);
      }
      
      // Add language detection if requested
      if (autoDetectLanguage === 'true' && result.text) {
        const detectedLang = detectLanguageFromText(result.text);
        if (detectedLang) {
          result.detectedLanguage = detectedLang;
        }
      }
      
    } catch (parseError) {
      console.error('[STT] Failed to parse response JSON:', parseError);
      c.status(500 as any);
      return c.json({ message: 'Invalid response from speech-to-text service' });
    }

    c.status(200 as any);
    return c.json(result);

  } catch (error: any) {
    console.error('[STT] Error processing request:', error);
    c.status(503 as any);
    return c.json({ 
      message: 'Service temporarily unavailable', 
      error: error?.message || 'Unknown error'
    });
  }
});

// Enhanced text processing functions
function enhanceTranscriptionText(text: string): string {
  if (!text) return text;

  const formatted = text
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/([.!?])\s*([a-z])/g, '$1 $2') // Space after sentence endings
    .replace(/([a-z])([A-Z])/g, '$1 $2') // Space before capital letters
    .replace(/\s*,\s*/g, ', ') // Normalize commas
    .replace(/\s*\.\s*/g, '. ') // Normalize periods
    .replace(/\s*\?\s*/g, '? ') // Normalize question marks
    .replace(/\s*!\s*/g, '! ') // Normalize exclamation marks
    .trim()
    .replace(/(^|[.!?]\s+)([a-z])/g, (match, prefix, letter) => 
      prefix + letter.toUpperCase()
    ); // Capitalize first letter of each sentence

  // Ensure it ends with punctuation
  if (!/[.!?]$/.test(formatted)) {
    return formatted + '.';
  }
  
  return formatted;
}

function detectLanguageFromText(text: string): string | null {
  if (!text) return null;

  const patterns = {
    'zh-CN': /[\u4e00-\u9fff]/,
    'ja-JP': /[\u3040-\u309f\u30a0-\u30ff]/,
    'ko-KR': /[\uac00-\ud7af]/,
    'ar-SA': /[\u0600-\u06ff]/,
    'hi-IN': /[\u0900-\u097f]/,
    'ru-RU': /[\u0400-\u04ff]/,
    'es-ES': /[ñáéíóúü]/i,
    'fr-FR': /[àâäéèêëïîôöùûüÿç]/i,
    'de-DE': /[äöüß]/i,
    'it-IT': /[àèéìíîòóù]/i,
    'pt-BR': /[ãõçáéíóúâêô]/i,
  };

  for (const [lang, pattern] of Object.entries(patterns)) {
    if (pattern.test(text)) {
      return lang;
    }
  }

  return 'en-US'; // Default to English
}

// Simple STT endpoint for mobile fallback (mock-first approach)
sttApp.post('/stt', async (c: Context) => {
  console.log('[STT] Simple endpoint called');
  
  // If real provider keys exist, call them here.
  // For now, return a mock to keep Expo Go compatibility.
  const mockEnabled = process.env.STT_MOCK_ENABLED !== 'false';
  
  if (mockEnabled) {
    return c.json({ text: 'hello from server (mock)' });
  }
  
  // In production, you could forward to the full transcribe endpoint
  // or implement a simple provider here
  return c.json({ text: 'hello from server (mock)' });
});

sttApp.get('/stt/health', (c: Context) => {
  c.status(200 as any);
  return c.json({ 
    ok: true, 
    service: 'speech-to-text',
    base: BASE, 
    rate: { windowMs: WINDOW_MS, max: MAX_REQ } 
  });
});

export default sttApp;
