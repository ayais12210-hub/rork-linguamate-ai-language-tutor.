import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Send, Settings, Sparkles, Languages, Copy, Volume2 } from 'lucide-react-native';
import { useChat } from '@/hooks/chat-store';
import { useUser } from '@/hooks/user-store';
import { LANGUAGES } from '@/constants/languages';
import UpgradeModal from '@/components/UpgradeModal';
import { router } from 'expo-router';

interface AITranslationResponseShape {
  translation?: string;
  explanation?: string;
  culturalContext?: string;
  grammarInsights?: string;
  alternativeTranslations?: unknown;
  alternatives?: unknown;
  difficulty?: string;
  confidence?: unknown;
  coachingTips?: string;
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
    console.log('[Chat] stripJSONCodeFences error', e);
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
    console.log('[Chat] JSON parse failed, falling back to plain text', e);
    return { translation: raw } as AITranslationResponseShape;
  }
}

export default function ChatScreen() {
  const [inputText, setInputText] = useState<string>('');
  const [showUpgradeModal, setShowUpgradeModal] = useState<boolean>(false);
  const [isTranslatingDraft, setIsTranslatingDraft] = useState<boolean>(false);
  const [draftTranslation, setDraftTranslation] = useState<AITranslationResponseShape | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const { messages, isLoading, sendMessage, suggestions, refreshSuggestions } = useChat();
  const { user, canSendMessage, upgradeToPremium } = useUser();

  const selectedLanguage = LANGUAGES.find(lang => lang.code === user.selectedLanguage);

  const [selectedSuggestions, setSelectedSuggestions] = useState<string[]>([]);

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

  useEffect(() => {
    if (messages.length > 0) {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages]);

  useEffect(() => {
    if (messages.length === 0) {
      refreshSuggestions();
    }
  }, [messages.length, refreshSuggestions]);

  const handleSend = async () => {
    if (!inputText.trim()) return;

    if (!canSendMessage()) {
      setShowUpgradeModal(true);
      return;
    }

    await sendMessage(inputText);
    setInputText('');
    setDraftTranslation(null);
  };

  const handleUpgrade = () => {
    setShowUpgradeModal(false);
    upgradeToPremium();
    Alert.alert('Success!', 'You now have Premium access with unlimited chats!');
  };

  const getRemainingMessages = () => {
    if (user.isPremium) return null;
    const today = new Date().toDateString();
    const isNewDay = user.stats?.lastMessageDate !== today;
    const used = isNewDay ? 0 : (user.stats?.messagesUsedToday ?? 0);
    return 5 - used;
  };

  const remainingMessages = getRemainingMessages();

  const handleTranslateDraft = useCallback(async () => {
    const text = (inputText ?? '').trim();
    if (!text) return;
    setIsTranslatingDraft(true);
    setDraftTranslation(null);
    try {
      const selectedLang = LANGUAGES.find(lang => lang.code === user.selectedLanguage)?.name ?? 'Target Language';
      const nativeLang = LANGUAGES.find(lang => lang.code === user.nativeLanguage)?.name ?? 'Native Language';

      const response = await fetch('https://toolkit.rork.com/text/llm/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: `You are an elite multilingual AI coach and professional translator with deep expertise in ${nativeLang} and ${selectedLang}.
Return ONLY JSON. Fields: translation, explanation, culturalContext, grammarInsights, alternativeTranslations (array of 3-6), difficulty, confidence, coachingTips. Keep explanations concise for chat UI.`,
            },
            { role: 'user', content: text },
          ],
        }),
      });
      const data = await response.json();
      const normalized = normalizeAIResponse(String(data?.completion ?? ''));
      setDraftTranslation(normalized);
    } catch (e) {
      console.log('Draft translate failed', e);
      Alert.alert('Translate failed', 'Could not analyze your draft. Try again.');
    } finally {
      setIsTranslatingDraft(false);
    }
  }, [inputText, user.selectedLanguage, user.nativeLanguage]);

  const insertAltIntoInput = useCallback((alt: string) => {
    setInputText(prev => {
      const has = (prev ?? '').trim().length > 0;
      const sep = has ? ' ' : '';
      return `${prev ?? ''}${sep}${alt}`;
    });
  }, []);

  const replaceInputWithTranslation = useCallback(() => {
    const t = draftTranslation?.translation?.toString() ?? '';
    if (!t) return;
    setInputText(t);
  }, [draftTranslation]);

  const handleSuggestionPress = useCallback(async (text: string) => {
    if (!text) return;
    setInputText(prev => {
      const hasContent = (prev ?? '').trim().length > 0;
      const separator = hasContent ? ' ' : '';
      return `${prev ?? ''}${separator}${text}`;
    });
    toggleSuggestion(text);
  }, [toggleSuggestion]);

  const handleSuggestionSend = useCallback(async (text: string) => {
    if (!text) return;
    if (!canSendMessage()) {
      setShowUpgradeModal(true);
      return;
    }
    await sendMessage(text);
  }, [canSendMessage, sendMessage]);

  const handleBulkInsert = useCallback(() => {
    if (combinedSelectedText.trim().length === 0) return;
    setInputText(prev => {
      const base = prev?.trim().length ? `${prev} ` : '';
      return `${base}${combinedSelectedText}`;
    });
  }, [combinedSelectedText]);

  const handleBulkSend = useCallback(async () => {
    if (combinedSelectedText.trim().length === 0) return;
    if (!canSendMessage()) {
      setShowUpgradeModal(true);
      return;
    }
    await sendMessage(combinedSelectedText);
    clearSelectedSuggestions();
  }, [combinedSelectedText, canSendMessage, sendMessage, clearSelectedSuggestions]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>
            {selectedLanguage ? `${selectedLanguage.flag} ${selectedLanguage.name}` : 'LinguaMate'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {user.isPremium ? 'Premium' : `${remainingMessages} messages left`}
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.settingsButton}
          onPress={() => router.push('/settings')}
        >
          <Settings size={24} color="#6B7280" />
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        testID="chatMessagesScroll"
      >
        {messages.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>Start practicing!</Text>
            <Text style={styles.emptyStateText}>
              Send a message to begin your conversation with your AI tutor.
            </Text>
          </View>
        )}

        {messages.map((message) => (
          <View
            key={message.id}
            style={[
              styles.messageContainer,
              message.isUser ? styles.userMessageContainer : styles.aiMessageContainer,
            ]}
          >
            <View
              style={[
                styles.messageBubble,
                message.isUser ? styles.userMessageBubble : styles.aiMessageBubble,
              ]}
            >
              <Text
                style={[
                  styles.messageText,
                  message.isUser ? styles.userMessageText : styles.aiMessageText,
                ]}
              >
                {message.text}
              </Text>
              
              {!message.isUser && message.nativeTranslation && (
                <View style={styles.translationContainer}>
                  <Text style={styles.translationLabel}>Translation:</Text>
                  <Text style={styles.translationText}>
                    {message.nativeTranslation}
                  </Text>
                </View>
              )}
              
              {!message.isUser && message.context && (
                <View style={styles.contextContainer}>
                  <Text style={styles.contextLabel}>💡 Context:</Text>
                  <Text style={styles.contextText}>
                    {message.context}
                  </Text>
                </View>
              )}
            </View>
          </View>
        ))}

        {isLoading && (
          <View style={styles.aiMessageContainer}>
            <View style={styles.aiMessageBubble}>
              <Text style={styles.loadingText}>Thinking...</Text>
            </View>
          </View>
        )}

        {suggestions.length > 0 && (
          <View style={styles.suggestionsBlock}>
            <View style={styles.suggestionsHeader}>
              <Sparkles size={16} color="#8B5CF6" />
              <Text style={styles.suggestionsTitle}>Suggestions</Text>
              <TouchableOpacity onPress={refreshSuggestions} style={styles.suggestionsRefresh} accessibilityLabel="Refresh suggestions" testID="refreshSuggestionsBtn">
                <Text style={styles.suggestionsRefreshText}>Refresh</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestionsRow} testID="suggestionsRow">
              {suggestions.map((s, idx) => {
                const selected = isSuggestionSelected(s);
                return (
                  <View key={`${s}-${idx}`} style={[styles.suggestionPill, selected ? styles.suggestionPillSelected : undefined]}>
                    <TouchableOpacity
                      onPress={() => handleSuggestionPress(s)}
                      onLongPress={() => handleSuggestionSend(s)}
                      accessibilityLabel={`Suggestion ${idx+1}`}
                      testID={`suggestion-${idx}`}
                    >
                      <Text style={[styles.suggestionText, selected ? styles.suggestionTextSelected : undefined]}>{s}</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
              {selectedSuggestions.length > 0 && (
                <View style={styles.bulkActionsPill} testID="bulkActionsPill">
                  <Text style={styles.bulkCountText}>{selectedSuggestions.length} selected</Text>
                  <View style={styles.bulkButtonsRow}>
                    <TouchableOpacity onPress={handleBulkInsert} style={styles.bulkBtn} accessibilityLabel="Insert selected" testID="bulkInsertBtn">
                      <Text style={styles.bulkBtnText}>Insert</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleBulkSend} style={[styles.bulkBtn, styles.bulkSendBtn]} accessibilityLabel="Send selected" testID="bulkSendBtn">
                      <Text style={[styles.bulkBtnText, styles.bulkSendBtnText]}>Send</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={clearSelectedSuggestions} style={styles.bulkClearBtn} accessibilityLabel="Clear selected" testID="bulkClearBtn">
                      <Text style={styles.bulkClearText}>Clear</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        )}

        {(draftTranslation || isTranslatingDraft) && (
          <View style={styles.translatorCard} testID="translatorCard">
            <View style={styles.translatorHeader}>
              <View style={styles.translatorHeaderLeft}>
                <Languages size={16} color="#2563EB" />
                <Text style={styles.translatorTitle}>Coach Translator</Text>
              </View>
              <View style={styles.translatorHeaderRight}>
                <TouchableOpacity
                  onPress={replaceInputWithTranslation}
                  disabled={!draftTranslation?.translation}
                  style={[styles.translatorActionBtn, !draftTranslation?.translation ? styles.translatorActionBtnDisabled : undefined]}
                  testID="translatorReplaceBtn"
                >
                  <Text style={styles.translatorActionText}>Use</Text>
                </TouchableOpacity>
              </View>
            </View>
            {isTranslatingDraft ? (
              <Text style={styles.loadingText}>Analyzing...</Text>
            ) : (
              <View>
                {!!draftTranslation?.translation && (
                  <View style={styles.translatorSection}>
                    <Text style={styles.translatorLabel}>Translation</Text>
                    <Text style={styles.translatorText}>{draftTranslation.translation}</Text>
                  </View>
                )}
                {!!draftTranslation?.alternativeTranslations && toStringArray(draftTranslation.alternativeTranslations).length > 0 && (
                  <View style={styles.translatorSection}>
                    <Text style={styles.translatorLabel}>Alternatives</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.altRow}>
                      {toStringArray(draftTranslation.alternativeTranslations).map((alt, idx) => (
                        <TouchableOpacity key={`alt-${idx}`} style={styles.altPill} onPress={() => insertAltIntoInput(alt)} testID={`altPill-${idx}`}>
                          <Text style={styles.altPillText}>{alt}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
                {!!draftTranslation?.explanation && (
                  <View style={styles.translatorSection}>
                    <Text style={styles.translatorLabel}>Why this works</Text>
                    <Text style={styles.translatorSubText}>{draftTranslation.explanation}</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {!user.isPremium && (
        <View style={styles.adBanner}>
          <Text style={styles.adText}>📱 Ad Banner Placeholder</Text>
        </View>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inputContainer}
      >
        <View style={styles.inputRow}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder={`Type in ${selectedLanguage?.name || 'your target language'}...`}
            placeholderTextColor="#9CA3AF"
            multiline
            maxLength={500}
            testID="chatInput"
          />
          <TouchableOpacity
            style={[styles.toolbarBtn, isTranslatingDraft && styles.toolbarBtnDisabled]}
            onPress={handleTranslateDraft}
            disabled={isTranslatingDraft || !inputText.trim()}
            testID="translateDraftBtn"
          >
            <Languages size={18} color={isTranslatingDraft || !inputText.trim() ? '#9CA3AF' : '#2563EB'} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim() || isLoading}
            testID="sendButton"
          >
            <Send size={20} color={!inputText.trim() ? '#9CA3AF' : 'white'} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <UpgradeModal
        visible={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        onUpgrade={handleUpgrade}
        reason="limit"
      />
    </SafeAreaView>
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
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  settingsButton: {
    padding: 8,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  messageContainer: {
    marginBottom: 16,
  },
  userMessageContainer: {
    alignItems: 'flex-end',
  },
  aiMessageContainer: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  userMessageBubble: {
    backgroundColor: '#3B82F6',
    borderBottomRightRadius: 4,
  },
  aiMessageBubble: {
    backgroundColor: 'white',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userMessageText: {
    color: 'white',
  },
  aiMessageText: {
    color: '#1F2937',
  },
  loadingText: {
    color: '#6B7280',
    fontStyle: 'italic',
  },
  adBanner: {
    backgroundColor: '#FEF3C7',
    paddingVertical: 12,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  adText: {
    color: '#92400E',
    fontSize: 14,
    fontWeight: '500',
  },
  suggestionsBlock: {
    marginBottom: 8,
  },
  suggestionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
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
  bulkSendBtn: {
    backgroundColor: '#3B82F6',
  },
  bulkSendBtnText: {
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
  inputContainer: {
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    fontSize: 16,
    maxHeight: 100,
    color: '#1F2937',
  },
  toolbarBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  toolbarBtnDisabled: {
    opacity: 0.6,
  },
  sendButton: {
    backgroundColor: '#3B82F6',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  translationContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(107, 114, 128, 0.2)',
  },
  translationLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  translationText: {
    fontSize: 14,
    color: '#4B5563',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  contextContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(107, 114, 128, 0.2)',
  },
  contextLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  contextText: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  translatorCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  translatorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  translatorHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  translatorTitle: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  translatorHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  translatorActionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#EEF2FF',
  },
  translatorActionBtnDisabled: {
    backgroundColor: '#F3F4F6',
  },
  translatorActionText: {
    fontSize: 12,
    color: '#3730A3',
    fontWeight: '600',
  },
  translatorSection: {
    marginTop: 6,
  },
  translatorLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  translatorText: {
    fontSize: 14,
    color: '#111827',
    lineHeight: 20,
  },
  translatorSubText: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
  },
  altRow: {
    flexDirection: 'row',
  },
  altPill: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  altPillText: {
    fontSize: 13,
    color: '#111827',
  },
});