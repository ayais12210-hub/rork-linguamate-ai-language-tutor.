import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Animated,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  BookOpen,
  CheckCircle,
  XCircle,
  Lightbulb,
  Volume2,
  Shuffle,
  Target,
  Award,
  RefreshCw,
  Eye,
  EyeOff,
} from 'lucide-react-native';
import ModuleShell from '@/modules/shared/ModuleShell';
import { useUser } from '@/hooks/user-store';
import { useLearningProgress } from '@/state/learning-progress';
import { LANGUAGES } from '@/constants/languages';
import type { GrammarRule, GrammarExample, Exercise } from '@/modules/types';

interface Props {
  languageCode: string;
  onComplete?: () => void;
  onBack?: () => void;
}

interface GrammarExercise {
  id: string;
  type: 'fill_blank' | 'multiple_choice' | 'word_order' | 'correction' | 'translation';
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  rule: GrammarRule;
  difficulty: number;
}

export default function GrammarModule({ languageCode, onComplete, onBack }: Props) {
  const [grammarRules, setGrammarRules] = useState<GrammarRule[]>([]);
  const [currentExercise, setCurrentExercise] = useState<GrammarExercise | null>(null);
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [selectedOption, setSelectedOption] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [lives, setLives] = useState(3);
  const [isLoading, setIsLoading] = useState(true);
  const [exercises, setExercises] = useState<GrammarExercise[]>([]);
  const [currentRuleIndex, setCurrentRuleIndex] = useState(0);
  const [showRuleDetails, setShowRuleDetails] = useState(false);
  
  const { user, updateStats } = useUser();
  const { upsertSkill, recordResult } = useLearningProgress();
  
  const selectedLanguage = LANGUAGES.find(lang => lang.code === languageCode);
  const nativeLanguage = LANGUAGES.find(lang => lang.code === user.nativeLanguage);
  
  const animationValue = useRef(new Animated.Value(0)).current;
  const shakeAnimation = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    loadGrammarData();
  }, [languageCode]);
  
  const loadGrammarData = async () => {
    setIsLoading(true);
    try {
      const prompt = `Generate comprehensive grammar learning data for ${selectedLanguage?.name}.
      
      Return a JSON object with this structure:
      {
        "rules": [
          {
            "id": "rule_1",
            "rule": "Grammar rule name",
            "explanation": "Detailed explanation of the rule",
            "examples": [
              {
                "correct": "Correct example sentence in ${selectedLanguage?.name}",
                "incorrect": "Common mistake example",
                "translation": "Translation in ${nativeLanguage?.name}",
                "explanation": "Why this is correct/incorrect"
              }
            ],
            "exceptions": ["Exception 1", "Exception 2"],
            "difficulty": "beginner" | "intermediate" | "advanced"
          }
        ]
      }
      
      Include 8-10 essential grammar rules for beginners, covering:
      - Word order
      - Verb conjugation
      - Articles/determiners
      - Plurals
      - Tenses
      - Questions
      - Negation
      - Adjectives
      
      Return ONLY valid JSON without any markdown or extra text.`;

      const response = await fetch('https://toolkit.rork.com/text/llm/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      if (!response.ok) throw new Error('Failed to load grammar data');

      const data = await response.json();
      let content = data.completion.trim();
      
      if (content.includes('```')) {
        content = content.replace(/```json\s*/g, '').replace(/```\s*/g, '');
      }
      
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) content = jsonMatch[0];
      
      const parsed = JSON.parse(content);
      setGrammarRules(parsed.rules || []);
      
      // Generate exercises from rules
      if (parsed.rules?.length > 0) {
        const generatedExercises = await generateExercises(parsed.rules);
        setExercises(generatedExercises);
        setCurrentExercise(generatedExercises[0] || null);
      }
      
      // Initialize learning progress
      parsed.rules?.forEach((rule: GrammarRule) => {
        upsertSkill({
          id: `grammar_${languageCode}_${rule.id}`,
          type: 'grammar',
          label: rule.rule,
          accuracy: 0,
          attempts: 0,
          streak: 0,
          mastery: 'new',
        });
      });
    } catch (error) {
      console.error('Error loading grammar:', error);
      Alert.alert('Error', 'Failed to load grammar data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const generateExercises = async (rules: GrammarRule[]): Promise<GrammarExercise[]> => {
    const exercises: GrammarExercise[] = [];
    
    rules.forEach((rule, ruleIndex) => {
      rule.examples.forEach((example, exampleIndex) => {
        // Fill in the blank exercise
        const words = example.correct.split(' ');
        if (words.length > 2) {
          const blankIndex = Math.floor(words.length / 2);
          const correctWord = words[blankIndex];
          const questionWords = [...words];
          questionWords[blankIndex] = '_____';
          
          exercises.push({
            id: `fill_${ruleIndex}_${exampleIndex}`,
            type: 'fill_blank',
            question: `Fill in the blank: ${questionWords.join(' ')}`,
            correctAnswer: correctWord.toLowerCase(),
            explanation: example.explanation || rule.explanation,
            rule,
            difficulty: rule.difficulty === 'beginner' ? 1 : rule.difficulty === 'intermediate' ? 2 : 3,
          });
        }
        
        // Multiple choice exercise
        if (example.incorrect) {
          const options = [example.correct, example.incorrect];
          // Add more distractors
          if (rule.examples.length > 1) {
            const otherExample = rule.examples.find(e => e !== example);
            if (otherExample) options.push(otherExample.correct);
          }
          options.push('None of the above');
          
          exercises.push({
            id: `choice_${ruleIndex}_${exampleIndex}`,
            type: 'multiple_choice',
            question: `Which sentence is correct according to the rule: "${rule.rule}"?`,
            options: options.sort(() => Math.random() - 0.5),
            correctAnswer: example.correct,
            explanation: example.explanation || rule.explanation,
            rule,
            difficulty: rule.difficulty === 'beginner' ? 1 : rule.difficulty === 'intermediate' ? 2 : 3,
          });
        }
        
        // Translation exercise
        exercises.push({
          id: `translate_${ruleIndex}_${exampleIndex}`,
          type: 'translation',
          question: `Translate to ${selectedLanguage?.name}: ${example.translation}`,
          correctAnswer: example.correct.toLowerCase(),
          explanation: `This follows the rule: ${rule.rule}`,
          rule,
          difficulty: rule.difficulty === 'beginner' ? 1 : rule.difficulty === 'intermediate' ? 2 : 3,
        });
      });
    });
    
    return exercises.sort(() => Math.random() - 0.5).slice(0, 15);
  };
  
  const checkAnswer = () => {
    if (!currentExercise) return;
    
    const answer = currentExercise.type === 'multiple_choice' ? selectedOption : userAnswer;
    const correct = answer.toLowerCase().trim() === currentExercise.correctAnswer.toLowerCase().trim();
    
    setIsCorrect(correct);
    setShowResult(true);
    setShowExplanation(true);
    
    if (correct) {
      setScore(prev => prev + (10 * currentExercise.difficulty));
      setStreak(prev => prev + 1);
      recordResult(`grammar_${languageCode}_${currentExercise.rule.id}`, true);
      
      Animated.spring(animationValue, {
        toValue: 1,
        useNativeDriver: true,
      }).start(() => {
        animationValue.setValue(0);
      });
      
      updateStats({
        xpPoints: (user.stats?.xpPoints || 0) + (5 * currentExercise.difficulty),
      });
    } else {
      setStreak(0);
      setLives(prev => Math.max(0, prev - 1));
      recordResult(`grammar_${languageCode}_${currentExercise.rule.id}`, false);
      
      Animated.sequence([
        Animated.timing(shakeAnimation, {
          toValue: 10,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnimation, {
          toValue: -10,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnimation, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
      
      if (lives <= 1) {
        Alert.alert(
          'Game Over',
          'You\'ve run out of lives! Don\'t worry, practice makes perfect.',
          [
            { text: 'Try Again', onPress: () => resetModule() },
            { text: 'Exit', onPress: onBack },
          ]
        );
        return;
      }
    }
    
    setTimeout(() => {
      nextExercise();
    }, 3000);
  };
  
  const nextExercise = () => {
    if (exerciseIndex < exercises.length - 1) {
      setExerciseIndex(prev => prev + 1);
      setCurrentExercise(exercises[exerciseIndex + 1]);
      resetExerciseState();
    } else {
      completeModule();
    }
  };
  
  const resetExerciseState = () => {
    setUserAnswer('');
    setSelectedOption('');
    setShowResult(false);
    setIsCorrect(false);
    setShowHint(false);
    setShowExplanation(false);
  };
  
  const resetModule = () => {
    setExerciseIndex(0);
    setCurrentExercise(exercises[0] || null);
    setScore(0);
    setStreak(0);
    setLives(3);
    resetExerciseState();
  };
  
  const completeModule = () => {
    const finalXP = Math.floor(score * 1.5);
    updateStats({
      xpPoints: (user.stats?.xpPoints || 0) + finalXP,
      wordsLearned: (user.stats?.wordsLearned || 0) + exercises.length,
    });
    
    Alert.alert(
      'Grammar Master! 🎓',
      `Excellent work! You've mastered ${grammarRules.length} grammar rules and earned ${finalXP} XP!`,
      [
        {
          text: 'Continue',
          onPress: () => onComplete?.(),
        },
      ]
    );
  };
  
  const showRuleReference = () => {
    if (!currentExercise) return;
    
    Alert.alert(
      currentExercise.rule.rule,
      `${currentExercise.rule.explanation}\n\nExamples:\n${currentExercise.rule.examples.map(ex => `• ${ex.correct}`).join('\n')}`,
      [{ text: 'Got it!' }]
    );
  };
  
  if (isLoading) {
    return (
      <ModuleShell title="Grammar" subtitle="Loading..." onBack={onBack}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={styles.loadingText}>Loading grammar rules...</Text>
        </View>
      </ModuleShell>
    );
  }
  
  const progress = exercises.length > 0 ? ((exerciseIndex + 1) / exercises.length) * 100 : 0;
  
  return (
    <ModuleShell 
      title="Grammar Mastery" 
      subtitle={selectedLanguage?.name}
      difficulty="intermediate"
      progress={progress}
      lives={lives}
      streak={streak}
      xpReward={Math.floor(score * 1.5)}
      onBack={onBack}
      onComplete={onComplete}
    >
      {/* Rule Reference Section */}
      <View style={styles.ruleSection}>
        <TouchableOpacity 
          onPress={() => setShowRuleDetails(!showRuleDetails)}
          style={styles.ruleHeader}
        >
          <BookOpen size={20} color="#10B981" />
          <Text style={styles.ruleTitle}>Grammar Rules</Text>
          {showRuleDetails ? <EyeOff size={16} color="#6B7280" /> : <Eye size={16} color="#6B7280" />}
        </TouchableOpacity>
        
        {showRuleDetails && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.rulesScroll}>
            {grammarRules.map((rule, index) => (
              <TouchableOpacity
                key={rule.id}
                style={[
                  styles.ruleCard,
                  currentRuleIndex === index && styles.activeRuleCard,
                ]}
                onPress={() => setCurrentRuleIndex(index)}
              >
                <Text style={styles.ruleCardTitle}>{rule.rule}</Text>
                <Text style={styles.ruleCardDifficulty}>{rule.difficulty}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
      
      {/* Current Exercise */}
      {currentExercise && (
        <Animated.View
          style={[
            styles.exerciseCard,
            {
              transform: [
                { translateX: shakeAnimation },
                {
                  scale: animationValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.05],
                  }),
                },
              ],
            },
          ]}
        >
          <LinearGradient
            colors={['#FFFFFF', '#F8FAFC']}
            style={styles.exerciseGradient}
          >
            <View style={styles.exerciseHeader}>
              <View style={styles.exerciseTypeTag}>
                <Text style={styles.exerciseTypeText}>
                  {currentExercise.type.replace('_', ' ').toUpperCase()}
                </Text>
              </View>
              
              <TouchableOpacity onPress={showRuleReference} style={styles.hintButton}>
                <Lightbulb size={16} color="#F59E0B" />
                <Text style={styles.hintButtonText}>Rule</Text>
              </TouchableOpacity>
            </View>
            
            <Text style={styles.question}>{currentExercise.question}</Text>
            
            {/* Answer Input */}
            {currentExercise.type === 'multiple_choice' ? (
              <View style={styles.optionsContainer}>
                {currentExercise.options?.map((option, index) => (
                  <TouchableOpacity
                    key={`${option}_${index}`}
                    style={[
                      styles.optionButton,
                      selectedOption === option && styles.selectedOption,
                      showResult && option === currentExercise.correctAnswer && styles.correctOption,
                      showResult && selectedOption === option && !isCorrect && styles.incorrectOption,
                    ]}
                    onPress={() => !showResult && setSelectedOption(option)}
                    disabled={showResult}
                  >
                    <Text style={[
                      styles.optionText,
                      selectedOption === option && styles.selectedOptionText,
                    ]}>
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <TextInput
                style={[
                  styles.answerInput,
                  showResult && isCorrect && styles.correctInput,
                  showResult && !isCorrect && styles.incorrectInput,
                ]}
                value={userAnswer}
                onChangeText={setUserAnswer}
                placeholder="Type your answer..."
                placeholderTextColor="#9CA3AF"
                editable={!showResult}
                autoCapitalize="none"
                onSubmitEditing={checkAnswer}
              />
            )}
            
            {/* Result and Explanation */}
            {showResult && (
              <View style={[
                styles.resultContainer,
                isCorrect ? styles.correctResult : styles.incorrectResult,
              ]}>
                <View style={styles.resultHeader}>
                  {isCorrect ? (
                    <CheckCircle size={20} color="#10B981" />
                  ) : (
                    <XCircle size={20} color="#EF4444" />
                  )}
                  <Text style={styles.resultText}>
                    {isCorrect ? 'Correct!' : `Correct answer: ${currentExercise.correctAnswer}`}
                  </Text>
                </View>
                
                {showExplanation && (
                  <Text style={styles.explanationText}>
                    {currentExercise.explanation}
                  </Text>
                )}
              </View>
            )}
          </LinearGradient>
        </Animated.View>
      )}
      
      {/* Action Buttons */}
      {!showResult && currentExercise && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            onPress={() => setShowHint(!showHint)}
            style={styles.secondaryButton}
          >
            <Target size={16} color="#6B7280" />
            <Text style={styles.secondaryButtonText}>Hint</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.primaryButton,
              (!userAnswer && !selectedOption) && styles.disabledButton,
            ]}
            onPress={checkAnswer}
            disabled={!userAnswer && !selectedOption}
          >
            <Text style={styles.primaryButtonText}>Check Answer</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Hint */}
      {showHint && currentExercise && (
        <View style={styles.hintContainer}>
          <Text style={styles.hintText}>
            💡 This exercise focuses on: {currentExercise.rule.rule}
          </Text>
        </View>
      )}
      
      {/* Progress Info */}
      <View style={styles.progressInfo}>
        <Text style={styles.progressText}>
          Exercise {exerciseIndex + 1} of {exercises.length}
        </Text>
        <Text style={styles.scoreText}>Score: {score}</Text>
      </View>
    </ModuleShell>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  ruleSection: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  ruleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ruleTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
  },
  rulesScroll: {
    marginTop: 12,
  },
  ruleCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    minWidth: 120,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  activeRuleCard: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  ruleCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  ruleCardDifficulty: {
    fontSize: 12,
    color: '#6B7280',
    textTransform: 'capitalize',
  },
  exerciseCard: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  exerciseGradient: {
    padding: 20,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  exerciseTypeTag: {
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  exerciseTypeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  hintButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  hintButtonText: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  question: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 20,
    lineHeight: 24,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
  },
  selectedOption: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  correctOption: {
    borderColor: '#10B981',
    backgroundColor: '#DCFCE7',
  },
  incorrectOption: {
    borderColor: '#EF4444',
    backgroundColor: '#FEE2E2',
  },
  optionText: {
    fontSize: 16,
    color: '#374151',
  },
  selectedOptionText: {
    color: '#2563EB',
    fontWeight: '600',
  },
  answerInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1F2937',
  },
  correctInput: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  incorrectInput: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  resultContainer: {
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
  },
  correctResult: {
    backgroundColor: '#DCFCE7',
  },
  incorrectResult: {
    backgroundColor: '#FEE2E2',
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  resultText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
  },
  explanationText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 20,
  },
  primaryButton: {
    flex: 2,
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 16,
  },
  secondaryButtonText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
  hintContainer: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  hintText: {
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
  },
  progressText: {
    fontSize: 14,
    color: '#6B7280',
  },
  scoreText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
  },
});