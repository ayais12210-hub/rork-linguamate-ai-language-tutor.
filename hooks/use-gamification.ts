import { useState, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUser } from './user-store';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'learning' | 'streak' | 'social' | 'mastery' | 'special';
  requirement: {
    type: 'xp' | 'streak' | 'lessons' | 'words' | 'accuracy' | 'time' | 'custom';
    value: number;
    current?: number;
  };
  reward: {
    xp?: number;
    badge?: string;
    title?: string;
    feature?: string;
  };
  unlocked: boolean;
  unlockedAt?: string;
  progress: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  avatar?: string;
  xp: number;
  level: number;
  streak: number;
  rank: number;
  change: number; // Position change from last week
  country?: string;
}

export interface Challenge {
  id: string;
  name: string;
  description: string;
  type: 'daily' | 'weekly' | 'monthly' | 'special';
  startDate: string;
  endDate: string;
  tasks: ChallengeTask[];
  reward: {
    xp: number;
    badge?: string;
  };
  completed: boolean;
  completedAt?: string;
  participants?: number;
}

export interface ChallengeTask {
  id: string;
  description: string;
  requirement: {
    type: string;
    value: number;
    current: number;
  };
  completed: boolean;
}

export interface League {
  id: string;
  name: string;
  icon: string;
  minXP: number;
  maxXP: number;
  color: string;
  rewards: string[];
}

const ACHIEVEMENTS_KEY = 'linguamate_achievements';
const CHALLENGES_KEY = 'linguamate_challenges';
const LEADERBOARD_KEY = 'linguamate_leaderboard';

const LEAGUES: League[] = [
  { id: 'bronze', name: 'Bronze League', icon: '🥉', minXP: 0, maxXP: 500, color: '#CD7F32', rewards: ['Basic badges'] },
  { id: 'silver', name: 'Silver League', icon: '🥈', minXP: 501, maxXP: 1500, color: '#C0C0C0', rewards: ['Silver badges', 'Profile themes'] },
  { id: 'gold', name: 'Gold League', icon: '🥇', minXP: 1501, maxXP: 3000, color: '#FFD700', rewards: ['Gold badges', 'Special avatars'] },
  { id: 'platinum', name: 'Platinum League', icon: '💎', minXP: 3001, maxXP: 6000, color: '#E5E4E2', rewards: ['Platinum badges', 'Exclusive content'] },
  { id: 'diamond', name: 'Diamond League', icon: '💠', minXP: 6001, maxXP: Infinity, color: '#B9F2FF', rewards: ['Diamond badges', 'All features'] },
];

const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  // Streak Achievements
  {
    id: 'streak_7',
    name: 'Week Warrior',
    description: 'Maintain a 7-day learning streak',
    icon: '🔥',
    category: 'streak',
    requirement: { type: 'streak', value: 7 },
    reward: { xp: 100, badge: 'week_warrior' },
    unlocked: false,
    progress: 0,
    tier: 'bronze',
  },
  {
    id: 'streak_30',
    name: 'Monthly Master',
    description: 'Maintain a 30-day learning streak',
    icon: '🌟',
    category: 'streak',
    requirement: { type: 'streak', value: 30 },
    reward: { xp: 500, badge: 'monthly_master', title: 'Dedicated Learner' },
    unlocked: false,
    progress: 0,
    tier: 'silver',
  },
  {
    id: 'streak_100',
    name: 'Century Champion',
    description: 'Maintain a 100-day learning streak',
    icon: '👑',
    category: 'streak',
    requirement: { type: 'streak', value: 100 },
    reward: { xp: 2000, badge: 'century_champion', title: 'Language Legend' },
    unlocked: false,
    progress: 0,
    tier: 'gold',
  },
  // Learning Achievements
  {
    id: 'lessons_10',
    name: 'Getting Started',
    description: 'Complete 10 lessons',
    icon: '📚',
    category: 'learning',
    requirement: { type: 'lessons', value: 10 },
    reward: { xp: 50, badge: 'starter' },
    unlocked: false,
    progress: 0,
    tier: 'bronze',
  },
  {
    id: 'lessons_100',
    name: 'Lesson Centurion',
    description: 'Complete 100 lessons',
    icon: '🎓',
    category: 'learning',
    requirement: { type: 'lessons', value: 100 },
    reward: { xp: 500, badge: 'centurion' },
    unlocked: false,
    progress: 0,
    tier: 'silver',
  },
  {
    id: 'words_100',
    name: 'Vocabulary Builder',
    description: 'Learn 100 new words',
    icon: '📖',
    category: 'learning',
    requirement: { type: 'words', value: 100 },
    reward: { xp: 200, badge: 'vocabulary_builder' },
    unlocked: false,
    progress: 0,
    tier: 'bronze',
  },
  {
    id: 'words_1000',
    name: 'Word Master',
    description: 'Learn 1000 new words',
    icon: '📚',
    category: 'learning',
    requirement: { type: 'words', value: 1000 },
    reward: { xp: 1000, badge: 'word_master', title: 'Polyglot' },
    unlocked: false,
    progress: 0,
    tier: 'gold',
  },
  // Mastery Achievements
  {
    id: 'accuracy_90',
    name: 'Sharp Shooter',
    description: 'Maintain 90% accuracy over 50 questions',
    icon: '🎯',
    category: 'mastery',
    requirement: { type: 'accuracy', value: 90 },
    reward: { xp: 300, badge: 'sharp_shooter' },
    unlocked: false,
    progress: 0,
    tier: 'silver',
  },
  {
    id: 'perfect_10',
    name: 'Perfect Ten',
    description: 'Get 10 lessons with 100% accuracy',
    icon: '💯',
    category: 'mastery',
    requirement: { type: 'custom', value: 10 },
    reward: { xp: 400, badge: 'perfectionist' },
    unlocked: false,
    progress: 0,
    tier: 'gold',
  },
  // XP Achievements
  {
    id: 'xp_1000',
    name: 'XP Collector',
    description: 'Earn 1000 XP points',
    icon: '⭐',
    category: 'learning',
    requirement: { type: 'xp', value: 1000 },
    reward: { badge: 'xp_collector' },
    unlocked: false,
    progress: 0,
    tier: 'bronze',
  },
  {
    id: 'xp_10000',
    name: 'XP Master',
    description: 'Earn 10000 XP points',
    icon: '🌟',
    category: 'learning',
    requirement: { type: 'xp', value: 10000 },
    reward: { badge: 'xp_master', title: 'Experience Expert' },
    unlocked: false,
    progress: 0,
    tier: 'platinum',
  },
];

export const useGamification = () => {
  const [achievements, setAchievements] = useState<Achievement[]>(DEFAULT_ACHIEVEMENTS);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const { user, updateStats } = useUser();

  useEffect(() => {
    loadGamificationData();
    generateDailyChallenges();
  }, []);

  useEffect(() => {
    checkAchievements();
    updateLeaderboardPosition();
  }, [user.stats]);

  const loadGamificationData = async () => {
    try {
      setIsLoading(true);
      
      const [storedAchievements, storedChallenges, storedLeaderboard] = await Promise.all([
        AsyncStorage.getItem(ACHIEVEMENTS_KEY),
        AsyncStorage.getItem(CHALLENGES_KEY),
        AsyncStorage.getItem(LEADERBOARD_KEY),
      ]);

      if (storedAchievements) {
        setAchievements(JSON.parse(storedAchievements));
      }
      if (storedChallenges) {
        setChallenges(JSON.parse(storedChallenges));
      }
      if (storedLeaderboard) {
        setLeaderboard(JSON.parse(storedLeaderboard));
      } else {
        generateMockLeaderboard();
      }
    } catch (error) {
      if (__DEV__) {

        console.error('Error loading gamification data:', error);

      }
    } finally {
      setIsLoading(false);
    }
  };

  const saveAchievements = async (updated: Achievement[]) => {
    try {
      await AsyncStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(updated));
      setAchievements(updated);
    } catch (error) {
      if (__DEV__) {

        console.error('Error saving achievements:', error);

      }
    }
  };

  const saveChallenges = async (updated: Challenge[]) => {
    try {
      await AsyncStorage.setItem(CHALLENGES_KEY, JSON.stringify(updated));
      setChallenges(updated);
    } catch (error) {
      if (__DEV__) {

        console.error('Error saving challenges:', error);

      }
    }
  };

  const checkAchievements = () => {
    const updated = achievements.map(achievement => {
      if (achievement.unlocked) return achievement;

      let currentValue = 0;
      let shouldUnlock = false;

      switch (achievement.requirement.type) {
        case 'xp':
          currentValue = user.stats?.xpPoints || 0;
          shouldUnlock = currentValue >= achievement.requirement.value;
          break;
        case 'streak':
          currentValue = user.stats?.streakDays || 0;
          shouldUnlock = currentValue >= achievement.requirement.value;
          break;
        case 'words':
          currentValue = user.stats?.wordsLearned || 0;
          shouldUnlock = currentValue >= achievement.requirement.value;
          break;
        case 'lessons':
          currentValue = user.stats?.totalChats || 0;
          shouldUnlock = currentValue >= achievement.requirement.value;
          break;
      }

      const progress = Math.min(100, (currentValue / achievement.requirement.value) * 100);

      if (shouldUnlock && !achievement.unlocked) {
        // Award XP for unlocking
        if (achievement.reward.xp) {
          updateStats({ xpPoints: (user.stats?.xpPoints || 0) + achievement.reward.xp });
        }

        return {
          ...achievement,
          unlocked: true,
          unlockedAt: new Date().toISOString(),
          progress: 100,
        };
      }

      return {
        ...achievement,
        progress,
        requirement: {
          ...achievement.requirement,
          current: currentValue,
        },
      };
    });

    if (JSON.stringify(updated) !== JSON.stringify(achievements)) {
      saveAchievements(updated);
    }
  };

  const generateDailyChallenges = () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dailyChallenges: Challenge[] = [
      {
        id: `daily_${today.toISOString().split('T')[0]}`,
        name: 'Daily Practice',
        description: 'Complete your daily learning goals',
        type: 'daily',
        startDate: today.toISOString(),
        endDate: tomorrow.toISOString(),
        tasks: [
          {
            id: 'task_1',
            description: 'Complete 3 lessons',
            requirement: { type: 'lessons', value: 3, current: 0 },
            completed: false,
          },
          {
            id: 'task_2',
            description: 'Learn 10 new words',
            requirement: { type: 'words', value: 10, current: 0 },
            completed: false,
          },
          {
            id: 'task_3',
            description: 'Maintain your streak',
            requirement: { type: 'streak', value: 1, current: 0 },
            completed: false,
          },
        ],
        reward: { xp: 50, badge: 'daily_champion' },
        completed: false,
        participants: Math.floor(Math.random() * 1000) + 500,
      },
    ];

    // Check if daily challenges already exist for today
    const existingDaily = challenges.find(c => 
      c.type === 'daily' && 
      new Date(c.startDate).toDateString() === today.toDateString()
    );

    if (!existingDaily) {
      const updated = [...challenges.filter(c => c.type !== 'daily'), ...dailyChallenges];
      saveChallenges(updated);
    }
  };

  const generateMockLeaderboard = () => {
    const mockUsers: LeaderboardEntry[] = [
      { userId: user.id, username: user.name || 'You', xp: user.stats?.xpPoints || 0, level: 1, streak: user.stats?.streakDays || 0, rank: 0, change: 0 },
    ];

    // Generate mock competitors
    const names = ['Alex', 'Maria', 'John', 'Sophie', 'Chen', 'Emma', 'Lucas', 'Olivia', 'James', 'Isabella'];
    for (let i = 0; i < 10; i++) {
      mockUsers.push({
        userId: `user_${i}`,
        username: names[i],
        xp: Math.floor(Math.random() * 5000),
        level: Math.floor(Math.random() * 20) + 1,
        streak: Math.floor(Math.random() * 100),
        rank: 0,
        change: Math.floor(Math.random() * 10) - 5,
      });
    }

    // Sort by XP and assign ranks
    mockUsers.sort((a, b) => b.xp - a.xp);
    mockUsers.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    setLeaderboard(mockUsers);
    AsyncStorage.setItem(LEADERBOARD_KEY, JSON.stringify(mockUsers));
  };

  const updateLeaderboardPosition = () => {
    const updated = leaderboard.map(entry => {
      if (entry.userId === user.id) {
        return {
          ...entry,
          xp: user.stats?.xpPoints || 0,
          streak: user.stats?.streakDays || 0,
        };
      }
      return entry;
    });

    // Re-sort and update ranks
    updated.sort((a, b) => b.xp - a.xp);
    updated.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    setLeaderboard(updated);
    
    const userEntry = updated.find(e => e.userId === user.id);
    if (userEntry) {
      setUserRank(userEntry.rank);
    }
  };

  const completeChallenge = async (challengeId: string) => {
    const updated = challenges.map(challenge => {
      if (challenge.id === challengeId) {
        const allTasksComplete = challenge.tasks.every(task => task.completed);
        if (allTasksComplete && !challenge.completed) {
          // Award XP
          updateStats({ xpPoints: (user.stats?.xpPoints || 0) + challenge.reward.xp });
          
          return {
            ...challenge,
            completed: true,
            completedAt: new Date().toISOString(),
          };
        }
      }
      return challenge;
    });

    await saveChallenges(updated);
  };

  const updateChallengeProgress = (challengeId: string, taskId: string, progress: number) => {
    const updated = challenges.map(challenge => {
      if (challenge.id === challengeId) {
        const updatedTasks = challenge.tasks.map(task => {
          if (task.id === taskId) {
            const newCurrent = Math.min(progress, task.requirement.value);
            return {
              ...task,
              requirement: {
                ...task.requirement,
                current: newCurrent,
              },
              completed: newCurrent >= task.requirement.value,
            };
          }
          return task;
        });

        return {
          ...challenge,
          tasks: updatedTasks,
        };
      }
      return challenge;
    });

    saveChallenges(updated);
  };

  const getCurrentLeague = useMemo((): League => {
    const xp = user.stats?.xpPoints || 0;
    return LEAGUES.find(league => xp >= league.minXP && xp <= league.maxXP) || LEAGUES[0];
  }, [user.stats?.xpPoints]);

  const getNextLeague = useMemo((): League | null => {
    const currentIndex = LEAGUES.findIndex(l => l.id === getCurrentLeague.id);
    return currentIndex < LEAGUES.length - 1 ? LEAGUES[currentIndex + 1] : null;
  }, [getCurrentLeague]);

  const xpToNextLeague = useMemo((): number => {
    const nextLeague = getNextLeague;
    if (!nextLeague) return 0;
    return Math.max(0, nextLeague.minXP - (user.stats?.xpPoints || 0));
  }, [getNextLeague, user.stats?.xpPoints]);

  const unlockedAchievements = useMemo(() => 
    achievements.filter(a => a.unlocked),
    [achievements]
  );

  const achievementProgress = useMemo(() => {
    const unlocked = achievements.filter(a => a.unlocked).length;
    return (unlocked / achievements.length) * 100;
  }, [achievements]);

  const activeChallenges = useMemo(() => 
    challenges.filter(c => !c.completed && new Date(c.endDate) > new Date()),
    [challenges]
  );

  const completedChallenges = useMemo(() => 
    challenges.filter(c => c.completed),
    [challenges]
  );

  return {
    achievements,
    challenges: activeChallenges,
    completedChallenges,
    leaderboard,
    userRank,
    currentLeague: getCurrentLeague,
    nextLeague: getNextLeague,
    xpToNextLeague,
    unlockedAchievements,
    achievementProgress,
    isLoading,
    completeChallenge,
    updateChallengeProgress,
    checkAchievements,
  };
};