import { usePreferences } from '@/state/preferencesStore';

export type ExerciseType =
  | 'mcq'
  | 'typing'
  | 'gap'
  | 'pairs'
  | 'order'
  | 'listen'
  | 'speak';

export function pickExerciseType(): ExerciseType {
  const mix = usePreferences.getState().params.exerciseMix;
  const r = Math.random();
  let acc = 0;
  for (const [type, w] of mix) {
    acc += w;
    if (r <= acc) return type as ExerciseType;
  }
  return mix[0][0] as ExerciseType;
}

export const getSessionItemCount = () =>
  usePreferences.getState().params.itemsPerSession;

export const getSpeechRate = () => usePreferences.getState().params.speechRate;

export const showHints = () => usePreferences.getState().params.showHints;

export const showTranslations = () =>
  usePreferences.getState().params.showTranslations;

export const getMaxRetries = () => usePreferences.getState().params.maxRetries;

export const scoring = () => {
  const p = usePreferences.getState().params;
  return { xpPerCorrect: p.xpPerCorrect, penaltyPerWrong: p.penaltyPerWrong };
};

export const getSRSIntervals = () =>
  usePreferences.getState().params.srsIntervals;

export const getTargetAccuracy = () =>
  usePreferences.getState().params.targetAccuracy;
