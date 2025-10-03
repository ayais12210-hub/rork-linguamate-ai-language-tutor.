import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Animated,
} from 'react-native';
import * as Speech from 'expo-speech';
import * as Clipboard from 'expo-clipboard';
import { Audio } from 'expo-av';
import { Platform } from 'react-native';
import {
  ArrowUpDown,
  Copy,
  Volume2,
  Star,
  ChevronDown,
  X,
  BookOpen,
  Lightbulb,
  MessageCircle,
  Brain,
  Globe,
  Award,
  Sparkles,
  Clipboard as ClipboardIcon,
  Trash2,
  FileText,
  Mic,
} from 'lucide-react-native';
import { LANGUAGES } from '@/constants/languages';
import { Language } from '@/types/user';
import { useUser } from '@/hooks/user-store';
import UpgradeModal from '@/components/UpgradeModal';

interface Translation {
  id: string;
  sourceText: string;
  translatedText: string;
  fromLanguage: string;
  toLanguage: string;
  timestamp: string;
  isFavorite?: boolean;
  pronunciation?: {
    text: string;
    phonetic: string;
    breakdown: string;
    stressPattern?: string;
    articulationNotes?: string;
    commonMispronunciations?: string;
  };
  meaning?: {
    literal?: string;
    functional?: string;
    idiomaticity?: string;
    semanticRange?: string;
    emotionalWeight?: string;
    contextualExamples?: string[];
  };
  structure?: {
    wordOrder?: string;
    morphology?: string;
    agreement?: string;
    auxiliaries?: string;
    productiveForms?: string;
    grammarTraps?: string;
  };
  learningProcess?: {
    acquisitionSteps?: string[];
    frequencyPriority?: string;
    immersionStrategies?: string[];
  };
  usage?: {
    contexts?: string[];
    register?: string;
    tone?: string;
    collocations?: string[];
    pragmaticRole?: string;
    appropriateness?: string;
  };
  cognitiveHooks?: {
    mnemonics?: string;
    metaphors?: string;
    soundAssociations?: string;
    vividImagery?: string;
  };
  culture?: {
    symbolism?: string;
    worldview?: string;
    politenessSystem?: string;
    identityMarkers?: string;
    historicalSignificance?: string;
    regionalVariations?: string[];
  };
  crossLanguageInterference?: {
    overLiteralTranslations?: string[];
    falseFriends?: string[];
    l1TransferErrors?: string[];
    registerMismatches?: string[];
  };
  recap?: {
    keySummary?: string;
    dos?: string[];
    donts?: string[];
    reinforcement?: string;
  };
  alternativeTranslationsData?: {
    neutral?: string;
    formal?: string;
    colloquial?: string;
    situationalNotes?: string;
  };
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  confidence?: number;
}

interface AITranslationResponseShape {
  translation?: string;
  pronunciation?: unknown;
  meaning?: unknown;
  structure?: unknown;
  learningProcess?: unknown;
  usage?: unknown;
  cognitiveHooks?: unknown;
  culture?: unknown;
  crossLanguageInterference?: unknown;
  recap?: unknown;
  alternativeTranslations?: unknown;
  difficulty?: string;
  confidence?: unknown;
}

function stripJSONCodeFences(raw: string): string {
  try {
    let s = raw.trim();
    if (s.startsWith('```')) {
      const firstFenceEnd = s.indexOf('\n');
      s = s.slice(firstFenceEnd + 1);
      const lastFence = s.lastIndexOf('```');
      if (lastFence !== -1) s = s.slice(0, lastFence);
    }
    const firstBrace = s.indexOf('{');
    const lastBrace = s.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      s = s.slice(firstBrace, lastBrace + 1);
    }
    return s;
  } catch (e) {
    console.log('[Translator] stripJSONCodeFences error', e);
    return raw;
  }
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(v => (typeof v === 'string' ? v : JSON.stringify(v))).filter(Boolean);
  }
  if (typeof value === 'string') {
    const parts = value
      .replace(/^[\s•*-]+/gm, '')
      .split(/\n|;|\|/)
      .map(t => t.trim())
      .filter(Boolean);
    return parts.length > 0 ? parts : [value];
  }
  if (value == null) return [];
  return [JSON.stringify(value)];
}

function coerceConfidence(value: unknown): number | undefined {
  if (typeof value === 'number') return Math.max(0, Math.min(1, value));
  if (typeof value === 'string') {
    const m = value.match(/([0-9]*\.?[0-9]+)/);
    if (m) {
      const n = parseFloat(m[1]);
      if (!Number.isNaN(n)) return Math.max(0, Math.min(1, n > 1 ? n / 100 : n));
    }
  }
  return undefined;
}

function normalizeAIResponse(raw: string): AITranslationResponseShape {
  try {
    const cleaned = stripJSONCodeFences(raw);
    const parsed = JSON.parse(cleaned) as AITranslationResponseShape;
    return parsed;
  } catch (e) {
    console.log('[Translator] JSON parse failed, falling back to plain text', e);
    return { translation: raw } as AITranslationResponseShape;
  }
}

export default function TranslatorScreen() {
  const { user, upgradeToPremium } = useUser();

  const [sourceText, setSourceText] = useState<string>('');
  const [translatedText, setTranslatedText] = useState<string>('');
  const [fromLanguage, setFromLanguage] = useState<string>(user.nativeLanguage || 'en');
  const [toLanguage, setToLanguage] = useState<string>(user.selectedLanguage || 'es');
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [showFromLanguages, setShowFromLanguages] = useState<boolean>(false);
  const [showToLanguages, setShowToLanguages] = useState<boolean>(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState<boolean>(false);
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [translationCount, setTranslationCount] = useState<number>(0);
  const [currentTranslation, setCurrentTranslation] = useState<Translation | null>(null);
  const [showInsights, setShowInsights] = useState<boolean>(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const sourceInputRef = useRef<TextInput>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedSuggestions, setSelectedSuggestions] = useState<string[]>([]);

  const fromLang = LANGUAGES.find(lang => lang.code === fromLanguage) || LANGUAGES[0];
  const toLang = LANGUAGES.find(lang => lang.code === toLanguage) || LANGUAGES[1];

  const canTranslate = useCallback((): boolean => {
    if (user.isPremium) return true;
    const today = new Date().toDateString();
    const isNewDay = user.stats?.lastMessageDate !== today;
    const used = isNewDay ? 0 : translationCount;
    return used < 3;
  }, [translationCount, user.isPremium, user.stats?.lastMessageDate]);

  const handleTranslate = useCallback(async () => {
    if (!sourceText.trim()) {
      Alert.alert('Error', 'Please enter text to translate');
      return;
    }

    if (!canTranslate()) {
      setShowUpgradeModal(true);
      return;
    }

    setIsTranslating(true);
    console.log('[Translator] Starting translation request');

    try {
      const response = await fetch('https://toolkit.rork.com/text/llm/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: `You are an elite multilingual AI coach and professional translator with deep expertise in ${fromLang.name} and ${toLang.name}.

The user is a ${user.proficiencyLevel} level learner whose native language is ${fromLang.name} and is learning ${toLang.name}. They want to translate from their native language to their target language to practice and learn.

Your task is to provide a comprehensive translation and learning analysis. Respond with a JSON object containing:

{
  "translation": "[accurate, natural translation that sounds native in ${toLang.name}]",
  "pronunciation": {
    "text": "[the translated text]",
    "phonetic": "[IPA transcription]",
    "breakdown": "[syllable-by-syllable with stress markers]",
    "stressPattern": "[stress and intonation patterns]",
    "articulationNotes": "[mouth/tongue placement, aspirated vs unaspirated consonants, vowel length]",
    "commonMispronunciations": "[typical errors learners make]"
  },
  "meaning": {
    "literal": "[word-for-word translation]",
    "functional": "[actual meaning in context]",
    "idiomaticity": "[how idiomatic or natural it is]",
    "semanticRange": "[range of meanings and contexts]",
    "emotionalWeight": "[emotional or affective connotations]",
    "contextualExamples": ["[example 1 in ${toLang.name}]", "[example 2 in ${toLang.name}]"]
  },
  "structure": {
    "wordOrder": "[explanation of word order]",
    "morphology": "[gender, case, tense, aspect, mood details]",
    "agreement": "[subject-verb, noun-adjective agreement]",
    "auxiliaries": "[auxiliary verbs and their functions]",
    "productiveForms": "[prefixes, suffixes, derivations]",
    "grammarTraps": "[common grammar mistakes specific to this phrase]"
  },
  "learningProcess": {
    "acquisitionSteps": ["[step 1: chunking]", "[step 2: shadowing]", "[step 3: spaced repetition]"],
    "frequencyPriority": "[high/medium/low - how common this phrase is]",
    "immersionStrategies": ["[media suggestion]", "[journaling tip]", "[conversation practice]"]
  },
  "usage": {
    "contexts": ["[formal setting]", "[informal setting]", "[workplace]"],
    "register": "[formal/neutral/informal/slang]",
    "tone": "[polite/casual/respectful/familiar]",
    "collocations": ["[common word combinations]"],
    "pragmaticRole": "[request/greeting/persuasion/etc]",
    "appropriateness": "[when to use with elders, peers, strangers]"
  },
  "cognitiveHooks": {
    "mnemonics": "[memory device]",
    "metaphors": "[conceptual metaphor]",
    "soundAssociations": "[sounds like...]",
    "vividImagery": "[mental picture to remember]"
  },
  "culture": {
    "symbolism": "[cultural symbolism]",
    "worldview": "[worldview implications]",
    "politenessSystem": "[politeness norms]",
    "identityMarkers": "[social identity aspects]",
    "historicalSignificance": "[historical or philosophical background]",
    "regionalVariations": ["[dialect 1]", "[dialect 2]"]
  },
  "crossLanguageInterference": {
    "overLiteralTranslations": ["[common mistake 1]"],
    "falseFriends": ["[deceptive similarity]"],
    "l1TransferErrors": ["[native language interference]"],
    "registerMismatches": ["[formality level errors]"]
  },
  "recap": {
    "keySummary": "[short summary of key insights]",
    "dos": ["[do this]", "[do that]"],
    "donts": ["[avoid this]", "[avoid that]"],
    "reinforcement": "[encouragement and next steps]"
  },
  "alternativeTranslations": {
    "neutral": "[neutral version]",
    "formal": "[formal version]",
    "colloquial": "[colloquial/slang version]",
    "situationalNotes": "[when to use each alternative]"
  },
  "difficulty": "[beginner/intermediate/advanced]",
  "confidence": [0.0-1.0 confidence score]
}

Focus on being an encouraging language coach who provides progressive learning flow: sound → meaning → structure → learning → usage → memory → culture → pitfalls → recap → alternatives.`
            },
            {
              role: 'user',
              content: sourceText,
            },
          ],
        }),
      });

      const data = await response.json();
      const normalized = normalizeAIResponse(String(data?.completion ?? ''));
      const translationText = (normalized.translation ?? '').toString();
      setTranslatedText(translationText);

      const difficultyNorm = (normalized.difficulty ?? '').toString().toLowerCase();
      const difficultyValid = ['beginner', 'intermediate', 'advanced'].includes(difficultyNorm)
        ? (difficultyNorm as 'beginner' | 'intermediate' | 'advanced')
        : undefined;
      const confidenceNorm = coerceConfidence(normalized.confidence);
      
      let pronunciation: Translation['pronunciation'] | undefined;
      if (normalized.pronunciation && typeof normalized.pronunciation === 'object') {
        const p = normalized.pronunciation as Record<string, unknown>;
        pronunciation = {
          text: String(p.text ?? translationText),
          phonetic: String(p.phonetic ?? ''),
          breakdown: String(p.breakdown ?? ''),
          stressPattern: p.stressPattern ? String(p.stressPattern) : undefined,
          articulationNotes: p.articulationNotes ? String(p.articulationNotes) : undefined,
          commonMispronunciations: p.commonMispronunciations ? String(p.commonMispronunciations) : undefined,
        };
      }

      setTranslationCount(prev => prev + 1);

      const newTranslation: Translation = {
        id: Date.now().toString(),
        sourceText,
        translatedText: translationText,
        fromLanguage,
        toLanguage,
        timestamp: new Date().toISOString(),
        meaning: normalized.meaning ?? undefined,
        structure: normalized.structure ?? undefined,
        learningProcess: normalized.learningProcess ?? undefined,
        usage: normalized.usage ?? undefined,
        cognitiveHooks: normalized.cognitiveHooks ?? undefined,
        culture: normalized.culture ?? undefined,
        crossLanguageInterference: normalized.crossLanguageInterference ?? undefined,
        recap: normalized.recap ?? undefined,
        alternativeTranslationsData: normalized.alternativeTranslations ?? undefined,
        difficulty: difficultyValid,
        confidence: confidenceNorm,
        pronunciation,
      };

      setCurrentTranslation(newTranslation);
      setShowInsights(true);

      setTranslations(prev => [newTranslation, ...prev.slice(0, 19)]);

      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    } catch (error) {
      console.error('Translation error:', error);
      Alert.alert('Error', 'Failed to translate. Please try again.');
    } finally {
      setIsTranslating(false);
    }
  }, [canTranslate, fadeAnim, fromLang.name, fromLanguage, sourceText, toLang.name, toLanguage, user.proficiencyLevel]);

  const generateSuggestions = useCallback(async () => {
    try {
      console.log('[Translator] Generating suggestions...');
      const response = await fetch('https://toolkit.rork.com/text/llm/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: `You are a language learning coach. Generate 4-6 short, practical phrases or sentences in ${fromLang.name} that a ${user.proficiencyLevel} level learner would want to translate to ${toLang.name}. Focus on common, useful expressions for daily conversation. Return ONLY a JSON array of strings, no other text. Example: ["How are you?", "Where is the bathroom?", "I would like to order"]`,
            },
            {
              role: 'user',
              content: `Generate translation practice suggestions for ${user.proficiencyLevel} level learner`,
            },
          ],
        }),
      });
      
      if (!response.ok) {
        console.error('[Translator] Suggestions API error:', response.status, response.statusText);
        setSuggestions([]);
        return;
      }
      
      const data = await response.json();
      const completion = String(data?.completion ?? '[]');
      let parsed: string[] = [];
      try {
        const cleaned = completion.trim().replace(/^```json\s*/, '').replace(/```\s*$/, '');
        parsed = JSON.parse(cleaned);
        if (!Array.isArray(parsed)) parsed = [];
      } catch (e) {
        console.log('[Translator] Failed to parse suggestions', e);
        parsed = [];
      }
      setSuggestions(parsed.slice(0, 6));
      console.log('[Translator] Suggestions generated:', parsed.length);
    } catch (error) {
      console.error('[Translator] Failed to generate suggestions:', error);
      setSuggestions([]);
    }
  }, [fromLang.name, toLang.name, user.proficiencyLevel]);

  useEffect(() => {
    generateSuggestions();
  }, [generateSuggestions]);

  const isSuggestionSelected = useCallback((text: string) => {
    return selectedSuggestions.includes(text);
  }, [selectedSuggestions]);

  const toggleSuggestion = useCallback((text: string) => {
    setSelectedSuggestions(prev => {
      const exists = prev.includes(text);
      if (exists) {
        return prev.filter(t => t !== text);
      }
      return [...prev, text];
    });
  }, []);

  const clearSelectedSuggestions = useCallback(() => {
    setSelectedSuggestions([]);
  }, []);

  const combinedSelectedText = useMemo(() => {
    return selectedSuggestions.join(' ');
  }, [selectedSuggestions]);

  const handleSuggestionPress = useCallback((text: string) => {
    if (!text) return;
    setSourceText(prev => {
      const hasContent = (prev ?? '').trim().length > 0;
      const separator = hasContent ? ' ' : '';
      return `${prev ?? ''}${separator}${text}`;
    });
    toggleSuggestion(text);
  }, [toggleSuggestion]);

  const handleSuggestionTranslate = useCallback((text: string) => {
    if (!text) return;
    setSourceText(text);
    setTimeout(() => {
      handleTranslate();
    }, 100);
  }, [handleTranslate]);

  const handleBulkInsert = useCallback(() => {
    if (combinedSelectedText.trim().length === 0) return;
    setSourceText(prev => {
      const base = prev?.trim().length ? `${prev} ` : '';
      return `${base}${combinedSelectedText}`;
    });
  }, [combinedSelectedText]);

  const handleBulkTranslate = useCallback(() => {
    if (combinedSelectedText.trim().length === 0) return;
    setSourceText(combinedSelectedText);
    clearSelectedSuggestions();
    setTimeout(() => {
      handleTranslate();
    }, 100);
  }, [combinedSelectedText, clearSelectedSuggestions, handleTranslate]);

  const handleSwapLanguages = () => {
    const tempLang = fromLanguage;
    setFromLanguage(toLanguage);
    setToLanguage(tempLang);

    const tempText = sourceText;
    setSourceText(translatedText);
    setTranslatedText(tempText);
  };

  const handleCopyText = async (text: string) => {
    if (!text.trim()) return;
    try {
      await Clipboard.setStringAsync(text);
      Alert.alert('Copied!', 'Text copied to clipboard');
    } catch (error) {
      console.error('[Translator] Copy error:', error);
      Alert.alert('Error', 'Failed to copy text');
    }
  };

  const handlePasteText = async () => {
    try {
      const text = await Clipboard.getStringAsync();
      if (text) {
        setSourceText(prev => {
          const hasContent = (prev ?? '').trim().length > 0;
          const separator = hasContent ? ' ' : '';
          return `${prev ?? ''}${separator}${text}`;
        });
      }
    } catch (error) {
      console.error('[Translator] Paste error:', error);
      Alert.alert('Error', 'Failed to paste text');
    }
  };

  const handleClearText = () => {
    setSourceText('');
    setTranslatedText('');
    setCurrentTranslation(null);
    setShowInsights(false);
  };

  const handleInsertText = () => {
    if (translatedText.trim()) {
      setSourceText(prev => {
        const hasContent = (prev ?? '').trim().length > 0;
        const separator = hasContent ? ' ' : '';
        return `${prev ?? ''}${separator}${translatedText}`;
      });
    }
  };

  const handleSpeechToText = async () => {
    if (isRecording) {
      try {
        if (recordingRef.current) {
          console.log('[Translator] Stopping recording...');
          await recordingRef.current.stopAndUnloadAsync();
          const uri = recordingRef.current.getURI();
          const tempRecording = recordingRef.current;
          setIsRecording(false);
          recordingRef.current = null;

          if (Platform.OS !== 'web') {
            await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
          }

          if (uri) {
            console.log('[Translator] Processing audio from:', uri);
            const formData = new FormData();
            const uriParts = uri.split('.');
            const fileType = uriParts[uriParts.length - 1];

            if (Platform.OS === 'web') {
              const response = await fetch(uri);
              const blob = await response.blob();
              formData.append('audio', blob, `recording.${fileType}`);
            } else {
              formData.append('audio', {
                uri,
                name: `recording.${fileType}`,
                type: `audio/${fileType}`,
              } as any);
            }

            console.log('[Translator] Sending audio to backend STT API...');
            const apiBaseUrl = typeof window !== 'undefined' && window.location 
              ? `${window.location.protocol}//${window.location.host}`
              : '';
            const sttResponse = await fetch(`${apiBaseUrl}/api/stt/transcribe`, {
              method: 'POST',
              body: formData,
            });

            if (!sttResponse.ok) {
              const errorText = await sttResponse.text();
              console.error('[Translator] STT API error:', errorText);
              throw new Error(`STT API returned ${sttResponse.status}`);
            }

            const data = await sttResponse.json();
            console.log('[Translator] STT response:', data);
            
            if (data.text) {
              setSourceText(prev => {
                const currentText = (prev ?? '').trim();
                const transcribedText = data.text.trim();
                
                if (!currentText) {
                  return transcribedText;
                }
                
                return `${currentText} ${transcribedText}`;
              });
              
              console.log('[Translator] Text inserted successfully');
              
              if (sourceInputRef.current) {
                setTimeout(() => {
                  sourceInputRef.current?.focus();
                }, 100);
              }
            } else {
              Alert.alert('No Speech Detected', 'Please try speaking again.');
            }
          }
        }
      } catch (error) {
        console.error('[Translator] STT error:', error);
        setIsRecording(false);
        recordingRef.current = null;
        if (Platform.OS !== 'web') {
          try {
            await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
          } catch (e) {
            console.error('[Translator] Failed to reset audio mode:', e);
          }
        }
        Alert.alert('Error', 'Failed to transcribe audio. Please try again.');
      }
    } else {
      try {
        if (recordingRef.current) {
          console.log('[Translator] Cleaning up existing recording...');
          try {
            await recordingRef.current.stopAndUnloadAsync();
          } catch (e) {
            console.log('[Translator] Error cleaning up recording:', e);
          }
          recordingRef.current = null;
        }

        console.log('[Translator] Requesting microphone permission...');
        const { status } = await Audio.requestPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Required', 'Please grant microphone permission to use speech-to-text.');
          return;
        }

        console.log('[Translator] Setting up audio mode...');
        if (Platform.OS !== 'web') {
          await Audio.setAudioModeAsync({
            allowsRecordingIOS: true,
            playsInSilentModeIOS: true,
          });
        }

        console.log('[Translator] Starting recording...');
        const recording = new Audio.Recording();
        await recording.prepareToRecordAsync({
          android: {
            extension: '.m4a',
            outputFormat: Audio.AndroidOutputFormat.MPEG_4,
            audioEncoder: Audio.AndroidAudioEncoder.AAC,
            sampleRate: 44100,
            numberOfChannels: 2,
            bitRate: 128000,
          },
          ios: {
            extension: '.wav',
            outputFormat: Audio.IOSOutputFormat.LINEARPCM,
            audioQuality: Audio.IOSAudioQuality.HIGH,
            sampleRate: 44100,
            numberOfChannels: 2,
            bitRate: 128000,
            linearPCMBitDepth: 16,
            linearPCMIsBigEndian: false,
            linearPCMIsFloat: false,
          },
          web: {
            mimeType: 'audio/webm',
            bitsPerSecond: 128000,
          },
        });

        await recording.startAsync();
        recordingRef.current = recording;
        setIsRecording(true);
        console.log('[Translator] Recording started successfully');
      } catch (error) {
        console.error('[Translator] Recording start error:', error);
        setIsRecording(false);
        recordingRef.current = null;
        if (Platform.OS !== 'web') {
          try {
            await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
          } catch (e) {
            console.error('[Translator] Failed to reset audio mode:', e);
          }
        }
        Alert.alert('Error', 'Failed to start recording. Please check your microphone.');
      }
    }
  };

  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [speakingTextId, setSpeakingTextId] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const recordingRef = useRef<Audio.Recording | null>(null);

  const handleSpeakText = useCallback(async (text: string, language: string, textId?: string) => {
    if (!text.trim()) return;

    if (!user.isPremium) {
      setShowUpgradeModal(true);
      return;
    }

    try {
      if (isSpeaking) {
        await Speech.stop();
        setIsSpeaking(false);
        setSpeakingTextId(null);
        return;
      }

      setIsSpeaking(true);
      if (textId) setSpeakingTextId(textId);

      const langCode = language.split('-')[0];
      const speechRate = 0.9;

      await Speech.speak(text, {
        language: langCode,
        pitch: 1.0,
        rate: speechRate,
        onDone: () => {
          setIsSpeaking(false);
          setSpeakingTextId(null);
        },
        onStopped: () => {
          setIsSpeaking(false);
          setSpeakingTextId(null);
        },
        onError: (error) => {
          console.error('[Translator] TTS error:', error);
          setIsSpeaking(false);
          setSpeakingTextId(null);
          Alert.alert('Error', 'Failed to play audio. Please try again.');
        },
      });
    } catch (error) {
      console.error('[Translator] Speech error:', error);
      setIsSpeaking(false);
      setSpeakingTextId(null);
      Alert.alert('Error', 'Failed to play audio. Please try again.');
    }
  }, [isSpeaking, user.isPremium]);

  useEffect(() => {
    return () => {
      Speech.stop();
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(e => {
          console.log('[Translator] Cleanup error:', e);
        });
      }
    };
  }, []);

  const toggleFavorite = (translationId: string) => {
    if (!user.isPremium) {
      setShowUpgradeModal(true);
      return;
    }

    setTranslations(prev =>
      prev.map(t => (t.id === translationId ? { ...t, isFavorite: !t.isFavorite } : t))
    );
  };

  const handleUpgrade = () => {
    setShowUpgradeModal(false);
    upgradeToPremium();
    Alert.alert('Success!', 'You now have Premium access with unlimited translations!');
  };

  const getRemainingTranslations = () => {
    if (user.isPremium) return null;
    return 3 - translationCount;
  };

  const LanguageSelector = ({
    languages,
    selectedCode,
    onSelect,
    visible,
    onClose,
  }: {
    languages: Language[];
    selectedCode: string;
    onSelect: (code: string) => void;
    visible: boolean;
    onClose: () => void;
  }) => {
    if (!visible) return null;

    return (
      <View style={styles.languageSelectorOverlay}>
        <View style={styles.languageSelectorModal}>
          <View style={styles.languageSelectorHeader}>
            <Text style={styles.languageSelectorTitle}>Select Language</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.languageList}>
            {languages.map(language => (
              <TouchableOpacity
                key={language.code}
                style={[
                  styles.languageItem,
                  selectedCode === language.code && styles.selectedLanguageItem,
                ]}
                onPress={() => {
                  onSelect(language.code);
                  onClose();
                }}
              >
                <Text style={styles.languageFlag}>{language.flag}</Text>
                <Text style={styles.languageName}>{language.name}</Text>
                <Text style={styles.languageNative}>{language.nativeName}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Translator</Text>
        <View style={styles.headerRight}>
          {!user.isPremium && (
            <Text style={styles.remainingText}>{getRemainingTranslations()} left today</Text>
          )}
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.languageSelector}>
          <TouchableOpacity
            style={styles.languageButton}
            onPress={() => setShowFromLanguages(true)}
          >
            <Text style={styles.languageFlag}>{fromLang.flag}</Text>
            <Text style={styles.languageText}>{fromLang.name}</Text>
            <ChevronDown size={16} color="#6B7280" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.swapButton} onPress={handleSwapLanguages}>
            <ArrowUpDown size={20} color="#3B82F6" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.languageButton}
            onPress={() => setShowToLanguages(true)}
          >
            <Text style={styles.languageFlag}>{toLang.flag}</Text>
            <Text style={styles.languageText}>{toLang.name}</Text>
            <ChevronDown size={16} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <View style={styles.inputSection}>
          <View style={styles.inputHeader} testID="input-header">
            <Text style={styles.inputLabel}>Enter text</Text>
            <View style={styles.inputHeaderActions}>
              <TouchableOpacity
                onPress={() => handleCopyText(sourceText)}
                disabled={!sourceText.trim()}
                style={styles.headerActionBtn}
                testID="copy-source-btn"
              >
                <Copy 
                  size={20} 
                  color={sourceText.trim() ? '#3B82F6' : '#9CA3AF'} 
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handlePasteText}
                style={styles.headerActionBtn}
                testID="paste-source-btn"
              >
                <ClipboardIcon 
                  size={20} 
                  color="#3B82F6" 
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleSpeakText(sourceText, fromLanguage, 'source')}
                disabled={!sourceText.trim()}
                style={styles.headerActionBtn}
                testID="speak-source-btn"
              >
                <Volume2 
                  size={20} 
                  color={sourceText.trim() ? (isSpeaking && speakingTextId === 'source' ? '#10B981' : '#3B82F6') : '#9CA3AF'} 
                  fill={isSpeaking && speakingTextId === 'source' ? '#10B981' : 'none'}
                />
              </TouchableOpacity>
            </View>
          </View>
          <TextInput
            ref={sourceInputRef}
            style={styles.textInput}
            value={sourceText}
            onChangeText={setSourceText}
            placeholder={
              fromLanguage === user.nativeLanguage
                ? `Type in your native language (${fromLang.name})...`
                : `Type in ${fromLang.name}...`
            }
            placeholderTextColor="#9CA3AF"
            multiline
            maxLength={1000}
            testID="source-input"
          />
          <View style={styles.inputFooter}>
            <View style={styles.inputFooterLeft}>
              <Text style={styles.characterCount}>{sourceText.length}/1000</Text>
              <TouchableOpacity
                onPress={handleClearText}
                style={styles.footerActionBtn}
                testID="clear-btn"
              >
                <Trash2 size={16} color="#EF4444" />
                <Text style={styles.footerActionText}>Clear</Text>
              </TouchableOpacity>
              {translatedText.trim() && (
                <TouchableOpacity
                  onPress={handleInsertText}
                  style={styles.footerActionBtn}
                  testID="insert-btn"
                >
                  <FileText size={16} color="#3B82F6" />
                  <Text style={styles.footerActionText}>Insert</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.inputFooterRight}>
              <TouchableOpacity
                style={[styles.sttButton, isRecording && styles.sttButtonRecording]}
                onPress={handleSpeechToText}
                testID="stt-button"
              >
                <Mic size={20} color={isRecording ? '#EF4444' : '#3B82F6'} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.translateButton}
                onPress={handleTranslate}
                disabled={isTranslating || !sourceText.trim()}
                testID="translate-button"
              >
                {isTranslating ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.translateButtonText}>Translate</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {suggestions.length > 0 && (
          <View style={styles.suggestionsBlock}>
            <View style={styles.suggestionsHeader}>
              <Sparkles size={16} color="#8B5CF6" />
              <Text style={styles.suggestionsTitle}>Suggestions</Text>
              <TouchableOpacity 
                onPress={generateSuggestions} 
                style={styles.suggestionsRefresh} 
                accessibilityLabel="Refresh suggestions" 
                testID="refreshSuggestionsBtn"
              >
                <Text style={styles.suggestionsRefreshText}>Refresh</Text>
              </TouchableOpacity>
            </View>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={styles.suggestionsRow} 
              testID="suggestionsRow"
            >
              {suggestions.map((s, idx) => {
                const selected = isSuggestionSelected(s);
                return (
                  <View 
                    key={`${s}-${idx}`} 
                    style={[styles.suggestionPill, selected ? styles.suggestionPillSelected : undefined]}
                  >
                    <TouchableOpacity
                      onPress={() => handleSuggestionPress(s)}
                      onLongPress={() => handleSuggestionTranslate(s)}
                      accessibilityLabel={`Suggestion ${idx+1}`}
                      testID={`suggestion-${idx}`}
                    >
                      <Text style={[styles.suggestionText, selected ? styles.suggestionTextSelected : undefined]}>
                        {s}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
              {selectedSuggestions.length > 0 && (
                <View style={styles.bulkActionsPill} testID="bulkActionsPill">
                  <Text style={styles.bulkCountText}>{selectedSuggestions.length} selected</Text>
                  <View style={styles.bulkButtonsRow}>
                    <TouchableOpacity 
                      onPress={handleBulkInsert} 
                      style={styles.bulkBtn} 
                      accessibilityLabel="Insert selected" 
                      testID="bulkInsertBtn"
                    >
                      <Text style={styles.bulkBtnText}>Insert</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      onPress={handleBulkTranslate} 
                      style={[styles.bulkBtn, styles.bulkTranslateBtn]} 
                      accessibilityLabel="Translate selected" 
                      testID="bulkTranslateBtn"
                    >
                      <Text style={[styles.bulkBtnText, styles.bulkTranslateBtnText]}>Translate</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      onPress={clearSelectedSuggestions} 
                      style={styles.bulkClearBtn} 
                      accessibilityLabel="Clear selected" 
                      testID="bulkClearBtn"
                    >
                      <Text style={styles.bulkClearText}>Clear</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        )}

        <View style={styles.languageDisplay}>
          <View style={styles.languageDisplayItem}>
            <Text style={styles.languageDisplayLabel}>From</Text>
            <View style={styles.languageDisplayContent}>
              <Text style={styles.languageDisplayFlag}>{fromLang.flag}</Text>
              <Text style={styles.languageDisplayName}>{fromLang.name}</Text>
            </View>
          </View>
          <ArrowUpDown size={16} color="#6B7280" />
          <View style={styles.languageDisplayItem}>
            <Text style={styles.languageDisplayLabel}>To</Text>
            <View style={styles.languageDisplayContent}>
              <Text style={styles.languageDisplayFlag}>{toLang.flag}</Text>
              <Text style={styles.languageDisplayName}>{toLang.name}</Text>
            </View>
          </View>
        </View>

        {(translatedText || isTranslating) && (
          <Animated.View style={[styles.outputSection, { opacity: fadeAnim }]} testID="output-section">
            <View style={styles.outputHeader}>
              <Text style={styles.outputLabel}>Professional Translation</Text>
              <View style={styles.outputActions} testID="output-actions">
                <TouchableOpacity
                  onPress={() => handleSpeakText(translatedText, toLanguage, 'translated')}
                  disabled={!translatedText.trim()}
                  testID="speak-translated-btn"
                >
                  <Volume2
                    size={20}
                    color={translatedText.trim() ? (isSpeaking && speakingTextId === 'translated' ? '#10B981' : '#3B82F6') : '#9CA3AF'}
                    fill={isSpeaking && speakingTextId === 'translated' ? '#10B981' : 'none'}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleCopyText(translatedText)}
                  disabled={!translatedText.trim()}
                  style={styles.actionButton}
                  testID="copy-translated-btn"
                >
                  <Copy size={20} color={translatedText.trim() ? '#3B82F6' : '#9CA3AF'} />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.outputText}>
              {isTranslating ? (
                <View style={styles.loadingContainer} testID="loading">
                  <ActivityIndicator size="small" color="#3B82F6" />
                  <Text style={styles.loadingText}>AI Coach analyzing...</Text>
                </View>
              ) : (
                <Text style={styles.translatedText} testID="translated-text">{translatedText}</Text>
              )}
            </View>

            {currentTranslation?.confidence !== undefined && (
              <View style={styles.confidenceSection}>
                <View style={styles.confidenceHeader}>
                  <Award size={16} color="#10B981" />
                  <Text style={styles.confidenceLabel}>Translation Confidence</Text>
                </View>
                <View style={styles.confidenceBar}>
                  <View
                    style={[
                      styles.confidenceFill,
                      {
                        width: `${Math.max(
                          0,
                          Math.min(100, Math.round(((currentTranslation.confidence ?? 0) as number) * 100))
                        )}%`,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.confidenceText}>
                  {Math.max(
                    0,
                    Math.min(100, Math.round(((currentTranslation.confidence ?? 0) as number) * 100))
                  )}% confident
                </Text>
              </View>
            )}
          </Animated.View>
        )}

        {showInsights && currentTranslation && (
          <View style={styles.insightsSection}>
            <View style={styles.insightsHeader}>
              <Brain size={20} color="#8B5CF6" />
              <Text style={styles.insightsTitle}>AI Coach Insights</Text>
            </View>

            {currentTranslation.pronunciation && (
              <View style={styles.insightCard}>
                <View style={styles.insightCardHeader}>
                  <Volume2 size={16} color="#EC4899" />
                  <Text style={styles.insightCardTitle}>1. Sound (Advanced Pronunciation)</Text>
                  <TouchableOpacity
                    onPress={() => handleSpeakText(currentTranslation.pronunciation?.text ?? currentTranslation.translatedText, toLanguage, 'pronunciation')}
                    style={styles.pronunciationSpeakBtn}
                    testID="pronunciation-speak-btn"
                  >
                    <Volume2
                      size={18}
                      color={isSpeaking && speakingTextId === 'pronunciation' ? '#10B981' : '#EC4899'}
                      fill={isSpeaking && speakingTextId === 'pronunciation' ? '#10B981' : 'none'}
                    />
                  </TouchableOpacity>
                </View>
                <View style={styles.pronunciationContent}>
                  <View style={styles.pronunciationRow}>
                    <Text style={styles.pronunciationLabel}>Text:</Text>
                    <Text style={styles.pronunciationValue}>{currentTranslation.pronunciation.text}</Text>
                  </View>
                  {currentTranslation.pronunciation.phonetic && (
                    <View style={styles.pronunciationRow}>
                      <Text style={styles.pronunciationLabel}>IPA Transcription:</Text>
                      <Text style={styles.pronunciationPhonetic}>{currentTranslation.pronunciation.phonetic}</Text>
                    </View>
                  )}
                  {currentTranslation.pronunciation.breakdown && (
                    <View style={styles.pronunciationRow}>
                      <Text style={styles.pronunciationLabel}>Syllable Breakdown:</Text>
                      <Text style={styles.pronunciationBreakdown}>{currentTranslation.pronunciation.breakdown}</Text>
                    </View>
                  )}
                  {currentTranslation.pronunciation.stressPattern && (
                    <View style={styles.pronunciationRow}>
                      <Text style={styles.pronunciationLabel}>Stress & Intonation:</Text>
                      <Text style={styles.pronunciationBreakdown}>{currentTranslation.pronunciation.stressPattern}</Text>
                    </View>
                  )}
                  {currentTranslation.pronunciation.articulationNotes && (
                    <View style={styles.pronunciationRow}>
                      <Text style={styles.pronunciationLabel}>Articulation Notes:</Text>
                      <Text style={styles.insightCardText}>{currentTranslation.pronunciation.articulationNotes}</Text>
                    </View>
                  )}
                  {currentTranslation.pronunciation.commonMispronunciations && (
                    <View style={styles.pronunciationRow}>
                      <Text style={styles.pronunciationLabel}>Common Mispronunciations:</Text>
                      <Text style={styles.insightCardText}>{currentTranslation.pronunciation.commonMispronunciations}</Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {currentTranslation.meaning && (
              <View style={styles.insightCard}>
                <View style={styles.insightCardHeader}>
                  <Lightbulb size={16} color="#F59E0B" />
                  <Text style={styles.insightCardTitle}>2. Meaning (Translation Analysis)</Text>
                </View>
                {currentTranslation.meaning.literal && (
                  <View style={styles.meaningRow}>
                    <Text style={styles.meaningLabel}>Literal:</Text>
                    <Text style={styles.insightCardText}>{currentTranslation.meaning.literal}</Text>
                  </View>
                )}
                {currentTranslation.meaning.functional && (
                  <View style={styles.meaningRow}>
                    <Text style={styles.meaningLabel}>Functional:</Text>
                    <Text style={styles.insightCardText}>{currentTranslation.meaning.functional}</Text>
                  </View>
                )}
                {currentTranslation.meaning.idiomaticity && (
                  <View style={styles.meaningRow}>
                    <Text style={styles.meaningLabel}>Idiomaticity:</Text>
                    <Text style={styles.insightCardText}>{currentTranslation.meaning.idiomaticity}</Text>
                  </View>
                )}
                {currentTranslation.meaning.semanticRange && (
                  <View style={styles.meaningRow}>
                    <Text style={styles.meaningLabel}>Semantic Range:</Text>
                    <Text style={styles.insightCardText}>{currentTranslation.meaning.semanticRange}</Text>
                  </View>
                )}
                {currentTranslation.meaning.emotionalWeight && (
                  <View style={styles.meaningRow}>
                    <Text style={styles.meaningLabel}>Emotional Weight:</Text>
                    <Text style={styles.insightCardText}>{currentTranslation.meaning.emotionalWeight}</Text>
                  </View>
                )}
                {currentTranslation.meaning.contextualExamples && currentTranslation.meaning.contextualExamples.length > 0 && (
                  <View style={styles.meaningRow}>
                    <Text style={styles.meaningLabel}>Contextual Examples:</Text>
                    {currentTranslation.meaning.contextualExamples.map((ex, idx) => (
                      <Text key={idx} style={styles.exampleText}>• {ex}</Text>
                    ))}
                  </View>
                )}
              </View>
            )}

            {currentTranslation.structure && (
              <View style={styles.insightCard}>
                <View style={styles.insightCardHeader}>
                  <BookOpen size={16} color="#10B981" />
                  <Text style={styles.insightCardTitle}>3. Structure (Grammar & Syntax)</Text>
                </View>
                {currentTranslation.structure.wordOrder && (
                  <View style={styles.meaningRow}>
                    <Text style={styles.meaningLabel}>Word Order:</Text>
                    <Text style={styles.insightCardText}>{currentTranslation.structure.wordOrder}</Text>
                  </View>
                )}
                {currentTranslation.structure.morphology && (
                  <View style={styles.meaningRow}>
                    <Text style={styles.meaningLabel}>Morphology:</Text>
                    <Text style={styles.insightCardText}>{currentTranslation.structure.morphology}</Text>
                  </View>
                )}
                {currentTranslation.structure.agreement && (
                  <View style={styles.meaningRow}>
                    <Text style={styles.meaningLabel}>Agreement:</Text>
                    <Text style={styles.insightCardText}>{currentTranslation.structure.agreement}</Text>
                  </View>
                )}
                {currentTranslation.structure.auxiliaries && (
                  <View style={styles.meaningRow}>
                    <Text style={styles.meaningLabel}>Auxiliaries:</Text>
                    <Text style={styles.insightCardText}>{currentTranslation.structure.auxiliaries}</Text>
                  </View>
                )}
                {currentTranslation.structure.productiveForms && (
                  <View style={styles.meaningRow}>
                    <Text style={styles.meaningLabel}>Productive Forms:</Text>
                    <Text style={styles.insightCardText}>{currentTranslation.structure.productiveForms}</Text>
                  </View>
                )}
                {currentTranslation.structure.grammarTraps && (
                  <View style={styles.meaningRow}>
                    <Text style={styles.meaningLabel}>⚠️ Grammar Traps:</Text>
                    <Text style={styles.insightCardText}>{currentTranslation.structure.grammarTraps}</Text>
                  </View>
                )}
              </View>
            )}

            {currentTranslation.learningProcess && (
              <View style={styles.insightCard}>
                <View style={styles.insightCardHeader}>
                  <Brain size={16} color="#8B5CF6" />
                  <Text style={styles.insightCardTitle}>4. Learning Process</Text>
                </View>
                {currentTranslation.learningProcess.acquisitionSteps && currentTranslation.learningProcess.acquisitionSteps.length > 0 && (
                  <View style={styles.meaningRow}>
                    <Text style={styles.meaningLabel}>Acquisition Steps:</Text>
                    {currentTranslation.learningProcess.acquisitionSteps.map((step, idx) => (
                      <Text key={idx} style={styles.exampleText}>• {step}</Text>
                    ))}
                  </View>
                )}
                {currentTranslation.learningProcess.frequencyPriority && (
                  <View style={styles.meaningRow}>
                    <Text style={styles.meaningLabel}>Frequency Priority:</Text>
                    <Text style={styles.insightCardText}>{currentTranslation.learningProcess.frequencyPriority}</Text>
                  </View>
                )}
                {currentTranslation.learningProcess.immersionStrategies && currentTranslation.learningProcess.immersionStrategies.length > 0 && (
                  <View style={styles.meaningRow}>
                    <Text style={styles.meaningLabel}>Immersion Strategies:</Text>
                    {currentTranslation.learningProcess.immersionStrategies.map((strat, idx) => (
                      <Text key={idx} style={styles.exampleText}>• {strat}</Text>
                    ))}
                  </View>
                )}
              </View>
            )}

            {currentTranslation.usage && (
              <View style={styles.insightCard}>
                <View style={styles.insightCardHeader}>
                  <MessageCircle size={16} color="#06B6D4" />
                  <Text style={styles.insightCardTitle}>5. Usage (Context & Patterns)</Text>
                </View>
                {currentTranslation.usage.contexts && currentTranslation.usage.contexts.length > 0 && (
                  <View style={styles.meaningRow}>
                    <Text style={styles.meaningLabel}>Contexts:</Text>
                    {currentTranslation.usage.contexts.map((ctx, idx) => (
                      <Text key={idx} style={styles.exampleText}>• {ctx}</Text>
                    ))}
                  </View>
                )}
                {currentTranslation.usage.register && (
                  <View style={styles.meaningRow}>
                    <Text style={styles.meaningLabel}>Register:</Text>
                    <Text style={styles.insightCardText}>{currentTranslation.usage.register}</Text>
                  </View>
                )}
                {currentTranslation.usage.tone && (
                  <View style={styles.meaningRow}>
                    <Text style={styles.meaningLabel}>Tone:</Text>
                    <Text style={styles.insightCardText}>{currentTranslation.usage.tone}</Text>
                  </View>
                )}
                {currentTranslation.usage.collocations && currentTranslation.usage.collocations.length > 0 && (
                  <View style={styles.meaningRow}>
                    <Text style={styles.meaningLabel}>Collocations:</Text>
                    {currentTranslation.usage.collocations.map((col, idx) => (
                      <Text key={idx} style={styles.exampleText}>• {col}</Text>
                    ))}
                  </View>
                )}
                {currentTranslation.usage.pragmaticRole && (
                  <View style={styles.meaningRow}>
                    <Text style={styles.meaningLabel}>Pragmatic Role:</Text>
                    <Text style={styles.insightCardText}>{currentTranslation.usage.pragmaticRole}</Text>
                  </View>
                )}
                {currentTranslation.usage.appropriateness && (
                  <View style={styles.meaningRow}>
                    <Text style={styles.meaningLabel}>Appropriateness:</Text>
                    <Text style={styles.insightCardText}>{currentTranslation.usage.appropriateness}</Text>
                  </View>
                )}
              </View>
            )}

            {currentTranslation.cognitiveHooks && (
              <View style={styles.insightCard}>
                <View style={styles.insightCardHeader}>
                  <Sparkles size={16} color="#F59E0B" />
                  <Text style={styles.insightCardTitle}>6. Cognitive & Memory Hooks</Text>
                </View>
                {currentTranslation.cognitiveHooks.mnemonics && (
                  <View style={styles.meaningRow}>
                    <Text style={styles.meaningLabel}>Mnemonics:</Text>
                    <Text style={styles.insightCardText}>{currentTranslation.cognitiveHooks.mnemonics}</Text>
                  </View>
                )}
                {currentTranslation.cognitiveHooks.metaphors && (
                  <View style={styles.meaningRow}>
                    <Text style={styles.meaningLabel}>Metaphors:</Text>
                    <Text style={styles.insightCardText}>{currentTranslation.cognitiveHooks.metaphors}</Text>
                  </View>
                )}
                {currentTranslation.cognitiveHooks.soundAssociations && (
                  <View style={styles.meaningRow}>
                    <Text style={styles.meaningLabel}>Sound Associations:</Text>
                    <Text style={styles.insightCardText}>{currentTranslation.cognitiveHooks.soundAssociations}</Text>
                  </View>
                )}
                {currentTranslation.cognitiveHooks.vividImagery && (
                  <View style={styles.meaningRow}>
                    <Text style={styles.meaningLabel}>Vivid Imagery:</Text>
                    <Text style={styles.insightCardText}>{currentTranslation.cognitiveHooks.vividImagery}</Text>
                  </View>
                )}
              </View>
            )}

            {currentTranslation.culture && (
              <View style={styles.insightCard}>
                <View style={styles.insightCardHeader}>
                  <Globe size={16} color="#10B981" />
                  <Text style={styles.insightCardTitle}>7. Culture / Philosophy / Regional Dialects</Text>
                </View>
                {currentTranslation.culture.symbolism && (
                  <View style={styles.meaningRow}>
                    <Text style={styles.meaningLabel}>Symbolism:</Text>
                    <Text style={styles.insightCardText}>{currentTranslation.culture.symbolism}</Text>
                  </View>
                )}
                {currentTranslation.culture.worldview && (
                  <View style={styles.meaningRow}>
                    <Text style={styles.meaningLabel}>Worldview:</Text>
                    <Text style={styles.insightCardText}>{currentTranslation.culture.worldview}</Text>
                  </View>
                )}
                {currentTranslation.culture.politenessSystem && (
                  <View style={styles.meaningRow}>
                    <Text style={styles.meaningLabel}>Politeness System:</Text>
                    <Text style={styles.insightCardText}>{currentTranslation.culture.politenessSystem}</Text>
                  </View>
                )}
                {currentTranslation.culture.identityMarkers && (
                  <View style={styles.meaningRow}>
                    <Text style={styles.meaningLabel}>Identity Markers:</Text>
                    <Text style={styles.insightCardText}>{currentTranslation.culture.identityMarkers}</Text>
                  </View>
                )}
                {currentTranslation.culture.historicalSignificance && (
                  <View style={styles.meaningRow}>
                    <Text style={styles.meaningLabel}>Historical Significance:</Text>
                    <Text style={styles.insightCardText}>{currentTranslation.culture.historicalSignificance}</Text>
                  </View>
                )}
                {currentTranslation.culture.regionalVariations && currentTranslation.culture.regionalVariations.length > 0 && (
                  <View style={styles.meaningRow}>
                    <Text style={styles.meaningLabel}>Regional Variations:</Text>
                    {currentTranslation.culture.regionalVariations.map((variant, idx) => (
                      <Text key={idx} style={styles.exampleText}>• {variant}</Text>
                    ))}
                  </View>
                )}
              </View>
            )}

            {currentTranslation.crossLanguageInterference && (
              <View style={styles.insightCard}>
                <View style={styles.insightCardHeader}>
                  <Award size={16} color="#EF4444" />
                  <Text style={styles.insightCardTitle}>8. Cross-Language Interference Notes</Text>
                </View>
                {currentTranslation.crossLanguageInterference.overLiteralTranslations && currentTranslation.crossLanguageInterference.overLiteralTranslations.length > 0 && (
                  <View style={styles.meaningRow}>
                    <Text style={styles.meaningLabel}>Over-Literal Translations:</Text>
                    {currentTranslation.crossLanguageInterference.overLiteralTranslations.map((item, idx) => (
                      <Text key={idx} style={styles.exampleText}>• {item}</Text>
                    ))}
                  </View>
                )}
                {currentTranslation.crossLanguageInterference.falseFriends && currentTranslation.crossLanguageInterference.falseFriends.length > 0 && (
                  <View style={styles.meaningRow}>
                    <Text style={styles.meaningLabel}>False Friends:</Text>
                    {currentTranslation.crossLanguageInterference.falseFriends.map((item, idx) => (
                      <Text key={idx} style={styles.exampleText}>• {item}</Text>
                    ))}
                  </View>
                )}
                {currentTranslation.crossLanguageInterference.l1TransferErrors && currentTranslation.crossLanguageInterference.l1TransferErrors.length > 0 && (
                  <View style={styles.meaningRow}>
                    <Text style={styles.meaningLabel}>L1 Transfer Errors:</Text>
                    {currentTranslation.crossLanguageInterference.l1TransferErrors.map((item, idx) => (
                      <Text key={idx} style={styles.exampleText}>• {item}</Text>
                    ))}
                  </View>
                )}
                {currentTranslation.crossLanguageInterference.registerMismatches && currentTranslation.crossLanguageInterference.registerMismatches.length > 0 && (
                  <View style={styles.meaningRow}>
                    <Text style={styles.meaningLabel}>Register Mismatches:</Text>
                    {currentTranslation.crossLanguageInterference.registerMismatches.map((item, idx) => (
                      <Text key={idx} style={styles.exampleText}>• {item}</Text>
                    ))}
                  </View>
                )}
              </View>
            )}

            {currentTranslation.recap && (
              <View style={styles.insightCard}>
                <View style={styles.insightCardHeader}>
                  <Lightbulb size={16} color="#8B5CF6" />
                  <Text style={styles.insightCardTitle}>9. Recap & Tips</Text>
                </View>
                {currentTranslation.recap.keySummary && (
                  <View style={styles.meaningRow}>
                    <Text style={styles.meaningLabel}>Key Summary:</Text>
                    <Text style={styles.insightCardText}>{currentTranslation.recap.keySummary}</Text>
                  </View>
                )}
                {currentTranslation.recap.dos && currentTranslation.recap.dos.length > 0 && (
                  <View style={styles.meaningRow}>
                    <Text style={styles.meaningLabel}>✅ Dos:</Text>
                    {currentTranslation.recap.dos.map((item, idx) => (
                      <Text key={idx} style={styles.exampleText}>• {item}</Text>
                    ))}
                  </View>
                )}
                {currentTranslation.recap.donts && currentTranslation.recap.donts.length > 0 && (
                  <View style={styles.meaningRow}>
                    <Text style={styles.meaningLabel}>❌ Donts:</Text>
                    {currentTranslation.recap.donts.map((item, idx) => (
                      <Text key={idx} style={styles.exampleText}>• {item}</Text>
                    ))}
                  </View>
                )}
                {currentTranslation.recap.reinforcement && (
                  <View style={styles.meaningRow}>
                    <Text style={styles.meaningLabel}>Reinforcement:</Text>
                    <Text style={styles.insightCardText}>{currentTranslation.recap.reinforcement}</Text>
                  </View>
                )}
              </View>
            )}

            {currentTranslation.alternativeTranslationsData && (
              <View style={styles.insightCard}>
                <View style={styles.insightCardHeader}>
                  <MessageCircle size={16} color="#06B6D4" />
                  <Text style={styles.insightCardTitle}>10. Alternative Translations</Text>
                </View>
                {currentTranslation.alternativeTranslationsData.neutral && (
                  <TouchableOpacity
                    style={styles.alternativeItem}
                    onPress={() => {
                      setSourceText(currentTranslation.alternativeTranslationsData?.neutral ?? '');
                      try { sourceInputRef.current?.focus?.(); } catch (e) { console.log('focus err', e); }
                    }}
                    onLongPress={() => {
                      setTranslatedText(currentTranslation.alternativeTranslationsData?.neutral ?? '');
                    }}
                  >
                    <Text style={styles.meaningLabel}>Neutral:</Text>
                    <Text style={styles.alternativeText}>{currentTranslation.alternativeTranslationsData.neutral}</Text>
                  </TouchableOpacity>
                )}
                {currentTranslation.alternativeTranslationsData.formal && (
                  <TouchableOpacity
                    style={styles.alternativeItem}
                    onPress={() => {
                      setSourceText(currentTranslation.alternativeTranslationsData?.formal ?? '');
                      try { sourceInputRef.current?.focus?.(); } catch (e) { console.log('focus err', e); }
                    }}
                    onLongPress={() => {
                      setTranslatedText(currentTranslation.alternativeTranslationsData?.formal ?? '');
                    }}
                  >
                    <Text style={styles.meaningLabel}>Formal:</Text>
                    <Text style={styles.alternativeText}>{currentTranslation.alternativeTranslationsData.formal}</Text>
                  </TouchableOpacity>
                )}
                {currentTranslation.alternativeTranslationsData.colloquial && (
                  <TouchableOpacity
                    style={styles.alternativeItem}
                    onPress={() => {
                      setSourceText(currentTranslation.alternativeTranslationsData?.colloquial ?? '');
                      try { sourceInputRef.current?.focus?.(); } catch (e) { console.log('focus err', e); }
                    }}
                    onLongPress={() => {
                      setTranslatedText(currentTranslation.alternativeTranslationsData?.colloquial ?? '');
                    }}
                  >
                    <Text style={styles.meaningLabel}>Colloquial/Slang:</Text>
                    <Text style={styles.alternativeText}>{currentTranslation.alternativeTranslationsData.colloquial}</Text>
                  </TouchableOpacity>
                )}
                {currentTranslation.alternativeTranslationsData.situationalNotes && (
                  <View style={styles.meaningRow}>
                    <Text style={styles.meaningLabel}>Situational Notes:</Text>
                    <Text style={styles.insightCardText}>{currentTranslation.alternativeTranslationsData.situationalNotes}</Text>
                  </View>
                )}
              </View>
            )}

            {currentTranslation.difficulty && (
              <View style={styles.difficultyBadge}>
                <Text
                  style={[
                    styles.difficultyText,
                    currentTranslation.difficulty === 'beginner' && styles.difficultyBeginner,
                    currentTranslation.difficulty === 'intermediate' && styles.difficultyIntermediate,
                    currentTranslation.difficulty === 'advanced' && styles.difficultyAdvanced,
                  ]}
                >
                  {currentTranslation.difficulty.toUpperCase()} LEVEL
                </Text>
              </View>
            )}
          </View>
        )}

        {translations.length > 0 && (
          <View style={styles.historySection} testID="history-section">
            <Text style={styles.historyTitle}>Recent Translations</Text>
            {translations.slice(0, 3).map(translation => {
              const fromLangData = LANGUAGES.find(l => l.code === translation.fromLanguage);
              const toLangData = LANGUAGES.find(l => l.code === translation.toLanguage);

              return (
                <TouchableOpacity
                  key={translation.id}
                  style={styles.historyItem}
                  onPress={() => {
                    setSourceText(translation.sourceText);
                    setTranslatedText(translation.translatedText);
                    setFromLanguage(translation.fromLanguage);
                    setToLanguage(translation.toLanguage);
                  }}
                >
                  <View style={styles.historyItemHeader}>
                    <Text style={styles.historyLanguages}>
                      {fromLangData?.flag} → {toLangData?.flag}
                    </Text>
                    <TouchableOpacity onPress={() => toggleFavorite(translation.id)}>
                      <Star
                        size={16}
                        color={translation.isFavorite ? '#F59E0B' : '#9CA3AF'}
                        fill={translation.isFavorite ? '#F59E0B' : 'none'}
                      />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.historySourceText} numberOfLines={1}>
                    {translation.sourceText}
                  </Text>
                  <Text style={styles.historyTranslatedText} numberOfLines={1}>
                    {translation.translatedText}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      <LanguageSelector
        languages={LANGUAGES}
        selectedCode={fromLanguage}
        onSelect={setFromLanguage}
        visible={showFromLanguages}
        onClose={() => setShowFromLanguages(false)}
      />

      <LanguageSelector
        languages={LANGUAGES}
        selectedCode={toLanguage}
        onSelect={setToLanguage}
        visible={showToLanguages}
        onClose={() => setShowToLanguages(false)}
      />

      <UpgradeModal
        visible={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        onUpgrade={handleUpgrade}
        reason="feature"
        testID="upgrade-modal"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  remainingText: {
    fontSize: 12,
    color: '#6B7280',
    marginRight: 12,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  languageSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flex: 1,
  },
  languageFlag: {
    fontSize: 20,
    marginRight: 8,
  },
  languageText: {
    fontSize: 16,
    color: '#1F2937',
    flex: 1,
  },
  swapButton: {
    backgroundColor: '#EBF4FF',
    padding: 12,
    borderRadius: 12,
    marginHorizontal: 12,
  },
  inputSection: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  textInput: {
    fontSize: 16,
    color: '#1F2937',
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  inputFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputFooterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  inputFooterRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inputHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerActionBtn: {
    padding: 4,
  },
  footerActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
  },
  footerActionText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  sttButton: {
    backgroundColor: '#EBF4FF',
    padding: 10,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sttButtonRecording: {
    backgroundColor: '#FEE2E2',
  },
  characterCount: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  translateButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  translateButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  outputSection: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  outputHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  outputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  outputActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    marginLeft: 16,
  },
  outputText: {
    minHeight: 60,
    justifyContent: 'center',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#6B7280',
  },
  translatedText: {
    fontSize: 16,
    color: '#1F2937',
    lineHeight: 24,
  },
  historySection: {
    marginTop: 20,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  historyItem: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  historyItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyLanguages: {
    fontSize: 14,
    color: '#6B7280',
  },
  historySourceText: {
    fontSize: 14,
    color: '#1F2937',
    marginBottom: 4,
  },
  historyTranslatedText: {
    fontSize: 14,
    color: '#6B7280',
  },
  languageSelectorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  languageSelectorModal: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
    overflow: 'hidden',
  },
  languageSelectorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  languageSelectorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  languageList: {
    maxHeight: 400,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  selectedLanguageItem: {
    backgroundColor: '#EBF4FF',
  },
  languageName: {
    fontSize: 16,
    color: '#1F2937',
    flex: 1,
    marginLeft: 12,
  },
  languageNative: {
    fontSize: 14,
    color: '#6B7280',
  },
  languageDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  languageDisplayItem: {
    alignItems: 'center',
    flex: 1,
  },
  languageDisplayLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  languageDisplayContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  languageDisplayFlag: {
    fontSize: 24,
    marginRight: 8,
  },
  languageDisplayName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  confidenceSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  confidenceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  confidenceLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
    marginLeft: 6,
  },
  confidenceBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    marginBottom: 4,
  },
  confidenceFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 3,
  },
  confidenceText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  insightsSection: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  insightsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  insightsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8B5CF6',
    marginLeft: 8,
  },
  insightCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  insightCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  insightCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 6,
  },
  insightCardText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  alternativeItem: {
    paddingVertical: 4,
  },
  alternativeText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  difficultyBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 8,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  difficultyBeginner: {
    backgroundColor: '#D1FAE5',
    color: '#065F46',
  },
  difficultyIntermediate: {
    backgroundColor: '#FEF3C7',
    color: '#92400E',
  },
  difficultyAdvanced: {
    backgroundColor: '#FEE2E2',
    color: '#991B1B',
  },
  suggestionsBlock: {
    marginBottom: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  suggestionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  suggestionsTitle: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 6,
    flex: 1,
  },
  suggestionsRefresh: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  suggestionsRefreshText: {
    fontSize: 12,
    color: '#374151',
  },
  suggestionsRow: {
    flexDirection: 'row',
  },
  suggestionPill: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  suggestionPillSelected: {
    backgroundColor: '#EEF2FF',
    borderColor: '#A78BFA',
  },
  suggestionText: {
    fontSize: 14,
    color: '#374151',
  },
  suggestionTextSelected: {
    color: '#4C1D95',
    fontWeight: '600' as const,
  },
  bulkActionsPill: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    marginRight: 8,
    justifyContent: 'center',
  },
  bulkCountText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 6,
  },
  bulkButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bulkBtn: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    marginRight: 8,
  },
  bulkBtnText: {
    fontSize: 12,
    color: '#111827',
  },
  bulkTranslateBtn: {
    backgroundColor: '#3B82F6',
  },
  bulkTranslateBtnText: {
    color: 'white',
    fontWeight: '600' as const,
  },
  bulkClearBtn: {
    marginLeft: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  bulkClearText: {
    fontSize: 12,
    color: '#6B7280',
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  tipBullet: {
    fontSize: 14,
    marginRight: 8,
    marginTop: 2,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  meaningRow: {
    marginBottom: 12,
  },
  meaningLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  exampleText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginLeft: 8,
    marginTop: 2,
  },
  pronunciationSpeakBtn: {
    marginLeft: 'auto',
    padding: 4,
  },
  pronunciationContent: {
    marginTop: 8,
  },
  pronunciationRow: {
    marginBottom: 12,
  },
  pronunciationLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  pronunciationValue: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  pronunciationPhonetic: {
    fontSize: 15,
    color: '#EC4899',
    fontFamily: 'monospace',
    fontWeight: '500',
  },
  pronunciationBreakdown: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 22,
    fontStyle: 'italic',
  },
});