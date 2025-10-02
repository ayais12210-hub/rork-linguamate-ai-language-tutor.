import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  PanResponder,
  Animated,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  BookOpen,
  Volume2,
  ChevronRight,
  ChevronLeft,
  Award,
  Target,
  Zap,
  CheckCircle,
  RefreshCw,
  Play,
} from 'lucide-react-native';
import * as Speech from 'expo-speech';
import { useUser } from '@/hooks/user-store';
import { useLearningProgress } from '@/state/learning-progress';
import { LANGUAGES } from '@/constants/languages';
import type { AlphabetCharacter, TracingData } from '@/modules/types';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface Props {
  languageCode: string;
  onComplete?: () => void;
  onBack?: () => void;
}

export default function AlphabetModule({ languageCode, onComplete, onBack }: Props) {
  const [characters, setCharacters] = useState<AlphabetCharacter[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [tracingPaths, setTracingPaths] = useState<string[]>([]);
  const [isTracing, setIsTracing] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const tracingRef = useRef<View>(null);
  const pathAnimation = useRef(new Animated.Value(0)).current;
  
  const { user, updateStats } = useUser();
  const safeXP = (user.stats?.xpPoints ?? 0);
  const safeWords = (user.stats?.wordsLearned ?? 0);
  const { upsertSkill, recordResult } = useLearningProgress();
  
  const selectedLanguage = LANGUAGES.find(lang => lang.code === languageCode);
  const nativeLanguage = LANGUAGES.find(lang => lang.code === user.nativeLanguage);

  const speak = useCallback((text: string) => {
    const t = (text ?? '').toString().trim();
    if (!t || t.length > 120) return;
    try {
      Speech.speak(t, { language: selectedLanguage?.code, rate: 0.95, pitch: 1.0 });
    } catch (e) {
      console.log('speech_error', e);
    }
  }, [selectedLanguage?.code]);

  useEffect(() => {
    loadAlphabetData();
  }, [languageCode]);

  const loadAlphabetData = async () => {
    setIsLoading(true);
    try {
      const prompt = `Generate alphabet/script learning data for ${selectedLanguage?.name}.
      
      Return a JSON array of 10 most important characters with this structure:
      {
        "characters": [
          {
            "id": "char_1",
            "character": "the character",
            "romanization": "romanized form (if applicable)",
            "pronunciation": "how to pronounce",
            "type": "vowel" or "consonant" or "special",
            "examples": [
              {
                "word": "example word using this character",
                "translation": "translation in ${nativeLanguage?.name}",
                "pronunciation": "pronunciation guide"
              }
            ],
            "difficulty": 1-5
          }
        ]
      }
      
      Include the most essential characters for beginners.
      Return ONLY valid JSON without any markdown or extra text.`;

      const response = await fetch('https://toolkit.rork.com/text/llm/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      if (!response.ok) throw new Error('Failed to load alphabet data');

      const data = await response.json();
      let content = data.completion.trim();
      
      if (content.includes('```')) {
        content = content.replace(/```json\s*/g, '').replace(/```\s*/g, '');
      }
      
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) content = jsonMatch[0];
      
      const parsed = JSON.parse(content);
      setCharacters(parsed.characters || []);
      
      parsed.characters?.forEach((char: AlphabetCharacter) => {
        upsertSkill({
          id: `alphabet_${languageCode}_${char.id}`,
          type: 'alphabet',
          label: char.character,
          accuracy: 0,
          attempts: 0,
          streak: 0,
          mastery: 'new',
        });
      });
    } catch (error) {
      console.error('Error loading alphabet:', error);
      Alert.alert('Error', 'Failed to load alphabet data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setIsTracing(true);
      },
      onPanResponderMove: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        setTracingPaths(prev => [...prev, `${locationX},${locationY}`]);
      },
      onPanResponderRelease: () => {
        evaluateTracing();
        setIsTracing(false);
      },
    })
  ).current;

  const evaluateTracing = () => {
    const isCorrect = tracingPaths.length > 10;
    
    if (isCorrect) {
      setScore(prev => prev + 10);
      setStreak(prev => prev + 1);
      recordResult(`alphabet_${languageCode}_${characters[currentIndex]?.id}`, true);
      
      Animated.sequence([
        Animated.timing(pathAnimation, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(pathAnimation, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
      
      updateStats({
        xpPoints: safeXP + 5,
        wordsLearned: safeWords + 1,
      });
    } else {
      setStreak(0);
      recordResult(`alphabet_${languageCode}_${characters[currentIndex]?.id}`, false);
    }
    
    setTracingPaths([]);
  };

  const playAudio = () => {
    const ch = characters[currentIndex]?.character ?? '';
    speak(ch);
  };

  const nextCharacter = () => {
    if (currentIndex < characters.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setTracingPaths([]);
      setShowHint(false);
    } else {
      completeModule();
    }
  };

  const previousCharacter = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setTracingPaths([]);
      setShowHint(false);
    }
  };

  const completeModule = () => {
    updateStats({
      xpPoints: safeXP + 50,
    });
    
    Alert.alert(
      'Module Complete! 🎉',
      `You've learned ${characters.length} characters and earned ${score} points!`,
      [
        {
          text: 'Continue',
          onPress: () => onComplete?.(),
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={styles.loadingText}>Loading alphabet...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentChar = characters[currentIndex];
  const progress = ((currentIndex + 1) / characters.length) * 100;

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
            {currentIndex + 1} / {characters.length}
          </Text>
        </View>
        
        <View style={styles.scoreContainer}>
          <Zap size={16} color="#F59E0B" />
          <Text style={styles.scoreText}>{score}</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {currentChar && (
          <>
            <View style={styles.characterCard}>
              <LinearGradient
                colors={['#F0FDF4', '#DCFCE7']}
                style={styles.characterGradient}
              >
                <Text style={styles.mainCharacter}>{currentChar.character}</Text>
                {currentChar.romanization && (
                  <Text style={styles.romanization}>{currentChar.romanization}</Text>
                )}
                <Text style={styles.pronunciation}>{currentChar.pronunciation}</Text>
                
                <TouchableOpacity onPress={playAudio} style={styles.audioButton} testID="alphabet-play-character">
                  <Volume2 size={24} color="#10B981" />
                  <Text style={styles.audioButtonText}>Play Sound</Text>
                </TouchableOpacity>
              </LinearGradient>
            </View>

            <View style={styles.tracingArea} {...panResponder.panHandlers}>
              <Text style={styles.tracingTitle}>Practice Writing</Text>
              <View style={styles.tracingCanvas}>
                <Text style={styles.tracingGuide}>{currentChar.character}</Text>
                {showHint && (
                  <Text style={styles.hintText}>Trace over the character</Text>
                )}
              </View>
              
              <View style={styles.tracingControls}>
                <TouchableOpacity
                  onPress={() => setShowHint(!showHint)}
                  style={styles.hintButton}
                >
                  <Target size={20} color="#6B7280" />
                  <Text style={styles.hintButtonText}>Show Guide</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={() => setTracingPaths([])}
                  style={styles.clearButton}
                >
                  <RefreshCw size={20} color="#EF4444" />
                  <Text style={styles.clearButtonText}>Clear</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.examplesSection}>
              <Text style={styles.examplesTitle}>Example Words</Text>
              {currentChar.examples.map((example, index) => (
                <View key={index} style={styles.exampleCard}>
                  <View style={styles.exampleContent}>
                    <Text style={styles.exampleWord}>{example.word}</Text>
                    <Text style={styles.exampleTranslation}>{example.translation}</Text>
                    {example.pronunciation && (
                      <Text style={styles.examplePronunciation}>
                        {example.pronunciation}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity style={styles.exampleAudioButton} onPress={() => speak(example.word)} testID={`alphabet-example-play-${index}`}>
                    <Play size={16} color="#10B981" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            {streak > 0 && (
              <Animated.View
                style={[
                  styles.streakBadge,
                  {
                    opacity: pathAnimation,
                    transform: [
                      {
                        scale: pathAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 1.2],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <Text style={styles.streakText}>🔥 {streak} Streak!</Text>
              </Animated.View>
            )}
          </>
        )}
      </ScrollView>

      <View style={styles.navigationBar}>
        <TouchableOpacity
          onPress={previousCharacter}
          style={[styles.navButton, currentIndex === 0 && styles.disabledButton]}
          disabled={currentIndex === 0}
        >
          <ChevronLeft size={24} color={currentIndex === 0 ? '#D1D5DB' : '#6B7280'} />
          <Text style={[styles.navButtonText, currentIndex === 0 && styles.disabledText]}>
            Previous
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={nextCharacter}
          style={[styles.navButton, styles.primaryButton]}
        >
          <Text style={styles.primaryButtonText}>
            {currentIndex === characters.length - 1 ? 'Complete' : 'Next'}
          </Text>
          <ChevronRight size={24} color="white" />
        </TouchableOpacity>
      </View>
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
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F59E0B',
    marginLeft: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  characterCard: {
    marginBottom: 24,
  },
  characterGradient: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  mainCharacter: {
    fontSize: 72,
    fontWeight: 'bold',
    color: '#047857',
    marginBottom: 8,
  },
  romanization: {
    fontSize: 24,
    color: '#059669',
    marginBottom: 4,
  },
  pronunciation: {
    fontSize: 18,
    color: '#6B7280',
    marginBottom: 16,
  },
  audioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 8,
  },
  audioButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
  tracingArea: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  tracingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  tracingCanvas: {
    height: 200,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  tracingGuide: {
    fontSize: 120,
    color: '#E5E7EB',
    position: 'absolute',
  },
  hintText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 60,
  },
  tracingControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  hintButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  hintButtonText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6B7280',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
  },
  clearButtonText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#EF4444',
  },
  examplesSection: {
    marginBottom: 24,
  },
  examplesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  exampleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  exampleContent: {
    flex: 1,
  },
  exampleWord: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  exampleTranslation: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  examplePronunciation: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
    marginTop: 2,
  },
  exampleAudioButton: {
    padding: 8,
    backgroundColor: '#F0FDF4',
    borderRadius: 20,
  },
  streakBadge: {
    alignSelf: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
  },
  streakText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F59E0B',
  },
  navigationBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
    marginHorizontal: 8,
  },
  primaryButton: {
    backgroundColor: '#10B981',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginHorizontal: 8,
  },
  disabledButton: {
    opacity: 0.5,
  },
  disabledText: {
    color: '#D1D5DB',
  },
});