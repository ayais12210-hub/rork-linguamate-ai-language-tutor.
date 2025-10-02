import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Globe,
  Target,
  Clock,
  BookOpen,
  ChevronRight,
  Check,
  Sparkles,
  Trophy,
  Users,
  ChevronDown,
  Edit2,
} from 'lucide-react-native';
import { useUser } from '@/hooks/user-store';
import Animated, { FadeInUp } from 'react-native-reanimated';
import LanguageSearchBar from '@/components/search/LanguageSearchBar';
import { rankLanguages } from '@/modules/languages/logic/filter';
import type { Lang } from '@/modules/languages/data/languages';
import { LANGUAGES } from '@/modules/languages/data/languages';

const { width } = Dimensions.get('window');

interface OnboardingStep {
  id: string;
  title: string;
  subtitle: string;
  icon: any;
  color: string;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to LinguaMate',
    subtitle: 'Your AI-powered language learning companion',
    icon: Globe,
    color: '#10B981',
  },
  {
    id: 'nativeLanguage',
    title: "What's your native language?",
    subtitle: 'This helps us translate from your language to your target language',
    icon: Globe,
    color: '#6366F1',
  },
  {
    id: 'targetLanguage',
    title: 'What language do you want to learn?',
    subtitle: 'Choose the language you\'d like to practice and improve',
    icon: Globe,
    color: '#3B82F6',
  },
  {
    id: 'level',
    title: 'Your Current Level',
    subtitle: 'Help us personalize your learning experience',
    icon: Target,
    color: '#8B5CF6',
  },
  {
    id: 'goals',
    title: 'Set Your Goals',
    subtitle: 'What do you want to achieve?',
    icon: Trophy,
    color: '#F59E0B',
  },
  {
    id: 'time',
    title: 'Daily Commitment',
    subtitle: 'How much time can you dedicate daily?',
    icon: Clock,
    color: '#EF4444',
  },
  {
    id: 'topics',
    title: 'Your Interests',
    subtitle: 'Learn through topics you love',
    icon: BookOpen,
    color: '#EC4899',
  },
  {
    id: 'review',
    title: 'Review & Confirm',
    subtitle: 'Check your selections before starting',
    icon: Check,
    color: '#10B981',
  },
];

const PROFICIENCY_LEVELS = [
  { id: 'beginner', label: 'Beginner', description: 'Just starting out' },
  { id: 'intermediate', label: 'Intermediate', description: 'Can hold basic conversations' },
  { id: 'advanced', label: 'Advanced', description: 'Fluent but want to improve' },
];

const LEARNING_GOALS = [
  { id: 'travel', label: 'Travel', icon: '✈️' },
  { id: 'business', label: 'Business', icon: '💼' },
  { id: 'culture', label: 'Culture', icon: '🎭' },
  { id: 'education', label: 'Education', icon: '🎓' },
  { id: 'family', label: 'Family & Friends', icon: '👨‍👩‍👧‍👦' },
  { id: 'hobby', label: 'Personal Interest', icon: '🎨' },
];

const DAILY_GOALS = [
  { minutes: 5, label: 'Casual', description: '5 min/day' },
  { minutes: 15, label: 'Regular', description: '15 min/day' },
  { minutes: 30, label: 'Serious', description: '30 min/day' },
  { minutes: 60, label: 'Intense', description: '60 min/day' },
];

const TOPICS = [
  { id: 'everyday', label: 'Everyday Conversation', icon: '💬' },
  { id: 'food', label: 'Food & Dining', icon: '🍽️' },
  { id: 'shopping', label: 'Shopping', icon: '🛍️' },
  { id: 'sports', label: 'Sports & Fitness', icon: '⚽' },
  { id: 'tech', label: 'Technology', icon: '💻' },
  { id: 'music', label: 'Music & Arts', icon: '🎵' },
  { id: 'news', label: 'News & Current Events', icon: '📰' },
  { id: 'movies', label: 'Movies & Entertainment', icon: '🎬' },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { completeOnboarding: saveOnboarding } = useUser();
  const [currentStep, setCurrentStep] = useState(0);
  const [nativeLanguage, setNativeLanguage] = useState('');
  const [targetLanguage, setTargetLanguage] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [dailyGoal, setDailyGoal] = useState(15);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [nativeSearchQuery, setNativeSearchQuery] = useState('');
  const [targetSearchQuery, setTargetSearchQuery] = useState('');
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const nativeLanguages = React.useMemo(
    () => rankLanguages(nativeSearchQuery),
    [nativeSearchQuery]
  );
  const targetLanguages = React.useMemo(
    () => rankLanguages(targetSearchQuery),
    [targetSearchQuery]
  );

  const currentStepData = ONBOARDING_STEPS[currentStep];
  const Icon = currentStepData.icon;

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      finishOnboarding();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const finishOnboarding = () => {
    saveOnboarding({
      nativeLanguage,
      selectedLanguage: targetLanguage,
      proficiencyLevel: selectedLevel,
      learningGoals: selectedGoals,
      dailyGoalMinutes: dailyGoal,
      preferredTopics: selectedTopics,
    });
    router.replace('/(tabs)/lessons');
  };

  const canProceed = () => {
    switch (currentStepData.id) {
      case 'welcome':
        return true;
      case 'nativeLanguage':
        return nativeLanguage !== '';
      case 'targetLanguage':
        return targetLanguage !== '';
      case 'level':
        return true;
      case 'goals':
        return selectedGoals.length > 0;
      case 'time':
        return true;
      case 'topics':
        return selectedTopics.length > 0;
      case 'review':
        return true;
      default:
        return true;
    }
  };

  const renderStepContent = () => {
    const AnimatedView = Platform.OS === 'web' ? View : Animated.View;
    
    switch (currentStepData.id) {
      case 'welcome':
        return (
          <AnimatedView 
            entering={Platform.OS !== 'web' ? FadeInUp.delay(200) : undefined}
            style={styles.welcomeContainer}
          >
            <View style={styles.featureList}>
              <View style={styles.featureItem}>
                <Sparkles size={24} color="#10B981" />
                <Text style={styles.featureText}>AI-Powered Conversations</Text>
              </View>
              <View style={styles.featureItem}>
                <Trophy size={24} color="#F59E0B" />
                <Text style={styles.featureText}>Gamified Learning Experience</Text>
              </View>
              <View style={styles.featureItem}>
                <Users size={24} color="#3B82F6" />
                <Text style={styles.featureText}>Personalized Curriculum</Text>
              </View>
            </View>
          </AnimatedView>
        );

      case 'nativeLanguage':
        return (
          <View style={styles.languagePickerContainer}>
            <LanguageSearchBar
              value={nativeSearchQuery}
              onChange={setNativeSearchQuery}
              placeholder="Search by name or code (e.g., en, pa)"
              testID="native-language-search"
            />
            <ScrollView
              style={styles.languageList}
              showsVerticalScrollIndicator={false}
              testID="native-language-list"
            >
              {nativeLanguages.map((lang: Lang) => (
                <TouchableOpacity
                  key={lang.code}
                  style={[
                    styles.languageRow,
                    nativeLanguage === lang.code && styles.selectedRow,
                  ]}
                  onPress={() => setNativeLanguage(lang.code)}
                  testID={`language-item-${lang.code}`}
                  accessibilityRole="button"
                  accessibilityLabel={`Choose ${lang.name}`}
                >
                  <Text style={styles.languageFlag}>{lang.flag ?? '🌐'}</Text>
                  <View style={styles.languageInfo}>
                    <Text style={styles.languageName}>{lang.name}</Text>
                    {lang.endonym && lang.endonym !== lang.name && (
                      <Text style={styles.languageEndonym}>{lang.endonym}</Text>
                    )}
                  </View>
                  {nativeLanguage === lang.code && (
                    <Check size={20} color="white" />
                  )}
                  {nativeLanguage !== lang.code && (
                    <Text style={styles.chevron}>›</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        );

      case 'targetLanguage':
        return (
          <View style={styles.languagePickerContainer}>
            <LanguageSearchBar
              value={targetSearchQuery}
              onChange={setTargetSearchQuery}
              placeholder="Search by name or code (e.g., en, pa)"
              testID="target-language-search"
            />
            <ScrollView
              style={styles.languageList}
              showsVerticalScrollIndicator={false}
              testID="target-language-list"
            >
              {targetLanguages.map((lang: Lang) => (
                <TouchableOpacity
                  key={lang.code}
                  style={[
                    styles.languageRow,
                    targetLanguage === lang.code && styles.selectedRow,
                  ]}
                  onPress={() => setTargetLanguage(lang.code)}
                  testID={`language-item-${lang.code}`}
                  accessibilityRole="button"
                  accessibilityLabel={`Choose ${lang.name}`}
                >
                  <Text style={styles.languageFlag}>{lang.flag ?? '🌐'}</Text>
                  <View style={styles.languageInfo}>
                    <Text style={styles.languageName}>{lang.name}</Text>
                    {lang.endonym && lang.endonym !== lang.name && (
                      <Text style={styles.languageEndonym}>{lang.endonym}</Text>
                    )}
                  </View>
                  {targetLanguage === lang.code && (
                    <Check size={20} color="white" />
                  )}
                  {targetLanguage !== lang.code && (
                    <Text style={styles.chevron}>›</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        );

      case 'level':
        return (
          <View style={styles.levelContainer}>
            {PROFICIENCY_LEVELS.map((level) => (
              <TouchableOpacity
                key={level.id}
                style={[
                  styles.levelCard,
                  selectedLevel === level.id && styles.selectedLevelCard,
                ]}
                onPress={() => setSelectedLevel(level.id as 'beginner' | 'intermediate' | 'advanced')}
              >
                <Text style={[
                  styles.levelTitle,
                  selectedLevel === level.id && styles.selectedLevelText,
                ]}>
                  {level.label}
                </Text>
                <Text style={[
                  styles.levelDescription,
                  selectedLevel === level.id && styles.selectedLevelDescription,
                ]}>
                  {level.description}
                </Text>
                {selectedLevel === level.id && (
                  <View style={styles.levelCheckIcon}>
                    <Check size={20} color="white" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        );

      case 'goals':
        return (
          <View style={styles.goalsGrid}>
            {LEARNING_GOALS.map((goal) => (
              <TouchableOpacity
                key={goal.id}
                style={[
                  styles.goalCard,
                  selectedGoals.includes(goal.id) && styles.selectedGoalCard,
                ]}
                onPress={() => {
                  if (selectedGoals.includes(goal.id)) {
                    setSelectedGoals(selectedGoals.filter(g => g !== goal.id));
                  } else {
                    setSelectedGoals([...selectedGoals, goal.id]);
                  }
                }}
              >
                <Text style={styles.goalIcon}>{goal.icon}</Text>
                <Text style={[
                  styles.goalLabel,
                  selectedGoals.includes(goal.id) && styles.selectedGoalLabel,
                ]}>
                  {goal.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        );

      case 'time':
        return (
          <View style={styles.timeContainer}>
            {DAILY_GOALS.map((goal) => (
              <TouchableOpacity
                key={goal.minutes}
                style={[
                  styles.timeCard,
                  dailyGoal === goal.minutes && styles.selectedTimeCard,
                ]}
                onPress={() => setDailyGoal(goal.minutes)}
              >
                <Text style={[
                  styles.timeLabel,
                  dailyGoal === goal.minutes && styles.selectedTimeLabel,
                ]}>
                  {goal.label}
                </Text>
                <Text style={[
                  styles.timeDescription,
                  dailyGoal === goal.minutes && styles.selectedTimeDescription,
                ]}>
                  {goal.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        );

      case 'topics':
        return (
          <ScrollView style={styles.topicsScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.topicsGrid}>
              {TOPICS.map((topic) => (
                <TouchableOpacity
                  key={topic.id}
                  style={[
                    styles.topicCard,
                    selectedTopics.includes(topic.id) && styles.selectedTopicCard,
                  ]}
                  onPress={() => {
                    if (selectedTopics.includes(topic.id)) {
                      setSelectedTopics(selectedTopics.filter(t => t !== topic.id));
                    } else {
                      setSelectedTopics([...selectedTopics, topic.id]);
                    }
                  }}
                >
                  <Text style={styles.topicIcon}>{topic.icon}</Text>
                  <Text style={[
                    styles.topicLabel,
                    selectedTopics.includes(topic.id) && styles.selectedTopicLabel,
                  ]}>
                    {topic.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        );

      case 'review':
        return (
          <ScrollView style={styles.reviewScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.reviewContainer}>
              <ReviewSection
                title="Languages"
                icon="🌐"
                isExpanded={expandedSection === 'languages'}
                onToggle={() => setExpandedSection(expandedSection === 'languages' ? null : 'languages')}
              >
                <View style={styles.reviewItem}>
                  <Text style={styles.reviewLabel}>Native Language</Text>
                  <Text style={styles.reviewValue}>
                    {LANGUAGES.find(l => l.code === nativeLanguage)?.flag} {LANGUAGES.find(l => l.code === nativeLanguage)?.name}
                  </Text>
                </View>
                <View style={styles.reviewDivider} />
                <View style={styles.reviewItem}>
                  <Text style={styles.reviewLabel}>Learning</Text>
                  <Text style={styles.reviewValue}>
                    {LANGUAGES.find(l => l.code === targetLanguage)?.flag} {LANGUAGES.find(l => l.code === targetLanguage)?.name}
                  </Text>
                </View>
                {expandedSection === 'languages' && (
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => {
                      setExpandedSection(null);
                      setCurrentStep(1);
                    }}
                  >
                    <Edit2 size={16} color="white" />
                    <Text style={styles.editButtonText}>Change Languages</Text>
                  </TouchableOpacity>
                )}
              </ReviewSection>

              <ReviewSection
                title="Skill Level"
                icon="🎯"
                isExpanded={expandedSection === 'level'}
                onToggle={() => setExpandedSection(expandedSection === 'level' ? null : 'level')}
              >
                <View style={styles.reviewItem}>
                  <Text style={styles.reviewLabel}>Current Level</Text>
                  <Text style={styles.reviewValue}>
                    {PROFICIENCY_LEVELS.find(l => l.id === selectedLevel)?.label}
                  </Text>
                </View>
                {expandedSection === 'level' && (
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => {
                      setExpandedSection(null);
                      setCurrentStep(3);
                    }}
                  >
                    <Edit2 size={16} color="white" />
                    <Text style={styles.editButtonText}>Change Level</Text>
                  </TouchableOpacity>
                )}
              </ReviewSection>

              <ReviewSection
                title="Learning Goals"
                icon="🏆"
                isExpanded={expandedSection === 'goals'}
                onToggle={() => setExpandedSection(expandedSection === 'goals' ? null : 'goals')}
              >
                <View style={styles.reviewItem}>
                  <Text style={styles.reviewLabel}>Your Goals</Text>
                  <View style={styles.chipContainer}>
                    {selectedGoals.map(goalId => {
                      const goal = LEARNING_GOALS.find(g => g.id === goalId);
                      return (
                        <View key={goalId} style={styles.chip}>
                          <Text style={styles.chipText}>{goal?.icon} {goal?.label}</Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
                {expandedSection === 'goals' && (
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => {
                      setExpandedSection(null);
                      setCurrentStep(4);
                    }}
                  >
                    <Edit2 size={16} color="white" />
                    <Text style={styles.editButtonText}>Change Goals</Text>
                  </TouchableOpacity>
                )}
              </ReviewSection>

              <ReviewSection
                title="Daily Commitment"
                icon="⏰"
                isExpanded={expandedSection === 'time'}
                onToggle={() => setExpandedSection(expandedSection === 'time' ? null : 'time')}
              >
                <View style={styles.reviewItem}>
                  <Text style={styles.reviewLabel}>Daily Goal</Text>
                  <Text style={styles.reviewValue}>
                    {DAILY_GOALS.find(g => g.minutes === dailyGoal)?.label} ({dailyGoal} min/day)
                  </Text>
                </View>
                {expandedSection === 'time' && (
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => {
                      setExpandedSection(null);
                      setCurrentStep(5);
                    }}
                  >
                    <Edit2 size={16} color="white" />
                    <Text style={styles.editButtonText}>Change Time</Text>
                  </TouchableOpacity>
                )}
              </ReviewSection>

              <ReviewSection
                title="Interests"
                icon="📚"
                isExpanded={expandedSection === 'topics'}
                onToggle={() => setExpandedSection(expandedSection === 'topics' ? null : 'topics')}
              >
                <View style={styles.reviewItem}>
                  <Text style={styles.reviewLabel}>Topics</Text>
                  <View style={styles.chipContainer}>
                    {selectedTopics.map(topicId => {
                      const topic = TOPICS.find(t => t.id === topicId);
                      return (
                        <View key={topicId} style={styles.chip}>
                          <Text style={styles.chipText}>{topic?.icon} {topic?.label}</Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
                {expandedSection === 'topics' && (
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => {
                      setExpandedSection(null);
                      setCurrentStep(6);
                    }}
                  >
                    <Edit2 size={16} color="white" />
                    <Text style={styles.editButtonText}>Change Topics</Text>
                  </TouchableOpacity>
                )}
              </ReviewSection>
            </View>
          </ScrollView>
        );

      default:
        return null;
    }
  };

  interface ReviewSectionProps {
    title: string;
    icon: string;
    isExpanded: boolean;
    onToggle: () => void;
    children: React.ReactNode;
  }

  const ReviewSection = ({ title, icon, isExpanded, onToggle, children }: ReviewSectionProps) => (
    <View style={styles.reviewSection}>
      <TouchableOpacity
        style={styles.reviewSectionHeader}
        onPress={onToggle}
        activeOpacity={0.7}
      >
        <View style={styles.reviewSectionTitleRow}>
          <Text style={styles.reviewSectionIcon}>{icon}</Text>
          <Text style={styles.reviewSectionTitle}>{title}</Text>
        </View>
        <ChevronDown
          size={20}
          color="rgba(255, 255, 255, 0.7)"
          style={[
            styles.chevronIcon,
            isExpanded && styles.chevronIconExpanded,
          ]}
        />
      </TouchableOpacity>
      <View style={styles.reviewSectionContent}>
        {children}
      </View>
    </View>
  );

  return (
    <LinearGradient
      colors={[currentStepData.color, currentStepData.color + 'CC']}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.progressContainer}>
            {ONBOARDING_STEPS.map((step, index) => (
              <View
                key={step.id}
                style={[
                  styles.progressDot,
                  index === currentStep && styles.progressDotActive,
                  index < currentStep && styles.progressDotCompleted,
                ]}
              />
            ))}
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Icon size={60} color="white" />
          </View>
          
          <Text style={styles.title}>{currentStepData.title}</Text>
          <Text style={styles.subtitle}>{currentStepData.subtitle}</Text>

          <View style={styles.stepContent}>
            {renderStepContent()}
          </View>
        </View>

        <View style={styles.footer}>
          {currentStep > 0 && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBack}
            >
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={[
              styles.nextButton,
              !canProceed() && styles.nextButtonDisabled,
            ]}
            onPress={handleNext}
            disabled={!canProceed()}
          >
            <Text style={styles.nextButtonText}>
              {currentStep === ONBOARDING_STEPS.length - 1 ? 'Get Started' : 'Continue'}
            </Text>
            <ChevronRight size={20} color="white" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  progressContainer: {
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    gap: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  progressDotActive: {
    width: 24,
    backgroundColor: 'white',
  },
  progressDotCompleted: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center' as const,
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold' as const,
    color: 'white',
    textAlign: 'center' as const,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center' as const,
    marginBottom: 32,
  },
  stepContent: {
    flex: 1,
    width: '100%',
  },
  welcomeContainer: {
    flex: 1,
    justifyContent: 'center' as const,
  },
  featureList: {
    gap: 20,
  },
  featureItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  featureText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500' as const,
  },
  languagePickerContainer: {
    flex: 1,
  },
  languageList: {
    flex: 1,
    marginTop: 8,
  },
  languageRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedRow: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderColor: 'white',
  },
  languageFlag: {
    fontSize: 24,
    marginRight: 12,
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  languageEndonym: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 13,
    marginTop: 2,
  },
  chevron: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 24,
    marginLeft: 8,
  },
  levelContainer: {
    gap: 16,
  },
  levelCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedLevelCard: {
    backgroundColor: 'white',
    borderColor: 'white',
  },
  levelTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: 'white',
    marginBottom: 4,
  },
  selectedLevelText: {
    color: '#1F2937',
  },
  levelDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  selectedLevelDescription: {
    color: '#6B7280',
  },
  levelCheckIcon: {
    position: 'absolute' as const,
    top: 20,
    right: 20,
    backgroundColor: '#10B981',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  goalsGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 12,
  },
  goalCard: {
    width: (width - 72) / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center' as const,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedGoalCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderColor: 'white',
  },
  goalIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  goalLabel: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center' as const,
  },
  selectedGoalLabel: {
    fontWeight: '600' as const,
  },
  timeContainer: {
    gap: 12,
  },
  timeCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedTimeCard: {
    backgroundColor: 'white',
  },
  timeLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: 'white',
  },
  selectedTimeLabel: {
    color: '#1F2937',
  },
  timeDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  selectedTimeDescription: {
    color: '#6B7280',
  },
  topicsScroll: {
    flex: 1,
  },
  topicsGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 12,
  },
  topicCard: {
    width: (width - 72) / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedTopicCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderColor: 'white',
  },
  topicIcon: {
    fontSize: 24,
  },
  topicLabel: {
    color: 'white',
    fontSize: 13,
    flex: 1,
  },
  selectedTopicLabel: {
    fontWeight: '600' as const,
  },
  reviewScroll: {
    flex: 1,
  },
  reviewContainer: {
    gap: 12,
    paddingBottom: 20,
  },
  reviewSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    overflow: 'hidden' as const,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  reviewSectionHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    padding: 16,
  },
  reviewSectionTitleRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
  },
  reviewSectionIcon: {
    fontSize: 20,
  },
  reviewSectionTitle: {
    color: 'white',
    fontSize: 17,
    fontWeight: '700' as const,
  },
  chevronIcon: {
    transform: [{ rotate: '0deg' }],
  },
  chevronIconExpanded: {
    transform: [{ rotate: '180deg' }],
  },
  reviewSectionContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  reviewItem: {
    gap: 8,
  },
  reviewLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 13,
    fontWeight: '500' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  reviewValue: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  reviewDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 12,
  },
  chipContainer: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
    marginTop: 4,
  },
  chip: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  chipText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '500' as const,
  },
  editButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 6,
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  editButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  footer: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500' as const,
  },
  nextButton: {
    backgroundColor: 'white',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  nextButtonDisabled: {
    opacity: 0.5,
  },
  nextButtonText: {
    color: '#1F2937',
    fontSize: 16,
    fontWeight: '600' as const,
  },
});