import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useEffect, useState } from 'react';
import { BADGES, LANGUAGES } from '@/constants/languages';
import { Badge, User, UserStats } from '@/types/user';

const USER_STORAGE_KEY = 'linguamate_user';

const defaultUser: User = {
  id: 'guest',
  nativeLanguage: 'en',
  selectedLanguage: '',
  proficiencyLevel: 'beginner',
  isPremium: false,
  onboardingCompleted: false,
  placementCompleted: false,
  profileCompleted: false,
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
    const updatedUser: User = { ...user, ...updates } as User;

    if (updates.selectedLanguage) {
      const lang = LANGUAGES.find(l => l.code === updates.selectedLanguage);
      const currentStats = updatedUser.stats || defaultUser.stats!;
      const badgesArr = currentStats.badges || [];

      if (lang) {
        const langBadgeId = `lang_flag_${lang.code}`;
        const hasBadge = badgesArr.some(b => b.id === langBadgeId);
        if (!hasBadge) {
          const added: Badge = {
            id: langBadgeId,
            name: `${lang.name} Flag`,
            description: `You selected ${lang.name} as your language`,
            icon: lang.flag,
            unlockedAt: new Date().toISOString(),
          };
          const withLang = { ...currentStats, badges: [...badgesArr, added] } as UserStats;
          // Also check badge count trophies after adding language badge
          const more = checkForNewBadges(withLang, [...badgesArr, added], updatedUser);
          const finalBadges = [...badgesArr, added, ...more.filter(nb => ![...badgesArr, added].some(b => b.id === nb.id))];
          updatedUser.stats = { ...withLang, badges: finalBadges } as UserStats;
        }
      }
    }

    saveUser(updatedUser);
  };

  const updateStats = (updates: Partial<UserStats>) => {
    const currentStats = user.stats || defaultUser.stats!;
    const updatedStats: UserStats = { ...currentStats, ...updates } as UserStats;
    const updatedUser: User = { ...user, stats: updatedStats } as User;

    const currentBadges: Badge[] = currentStats.badges || [];
    const newBadges = checkForNewBadges(updatedStats, currentBadges, updatedUser);
    if (newBadges.length > 0) {
      updatedStats.badges = [...(updatedStats.badges || []), ...newBadges];
      updatedUser.stats = updatedStats;
    }

    saveUser(updatedUser);
  };

  const checkForNewBadges = (stats: UserStats, currentBadges: Badge[], userArg?: User): Badge[] => {
    const newBadges: Badge[] = [];
    const currentBadgeIds = new Set(currentBadges.map(b => b.id));

    BADGES.forEach(def => {
      if (currentBadgeIds.has(def.id)) return;

      let meets = false;
      if (def.type === 'badgesCount') {
        const count = (currentBadges.length + newBadges.length);
        meets = count >= def.requiredValue;
      } else {
        const key = def.type as keyof UserStats;
        const statValue = (stats?.[key] as unknown as number) ?? 0;
        meets = statValue >= def.requiredValue;
      }

      if (meets) {
        newBadges.push({
          id: def.id,
          name: def.name,
          description: def.description,
          icon: def.icon,
          unlockedAt: new Date().toISOString(),
        });
      }
    });

    if (userArg?.selectedLanguage) {
      const lang = LANGUAGES.find(l => l.code === userArg.selectedLanguage);
      if (lang) {
        const langBadgeId = `lang_flag_${lang.code}`;
        if (!currentBadges.some(b => b.id === langBadgeId) && !newBadges.some(b => b.id === langBadgeId)) {
          newBadges.push({
            id: langBadgeId,
            name: `${lang.name} Flag`,
            description: `You selected ${lang.name} as your language`,
            icon: lang.flag,
            unlockedAt: new Date().toISOString(),
          });
        }
      }
    }

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