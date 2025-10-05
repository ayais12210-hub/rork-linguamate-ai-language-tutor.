import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Animated,
  ActivityIndicator,
  TextInput,
  Dimensions,
  Pressable,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  BookOpen, 
  Play, 
  Lock, 
  Star, 
  Flame, 
  Zap,
  CheckCircle,
  Circle,
  Trophy,
  Target,
  Sparkles,
  Heart,
  Volume2,
  MessageSquare,
  Brain,
  Award,
  TrendingUp,
  Clock,
  ChevronRight,
  Headphones,
  PenTool,
  Users,
  Globe,
  Timer,
  Shuffle,
  RefreshCw,
} from 'lucide-react-native';
import { useUser } from '@/hooks/user-store';
import ErrorBoundary from '@/components/ErrorBoundary';
import { LANGUAGES } from '@/constants/languages';
import UpgradeModal from '@/components/UpgradeModal';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: screenWidth } = Dimensions.get('window');



interface Lesson {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert' | 'professional';
  xpReward: number;
  isCompleted: boolean;
  isLocked: boolean;
  exercises: Exercise[];
  category: 'vocabulary' | 'grammar' | 'conversation' | 'pronunciation' | 'listening' | 'writing' | 'culture';
  estimatedTime: number; // in minutes
  hearts: number; // lives system
  perfectBonus: number; // bonus XP for perfect completion
  unit: number;
  order: number;
}

interface Exercise {
  id: string;
  type: 'translate' | 'multiple_choice' | 'fill_blank' | 'match_pairs' | 'listening' | 'speaking' | 'word_order' | 'typing' | 'select_missing';
  question: string;
  options?: string[];
  correctAnswer: string | string[];
  explanation?: string;
  audioUrl?: string;
  nativeText?: string;
  targetText?: string;
  hint?: string;
  imageUrl?: string;
  pairs?: { left: string; right: string }[];
  words?: string[];
  difficulty: number;
}

interface LessonTemplate {
  id: string;
  titleKey: string;
  descriptionKey: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert' | 'professional';
  xpReward: number;
  category: 'vocabulary' | 'grammar' | 'conversation' | 'pronunciation' | 'listening' | 'writing' | 'culture';
  exerciseTemplates: ExerciseTemplate[];
  estimatedTime: number;
  perfectBonus: number;
  unit: number;
  order: number;
  prerequisites?: string[];
}

interface ExerciseTemplate {
  id: string;
  type: 'translate' | 'multiple_choice' | 'fill_blank' | 'match_pairs' | 'listening' | 'speaking' | 'word_order' | 'typing' | 'select_missing';
  concept: string;
  difficulty: number;
  weight: number; // importance in the lesson
}

interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  xpReward: number;
  icon: string;
  completed: boolean;
  expiresAt: Date;
}

interface WeeklyChallenge {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  xpReward: number;
  icon: string;
  completed: boolean;
  weekStart: Date;
  weekEnd: Date;
}

interface LessonProgress {
  lessonId: string;
  completedExercises: string[];
  mistakes: number;
  heartsLeft: number;
  startedAt: Date;
  completedAt?: Date;
  score: number;
}

interface ExerciseResult {
  exerciseId: string;
  question: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  explanation?: string;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress: number;
  target: number;
  xpReward: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export default function LessonsScreen() {
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [challengeTab, setChallengeTab] = useState<'daily' | 'weekly'>('daily');
  const [currentExercise, setCurrentExercise] = useState<number>(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | string[]>('');
  const [showResult, setShowResult] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState<boolean>(false);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [streakAnimation] = useState(new Animated.Value(0));
  const [isGeneratingLesson, setIsGeneratingLesson] = useState<boolean>(false);
  const [generatedLessons, setGeneratedLessons] = useState<{[key: string]: Lesson}>({});
  const [hearts, setHearts] = useState<number>(5);
  const [lessonScore, setLessonScore] = useState<number>(0);
  const [combo, setCombo] = useState<number>(0);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [typedAnswer, setTypedAnswer] = useState<string>('');
  const [selectedPairs, setSelectedPairs] = useState<{[key: string]: string}>({});
  const [wordOrder, setWordOrder] = useState<string[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [lessonProgress, setLessonProgress] = useState<LessonProgress | null>(null);
  const [showAchievement, setShowAchievement] = useState<Achievement | null>(null);
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | 'beginner' | 'intermediate' | 'advanced'>('all');
  const [currentUnit, setCurrentUnit] = useState<number>(1);
  const [results, setResults] = useState<ExerciseResult[]>([]);
  const [showCompletion, setShowCompletion] = useState<boolean>(false);
  const [xpEarned, setXpEarned] = useState<number>(0);
  const [lessonStartedAt, setLessonStartedAt] = useState<number>(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const heartAnimation = useRef(new Animated.Value(1)).current;
  const comboAnimation = useRef(new Animated.Value(0)).current;
  const achievementAnimation = useRef(new Animated.Value(0)).current;
  
  const { user, updateStats, upgradeToPremium } = useUser();

  const STORAGE_KEYS = {
    completedLessons: 'lessons_completed_v1',
    generatedLessons: 'lessons_generated_v1',
  } as const;
  
  const selectedLanguage = LANGUAGES.find(lang => lang.code === user.selectedLanguage);
  const nativeLanguage = LANGUAGES.find(lang => lang.code === user.nativeLanguage);
  
  const dailyChallenges: DailyChallenge[] = [
    {
      id: 'daily_lesson',
      title: 'Complete 3 Lessons',
      description: 'Finish 3 lessons today',
      target: 3,
      current: completedLessons.length,
      xpReward: 50,
      icon: '🎯',
      completed: completedLessons.length >= 3,
      expiresAt: new Date(new Date().setHours(23, 59, 59, 999)),
    },
    {
      id: 'perfect_score',
      title: 'Perfect Score',
      description: 'Get 100% on any lesson',
      target: 1,
      current: 0,
      xpReward: 30,
      icon: '⭐',
      completed: false,
      expiresAt: new Date(new Date().setHours(23, 59, 59, 999)),
    },
    {
      id: 'streak_maintain',
      title: 'Maintain Streak',
      description: 'Keep your learning streak alive',
      target: 1,
      current: (user.stats?.streakDays || 0) > 0 ? 1 : 0,
      xpReward: 20,
      icon: '🔥',
      completed: (user.stats?.streakDays || 0) > 0,
      expiresAt: new Date(new Date().setHours(23, 59, 59, 999)),
    },
  ];
  
  const getWeekBounds = () => {
    const now = new Date();
    const day = now.getDay();
    const diffToMonday = (day + 6) % 7;
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    start.setDate(now.getDate() - diffToMonday);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  };

  const weeklyChallenges: WeeklyChallenge[] = useMemo(() => {
    const { start, end } = getWeekBounds();
    const lessonsCompleted = completedLessons.length;
    const xp = user.stats?.xpPoints ?? 0;
    const words = user.stats?.wordsLearned ?? 0;

    return [
      {
        id: 'weekly_lessons',
        title: 'Finish 12 Lessons',
        description: 'Complete 12 lessons this week',
        target: 12,
        current: Math.min(lessonsCompleted, 12),
        xpReward: 200,
        icon: '📘',
        completed: lessonsCompleted >= 12,
        weekStart: start,
        weekEnd: end,
      },
      {
        id: 'weekly_xp',
        title: 'Earn 500 XP',
        description: 'Grind XP throughout the week',
        target: 500,
        current: Math.min(xp, 500),
        xpReward: 150,
        icon: '⚡',
        completed: xp >= 500,
        weekStart: start,
        weekEnd: end,
      },
      {
        id: 'weekly_words',
        title: 'Learn 60 Words',
        description: 'Expand your vocabulary',
        target: 60,
        current: Math.min(words, 60),
        xpReward: 150,
        icon: '🧠',
        completed: words >= 60,
        weekStart: start,
        weekEnd: end,
      },
    ];
  }, [completedLessons.length, user.stats?.xpPoints, user.stats?.wordsLearned]);

  const lessonTemplates: LessonTemplate[] = useMemo(() => [
    {
      id: 'basics_1',
      titleKey: 'Basic Greetings',
      descriptionKey: 'Learn essential greetings and introductions',
      difficulty: 'beginner',
      xpReward: 20,
      category: 'vocabulary',
      estimatedTime: 5,
      perfectBonus: 10,
      unit: 1,
      order: 1,
      exerciseTemplates: [
        { id: 'ex1', type: 'multiple_choice', concept: 'hello_greeting', difficulty: 1, weight: 1 },
        { id: 'ex2', type: 'translate', concept: 'good_morning', difficulty: 1, weight: 2 },
        { id: 'ex3', type: 'fill_blank', concept: 'introduce_name', difficulty: 2, weight: 2 },
        { id: 'ex4', type: 'word_order', concept: 'greeting_sentence', difficulty: 2, weight: 3 },
        { id: 'ex5', type: 'typing', concept: 'write_hello', difficulty: 1, weight: 2 },
      ],
    },
    {
      id: 'numbers_1',
      titleKey: 'Numbers 1-10',
      descriptionKey: 'Master basic numbers',
      difficulty: 'beginner',
      xpReward: 15,
      category: 'vocabulary',
      estimatedTime: 5,
      perfectBonus: 8,
      unit: 1,
      order: 2,
      exerciseTemplates: [
        { id: 'ex1', type: 'multiple_choice', concept: 'numbers_1_10', difficulty: 1, weight: 1 },
        { id: 'ex2', type: 'translate', concept: 'count_objects', difficulty: 2, weight: 2 },
        { id: 'ex3', type: 'listening', concept: 'hear_numbers', difficulty: 2, weight: 3 },
        { id: 'ex4', type: 'match_pairs', concept: 'number_words', difficulty: 1, weight: 2 },
      ],
    },
    {
      id: 'family_1',
      titleKey: 'Family Members',
      descriptionKey: 'Learn family vocabulary',
      difficulty: 'beginner',
      xpReward: 25,
      category: 'vocabulary',
      estimatedTime: 7,
      perfectBonus: 12,
      unit: 1,
      order: 3,
      exerciseTemplates: [
        { id: 'ex1', type: 'multiple_choice', concept: 'family_members', difficulty: 1, weight: 1 },
        { id: 'ex2', type: 'translate', concept: 'family_relationships', difficulty: 2, weight: 2 },
        { id: 'ex3', type: 'match_pairs', concept: 'family_tree', difficulty: 2, weight: 2 },
        { id: 'ex4', type: 'select_missing', concept: 'family_sentence', difficulty: 3, weight: 3 },
        { id: 'ex5', type: 'word_order', concept: 'describe_family', difficulty: 3, weight: 3 },
      ],
    },
    {
      id: 'colors_1',
      titleKey: 'Colors',
      descriptionKey: 'Learn basic colors',
      difficulty: 'beginner',
      xpReward: 20,
      category: 'vocabulary',
      estimatedTime: 6,
      perfectBonus: 10,
      unit: 1,
      order: 4,
      exerciseTemplates: [
        { id: 'ex1', type: 'multiple_choice', concept: 'basic_colors', difficulty: 1, weight: 1 },
        { id: 'ex2', type: 'fill_blank', concept: 'describe_colors', difficulty: 2, weight: 2 },
        { id: 'ex3', type: 'listening', concept: 'hear_colors', difficulty: 2, weight: 2 },
        { id: 'ex4', type: 'typing', concept: 'write_colors', difficulty: 2, weight: 2 },
      ],
    },
    {
      id: 'present_tense',
      titleKey: 'Present Tense Verbs',
      descriptionKey: 'Master present tense conjugations',
      difficulty: 'intermediate',
      xpReward: 35,
      category: 'grammar',
      estimatedTime: 10,
      perfectBonus: 15,
      unit: 2,
      order: 1,
      prerequisites: ['basics_1'],
      exerciseTemplates: [
        { id: 'ex1', type: 'fill_blank', concept: 'present_tense_conjugation', difficulty: 3, weight: 3 },
        { id: 'ex2', type: 'multiple_choice', concept: 'verb_forms', difficulty: 3, weight: 2 },
        { id: 'ex3', type: 'word_order', concept: 'present_sentences', difficulty: 4, weight: 3 },
        { id: 'ex4', type: 'typing', concept: 'conjugate_verbs', difficulty: 4, weight: 4 },
        { id: 'ex5', type: 'select_missing', concept: 'verb_endings', difficulty: 3, weight: 3 },
      ],
    },
    {
      id: 'food_1',
      titleKey: 'Food & Drinks',
      descriptionKey: 'Learn food vocabulary',
      difficulty: 'beginner',
      xpReward: 25,
      category: 'vocabulary',
      estimatedTime: 8,
      perfectBonus: 12,
      unit: 1,
      order: 5,
      exerciseTemplates: [
        { id: 'ex1', type: 'multiple_choice', concept: 'common_foods', difficulty: 1, weight: 1 },
        { id: 'ex2', type: 'translate', concept: 'ordering_food', difficulty: 2, weight: 3 },
        { id: 'ex3', type: 'listening', concept: 'restaurant_dialogue', difficulty: 3, weight: 3 },
        { id: 'ex4', type: 'match_pairs', concept: 'food_categories', difficulty: 2, weight: 2 },
        { id: 'ex5', type: 'speaking', concept: 'order_meal', difficulty: 3, weight: 4 },
      ],
    },
    {
      id: 'daily_routine',
      titleKey: 'Daily Routine',
      descriptionKey: 'Describe your daily activities',
      difficulty: 'intermediate',
      xpReward: 30,
      category: 'conversation',
      estimatedTime: 9,
      perfectBonus: 15,
      unit: 2,
      order: 2,
      prerequisites: ['present_tense'],
      exerciseTemplates: [
        { id: 'ex1', type: 'word_order', concept: 'routine_sentences', difficulty: 3, weight: 3 },
        { id: 'ex2', type: 'fill_blank', concept: 'time_expressions', difficulty: 3, weight: 2 },
        { id: 'ex3', type: 'speaking', concept: 'describe_day', difficulty: 4, weight: 4 },
        { id: 'ex4', type: 'listening', concept: 'daily_schedule', difficulty: 3, weight: 3 },
        { id: 'ex5', type: 'typing', concept: 'write_routine', difficulty: 4, weight: 4 },
      ],
    },
    {
      id: 'directions',
      titleKey: 'Directions & Places',
      descriptionKey: 'Navigate and describe locations',
      difficulty: 'intermediate',
      xpReward: 32,
      category: 'conversation',
      estimatedTime: 10,
      perfectBonus: 16,
      unit: 2,
      order: 3,
      exerciseTemplates: [
        { id: 'ex1', type: 'multiple_choice', concept: 'direction_words', difficulty: 2, weight: 2 },
        { id: 'ex2', type: 'listening', concept: 'follow_directions', difficulty: 4, weight: 4 },
        { id: 'ex3', type: 'speaking', concept: 'give_directions', difficulty: 4, weight: 4 },
        { id: 'ex4', type: 'word_order', concept: 'location_sentences', difficulty: 3, weight: 3 },
        { id: 'ex5', type: 'translate', concept: 'place_descriptions', difficulty: 3, weight: 3 },
      ],
    },
    {
      id: 'past_tense',
      titleKey: 'Past Tense',
      descriptionKey: 'Talk about past events',
      difficulty: 'advanced',
      xpReward: 40,
      category: 'grammar',
      estimatedTime: 12,
      perfectBonus: 20,
      unit: 3,
      order: 1,
      prerequisites: ['present_tense', 'daily_routine'],
      exerciseTemplates: [
        { id: 'ex1', type: 'fill_blank', concept: 'past_conjugation', difficulty: 4, weight: 4 },
        { id: 'ex2', type: 'select_missing', concept: 'irregular_past', difficulty: 5, weight: 4 },
        { id: 'ex3', type: 'word_order', concept: 'past_sentences', difficulty: 4, weight: 3 },
        { id: 'ex4', type: 'typing', concept: 'write_past_story', difficulty: 5, weight: 5 },
        { id: 'ex5', type: 'speaking', concept: 'tell_story', difficulty: 5, weight: 5 },
        { id: 'ex6', type: 'translate', concept: 'past_narrative', difficulty: 4, weight: 4 },
      ],
    },
    {
      id: 'culture_1',
      titleKey: 'Cultural Insights',
      descriptionKey: 'Learn about customs and traditions',
      difficulty: 'intermediate',
      xpReward: 28,
      category: 'culture',
      estimatedTime: 8,
      perfectBonus: 14,
      unit: 2,
      order: 4,
      exerciseTemplates: [
        { id: 'ex1', type: 'multiple_choice', concept: 'cultural_facts', difficulty: 2, weight: 2 },
        { id: 'ex2', type: 'listening', concept: 'cultural_dialogue', difficulty: 3, weight: 3 },
        { id: 'ex3', type: 'translate', concept: 'idioms', difficulty: 4, weight: 4 },
        { id: 'ex4', type: 'fill_blank', concept: 'customs', difficulty: 3, weight: 3 },
      ],
    },
  ], []);

  const generateLessonContent = async (template: LessonTemplate): Promise<Lesson> => {
    if (generatedLessons[template.id]) {
      return generatedLessons[template.id];
    }

    if (!selectedLanguage || !nativeLanguage) {
      throw new Error('Languages not selected');
    }

    setIsGeneratingLesson(true);
    
    try {
      const completedCount = completedLessons.length;
      const difficultyBoost = Math.min(3, Math.floor(completedCount / 5));
      const baseCount = template.exerciseTemplates.length;
      const targetCount = Math.min(20, baseCount + difficultyBoost * 3);
      const effectiveDifficulty = (() => {
        const order = ['beginner', 'intermediate', 'advanced', 'expert', 'professional'] as const;
        const idx = Math.max(0, order.indexOf(template.difficulty));
        const bumped = Math.min(order.length - 1, idx + (completedCount >= 15 ? 2 : completedCount >= 8 ? 1 : 0));
        return order[bumped];
      })();

      const prompt = `Generate a comprehensive language learning lesson for learning ${selectedLanguage.name} from ${nativeLanguage.name}.

Lesson Details:
- Title: ${template.titleKey}
- Description: ${template.descriptionKey}
- Difficulty: ${effectiveDifficulty}
- Category: ${template.category}

Generate ${targetCount} exercises mixing and matching these templates and increasing challenge gradually:
${template.exerciseTemplates.map(ex => `- ${ex.type}: ${ex.concept} (base difficulty ${ex.difficulty})`).join('\n')}

Rules for every exercise:
1. Provide a clear "question" in ${nativeLanguage.name}.
2. For multiple_choice: include exactly 4 distinct "options" with 1 "correctAnswer".
3. For fill_blank: include exactly 4 "options" with 1 "correctAnswer".
4. For translate: include "nativeText" (in ${nativeLanguage.name}) and string "correctAnswer" (in ${selectedLanguage.name}).
5. For word_order: include "words" (array of shuffled tokens) and string "correctAnswer" (full correct sentence in ${selectedLanguage.name}).
6. For match_pairs: include "pairs" array: {"left": native term, "right": target translation}.
7. Always include a concise "explanation" in ${nativeLanguage.name}.
8. IDs must be unique (ex1, ex2, ...), types limited to translate | multiple_choice | fill_blank | match_pairs | listening | speaking | word_order | typing | select_missing.
9. Keep all strings plain (no markdown), and avoid phonetic scripts unless necessary.

Return ONLY valid JSON with this structure:
{
  "exercises": [
    {
      "id": "ex1",
      "type": "multiple_choice",
      "question": "...",
      "options": ["option1", "option2", "option3", "option4"],
      "correctAnswer": "correct option",
      "explanation": "..."
    }
  ]
}`;

      const response = await fetch('https://toolkit.rork.com/text/llm/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate lesson content');
      }

      const data = await response.json();
      let completionText = data.completion;
      
      // Clean up the response text
      completionText = completionText.trim();
      
      // Remove markdown code blocks if present
      if (completionText.includes('```')) {
        completionText = completionText.replace(/```json\s*/g, '').replace(/```\s*/g, '').replace(/\s*```$/g, '');
      }
      
      // Remove any leading/trailing whitespace and newlines
      completionText = completionText.trim();
      
      // Find JSON content between braces if there's extra text
      const jsonMatch = completionText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        completionText = jsonMatch[0];
      }
      
      if (__DEV__) {

      
        console.log('Cleaned completion text:', completionText);

      
      }
      
      const lessonData = JSON.parse(completionText);
      
      const lesson: Lesson = {
        id: template.id,
        title: template.titleKey,
        description: template.descriptionKey,
        difficulty: effectiveDifficulty,
        xpReward: template.xpReward + Math.min(50, difficultyBoost * 10),
        isCompleted: completedLessons.includes(template.id),
        isLocked: false,
        category: template.category,
        exercises: lessonData.exercises,
        estimatedTime: Math.max(template.estimatedTime, Math.ceil((lessonData.exercises?.length ?? 0) * 1.2)),
        hearts: 5,
        perfectBonus: template.perfectBonus + difficultyBoost * 5,
        unit: template.unit,
        order: template.order,
      };

      setGeneratedLessons(prev => ({ ...prev, [template.id]: lesson }));
      return lesson;
    } catch (error) {
      if (__DEV__) {

        console.error('Error generating lesson:', error);

      }
      throw error;
    } finally {
      setIsGeneratingLesson(false);
    }
  };

  const lessons: Lesson[] = useMemo(() => {
    const completedCount = completedLessons.length;
    return lessonTemplates.map((template, index) => {
      const previousLessonCompleted = index === 0 || completedLessons.includes(lessonTemplates[index - 1].id);
      const isLocked = !previousLessonCompleted && (template.difficulty === 'intermediate' || template.difficulty === 'advanced' || template.difficulty === 'expert' || template.difficulty === 'professional') && !user.isPremium;

      const effectiveDifficulty = (() => {
        const order = ['beginner', 'intermediate', 'advanced', 'expert', 'professional'] as const;
        const idx = Math.max(0, order.indexOf(template.difficulty));
        const bumped = Math.min(order.length - 1, idx + (completedCount >= 15 ? 2 : completedCount >= 8 ? 1 : 0));
        return order[bumped];
      })();
      
      return {
        id: template.id,
        title: template.titleKey,
        description: template.descriptionKey,
        difficulty: effectiveDifficulty,
        xpReward: template.xpReward,
        isCompleted: completedLessons.includes(template.id),
        isLocked,
        category: template.category,
        exercises: [],
        estimatedTime: template.estimatedTime,
        hearts: 5,
        perfectBonus: template.perfectBonus,
        unit: template.unit,
        order: template.order,
      };
    });
  }, [lessonTemplates, completedLessons, user.isPremium]);
  
  const filteredLessons = useMemo(() => {
    return difficultyFilter === 'all' ? lessons : lessons.filter(l => l.difficulty === difficultyFilter);
  }, [lessons, difficultyFilter]);
  
  useEffect(() => {
    if ((user.stats?.streakDays || 0) > 0) {
      Animated.sequence([
        Animated.timing(streakAnimation, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(streakAnimation, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [user.stats?.streakDays, streakAnimation]);

  useEffect(() => {
    (async () => {
      try {
        if (__DEV__) {

          console.log('[Lessons] Loading persisted state');

        }
        const [completedRaw, generatedRaw] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.completedLessons),
          AsyncStorage.getItem(STORAGE_KEYS.generatedLessons),
        ]);
        if (completedRaw) {
          const parsed: string[] = JSON.parse(completedRaw);
          setCompletedLessons(Array.isArray(parsed) ? parsed : []);
        }
        if (generatedRaw) {
          const parsed: { [key: string]: Lesson } = JSON.parse(generatedRaw);
          setGeneratedLessons(parsed ?? {});
        }
      } catch (e) {
        if (__DEV__) {

          console.log('[Lessons] Failed to load persisted state', e);

        }
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await AsyncStorage.setItem(STORAGE_KEYS.completedLessons, JSON.stringify(completedLessons));
        await AsyncStorage.setItem(STORAGE_KEYS.generatedLessons, JSON.stringify(generatedLessons));
      } catch (e) {
        if (__DEV__) {

          console.log('[Lessons] Failed to persist state', e);

        }
      }
    })();
  }, [completedLessons, generatedLessons]);
  
  const startLesson = async (lesson: Lesson) => {
    if (lesson.isLocked && !user.isPremium) {
      setShowUpgradeModal(true);
      return;
    }

    if (!selectedLanguage || !nativeLanguage) {
      Alert.alert('Error', 'Please select your languages in settings first.');
      return;
    }
    
    try {
      const template = lessonTemplates.find(t => t.id === lesson.id);
      if (!template) {
        Alert.alert('Error', 'Lesson template not found.');
        return;
      }

      const generatedLesson = await generateLessonContent(template);
      if (__DEV__) {

        console.log('[Lessons] Starting lesson', generatedLesson.id);

      }
      setSelectedLesson(generatedLesson);
      setCurrentExercise(0);
      setSelectedAnswer('');
      setShowResult(false);
      setResults([]);
      setShowCompletion(false);
      setXpEarned(0);
      setLessonStartedAt(Date.now());
    } catch (error) {
      Alert.alert('Error', 'Failed to load lesson. Please try again.');
      if (__DEV__) {

        console.error('Error starting lesson:', error);

      }
    }
  };
  
  const submitAnswer = () => {
    if (!selectedLesson) return;
    
    const exercise = selectedLesson.exercises[currentExercise];
    let answerToCheck = selectedAnswer;
    
    // For translate exercises, use typed answer
    if (exercise.type === 'translate' && typedAnswer.trim()) {
      answerToCheck = typedAnswer.trim();
      setSelectedAnswer(answerToCheck);
    }
    
    if (!answerToCheck) return;
    
    let correct = false;
    
    if (exercise.type === 'match_pairs') {
      // Check if all pairs are correctly matched
      try {
        const userPairs = typeof answerToCheck === 'string' ? JSON.parse(answerToCheck) : answerToCheck;
        const correctPairs = exercise.pairs?.reduce((acc, pair) => {
          acc[pair.left] = pair.right;
          return acc;
        }, {} as {[key: string]: string}) || {};
        
        correct = JSON.stringify(userPairs) === JSON.stringify(correctPairs);
      } catch {
        correct = false;
      }
    } else if (typeof answerToCheck === 'string' && typeof exercise.correctAnswer === 'string') {
      // For text-based answers, do case-insensitive comparison and handle multiple correct answers
      const userAnswer = answerToCheck.toLowerCase().trim();
      const correctAnswers = exercise.correctAnswer.toLowerCase().split('|').map(a => a.trim());
      correct = correctAnswers.some(answer => {
        // Exact match or close match (allowing for minor variations)
        return userAnswer === answer || 
               userAnswer.includes(answer) || 
               answer.includes(userAnswer) ||
               levenshteinDistance(userAnswer, answer) <= Math.max(1, Math.floor(answer.length * 0.2));
      });
    } else if (Array.isArray(answerToCheck) && Array.isArray(exercise.correctAnswer)) {
      correct = JSON.stringify(answerToCheck) === JSON.stringify(exercise.correctAnswer);
    }
    
    setIsCorrect(correct);
    setShowResult(true);

    const userAnswerString = Array.isArray(selectedAnswer)
      ? selectedAnswer.join(' ')
      : typeof selectedAnswer === 'string'
        ? selectedAnswer
        : JSON.stringify(selectedAnswer);

    const correctAnswerString = Array.isArray(exercise.correctAnswer)
      ? exercise.correctAnswer.join(' ')
      : String(exercise.correctAnswer ?? '');

    setResults(prev => ([
      ...prev,
      {
        exerciseId: exercise.id,
        question: exercise.question,
        userAnswer: userAnswerString,
        correctAnswer: correctAnswerString,
        isCorrect: correct,
        explanation: exercise.explanation,
      },
    ]));
    
    if (correct) {
      updateStats({
        xpPoints: (user.stats?.xpPoints || 0) + 5,
      });
    }
    
    setTimeout(() => {
      if (currentExercise < selectedLesson.exercises.length - 1) {
        nextExercise();
      } else {
        completeLesson();
      }
    }, 2500);
  };
  
  const nextExercise = () => {
    setCurrentExercise(prev => prev + 1);
    setSelectedAnswer('');
    setTypedAnswer('');
    setWordOrder([]);
    setSelectedPairs({});
    setShowResult(false);
  };
  
  // Simple Levenshtein distance function for fuzzy matching
  const levenshteinDistance = (str1: string, str2: string): number => {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  };
  
  const completeLesson = () => {
    if (!selectedLesson) return;

    const total = selectedLesson.exercises.length;
    const correctCount = results.filter(r => r.isCorrect).length;
    const perfect = correctCount === total && total > 0;
    const bonus = perfect ? selectedLesson.perfectBonus : 0;
    const totalXp = selectedLesson.xpReward + bonus;

    setCompletedLessons(prev => [...prev, selectedLesson.id]);

    updateStats({
      xpPoints: (user.stats?.xpPoints || 0) + totalXp,
      wordsLearned: (user.stats?.wordsLearned || 0) + total,
    });

    setXpEarned(totalXp);
    setShowCompletion(true);
  };
  
  const handleUpgrade = () => {
    setShowUpgradeModal(false);
    upgradeToPremium();
    Alert.alert('Success!', 'You now have Premium access to all lessons!');
  };
  
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return '#10B981';
      case 'intermediate': return '#F59E0B';
      case 'advanced': return '#EF4444';
      case 'expert': return '#2563EB';
      case 'professional': return '#8B5CF6';
      default: return '#6B7280';
    }
  };
  
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'vocabulary': return BookOpen;
      case 'grammar': return Target;
      case 'conversation': return MessageSquare;
      case 'pronunciation': return Volume2;
      case 'listening': return Headphones;
      case 'writing': return PenTool;
      case 'culture': return Globe;
      default: return BookOpen;
    }
  };
  
  const generateSuggestions = useCallback((exercise: Exercise): string[] => {
    const maxOptions = 4;
    const options: string[] = [];

    const pushUnique = (val: string) => {
      const v = val.trim();
      if (v && !options.includes(v)) options.push(v);
    };

    if (exercise.options && exercise.options.length > 0) {
      exercise.options.forEach(pushUnique);
    }

    const correct = Array.isArray(exercise.correctAnswer)
      ? exercise.correctAnswer.join(' ')
      : String(exercise.correctAnswer ?? '').trim();

    if (correct) pushUnique(correct);

    const variants: string[] = [];
    const lower = correct.toLowerCase();
    if (lower) {
      variants.push(lower);
      variants.push(lower.replace(/\bthe\b/gi, '').replace(/\s+/g, ' ').trim());
      if (lower.length > 3) variants.push(lower.slice(0, -1));
      variants.push(lower.replace(/\s/g, ''));
    }

    variants.forEach(pushUnique);

    while (options.length < maxOptions) {
      pushUnique(`${correct} ${options.length + 1}`);
    }

    const sliced = options.slice(0, maxOptions);
    for (let i = sliced.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [sliced[i], sliced[j]] = [sliced[j], sliced[i]];
    }
    return sliced;
  }, []);

  const renderCompletionScreen = () => {
    if (!selectedLesson) return null;
    const total = selectedLesson.exercises.length;
    const correctCount = results.filter(r => r.isCorrect).length;
    const durationSec = Math.max(1, Math.floor((Date.now() - lessonStartedAt) / 1000));
    return (
      <ErrorBoundary>
        <SafeAreaView style={styles.container}>
          <ScrollView contentContainerStyle={styles.completionScroll}>
            <View style={styles.completionHeader}>
              <View style={styles.trophyCircle}>
                <Trophy size={40} color="#F59E0B" />
              </View>
              <Text style={styles.completionTitle} testID="lesson-complete-title">Congratulations!</Text>
              <Text style={styles.completionSubtitle}>Lesson completed</Text>
            </View>

            <View style={styles.completionStatsRow}>
              <View style={styles.completionStatCard}>
                <Zap size={18} color="#F59E0B" />
                <Text style={styles.completionStatValue}>+{xpEarned}</Text>
                <Text style={styles.completionStatLabel}>XP Earned</Text>
              </View>
              <View style={styles.completionStatCard}>
                <CheckCircle size={18} color="#10B981" />
                <Text style={styles.completionStatValue}>{correctCount}/{total}</Text>
                <Text style={styles.completionStatLabel}>Correct</Text>
              </View>
              <View style={styles.completionStatCard}>
                <Clock size={18} color="#3B82F6" />
                <Text style={styles.completionStatValue}>{durationSec}s</Text>
                <Text style={styles.completionStatLabel}>Time</Text>
              </View>
            </View>

            <View style={styles.recapCard}>
              <Text style={styles.recapTitle}>Recap</Text>
              {selectedLesson.exercises.map((ex, idx) => {
                const res = results[idx];
                const isRight = res?.isCorrect ?? false;
                return (
                  <View key={ex.id} style={styles.recapItem} testID={`recap-${idx}`}>
                    <Text style={styles.recapQuestion}>{idx + 1}. {ex.question}</Text>
                    <View style={[styles.answerPill, isRight ? styles.answerPillCorrect : styles.answerPillIncorrect]}>
                      <Text style={[styles.answerPillText, isRight ? styles.answerPillTextCorrect : styles.answerPillTextIncorrect]}>
                        Your answer: {res?.userAnswer ?? ''}
                      </Text>
                    </View>
                    {!isRight && (
                      <View style={styles.correctAnswerRow}>
                        <Text style={styles.completionCorrectAnswerLabel}>Correct:</Text>
                        <Text style={styles.completionCorrectAnswerValue}>
                          {Array.isArray(ex.correctAnswer) ? ex.correctAnswer.join(' ') : String(ex.correctAnswer)}
                        </Text>
                      </View>
                    )}
                    {!!ex.explanation && (
                      <Text style={styles.explanationSmall}>{ex.explanation}</Text>
                    )}
                  </View>
                );
              })}
            </View>

            <View style={styles.completionButtonsRow}>
              <TouchableOpacity
                style={[styles.primaryButton]}
                testID="back-to-lessons"
                onPress={() => {
                  setSelectedLesson(null);
                  setShowCompletion(false);
                }}
              >
                <Text style={styles.primaryButtonText}>Back to Lessons</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </ErrorBoundary>
    );
  };

  // Render lesson exercise view
  const renderLessonExercise = () => {
    if (!selectedLesson) return null;
    
    const exercise = selectedLesson.exercises[currentExercise];
    const progress = ((currentExercise + 1) / selectedLesson.exercises.length) * 100;
    
    return (
      <ErrorBoundary>
        <SafeAreaView style={styles.container}>
          <View style={styles.lessonHeader}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => setSelectedLesson(null)}
              testID="lesson-exit"
            >
              <Text style={styles.backButtonText}>✕</Text>
            </TouchableOpacity>
          
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.progressText}>
              {currentExercise + 1} / {selectedLesson.exercises.length}
            </Text>
          </View>
          
          <View style={styles.xpContainer}>
            <Zap size={16} color="#F59E0B" />
            <Text style={styles.xpText}>{selectedLesson.xpReward}</Text>
          </View>
        </View>
        
        <ScrollView style={styles.exerciseContent}>
          <Text style={styles.exerciseQuestion} testID={`exercise-question-${currentExercise}`}>{exercise.question}</Text>
          
          {exercise.type === 'multiple_choice' && exercise.options && (
            <View style={styles.optionsContainer}>
              {exercise.options.map((option, index) => (
                <TouchableOpacity
                  key={`mc_${index}`}
                  testID={`mc-option-${index}`}
                  style={[
                    styles.optionButton,
                    selectedAnswer === option && styles.selectedOption,
                    showResult && option === exercise.correctAnswer && styles.correctOption,
                    showResult && selectedAnswer === option && selectedAnswer !== exercise.correctAnswer && styles.incorrectOption,
                  ]}
                  onPress={() => !showResult && setSelectedAnswer(option)}
                  disabled={showResult}
                >
                  <Text style={[
                    styles.optionText,
                    selectedAnswer === option && styles.selectedOptionText,
                  ]}>
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          
          {exercise.type === 'fill_blank' && exercise.options && (
            <View style={styles.optionsContainer}>
              {exercise.options.map((option, index) => (
                <TouchableOpacity
                  key={`fill_blank_${index}`}
                  testID={`fillblank-option-${index}`}
                  style={[
                    styles.optionButton,
                    selectedAnswer === option && styles.selectedOption,
                    showResult && option === exercise.correctAnswer && styles.correctOption,
                    showResult && selectedAnswer === option && selectedAnswer !== exercise.correctAnswer && styles.incorrectOption,
                  ]}
                  onPress={() => !showResult && setSelectedAnswer(option)}
                  disabled={showResult}
                >
                  <Text style={[
                    styles.optionText,
                    selectedAnswer === option && styles.selectedOptionText,
                  ]}>
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          
          {exercise.type === 'translate' && (
            <View style={styles.translateContainer}>
              <View style={styles.translateBox}>
                <Text style={styles.translatePrompt}>
                  Translate to {selectedLanguage?.name}:
                </Text>
                <Text style={styles.translateText}>
                  {exercise.nativeText || exercise.question}
                </Text>
              </View>
              
              <View style={styles.inputContainer}>
                <TextInput
                  testID="translate-input"
                  style={[
                    styles.translateInput,
                    showResult && isCorrect && styles.correctInput,
                    showResult && !isCorrect && styles.incorrectInput,
                  ]}
                  value={typedAnswer}
                  onChangeText={(t) => {
                    setTypedAnswer(t);
                    setSelectedAnswer(t.trim());
                  }}
                  placeholder={`Type in ${selectedLanguage?.name}...`}
                  placeholderTextColor="#9CA3AF"
                  multiline
                  editable={!showResult}
                  onSubmitEditing={() => {
                    if (typedAnswer.trim()) {
                      setSelectedAnswer(typedAnswer.trim());
                    }
                  }}
                />
              </View>

              <View style={styles.suggestionsRow}>
                {generateSuggestions(exercise).map((sug, idx) => (
                  <TouchableOpacity
                    key={`translate-suggestion-${idx}`}
                    testID={`translate-suggestion-${idx}`}
                    style={styles.suggestionChip}
                    disabled={showResult}
                    onPress={() => {
                      if (!showResult) {
                        setTypedAnswer(sug);
                        setSelectedAnswer(sug);
                      }
                    }}
                  >
                    <Text style={styles.suggestionText}>{sug}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              {showResult && (
                <View style={styles.correctAnswerContainer}>
                  <Text style={styles.correctAnswerLabel}>Correct answer:</Text>
                  <Text style={styles.correctAnswerText}>{exercise.correctAnswer}</Text>
                </View>
              )}
            </View>
          )}
          
          {exercise.type === 'typing' && (
            <View style={styles.translateContainer}>
              <View style={styles.translateBox}>
                <Text style={styles.translatePrompt}>Type your answer:</Text>
                <Text style={styles.translateText}>{exercise.question}</Text>
              </View>

              <View style={styles.inputContainer}>
                <TextInput
                  testID="typing-input"
                  style={[
                    styles.translateInput,
                    showResult && isCorrect && styles.correctInput,
                    showResult && !isCorrect && styles.incorrectInput,
                  ]}
                  value={typedAnswer}
                  onChangeText={(t) => {
                    setTypedAnswer(t);
                    setSelectedAnswer(t.trim());
                  }}
                  placeholder="Type here..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  editable={!showResult}
                />
              </View>

              <View style={styles.suggestionsRow}>
                {generateSuggestions(exercise).map((sug, idx) => (
                  <TouchableOpacity
                    key={`typing-suggestion-${idx}`}
                    testID={`typing-suggestion-${idx}`}
                    style={styles.suggestionChip}
                    disabled={showResult}
                    onPress={() => {
                      if (!showResult) {
                        setTypedAnswer(sug);
                        setSelectedAnswer(sug);
                      }
                    }}
                  >
                    <Text style={styles.suggestionText}>{sug}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {showResult && (
                <View style={styles.correctAnswerContainer}>
                  <Text style={styles.correctAnswerLabel}>Correct answer:</Text>
                  <Text style={styles.correctAnswerText}>{Array.isArray(exercise.correctAnswer) ? exercise.correctAnswer.join(' ') : exercise.correctAnswer}</Text>
                </View>
              )}
            </View>
          )}

          {exercise.type === 'word_order' && exercise.words && (
            <View style={styles.wordOrderContainer}>
              <Text style={styles.wordOrderPrompt}>
                Arrange the words in the correct order:
              </Text>
              
              <View style={styles.wordBankContainer}>
                {exercise.words.map((word, index) => (
                  <TouchableOpacity
                    key={`word_${index}`}
                    style={[
                      styles.wordChip,
                      wordOrder.includes(word) && styles.usedWordChip,
                    ]}
                    onPress={() => {
                      if (!showResult && !wordOrder.includes(word)) {
                        const newOrder = [...wordOrder, word];
                        setWordOrder(newOrder);
                        setSelectedAnswer(newOrder.join(' '));
                      }
                    }}
                    disabled={showResult || wordOrder.includes(word)}
                  >
                    <Text style={[
                      styles.wordChipText,
                      wordOrder.includes(word) && styles.usedWordChipText,
                    ]}>
                      {word}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              <View style={styles.sentenceContainer}>
                <Text style={styles.sentenceLabel}>Your sentence:</Text>
                <View style={styles.sentenceBox}>
                  {wordOrder.length > 0 ? (
                    <Text style={styles.sentenceText}>{wordOrder.join(' ')}</Text>
                  ) : (
                    <Text style={styles.sentencePlaceholder}>Tap words to build your sentence</Text>
                  )}
                </View>
                
                {wordOrder.length > 0 && !showResult && (
                  <TouchableOpacity
                    style={styles.clearButton}
                    testID="wordorder-clear"
                    onPress={() => {
                      setWordOrder([]);
                      setSelectedAnswer('');
                    }}
                  >
                    <Text style={styles.clearButtonText}>Clear</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
          
          {exercise.type === 'listening' && exercise.options && (
            <View style={styles.listeningContainer}>
              <View style={styles.listeningPrompt}>
                <Headphones size={48} color="#3B82F6" />
                <Text style={styles.listeningText}>
                  Listen carefully and select the correct answer
                </Text>
                <Text style={styles.listeningHint}>
                  {exercise.nativeText || 'Audio exercise'}
                </Text>
              </View>
              
              <View style={styles.optionsContainer}>
                {exercise.options.map((option, index) => (
                  <TouchableOpacity
                    key={`listening_${index}`}
                    testID={`listening-option-${index}`}
                    style={[
                      styles.optionButton,
                      selectedAnswer === option && styles.selectedOption,
                      showResult && option === exercise.correctAnswer && styles.correctOption,
                      showResult && selectedAnswer === option && selectedAnswer !== exercise.correctAnswer && styles.incorrectOption,
                    ]}
                    onPress={() => !showResult && setSelectedAnswer(option)}
                    disabled={showResult}
                  >
                    <Text style={[
                      styles.optionText,
                      selectedAnswer === option && styles.selectedOptionText,
                    ]}>
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
          
          {exercise.type === 'speaking' && exercise.options && (
            <View style={styles.speakingContainer}>
              <View style={styles.speakingPrompt}>
                <Volume2 size={48} color="#10B981" />
                <Text style={styles.speakingText}>
                  Practice speaking this phrase
                </Text>
                <Text style={styles.speakingPhrase}>
                  {exercise.targetText || exercise.correctAnswer}
                </Text>
              </View>
              
              <View style={styles.optionsContainer}>
                {exercise.options.map((option, index) => (
                  <TouchableOpacity
                    key={`speaking_${index}`}
                    testID={`speaking-option-${index}`}
                    style={[
                      styles.optionButton,
                      selectedAnswer === option && styles.selectedOption,
                      showResult && option === exercise.correctAnswer && styles.correctOption,
                      showResult && selectedAnswer === option && selectedAnswer !== exercise.correctAnswer && styles.incorrectOption,
                    ]}
                    onPress={() => !showResult && setSelectedAnswer(option)}
                    disabled={showResult}
                  >
                    <Text style={[
                      styles.optionText,
                      selectedAnswer === option && styles.selectedOptionText,
                    ]}>
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
          
          {exercise.type === 'select_missing' && exercise.options && (
            <View style={styles.selectMissingContainer}>
              <Text style={styles.selectMissingPrompt}>
                Select the missing word or phrase:
              </Text>
              
              <View style={styles.optionsContainer}>
                {exercise.options.map((option, index) => (
                  <TouchableOpacity
                    key={`select_missing_${index}`}
                    testID={`select-missing-option-${index}`}
                    style={[
                      styles.optionButton,
                      selectedAnswer === option && styles.selectedOption,
                      showResult && option === exercise.correctAnswer && styles.correctOption,
                      showResult && selectedAnswer === option && selectedAnswer !== exercise.correctAnswer && styles.incorrectOption,
                    ]}
                    onPress={() => !showResult && setSelectedAnswer(option)}
                    disabled={showResult}
                  >
                    <Text style={[
                      styles.optionText,
                      selectedAnswer === option && styles.selectedOptionText,
                    ]}>
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
          
          {exercise.type === 'match_pairs' && exercise.pairs && (
            <View style={styles.matchPairsContainer}>
              <Text style={styles.matchPairsPrompt}>
                Match the pairs:
              </Text>
              
              <View style={styles.pairsGrid}>
                <View style={styles.leftColumn}>
                  {exercise.pairs.map((pair, index) => (
                    <TouchableOpacity
                      key={`left_${index}`}
                      testID={`pair-left-${index}`}
                      style={[
                        styles.pairItem,
                        selectedPairs[pair.left] && styles.selectedPairItem,
                        showResult && styles.resultPairItem,
                      ]}
                      onPress={() => {
                        if (!showResult) {
                          const newPairs = { ...selectedPairs };
                          if (newPairs[pair.left]) {
                            delete newPairs[pair.left];
                          } else {
                            newPairs[pair.left] = '';
                          }
                          setSelectedPairs(newPairs);
                        }
                      }}
                      disabled={showResult}
                    >
                      <Text style={styles.pairItemText}>{pair.left}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                
                <View style={styles.rightColumn}>
                  {exercise.pairs.map((pair, index) => (
                    <TouchableOpacity
                      key={`right_${index}`}
                      testID={`pair-right-${index}`}
                      style={[
                        styles.pairItem,
                        Object.values(selectedPairs).includes(pair.right) && styles.selectedPairItem,
                        showResult && styles.resultPairItem,
                      ]}
                      onPress={() => {
                        if (!showResult) {
                          const selectedLeft = Object.keys(selectedPairs).find(key => selectedPairs[key] === '');
                          if (selectedLeft) {
                            const newPairs = { ...selectedPairs };
                            newPairs[selectedLeft] = pair.right;
                            setSelectedPairs(newPairs);
                            
                            if (Object.keys(newPairs).length === exercise.pairs?.length) {
                              setSelectedAnswer(JSON.stringify(newPairs));
                            }
                          }
                        }
                      }}
                      disabled={showResult}
                    >
                      <Text style={styles.pairItemText}>{pair.right}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          )}
          
          {showResult && exercise.explanation && (
            <View style={[styles.explanationContainer, isCorrect ? styles.correctExplanation : styles.incorrectExplanation]}>
              <View style={styles.explanationHeader}>
                {isCorrect ? (
                  <CheckCircle size={20} color="#10B981" />
                ) : (
                  <Circle size={20} color="#EF4444" />
                )}
                <Text style={[styles.explanationTitle, { color: isCorrect ? '#10B981' : '#EF4444' }]}>
                  {isCorrect ? 'Correct!' : 'Incorrect'}
                </Text>
              </View>
              <Text style={styles.explanationText}>{exercise.explanation}</Text>
            </View>
          )}
        </ScrollView>
        
        <View style={styles.lessonFooter}>
          <TouchableOpacity
            testID="submit-answer"
            style={[
              styles.submitButton,
              ((!selectedAnswer && !typedAnswer.trim() && wordOrder.length === 0 && Object.keys(selectedPairs).length === 0) || showResult) && styles.disabledButton,
            ]}
            onPress={showResult ? (currentExercise < selectedLesson.exercises.length - 1 ? nextExercise : () => completeLesson()) : submitAnswer}
            disabled={(!selectedAnswer && !typedAnswer.trim() && wordOrder.length === 0 && Object.keys(selectedPairs).length === 0) && !showResult}
          >
            <Text style={styles.submitButtonText}>
              {showResult ? (currentExercise < selectedLesson.exercises.length - 1 ? 'Next' : 'Complete') : 'Check'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
      </ErrorBoundary>
    );
  };
  
  // Render main lessons list view
  const renderLessonsList = () => (
    <ErrorBoundary>
      <SafeAreaView style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header with Streak */}
        <LinearGradient
          colors={['#10B981', '#059669']}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View style={styles.streakContainer}>
              <Animated.View style={styles.streakAnimationContainer}>
                <Flame size={24} color="#FFF" />
              </Animated.View>
              <Text style={styles.streakText}>{user.stats?.streakDays || 0} day streak</Text>
            </View>
            
            <View style={styles.xpContainer}>
              <Zap size={20} color="#FFF" />
              <Text style={styles.headerXpText}>{user.stats?.xpPoints || 0} XP</Text>
            </View>
          </View>
          
          <View style={styles.multiplierRow}>
            <View style={styles.multiplierPill}>
              <Flame size={14} color="#F59E0B" />
              <Text style={styles.multiplierText}>
                {Math.max(1, (user.stats?.streakDays ?? 0))}x Streak Multiplier
              </Text>
            </View>
          </View>

          <Text style={styles.headerTitle}>
            Learning {selectedLanguage?.name || 'Language'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {selectedLanguage?.flag} From {nativeLanguage?.name || 'your native language'} • Keep up the great work!
          </Text>
        </LinearGradient>
        
        {/* Challenges Tabs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Challenges</Text>

          <View style={styles.tabRow}>
            <Pressable
              testID="tab-daily"
              style={[styles.tabItem, challengeTab === 'daily' && styles.tabItemActive]}
              onPress={() => setChallengeTab('daily')}
            >
              <Text style={[styles.tabText, challengeTab === 'daily' && styles.tabTextActive]}>Daily</Text>
            </Pressable>
            <Pressable
              testID="tab-weekly"
              style={[styles.tabItem, challengeTab === 'weekly' && styles.tabItemActive]}
              onPress={() => setChallengeTab('weekly')}
            >
              <Text style={[styles.tabText, challengeTab === 'weekly' && styles.tabTextActive]}>Weekly</Text>
            </Pressable>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.challengesContainer}>
              {(challengeTab === 'daily' ? dailyChallenges : weeklyChallenges).map((challenge) => (
                <View key={challenge.id} style={styles.challengeCard}>
                  <Text style={styles.challengeIcon}>{challenge.icon}</Text>
                  <Text style={styles.challengeTitle}>{challenge.title}</Text>
                  <Text style={styles.challengeDescription}>{challenge.description}</Text>
                  
                  <View style={styles.challengeProgress}>
                    <View style={styles.challengeProgressBar}>
                      <View 
                        style={[
                          styles.challengeProgressFill, 
                          { width: `${Math.min((challenge.current / challenge.target) * 100, 100)}%` }
                        ]} 
                      />
                    </View>
                    <Text style={styles.challengeProgressText}>
                      {challenge.current}/{challenge.target}
                    </Text>
                  </View>
                  
                  <View style={styles.challengeReward}>
                    <Zap size={12} color="#F59E0B" />
                    <Text style={styles.challengeRewardText}>+{challenge.xpReward} XP</Text>
                  </View>

                  {'weekStart' in challenge && (
                    <Text style={styles.challengeSubtext}>
                      Week: {new Date(challenge.weekStart).toLocaleDateString()} – {new Date(challenge.weekEnd).toLocaleDateString()}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
        
        {/* Lessons */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lessons</Text>

          <View style={styles.filterRow}>
            {(['all','beginner','intermediate','advanced'] as const).map((lvl) => (
              <Pressable
                key={lvl}
                testID={`filter-${lvl}`}
                onPress={() => setDifficultyFilter(lvl)}
                style={[styles.filterChip, difficultyFilter === lvl && styles.filterChipActive]}
              >
                <Text style={[styles.filterChipText, difficultyFilter === lvl && styles.filterChipTextActive]}>
                  {lvl === 'all' ? 'All' : lvl.charAt(0).toUpperCase() + lvl.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>
          
          {filteredLessons.map((lesson) => {
            const IconComponent = getCategoryIcon(lesson.category);
            
            return (
              <TouchableOpacity
                key={lesson.id}
                style={[
                  styles.lessonCard,
                  lesson.isLocked && !user.isPremium && styles.lockedLessonCard,
                  isGeneratingLesson && styles.disabledLessonCard,
                ]}
                onPress={() => startLesson(lesson)}
                disabled={(lesson.isLocked && !user.isPremium) || isGeneratingLesson}
              >
                <View style={styles.lessonCardContent} testID={`lesson-card-${lesson.id}`}>
                  <View style={[
                    styles.lessonIcon,
                    { backgroundColor: lesson.isCompleted ? '#10B981' : getDifficultyColor(lesson.difficulty) }
                  ]}>
                    {isGeneratingLesson ? (
                      <ActivityIndicator size={24} color="white" />
                    ) : lesson.isLocked && !user.isPremium ? (
                      <Lock size={24} color="white" />
                    ) : lesson.isCompleted ? (
                      <CheckCircle size={24} color="white" />
                    ) : (
                      <IconComponent size={24} color="white" />
                    )}
                  </View>
                  
                  <View style={styles.lessonInfo}>
                    <Text style={styles.lessonTitle}>{lesson.title}</Text>
                    <Text style={styles.lessonDescription}>{lesson.description}</Text>
                    
                    <View style={styles.lessonMeta}>
                      <View style={[
                        styles.difficultyBadge,
                        { backgroundColor: getDifficultyColor(lesson.difficulty) }
                      ]}>
                        <Text style={styles.difficultyText}>{lesson.difficulty}</Text>
                      </View>
                      
                      <View style={styles.xpBadge}>
                        <Zap size={12} color="#F59E0B" />
                        <Text style={styles.xpBadgeText}>+{lesson.xpReward} XP</Text>
                      </View>
                    </View>
                  </View>
                  
                  {lesson.isCompleted && (
                    <View style={styles.completedBadge}>
                      <Star size={16} color="#F59E0B" fill="#F59E0B" />
                    </View>
                  )}
                </View>
                
                {lesson.isLocked && !user.isPremium && (
                  <View style={styles.premiumOverlay} testID={`lesson-locked-${lesson.id}`}>
                    <Trophy size={16} color="#8B5CF6" />
                    <Text style={styles.premiumText}>Premium</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
        
        {/* Study Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today’s Progress</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Target size={20} color="#10B981" />
              <Text style={styles.statValue}>{completedLessons.length}</Text>
              <Text style={styles.statLabel}>Lessons</Text>
            </View>
            
            <View style={styles.statCard}>
              <BookOpen size={20} color="#3B82F6" />
              <Text style={styles.statValue}>{user.stats?.wordsLearned || 0}</Text>
              <Text style={styles.statLabel}>Words</Text>
            </View>
            
            <View style={styles.statCard}>
              <Zap size={20} color="#F59E0B" />
              <Text style={styles.statValue}>{user.stats?.xpPoints || 0}</Text>
              <Text style={styles.statLabel}>Total XP</Text>
            </View>
          </View>
        </View>

        {/* Language Info */}
        {selectedLanguage && nativeLanguage && (
          <View style={styles.section}>
            <View style={styles.languageInfoCard}>
              <Text style={styles.languageInfoTitle}>Learning Path</Text>
              <View style={styles.languageInfoContent}>
                <View style={styles.languageItem}>
                  <Text style={styles.languageFlag}>{nativeLanguage.flag}</Text>
                  <Text style={styles.languageName}>{nativeLanguage.name}</Text>
                </View>
                <View style={styles.arrowContainer}>
                  <Text style={styles.arrow}>→</Text>
                </View>
                <View style={styles.languageItem}>
                  <Text style={styles.languageFlag}>{selectedLanguage.flag}</Text>
                  <Text style={styles.languageName}>{selectedLanguage.name}</Text>
                </View>
              </View>
              <Text style={styles.languageInfoSubtitle}>
                Lessons are personalized for your language pair
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
      
      <UpgradeModal
        visible={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        onUpgrade={handleUpgrade}
        reason="feature"
      />
    </SafeAreaView>
    </ErrorBoundary>
  );
  
  // Main render - always call hooks in the same order
  if (selectedLesson) {
    if (showCompletion) {
      return renderCompletionScreen();
    }
    return renderLessonExercise();
  }
  
  return renderLessonsList();
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  xpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerXpText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  multiplierRow: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  multiplierPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  multiplierText: {
    marginLeft: 6,
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  challengesContainer: {
    flexDirection: 'row',
    paddingRight: 20,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    padding: 4,
    marginBottom: 12,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabItemActive: {
    backgroundColor: '#FFFFFF',
  },
  tabText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#111827',
  },
  challengeCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    width: 280,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  challengeIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  challengeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  challengeDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  challengeProgress: {
    marginBottom: 8,
  },
  challengeProgressBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    marginBottom: 4,
  },
  challengeProgressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 3,
  },
  challengeProgressText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  challengeReward: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  challengeRewardText: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '600',
    marginLeft: 4,
  },
  challengeSubtext: {
    marginTop: 8,
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  lessonCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lockedLessonCard: {
    opacity: 0.6,
  },
  lessonCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lessonIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  lessonInfo: {
    flex: 1,
  },
  lessonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  lessonDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  lessonMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  difficultyText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  xpBadgeText: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '600',
    marginLeft: 2,
  },
  completedBadge: {
    marginLeft: 8,
  },
  premiumOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  premiumText: {
    fontSize: 12,
    color: '#8B5CF6',
    fontWeight: '600',
    marginLeft: 4,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    gap: 8,
  },
  filterChip: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  filterChipActive: {
    backgroundColor: '#10B981',
  },
  filterChipText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: 'white',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  
  // Completion Styles
  completionScroll: {
    padding: 20,
  },
  completionHeader: {
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  trophyCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  completionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 6,
  },
  completionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  completionStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  completionStatCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 2,
  },
  completionStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginTop: 6,
    marginBottom: 4,
  },
  completionStatLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  recapCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  recapTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  recapItem: {
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingBottom: 12,
  },
  recapQuestion: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 6,
  },
  answerPill: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  answerPillCorrect: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  answerPillIncorrect: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  answerPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  answerPillTextCorrect: {
    color: '#065F46',
  },
  answerPillTextIncorrect: {
    color: '#991B1B',
  },
  correctAnswerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  completionCorrectAnswerLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginRight: 6,
  },
  completionCorrectAnswerValue: {
    fontSize: 12,
    color: '#111827',
    fontWeight: '600',
  },
  explanationSmall: {
    fontSize: 12,
    color: '#4B5563',
    lineHeight: 18,
  },
  completionButtonsRow: {
    marginTop: 20,
  },
  primaryButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },

  // Lesson Exercise Styles
  lessonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 18,
    color: '#6B7280',
  },
  progressContainer: {
    flex: 1,
    marginHorizontal: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  xpText: {
    fontSize: 14,
    color: '#F59E0B',
    fontWeight: '600',
    marginLeft: 4,
  },
  exerciseContent: {
    flex: 1,
    padding: 20,
  },
  exerciseQuestion: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 32,
  },
  optionsContainer: {
    marginBottom: 24,
  },
  optionButton: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedOption: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  correctOption: {
    borderColor: '#10B981',
    backgroundColor: '#DCFCE7',
  },
  incorrectOption: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  optionText: {
    fontSize: 16,
    color: '#1F2937',
    textAlign: 'center',
  },
  selectedOptionText: {
    color: '#10B981',
    fontWeight: '600',
  },
  explanationContainer: {
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  correctExplanation: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  incorrectExplanation: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  explanationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  explanationTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  explanationText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  lessonFooter: {
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  submitButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledLessonCard: {
    opacity: 0.5,
  },
  languageInfoCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  languageInfoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  languageInfoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  languageItem: {
    alignItems: 'center',
    flex: 1,
  },
  languageFlag: {
    fontSize: 32,
    marginBottom: 8,
  },
  languageName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  arrowContainer: {
    paddingHorizontal: 20,
  },
  arrow: {
    fontSize: 24,
    color: '#10B981',
    fontWeight: 'bold',
  },
  languageInfoSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  streakAnimationContainer: {
    transform: [{ scale: 1 }],
  },
  
  // New Exercise Type Styles
  translateContainer: {
    marginBottom: 24,
  },
  translateBox: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  translatePrompt: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
    fontWeight: '500',
  },
  translateText: {
    fontSize: 18,
    color: '#1F2937',
    fontWeight: '600',
    lineHeight: 24,
  },
  inputContainer: {
    marginBottom: 16,
  },
  translateInput: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1F2937',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  correctInput: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  incorrectInput: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  correctAnswerContainer: {
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  correctAnswerLabel: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
    marginBottom: 4,
  },
  correctAnswerText: {
    fontSize: 14,
    color: '#047857',
    fontWeight: '500',
  },
  
  suggestionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  suggestionChip: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  suggestionText: {
    fontSize: 12,
    color: '#111827',
    fontWeight: '600',
  },

  // Word Order Exercise Styles
  wordOrderContainer: {
    marginBottom: 24,
  },
  wordOrderPrompt: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  wordBankContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 8,
  },
  wordChip: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    margin: 4,
  },
  usedWordChip: {
    backgroundColor: '#9CA3AF',
    opacity: 0.5,
  },
  wordChipText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  usedWordChipText: {
    color: '#6B7280',
  },
  sentenceContainer: {
    marginTop: 16,
  },
  sentenceLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 8,
  },
  sentenceBox: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    minHeight: 60,
    justifyContent: 'center',
  },
  sentenceText: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
    textAlign: 'center',
  },
  sentencePlaceholder: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  clearButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'center',
    marginTop: 12,
  },
  clearButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  
  // Match Pairs Exercise Styles
  matchPairsContainer: {
    marginBottom: 24,
  },
  matchPairsPrompt: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  pairsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  leftColumn: {
    flex: 1,
    marginRight: 8,
  },
  rightColumn: {
    flex: 1,
    marginLeft: 8,
  },
  pairItem: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    alignItems: 'center',
  },
  selectedPairItem: {
    borderColor: '#3B82F6',
    backgroundColor: '#EBF8FF',
  },
  resultPairItem: {
    opacity: 0.8,
  },
  pairItemText: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
    textAlign: 'center',
  },
  
  // Listening Exercise Styles
  listeningContainer: {
    marginBottom: 24,
  },
  listeningPrompt: {
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#BFDBFE',
  },
  listeningText: {
    fontSize: 16,
    color: '#1E40AF',
    fontWeight: '600',
    marginTop: 12,
    textAlign: 'center',
  },
  listeningHint: {
    fontSize: 14,
    color: '#3B82F6',
    marginTop: 8,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  
  // Speaking Exercise Styles
  speakingContainer: {
    marginBottom: 24,
  },
  speakingPrompt: {
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#BBF7D0',
  },
  speakingText: {
    fontSize: 16,
    color: '#065F46',
    fontWeight: '600',
    marginTop: 12,
    textAlign: 'center',
  },
  speakingPhrase: {
    fontSize: 20,
    color: '#10B981',
    fontWeight: 'bold',
    marginTop: 12,
    textAlign: 'center',
  },
  
  // Select Missing Exercise Styles
  selectMissingContainer: {
    marginBottom: 24,
  },
  selectMissingPrompt: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
});