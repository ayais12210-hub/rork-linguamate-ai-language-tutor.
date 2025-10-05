export function makeUser(overrides: Partial<any> = {}) {
  return {
    id: crypto.randomUUID(),
    email: 'test@example.com',
    name: 'Test User',
    nativeLanguage: 'en',
    targetLanguage: 'pa',
    proficiencyLevel: 'beginner',
    createdAt: Date.now(),
    xp: 0,
    ...overrides,
  };
}

export function makeUserProfile(overrides: Partial<any> = {}) {
  return {
    preferences: {
      dailyGoal: 20,
      ...overrides.preferences,
    },
    stats: {
      lessonsCompleted: 0,
      ...overrides.stats,
    },
    ...overrides,
  };
}
