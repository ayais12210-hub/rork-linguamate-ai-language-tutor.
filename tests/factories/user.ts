export function makeUser(overrides: Partial<any> = {}) {
  return {
    id: crypto.randomUUID(),
    email: 'test@example.com',
    name: 'Test User',
    targetLanguage: 'pa',
    nativeLanguage: 'en',
    level: 'A1',
    xp: 0,
    streak: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides
  };
}

export function makeUserProfile(overrides: Partial<any> = {}) {
  return {
    ...makeUser(),
    preferences: {
      dailyGoal: 20,
      notifications: true,
      soundEffects: true,
      theme: 'light'
    },
    stats: {
      lessonsCompleted: 0,
      totalXp: 0,
      currentStreak: 0,
      longestStreak: 0
    },
    ...overrides
  };
}
