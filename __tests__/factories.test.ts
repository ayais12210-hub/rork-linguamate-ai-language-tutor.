import { makeLesson, makeExercise, makeLessonList, makeUser, makeUserProgress } from '../tests/factories';

describe('Test Factories', () => {
  describe('makeExercise', () => {
    it('should create a valid exercise with defaults', () => {
      const exercise = makeExercise();

      expect(exercise).toHaveProperty('id');
      expect(exercise).toHaveProperty('type');
      expect(exercise).toHaveProperty('prompt');
      expect(exercise).toHaveProperty('answer');
      expect(exercise.type).toBe('mcq');
    });

    it('should allow overriding properties', () => {
      const exercise = makeExercise({
        type: 'translation',
        prompt: 'Custom prompt',
      });

      expect(exercise.type).toBe('translation');
      expect(exercise.prompt).toBe('Custom prompt');
    });
  });

  describe('makeLesson', () => {
    it('should create a valid lesson with defaults', () => {
      const lesson = makeLesson();

      expect(lesson).toHaveProperty('id');
      expect(lesson).toHaveProperty('title');
      expect(lesson).toHaveProperty('language');
      expect(lesson).toHaveProperty('level');
      expect(lesson).toHaveProperty('exercises');
      expect(lesson.exercises).toHaveLength(1);
      expect(lesson.xpReward).toBe(10);
    });

    it('should allow custom exercises', () => {
      const customExercises = [
        makeExercise({ type: 'translation' }),
        makeExercise({ type: 'listening' }),
      ];

      const lesson = makeLesson({ exercises: customExercises });

      expect(lesson.exercises).toHaveLength(2);
      expect(lesson.exercises[0].type).toBe('translation');
      expect(lesson.exercises[1].type).toBe('listening');
    });
  });

  describe('makeLessonList', () => {
    it('should create multiple lessons', () => {
      const lessons = makeLessonList(5);

      expect(lessons).toHaveLength(5);
      lessons.forEach((lesson) => {
        expect(lesson).toHaveProperty('id');
        expect(lesson).toHaveProperty('title');
      });
    });

    it('should create lessons with varying levels', () => {
      const lessons = makeLessonList(5);
      const levels = lessons.map((l) => l.level);

      expect(levels).toContain('A1');
      expect(levels).toContain('A2');
    });
  });

  describe('makeUser', () => {
    it('should create a valid user', () => {
      const user = makeUser();

      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('email');
      expect(user).toHaveProperty('name');
      expect(user.email).toContain('@');
    });

    it('should allow overriding user properties', () => {
      const user = makeUser({
        email: 'custom@example.com',
        name: 'Custom Name',
      });

      expect(user.email).toBe('custom@example.com');
      expect(user.name).toBe('Custom Name');
    });
  });

  describe('makeUserProgress', () => {
    it('should create valid user progress', () => {
      const progress = makeUserProgress();

      expect(progress).toHaveProperty('userId');
      expect(progress).toHaveProperty('totalXp');
      expect(progress).toHaveProperty('level');
      expect(progress).toHaveProperty('streak');
      expect(progress.totalXp).toBeGreaterThanOrEqual(0);
      expect(progress.level).toBeGreaterThanOrEqual(1);
    });
  });
});
