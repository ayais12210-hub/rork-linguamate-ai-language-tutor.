import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ChevronLeft,
  Zap,
  Timer,
  Target,
  Heart,
  Star,
  Settings,
  Trophy,
  Gift,
  X,
  Flame,
} from 'lucide-react-native';

interface ModuleShellProps {
  title: string;
  subtitle?: string;
  moduleType?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  estimatedTime?: number;
  xpReward?: number;
  progress?: number;
  lives?: number;
  streak?: number;
  showTimer?: boolean;
  timeLimit?: number;
  onBack?: () => void;
  onComplete?: (finalXp?: number) => void;
  onPause?: () => void;
  onSettings?: () => void;
  children: React.ReactNode;
}

export default function ModuleShell({
  title,
  subtitle,
  moduleType,
  difficulty = 'beginner',
  estimatedTime = 10,
  xpReward = 50,
  progress = 0,
  lives = 3,
  streak = 0,
  showTimer = false,
  timeLimit = 300,
  onBack,
  onComplete,
  onPause,
  onSettings,
  children,
}: ModuleShellProps) {
  const [timeLeft, setTimeLeft] = useState<number>(timeLimit);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [showRewards, setShowRewards] = useState<boolean>(false);
  const [combo, setCombo] = useState<number>(0);
  const [actionsCount, setActionsCount] = useState<number>(0);

  const progressAnimation = useRef(new Animated.Value(progress)).current;
  const streakAnimation = useRef(new Animated.Value(streak > 0 ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(progressAnimation, {
      toValue: progress,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [progress, progressAnimation]);

  useEffect(() => {
    if (streak > 0) {
      Animated.spring(streakAnimation, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    }
  }, [streak, streakAnimation]);

  useEffect(() => {
    if (showTimer && timeLeft > 0 && !isPaused) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [showTimer, timeLeft, isPaused]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getDifficultyColor = () => {
    switch (difficulty) {
      case 'beginner': return '#10B981';
      case 'intermediate': return '#F59E0B';
      case 'advanced': return '#EF4444';
      case 'expert': return '#8B5CF6';
      default: return '#10B981';
    }
  };

  const handlePause = () => {
    setIsPaused(!isPaused);
    onPause?.();
  };

  const multiplier = useMemo<number>(() => {
    const base = 1;
    const streakBonus = streak > 0 ? Math.min(1 + streak * 0.05, 2) : 1;
    const comboBonus = combo > 0 ? Math.min(1 + combo * 0.02, 1.5) : 1;
    return parseFloat((base * streakBonus * comboBonus).toFixed(2));
  }, [streak, combo]);

  const projectedXp = useMemo<number>(() => Math.round((xpReward ?? 0) * multiplier), [xpReward, multiplier]);

  const handleComplete = useCallback(() => {
    setShowRewards(true);
  }, []);

  const acknowledgeRewards = useCallback(() => {
    setShowRewards(false);
    onComplete?.(projectedXp);
  }, [onComplete, projectedXp]);

  const registerAction = useCallback((wasCorrect: boolean) => {
    setActionsCount(prev => prev + 1);
    if (wasCorrect) {
      setCombo(prev => prev + 1);
    } else {
      setCombo(0);
    }
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#FFFFFF', '#F8FAFC']}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity testID="module-back" onPress={onBack} style={styles.backButton}>
            <ChevronLeft size={24} color="#6B7280" />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.title}>{title}</Text>
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}

            <View style={styles.difficultyBadge}>
              <View style={[styles.difficultyDot, { backgroundColor: getDifficultyColor() }]} />
              <Text style={[styles.difficultyText, { color: getDifficultyColor() }]}>
                {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
              </Text>
            </View>
          </View>

          <TouchableOpacity testID="module-settings" onPress={onSettings} style={styles.settingsButton}>
            <Settings size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width: progressAnimation.interpolate({
                    inputRange: [0, 100],
                    outputRange: ['0%', '100%'],
                    extrapolate: 'clamp',
                  })
                }
              ]}
            />
          </View>
          <Text style={styles.progressText}>{Math.round(progress)}%</Text>
          <View style={styles.multiplierPill}>
            <Flame size={14} color="#F59E0B" />
            <Text style={styles.multiplierText}>x{multiplier.toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Zap size={16} color="#F59E0B" />
            <Text style={styles.statText}>{xpReward} XP</Text>
          </View>

          {showTimer && (
            <TouchableOpacity onPress={handlePause} style={styles.statItem}>
              <Timer size={16} color={timeLeft < 60 ? '#EF4444' : '#6B7280'} />
              <Text style={[styles.statText, timeLeft < 60 && styles.timeWarning]}>
                {formatTime(timeLeft)}
              </Text>
            </TouchableOpacity>
          )}

          <View style={styles.statItem}>
            <Heart size={16} color={lives > 1 ? '#EF4444' : '#9CA3AF'} />
            <Text style={styles.statText}>{lives}</Text>
          </View>

          {streak > 0 && (
            <Animated.View
              style={[
                styles.statItem,
                {
                  transform: [{
                    scale: streakAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1],
                    })
                  }]
                }
              ]}
            >
              <Star size={16} color="#F59E0B" />
              <Text style={[styles.statText, styles.streakText]}>{streak}</Text>
            </Animated.View>
          )}

          <View style={styles.statItem}>
            <Target size={16} color="#6B7280" />
            <Text style={styles.statText}>{estimatedTime}m</Text>
          </View>

          <View style={styles.statItem}>
            <Zap size={16} color="#F59E0B" />
            <Text style={styles.statText}>{Math.max(xpReward, projectedXp)} XP</Text>
          </View>
        </View>
      </LinearGradient>

      {isPaused && (
        <View style={styles.pauseOverlay}>
          <View style={styles.pauseModal}>
            <Text style={styles.pauseTitle}>Paused</Text>
            <Text style={styles.pauseSubtitle}>Take your time</Text>
            <TouchableOpacity testID="resume-module" onPress={handlePause} style={styles.resumeButton}>
              <Text style={styles.resumeButtonText}>Resume</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentInner}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!isPaused}
      >
        {children}
        <TouchableOpacity testID="complete-module" onPress={() => setShowRewards(true)} style={styles.completeButton}>
          <Text style={styles.completeButtonText}>Finish Module</Text>
        </TouchableOpacity>
      </ScrollView>

      {showRewards && (
        <View style={styles.rewardOverlay}>
          <View style={styles.rewardCard}>
            <View style={styles.rewardHeader}>
              <Trophy size={22} color="#F59E0B" />
              <Text style={styles.rewardTitle}>Module Complete</Text>
              <TouchableOpacity accessibilityRole="button" onPress={acknowledgeRewards} style={styles.rewardClose}>
                <X size={18} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <View style={styles.rewardBody}>
              <View style={styles.rewardRow}>
                <Zap size={18} color="#F59E0B" />
                <Text style={styles.rewardText}>Base XP</Text>
                <Text style={styles.rewardValue}>{xpReward}</Text>
              </View>
              <View style={styles.rewardRow}>
                <Flame size={18} color="#F59E0B" />
                <Text style={styles.rewardText}>Multiplier</Text>
                <Text style={styles.rewardValue}>x{multiplier.toFixed(2)}</Text>
              </View>
              <View style={styles.rewardDivider} />
              <View style={styles.rewardRow}>
                <Gift size={18} color="#10B981" />
                <Text style={styles.rewardStrong}>Total Reward</Text>
                <Text style={styles.rewardStrong}>{projectedXp} XP</Text>
              </View>
            </View>
            <TouchableOpacity testID="acknowledge-reward" onPress={acknowledgeRewards} style={styles.rewardButton}>
              <Text style={styles.rewardButtonText}>Collect</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB'
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  difficultyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  difficultyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '600',
  },
  settingsButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    minWidth: 40,
  },
  multiplierPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  multiplierText: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '700',
    color: '#EA580C',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  statText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 4,
  },
  streakText: {
    color: '#F59E0B',
  },
  timeWarning: {
    color: '#EF4444',
  },
  pauseOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  pauseModal: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    minWidth: 200,
  },
  pauseTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  pauseSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 24,
  },
  resumeButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  resumeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1
  },
  contentInner: {
    padding: 20
  },
  completeButton: {
    marginTop: 12,
    alignSelf: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  completeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  rewardOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rewardCard: {
    width: '86%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
  },
  rewardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rewardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  rewardClose: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  rewardBody: {
    marginTop: 12,
    gap: 8,
  },
  rewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  rewardText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#374151',
  },
  rewardValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  rewardDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 8,
  },
  rewardStrong: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  rewardButton: {
    marginTop: 12,
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  rewardButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
});