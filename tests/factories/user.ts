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
    id: crypto.randomUUID(),
    preferences: {
      dailyGoal: 20,
      notifications: true,
      soundEffects: true,
      ...overrides.preferences,
    },
    stats: {
      lessonsCompleted: 0,
      totalXp: 0,
      currentStreak: 0,
      longestStreak: 0,
      ...overrides.stats,
    },
    ...overrides,
  };
}
