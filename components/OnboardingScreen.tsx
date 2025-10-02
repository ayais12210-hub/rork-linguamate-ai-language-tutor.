import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MessageCircle, Zap, Trophy, ChevronRight, Clock } from 'lucide-react-native';
import { OnboardingData } from '@/types/user';
import { useUser } from '@/hooks/user-store';

interface OnboardingScreenProps {
  onComplete: () => void;
}

const introData = [
  {
    icon: MessageCircle,
    title: 'Chat with AI Tutor',
    description: 'Practice conversations with your personal AI language tutor anytime, anywhere.',
    color: '#3B82F6',
  },
  {
    icon: Zap,
    title: 'Instant Corrections',
    description: 'Get real-time feedback and corrections to improve your grammar and vocabulary.',
    color: '#10B981',
  },
  {
    icon: Trophy,
    title: 'Track Progress',
    description: 'Build streaks, earn badges, and watch your language skills grow every day.',
    color: '#F59E0B',
  },
];

const LEARNING_GOALS = [
  { id: 'travel', label: 'Travel & Tourism', icon: '✈️' },
  { id: 'business', label: 'Business & Career', icon: '💼' },
  { id: 'academic', label: 'Academic Studies', icon: '🎓' },
  { id: 'culture', label: 'Cultural Understanding', icon: '🌍' },
  { id: 'family', label: 'Family & Friends', icon: '👨‍👩‍👧‍👦' },
  { id: 'hobby', label: 'Personal Interest', icon: '🎨' },
];

const INTERESTS = [
  { id: 'sports', label: 'Sports', icon: '⚽' },
  { id: 'music', label: 'Music', icon: '🎵' },
  { id: 'food', label: 'Food & Cooking', icon: '🍳' },
  { id: 'technology', label: 'Technology', icon: '💻' },
  { id: 'movies', label: 'Movies & TV', icon: '🎬' },
  { id: 'books', label: 'Books & Reading', icon: '📚' },
  { id: 'nature', label: 'Nature & Outdoors', icon: '🌲' },
  { id: 'art', label: 'Art & Design', icon: '🎨' },
];

const TOPICS = [
  { id: 'daily', label: 'Daily Conversations', icon: '💬' },
  { id: 'shopping', label: 'Shopping & Services', icon: '🛍️' },
  { id: 'dining', label: 'Dining & Restaurants', icon: '🍽️' },
  { id: 'directions', label: 'Directions & Transport', icon: '🗺️' },
  { id: 'work', label: 'Work & Professional', icon: '💼' },
  { id: 'social', label: 'Social Situations', icon: '👥' },
];

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [showQuestionnaire, setShowQuestionnaire] = useState<boolean>(false);
  const [questionStep, setQuestionStep] = useState<number>(0);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    learningGoals: [],
    interests: [],
    preferredTopics: [],
    dailyGoalMinutes: 15,
    currentLevel: 'beginner',
    previousExperience: '',
    motivations: [],
  });
  const { completeOnboarding } = useUser();

  const totalQuestions = 4 as const;

  const nextPage = useCallback(() => {
    if (currentPage < introData.length - 1) {
      setCurrentPage(currentPage + 1);
    } else {
      setShowQuestionnaire(true);
    }
  }, [currentPage]);

  const skipOnboarding = useCallback(() => {
    console.log('[Onboarding] Skipping onboarding');
    completeOnboarding({});
    onComplete();
  }, [completeOnboarding, onComplete]);

  const handleMultiSelect = useCallback((field: keyof OnboardingData, value: string) => {
    if (!value || value.trim().length === 0) return;
    if (value.length > 50) return;
    const sanitizedValue = value.trim();

    const currentValues = (onboardingData[field] as unknown as string[]) ?? [];
    const newValues = currentValues.includes(sanitizedValue)
      ? currentValues.filter(v => v !== sanitizedValue)
      : [...currentValues, sanitizedValue];

    setOnboardingData(prev => ({ ...prev, [field]: newValues }));
  }, [onboardingData]);

  const nextQuestion = useCallback(() => {
    if (questionStep < totalQuestions - 1) {
      setQuestionStep(questionStep + 1);
    } else {
      console.log('[Onboarding] Questionnaire finished', onboardingData);
      completeOnboarding({
        learningGoals: onboardingData.learningGoals,
        interests: onboardingData.interests,
        preferredTopics: onboardingData.preferredTopics,
        dailyGoalMinutes: onboardingData.dailyGoalMinutes,
        proficiencyLevel: onboardingData.currentLevel,
      });
      onComplete();
    }
  }, [questionStep, totalQuestions, onboardingData, completeOnboarding, onComplete]);

  const canProceed = useMemo(() => {
    switch (questionStep) {
      case 0: return onboardingData.learningGoals.length > 0;
      case 1: return onboardingData.interests.length > 0;
      case 2: return onboardingData.preferredTopics.length > 0;
      case 3: return onboardingData.dailyGoalMinutes > 0;
      default: return false;
    }
  }, [questionStep, onboardingData]);

  const renderQuestionnaire = () => {
    const questions = [
      { title: 'Learning Goals', subtitle: 'What do you want to achieve?' },
      { title: 'Your Interests', subtitle: 'What topics interest you?' },
      { title: 'Conversation Topics', subtitle: 'What would you like to practice?' },
      { title: 'Daily Goals', subtitle: 'How much time can you dedicate?' },
    ];

    const renderQuestionStep = () => {
      switch (questionStep) {
        case 0:
          return (
            <View>
              <Text style={styles.questionDescription}>
                Select your primary learning goals (choose multiple):
              </Text>
              {LEARNING_GOALS.map(goal => (
                <TouchableOpacity
                  key={goal.id}
                  style={[
                    styles.optionButton,
                    onboardingData.learningGoals.includes(goal.id) && styles.selectedOption
                  ]}
                  onPress={() => handleMultiSelect('learningGoals', goal.id)}
                >
                  <Text style={styles.optionIcon}>{goal.icon}</Text>
                  <Text style={[
                    styles.optionText,
                    onboardingData.learningGoals.includes(goal.id) && styles.selectedOptionText
                  ]}>
                    {goal.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          );

        case 1:
          return (
            <View>
              <Text style={styles.questionDescription}>
                What are your interests? This helps us personalize conversations:
              </Text>
              {INTERESTS.map(interest => (
                <TouchableOpacity
                  key={interest.id}
                  style={[
                    styles.optionButton,
                    onboardingData.interests.includes(interest.id) && styles.selectedOption
                  ]}
                  onPress={() => handleMultiSelect('interests', interest.id)}
                >
                  <Text style={styles.optionIcon}>{interest.icon}</Text>
                  <Text style={[
                    styles.optionText,
                    onboardingData.interests.includes(interest.id) && styles.selectedOptionText
                  ]}>
                    {interest.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          );

        case 2:
          return (
            <View>
              <Text style={styles.questionDescription}>
                Which conversation topics would you like to focus on?
              </Text>
              {TOPICS.map(topic => (
                <TouchableOpacity
                  key={topic.id}
                  style={[
                    styles.optionButton,
                    onboardingData.preferredTopics.includes(topic.id) && styles.selectedOption
                  ]}
                  onPress={() => handleMultiSelect('preferredTopics', topic.id)}
                >
                  <Text style={styles.optionIcon}>{topic.icon}</Text>
                  <Text style={[
                    styles.optionText,
                    onboardingData.preferredTopics.includes(topic.id) && styles.selectedOptionText
                  ]}>
                    {topic.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          );

        case 3:
          return (
            <View>
              <Text style={styles.questionDescription}>
                How many minutes per day would you like to practice?
              </Text>
              {[5, 10, 15, 20, 30, 45, 60].map(minutes => (
                <TouchableOpacity
                  key={minutes}
                  style={[
                    styles.timeButton,
                    onboardingData.dailyGoalMinutes === minutes && styles.selectedOption
                  ]}
                  onPress={() => setOnboardingData(prev => ({ ...prev, dailyGoalMinutes: minutes }))}
                >
                  <Clock size={20} color={onboardingData.dailyGoalMinutes === minutes ? 'white' : '#6B7280'} />
                  <Text style={[
                    styles.timeText,
                    onboardingData.dailyGoalMinutes === minutes && styles.selectedOptionText
                  ]}>
                    {minutes} minutes
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          );
        default:
          return null;
      }
    };

    return (
      <View style={styles.questionContainer}>
        <View style={styles.questionHeader}>
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${((questionStep + 1) / totalQuestions) * 100}%` }
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {questionStep + 1} of {totalQuestions as number}
            </Text>
          </View>

          <Text style={styles.questionTitle}>{questions[questionStep].title}</Text>
          <Text style={styles.questionSubtitle}>{questions[questionStep].subtitle}</Text>
        </View>

        <ScrollView style={styles.questionContent} showsVerticalScrollIndicator={false}>
          {renderQuestionStep()}
        </ScrollView>

        <View style={styles.questionFooter}>
          <TouchableOpacity
            style={[
              styles.questionNextButton,
              !canProceed && styles.questionNextButtonDisabled
            ]}
            onPress={nextQuestion}
            disabled={!canProceed}
          >
            <Text style={[
              styles.questionNextButtonText,
              !canProceed && styles.questionNextButtonTextDisabled
            ]}>
              {questionStep === totalQuestions - 1 ? 'Complete Setup' : 'Continue'}
            </Text>
            <ChevronRight size={20} color={!canProceed ? '#9CA3AF' : 'white'} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (showQuestionnaire) {
    return renderQuestionnaire();
  }

  const currentData = introData[currentPage];
  const IconComponent = currentData.icon;

  return (
    <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={skipOnboarding} style={styles.skipButton}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <View style={[styles.iconCircle, { backgroundColor: currentData.color }]}>
            <IconComponent size={60} color="white" />
          </View>
        </View>

        <Text style={styles.title}>{currentData.title}</Text>
        <Text style={styles.description}>{currentData.description}</Text>

        <View style={styles.pagination}>
          {introData.map((item, index) => (
            <View
              key={`intro-${index}-${item.title}`}
              style={[styles.dot, index === currentPage ? styles.activeDot : styles.inactiveDot]}
            />
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity testID="onboarding-next" style={styles.nextButton} onPress={nextPage}>
          <Text style={styles.nextButtonText}>
            {currentPage === introData.length - 1 ? 'Personalize Experience' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 60, paddingHorizontal: 20, alignItems: 'flex-end' },
  skipButton: { padding: 10 },
  skipText: { color: 'white', fontSize: 16, fontWeight: '500' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  iconContainer: { marginBottom: 40 },
  iconCircle: { width: 120, height: 120, borderRadius: 60, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 },
  title: { fontSize: 28, fontWeight: 'bold', color: 'white', textAlign: 'center', marginBottom: 20 },
  description: { fontSize: 16, color: 'rgba(255, 255, 255, 0.9)', textAlign: 'center', lineHeight: 24, marginBottom: 40 },
  pagination: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5, marginHorizontal: 5 },
  activeDot: { backgroundColor: 'white' },
  inactiveDot: { backgroundColor: 'rgba(255, 255, 255, 0.4)' },
  footer: { paddingHorizontal: 40, paddingBottom: 50 },
  nextButton: { backgroundColor: 'white', paddingVertical: 16, borderRadius: 25, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 5 },
  nextButtonText: { color: '#667eea', fontSize: 18, fontWeight: 'bold' },
  questionContainer: { flex: 1, backgroundColor: '#F9FAFB' },
  questionHeader: { paddingHorizontal: 24, paddingVertical: 20, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  progressContainer: { marginBottom: 20 },
  progressBar: { height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, marginBottom: 8 },
  progressFill: { height: '100%', backgroundColor: '#3B82F6', borderRadius: 2 },
  progressText: { fontSize: 12, color: '#6B7280', textAlign: 'center' },
  questionTitle: { fontSize: 24, fontWeight: '700', color: '#1F2937', marginBottom: 4 },
  questionSubtitle: { fontSize: 16, color: '#6B7280' },
  questionContent: { flex: 1, padding: 24 },
  questionDescription: { fontSize: 16, color: '#4B5563', marginBottom: 24, lineHeight: 24 },
  optionButton: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: 'white', borderRadius: 12, marginBottom: 12, borderWidth: 2, borderColor: '#E5E7EB' },
  selectedOption: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },
  optionIcon: { fontSize: 20, marginRight: 12 },
  optionText: { fontSize: 16, color: '#1F2937', fontWeight: '500' },
  selectedOptionText: { color: 'white' },
  timeButton: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: 'white', borderRadius: 12, marginBottom: 12, borderWidth: 2, borderColor: '#E5E7EB' },
  timeText: { fontSize: 16, color: '#1F2937', fontWeight: '500', marginLeft: 12 },
  questionFooter: { padding: 24, backgroundColor: 'white', borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  questionNextButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#3B82F6', paddingVertical: 16, paddingHorizontal: 24, borderRadius: 12 },
  questionNextButtonDisabled: { backgroundColor: '#E5E7EB' },
  questionNextButtonText: { fontSize: 16, fontWeight: '600', color: 'white', marginRight: 8 },
  questionNextButtonTextDisabled: { color: '#9CA3AF' },
});