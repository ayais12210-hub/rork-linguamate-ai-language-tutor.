import { useState, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUser } from './user-store';

export interface VocabularyWord {
  id: string;
  word: string;
  translation: string;
  pronunciation?: string;
  partOfSpeech: 'noun' | 'verb' | 'adjective' | 'adverb' | 'pronoun' | 'preposition' | 'conjunction' | 'interjection';
  definition: string;
  examples: string[];
  synonyms: string[];
  antonyms: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  imageUrl?: string;
  audioUrl?: string;
  learned: boolean;
  masteryLevel: number; // 0-5
  lastReviewed?: string;
  nextReview?: string;
  timesReviewed: number;
  correctCount: number;
  incorrectCount: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VocabularyCategory {
  id: string;
  name: string;
  icon: string;
  wordCount: number;
  learnedCount: number;
  color: string;
}

export interface VocabularyStats {
  totalWords: number;
  learnedWords: number;
  masteredWords: number;
  reviewsDue: number;
  averageMastery: number;
  studyStreak: number;
  wordsLearnedToday: number;
  wordsReviewedToday: number;
}

export interface ReviewSession {
  wordId: string;
  correct: boolean;
  responseTime: number;
  timestamp: string;
}

const VOCABULARY_STORAGE_KEY = 'linguamate_vocabulary';
const REVIEW_SESSIONS_KEY = 'linguamate_review_sessions';
const VOCABULARY_STATS_KEY = 'linguamate_vocabulary_stats';

// Spaced repetition intervals (in days)
const SPACED_REPETITION_INTERVALS = [1, 3, 7, 14, 30, 90];

export const useVocabulary = () => {
  const [vocabulary, setVocabulary] = useState<VocabularyWord[]>([]);
  const [reviewSessions, setReviewSessions] = useState<ReviewSession[]>([]);
  const [stats, setStats] = useState<VocabularyStats>({
    totalWords: 0,
    learnedWords: 0,
    masteredWords: 0,
    reviewsDue: 0,
    averageMastery: 0,
    studyStreak: 0,
    wordsLearnedToday: 0,
    wordsReviewedToday: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'alphabetical' | 'mastery' | 'recent'>('recent');
  const { user, updateStats } = useUser();

  useEffect(() => {
    loadVocabulary();
    loadReviewSessions();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [vocabulary, reviewSessions]);

  const loadVocabulary = async () => {
    try {
      setIsLoading(true);
      const stored = await AsyncStorage.getItem(VOCABULARY_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setVocabulary(parsed);
      }
    } catch (error) {
      if (__DEV__) {

        console.error('Error loading vocabulary:', error);

      }
    } finally {
      setIsLoading(false);
    }
  };

  const loadReviewSessions = async () => {
    try {
      const stored = await AsyncStorage.getItem(REVIEW_SESSIONS_KEY);
      if (stored) {
        setReviewSessions(JSON.parse(stored));
      }
    } catch (error) {
      if (__DEV__) {

        console.error('Error loading review sessions:', error);

      }
    }
  };

  const saveVocabulary = async (words: VocabularyWord[]) => {
    try {
      await AsyncStorage.setItem(VOCABULARY_STORAGE_KEY, JSON.stringify(words));
      setVocabulary(words);
    } catch (error) {
      if (__DEV__) {

        console.error('Error saving vocabulary:', error);

      }
    }
  };

  const saveReviewSessions = async (sessions: ReviewSession[]) => {
    try {
      await AsyncStorage.setItem(REVIEW_SESSIONS_KEY, JSON.stringify(sessions));
      setReviewSessions(sessions);
    } catch (error) {
      if (__DEV__) {

        console.error('Error saving review sessions:', error);

      }
    }
  };

  const addWord = async (word: Omit<VocabularyWord, 'id' | 'createdAt' | 'updatedAt' | 'masteryLevel' | 'timesReviewed' | 'correctCount' | 'incorrectCount' | 'learned'>) => {
    const newWord: VocabularyWord = {
      ...word,
      id: Date.now().toString(),
      learned: false,
      masteryLevel: 0,
      timesReviewed: 0,
      correctCount: 0,
      incorrectCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [...vocabulary, newWord];
    await saveVocabulary(updated);
    
    // Update user stats
    updateStats({
      wordsLearned: (user.stats?.wordsLearned || 0) + 1,
    });

    return newWord;
  };

  const updateWord = async (wordId: string, updates: Partial<VocabularyWord>) => {
    const updated = vocabulary.map(word =>
      word.id === wordId
        ? { ...word, ...updates, updatedAt: new Date().toISOString() }
        : word
    );
    await saveVocabulary(updated);
  };

  const deleteWord = async (wordId: string) => {
    const updated = vocabulary.filter(word => word.id !== wordId);
    await saveVocabulary(updated);
  };

  const markAsLearned = async (wordId: string) => {
    await updateWord(wordId, {
      learned: true,
      lastReviewed: new Date().toISOString(),
      nextReview: calculateNextReview(0),
    });
  };

  const reviewWord = async (wordId: string, correct: boolean, responseTime: number) => {
    const word = vocabulary.find(w => w.id === wordId);
    if (!word) return;

    const newMasteryLevel = correct
      ? Math.min(5, word.masteryLevel + 1)
      : Math.max(0, word.masteryLevel - 1);

    const reviewSession: ReviewSession = {
      wordId,
      correct,
      responseTime,
      timestamp: new Date().toISOString(),
    };

    await updateWord(wordId, {
      masteryLevel: newMasteryLevel,
      lastReviewed: new Date().toISOString(),
      nextReview: calculateNextReview(newMasteryLevel),
      timesReviewed: word.timesReviewed + 1,
      correctCount: word.correctCount + (correct ? 1 : 0),
      incorrectCount: word.incorrectCount + (correct ? 0 : 1),
    });

    const updatedSessions = [...reviewSessions, reviewSession];
    await saveReviewSessions(updatedSessions);

    // Update user XP
    if (correct) {
      updateStats({
        xpPoints: (user.stats?.xpPoints || 0) + 5,
      });
    }
  };

  const calculateNextReview = (masteryLevel: number): string => {
    const daysToAdd = SPACED_REPETITION_INTERVALS[Math.min(masteryLevel, SPACED_REPETITION_INTERVALS.length - 1)];
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + daysToAdd);
    return nextDate.toISOString();
  };

  const getWordsDueForReview = (): VocabularyWord[] => {
    const now = new Date();
    return vocabulary.filter(word => {
      if (!word.learned || !word.nextReview) return false;
      return new Date(word.nextReview) <= now;
    });
  };

  const calculateStats = () => {
    const learned = vocabulary.filter(w => w.learned);
    const mastered = vocabulary.filter(w => w.masteryLevel >= 4);
    const dueForReview = getWordsDueForReview();
    
    const totalMastery = vocabulary.reduce((sum, w) => sum + w.masteryLevel, 0);
    const avgMastery = vocabulary.length > 0 ? totalMastery / vocabulary.length : 0;

    // Calculate today's stats
    const today = new Date().toDateString();
    const todaysSessions = reviewSessions.filter(s => 
      new Date(s.timestamp).toDateString() === today
    );
    const todaysLearned = vocabulary.filter(w => 
      w.createdAt && new Date(w.createdAt).toDateString() === today
    );

    setStats({
      totalWords: vocabulary.length,
      learnedWords: learned.length,
      masteredWords: mastered.length,
      reviewsDue: dueForReview.length,
      averageMastery: avgMastery,
      studyStreak: calculateStudyStreak(),
      wordsLearnedToday: todaysLearned.length,
      wordsReviewedToday: todaysSessions.length,
    });
  };

  const calculateStudyStreak = (): number => {
    if (reviewSessions.length === 0) return 0;

    const sessionDates = [...new Set(
      reviewSessions.map(s => new Date(s.timestamp).toDateString())
    )].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (const dateStr of sessionDates) {
      const sessionDate = new Date(dateStr);
      sessionDate.setHours(0, 0, 0, 0);

      const dayDiff = Math.floor((currentDate.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24));

      if (dayDiff === streak) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  };

  const categories = useMemo((): VocabularyCategory[] => {
    const categoryMap = new Map<string, VocabularyCategory>();

    vocabulary.forEach(word => {
      if (!categoryMap.has(word.category)) {
        categoryMap.set(word.category, {
          id: word.category,
          name: word.category,
          icon: getCategoryIcon(word.category),
          wordCount: 0,
          learnedCount: 0,
          color: getCategoryColor(word.category),
        });
      }

      const cat = categoryMap.get(word.category)!;
      cat.wordCount++;
      if (word.learned) cat.learnedCount++;
    });

    return Array.from(categoryMap.values());
  }, [vocabulary]);

  const filteredVocabulary = useMemo(() => {
    let filtered = [...vocabulary];

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(word =>
        word.word.toLowerCase().includes(query) ||
        word.translation.toLowerCase().includes(query) ||
        word.definition.toLowerCase().includes(query)
      );
    }

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(word => word.category === selectedCategory);
    }

    // Sort
    switch (sortBy) {
      case 'alphabetical':
        filtered.sort((a, b) => a.word.localeCompare(b.word));
        break;
      case 'mastery':
        filtered.sort((a, b) => b.masteryLevel - a.masteryLevel);
        break;
      case 'recent':
        filtered.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
    }

    return filtered;
  }, [vocabulary, searchQuery, selectedCategory, sortBy]);

  const getCategoryIcon = (category: string): string => {
    const icons: Record<string, string> = {
      'Common': '💬',
      'Food': '🍽️',
      'Travel': '✈️',
      'Business': '💼',
      'Education': '📚',
      'Health': '🏥',
      'Technology': '💻',
      'Nature': '🌿',
      'Sports': '⚽',
      'Arts': '🎨',
      'Family': '👨‍👩‍👧‍👦',
      'Shopping': '🛍️',
      'Weather': '☀️',
      'Time': '⏰',
      'Numbers': '🔢',
    };
    return icons[category] || '📝';
  };

  const getCategoryColor = (category: string): string => {
    const colors: Record<string, string> = {
      'Common': '#4CAF50',
      'Food': '#FF9800',
      'Travel': '#2196F3',
      'Business': '#9C27B0',
      'Education': '#3F51B5',
      'Health': '#F44336',
      'Technology': '#00BCD4',
      'Nature': '#8BC34A',
      'Sports': '#FFC107',
      'Arts': '#E91E63',
      'Family': '#795548',
      'Shopping': '#607D8B',
      'Weather': '#03A9F4',
      'Time': '#FF5722',
      'Numbers': '#9E9E9E',
    };
    return colors[category] || '#757575';
  };

  const exportVocabulary = async (): Promise<string> => {
    return JSON.stringify(vocabulary, null, 2);
  };

  const importVocabulary = async (jsonData: string): Promise<boolean> => {
    try {
      const imported = JSON.parse(jsonData);
      if (Array.isArray(imported)) {
        await saveVocabulary(imported);
        return true;
      }
      throw new Error('Invalid vocabulary data format');
    } catch (error) {
      if (__DEV__) {

        console.error('Error importing vocabulary:', error);

      }
      return false;
    }
  };

  const clearVocabulary = async () => {
    await AsyncStorage.removeItem(VOCABULARY_STORAGE_KEY);
    await AsyncStorage.removeItem(REVIEW_SESSIONS_KEY);
    setVocabulary([]);
    setReviewSessions([]);
  };

  return {
    vocabulary: filteredVocabulary,
    allVocabulary: vocabulary,
    categories,
    stats,
    isLoading,
    searchQuery,
    selectedCategory,
    sortBy,
    setSearchQuery,
    setSelectedCategory,
    setSortBy,
    addWord,
    updateWord,
    deleteWord,
    markAsLearned,
    reviewWord,
    getWordsDueForReview,
    exportVocabulary,
    importVocabulary,
    clearVocabulary,
  };
};