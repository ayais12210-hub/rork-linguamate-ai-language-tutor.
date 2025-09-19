import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useEffect, useState } from 'react';
import { BADGES } from '@/constants/languages';
import { Badge, User, UserStats, OnboardingData } from '@/types/user';

const USER_STORAGE_KEY = 'linguamate_user';

const defaultUser: User = {
  id: 'guest',
  nativeLanguage: 'en',
  selectedLanguage: '',
  proficiencyLevel: 'beginner',
  isPremium: false,
  onboardingCompleted: false,
  learningGoals: [],
  interests: [],
  preferredTopics: [],
  dailyGoalMinutes: 15,
  stats: {
    totalChats: 0,
    streakDays: 0,
    wordsLearned: 0,
    xpPoints: 0,
    lastActiveDate: '',
    messagesUsedToday: 0,
    lastMessageDate: '',
    badges: [],
  },
  settings: {
    darkMode: false,
    soundEnabled: true,
    notificationsEnabled: true,
  },
};

export const [UserProvider, useUser] = createContextHook(() => {
  const [user, setUser] = useState<User>(defaultUser);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const stored = await AsyncStorage.getItem(USER_STORAGE_KEY);
      if (stored) {
        const parsedUser = JSON.parse(stored);
        setUser(parsedUser);
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveUser = async (updatedUser: User) => {
    try {
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (error) {
      console.error('Error saving user:', error);
    }
  };

  const updateUser = (updates: Partial<User>) => {
    const updatedUser = { ...user, ...updates };
    saveUser(updatedUser);
  };

  const updateStats = (updates: Partial<UserStats>) => {
    const currentStats = user.stats || defaultUser.stats!;
    const updatedStats = { ...currentStats, ...updates };
    const updatedUser = { ...user, stats: updatedStats };
    
    // Check for new badges
    const currentBadges = currentStats.badges || [];
    const newBadges = checkForNewBadges(updatedStats, currentBadges);
    if (newBadges.length > 0) {
      updatedStats.badges = [...(updatedStats.badges || []), ...newBadges];
      updatedUser.stats = updatedStats;
    }
    
    saveUser(updatedUser);
  };

  const checkForNewBadges = (stats: UserStats, currentBadges: Badge[]): Badge[] => {
    const newBadges: Badge[] = [];
    const currentBadgeIds = currentBadges.map(b => b.id);

    BADGES.forEach(badge => {
      if (!currentBadgeIds.includes(badge.id)) {
        const statValue = stats[badge.type as keyof UserStats] as number;
        if (statValue >= badge.requiredValue) {
          newBadges.push({
            id: badge.id,
            name: badge.name,
            description: badge.description,
            icon: badge.icon,
            unlockedAt: new Date().toISOString(),
          });
        }
      }
    });

    return newBadges;
  };

  const canSendMessage = (): boolean => {
    if (user.isPremium) return true;
    
    const stats = user.stats || defaultUser.stats!;
    const today = new Date().toDateString();
    const lastMessageDate = stats.lastMessageDate;
    
    if (lastMessageDate !== today) {
      return true; // New day, reset count
    }
    
    return stats.messagesUsedToday < 5;
  };

  const incrementMessageCount = () => {
    const currentStats = user.stats || defaultUser.stats!;
    const today = new Date().toDateString();
    const isNewDay = currentStats.lastMessageDate !== today;
    
    const newStats = {
      ...currentStats,
      messagesUsedToday: isNewDay ? 1 : currentStats.messagesUsedToday + 1,
      lastMessageDate: today,
      totalChats: currentStats.totalChats + 1,
      xpPoints: currentStats.xpPoints + 10,
    };

    // Update streak
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayString = yesterday.toDateString();
    
    if (isNewDay) {
      if (currentStats.lastActiveDate === yesterdayString) {
        newStats.streakDays = currentStats.streakDays + 1;
      } else if (currentStats.lastActiveDate !== today) {
        newStats.streakDays = 1;
      }
      newStats.lastActiveDate = today;
    }

    updateStats(newStats);
  };

  const upgradeToPremium = () => {
    updateUser({ isPremium: true });
  };

  const completeOnboarding = (onboardingData: Partial<User>) => {
    updateUser({ 
      ...onboardingData, 
      onboardingCompleted: true 
    });
  };

  const clearUser = async () => {
    try {
      await AsyncStorage.removeItem(USER_STORAGE_KEY);
      setUser(defaultUser);
    } catch (error) {
      console.error('Error clearing user data:', error);
    }
  };

  return {
    user,
    isLoading,
    setUser: saveUser,
    updateUser,
    updateStats,
    canSendMessage,
    incrementMessageCount,
    upgradeToPremium,
    completeOnboarding,
    clearUser,
  };
});