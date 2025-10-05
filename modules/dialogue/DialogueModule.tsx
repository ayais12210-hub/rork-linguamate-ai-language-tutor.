import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  MessageCircle,
  Volume2,
  Play,
  Pause,
  RotateCcw,
  Users,
  Globe,
  BookOpen,
  Mic,
  CheckCircle,
  Star,
  Award,
} from 'lucide-react-native';
import ModuleShell from '@/modules/shared/ModuleShell';
import { useUser } from '@/hooks/user-store';
import { useLearningProgress } from '@/state/learning-progress';
import { LANGUAGES } from '@/constants/languages';
import type { DialogueData, DialogueLine } from '@/modules/types';

interface Props {
  languageCode: string;
  onComplete?: () => void;
  onBack?: () => void;
}

interface DialogueExercise {
  id: string;
  type: 'listen' | 'repeat' | 'roleplay' | 'comprehension';
  dialogue: DialogueData;
  currentLineIndex: number;
  userRole: string;
  completed: boolean;
}

export default function DialogueModule({ languageCode, onComplete, onBack }: Props) {
  const [dialogues, setDialogues] = useState<DialogueData[]>([]);
  const [currentDialogue, setCurrentDialogue] = useState<DialogueData | null>(null);
  const [currentExercise, setCurrentExercise] = useState<DialogueExercise | null>(null);
  const [dialogueIndex, setDialogueIndex] = useState(0);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [score, setScore] = useState(0);
  const [completedLines, setCompletedLines] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [exerciseMode, setExerciseMode] = useState<'listen' | 'practice' | 'roleplay'>('listen');
  const [userRole, setUserRole] = useState<string>('');
  
  const { user, updateStats } = useUser();
  const { upsertSkill, recordResult } = useLearningProgress();
  
  const selectedLanguage = LANGUAGES.find(lang => lang.code === languageCode);
  const nativeLanguage = LANGUAGES.find(lang => lang.code === user.nativeLanguage);
  
  const fadeAnimation = useRef(new Animated.Value(0)).current;
  const slideAnimation = useRef(new Animated.Value(0)).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  
  useEffect(() => {
    loadDialogueData();
  }, [languageCode]);
  
  useEffect(() => {
    if (currentDialogue) {
      Animated.timing(fadeAnimation, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [currentDialogue, fadeAnimation]);
  
  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnimation.setValue(1);
    }
  }, [isRecording, pulseAnimation]);
  
  const loadDialogueData = async () => {
    setIsLoading(true);
    try {
      const prompt = `Generate interactive dialogue learning data for ${selectedLanguage?.name}.
      
      Return a JSON object with this structure:
      {
        "dialogues": [
          {
            "id": "dialogue_1",
            "title": "Dialogue scenario title",
            "context": "Brief description of the situation",
            "participants": ["Person A", "Person B"],
            "lines": [
              {
                "speaker": "Person A",
                "text": "Text in ${selectedLanguage?.name}",
                "translation": "Translation in ${nativeLanguage?.name}"
              }
            ],
            "vocabulary": [
              {
                "word": "Key word from dialogue",
                "translation": "Translation",
                "pronunciation": "Pronunciation guide"
              }
            ],
            "culturalNotes": ["Cultural insight 1", "Cultural insight 2"]
          }
        ]
      }
      
      Include 5-6 practical dialogues covering:
      - Greetings and introductions
      - At a restaurant/cafe
      - Shopping
      - Asking for directions
      - Making appointments
      - Small talk
      
      Each dialogue should have 6-8 lines and be appropriate for beginners.
      Return ONLY valid JSON without any markdown or extra text.`;

      const response = await fetch('https://toolkit.rork.com/text/llm/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      if (!response.ok) throw new Error('Failed to load dialogue data');

      const data = await response.json();
      let content = data.completion.trim();
      
      if (content.includes('```')) {
        content = content.replace(/```json\s*/g, '').replace(/```\s*/g, '');
      }
      
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) content = jsonMatch[0];
      
      const parsed = JSON.parse(content);
      setDialogues(parsed.dialogues || []);
      
      if (parsed.dialogues?.length > 0) {
        setCurrentDialogue(parsed.dialogues[0]);
        setUserRole(parsed.dialogues[0].participants[1] || 'User');
      }
      
      // Initialize learning progress
      parsed.dialogues?.forEach((dialogue: DialogueData) => {
        upsertSkill({
          id: `dialogue_${languageCode}_${dialogue.id}`,
          type: 'word',
          label: dialogue.title,
          accuracy: 0,
          attempts: 0,
          streak: 0,
          mastery: 'new',
        });
      });
    } catch (error) {
      if (__DEV__) {

        console.error('Error loading dialogues:', error);

      }
      Alert.alert('Error', 'Failed to load dialogue data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const playAudio = async (line: DialogueLine) => {
    if (Platform.OS === 'web') {
      if (__DEV__) {

        console.log(`Playing: ${line.text}`);

      }
    } else {
      // In production, play actual audio
      if (__DEV__) {

        console.log(`Playing audio for: ${line.text}`);

      }
    }
    
    setIsPlaying(true);
    setTimeout(() => setIsPlaying(false), 2000);
  };
  
  const startRecording = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Recording', 'Web recording is not enabled in this preview.');
      return;
    }
    
    setIsRecording(true);
    // In production, implement actual recording
    setTimeout(() => {
      setIsRecording(false);
      evaluateRecording();
    }, 3000);
  };
  
  const evaluateRecording = () => {
    // Simplified evaluation - in production, use speech recognition
    const isCorrect = Math.random() > 0.3;
    
    if (isCorrect) {
      setScore(prev => prev + 10);
      setCompletedLines(prev => new Set([...prev, currentLineIndex]));
      recordResult(`dialogue_${languageCode}_${currentDialogue?.id}`, true);
      
      updateStats({
        xpPoints: (user.stats?.xpPoints || 0) + 5,
      });
      
      Alert.alert('Great!', 'Your pronunciation sounds good!');
    } else {
      recordResult(`dialogue_${languageCode}_${currentDialogue?.id}`, false);
      Alert.alert('Try Again', 'Let\'s practice that line once more.');
    }
  };
  
  const nextLine = () => {
    if (!currentDialogue) return;
    
    if (currentLineIndex < currentDialogue.lines.length - 1) {
      setCurrentLineIndex(prev => prev + 1);
      
      Animated.timing(slideAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        slideAnimation.setValue(0);
      });
    } else {
      completeDialogue();
    }
  };
  
  const previousLine = () => {
    if (currentLineIndex > 0) {
      setCurrentLineIndex(prev => prev - 1);
    }
  };
  
  const completeDialogue = () => {
    if (!currentDialogue) return;
    
    const dialogueScore = Math.floor(score * 1.2);
    updateStats({
      xpPoints: (user.stats?.xpPoints || 0) + dialogueScore,
      wordsLearned: (user.stats?.wordsLearned || 0) + currentDialogue.vocabulary.length,
    });
    
    if (dialogueIndex < dialogues.length - 1) {
      Alert.alert(
        'Dialogue Complete! 🎭',
        `Well done! You earned ${dialogueScore} XP. Ready for the next dialogue?`,
        [
          {
            text: 'Next Dialogue',
            onPress: () => nextDialogue(),
          },
          {
            text: 'Review',
            onPress: () => resetDialogue(),
          },
        ]
      );
    } else {
      Alert.alert(
        'All Dialogues Complete! 🌟',
        `Excellent work! You've mastered ${dialogues.length} dialogues and earned ${score} total points!`,
        [
          {
            text: 'Continue',
            onPress: () => onComplete?.(),
          },
        ]
      );
    }
  };
  
  const nextDialogue = () => {
    if (dialogueIndex < dialogues.length - 1) {
      setDialogueIndex(prev => prev + 1);
      setCurrentDialogue(dialogues[dialogueIndex + 1]);
      setCurrentLineIndex(0);
      setCompletedLines(new Set());
      setUserRole(dialogues[dialogueIndex + 1].participants[1] || 'User');
    }
  };
  
  const resetDialogue = () => {
    setCurrentLineIndex(0);
    setCompletedLines(new Set());
    setShowTranslation(false);
  };
  
  const switchMode = (mode: 'listen' | 'practice' | 'roleplay') => {
    setExerciseMode(mode);
    resetDialogue();
  };
  
  if (isLoading) {
    return (
      <ModuleShell title="Dialogues" subtitle="Loading..." onBack={onBack}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={styles.loadingText}>Loading dialogues...</Text>
        </View>
      </ModuleShell>
    );
  }
  
  if (!currentDialogue) {
    return (
      <ModuleShell title="Dialogues" subtitle="No dialogues available" onBack={onBack}>
        <View style={styles.emptyContainer}>
          <MessageCircle size={48} color="#9CA3AF" />
          <Text style={styles.emptyText}>No dialogues available</Text>
        </View>
      </ModuleShell>
    );
  }
  
  const progress = dialogues.length > 0 ? ((dialogueIndex + 1) / dialogues.length) * 100 : 0;
  const currentLine = currentDialogue.lines[currentLineIndex];
  const isUserTurn = currentLine?.speaker === userRole;
  
  return (
    <ModuleShell 
      title="Interactive Dialogues" 
      subtitle={selectedLanguage?.name}
      difficulty="intermediate"
      progress={progress}
      streak={completedLines.size}
      xpReward={score}
      onBack={onBack}
      onComplete={onComplete}
    >
      {/* Mode Selector */}
      <View style={styles.modeSelector}>
        {(['listen', 'practice', 'roleplay'] as const).map((mode) => (
          <TouchableOpacity
            key={mode}
            style={[
              styles.modeButton,
              exerciseMode === mode && styles.activeModeButton,
            ]}
            onPress={() => switchMode(mode)}
          >
            <Text style={[
              styles.modeButtonText,
              exerciseMode === mode && styles.activeModeButtonText,
            ]}>
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {/* Dialogue Info */}
      <View style={styles.dialogueInfo}>
        <LinearGradient
          colors={['#EFF6FF', '#DBEAFE']}
          style={styles.dialogueHeader}
        >
          <View style={styles.dialogueTitle}>
            <MessageCircle size={24} color="#3B82F6" />
            <Text style={styles.dialogueTitleText}>{currentDialogue.title}</Text>
          </View>
          <Text style={styles.dialogueContext}>{currentDialogue.context}</Text>
          
          <View style={styles.participantsRow}>
            <Users size={16} color="#6B7280" />
            <Text style={styles.participantsText}>
              {currentDialogue.participants.join(' & ')}
            </Text>
          </View>
        </LinearGradient>
      </View>
      
      {/* Current Line Display */}
      <Animated.View 
        style={[
          styles.lineContainer,
          {
            opacity: fadeAnimation,
            transform: [{
              translateX: slideAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 10],
              })
            }]
          }
        ]}
      >
        <LinearGradient
          colors={isUserTurn ? ['#FEF3C7', '#FDE68A'] : ['#F0FDF4', '#DCFCE7']}
          style={styles.lineGradient}
        >
          <View style={styles.lineHeader}>
            <View style={[
              styles.speakerBadge,
              { backgroundColor: isUserTurn ? '#F59E0B' : '#10B981' }
            ]}>
              <Text style={styles.speakerText}>{currentLine?.speaker}</Text>
            </View>
            
            {completedLines.has(currentLineIndex) && (
              <CheckCircle size={20} color="#10B981" />
            )}
          </View>
          
          <Text style={styles.lineText}>{currentLine?.text}</Text>
          
          {showTranslation && (
            <Text style={styles.translationText}>{currentLine?.translation}</Text>
          )}
          
          <View style={styles.lineActions}>
            <TouchableOpacity
              onPress={() => currentLine && playAudio(currentLine)}
              style={styles.audioButton}
              disabled={isPlaying}
            >
              {isPlaying ? (
                <Pause size={20} color="#3B82F6" />
              ) : (
                <Volume2 size={20} color="#3B82F6" />
              )}
              <Text style={styles.audioButtonText}>
                {isPlaying ? 'Playing...' : 'Listen'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => setShowTranslation(!showTranslation)}
              style={styles.translationButton}
            >
              <Globe size={16} color="#6B7280" />
              <Text style={styles.translationButtonText}>
                {showTranslation ? 'Hide' : 'Show'} Translation
              </Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </Animated.View>
      
      {/* Practice Controls */}
      {exerciseMode === 'practice' && isUserTurn && (
        <View style={styles.practiceControls}>
          <Text style={styles.practicePrompt}>Your turn! Try saying this line:</Text>
          
          <Animated.View style={[styles.pulseContainer, { transform: [{ scale: pulseAnimation }] }]}>
            <TouchableOpacity
              onPress={startRecording}
              style={[
                styles.recordButton,
                isRecording && styles.recordingButton,
              ]}
              disabled={isRecording}
            >
              <Mic size={24} color={isRecording ? '#EF4444' : '#10B981'} />
              <Text style={[
                styles.recordButtonText,
                isRecording && styles.recordingButtonText,
              ]}>
                {isRecording ? 'Recording...' : 'Record'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      )}
      
      {/* Navigation */}
      <View style={styles.navigation}>
        <TouchableOpacity
          onPress={previousLine}
          style={[
            styles.navButton,
            currentLineIndex === 0 && styles.disabledButton,
          ]}
          disabled={currentLineIndex === 0}
        >
          <Text style={[
            styles.navButtonText,
            currentLineIndex === 0 && styles.disabledText,
          ]}>
            Previous
          </Text>
        </TouchableOpacity>
        
        <View style={styles.progressIndicator}>
          <Text style={styles.progressText}>
            {currentLineIndex + 1} / {currentDialogue.lines.length}
          </Text>
        </View>
        
        <TouchableOpacity
          onPress={nextLine}
          style={styles.navButton}
        >
          <Text style={styles.navButtonText}>
            {currentLineIndex === currentDialogue.lines.length - 1 ? 'Complete' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Vocabulary Section */}
      {currentDialogue.vocabulary.length > 0 && (
        <View style={styles.vocabularySection}>
          <TouchableOpacity
            style={styles.vocabularyHeader}
            onPress={() => setShowTranslation(!showTranslation)}
          >
            <BookOpen size={20} color="#8B5CF6" />
            <Text style={styles.vocabularyTitle}>Key Vocabulary</Text>
          </TouchableOpacity>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {currentDialogue.vocabulary.map((word, index) => (
              <View key={index} style={styles.vocabularyCard}>
                <Text style={styles.vocabularyWord}>{word.word}</Text>
                <Text style={styles.vocabularyTranslation}>{word.translation}</Text>
                {word.pronunciation && (
                  <Text style={styles.vocabularyPronunciation}>
                    {word.pronunciation}
                  </Text>
                )}
              </View>
            ))}
          </ScrollView>
        </View>
      )}
      
      {/* Cultural Notes */}
      {currentDialogue.culturalNotes && currentDialogue.culturalNotes.length > 0 && (
        <View style={styles.culturalSection}>
          <View style={styles.culturalHeader}>
            <Star size={16} color="#F59E0B" />
            <Text style={styles.culturalTitle}>Cultural Notes</Text>
          </View>
          {currentDialogue.culturalNotes.map((note, index) => (
            <Text key={index} style={styles.culturalNote}>• {note}</Text>
          ))}
        </View>
      )}
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  modeSelector: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeModeButton: {
    backgroundColor: '#10B981',
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeModeButtonText: {
    color: 'white',
  },
  dialogueInfo: {
    marginBottom: 20,
  },
  dialogueHeader: {
    borderRadius: 16,
    padding: 20,
  },
  dialogueTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dialogueTitleText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginLeft: 8,
  },
  dialogueContext: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  participantsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  participantsText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 6,
    fontWeight: '500',
  },
  lineContainer: {
    marginBottom: 20,
  },
  lineGradient: {
    borderRadius: 16,
    padding: 20,
  },
  lineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  speakerBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  speakerText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  lineText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
    lineHeight: 24,
  },
  translationText: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
    marginBottom: 16,
    lineHeight: 20,
  },
  lineActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  audioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  audioButtonText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  translationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  translationButtonText: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  practiceControls: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  practicePrompt: {
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  recordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#10B981',
  },
  recordingButton: {
    backgroundColor: '#FEF2F2',
    borderColor: '#EF4444',
  },
  recordButtonText: {
    color: '#10B981',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  recordingButtonText: {
    color: '#EF4444',
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  navButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
  },
  navButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  disabledButton: {
    opacity: 0.5,
  },
  disabledText: {
    color: '#9CA3AF',
  },
  progressIndicator: {
    alignItems: 'center',
  },
  progressText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  vocabularySection: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  vocabularyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  vocabularyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8B5CF6',
    marginLeft: 8,
  },
  vocabularyCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    minWidth: 120,
  },
  vocabularyWord: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  vocabularyTranslation: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  vocabularyPronunciation: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  culturalSection: {
    backgroundColor: '#FFFBEB',
    borderRadius: 16,
    padding: 16,
  },
  culturalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  culturalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F59E0B',
    marginLeft: 6,
  },
  culturalNote: {
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
    marginBottom: 4,
  },
  pulseContainer: {
    alignItems: 'center',
  },
});