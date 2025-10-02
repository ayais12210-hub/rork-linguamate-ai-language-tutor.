import { faker } from '@faker-js/faker';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: number;
  preferences?: {
    language?: string;
    theme?: 'light' | 'dark';
    notifications?: boolean;
  };
}

export interface UserProgress {
  userId: string;
  totalXp: number;
  level: number;
  streak: number;
  lessonsCompleted: number;
  lastActiveAt: number;
}

export function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: faker.string.uuid(),
    email: faker.internet.email(),
    name: faker.person.fullName(),
    avatar: faker.image.avatar(),
    createdAt: Date.now(),
    preferences: {
      language: 'pa',
      theme: 'light',
      notifications: true,
    },
    ...overrides,
  };
}

export function makeUserProgress(overrides: Partial<UserProgress> = {}): UserProgress {
  return {
    userId: faker.string.uuid(),
    totalXp: faker.number.int({ min: 0, max: 10000 }),
    level: faker.number.int({ min: 1, max: 50 }),
    streak: faker.number.int({ min: 0, max: 365 }),
    lessonsCompleted: faker.number.int({ min: 0, max: 100 }),
    lastActiveAt: Date.now(),
    ...overrides,
  };
}

export function makeUserList(count: number = 10): User[] {
  return Array.from({ length: count }, () => makeUser());
}
