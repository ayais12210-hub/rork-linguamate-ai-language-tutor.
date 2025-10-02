export function makeExercise(overrides: Partial<any> = {}) {
  return {
    id: crypto.randomUUID(),
    type: 'mcq',
    prompt: 'Hello?',
    options: ['Sat Sri Akal', 'Hola', 'Hello'],
    answer: 'Sat Sri Akal',
    explanation: 'Sat Sri Akal is the Punjabi greeting',
    ...overrides
  };
}

export function makeLesson(overrides: Partial<any> = {}) {
  return {
    id: crypto.randomUUID(),
    language: 'pa',
    title: 'Punjabi A1 Basics',
    level: 'A1',
    description: 'Learn basic Punjabi greetings and phrases',
    exercises: [makeExercise()],
    xpReward: 10,
    estimatedMinutes: 15,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides
  };
}

export function makeLessonProgress(overrides: Partial<any> = {}) {
  return {
    lessonId: crypto.randomUUID(),
    userId: crypto.randomUUID(),
    completed: false,
    score: 0,
    xpEarned: 0,
    startedAt: Date.now(),
    completedAt: null,
    ...overrides
  };
}
