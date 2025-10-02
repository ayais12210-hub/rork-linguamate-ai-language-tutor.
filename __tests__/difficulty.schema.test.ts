import { DIFFICULTY_PRESETS, DifficultyParams } from '@/schemas/difficulty.schema';

describe('Difficulty Schema', () => {
  test('all presets are valid', () => {
    for (const preset of Object.values(DIFFICULTY_PRESETS)) {
      const result = DifficultyParams.safeParse(preset);
      expect(result.success).toBe(true);
    }
  });

  test('beginner preset has correct values', () => {
    const beginner = DIFFICULTY_PRESETS.beginner;
    expect(beginner.key).toBe('beginner');
    expect(beginner.targetAccuracy).toBe(0.75);
    expect(beginner.maxRetries).toBe(2);
    expect(beginner.showHints).toBe(true);
    expect(beginner.showTranslations).toBe(true);
    expect(beginner.itemsPerSession).toBe(6);
  });

  test('intermediate preset has correct values', () => {
    const intermediate = DIFFICULTY_PRESETS.intermediate;
    expect(intermediate.key).toBe('intermediate');
    expect(intermediate.targetAccuracy).toBe(0.82);
    expect(intermediate.maxRetries).toBe(1);
    expect(intermediate.showHints).toBe(true);
    expect(intermediate.showTranslations).toBe(false);
    expect(intermediate.itemsPerSession).toBe(10);
  });

  test('advanced preset has correct values', () => {
    const advanced = DIFFICULTY_PRESETS.advanced;
    expect(advanced.key).toBe('advanced');
    expect(advanced.targetAccuracy).toBe(0.9);
    expect(advanced.maxRetries).toBe(0);
    expect(advanced.showHints).toBe(false);
    expect(advanced.showTranslations).toBe(false);
    expect(advanced.itemsPerSession).toBe(14);
  });

  test('exercise mix weights sum to approximately 1', () => {
    for (const preset of Object.values(DIFFICULTY_PRESETS)) {
      const sum = preset.exerciseMix.reduce((acc, [, weight]) => acc + weight, 0);
      expect(sum).toBeCloseTo(1, 1);
    }
  });
});
