export const PERSONA_TAGS = {
  BEGINNER_FAST_TRACK: 'BEGINNER_FAST_TRACK',
  BUSY_MICROSESSIONS: 'BUSY_MICROSESSIONS',
  PRONUNCIATION_FOCUS: 'PRONUNCIATION_FOCUS',
} as const;

export type PersonaTag = typeof PERSONA_TAGS[keyof typeof PERSONA_TAGS];

export type RuleTrace = {
  id: string;
  reason: string;
  effect: Record<string, unknown>;
};
