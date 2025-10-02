import { z } from 'zod';

export const Email = z
  .string()
  .email('INVALID_EMAIL')
  .max(254, 'EMAIL_TOO_LONG')
  .transform((v) => v.toLowerCase().trim())
  .brand<'Email'>();

export const UUID = z.string().uuid('INVALID_UUID').brand<'UUID'>();

export const BCP47 = z
  .string()
  .regex(/^[a-z]{2,3}(-[A-Z]{2})?$/, 'INVALID_LOCALE')
  .brand<'BCP47'>();

export const ISODate = z.coerce
  .date()
  .transform((d) => d.toISOString())
  .brand<'ISODate'>();

export const ISO4217 = z
  .string()
  .regex(/^[A-Z]{3}$/, 'INVALID_CURRENCY')
  .brand<'ISO4217'>();

export const safeRegexString = (max = 256) =>
  z
    .string()
    .max(max, 'STRING_TOO_LONG')
    .refine((v) => v.length <= max, 'STRING_TOO_LONG');

export const BoundedString = (min: number, max: number, code = 'STRING_LENGTH_INVALID') =>
  z.string().min(min, code).max(max, code);

export const BoundedInt = (min: number, max: number, code = 'NUMBER_OUT_OF_RANGE') =>
  z.coerce.number().int(code).min(min, code).max(max, code);

export const BoundedFloat = (min: number, max: number, code = 'NUMBER_OUT_OF_RANGE') =>
  z.coerce.number().min(min, code).max(max, code);

export const PositiveInt = z.coerce.number().int('INVALID_INTEGER').positive('MUST_BE_POSITIVE');

export const NonNegativeInt = z.coerce
  .number()
  .int('INVALID_INTEGER')
  .nonnegative('MUST_BE_NON_NEGATIVE');

export const SafeHTML = z
  .string()
  .max(10000, 'HTML_TOO_LONG')
  .refine(
    (v) => !/<script|javascript:|onerror=|onload=/i.test(v),
    'UNSAFE_HTML_DETECTED'
  );

export const PlainText = z
  .string()
  .transform((v) => v.replace(/<[^>]*>/g, ''))
  .refine((v) => !/<script/i.test(v), 'SCRIPT_TAG_DETECTED');

export const AudioMIME = z.enum(['audio/webm', 'audio/m4a', 'audio/mp3', 'audio/wav'], {
  message: 'MIME_NOT_ALLOWED',
});

export const ImageMIME = z.enum(['image/jpeg', 'image/png', 'image/webp', 'image/gif'], {
  message: 'MIME_NOT_ALLOWED',
});

export const FileRef = z.object({
  uri: z.string().url('INVALID_URI'),
  mimeType: z.string(),
  sizeBytes: PositiveInt,
  name: BoundedString(1, 255, 'FILENAME_INVALID'),
});

export const AudioFileRef = FileRef.extend({
  mimeType: AudioMIME,
  sizeBytes: z.number().max(8_000_000, 'FILE_TOO_LARGE'),
  durationMs: BoundedInt(250, 120_000, 'AUDIO_DURATION_INVALID'),
});

export const ImageFileRef = FileRef.extend({
  mimeType: ImageMIME,
  sizeBytes: z.number().max(5_000_000, 'FILE_TOO_LARGE'),
});

export const PaginationParams = z.object({
  page: PositiveInt.default(1),
  limit: BoundedInt(1, 100, 'LIMIT_OUT_OF_RANGE').default(20),
});

export const SortOrder = z.enum(['asc', 'desc'], {
  message: 'INVALID_SORT_ORDER',
});

export type EmailType = z.infer<typeof Email>;
export type UUIDType = z.infer<typeof UUID>;
export type BCP47Type = z.infer<typeof BCP47>;
export type ISODateType = z.infer<typeof ISODate>;
export type ISO4217Type = z.infer<typeof ISO4217>;
export type AudioMIMEType = z.infer<typeof AudioMIME>;
export type ImageMIMEType = z.infer<typeof ImageMIME>;
export type FileRefType = z.infer<typeof FileRef>;
export type AudioFileRefType = z.infer<typeof AudioFileRef>;
export type ImageFileRefType = z.infer<typeof ImageFileRef>;
export type PaginationParamsType = z.infer<typeof PaginationParams>;
export type SortOrderType = z.infer<typeof SortOrder>;
