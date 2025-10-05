import { makeLesson, makeExercise, makeUser, makeUserProfile } from '../tests/factories';

describe('Test Factories', () => {
  describe('makeLesson', () => {
    test('creates valid lesson with defaults', () => {
      const lesson = makeLesson();
      expect(lesson).toHaveProperty('id');
      expect(lesson).toHaveProperty('title');
      expect(lesson).toHaveProperty('language', 'pa');
      expect(lesson).toHaveProperty('level', 'A1');
      expect(lesson.exercises).toHaveLength(1);
      expect(lesson.xpReward).toBe(10);
    });

    test('accepts overrides', () => {
      const lesson = makeLesson({
        title: 'Custom Title',
        xpReward: 50,
        level: 'B1'
      });
      expect(lesson.title).toBe('Custom Title');
      expect(lesson.xpReward).toBe(50);
      expect(lesson.level).toBe('B1');
    });
  });

  describe('makeExercise', () => {
    test('creates valid exercise with defaults', () => {
      const exercise = makeExercise();
      expect(exercise).toHaveProperty('id');
      expect(exercise).toHaveProperty('type', 'mcq');
      expect(exercise).toHaveProperty('prompt');
      expect(exercise.options).toHaveLength(3);
      expect(exercise).toHaveProperty('answer');
    });

    test('accepts overrides', () => {
      const exercise = makeExercise({
        type: 'fill-blank',
        prompt: 'Custom prompt'
      });
      expect(exercise.type).toBe('fill-blank');
      expect(exercise.prompt).toBe('Custom prompt');
    });
  });

  describe('makeUser', () => {
    test('creates valid user with defaults', () => {
      const user = makeUser();
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('email');
      expect(user).toHaveProperty('name');
      expect(user.targetLanguage).toBe('pa');
      expect(user.xp).toBe(0);
    });

    test('accepts overrides', () => {
      const user = makeUser({
        email: 'custom@example.com',
        xp: 500
      });
      expect(user.email).toBe('custom@example.com');
      expect(user.xp).toBe(500);
    });
  });

  describe('makeUserProfile', () => {
    test('creates valid user profile with preferences and stats', () => {
      const profile = makeUserProfile();
      expect(profile).toHaveProperty('preferences');
      expect(profile).toHaveProperty('stats');
      expect(profile.preferences).toHaveProperty('darkMode', false);
      expect(profile.stats).toHaveProperty('totalChats', 0);
    });
  });
});
