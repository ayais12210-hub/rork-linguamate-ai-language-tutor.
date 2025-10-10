import type { Meta, StoryObj } from '@storybook/react-native';
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { QuizEngine, QuizQuestion, QuizResult, QuizStats } from '../features/quiz/QuizEngine';
import { SettingsProvider } from '../patterns/context/SettingsContext';
import { AudioEngineProvider } from '../patterns/context/AudioEngineContext';

// Sample quiz questions
const sampleQuestions: QuizQuestion[] = [
  {
    id: '1',
    type: 'multiple-choice',
    question: 'What is the capital of France?',
    options: ['London', 'Berlin', 'Paris', 'Madrid'],
    correctAnswer: 'Paris',
    explanation: 'Paris is the capital and largest city of France.',
    difficulty: 'beginner',
    points: 10,
  },
  {
    id: '2',
    type: 'pronunciation',
    question: 'Please pronounce: "Hello, how are you?"',
    correctAnswer: 'Hello, how are you?',
    explanation: 'This is a common English greeting.',
    difficulty: 'intermediate',
    points: 15,
  },
  {
    id: '3',
    type: 'translation',
    question: 'Translate to English: "Bonjour"',
    correctAnswer: 'Hello',
    explanation: 'Bonjour is French for Hello.',
    difficulty: 'beginner',
    points: 10,
  },
  {
    id: '4',
    type: 'fill-blank',
    question: 'The quick brown fox jumps over the ___ dog.',
    correctAnswer: 'lazy',
    explanation: 'This is a common pangram used for typing practice.',
    difficulty: 'intermediate',
    points: 12,
  },
  {
    id: '5',
    type: 'multiple-choice',
    question: 'Which programming language is known for its use in web development?',
    options: ['Python', 'JavaScript', 'C++', 'Assembly'],
    correctAnswer: 'JavaScript',
    explanation: 'JavaScript is primarily used for web development.',
    difficulty: 'advanced',
    points: 20,
  },
];

// Quiz wrapper component
function QuizWrapper({ 
  questions, 
  timeLimit, 
  allowSkip, 
  showHints, 
  autoAdvance 
}: {
  questions: QuizQuestion[];
  timeLimit?: number;
  allowSkip?: boolean;
  showHints?: boolean;
  autoAdvance?: boolean;
}) {
  const [results, setResults] = useState<QuizResult[]>([]);
  const [stats, setStats] = useState<QuizStats | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  const handleComplete = (quizResults: QuizResult[], quizStats: QuizStats) => {
    setResults(quizResults);
    setStats(quizStats);
    setIsComplete(true);
    
    Alert.alert(
      'Quiz Complete!',
      `You scored ${quizStats.totalScore} points with ${quizStats.accuracy.toFixed(1)}% accuracy.`,
      [{ text: 'OK' }]
    );
  };

  const handleReset = () => {
    setResults([]);
    setStats(null);
    setIsComplete(false);
  };

  if (isComplete && stats) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Quiz Results</Text>
        
        <View style={styles.statsContainer}>
          <Text style={styles.statText}>Total Score: {stats.totalScore}</Text>
          <Text style={styles.statText}>Accuracy: {stats.accuracy.toFixed(1)}%</Text>
          <Text style={styles.statText}>Correct Answers: {stats.correctAnswers}/{stats.totalQuestions}</Text>
          <Text style={styles.statText}>Total Time: {Math.round(stats.totalTime / 1000)}s</Text>
          <Text style={styles.statText}>Avg Time/Question: {Math.round(stats.averageTimePerQuestion / 1000)}s</Text>
        </View>

        <View style={styles.resultsContainer}>
          <Text style={styles.sectionTitle}>Question Results:</Text>
          {results.map((result, index) => (
            <View key={result.questionId} style={styles.resultItem}>
              <Text style={styles.resultText}>
                Q{index + 1}: {result.isCorrect ? '✓' : '✗'} 
                ({result.score} pts, {Math.round(result.timeSpent / 1000)}s)
              </Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.button} onPress={handleReset}>
          <Text style={styles.buttonText}>Take Quiz Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <QuizEngine
      questions={questions}
      onComplete={handleComplete}
      timeLimit={timeLimit}
      allowSkip={allowSkip}
      showHints={showHints}
      autoAdvance={autoAdvance}
    />
  );
}

// Basic Quiz Story
const BasicQuizStory: Meta<typeof QuizWrapper> = {
  title: 'Features/Quiz/Basic',
  component: QuizWrapper,
  decorators: [
    (Story) => (
      <SettingsProvider>
        <AudioEngineProvider>
          <Story />
        </AudioEngineProvider>
      </SettingsProvider>
    ),
  ],
  args: {
    questions: sampleQuestions.slice(0, 3),
    allowSkip: true,
    showHints: true,
    autoAdvance: false,
  },
};

// Timed Quiz Story
const TimedQuizStory: Meta<typeof QuizWrapper> = {
  title: 'Features/Quiz/Timed',
  component: QuizWrapper,
  decorators: [
    (Story) => (
      <SettingsProvider>
        <AudioEngineProvider>
          <Story />
        </AudioEngineProvider>
      </SettingsProvider>
    ),
  ],
  args: {
    questions: sampleQuestions,
    timeLimit: 60, // 1 minute
    allowSkip: true,
    showHints: true,
    autoAdvance: false,
  },
};

// Auto-advance Quiz Story
const AutoAdvanceQuizStory: Meta<typeof QuizWrapper> = {
  title: 'Features/Quiz/AutoAdvance',
  component: QuizWrapper,
  decorators: [
    (Story) => (
      <SettingsProvider>
        <AudioEngineProvider>
          <Story />
        </AudioEngineProvider>
      </SettingsProvider>
    ),
  ],
  args: {
    questions: sampleQuestions.slice(0, 3),
    allowSkip: false,
    showHints: true,
    autoAdvance: true,
  },
};

// Pronunciation-focused Quiz Story
const PronunciationQuizStory: Meta<typeof QuizWrapper> = {
  title: 'Features/Quiz/Pronunciation',
  component: QuizWrapper,
  decorators: [
    (Story) => (
      <SettingsProvider>
        <AudioEngineProvider>
          <Story />
        </AudioEngineProvider>
      </SettingsProvider>
    ),
  ],
  args: {
    questions: [
      {
        id: '1',
        type: 'pronunciation',
        question: 'Please pronounce: "The quick brown fox"',
        correctAnswer: 'The quick brown fox',
        explanation: 'Focus on clear pronunciation of each word.',
        difficulty: 'beginner',
        points: 10,
      },
      {
        id: '2',
        type: 'pronunciation',
        question: 'Please pronounce: "She sells seashells by the seashore"',
        correctAnswer: 'She sells seashells by the seashore',
        explanation: 'This is a tongue twister - take your time!',
        difficulty: 'advanced',
        points: 20,
      },
    ],
    allowSkip: true,
    showHints: true,
    autoAdvance: false,
  },
};

// Mixed Difficulty Quiz Story
const MixedDifficultyQuizStory: Meta<typeof QuizWrapper> = {
  title: 'Features/Quiz/MixedDifficulty',
  component: QuizWrapper,
  decorators: [
    (Story) => (
      <SettingsProvider>
        <AudioEngineProvider>
          <Story />
        </AudioEngineProvider>
      </SettingsProvider>
    ),
  ],
  args: {
    questions: sampleQuestions, // All difficulties mixed
    allowSkip: true,
    showHints: true,
    autoAdvance: false,
  },
};

// Export all stories
export const Basic: StoryObj<typeof QuizWrapper> = {};
export const Timed: StoryObj<typeof QuizWrapper> = {};
export const AutoAdvance: StoryObj<typeof QuizWrapper> = {};
export const Pronunciation: StoryObj<typeof QuizWrapper> = {};
export const MixedDifficulty: StoryObj<typeof QuizWrapper> = {};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  statsContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statText: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
  },
  resultsContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  resultItem: {
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  resultText: {
    fontSize: 14,
    color: '#666',
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});