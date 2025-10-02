import { z } from 'zod';

export const LogLevelSchema = z.enum([
  'TRACE',
  'DEBUG',
  'INFO',
  'NOTICE',
  'WARN',
  'ERROR',
  'FATAL',
  'SECURITY',
]);

export const DeviceInfoSchema = z.object({
  model: z.string().optional(),
  os: z.string().optional(),
  appVer: z.string().optional(),
  platform: z.string().optional(),
  locale: z.string().optional(),
  timezone: z.string().optional(),
  fingerprint: z.string().optional(),
});

export const UserInfoSchema = z.object({
  sub: z.string().optional(),
  role: z.string().optional(),
  tier: z.string().optional(),
  cohort: z.string().optional(),
});

export const RequestInfoSchema = z.object({
  method: z.string().optional(),
  path: z.string().optional(),
  status: z.number().optional(),
  duration: z.number().optional(),
  ipHash: z.string().optional(),
  userAgent: z.string().optional(),
  referer: z.string().optional(),
});

export const CorrelationInfoSchema = z.object({
  correlationId: z.string(),
  sessionId: z.string().optional(),
  parentId: z.string().optional(),
  traceId: z.string().optional(),
});

export const SignatureInfoSchema = z.object({
  hmac: z.string(),
  algo: z.literal('HMAC-SHA256'),
  ts: z.string(),
});

export const LogEnvelopeSchema = z.object({
  ts: z.string(),
  lvl: LogLevelSchema,
  cat: z.string(),
  evt: z.string(),
  msg: z.string(),
  data: z.record(z.string(), z.unknown()).optional(),
  device: DeviceInfoSchema.optional(),
  user: UserInfoSchema.optional(),
  req: RequestInfoSchema.optional(),
  corr: CorrelationInfoSchema.optional(),
  sig: SignatureInfoSchema.optional(),
});

export const LogBatchSchema = z.object({
  logs: z.array(LogEnvelopeSchema),
  sig: SignatureInfoSchema,
});

export type LogLevel = z.infer<typeof LogLevelSchema>;
export type DeviceInfo = z.infer<typeof DeviceInfoSchema>;
export type UserInfo = z.infer<typeof UserInfoSchema>;
export type RequestInfo = z.infer<typeof RequestInfoSchema>;
export type CorrelationInfo = z.infer<typeof CorrelationInfoSchema>;
export type SignatureInfo = z.infer<typeof SignatureInfoSchema>;
export type LogEnvelope = z.infer<typeof LogEnvelopeSchema>;
export type LogBatch = z.infer<typeof LogBatchSchema>;
