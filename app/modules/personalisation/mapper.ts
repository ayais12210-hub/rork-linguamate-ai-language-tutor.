import { OnboardingAnswer, PreferenceProfile, TPreferenceProfile } from '@/schemas/preferences';

export type MappingResult = { profile: TPreferenceProfile; explanation: string[] };

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

export function mapAnswerToProfile(raw: unknown): MappingResult {
  const answers = OnboardingAnswer.parse(raw);
  const explanation: string[] = [];

  const time = answers.timePerDay;
  let newPerDay = 15;
  let reviewCap = 80;
  let easeAdjPct = 0;
  if (time === '5' || time === '10') {
    newPerDay = 10;
    reviewCap = 40;
    easeAdjPct = -5;
    explanation.push('Low time budget → slower SRS pace');
  } else if (time === '30' || time === '45+') {
    newPerDay = 25;
    reviewCap = 120;
    easeAdjPct = 5;
    explanation.push('High time budget → faster SRS pace');
  } else if (time === '20') {
    newPerDay = 18;
    reviewCap = 90;
    easeAdjPct = 0;
    explanation.push('Medium time budget');
  }

  const comp = answers.focus;
  const composition = {
    speaking: clamp(comp.speaking, 15, 50),
    listening: clamp(comp.listening, 10, 40),
    reading: clamp(comp.reading, 10, 40),
    writing: clamp(comp.writing, 5, 30),
    grammar: clamp(comp.grammar, 10, 40),
    vocab: clamp(comp.vocab, 10, 40),
  } as const;

  const microLessonMins = answers.level === 'A0' || answers.level === 'A1' ? 5 : 8;

  const speech = {
    ttsVoice: answers.dialect === 'english_uk' ? 'en-GB' : 'en-US',
    rate: answers.pronunConfidence === 'low' ? 0.95 : 1.0,
    pitch: 1.0,
    asrStrictness: answers.pronunConfidence === 'low' ? 'lenient' : 'balanced',
  } as const;

  const accessibility = {
    theme: 'system' as const,
    fontScale: answers.accessibility?.largeText ? 1.2 : 1.0,
    highContrast: Boolean(answers.accessibility?.highContrast),
    reducedMotion: Boolean(answers.accessibility?.reducedMotion),
  };

  const notifications = {
    enabled: true,
    hourLocal: answers.notifyHourLocal ?? 19,
  } as const;

  const personas: string[] = [];
  if ((answers.level === 'A0' || answers.level === 'A1') && (time === '20' || time === '30' || time === '45+')) {
    personas.push('BEGINNER_FAST_TRACK');
  }
  if (time === '5' || time === '10' || answers.oftenOffline) {
    personas.push('BUSY_MICROSESSIONS');
  }
  if (answers.focus.speaking >= 35 || answers.pronunConfidence === 'low') {
    personas.push('PRONUNCIATION_FOCUS');
  }

  const profile = PreferenceProfile.parse({
    version: 1,
    personas,
    srs: { newPerDay, reviewCap, easeAdjPct },
    lessonPlan: { microLessonMins, composition },
    speech,
    notifications,
    accessibility,
    script: answers.script,
    dialect: answers.dialect,
  });

  return { profile, explanation };
}
