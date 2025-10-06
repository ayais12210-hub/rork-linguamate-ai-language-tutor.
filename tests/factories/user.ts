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
    email: 'test@example.com',
    name: 'Test User',
    nativeLanguage: 'en',
    targetLanguage: 'pa',
    proficiencyLevel: 'beginner',
    createdAt: Date.now(),
    xp: 0,
    preferences: {
      notifications: true,
      soundEffects: true,
      hapticFeedback: true,
    },
    stats: {
      totalLessons: 0,
      streakDays: 0,
      totalXP: 0,
    },
    ...overrides,
  };
}
