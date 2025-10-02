import { faker } from '@faker-js/faker';

export interface Exercise {
  id: string;
  type: 'mcq' | 'fill-blank' | 'translation' | 'listening';
  prompt: string;
  options?: string[];
  answer: string;
  explanation?: string;
}

export interface Lesson {
  id: string;
  language: string;
  title: string;
  level: string;
  exercises: Exercise[];
  xpReward: number;
  createdAt: number;
  description?: string;
  duration?: number;
}

export function makeExercise(overrides: Partial<Exercise> = {}): Exercise {
  return {
    id: faker.string.uuid(),
    type: 'mcq',
    prompt: 'What is the Punjabi word for "Hello"?',
    options: ['Sat Sri Akal', 'Hola', 'Hello', 'Bonjour'],
    answer: 'Sat Sri Akal',
    explanation: 'Sat Sri Akal is the traditional Punjabi greeting.',
    ...overrides,
  };
}

export function makeLesson(overrides: Partial<Lesson> = {}): Lesson {
  return {
    id: faker.string.uuid(),
    language: 'pa',
    title: 'Punjabi A1 Basics',
    level: 'A1',
    exercises: [makeExercise()],
    xpReward: 10,
    createdAt: Date.now(),
    description: 'Learn basic Punjabi greetings and phrases',
    duration: 15,
    ...overrides,
  };
}

export function makeLessonList(count: number = 5): Lesson[] {
  return Array.from({ length: count }, (_, i) =>
    makeLesson({
      title: `Lesson ${i + 1}`,
      level: i < 2 ? 'A1' : i < 4 ? 'A2' : 'B1',
    })
  );
}
