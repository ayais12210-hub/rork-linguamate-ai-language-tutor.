import { LessonProgressSchema, GetLessonsSchema, QuizSubmitSchema } from '../schemas/lessons';

describe('Lesson Schemas', () => {
  describe('LessonProgressSchema', () => {
    test('valid lesson progress parses', () => {
      const sample = {
        lessonId: crypto.randomUUID(),
        completed: true,
        score: 85,
        timeSpentMs: 120000,
        mistakes: 2
      };
      const res = LessonProgressSchema.safeParse(sample);
      expect(res.success).toBe(true);
    });

    test('rejects invalid score', () => {
      const sample = {
        lessonId: crypto.randomUUID(),
        completed: true,
        score: 150,
        timeSpentMs: 120000
      };
      const res = LessonProgressSchema.safeParse(sample);
      expect(res.success).toBe(false);
    });

    test('rejects negative time spent', () => {
      const sample = {
        lessonId: crypto.randomUUID(),
        completed: true,
        timeSpentMs: -100
      };
      const res = LessonProgressSchema.safeParse(sample);
      expect(res.success).toBe(false);
    });
  });

  describe('GetLessonsSchema', () => {
    test('valid query parses with defaults', () => {
      const sample = {
        language: 'pa'
      };
      const res = GetLessonsSchema.safeParse(sample);
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.page).toBe(1);
        expect(res.data.limit).toBe(20);
      }
    });

    test('rejects invalid page number', () => {
      const sample = {
        page: 0
      };
      const res = GetLessonsSchema.safeParse(sample);
      expect(res.success).toBe(false);
    });
  });

  describe('QuizSubmitSchema', () => {
    test('valid quiz submission parses', () => {
      const sample = {
        quizId: crypto.randomUUID(),
        answers: [
          {
            questionId: crypto.randomUUID(),
            answer: 'Sat Sri Akal',
            timeTakenMs: 5000
          }
        ]
      };
      const res = QuizSubmitSchema.safeParse(sample);
      expect(res.success).toBe(true);
    });

    test('rejects empty answers array', () => {
      const sample = {
        quizId: crypto.randomUUID(),
        answers: []
      };
      const res = QuizSubmitSchema.safeParse(sample);
      expect(res.success).toBe(false);
    });
  });
});
