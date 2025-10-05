import { useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUser } from './user-store';

export interface LearningSession {
  id: string;
  moduleId: string;
  startTime: string;
  endTime?: string;
  duration: number;
  questionsAnswered: number;
  correctAnswers: number;
  xpEarned: number;
  wordsLearned: string[];
  mistakes: SessionMistake[];
  completed: boolean;
}

export interface SessionMistake {
  question: string;
  userAnswer: string;
  correctAnswer: string;
  explanation: string;
  timestamp: string;
}

export interface SessionStats {
  totalSessions: number;
  averageDuration: number;
  averageAccuracy: number;
  totalXpEarned: number;
  totalWordsLearned: number;
  bestStreak: number;
  currentStreak: number;
}

const SESSION_STORAGE_KEY = 'linguamate_learning_sessions';

export const useLearningSession = () => {
  const [currentSession, setCurrentSession] = useState<LearningSession | null>(null);
  const [sessions, setSessions] = useState<LearningSession[]>([]);
  const [sessionStats, setSessionStats] = useState<SessionStats>({
    totalSessions: 0,
    averageDuration: 0,
    averageAccuracy: 0,
    totalXpEarned: 0,
    totalWordsLearned: 0,
    bestStreak: 0,
    currentStreak: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const sessionTimer = useRef<NodeJS.Timeout | null>(null);
  const { user, updateStats } = useUser();

  useEffect(() => {
    loadSessions();
    return () => {
      if (sessionTimer.current) {
        clearInterval(sessionTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    if (sessions.length === 0) return;

    const totalDuration = sessions.reduce((sum, s) => sum + s.duration, 0);
    const totalQuestions = sessions.reduce((sum, s) => sum + s.questionsAnswered, 0);
    const totalCorrect = sessions.reduce((sum, s) => sum + s.correctAnswers, 0);
    const totalXp = sessions.reduce((sum, s) => sum + s.xpEarned, 0);
    const totalWords = sessions.reduce((sum, s) => sum + s.wordsLearned.length, 0);

    // Calculate streaks
    const sortedSessions = [...sessions].sort((a, b) => 
      new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );

    let currentStreak = 0;
    let bestStreak = 0;
    let tempStreak = 0;
    let lastDate: Date | null = null;

    sortedSessions.forEach(session => {
      const sessionDate = new Date(session.startTime);
      sessionDate.setHours(0, 0, 0, 0);

      if (!lastDate) {
        tempStreak = 1;
        currentStreak = 1;
      } else {
        const dayDiff = Math.floor((lastDate.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24));
        if (dayDiff === 1) {
          tempStreak++;
          if (currentStreak === 0 || currentStreak === tempStreak - 1) {
            currentStreak = tempStreak;
          }
        } else if (dayDiff > 1) {
          bestStreak = Math.max(bestStreak, tempStreak);
          tempStreak = 1;
          if (currentStreak > 0 && dayDiff > 1) {
            currentStreak = 0;
          }
        }
      }

      lastDate = sessionDate;
    });

    bestStreak = Math.max(bestStreak, tempStreak);

    setSessionStats({
      totalSessions: sessions.length,
      averageDuration: Math.round(totalDuration / sessions.length),
      averageAccuracy: totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0,
      totalXpEarned: totalXp,
      totalWordsLearned: totalWords,
      bestStreak,
      currentStreak,
    });
  }, [sessions]);

  const loadSessions = async () => {
    try {
      setIsLoading(true);
      const stored = await AsyncStorage.getItem(SESSION_STORAGE_KEY);
      if (stored) {
        const parsedSessions = JSON.parse(stored);
        setSessions(parsedSessions);
      }
    } catch (error) {
      if (__DEV__) {

        console.error('Error loading sessions:', error);

      }
    } finally {
      setIsLoading(false);
    }
  };

  const saveSessions = async (updatedSessions: LearningSession[]) => {
    try {
      await AsyncStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(updatedSessions));
      setSessions(updatedSessions);
    } catch (error) {
      if (__DEV__) {

        console.error('Error saving sessions:', error);

      }
    }
  };

  const startSession = (moduleId: string) => {
    const newSession: LearningSession = {
      id: Date.now().toString(),
      moduleId,
      startTime: new Date().toISOString(),
      duration: 0,
      questionsAnswered: 0,
      correctAnswers: 0,
      xpEarned: 0,
      wordsLearned: [],
      mistakes: [],
      completed: false,
    };

    setCurrentSession(newSession);

    // Start duration timer
    sessionTimer.current = setInterval(() => {
      setCurrentSession(prev => {
        if (!prev) return null;
        return {
          ...prev,
          duration: prev.duration + 1,
        };
      });
    }, 1000);

    return newSession;
  };

  const updateSession = (updates: Partial<LearningSession>) => {
    if (!currentSession) return;

    const updatedSession = {
      ...currentSession,
      ...updates,
    };

    setCurrentSession(updatedSession);
  };

  const answerQuestion = (isCorrect: boolean, xpReward: number = 10, word?: string, mistake?: SessionMistake) => {
    if (!currentSession) return;

    const updates: Partial<LearningSession> = {
      questionsAnswered: currentSession.questionsAnswered + 1,
      correctAnswers: currentSession.correctAnswers + (isCorrect ? 1 : 0),
      xpEarned: currentSession.xpEarned + (isCorrect ? xpReward : 0),
    };

    if (word && isCorrect) {
      updates.wordsLearned = [...currentSession.wordsLearned, word];
    }

    if (mistake && !isCorrect) {
      updates.mistakes = [...currentSession.mistakes, mistake];
    }

    updateSession(updates);
  };

  const endSession = async () => {
    if (!currentSession) return null;

    // Stop timer
    if (sessionTimer.current) {
      clearInterval(sessionTimer.current);
      sessionTimer.current = null;
    }

    const completedSession: LearningSession = {
      ...currentSession,
      endTime: new Date().toISOString(),
      completed: true,
    };

    // Save session
    const updatedSessions = [...sessions, completedSession];
    await saveSessions(updatedSessions);

    // Update user stats

    updateStats({
      xpPoints: (user.stats?.xpPoints || 0) + completedSession.xpEarned,
      wordsLearned: (user.stats?.wordsLearned || 0) + completedSession.wordsLearned.length,
      totalChats: (user.stats?.totalChats || 0) + 1,
    });

    setCurrentSession(null);
    return completedSession;
  };

  const pauseSession = () => {
    if (sessionTimer.current) {
      clearInterval(sessionTimer.current);
      sessionTimer.current = null;
    }
  };

  const resumeSession = () => {
    if (!currentSession || sessionTimer.current) return;

    sessionTimer.current = setInterval(() => {
      setCurrentSession(prev => {
        if (!prev) return null;
        return {
          ...prev,
          duration: prev.duration + 1,
        };
      });
    }, 1000);
  };



  const getSessionHistory = (moduleId?: string, limit?: number) => {
    let filteredSessions = moduleId
      ? sessions.filter(s => s.moduleId === moduleId)
      : sessions;

    filteredSessions = filteredSessions.sort((a, b) =>
      new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );

    if (limit) {
      filteredSessions = filteredSessions.slice(0, limit);
    }

    return filteredSessions;
  };

  const getModuleProgress = (moduleId: string) => {
    const moduleSessions = sessions.filter(s => s.moduleId === moduleId);
    
    if (moduleSessions.length === 0) {
      return {
        sessionsCompleted: 0,
        totalXpEarned: 0,
        averageAccuracy: 0,
        totalWordsLearned: 0,
        lastPlayed: null,
      };
    }

    const totalQuestions = moduleSessions.reduce((sum, s) => sum + s.questionsAnswered, 0);
    const totalCorrect = moduleSessions.reduce((sum, s) => sum + s.correctAnswers, 0);
    const totalXp = moduleSessions.reduce((sum, s) => sum + s.xpEarned, 0);
    const totalWords = moduleSessions.reduce((sum, s) => sum + s.wordsLearned.length, 0);
    const lastSession = moduleSessions.sort((a, b) =>
      new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    )[0];

    return {
      sessionsCompleted: moduleSessions.length,
      totalXpEarned: totalXp,
      averageAccuracy: totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0,
      totalWordsLearned: totalWords,
      lastPlayed: lastSession.startTime,
    };
  };

  const getMistakePatterns = () => {
    const allMistakes = sessions.flatMap(s => s.mistakes);
    const mistakeFrequency = new Map<string, number>();

    allMistakes.forEach(mistake => {
      const key = mistake.explanation;
      mistakeFrequency.set(key, (mistakeFrequency.get(key) || 0) + 1);
    });

    return Array.from(mistakeFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([pattern, count]) => ({ pattern, count }));
  };

  const clearSessions = async () => {
    try {
      await AsyncStorage.removeItem(SESSION_STORAGE_KEY);
      setSessions([]);
      setCurrentSession(null);
    } catch (error) {
      if (__DEV__) {

        console.error('Error clearing sessions:', error);

      }
    }
  };

  return {
    currentSession,
    sessions,
    sessionStats,
    isLoading,
    startSession,
    updateSession,
    answerQuestion,
    endSession,
    pauseSession,
    resumeSession,
    getSessionHistory,
    getModuleProgress,
    getMistakePatterns,
    clearSessions,
  };
};