export function makeUser(overrides: Partial<any> = {}) {
  return {
    id: crypto.randomUUID(),
    email: 'test@example.com',
    name: 'Test User',
    nativeLanguage: 'en',
    targetLanguage: 'pa',
    proficiencyLevel: 'beginner',
    xp: 0,
    createdAt: Date.now(),
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
    xp: 0,
    createdAt: Date.now(),
    preferences: {
      darkMode: false,
      soundEnabled: true,
      notificationsEnabled: true,
    },
    stats: {
      totalChats: 0,
      streakDays: 0,
      wordsLearned: 0,
      xpPoints: 0,
      lastActiveDate: new Date().toISOString(),
      messagesUsedToday: 0,
      lastMessageDate: new Date().toISOString(),
      badges: [],
    },
    ...overrides,
  };
}
