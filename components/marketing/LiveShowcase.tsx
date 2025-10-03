import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Play, Volume2, Sparkles } from 'lucide-react-native';
import { brand } from '@/config/brand';
import { landingContent } from '@/content/landing';

const { width } = Dimensions.get('window');

export default function LiveShowcase() {
  const { demo } = landingContent;
  const [selectedLanguage, setSelectedLanguage] = useState<typeof demo.languages[number]>(demo.languages[0]);
  const [selectedDifficulty, setSelectedDifficulty] = useState<typeof demo.difficulties[number]>(demo.difficulties[0]);
  const [showResponse, setShowResponse] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    if (showResponse && !isTyping) {
      setIsTyping(true);
      setDisplayedText('');
      const text = demo.sampleDialogue.response;
      let index = 0;
      
      const interval = setInterval(() => {
        if (index < text.length) {
          setDisplayedText(text.slice(0, index + 1));
          index++;
        } else {
          setIsTyping(false);
          clearInterval(interval);
        }
      }, 20);

      return () => clearInterval(interval);
    }
  }, [showResponse, demo.sampleDialogue.response, isTyping]);

  const handleGetResponse = () => {
    setShowResponse(true);
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>See it in action</Text>
          <Text style={styles.subtitle}>
            Try a sample lesson and experience the power of AI-driven learning
          </Text>
        </View>

        <View style={styles.demoCard}>
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.02)']}
            style={styles.cardGradient}
          >
            <View style={styles.controls}>
              <View style={styles.controlGroup}>
                <Text style={styles.controlLabel}>Language</Text>
                <View style={styles.chipContainer}>
                  {demo.languages.slice(0, 4).map((lang) => (
                    <TouchableOpacity
                      key={lang.code}
                      style={[
                        styles.chip,
                        selectedLanguage.code === lang.code && styles.chipActive
                      ]}
                      onPress={() => setSelectedLanguage(lang)}
                    >
                      <Text style={styles.chipEmoji}>{lang.flag}</Text>
                      <Text style={[
                        styles.chipText,
                        selectedLanguage.code === lang.code && styles.chipTextActive
                      ]}>
                        {lang.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.controlGroup}>
                <Text style={styles.controlLabel}>Difficulty</Text>
                <View style={styles.chipContainer}>
                  {demo.difficulties.map((diff) => (
                    <TouchableOpacity
                      key={diff}
                      style={[
                        styles.chip,
                        selectedDifficulty === diff && styles.chipActive
                      ]}
                      onPress={() => setSelectedDifficulty(diff)}
                    >
                      <Text style={[
                        styles.chipText,
                        selectedDifficulty === diff && styles.chipTextActive
                      ]}>
                        {diff}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.conversation}>
              <View style={styles.userBubble}>
                <Text style={styles.bubbleText}>{demo.sampleDialogue.prompt}</Text>
              </View>

              {showResponse && (
                <View style={styles.aiBubble}>
                  <LinearGradient
                    colors={['#fbbf24', '#ea580c']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.aiBubbleGradient}
                  >
                    <View style={styles.aiBubbleHeader}>
                      <Sparkles size={16} color="#000" />
                      <Text style={styles.aiBubbleLabel}>AI Tutor</Text>
                    </View>
                    <Text style={styles.aiBubbleText}>{displayedText}</Text>
                    {isTyping && <ActivityIndicator size="small" color="#000" style={styles.typingIndicator} />}
                    {!isTyping && (
                      <TouchableOpacity style={styles.audioButton}>
                        <Volume2 size={16} color="#000" />
                        <Text style={styles.audioButtonText}>Listen</Text>
                      </TouchableOpacity>
                    )}
                  </LinearGradient>
                </View>
              )}

              {!showResponse && (
                <TouchableOpacity
                  style={styles.tryButton}
                  onPress={handleGetResponse}
                >
                  <Play size={20} color="#000" />
                  <Text style={styles.tryButtonText}>Get AI Response</Text>
                </TouchableOpacity>
              )}
            </View>
          </LinearGradient>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: brand.palette.bgSecondary,
    paddingVertical: 80,
  },
  content: {
    maxWidth: 1280,
    marginHorizontal: 'auto' as any,
    paddingHorizontal: 24,
    width: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: width < 768 ? 32 : 48,
    fontWeight: '800' as any,
    color: brand.palette.fg,
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: width < 768 ? 16 : 20,
    color: brand.palette.fgSecondary,
    textAlign: 'center',
    maxWidth: 600,
  },
  demoCard: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardGradient: {
    padding: width < 768 ? 24 : 48,
  },
  controls: {
    gap: 32,
    marginBottom: 48,
  },
  controlGroup: {
    gap: 16,
  },
  controlLabel: {
    fontSize: 14,
    fontWeight: '600' as any,
    color: brand.palette.fgSecondary,
    textTransform: 'uppercase',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  chipActive: {
    borderColor: brand.palette.primary.from,
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
  },
  chipEmoji: {
    fontSize: 16,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500' as any,
    color: brand.palette.fgSecondary,
  },
  chipTextActive: {
    color: brand.palette.fg,
  },
  conversation: {
    gap: 16,
  },
  userBubble: {
    alignSelf: 'flex-end',
    maxWidth: '80%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 20,
    borderBottomRightRadius: 4,
  },
  bubbleText: {
    fontSize: 16,
    color: brand.palette.fg,
    lineHeight: 24,
  },
  aiBubble: {
    alignSelf: 'flex-start',
    maxWidth: '80%',
    borderRadius: 20,
    borderBottomLeftRadius: 4,
    overflow: 'hidden',
  },
  aiBubbleGradient: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  aiBubbleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  aiBubbleLabel: {
    fontSize: 12,
    fontWeight: '700' as any,
    color: '#000',
    textTransform: 'uppercase',
  },
  aiBubbleText: {
    fontSize: 16,
    color: '#000',
    lineHeight: 24,
    marginBottom: 12,
  },
  typingIndicator: {
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  audioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  audioButtonText: {
    fontSize: 14,
    fontWeight: '600' as any,
    color: '#000',
  },
  tryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: brand.palette.primary.from,
    borderRadius: 12,
    alignSelf: 'center',
  },
  tryButtonText: {
    fontSize: 16,
    fontWeight: '600' as any,
    color: '#000',
  },
});
