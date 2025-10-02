import { usePreferences } from '@/state/preferencesStore';

describe('Preferences Store', () => {
  beforeEach(() => {
    usePreferences.getState().setDifficulty('beginner');
    usePreferences.getState().setAutoAdapt(false);
  });

  test('initial difficulty is beginner', () => {
    const { difficulty } = usePreferences.getState();
    expect(difficulty).toBe('beginner');
  });

  test('setDifficulty updates difficulty and params', () => {
    usePreferences.getState().setDifficulty('advanced');
    const { difficulty, params } = usePreferences.getState();
    expect(difficulty).toBe('advanced');
    expect(params.itemsPerSession).toBe(14);
    expect(params.targetAccuracy).toBe(0.9);
  });

  test('getParam returns correct parameter value', () => {
    usePreferences.getState().setDifficulty('intermediate');
    const itemsPerSession = usePreferences.getState().getParam('itemsPerSession');
    expect(itemsPerSession).toBe(10);
  });

  test('setAutoAdapt updates autoAdapt state', () => {
    usePreferences.getState().setAutoAdapt(true);
    const { autoAdapt } = usePreferences.getState();
    expect(autoAdapt).toBe(true);
  });

  test('changing difficulty updates all params', () => {
    usePreferences.getState().setDifficulty('beginner');
    const beginnerParams = usePreferences.getState().params;
    
    usePreferences.getState().setDifficulty('advanced');
    const advancedParams = usePreferences.getState().params;
    
    expect(advancedParams.itemsPerSession).toBeGreaterThan(beginnerParams.itemsPerSession);
    expect(advancedParams.targetAccuracy).toBeGreaterThan(beginnerParams.targetAccuracy);
    expect(advancedParams.maxRetries).toBeLessThan(beginnerParams.maxRetries);
  });
});
