import { useMemo, useCallback } from 'react';

// Levenshtein distance calculation for pronunciation scoring
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
  
  for (let i = 0; i <= str1.length; i++) {
    matrix[0][i] = i;
  }
  
  for (let j = 0; j <= str2.length; j++) {
    matrix[j][0] = j;
  }
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,     // deletion
        matrix[j - 1][i] + 1,     // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      );
    }
  }
  
  return matrix[str2.length][str1.length];
}

// Phoneme similarity scoring
function calculatePhonemeSimilarity(phonemes1: string[], phonemes2: string[]): number {
  if (phonemes1.length === 0 && phonemes2.length === 0) return 1;
  if (phonemes1.length === 0 || phonemes2.length === 0) return 0;
  
  const maxLength = Math.max(phonemes1.length, phonemes2.length);
  const distance = levenshteinDistance(phonemes1.join(''), phonemes2.join(''));
  return 1 - (distance / maxLength);
}

// Pronunciation scoring result
export interface PronunciationScore {
  score: number; // 0-1, where 1 is perfect
  accuracy: number; // 0-100 percentage
  feedback: string;
  mistakes: Array<{
    position: number;
    expected: string;
    actual: string;
    type: 'substitution' | 'insertion' | 'deletion';
  }>;
}

// Hook for expensive pronunciation calculations
export function useExpensiveCalc() {
  // Memoized pronunciation scoring
  const scorePronunciation = useCallback((
    expected: string,
    actual: string,
    options: {
      caseSensitive?: boolean;
      ignorePunctuation?: boolean;
      phonemeMode?: boolean;
    } = {}
  ): PronunciationScore => {
    const {
      caseSensitive = false,
      ignorePunctuation = true,
      phonemeMode = false
    } = options;

    let processedExpected = expected;
    let processedActual = actual;

    if (!caseSensitive) {
      processedExpected = processedExpected.toLowerCase();
      processedActual = processedActual.toLowerCase();
    }

    if (ignorePunctuation) {
      processedExpected = processedExpected.replace(/[^\w\s]/g, '');
      processedActual = processedActual.replace(/[^\w\s]/g, '');
    }

    if (phonemeMode) {
      // Simple phoneme approximation - in production, use a proper phoneme library
      const expectedPhonemes = processedExpected.split('').filter(c => c !== ' ');
      const actualPhonemes = processedActual.split('').filter(c => c !== ' ');
      
      const similarity = calculatePhonemeSimilarity(expectedPhonemes, actualPhonemes);
      
      return {
        score: similarity,
        accuracy: Math.round(similarity * 100),
        feedback: similarity > 0.8 ? 'Excellent pronunciation!' : 
                 similarity > 0.6 ? 'Good pronunciation, minor improvements needed' :
                 similarity > 0.4 ? 'Fair pronunciation, practice more' :
                 'Needs significant improvement',
        mistakes: [], // Simplified for this example
      };
    }

    // Regular string similarity
    const distance = levenshteinDistance(processedExpected, processedActual);
    const maxLength = Math.max(processedExpected.length, processedActual.length);
    const similarity = maxLength === 0 ? 1 : 1 - (distance / maxLength);

    return {
      score: similarity,
      accuracy: Math.round(similarity * 100),
      feedback: similarity > 0.9 ? 'Perfect!' :
               similarity > 0.7 ? 'Very good!' :
               similarity > 0.5 ? 'Good, keep practicing' :
               'Needs more practice',
      mistakes: [], // Simplified for this example
    };
  }, []);

  // Memoized lesson filtering by difficulty
  const filterLessonsByDifficulty = useCallback((
    lessons: Array<{ id: string; title: string; difficulty: string; content: any }>,
    difficulty: string
  ) => {
    return lessons.filter(lesson => lesson.difficulty === difficulty);
  }, []);

  // Memoized vocabulary analysis
  const analyzeVocabulary = useCallback((
    text: string,
    knownWords: Set<string> = new Set()
  ) => {
    const words = text.toLowerCase().split(/\s+/).filter(word => word.length > 0);
    const uniqueWords = new Set(words);
    const unknownWords = Array.from(uniqueWords).filter(word => !knownWords.has(word));
    const knownWordsCount = words.filter(word => knownWords.has(word)).length;
    
    return {
      totalWords: words.length,
      uniqueWords: uniqueWords.size,
      knownWords: knownWordsCount,
      unknownWords: unknownWords.length,
      vocabularyLevel: words.length > 0 ? (knownWordsCount / words.length) : 0,
      difficulty: unknownWords.length > words.length * 0.3 ? 'advanced' :
                 unknownWords.length > words.length * 0.15 ? 'intermediate' : 'beginner'
    };
  }, []);

  // Memoized sentence tokenization for hints
  const tokenizeSentence = useCallback((sentence: string) => {
    // Simple tokenization - in production, use a proper NLP library
    const tokens = sentence.split(/(\s+|[.,!?;:])/).filter(token => token.trim().length > 0);
    
    return {
      tokens,
      wordCount: tokens.filter(token => /^\w+$/.test(token)).length,
      punctuation: tokens.filter(token => /^[.,!?;:]+$/.test(token)),
      words: tokens.filter(token => /^\w+$/.test(token)),
    };
  }, []);

  // Memoized progress calculation
  const calculateProgress = useCallback((
    completed: number,
    total: number,
    weights?: number[]
  ) => {
    if (total === 0) return { percentage: 0, weightedScore: 0 };
    
    const percentage = (completed / total) * 100;
    
    let weightedScore = percentage;
    if (weights && weights.length === total) {
      const weightedTotal = weights.reduce((sum, weight) => sum + weight, 0);
      const weightedCompleted = weights.slice(0, completed).reduce((sum, weight) => sum + weight, 0);
      weightedScore = weightedTotal > 0 ? (weightedCompleted / weightedTotal) * 100 : 0;
    }
    
    return {
      percentage: Math.round(percentage),
      weightedScore: Math.round(weightedScore),
      isComplete: completed >= total,
      remaining: total - completed,
    };
  }, []);

  return {
    scorePronunciation,
    filterLessonsByDifficulty,
    analyzeVocabulary,
    tokenizeSentence,
    calculateProgress,
  };
}

// Hook for memoized expensive calculations with dependencies
export function useMemoizedCalculation<T, D extends readonly unknown[]>(
  calculation: (...deps: D) => T,
  dependencies: D
): T {
  return useMemo(() => calculation(...dependencies), dependencies);
}

// Hook for debounced expensive calculations
export function useDebouncedCalculation<T>(
  calculation: () => T,
  delay: number,
  dependencies: readonly unknown[]
): T | null {
  const [result, setResult] = React.useState<T | null>(null);
  
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setResult(calculation());
    }, delay);
    
    return () => clearTimeout(timer);
  }, dependencies);
  
  return result;
}

// Import React for the debounced calculation hook
import React from 'react';