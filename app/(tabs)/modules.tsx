import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  BookOpen,
  Hash,
  MessageSquare,
  PenTool,
  Volume2,
  Brain,
  Globe,
  Users,
  Zap,
  Lock,
  Trophy,
  Target,
  TrendingUp,
  ChevronRight,
  X,
} from 'lucide-react-native';
import { useUser } from '@/hooks/user-store';
import { useLearningProgress } from '@/state/learning-progress';
import AlphabetModule from '@/modules/alphabet/AlphabetModule';
import NumbersModule from '@/modules/numbers/NumbersModule';
import GrammarModule from '@/modules/grammar/GrammarModule';
import DialogueModule from '@/modules/dialogue/DialogueModule';
import VowelsModule from '@/modules/vowels/VowelsModule';
import ConsonantsModule from '@/modules/consonants/ConsonantsModule';
import SyllablesModule from '@/modules/syllables/SyllablesModule';
import SentenceModule from '@/modules/sentence/SentenceModule';
import PronunciationModule from '@/modules/pronunciation/PronunciationModule';
import CultureModule from '@/modules/culture/CultureModule';
import type { LearningModule, ModuleType } from '@/modules/types';

export default function ModulesScreen() {
  const [modules, setModules] = useState<LearningModule[]>([]);
  const [selectedModule, setSelectedModule] = useState<LearningModule | null>(null);
  const [activeModuleComponent, setActiveModuleComponent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [challengeView, setChallengeView] = useState<'daily' | 'weekly'>('daily');

  const { user, updateStats } = useUser();
  const { skills } = useLearningProgress();
  
  const moduleConfigs: LearningModule[] = [
    {
      id: 'alphabet',
      type: 'alphabet',
      title: 'Alphabet & Script',
      description: 'Master letters, characters, and writing systems',
      icon: '🔤',
      difficulty: 'beginner',
      estimatedTime: 15,
      xpReward: 100,
      isLocked: false,
      progress: 0,
    },
    {
      id: 'numbers',
      type: 'numbers',
      title: 'Numbers & Counting',
      description: 'Learn numbers 0-100 and counting exercises',
      icon: '🔢',
      difficulty: 'beginner',
      estimatedTime: 10,
      xpReward: 80,
      isLocked: false,
      progress: 0,
    },
    {
      id: 'vowels',
      type: 'vowels',
      title: 'Vowels & Sounds',
      description: 'Master vowel sounds and pronunciation',
      icon: '🗣️',
      difficulty: 'beginner',
      estimatedTime: 12,
      xpReward: 90,
      isLocked: false,
      progress: 0,
    },
    {
      id: 'consonants',
      type: 'consonants',
      title: 'Consonants',
      description: 'Learn consonant sounds and combinations',
      icon: '💬',
      difficulty: 'beginner',
      estimatedTime: 12,
      xpReward: 90,
      isLocked: false,
      progress: 0,
    },
    {
      id: 'syllables',
      type: 'syllables',
      title: 'Syllables & Word Formation',
      description: 'Build words from syllables',
      icon: '🔗',
      difficulty: 'intermediate',
      estimatedTime: 20,
      xpReward: 120,
      isLocked: !user.isPremium,
      progress: 0,
    },
    {
      id: 'grammar',
      type: 'grammar',
      title: 'Grammar Fundamentals',
      description: 'Essential grammar rules and structures',
      icon: '📐',
      difficulty: 'intermediate',
      estimatedTime: 25,
      xpReward: 150,
      isLocked: !user.isPremium,
      progress: 0,
    },
    {
      id: 'sentence',
      type: 'sentence',
      title: 'Sentence Building',
      description: 'Construct grammatically correct sentences',
      icon: '📝',
      difficulty: 'intermediate',
      estimatedTime: 20,
      xpReward: 130,
      isLocked: !user.isPremium,
      progress: 0,
    },
    {
      id: 'dialogue',
      type: 'dialogue',
      title: 'Dialogues & Conversations',
      description: 'Practice real-world conversations',
      icon: '💭',
      difficulty: 'advanced',
      estimatedTime: 30,
      xpReward: 200,
      isLocked: !user.isPremium,
      progress: 0,
    },
    {
      id: 'pronunciation',
      type: 'pronunciation',
      title: 'Advanced Pronunciation',
      description: 'Perfect your accent with AI feedback',
      icon: '🎯',
      difficulty: 'advanced',
      estimatedTime: 15,
      xpReward: 100,
      isLocked: !user.isPremium,
      progress: 0,
    },
    {
      id: 'culture',
      type: 'culture',
      title: 'Cultural Context',
      description: 'Learn cultural nuances and expressions',
      icon: '🌍',
      difficulty: 'intermediate',
      estimatedTime: 20,
      xpReward: 110,
      isLocked: !user.isPremium,
      progress: 0,
    },
  ];

  useEffect(() => {
    console.log('[Modules] skills changed, recalculating progress');
    calculateProgress();
  }, [skills]);

  const startOfWeek = useMemo(() => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const sow = new Date(now.setDate(diff));
    sow.setHours(0, 0, 0, 0);
    return sow;
  }, []);

  const weeklyPracticedSkills = useMemo(() => {
    const list = Object.values(skills).filter(s => {
      const lp = s.lastPracticedAt ? new Date(s.lastPracticedAt) : null;
      return lp ? lp >= startOfWeek : false;
    });
    console.log('[Modules] weeklyPracticedSkills', list.length);
    return list;
  }, [skills, startOfWeek]);

  const weeklyTarget = 7;
  const weeklyProgressPct = useMemo(() => {
    const pct = Math.min(100, Math.round((weeklyPracticedSkills.length / weeklyTarget) * 100));
    return pct;
  }, [weeklyPracticedSkills.length]);

  const calculateProgress = () => {
    const updatedModules = moduleConfigs.map(module => {
      const moduleSkills = Object.values(skills).filter(
        skill => skill.type === module.type
      );
      
      if (moduleSkills.length === 0) {
        return { ...module, progress: 0 };
      }
      
      const totalAccuracy = moduleSkills.reduce((sum, skill) => sum + skill.accuracy, 0);
      const avgProgress = (totalAccuracy / moduleSkills.length) * 100;
      
      return { ...module, progress: Math.round(avgProgress) };
    });
    
    setModules(updatedModules);
  };

  const startModule = (module: LearningModule) => {
    if (module.isLocked && !user.isPremium) {
      // Show upgrade modal
      return;
    }
    
    setSelectedModule(module);
    setActiveModuleComponent(module.type);
  };

  const handleModuleComplete = (finalXp?: number) => {
    if (selectedModule) {
      const reward = typeof finalXp === 'number' && !Number.isNaN(finalXp) ? finalXp : selectedModule.xpReward;
      updateStats({
        xpPoints: (user.stats?.xpPoints ?? 0) + reward,
      });
    }
    setActiveModuleComponent(null);
    setSelectedModule(null);
    calculateProgress();
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return '#10B981';
      case 'intermediate': return '#F59E0B';
      case 'advanced': return '#EF4444';
      case 'expert': return '#8B5CF6';
      default: return '#6B7280';
    }
  };

  const getModuleIcon = (type: ModuleType) => {
    switch (type) {
      case 'alphabet': return BookOpen;
      case 'numbers': return Hash;
      case 'vowels': return Volume2;
      case 'consonants': return MessageSquare;
      case 'syllables': return PenTool;
      case 'grammar': return Brain;
      case 'sentence': return PenTool;
      case 'dialogue': return Users;
      case 'pronunciation': return Volume2;
      case 'culture': return Globe;
      default: return BookOpen;
    }
  };

  // Render active module component
  if (activeModuleComponent && user.selectedLanguage) {
    switch (activeModuleComponent) {
      case 'alphabet':
        return (
          <AlphabetModule
            languageCode={user.selectedLanguage}
            onComplete={handleModuleComplete}
            onBack={() => setActiveModuleComponent(null)}
          />
        );
      case 'numbers':
        return (
          <NumbersModule
            languageCode={user.selectedLanguage}
            onComplete={handleModuleComplete}
            onBack={() => setActiveModuleComponent(null)}
          />
        );
      case 'grammar':
        return (
          <GrammarModule
            languageCode={user.selectedLanguage}
            onComplete={handleModuleComplete}
            onBack={() => setActiveModuleComponent(null)}
          />
        );
      case 'dialogue':
        return (
          <DialogueModule
            languageCode={user.selectedLanguage}
            onComplete={handleModuleComplete}
            onBack={() => setActiveModuleComponent(null)}
          />
        );
      case 'vowels':
        return (
          <VowelsModule
            languageCode={user.selectedLanguage}
            onComplete={handleModuleComplete}
            onBack={() => setActiveModuleComponent(null)}
          />
        );
      case 'consonants':
        return (
          <ConsonantsModule
            languageCode={user.selectedLanguage}
            onComplete={handleModuleComplete}
            onBack={() => setActiveModuleComponent(null)}
          />
        );
      case 'syllables':
        return (
          <SyllablesModule
            languageCode={user.selectedLanguage}
            onComplete={handleModuleComplete}
            onBack={() => setActiveModuleComponent(null)}
          />
        );
      case 'sentence':
        return (
          <SentenceModule
            languageCode={user.selectedLanguage}
            onComplete={handleModuleComplete}
            onBack={() => setActiveModuleComponent(null)}
          />
        );
      case 'pronunciation':
        return (
          <PronunciationModule
            languageCode={user.selectedLanguage}
            onComplete={handleModuleComplete}
            onBack={() => setActiveModuleComponent(null)}
          />
        );
      case 'culture':
        return (
          <CultureModule
            languageCode={user.selectedLanguage}
            onComplete={handleModuleComplete}
            onBack={() => setActiveModuleComponent(null)}
          />
        );
      default:
        return (
          <SafeAreaView style={styles.container}>
            <View style={styles.comingSoonContainer}>
              <Text style={styles.comingSoonText}>
                {selectedModule?.title} module coming soon!
              </Text>
              <TouchableOpacity
                onPress={() => setActiveModuleComponent(null)}
                style={styles.backButton}
              >
                <Text style={styles.backButtonText}>Go Back</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        );
    }
  }

  const totalXP = modules.reduce((sum, m) => sum + (m.progress > 0 ? m.xpReward * (m.progress / 100) : 0), 0);
  const completedModules = modules.filter(m => m.progress >= 100).length;
  const averageProgress = modules.length > 0 ? modules.reduce((sum, m) => sum + m.progress, 0) / modules.length : 0;

  return (
    <SafeAreaView style={styles.container} testID="modules-screen">
      <ScrollView showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={['#6366F1', '#8B5CF6']}
          style={styles.headerGradient}
        >
          <Text style={styles.headerTitle}>Advanced Learning Modules</Text>
          <Text style={styles.headerSubtitle}>
            Master {user.selectedLanguage ? 'your target language' : 'languages'} from the ground up
          </Text>
          
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Trophy size={20} color="#FCD34D" />
              <Text style={styles.statValue}>{Math.round(totalXP)}</Text>
              <Text style={styles.statLabel}>XP Earned</Text>
            </View>
            
            <View style={styles.statCard}>
              <Target size={20} color="#34D399" />
              <Text style={styles.statValue}>{completedModules}/{modules.length}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            
            <View style={styles.statCard}>
              <TrendingUp size={20} color="#60A5FA" />
              <Text style={styles.statValue}>{Math.round(averageProgress)}%</Text>
              <Text style={styles.statLabel}>Progress</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Modules Grid */}
        <View style={styles.modulesSection}>
          <Text style={styles.sectionTitle}>Learning Path</Text>
          
          <View style={styles.modulesGrid}>
            {modules.map((module) => {
              const IconComponent = getModuleIcon(module.type);
              
              return (
                <TouchableOpacity
                  key={module.id}
                  style={[
                    styles.moduleCard,
                    module.isLocked && styles.lockedCard,
                  ]}
                  onPress={() => startModule(module)}
                  disabled={module.isLocked && !user.isPremium}
                >
                  <View style={styles.moduleHeader}>
                    <View style={[
                      styles.moduleIconContainer,
                      { backgroundColor: `${getDifficultyColor(module.difficulty)}20` }
                    ]}>
                      <Text style={styles.moduleEmoji}>{module.icon}</Text>
                    </View>
                    
                    {module.isLocked && (
                      <View style={styles.lockBadge}>
                        <Lock size={16} color="#8B5CF6" />
                      </View>
                    )}
                  </View>
                  
                  <Text style={styles.moduleTitle}>{module.title}</Text>
                  <Text style={styles.moduleDescription}>{module.description}</Text>
                  
                  <View style={styles.moduleFooter}>
                    <View style={styles.moduleStats}>
                      <View style={styles.moduleStat}>
                        <Text style={styles.moduleStatValue}>{module.estimatedTime}m</Text>
                      </View>
                      <View style={styles.moduleStat}>
                        <Zap size={12} color="#F59E0B" />
                        <Text style={styles.moduleStatValue}>{module.xpReward}</Text>
                      </View>
                    </View>
                    
                    <View style={styles.progressBarContainer}>
                      <View style={styles.progressBarBackground}>
                        <View
                          style={[
                            styles.progressBarFill,
                            {
                              width: `${module.progress}%`,
                              backgroundColor: getDifficultyColor(module.difficulty),
                            }
                          ]}
                        />
                      </View>
                      <Text style={styles.progressPercentage}>{module.progress}%</Text>
                    </View>
                    
                    <View style={[
                      styles.difficultyBadge,
                      { backgroundColor: `${getDifficultyColor(module.difficulty)}20` }
                    ]}>
                      <Text style={[
                        styles.difficultyText,
                        { color: getDifficultyColor(module.difficulty) }
                      ]}>
                        {module.difficulty}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Challenges */}
        <View style={styles.challengeSection}>
          <View style={styles.challengeTabs}>
            <TouchableOpacity
              testID="challenge-tab-daily"
              accessibilityRole="button"
              onPress={() => setChallengeView('daily')}
              style={[styles.challengeTabBtn, challengeView === 'daily' && styles.challengeTabBtnActive]}
            >
              <Text style={[styles.challengeTabText, challengeView === 'daily' && styles.challengeTabTextActive]}>Daily</Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID="challenge-tab-weekly"
              accessibilityRole="button"
              onPress={() => setChallengeView('weekly')}
              style={[styles.challengeTabBtn, challengeView === 'weekly' && styles.challengeTabBtnActive]}
            >
              <Text style={[styles.challengeTabText, challengeView === 'weekly' && styles.challengeTabTextActive]}>Weekly</Text>
            </TouchableOpacity>
          </View>

          {challengeView === 'daily' ? (
            <LinearGradient
              colors={['#FEF3C7', '#FDE68A']}
              style={styles.challengeCard}
            >
              <Text style={styles.challengeTitle}>Daily Module Challenge</Text>
              <Text style={styles.challengeDescription}>
                Complete 3 module exercises today for bonus XP!
              </Text>
              <View style={styles.challengeProgress}>
                <View style={styles.challengeProgressBar}>
                  <View style={[styles.challengeProgressFill, { width: '33%' }]} />
                </View>
                <Text style={styles.challengeProgressText}>1/3 Completed</Text>
              </View>
            </LinearGradient>
          ) : (
            <LinearGradient
              colors={['#E0E7FF', '#C7D2FE']}
              style={styles.challengeCard}
            >
              <Text style={styles.challengeTitle}>Weekly Module Challenge</Text>
              <Text style={styles.challengeDescription}>
                Practice {weeklyTarget} modules this week to earn a mega badge
              </Text>
              <View style={styles.challengeProgress}>
                <View style={styles.challengeProgressBar}>
                  <View style={[styles.challengeProgressFill, { width: `${weeklyProgressPct}%`, backgroundColor: '#6366F1' }]} />
                </View>
                <Text style={styles.challengeProgressText}>{weeklyPracticedSkills.length}/{weeklyTarget} Completed</Text>
              </View>
            </LinearGradient>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  headerGradient: {
    padding: 20,
    paddingTop: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  modulesSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  modulesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  moduleCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lockedCard: {
    opacity: 0.7,
  },
  moduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  moduleIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moduleEmoji: {
    fontSize: 24,
  },
  lockBadge: {
    backgroundColor: '#F3E8FF',
    padding: 4,
    borderRadius: 8,
  },
  moduleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  moduleDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 12,
    lineHeight: 16,
  },
  moduleFooter: {
    gap: 8,
  },
  moduleStats: {
    flexDirection: 'row',
    gap: 12,
  },
  moduleStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  moduleStatValue: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBarBackground: {
    flex: 1,
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressPercentage: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  difficultyText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  challengeSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  challengeCard: {
    borderRadius: 16,
    padding: 20,
  },
  challengeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#92400E',
    marginBottom: 4,
  },
  challengeDescription: {
    fontSize: 14,
    color: '#78350F',
    marginBottom: 12,
  },
  challengeProgress: {
    gap: 8,
  },
  challengeProgressBar: {
    height: 8,
    backgroundColor: 'rgba(146, 64, 14, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  challengeProgressFill: {
    height: '100%',
    backgroundColor: '#F59E0B',
  },
  challengeProgressText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
  },
  challengeTabs: {
    flexDirection: 'row',
    backgroundColor: '#EEF2FF',
    padding: 6,
    borderRadius: 12,
    alignSelf: 'center',
    marginBottom: 12,
  },
  challengeTabBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 4,
    backgroundColor: 'transparent',
  },
  challengeTabBtnActive: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  challengeTabText: {
    fontSize: 14,
    color: '#4F46E5',
    fontWeight: '600',
  },
  challengeTabTextActive: {
    color: '#3730A3',
  },
  comingSoonContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  comingSoonText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});