import { TPreferenceProfile, TOnboardingAnswer } from '@/schemas/preferences';

export type RuleTrace = {
  id: string;
  title: string;
  detail?: string;
};

export function buildTrace(answers: TOnboardingAnswer, profile: TPreferenceProfile, notes: string[] = []): RuleTrace[] {
  const traces: RuleTrace[] = [];

  traces.push({ id: 'time', title: `Time per day ${answers.timePerDay} → SRS ${profile.srs.newPerDay}/day, cap ${profile.srs.reviewCap}` });

  if (answers.pronunConfidence === 'low') {
    traces.push({ id: 'speech_low_conf', title: 'Low pronunciation confidence → lenient ASR, slower TTS', detail: `rate=${profile.speech.rate}` });
  }

  if ((answers.level === 'A0' || answers.level === 'A1') && (answers.timePerDay === '20' || answers.timePerDay === '30' || answers.timePerDay === '45+')) {
    traces.push({ id: 'persona_fast_track', title: 'BEGINNER_FAST_TRACK persona' });
  }

  if (answers.timePerDay === '5' || answers.timePerDay === '10' || answers.oftenOffline) {
    traces.push({ id: 'persona_busy', title: 'BUSY_MICROSESSIONS persona' });
  }

  if (answers.focus.speaking >= 35 || answers.pronunConfidence === 'low') {
    traces.push({ id: 'persona_pron', title: 'PRONUNCIATION_FOCUS persona' });
  }

  for (const n of notes) {
    traces.push({ id: `note-${traces.length + 1}`, title: n });
  }

  return traces;
}

export function formatTrace(traces: RuleTrace[]): string {
  return traces.map((t) => `• ${t.title}${t.detail ? ` — ${t.detail}` : ''}`).join('\n');
}
