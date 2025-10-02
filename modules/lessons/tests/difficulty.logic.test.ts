import {
  getSessionItemCount,
  pickExerciseType,
  showHints,
  showTranslations,
  scoring,
} from '../logic/difficulty';
import { usePreferences } from '@/state/preferencesStore';

describe('Lesson Difficulty Logic', () => {
  beforeEach(() => {
    usePreferences.getState().setDifficulty('beginner');
  });

  test('session items depend on difficulty', () => {
    usePreferences.getState().setDifficulty('beginner');
    expect(getSessionItemCount()).toBe(6);

    usePreferences.getState().setDifficulty('intermediate');
    expect(getSessionItemCount()).toBe(10);

    usePreferences.getState().setDifficulty('advanced');
    expect(getSessionItemCount()).toBe(14);
  });

  test('exercise picker returns allowed types', () => {
    const allowedTypes = ['mcq', 'typing', 'gap', 'pairs', 'order', 'listen', 'speak'];
    const type = pickExerciseType();
    expect(allowedTypes).toContain(type);
  });

  test('hints visibility depends on difficulty', () => {
    usePreferences.getState().setDifficulty('beginner');
    expect(showHints()).toBe(true);

    usePreferences.getState().setDifficulty('advanced');
    expect(showHints()).toBe(false);
  });

  test('translations visibility depends on difficulty', () => {
    usePreferences.getState().setDifficulty('beginner');
    expect(showTranslations()).toBe(true);

    usePreferences.getState().setDifficulty('intermediate');
    expect(showTranslations()).toBe(false);
  });

  test('scoring values depend on difficulty', () => {
    usePreferences.getState().setDifficulty('beginner');
    const beginnerScoring = scoring();
    expect(beginnerScoring.xpPerCorrect).toBe(8);
    expect(beginnerScoring.penaltyPerWrong).toBe(0);

    usePreferences.getState().setDifficulty('advanced');
    const advancedScoring = scoring();
    expect(advancedScoring.xpPerCorrect).toBe(12);
    expect(advancedScoring.penaltyPerWrong).toBe(4);
  });
});
