import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useExpensiveCalc, PronunciationScore } from '../../patterns/memo/useExpensiveCalc';
import { useAudioEngine } from '../../patterns/context/AudioEngineContext';
import { useSettings } from '../../patterns/context/SettingsContext';

// Types
export interface QuizQuestion {
  id: string;
  type: 'multiple-choice' | 'pronunciation' | 'translation' | 'fill-blank';
  question: string;
  options?: string[];
  correctAnswer: string | string[];
  explanation?: string;
  audioUrl?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  points: number;
}

export interface QuizResult {
  questionId: string;
  userAnswer: string | string[];
  isCorrect: boolean;
  score: number;
  timeSpent: number;
  pronunciationScore?: PronunciationScore;
}

export interface QuizStats {
  totalQuestions: number;
  correctAnswers: number;
  totalScore: number;
  totalTime: number;
  averageTimePerQuestion: number;
  accuracy: number;
  pronunciationAccuracy?: number;
}

interface QuizEngineProps {
  questions: QuizQuestion[];
  onComplete: (results: QuizResult[], stats: QuizStats) => void;
  onQuestionChange?: (questionIndex: number, question: QuizQuestion) => void;
  timeLimit?: number; // in seconds
  allowSkip?: boolean;
  showHints?: boolean;
  autoAdvance?: boolean;
}

export function QuizEngine({
  questions,
  onComplete,
  onQuestionChange,
  timeLimit,
  allowSkip = true,
  showHints = true,
  autoAdvance = false,
}: QuizEngineProps) {
  // State
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Map<string, string | string[]>>(new Map());
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  const [isAnswering, setIsAnswering] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(timeLimit || 0);

  // Refs
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const questionTimesRef = useRef<Map<string, number>>(new Map());

  // Hooks
  const { scorePronunciation } = useExpensiveCalc();
  const { engine: audioEngine } = useAudioEngine();
  const { settings } = useSettings();

  // Memoized current question
  const currentQuestion = useMemo(() => {
    return questions[currentQuestionIndex];
  }, [questions, currentQuestionIndex]);

  // Memoized question options for multiple choice
  const questionOptions = useMemo(() => {
    if (currentQuestion?.type === 'multiple-choice' && currentQuestion.options) {
      return currentQuestion.options.map((option, index) => ({
        id: `option-${index}`,
        text: option,
        isCorrect: option === currentQuestion.correctAnswer,
      }));
    }
    return [];
  }, [currentQuestion]);

  // Memoized progress calculation
  const progress = useMemo(() => {
    const completed = userAnswers.size;
    const total = questions.length;
    return {
      current: completed,
      total,
      percentage: total > 0 ? (completed / total) * 100 : 0,
      remaining: total - completed,
    };
  }, [userAnswers.size, questions.length]);

  // Memoized current stats
  const currentStats = useMemo(() => {
    const results: QuizResult[] = [];
    let totalScore = 0;
    let correctAnswers = 0;
    let totalTime = 0;

    userAnswers.forEach((answer, questionId) => {
      const question = questions.find(q => q.id === questionId);
      if (!question) return;

      const isCorrect = Array.isArray(question.correctAnswer)
        ? question.correctAnswer.includes(answer as string)
        : answer === question.correctAnswer;

      const timeSpent = questionTimesRef.current.get(questionId) || 0;
      const score = isCorrect ? question.points : 0;

      results.push({
        questionId,
        userAnswer: answer,
        isCorrect,
        score,
        timeSpent,
      });

      totalScore += score;
      if (isCorrect) correctAnswers++;
      totalTime += timeSpent;
    });

    return {
      results,
      totalScore,
      correctAnswers,
      totalTime,
      accuracy: userAnswers.size > 0 ? (correctAnswers / userAnswers.size) * 100 : 0,
    };
  }, [userAnswers, questions]);

  // Timer effect
  useEffect(() => {
    if (timeLimit && timeLimit > 0) {
      setTimeRemaining(timeLimit);
      
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleTimeUp();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    }
  }, [timeLimit]);

  // Question change effect
  useEffect(() => {
    if (currentQuestion && onQuestionChange) {
      onQuestionChange(currentQuestionIndex, currentQuestion);
    }
    setQuestionStartTime(Date.now());
    setShowExplanation(false);
  }, [currentQuestionIndex, currentQuestion, onQuestionChange]);

  // Handlers with useCallback
  const handleAnswer = useCallback(async (answer: string | string[]) => {
    if (isAnswering) return;
    
    setIsAnswering(true);
    
    try {
      // Record answer
      setUserAnswers(prev => new Map(prev).set(currentQuestion.id, answer));
      
      // Record time spent
      const timeSpent = Date.now() - questionStartTime;
      questionTimesRef.current.set(currentQuestion.id, timeSpent);
      
      // Handle pronunciation scoring if applicable
      if (currentQuestion.type === 'pronunciation' && typeof answer === 'string') {
        const pronunciationScore = scorePronunciation(
          currentQuestion.correctAnswer as string,
          answer,
          { caseSensitive: false, ignorePunctuation: true }
        );
        
        // You could store this in the results if needed
        console.log('Pronunciation score:', pronunciationScore);
      }
      
      // Play audio feedback if enabled
      if (settings.autoPlay && currentQuestion.audioUrl) {
        try {
          await audioEngine.speak(
            Array.isArray(answer) ? answer.join(' ') : answer,
            { voiceId: settings.voiceId }
          );
        } catch (error) {
          console.warn('Audio playback failed:', error);
        }
      }
      
      // Show explanation briefly
      if (currentQuestion.explanation) {
        setShowExplanation(true);
        setTimeout(() => setShowExplanation(false), 3000);
      }
      
      // Auto advance or wait for user
      if (autoAdvance) {
        setTimeout(() => {
          handleNext();
        }, 2000);
      }
      
    } catch (error) {
      console.error('Error handling answer:', error);
      Alert.alert('Error', 'Failed to process your answer. Please try again.');
    } finally {
      setIsAnswering(false);
    }
  }, [
    isAnswering,
    currentQuestion,
    questionStartTime,
    scorePronunciation,
    settings.autoPlay,
    settings.voiceId,
    audioEngine,
    autoAdvance,
  ]);

  const handleNext = useCallback(() => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      handleComplete();
    }
  }, [currentQuestionIndex, questions.length]);

  const handlePrevious = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  }, [currentQuestionIndex]);

  const handleSkip = useCallback(() => {
    if (allowSkip) {
      handleAnswer(''); // Empty answer for skipped questions
      handleNext();
    }
  }, [allowSkip, handleAnswer, handleNext]);

  const handleTimeUp = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    handleComplete();
  }, []);

  const handleComplete = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    const finalStats: QuizStats = {
      totalQuestions: questions.length,
      correctAnswers: currentStats.correctAnswers,
      totalScore: currentStats.totalScore,
      totalTime: currentStats.totalTime,
      averageTimePerQuestion: currentStats.totalTime / Math.max(userAnswers.size, 1),
      accuracy: currentStats.accuracy,
    };
    
    onComplete(currentStats.results, finalStats);
  }, [questions.length, currentStats, userAnswers.size, onComplete]);

  // Render helpers
  const renderMultipleChoice = () => (
    <View style={styles.optionsContainer}>
      {questionOptions.map((option) => (
        <TouchableOpacity
          key={option.id}
          style={[
            styles.optionButton,
            userAnswers.has(currentQuestion.id) && 
            userAnswers.get(currentQuestion.id) === option.text && 
            styles.selectedOption
          ]}
          onPress={() => handleAnswer(option.text)}
          disabled={isAnswering}
        >
          <Text style={styles.optionText}>{option.text}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      <View style={styles.progressBar}>
        <View 
          style={[
            styles.progressFill, 
            { width: `${progress.percentage}%` }
          ]} 
        />
      </View>
      <Text style={styles.progressText}>
        {progress.current} / {progress.total}
      </Text>
    </View>
  );

  if (!currentQuestion) {
    return (
      <View style={styles.container}>
        <Text>No questions available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderProgressBar()}
      
      {timeLimit && timeLimit > 0 && (
        <Text style={styles.timer}>
          Time: {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
        </Text>
      )}
      
      <View style={styles.questionContainer}>
        <Text style={styles.questionText}>{currentQuestion.question}</Text>
        
        {currentQuestion.type === 'multiple-choice' && renderMultipleChoice()}
        
        {showExplanation && currentQuestion.explanation && (
          <View style={styles.explanationContainer}>
            <Text style={styles.explanationText}>{currentQuestion.explanation}</Text>
          </View>
        )}
      </View>
      
      <View style={styles.controlsContainer}>
        {currentQuestionIndex > 0 && (
          <TouchableOpacity style={styles.controlButton} onPress={handlePrevious}>
            <Text style={styles.controlButtonText}>Previous</Text>
          </TouchableOpacity>
        )}
        
        {allowSkip && (
          <TouchableOpacity style={styles.controlButton} onPress={handleSkip}>
            <Text style={styles.controlButtonText}>Skip</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={[styles.controlButton, styles.nextButton]} 
          onPress={handleNext}
        >
          <Text style={styles.controlButtonText}>
            {currentQuestionIndex === questions.length - 1 ? 'Finish' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginRight: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  timer: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#FF5722',
  },
  questionContainer: {
    flex: 1,
    marginBottom: 20,
  },
  questionText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    lineHeight: 24,
  },
  optionsContainer: {
    gap: 10,
  },
  optionButton: {
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedOption: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196F3',
  },
  optionText: {
    fontSize: 16,
    textAlign: 'center',
  },
  explanationContainer: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
  },
  explanationText: {
    fontSize: 14,
    color: '#1976d2',
    fontStyle: 'italic',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  controlButton: {
    flex: 1,
    padding: 12,
    backgroundColor: '#2196F3',
    borderRadius: 8,
    alignItems: 'center',
  },
  nextButton: {
    backgroundColor: '#4CAF50',
  },
  controlButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default QuizEngine;