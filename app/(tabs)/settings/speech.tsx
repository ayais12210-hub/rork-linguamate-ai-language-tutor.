import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Modal,
  TextInput,
  FlatList,
} from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Volume2,
  Mic,
  Languages,
  Settings,
  Play,
  Pause,
  Square,
  ChevronRight,
  Plus,
  Edit3,
  Trash2,
  Check,
  X,
  Zap,
  Target,
  Globe,
  User,
  Star,
  Clock,
  Sliders,
} from 'lucide-react-native';
import { useSpeech } from '@/hooks/use-speech';
import { useTheme } from '@/lib/theme';
import type { SpeechSettings, VoiceProfile, LanguageConfig } from '@/hooks/use-speech';

export default function SpeechSettings() {
  const theme = useTheme();
  const {
    speechSettings,
    voiceProfiles,
    languageConfigs,
    isSpeaking,
    isTranscribing,
    detectedLanguage,
    isLanguageDetecting,
    speak,
    stopSpeaking,
    speakPhrase,
    updateSpeechSettings,
    getVoiceProfilesForLanguage,
    getLanguageConfig,
    getSupportedLanguages,
    createVoiceProfile,
    updateVoiceProfile,
    deleteVoiceProfile,
    speakWithProfile,
    detectLanguage,
  } = useSpeech();

  const [showVoiceSelector, setShowVoiceSelector] = useState(false);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [showVoiceProfileModal, setShowVoiceProfileModal] = useState(false);
  const [showPhraseModal, setShowPhraseModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState<VoiceProfile | null>(null);
  const [testText, setTestText] = useState('Hello, this is a test of the speech synthesis system.');
  const [selectedLanguage, setSelectedLanguage] = useState(speechSettings.language);

  const supportedLanguages = useMemo(() => getSupportedLanguages(), [getSupportedLanguages]);
  const currentLanguageConfig = useMemo(() => getLanguageConfig(selectedLanguage), [getLanguageConfig, selectedLanguage]);
  const availableVoices = useMemo(() => getVoiceProfilesForLanguage(selectedLanguage), [getVoiceProfilesForLanguage, selectedLanguage]);

  const handleLanguageChange = (languageCode: string) => {
    setSelectedLanguage(languageCode);
    updateSpeechSettings({ language: languageCode });
    setShowLanguageSelector(false);
  };

  const handleVoiceChange = (voiceId: string) => {
    updateSpeechSettings({ voice: voiceId });
    setShowVoiceSelector(false);
  };

  const handleToneChange = (tone: SpeechSettings['tone']) => {
    updateSpeechSettings({ tone });
  };

  const handleEmphasisChange = (emphasis: SpeechSettings['emphasis']) => {
    updateSpeechSettings({ emphasis });
  };

  const handleRateChange = (rate: number) => {
    updateSpeechSettings({ rate });
  };

  const handlePitchChange = (pitch: number) => {
    updateSpeechSettings({ pitch });
  };

  const handleVolumeChange = (volume: number) => {
    updateSpeechSettings({ volume });
  };

  const handlePauseDurationChange = (pauseDuration: number) => {
    updateSpeechSettings({ pauseDuration });
  };

  const testSpeech = async () => {
    if (isSpeaking) {
      await stopSpeaking();
    } else {
      await speak(testText, {
        language: selectedLanguage,
        voice: speechSettings.voice,
        tone: speechSettings.tone,
        emphasis: speechSettings.emphasis,
        useSSML: true,
      });
    }
  };

  const testPhrase = async (phrase: string) => {
    await speakPhrase(phrase, selectedLanguage);
  };

  const createNewProfile = () => {
    setEditingProfile(null);
    setShowVoiceProfileModal(true);
  };

  const editProfile = (profile: VoiceProfile) => {
    setEditingProfile(profile);
    setShowVoiceProfileModal(true);
  };

  const deleteProfile = (profileId: string) => {
    Alert.alert(
      'Delete Voice Profile',
      'Are you sure you want to delete this voice profile?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteVoiceProfile(profileId),
        },
      ]
    );
  };

  const saveProfile = (profileData: Omit<VoiceProfile, 'id'>) => {
    if (editingProfile) {
      updateVoiceProfile(editingProfile.id, profileData);
    } else {
      createVoiceProfile(profileData);
    }
    setShowVoiceProfileModal(false);
    setEditingProfile(null);
  };

  const renderLanguageItem = ({ item }: { item: LanguageConfig }) => (
    <TouchableOpacity
      style={[
        styles.languageItem,
        { borderBottomColor: theme.colors.border.light },
        selectedLanguage === item.code && styles.selectedLanguageItem,
      ]}
      onPress={() => handleLanguageChange(item.code)}
    >
      <Text style={styles.languageFlag}>{item.flag}</Text>
      <View style={styles.languageInfo}>
        <Text style={[styles.languageName, { color: theme.colors.text.primary }]}>
          {item.name}
        </Text>
        <Text style={[styles.languageNative, { color: theme.colors.text.secondary }]}>
          {item.nativeName}
        </Text>
      </View>
      {selectedLanguage === item.code && (
        <Check size={20} color="#10B981" />
      )}
    </TouchableOpacity>
  );

  const renderVoiceItem = ({ item }: { item: VoiceProfile }) => (
    <TouchableOpacity
      style={[
        styles.voiceItem,
        { borderBottomColor: theme.colors.border.light },
        speechSettings.voice === item.id && styles.selectedVoiceItem,
      ]}
      onPress={() => handleVoiceChange(item.id)}
    >
      <View style={styles.voiceInfo}>
        <Text style={[styles.voiceName, { color: theme.colors.text.primary }]}>
          {item.name}
        </Text>
        <Text style={[styles.voiceDetails, { color: theme.colors.text.secondary }]}>
          {item.gender} • {item.age} • {item.quality}
        </Text>
        <Text style={[styles.voiceCharacteristics, { color: theme.colors.text.tertiary }]}>
          {item.characteristics.join(', ')}
        </Text>
      </View>
      {speechSettings.voice === item.id && (
        <Check size={20} color="#10B981" />
      )}
    </TouchableOpacity>
  );

  const renderProfileItem = ({ item }: { item: VoiceProfile }) => (
    <View style={[styles.profileItem, { borderBottomColor: theme.colors.border.light }]}>
      <View style={styles.profileInfo}>
        <Text style={[styles.profileName, { color: theme.colors.text.primary }]}>
          {item.name}
        </Text>
        <Text style={[styles.profileDetails, { color: theme.colors.text.secondary }]}>
          {item.language} • {item.accent} • {item.gender}
        </Text>
      </View>
      <View style={styles.profileActions}>
        <TouchableOpacity
          style={styles.profileAction}
          onPress={() => speakWithProfile(testText, item.id)}
        >
          <Play size={16} color={theme.colors.text.secondary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.profileAction}
          onPress={() => editProfile(item)}
        >
          <Edit3 size={16} color={theme.colors.text.secondary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.profileAction}
          onPress={() => deleteProfile(item.id)}
        >
          <Trash2 size={16} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background.secondary }]}>
      <Stack.Screen 
        options={{ 
          title: 'Speech Settings',
          headerStyle: {
            backgroundColor: theme.colors.background.primary,
          },
          headerTitleStyle: {
            fontSize: 20,
            fontWeight: 'bold',
            color: theme.colors.text.primary,
          },
        }} 
      />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Test Section */}
        <View style={[styles.section, { backgroundColor: theme.colors.background.primary }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
            Test Speech
          </Text>
          <View style={styles.testContainer}>
            <TextInput
              style={[
                styles.testInput,
                { 
                  backgroundColor: theme.colors.background.secondary,
                  color: theme.colors.text.primary,
                  borderColor: theme.colors.border.light,
                }
              ]}
              value={testText}
              onChangeText={setTestText}
              placeholder="Enter text to test speech synthesis..."
              placeholderTextColor={theme.colors.text.tertiary}
              multiline
            />
            <TouchableOpacity
              style={[
                styles.testButton,
                { backgroundColor: isSpeaking ? '#EF4444' : '#10B981' }
              ]}
              onPress={testSpeech}
            >
              {isSpeaking ? <Square size={20} color="white" /> : <Play size={20} color="white" />}
            </TouchableOpacity>
          </View>
        </View>

        {/* Language Selection */}
        <View style={[styles.section, { backgroundColor: theme.colors.background.primary }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
            Language & Voice
          </Text>
          
          <TouchableOpacity
            style={[styles.settingItem, { borderBottomColor: theme.colors.border.light }]}
            onPress={() => setShowLanguageSelector(true)}
          >
            <View style={styles.settingLeft}>
              <Globe size={20} color={theme.colors.text.secondary} />
              <View style={styles.settingText}>
                <Text style={[styles.settingLabel, { color: theme.colors.text.primary }]}>
                  Language
                </Text>
                <Text style={[styles.settingValue, { color: theme.colors.text.secondary }]}>
                  {currentLanguageConfig?.name || 'Select Language'}
                </Text>
              </View>
            </View>
            <ChevronRight size={20} color={theme.colors.text.tertiary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.settingItem, { borderBottomColor: theme.colors.border.light }]}
            onPress={() => setShowVoiceSelector(true)}
          >
            <View style={styles.settingLeft}>
              <User size={20} color={theme.colors.text.secondary} />
              <View style={styles.settingText}>
                <Text style={[styles.settingLabel, { color: theme.colors.text.primary }]}>
                  Voice
                </Text>
                <Text style={[styles.settingValue, { color: theme.colors.text.secondary }]}>
                  {availableVoices.find(v => v.id === speechSettings.voice)?.name || 'Default'}
                </Text>
              </View>
            </View>
            <ChevronRight size={20} color={theme.colors.text.tertiary} />
          </TouchableOpacity>
        </View>

        {/* Voice Parameters */}
        <View style={[styles.section, { backgroundColor: theme.colors.background.primary }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
            Voice Parameters
          </Text>

          <View style={[styles.settingItem, { borderBottomColor: theme.colors.border.light }]}>
            <View style={styles.settingLeft}>
              <Sliders size={20} color={theme.colors.text.secondary} />
              <View style={styles.settingText}>
                <Text style={[styles.settingLabel, { color: theme.colors.text.primary }]}>
                  Speech Rate
                </Text>
                <Text style={[styles.settingValue, { color: theme.colors.text.secondary }]}>
                  {speechSettings.rate.toFixed(1)}x
                </Text>
              </View>
            </View>
            <View style={styles.sliderContainer}>
              <TouchableOpacity
                style={styles.sliderButton}
                onPress={() => handleRateChange(Math.max(0.5, speechSettings.rate - 0.1))}
              >
                <Text style={styles.sliderButtonText}>-</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.sliderButton}
                onPress={() => handleRateChange(Math.min(2.0, speechSettings.rate + 0.1))}
              >
                <Text style={styles.sliderButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.settingItem, { borderBottomColor: theme.colors.border.light }]}>
            <View style={styles.settingLeft}>
              <Target size={20} color={theme.colors.text.secondary} />
              <View style={styles.settingText}>
                <Text style={[styles.settingLabel, { color: theme.colors.text.primary }]}>
                  Pitch
                </Text>
                <Text style={[styles.settingValue, { color: theme.colors.text.secondary }]}>
                  {speechSettings.pitch.toFixed(1)}x
                </Text>
              </View>
            </View>
            <View style={styles.sliderContainer}>
              <TouchableOpacity
                style={styles.sliderButton}
                onPress={() => handlePitchChange(Math.max(0.5, speechSettings.pitch - 0.1))}
              >
                <Text style={styles.sliderButtonText}>-</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.sliderButton}
                onPress={() => handlePitchChange(Math.min(2.0, speechSettings.pitch + 0.1))}
              >
                <Text style={styles.sliderButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.settingItem, { borderBottomColor: theme.colors.border.light }]}>
            <View style={styles.settingLeft}>
              <Volume2 size={20} color={theme.colors.text.secondary} />
              <View style={styles.settingText}>
                <Text style={[styles.settingLabel, { color: theme.colors.text.primary }]}>
                  Volume
                </Text>
                <Text style={[styles.settingValue, { color: theme.colors.text.secondary }]}>
                  {Math.round((speechSettings.volume || 1.0) * 100)}%
                </Text>
              </View>
            </View>
            <View style={styles.sliderContainer}>
              <TouchableOpacity
                style={styles.sliderButton}
                onPress={() => handleVolumeChange(Math.max(0.1, (speechSettings.volume || 1.0) - 0.1))}
              >
                <Text style={styles.sliderButtonText}>-</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.sliderButton}
                onPress={() => handleVolumeChange(Math.min(1.0, (speechSettings.volume || 1.0) + 0.1))}
              >
                <Text style={styles.sliderButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Tone and Emphasis */}
        <View style={[styles.section, { backgroundColor: theme.colors.background.primary }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
            Speech Style
          </Text>

          <View style={[styles.settingItem, { borderBottomColor: theme.colors.border.light }]}>
            <View style={styles.settingLeft}>
              <Zap size={20} color={theme.colors.text.secondary} />
              <Text style={[styles.settingLabel, { color: theme.colors.text.primary }]}>
                Tone
              </Text>
            </View>
            <View style={styles.toneContainer}>
              {(['neutral', 'friendly', 'professional', 'casual', 'dramatic'] as const).map((tone) => (
                <TouchableOpacity
                  key={tone}
                  style={[
                    styles.toneButton,
                    speechSettings.tone === tone && styles.activeToneButton,
                  ]}
                  onPress={() => handleToneChange(tone)}
                >
                  <Text style={[
                    styles.toneButtonText,
                    speechSettings.tone === tone && styles.activeToneButtonText,
                  ]}>
                    {tone.charAt(0).toUpperCase() + tone.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={[styles.settingItem, { borderBottomColor: theme.colors.border.light }]}>
            <View style={styles.settingLeft}>
              <Star size={20} color={theme.colors.text.secondary} />
              <Text style={[styles.settingLabel, { color: theme.colors.text.primary }]}>
                Emphasis
              </Text>
            </View>
            <View style={styles.toneContainer}>
              {(['normal', 'strong', 'subtle'] as const).map((emphasis) => (
                <TouchableOpacity
                  key={emphasis}
                  style={[
                    styles.toneButton,
                    speechSettings.emphasis === emphasis && styles.activeToneButton,
                  ]}
                  onPress={() => handleEmphasisChange(emphasis)}
                >
                  <Text style={[
                    styles.toneButtonText,
                    speechSettings.emphasis === emphasis && styles.activeToneButtonText,
                  ]}>
                    {emphasis.charAt(0).toUpperCase() + emphasis.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Quick Phrases */}
        <View style={[styles.section, { backgroundColor: theme.colors.background.primary }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
            Quick Phrases
          </Text>
          <View style={styles.phrasesContainer}>
            {['greeting', 'thank_you', 'please', 'sorry', 'help'].map((phrase) => (
              <TouchableOpacity
                key={phrase}
                style={[styles.phraseButton, { backgroundColor: theme.colors.background.secondary }]}
                onPress={() => testPhrase(phrase)}
              >
                <Text style={[styles.phraseButtonText, { color: theme.colors.text.primary }]}>
                  {phrase.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Voice Profiles */}
        <View style={[styles.section, { backgroundColor: theme.colors.background.primary }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
              Voice Profiles
            </Text>
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: '#10B981' }]}
              onPress={createNewProfile}
            >
              <Plus size={16} color="white" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={voiceProfiles}
            renderItem={renderProfileItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
        </View>
      </ScrollView>

      {/* Language Selector Modal */}
      <Modal
        visible={showLanguageSelector}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.colors.background.primary }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.colors.text.primary }]}>
              Select Language
            </Text>
            <TouchableOpacity onPress={() => setShowLanguageSelector(false)}>
              <X size={24} color={theme.colors.text.secondary} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={supportedLanguages}
            renderItem={renderLanguageItem}
            keyExtractor={(item) => item.code}
          />
        </SafeAreaView>
      </Modal>

      {/* Voice Selector Modal */}
      <Modal
        visible={showVoiceSelector}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.colors.background.primary }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.colors.text.primary }]}>
              Select Voice
            </Text>
            <TouchableOpacity onPress={() => setShowVoiceSelector(false)}>
              <X size={24} color={theme.colors.text.secondary} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={availableVoices}
            renderItem={renderVoiceItem}
            keyExtractor={(item) => item.id}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  testContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  testInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  testButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 12,
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  settingValue: {
    fontSize: 14,
  },
  sliderContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  sliderButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sliderButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  toneContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  toneButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
  },
  activeToneButton: {
    backgroundColor: '#10B981',
  },
  toneButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
  },
  activeToneButtonText: {
    color: 'white',
  },
  phrasesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  phraseButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  phraseButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  profileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  profileDetails: {
    fontSize: 14,
  },
  profileActions: {
    flexDirection: 'row',
    gap: 8,
  },
  profileAction: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  selectedLanguageItem: {
    backgroundColor: '#F0FDF4',
  },
  languageFlag: {
    fontSize: 24,
    marginRight: 12,
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  languageNative: {
    fontSize: 14,
  },
  voiceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  selectedVoiceItem: {
    backgroundColor: '#F0FDF4',
  },
  voiceInfo: {
    flex: 1,
  },
  voiceName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  voiceDetails: {
    fontSize: 14,
    marginBottom: 2,
  },
  voiceCharacteristics: {
    fontSize: 12,
  },
});
