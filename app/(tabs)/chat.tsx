import React, { useState, useRef, useEffect } from 'react';
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
import { Send, Settings } from 'lucide-react-native';
import { useChat } from '@/hooks/chat-store';
import { useUser } from '@/hooks/user-store';
import { LANGUAGES } from '@/constants/languages';
import UpgradeModal from '@/components/UpgradeModal';
import { router } from 'expo-router';

export default function ChatScreen() {
  const [inputText, setInputText] = useState<string>('');
  const [showUpgradeModal, setShowUpgradeModal] = useState<boolean>(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const { messages, isLoading, sendMessage } = useChat();
  const { user, canSendMessage, upgradeToPremium } = useUser();

  const selectedLanguage = LANGUAGES.find(lang => lang.code === user.selectedLanguage);

  useEffect(() => {
    if (messages.length > 0) {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim()) return;

    if (!canSendMessage()) {
      setShowUpgradeModal(true);
      return;
    }

    await sendMessage(inputText);
    setInputText('');
  };

  const handleUpgrade = () => {
    setShowUpgradeModal(false);
    upgradeToPremium();
    Alert.alert('Success!', 'You now have Premium access with unlimited chats!');
  };

  const getRemainingMessages = () => {
    if (user.isPremium) return null;
    const today = new Date().toDateString();
    const isNewDay = user.stats.lastMessageDate !== today;
    const used = isNewDay ? 0 : user.stats.messagesUsedToday;
    return 5 - used;
  };

  const remainingMessages = getRemainingMessages();

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
          />
          <TouchableOpacity
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim() || isLoading}
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
});