import { z } from 'zod';

export const Level = z.enum(['A0','A1','A2','B1','B2','C1','C2']);
export const TimePerDay = z.enum(['5','10','20','30','45+']);
export const Focus = z.object({
  speaking: z.number().min(0).max(100),
  listening: z.number().min(0).max(100),
  reading: z.number().min(0).max(100),
  writing: z.number().min(0).max(100),
  grammar: z.number().min(0).max(100),
  vocab: z.number().min(0).max(100),
}).refine(v => Object.values(v).reduce((a,b)=>a+b,0) === 100, 'FOCUS_MUST_SUM_100');

export const OnboardingAnswer = z.object({
  goal: z.enum(['conversation','exam','travel','business','heritage']),
  level: Level,
  timePerDay: TimePerDay,
  focus: Focus,
  pronunConfidence: z.enum(['low','medium','high']),
  script: z.enum(['gurmukhi','shahmukhi','latin']).optional(),
  dialect: z.enum(['punjabi_majhi','english_uk','english_us']).optional(),
  accessibility: z.object({
    largeText: z.boolean().optional(),
    highContrast: z.boolean().optional(),
    reducedMotion: z.boolean().optional(),
    colorBlindSafe: z.boolean().optional(),
  }).partial(),
  notifyHourLocal: z.number().int().min(0).max(23).optional(),
  oftenOffline: z.boolean().optional(),
  monetisation: z.enum(['free_only','monthly','yearly']).optional(),
});

export const SRSConfig = z.object({
  newPerDay: z.number().min(5).max(50),
  reviewCap: z.number().min(20).max(300),
  easeAdjPct: z.number().min(-20).max(20),
});

export const SpeechConfig = z.object({
  ttsVoice: z.string(),
  rate: z.number().min(0.7).max(1.4).default(1.0),
  pitch: z.number().min(0.8).max(1.2).default(1.0),
  asrStrictness: z.enum(['lenient','balanced','strict']).default('balanced'),
});

export const LessonPlanConfig = z.object({
  microLessonMins: z.number().min(3).max(15),
  composition: z.object({
    speaking: z.number(), grammar: z.number(), vocab: z.number(),
    listening: z.number(), reading: z.number(), writing: z.number(),
  }),
});

export const AccessibilityPrefs = z.object({
  theme: z.enum(['system','light','dark']).default('system'),
  fontScale: z.number().min(1.0).max(1.6).default(1.0),
  highContrast: z.boolean().default(false),
  reducedMotion: z.boolean().default(false),
});

export const NotificationPrefs = z.object({
  enabled: z.boolean().default(true),
  hourLocal: z.number().int().min(0).max(23).default(19),
});

export const PreferenceProfile = z.object({
  version: z.literal(1),
  personas: z.array(z.string()),
  srs: SRSConfig,
  lessonPlan: LessonPlanConfig,
  speech: SpeechConfig,
  notifications: NotificationPrefs,
  accessibility: AccessibilityPrefs,
  script: z.enum(['gurmukhi','shahmukhi','latin']).optional(),
  dialect: z.string().optional(),
});

export type TPreferenceProfile = z.infer<typeof PreferenceProfile>;
export type TOnboardingAnswer = z.infer<typeof OnboardingAnswer>;
export type TLessonPlanConfig = z.infer<typeof LessonPlanConfig>;
export type TSRSConfig = z.infer<typeof SRSConfig>;
export type TSpeechConfig = z.infer<typeof SpeechConfig>;
export type TNotificationPrefs = z.infer<typeof NotificationPrefs>;
export type TAccessibilityPrefs = z.infer<typeof AccessibilityPrefs>;
