import {
  evaluateSessionAccuracy,
  maybeAdjustDifficulty,
} from '../logic/adaptive';
import { usePreferences } from '@/state/preferencesStore';

describe('Adaptive Difficulty', () => {
  beforeEach(() => {
    usePreferences.getState().setDifficulty('beginner');
    usePreferences.getState().setAutoAdapt(true);
  });

  test('promotes when accuracy exceeds target', () => {
    usePreferences.getState().setDifficulty('beginner');
    const signal = evaluateSessionAccuracy(9, 10);
    expect(signal).toBe('promote');
  });

  test('demotes when accuracy is below target', () => {
    usePreferences.getState().setDifficulty('intermediate');
    const signal = evaluateSessionAccuracy(6, 10);
    expect(signal).toBe('demote');
  });

  test('stays when accuracy is near target', () => {
    usePreferences.getState().setDifficulty('intermediate');
    const signal = evaluateSessionAccuracy(8, 10);
    expect(signal).toBe('stay');
  });

  test('adjusts difficulty when auto-adapt is enabled', () => {
    usePreferences.getState().setDifficulty('beginner');
    usePreferences.getState().setAutoAdapt(true);
    
    const newDiff = maybeAdjustDifficulty('promote', 'session-123', 0.9);
    expect(newDiff).toBe('intermediate');
    expect(usePreferences.getState().difficulty).toBe('intermediate');
  });

  test('does not adjust when auto-adapt is disabled', () => {
    usePreferences.getState().setDifficulty('beginner');
    usePreferences.getState().setAutoAdapt(false);
    
    const newDiff = maybeAdjustDifficulty('promote', 'session-123', 0.9);
    expect(newDiff).toBeUndefined();
    expect(usePreferences.getState().difficulty).toBe('beginner');
  });

  test('does not promote beyond advanced', () => {
    usePreferences.getState().setDifficulty('advanced');
    usePreferences.getState().setAutoAdapt(true);
    
    const newDiff = maybeAdjustDifficulty('promote', 'session-123', 0.95);
    expect(newDiff).toBeUndefined();
    expect(usePreferences.getState().difficulty).toBe('advanced');
  });

  test('does not demote below beginner', () => {
    usePreferences.getState().setDifficulty('beginner');
    usePreferences.getState().setAutoAdapt(true);
    
    const newDiff = maybeAdjustDifficulty('demote', 'session-123', 0.5);
    expect(newDiff).toBeUndefined();
    expect(usePreferences.getState().difficulty).toBe('beginner');
  });
});
