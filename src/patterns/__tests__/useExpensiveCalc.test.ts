import { renderHook, act } from '@testing-library/react';
import { useExpensiveCalc } from '../memo/useExpensiveCalc';

describe('useExpensiveCalc', () => {
  it('should calculate pronunciation score correctly', () => {
    const { result } = renderHook(() => useExpensiveCalc());
    const { scorePronunciation } = result.current;

    // Test perfect match
    const perfectScore = scorePronunciation('hello', 'hello');
    expect(perfectScore.score).toBe(1);
    expect(perfectScore.accuracy).toBe(100);
    expect(perfectScore.feedback).toContain('Perfect');

    // Test partial match
    const partialScore = scorePronunciation('hello', 'helo');
    expect(partialScore.score).toBeGreaterThan(0);
    expect(partialScore.score).toBeLessThan(1);
    expect(partialScore.accuracy).toBeLessThan(100);

    // Test no match
    const noMatchScore = scorePronunciation('hello', 'world');
    expect(noMatchScore.score).toBeLessThan(0.5);
    expect(noMatchScore.feedback).toContain('practice');
  });

  it('should handle case sensitivity option', () => {
    const { result } = renderHook(() => useExpensiveCalc());
    const { scorePronunciation } = result.current;

    // Case insensitive (default)
    const caseInsensitive = scorePronunciation('Hello', 'hello', { caseSensitive: false });
    expect(caseInsensitive.score).toBe(1);

    // Case sensitive
    const caseSensitive = scorePronunciation('Hello', 'hello', { caseSensitive: true });
    expect(caseSensitive.score).toBeLessThan(1);
  });

  it('should handle punctuation option', () => {
    const { result } = renderHook(() => useExpensiveCalc());
    const { scorePronunciation } = result.current;

    // Ignore punctuation (default)
    const ignorePunctuation = scorePronunciation('Hello, world!', 'Hello world', { ignorePunctuation: true });
    expect(ignorePunctuation.score).toBe(1);

    // Don't ignore punctuation
    const keepPunctuation = scorePronunciation('Hello, world!', 'Hello world', { ignorePunctuation: false });
    expect(keepPunctuation.score).toBeLessThan(1);
  });

  it('should filter lessons by difficulty', () => {
    const { result } = renderHook(() => useExpensiveCalc());
    const { filterLessonsByDifficulty } = result.current;

    const lessons = [
      { id: '1', title: 'Lesson 1', difficulty: 'beginner', content: {} },
      { id: '2', title: 'Lesson 2', difficulty: 'intermediate', content: {} },
      { id: '3', title: 'Lesson 3', difficulty: 'advanced', content: {} },
      { id: '4', title: 'Lesson 4', difficulty: 'beginner', content: {} },
    ];

    const beginnerLessons = filterLessonsByDifficulty(lessons, 'beginner');
    expect(beginnerLessons).toHaveLength(2);
    expect(beginnerLessons.every(lesson => lesson.difficulty === 'beginner')).toBe(true);

    const advancedLessons = filterLessonsByDifficulty(lessons, 'advanced');
    expect(advancedLessons).toHaveLength(1);
    expect(advancedLessons[0].id).toBe('3');
  });

  it('should analyze vocabulary correctly', () => {
    const { result } = renderHook(() => useExpensiveCalc());
    const { analyzeVocabulary } = result.current;

    const text = 'The quick brown fox jumps over the lazy dog';
    const knownWords = new Set(['the', 'quick', 'brown', 'fox', 'jumps', 'over', 'lazy', 'dog']);

    const analysis = analyzeVocabulary(text, knownWords);
    
    expect(analysis.totalWords).toBe(9);
    expect(analysis.uniqueWords).toBe(9);
    expect(analysis.knownWords).toBe(9);
    expect(analysis.unknownWords).toBe(0);
    expect(analysis.vocabularyLevel).toBe(1);
    expect(analysis.difficulty).toBe('beginner');
  });

  it('should analyze vocabulary with unknown words', () => {
    const { result } = renderHook(() => useExpensiveCalc());
    const { analyzeVocabulary } = result.current;

    const text = 'The quick brown fox jumps over the lazy dog';
    const knownWords = new Set(['the', 'quick', 'brown']);

    const analysis = analyzeVocabulary(text, knownWords);
    
    expect(analysis.knownWords).toBe(3);
    expect(analysis.unknownWords).toBe(6);
    expect(analysis.vocabularyLevel).toBe(3/9);
    expect(analysis.difficulty).toBe('advanced');
  });

  it('should tokenize sentences correctly', () => {
    const { result } = renderHook(() => useExpensiveCalc());
    const { tokenizeSentence } = result.current;

    const sentence = 'Hello, world! How are you?';
    const tokenized = tokenizeSentence(sentence);

    expect(tokenized.tokens).toContain('Hello');
    expect(tokenized.tokens).toContain(',');
    expect(tokenized.tokens).toContain('world');
    expect(tokenized.tokens).toContain('!');
    expect(tokenized.wordCount).toBe(5); // Hello, world, How, are, you
    expect(tokenized.punctuation).toContain(',');
    expect(tokenized.punctuation).toContain('!');
    expect(tokenized.words).toContain('Hello');
    expect(tokenized.words).toContain('world');
  });

  it('should calculate progress correctly', () => {
    const { result } = renderHook(() => useExpensiveCalc());
    const { calculateProgress } = result.current;

    // Basic progress
    const basicProgress = calculateProgress(3, 10);
    expect(basicProgress.percentage).toBe(30);
    expect(basicProgress.isComplete).toBe(false);
    expect(basicProgress.remaining).toBe(7);

    // Complete progress
    const completeProgress = calculateProgress(10, 10);
    expect(completeProgress.percentage).toBe(100);
    expect(completeProgress.isComplete).toBe(true);
    expect(completeProgress.remaining).toBe(0);

    // Weighted progress
    const weights = [1, 2, 3, 4, 5];
    const weightedProgress = calculateProgress(3, 5, weights);
    expect(weightedProgress.weightedScore).toBe(60); // (1+2+3)/(1+2+3+4+5) * 100
  });

  it('should handle edge cases', () => {
    const { result } = renderHook(() => useExpensiveCalc());
    const { scorePronunciation, analyzeVocabulary, calculateProgress } = result.current;

    // Empty strings
    const emptyScore = scorePronunciation('', '');
    expect(emptyScore.score).toBe(1);

    // Empty text analysis
    const emptyAnalysis = analyzeVocabulary('', new Set());
    expect(emptyAnalysis.totalWords).toBe(0);
    expect(emptyAnalysis.vocabularyLevel).toBe(0);

    // Zero total progress
    const zeroProgress = calculateProgress(0, 0);
    expect(zeroProgress.percentage).toBe(0);
    expect(zeroProgress.isComplete).toBe(true);
  });
});