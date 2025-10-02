export function makeUser(overrides: Partial<any> = {}) {
  return {
    id: crypto.randomUUID(),
    email: 'test@example.com',
    name: 'Test User',
    nativeLanguage: 'en',
    targetLanguage: 'pa',
    proficiencyLevel: 'beginner',
    createdAt: Date.now(),
    ...overrides,
  };
}
