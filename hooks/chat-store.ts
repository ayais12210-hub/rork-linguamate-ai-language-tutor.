import createContextHook from '@nkzw/create-context-hook';
import React, { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChatMessage } from '@/types/user';
import { useUser } from './user-store';
import { LANGUAGES } from '@/constants/languages';

const CHAT_STORAGE_KEY = 'linguamate_chat_history';

export const [ChatProvider, useChat] = createContextHook(() => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const { user, incrementMessageCount } = useUser();

  const loadChatHistory = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(CHAT_STORAGE_KEY);
      if (stored) {
        const parsedMessages: ChatMessage[] = JSON.parse(stored);
        setMessages(parsedMessages);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  }, []);

  const saveChatHistory = useCallback(async () => {
    try {
      await AsyncStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
    } catch (error) {
      console.error('Error saving chat history:', error);
    }
  }, [messages]);

  useEffect(() => {
    loadChatHistory();
  }, [loadChatHistory]);

  useEffect(() => {
    if (messages.length > 0) {
      saveChatHistory();
    }
  }, [messages, saveChatHistory]);

  const refreshSuggestions = useCallback(async () => {
    try {
      const recent = messages.slice(-8).map(m => ({ role: m.isUser ? 'user' as const : 'assistant' as const, content: m.text }));
      const targetLanguage = getLanguageName(user.selectedLanguage);
      const nativeLanguage = getLanguageName(user.nativeLanguage);

      const system = `You generate short next-message suggestions for a language learning chat between a student and an AI coach. Return ONLY a JSON array of 3-5 short suggestions (max 80 chars each) in ${targetLanguage}, tailored to user's level (${user.proficiencyLevel}), interests (${user.interests?.join?.(', ') ?? 'general'}), and previous turns. Avoid repeating the last AI message. Include a mix of question prompts, practice tasks, and cultural tidbits. Also provide beginner-friendly options when level is beginner.`;

      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const res = await fetch('https://toolkit.rork.com/text/llm/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: system },
            ...recent,
            { role: 'user', content: `Give suggestions in ${targetLanguage} with ${nativeLanguage} in mind. Return JSON array only.` }
          ]
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      let list: string[] = [];
      if (typeof data?.completion === 'string') {
        try {
          const jsonMatch = data.completion.match(/\[[\s\S]*\]/);
          const maybeJson = jsonMatch ? jsonMatch[0] : data.completion;
          const parsed = JSON.parse(maybeJson);
          if (Array.isArray(parsed)) {
            list = parsed.filter((s: unknown) => typeof s === 'string');
          }
        } catch {
          list = data.completion
            .split('\n')
            .map((l: string) => l.replace(/^[-•\d.\s\"]+/, '').replace(/[\"]+$/,'').trim())
            .filter(Boolean);
        }
      }
      const cleaned = Array.from(new Set(
        list
          .map((s) => (s ?? '').toString().trim())
          .filter((s) => s.length > 0)
          .map((s) => s.replace(/[\s]+/g, ' '))
          .map((s) => (s.length > 80 ? s.slice(0, 79) + '…' : s))
      ));
      const limited = cleaned.slice(0, 5);
      if (limited.length === 0) {
        const fallback = getLanguageSpecificFallbacks(targetLanguage, user.proficiencyLevel);
        setSuggestions(fallback);
      } else {
        setSuggestions(limited);
      }
    } catch (e) {
      console.error('Failed to refresh suggestions', e);
      const errorType = e instanceof Error ? e.name : 'Unknown';
      console.log(`Error type: ${errorType}, using fallback suggestions`);
      
      // Use language-specific fallback suggestions
      const targetLanguage = getLanguageName(user.selectedLanguage);
      const fallbackSuggestions = getLanguageSpecificFallbacks(targetLanguage, user.proficiencyLevel);
      setSuggestions(fallbackSuggestions);
    }
  }, [messages, user.selectedLanguage, user.nativeLanguage, user.proficiencyLevel, user.interests]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: text.trim(),
      isUser: true,
      timestamp: new Date().toISOString(),
      language: user.selectedLanguage ?? 'unknown',
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const targetLanguage = getLanguageName(user.selectedLanguage);
      const nativeLanguage = getLanguageName(user.nativeLanguage);

      const recentMessages = [...messages, userMessage].slice(-20);
      const conversationHistory = recentMessages.map(msg => ({
        role: msg.isUser ? 'user' as const : 'assistant' as const,
        content: msg.text
      }));

      const { buildSystemPrompt, windowConversation, DEFAULT_PROMPT_CONFIG } = await import('@/lib/ai/prompts');
      const systemPrompt = buildSystemPrompt(user as any, targetLanguage, nativeLanguage);
      const windowed = windowConversation(conversationHistory, DEFAULT_PROMPT_CONFIG);

      const response = await fetch('https://toolkit.rork.com/text/llm/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemPrompt },
            ...windowed,
          ],
        }),
      });

      const data = await response.json();

      if (data.completion) {
        const parsedResponse = parseBilingualResponse(data.completion);

        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          text: parsedResponse.mainText,
          isUser: false,
          timestamp: new Date().toISOString(),
          language: user.selectedLanguage ?? 'unknown',
          nativeTranslation: parsedResponse.nativeTranslation,
          targetTranslation: parsedResponse.targetTranslation,
          context: parsedResponse.context,
        };

        setMessages(prev => [...prev, aiMessage]);
        incrementMessageCount();

        refreshSuggestions();
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: 'Sorry, I had trouble understanding. Please try again.',
        isUser: false,
        timestamp: new Date().toISOString(),
        language: user.selectedLanguage ?? 'unknown',
      };
      setMessages(prev => [...prev, errorMessage]);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, user, incrementMessageCount, refreshSuggestions]);

  const clearChat = useCallback(async () => {
    setMessages([]);
    setSuggestions([]);
    try {
      await AsyncStorage.removeItem(CHAT_STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing chat history:', error);
    }
  }, []);

  const createPersonalizedSystemPrompt = (user: any, targetLanguage: string, nativeLanguage: string): string => {
    return `Deprecated - use buildSystemPrompt instead`;
  };

  const parseBilingualResponse = (response: string) => {
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

  const getLanguageName = (code?: string): string => {
    const language = code ? LANGUAGES.find(lang => lang.code === code) : undefined;
    return language ? language.name : 'the target language';
  };

  const getLanguageSpecificFallbacks = (targetLanguage: string, proficiencyLevel?: string): string[] => {
    const fallbacks: Record<string, Record<string, string[]>> = {
      Spanish: {
        beginner: ['¡Hola!', '¿Cómo estás?', '¿Cómo te llamas?', 'Gracias', '¿Qué tal?'],
        intermediate: ['¿Qué hiciste ayer?', 'Cuéntame sobre tu familia', '¿Te gusta la música?', '¿Cuál es tu comida favorita?'],
        advanced: ['¿Qué opinas sobre...?', 'Explícame la diferencia entre...', '¿Podrías corregir mi gramática?']
      },
      French: {
        beginner: ['Bonjour!', 'Comment allez-vous?', 'Comment vous appelez-vous?', 'Merci', 'Ça va?'],
        intermediate: ['Qu\'avez-vous fait hier?', 'Parlez-moi de votre famille', 'Aimez-vous la musique?', 'Quel est votre plat préféré?'],
        advanced: ['Que pensez-vous de...?', 'Expliquez-moi la différence entre...', 'Pourriez-vous corriger ma grammaire?']
      },
      German: {
        beginner: ['Hallo!', 'Wie geht es Ihnen?', 'Wie heißen Sie?', 'Danke', 'Wie geht\'s?'],
        intermediate: ['Was haben Sie gestern gemacht?', 'Erzählen Sie mir von Ihrer Familie', 'Mögen Sie Musik?', 'Was ist Ihr Lieblingsgericht?'],
        advanced: ['Was denken Sie über...?', 'Erklären Sie mir den Unterschied zwischen...', 'Könnten Sie meine Grammatik korrigieren?']
      },
      Italian: {
        beginner: ['Ciao!', 'Come stai?', 'Come ti chiami?', 'Grazie', 'Come va?'],
        intermediate: ['Cosa hai fatto ieri?', 'Parlami della tua famiglia', 'Ti piace la musica?', 'Qual è il tuo piatto preferito?'],
        advanced: ['Cosa ne pensi di...?', 'Spiegami la differenza tra...', 'Potresti correggere la mia grammatica?']
      }
    };

    const level = proficiencyLevel || 'beginner';
    const languageFallbacks = fallbacks[targetLanguage];
    
    if (languageFallbacks && languageFallbacks[level]) {
      return languageFallbacks[level];
    }
    
    // Default English fallbacks
    const defaultFallbacks: Record<string, string[]> = {
      beginner: ['Hello!', 'How are you?', 'What\'s your name?', 'Thank you', 'How\'s it going?'],
      intermediate: ['What did you do yesterday?', 'Tell me about your family', 'Do you like music?', 'What\'s your favorite food?'],
      advanced: ['What do you think about...?', 'Explain the difference between...', 'Could you correct my grammar?']
    };
    
    return defaultFallbacks[level] || defaultFallbacks.beginner;
  };

  const value = React.useMemo(() => ({
    messages,
    isLoading,
    suggestions,
    refreshSuggestions,
    sendMessage,
    clearChat,
    loadChatHistory,
  }), [messages, isLoading, suggestions, refreshSuggestions, sendMessage, clearChat, loadChatHistory]);

  return value;
});