import { usePreferences } from '@/state/preferencesStore';
import { Difficulty } from '@/schemas/difficulty.schema';

export type DialogueParams = {
  maxTurns: number;
  hintMode: 'none' | 'passive' | 'active';
  coachTone: 'gentle' | 'neutral' | 'strict';
  targetCER: number;
  ttsRate: number;
  sttLanguage: string;
  requiredKeywords: number;
};

const PARAMS_BY_DIFFICULTY: Record<
  Difficulty,
  Omit<DialogueParams, 'sttLanguage' | 'ttsRate'>
> = {
  beginner: {
    maxTurns: 8,
    hintMode: 'active',
    coachTone: 'gentle',
    targetCER: 0.25,
    requiredKeywords: 1,
  },
  intermediate: {
    maxTurns: 12,
    hintMode: 'passive',
    coachTone: 'neutral',
    targetCER: 0.18,
    requiredKeywords: 2,
  },
  advanced: {
    maxTurns: 16,
    hintMode: 'none',
    coachTone: 'strict',
    targetCER: 0.12,
    requiredKeywords: 3,
  },
};

export function getDialogueParams(lang: string): DialogueParams {
  const prefs = usePreferences.getState();
  const base = PARAMS_BY_DIFFICULTY[prefs.difficulty];
  return {
    ...base,
    ttsRate: prefs.params.speechRate,
    sttLanguage: lang,
  };
}
