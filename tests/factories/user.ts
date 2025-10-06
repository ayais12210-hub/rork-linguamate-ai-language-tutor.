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
    ...makeUser(overrides),
    preferences: {
      dailyGoal: 20,
      notifications: true,
      ...(overrides.preferences ?? {}),
    },
    stats: {
      lessonsCompleted: 0,
      streak: 0,
      totalXp: 0,
      ...(overrides.stats ?? {}),
    },
  };
}
