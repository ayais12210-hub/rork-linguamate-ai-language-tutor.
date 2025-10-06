import { z } from 'zod';
import { AudioMIME, BCP47, BoundedInt } from './common';

/**
 * Schema for STT transcription request
 * Validates audio file uploads and language parameters
 */
export const STTTranscribeRequestSchema = z.object({
  audio: z.instanceof(File, {
    message: 'Audio file is required'
  }).refine(
    (file) => file.size > 0 && file.size <= 10_000_000,
    'Audio file must be between 1 byte and 10MB'
  ).refine(
    (file) => {
      const validTypes = ['audio/webm', 'audio/m4a', 'audio/mp3', 'audio/wav', 'audio/mpeg', 'audio/ogg'];
      return validTypes.includes(file.type);
    },
    'Audio file must be in a supported format (webm, m4a, mp3, wav, mpeg, ogg)'
  ),
  language: BCP47.optional().describe('BCP47 language code (e.g., en, es, fr, pa-IN)'),
});

/**
 * Schema for STT transcription response
 */
export const STTTranscribeResponseSchema = z.object({
  text: z.string().min(0).max(10000).describe('Transcribed text'),
  confidence: z.number().min(0).max(1).optional().describe('Confidence score (0-1)'),
  language: z.string().optional().describe('Detected language'),
  duration: z.number().optional().describe('Audio duration in milliseconds'),
});

/**
 * Schema for STT error response
 */
export const STTErrorResponseSchema = z.object({
  message: z.string(),
  status: z.number().optional(),
  error: z.string().optional(),
});

/**
 * Schema for STT health check response
 */
export const STTHealthResponseSchema = z.object({
  ok: z.boolean(),
  service: z.literal('speech-to-text'),
  base: z.string().url(),
  rate: z.object({
    windowMs: z.number(),
    max: z.number(),
  }),
});

/**
 * Schema for validating form data from multipart/form-data requests
 * Used for server-side validation after parsing
 */
export const STTFormDataSchema = z.object({
  audioFile: z.instanceof(Blob).refine(
    (blob) => blob.size > 0 && blob.size <= 10_000_000,
    'Audio file must be between 1 byte and 10MB'
  ),
  audioType: z.string().refine(
    (type) => {
      const validTypes = ['audio/webm', 'audio/m4a', 'audio/mp3', 'audio/wav', 'audio/mpeg', 'audio/ogg'];
      return validTypes.includes(type);
    },
    'Invalid audio MIME type'
  ),
  language: z.string().regex(/^[a-z]{2,3}(-[A-Z]{2})?$/).optional(),
});

export type STTTranscribeRequest = z.infer<typeof STTTranscribeRequestSchema>;
export type STTTranscribeResponse = z.infer<typeof STTTranscribeResponseSchema>;
export type STTErrorResponse = z.infer<typeof STTErrorResponseSchema>;
export type STTHealthResponse = z.infer<typeof STTHealthResponseSchema>;
export type STTFormData = z.infer<typeof STTFormDataSchema>;
