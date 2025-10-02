import { OnboardingAnswer, PreferenceProfile, SRSConfig, LessonPlanConfig, SpeechConfig, AccessibilityPrefs, NotificationPrefs, TOnboardingAnswer, TPreferenceProfile } from '@/schemas/preferences';
import { PERSONA_TAGS, type PersonaTag } from './personas';
import { makeExplanation } from './explain';

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

function mapSRS(time: TOnboardingAnswer['timePerDay']) {
  switch (time) {
    case '5':
    case '10':
      return SRSConfig.parse({ newPerDay: 10, reviewCap: 40, easeAdjPct: -5 });
    case '20':
      return SRSConfig.parse({ newPerDay: 18, reviewCap: 80, easeAdjPct: 0 });
    case '30':
      return SRSConfig.parse({ newPerDay: 22, reviewCap: 100, easeAdjPct: 3 });
    case '45+':
      return SRSConfig.parse({ newPerDay: 25, reviewCap: 120, easeAdjPct: 5 });
  }
}

function mapLessonPlan(answer: TOnboardingAnswer) {
  const f = answer.focus;
  const comp = {
    speaking: clamp(f.speaking, 15, 50),
    grammar: clamp(f.grammar, 15, 50),
    vocab: clamp(f.vocab, 15, 50),
    listening: clamp(f.listening, 15, 50),
    reading: clamp(f.reading, 15, 50),
    writing: clamp(f.writing, 15, 50),
  };
  const microLessonMins = answer.level === 'A0' || answer.level === 'A1' ? 5 : answer.timePerDay === '45+' ? 12 : 8;
  return LessonPlanConfig.parse({ microLessonMins, composition: comp });
}

function mapSpeech(answer: TOnboardingAnswer) {
  const voice = answer.dialect === 'english_uk' ? 'en-GB-Wavenet-D' : 'en-US-Wavenet-A';
  const asrStrictness = answer.pronunConfidence === 'low' ? 'lenient' : 'balanced';
  const rate = answer.pronunConfidence === 'low' ? 0.95 : 1.0;
  return SpeechConfig.parse({ ttsVoice: voice, asrStrictness, rate, pitch: 1.0 });
}

function mapAccessibility(answer: TOnboardingAnswer) {
  const a = answer.accessibility ?? {};
  const fontScale = a.largeText ? 1.2 : 1.0;
  return AccessibilityPrefs.parse({
    theme: 'system',
    fontScale,
    highContrast: a.highContrast ?? false,
    reducedMotion: a.reducedMotion ?? false,
  });
}

function mapNotifications(answer: TOnboardingAnswer) {
  return NotificationPrefs.parse({ enabled: true, hourLocal: answer.notifyHourLocal ?? 19 });
}

function scorePersonas(answer: TOnboardingAnswer): PersonaTag[] {
  const tags: PersonaTag[] = [];
  if ((answer.level === 'A0' || answer.level === 'A1') && (answer.timePerDay === '20' || answer.timePerDay === '30' || answer.timePerDay === '45+')) {
    tags.push(PERSONA_TAGS.BEGINNER_FAST_TRACK);
  }
  if (answer.timePerDay === '5' || answer.timePerDay === '10' || answer.oftenOffline) {
    tags.push(PERSONA_TAGS.BUSY_MICROSESSIONS);
  }
  if (answer.focus.speaking >= 35 || answer.pronunConfidence === 'low') {
    tags.push(PERSONA_TAGS.PRONUNCIATION_FOCUS);
  }
  return tags;
}

export function mapAnswerToProfile(answer: unknown) {
  const parsed = OnboardingAnswer.parse(answer);
  const explain = makeExplanation();
  const personas = scorePersonas(parsed);
  explain.add({ id: 'personas', reason: 'Derived from level/time/speaking focus', effect: { personas } });

  const srs = mapSRS(parsed.timePerDay);
  explain.add({ id: 'srs', reason: 'Mapped from timePerDay', effect: srs });

  const lessonPlan = mapLessonPlan(parsed);
  explain.add({ id: 'lesson', reason: 'Blended from focus with clamps', effect: lessonPlan });

  const speech = mapSpeech(parsed);
  explain.add({ id: 'speech', reason: 'Dialect and pronun confidence', effect: speech });

  const accessibility = mapAccessibility(parsed);
  explain.add({ id: 'access', reason: 'Accessibility flags', effect: accessibility });

  const notifications = mapNotifications(parsed);
  explain.add({ id: 'notify', reason: 'Preferred hour', effect: notifications });

  const profile: TPreferenceProfile = PreferenceProfile.parse({
    version: 1,
    personas,
    srs,
    lessonPlan,
    speech,
    notifications,
    accessibility,
    script: parsed.script,
    dialect: parsed.dialect,
  });

  return { profile, explanation: explain.build() };
}
