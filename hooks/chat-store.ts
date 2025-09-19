import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChatMessage, Correction } from '@/types/user';
import { useUser } from './user-store';
import { LANGUAGES } from '@/constants/languages';

const CHAT_STORAGE_KEY = 'linguamate_chat_history';

export const [ChatProvider, useChat] = createContextHook(() => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { user, incrementMessageCount } = useUser();

  useEffect(() => {
    loadChatHistory();
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      saveChatHistory();
    }
  }, [messages]);

  const loadChatHistory = async () => {
    try {
      const stored = await AsyncStorage.getItem(CHAT_STORAGE_KEY);
      if (stored) {
        const parsedMessages = JSON.parse(stored);
        setMessages(parsedMessages);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  const saveChatHistory = async () => {
    try {
      await AsyncStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
    } catch (error) {
      console.error('Error saving chat history:', error);
    }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: text.trim(),
      isUser: true,
      timestamp: new Date().toISOString(),
      language: user.selectedLanguage,
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const targetLanguage = getLanguageName(user.selectedLanguage);
      const nativeLanguage = getLanguageName(user.nativeLanguage);
      
      // Build conversation context from recent messages
      const recentMessages = messages.slice(-10); // Last 10 messages for context
      const conversationHistory = recentMessages.map(msg => ({
        role: msg.isUser ? 'user' : 'assistant',
        content: msg.text
      }));

      // Create enhanced system prompt with user context
      const systemPrompt = createPersonalizedSystemPrompt(user, targetLanguage, nativeLanguage);

      const response = await fetch('https://toolkit.rork.com/text/llm/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: systemPrompt,
            },
            ...conversationHistory,
            {
              role: 'user',
              content: text,
            },
          ],
        }),
      });

      const data = await response.json();
      
      if (data.completion) {
        // Parse the bilingual response
        const parsedResponse = parseBilingualResponse(data.completion);
        
        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          text: parsedResponse.mainText,
          isUser: false,
          timestamp: new Date().toISOString(),
          language: user.selectedLanguage,
          nativeTranslation: parsedResponse.nativeTranslation,
          targetTranslation: parsedResponse.targetTranslation,
          context: parsedResponse.context,
        };

        setMessages(prev => [...prev, aiMessage]);
        incrementMessageCount();
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: 'Sorry, I had trouble understanding. Please try again.',
        isUser: false,
        timestamp: new Date().toISOString(),
        language: user.selectedLanguage,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = async () => {
    setMessages([]);
    try {
      await AsyncStorage.removeItem(CHAT_STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing chat history:', error);
    }
  };

  const createPersonalizedSystemPrompt = (user: any, targetLanguage: string, nativeLanguage: string): string => {
    const goals = user.learningGoals.length > 0 ? user.learningGoals.join(', ') : 'general language learning';
    const interests = user.interests.length > 0 ? user.interests.join(', ') : 'various topics';
    const topics = user.preferredTopics.length > 0 ? user.preferredTopics.join(', ') : 'everyday conversations';
    
    return `You are an expert AI language coach helping a ${user.proficiencyLevel} level student learn ${targetLanguage}. The student's native language is ${nativeLanguage}.

Student Profile:
- Learning Goals: ${goals}
- Interests: ${interests}
- Preferred Topics: ${topics}
- Daily Goal: ${user.dailyGoalMinutes} minutes of practice
- Proficiency Level: ${user.proficiencyLevel}

Your Response Format:
ALWAYS respond with BOTH languages in this exact format:

🎯 [Your response in ${targetLanguage}]

💬 [Translation in ${nativeLanguage}]

📝 [Brief explanation or context in ${nativeLanguage} if needed]

Guidelines:
1. Adapt your ${targetLanguage} to the student's ${user.proficiencyLevel} level
2. Be encouraging and supportive
3. Gently correct mistakes and explain why
4. Incorporate their interests (${interests}) when possible
5. Focus on topics they prefer (${topics})
6. Keep conversations natural and engaging
7. Provide cultural context when relevant
8. Use simple vocabulary for beginners, more complex for advanced
9. Always include both the target language response and native language translation
10. Remember previous conversations to build continuity

If the student makes an error, gently correct it and explain the grammar rule or vocabulary in their native language.`;
  };

  const parseBilingualResponse = (response: string) => {
    // Parse the structured response format
    const targetMatch = response.match(/🎯\s*(.+?)(?=\n\n💬|$)/s);
    const nativeMatch = response.match(/💬\s*(.+?)(?=\n\n📝|$)/s);
    const contextMatch = response.match(/📝\s*(.+?)$/s);
    
    return {
      mainText: targetMatch ? targetMatch[1].trim() : response,
      nativeTranslation: nativeMatch ? nativeMatch[1].trim() : '',
      targetTranslation: targetMatch ? targetMatch[1].trim() : '',
      context: contextMatch ? contextMatch[1].trim() : ''
    };
  };

  const getLanguageName = (code: string): string => {
    const language = LANGUAGES.find(lang => lang.code === code);
    return language ? language.name : 'the target language';
  };

  return {
    messages,
    isLoading,
    sendMessage,
    clearChat,
    loadChatHistory,
  };
});