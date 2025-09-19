import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Hash,
  Volume2,
  ChevronRight,
  ChevronLeft,
  Zap,
  Target,
  Timer,
  Trophy,
  Shuffle,
} from 'lucide-react-native';
import { useUser } from '@/hooks/user-store';
import { useLearningProgress } from '@/state/learning-progress';
import { LANGUAGES } from '@/constants/languages';
import type { NumberData } from '@/modules/types';

interface Props {
  languageCode: string;
  onComplete?: () => void;
  onBack?: () => void;
}

interface NumberGame {
  type: 'matching' | 'counting' | 'listening' | 'typing';
  question: string;
  options?: string[];
  correctAnswer: string;
  numberData: NumberData;
}

export default function NumbersModule({ languageCode, onComplete, onBack }: Props) {
  const [numbers, setNumbers] = useState<NumberData[]>([]);
  const [currentGame, setCurrentGame] = useState<NumberGame | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [typedAnswer, setTypedAnswer] = useState<string>('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [gameIndex, setGameIndex] = useState(0);
  const [totalGames] = useState(10);
  
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const animationValue = useRef(new Animated.Value(0)).current;
  const shakeAnimation = useRef(new Animated.Value(0)).current;
  
  const { user, updateStats } = useUser();
  const { upsertSkill, recordResult } = useLearningProgress();
  
  const selectedLanguage = LANGUAGES.find(lang => lang.code === languageCode);
  const nativeLanguage = LANGUAGES.find(lang => lang.code === user.nativeLanguage);

  useEffect(() => {
    loadNumbersData();
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current as unknown as number);
        timerRef.current = null;
      }
    };
  }, [languageCode]);

  useEffect(() => {
    if (currentGame && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleTimeout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000) as ReturnType<typeof setInterval>;
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current as unknown as number);
        timerRef.current = null;
      }
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current as unknown as number);
        timerRef.current = null;
      }
    };
  }, [currentGame, timeLeft]);

  const loadNumbersData = async () => {
    setIsLoading(true);
    try {
      const prompt = `Generate number learning data for ${selectedLanguage?.name}.
      
      Return a JSON array of numbers 0-20 with this structure:
      {
        "numbers": [
          {
            "id": "num_0",
            "digit": 0,
            "word": "word for zero in ${selectedLanguage?.name}",
            "pronunciation": "pronunciation guide",
            "ordinal": "ordinal form (first, second, etc.) if applicable"
          }
        ]
      }
      
      Include numbers 0 through 20.
      Return ONLY valid JSON without any markdown or extra text.`;

      const response = await fetch('https://toolkit.rork.com/text/llm/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      if (!response.ok) throw new Error('Failed to load numbers data');

      const data = await response.json();
      let content = data.completion.trim();
      
      // Clean response
      if (content.includes('```')) {
        content = content.replace(/```json\s*/g, '').replace(/```\s*/g, '');
      }
      
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) content = jsonMatch[0];
      
      const parsed = JSON.parse(content);
      setNumbers(parsed.numbers || []);
      
      // Initialize learning progress
      parsed.numbers?.forEach((num: NumberData) => {
        upsertSkill({
          id: `number_${languageCode}_${num.id}`,
          type: 'number',
          label: num.digit.toString(),
          accuracy: 0,
          attempts: 0,
          streak: 0,
          mastery: 'new',
        });
      });
      
      // Start first game
      if (parsed.numbers?.length > 0) {
        generateGame(parsed.numbers);
      }
    } catch (error) {
      console.error('Error loading numbers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateGame = (numbersData: NumberData[] = numbers) => {
    if (numbersData.length === 0) return;
    
    const gameTypes: NumberGame['type'][] = ['matching', 'counting', 'listening', 'typing'];
    const randomType = gameTypes[Math.floor(Math.random() * gameTypes.length)];
    const randomNumber = numbersData[Math.floor(Math.random() * Math.min(numbersData.length, 10))];
    
    let game: NumberGame;
    
    switch (randomType) {
      case 'matching':
        const matchOptions = generateOptions(numbersData, randomNumber, 'word');
        game = {
          type: 'matching',
          question: `What is ${randomNumber.digit} in ${selectedLanguage?.name}?`,
          options: matchOptions,
          correctAnswer: randomNumber.word,
          numberData: randomNumber,
        };
        break;
        
      case 'counting':
        const countOptions = generateOptions(numbersData, randomNumber, 'digit');
        game = {
          type: 'counting',
          question: `Which number is "${randomNumber.word}"?`,
          options: countOptions.map(String),
          correctAnswer: randomNumber.digit.toString(),
          numberData: randomNumber,
        };
        break;
        
      case 'listening':
        game = {
          type: 'listening',
          question: `Listen and select the correct number`,
          options: generateOptions(numbersData, randomNumber, 'digit').map(String),
          correctAnswer: randomNumber.digit.toString(),
          numberData: randomNumber,
        };
        break;
        
      case 'typing':
        game = {
          type: 'typing',
          question: `Type ${randomNumber.digit} in ${selectedLanguage?.name}`,
          correctAnswer: randomNumber.word.toLowerCase(),
          numberData: randomNumber,
        };
        break;
    }
    
    setCurrentGame(game);
    setSelectedAnswer('');
    setTypedAnswer('');
    setShowResult(false);
    setTimeLeft(30);
  };

  const generateOptions = (data: NumberData[], correct: NumberData, field: 'word' | 'digit'): string[] => {
    const options: (string | number)[] = [correct[field]];
    const otherNumbers = data.filter(n => n.id !== correct.id);
    
    while (options.length < 4 && otherNumbers.length > 0) {
      const randomIndex = Math.floor(Math.random() * otherNumbers.length);
      const option = otherNumbers[randomIndex][field];
      if (!options.includes(option)) {
        options.push(option);
      }
    }
    
    // Convert all to strings for consistency
    return options.map(opt => String(opt)).sort(() => Math.random() - 0.5);
  };

  const handleTimeout = () => {
    setIsCorrect(false);
    setShowResult(true);
    setStreak(0);
    
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
    
    setTimeout(nextGame, 2000);
  };

  const checkAnswer = () => {
    if (!currentGame) return;
    
    const userAnswer = currentGame.type === 'typing' 
      ? typedAnswer.toLowerCase().trim()
      : selectedAnswer;
      
    const correct = userAnswer === currentGame.correctAnswer.toLowerCase();
    
    setIsCorrect(correct);
    setShowResult(true);
    
    if (correct) {
      setScore(prev => prev + (10 + Math.floor(timeLeft / 3)));
      setStreak(prev => prev + 1);
      recordResult(`number_${languageCode}_${currentGame.numberData.id}`, true);
      
      Animated.spring(animationValue, {
        toValue: 1,
        useNativeDriver: true,
      }).start(() => {
        animationValue.setValue(0);
      });
      
      updateStats({
        xpPoints: user.stats.xpPoints + 5,
      });
    } else {
      setStreak(0);
      recordResult(`number_${languageCode}_${currentGame.numberData.id}`, false);
      
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
    }
    
    setTimeout(nextGame, 2000);
  };

  const nextGame = () => {
    if (gameIndex < totalGames - 1) {
      setGameIndex(prev => prev + 1);
      generateGame();
    } else {
      completeModule();
    }
  };

  const completeModule = () => {
    updateStats({
      xpPoints: user.stats.xpPoints + 100,
      wordsLearned: user.stats.wordsLearned + 10,
    });
    
    onComplete?.();
  };

  const playAudio = () => {
    // In production, play actual audio
    console.log(`Playing: ${currentGame?.numberData.word}`);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={styles.loadingText}>Loading numbers...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const progress = ((gameIndex + 1) / totalGames) * 100;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <ChevronLeft size={24} color="#6B7280" />
        </TouchableOpacity>
        
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {gameIndex + 1} / {totalGames}
          </Text>
        </View>
        
        <View style={styles.statsContainer}>
          <View style={styles.scoreBox}>
            <Zap size={16} color="#F59E0B" />
            <Text style={styles.scoreText}>{score}</Text>
          </View>
          
          <View style={styles.timerBox}>
            <Timer size={16} color={timeLeft < 10 ? '#EF4444' : '#6B7280'} />
            <Text style={[styles.timerText, timeLeft < 10 && styles.timerWarning]}>
              {timeLeft}s
            </Text>
          </View>
        </View>
      </View>

      {streak > 2 && (
        <LinearGradient
          colors={['#FEF3C7', '#FDE68A']}
          style={styles.streakBanner}
        >
          <Text style={styles.streakText}>🔥 {streak} Streak! Keep going!</Text>
        </LinearGradient>
      )}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {currentGame && (
          <Animated.View
            style={[
              styles.gameCard,
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
            <Text style={styles.question}>{currentGame.question}</Text>
            
            {currentGame.type === 'listening' && (
              <TouchableOpacity onPress={playAudio} style={styles.audioButton}>
                <Volume2 size={32} color="#10B981" />
                <Text style={styles.audioText}>Tap to listen</Text>
              </TouchableOpacity>
            )}
            
            {currentGame.type === 'typing' ? (
              <View style={styles.typingContainer}>
                <TextInput
                  style={[
                    styles.typingInput,
                    showResult && isCorrect && styles.correctInput,
                    showResult && !isCorrect && styles.incorrectInput,
                  ]}
                  value={typedAnswer}
                  onChangeText={setTypedAnswer}
                  placeholder="Type your answer..."
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="none"
                  editable={!showResult}
                  onSubmitEditing={checkAnswer}
                />
              </View>
            ) : (
              currentGame.options && (
                <View style={styles.optionsGrid}>
                  {currentGame.options.map((option, index) => (
                    <TouchableOpacity
                      key={`${option}_${index}`}
                      style={[
                        styles.optionButton,
                        selectedAnswer === option && styles.selectedOption,
                        showResult && option === currentGame.correctAnswer && styles.correctOption,
                        showResult && selectedAnswer === option && !isCorrect && styles.incorrectOption,
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
              )
            )}
            
            {showResult && (
              <View style={[
                styles.resultContainer,
                isCorrect ? styles.correctResult : styles.incorrectResult,
              ]}>
                <Text style={styles.resultText}>
                  {isCorrect ? '✓ Correct!' : `✗ Answer: ${currentGame.correctAnswer}`}
                </Text>
                {currentGame.numberData.pronunciation && (
                  <Text style={styles.pronunciationText}>
                    Pronunciation: {currentGame.numberData.pronunciation}
                  </Text>
                )}
              </View>
            )}
          </Animated.View>
        )}
        
        {!showResult && currentGame && (
          <TouchableOpacity
            style={[
              styles.checkButton,
              (!selectedAnswer && !typedAnswer) && styles.disabledButton,
            ]}
            onPress={checkAnswer}
            disabled={!selectedAnswer && !typedAnswer}
          >
            <Text style={styles.checkButtonText}>Check Answer</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  progressContainer: {
    flex: 1,
    marginHorizontal: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
  },
  progressText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  scoreBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F59E0B',
    marginLeft: 4,
  },
  timerBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginLeft: 4,
  },
  timerWarning: {
    color: '#EF4444',
  },
  streakBanner: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  streakText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400E',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  gameCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  question: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 24,
  },
  audioButton: {
    alignSelf: 'center',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    padding: 20,
    borderRadius: 60,
    marginBottom: 24,
  },
  audioText: {
    marginTop: 8,
    fontSize: 14,
    color: '#10B981',
    fontWeight: '500',
  },
  typingContainer: {
    marginBottom: 20,
  },
  typingInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    textAlign: 'center',
  },
  correctInput: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  incorrectInput: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  optionButton: {
    width: '48%',
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
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
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  selectedOptionText: {
    color: '#2563EB',
  },
  resultContainer: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  correctResult: {
    backgroundColor: '#DCFCE7',
  },
  incorrectResult: {
    backgroundColor: '#FEE2E2',
  },
  resultText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  pronunciationText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
    fontStyle: 'italic',
  },
  checkButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
  checkButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});