import { z } from "zod";
import { publicProcedure, protectedProcedure } from "@/backend/trpc/create-context";

// In-memory storage for chat messages (replace with database in production)
const chatSessions = new Map<string, any[]>();

export const getChatHistoryProcedure = protectedProcedure
  .input(z.object({
    limit: z.number().min(1).max(100).default(50),
    offset: z.number().min(0).default(0)
  }))
  .query(({ ctx, input }) => {
    const messages = chatSessions.get(ctx.userId) || [];
    return messages
      .slice(input.offset, input.offset + input.limit)
      .reverse(); // Most recent first
  });

export const sendMessageProcedure = protectedProcedure
  .input(z.object({
    message: z.string().min(1).max(1000),
    language: z.string(),
    context: z.string().optional()
  }))
  .mutation(async ({ ctx, input }) => {
    const userMessages = chatSessions.get(ctx.userId) || [];
    
    // Create user message
    const userMessage = {
      id: `msg-${Date.now()}-user`,
      text: input.message,
      isUser: true,
      timestamp: new Date().toISOString(),
      language: input.language,
      context: input.context
    };
    
    userMessages.push(userMessage);
    
    // Simulate AI response (replace with actual AI integration)
    const aiResponse = await generateAIResponse(input.message, input.language, input.context);
    
    const aiMessage = {
      id: `msg-${Date.now()}-ai`,
      text: aiResponse.text,
      isUser: false,
      timestamp: new Date().toISOString(),
      language: input.language,
      corrections: aiResponse.corrections,
      nativeTranslation: aiResponse.nativeTranslation,
      targetTranslation: aiResponse.targetTranslation
    };
    
    userMessages.push(aiMessage);
    chatSessions.set(ctx.userId, userMessages);
    
    return {
      userMessage,
      aiMessage
    };
  });

export const translateTextProcedure = publicProcedure
  .input(z.object({
    text: z.string().min(1).max(1000),
    fromLanguage: z.string(),
    toLanguage: z.string()
  }))
  .mutation(async ({ input }) => {
    // Simulate translation (replace with actual translation service)
    const translation = await simulateTranslation(input.text, input.fromLanguage, input.toLanguage);
    
    return {
      originalText: input.text,
      translatedText: translation,
      fromLanguage: input.fromLanguage,
      toLanguage: input.toLanguage,
      confidence: 0.95
    };
  });

export const getConversationStartersProcedure = publicProcedure
  .input(z.object({
    language: z.string(),
    level: z.enum(['beginner', 'intermediate', 'advanced']).default('beginner'),
    topic: z.string().optional()
  }))
  .query(({ input }) => {
    const starters = getConversationStarters(input.language, input.level, input.topic);
    return starters;
  });

export const analyzePronunciationProcedure = protectedProcedure
  .input(z.object({
    audioData: z.string(), // Base64 encoded audio
    targetText: z.string(),
    language: z.string()
  }))
  .mutation(async ({ input }) => {
    // Simulate pronunciation analysis (replace with actual speech recognition)
    const analysis = await simulatePronunciationAnalysis(input.audioData, input.targetText, input.language);
    
    return analysis;
  });

// Helper functions (replace with actual implementations)
async function generateAIResponse(message: string, language: string, context?: string) {
  // Simulate AI processing delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const responses = {
    es: {
      greeting: "¡Hola! ¿Cómo estás?",
      question: "Esa es una buena pregunta. En español, decimos...",
      correction: "Casi correcto. La forma correcta es...",
      encouragement: "¡Muy bien! Estás progresando mucho."
    },
    fr: {
      greeting: "Bonjour! Comment allez-vous?",
      question: "C'est une bonne question. En français, nous disons...",
      correction: "Presque correct. La forme correcte est...",
      encouragement: "Très bien! Vous progressez beaucoup."
    }
  };
  
  const langResponses = responses[language as keyof typeof responses] || responses.es;
  const responseText = langResponses.greeting;
  
  return {
    text: responseText,
    corrections: message.includes('error') ? [{
      original: message,
      corrected: responseText,
      explanation: "Grammar correction applied"
    }] : [],
    nativeTranslation: "Hello! How are you?",
    targetTranslation: responseText
  };
}

async function simulateTranslation(text: string, from: string, to: string) {
  // Simulate translation delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const translations: Record<string, Record<string, string>> = {
    en: {
      es: "Hola, ¿cómo estás?",
      fr: "Bonjour, comment allez-vous?"
    },
    es: {
      en: "Hello, how are you?",
      fr: "Bonjour, comment allez-vous?"
    }
  };
  
  return translations[from]?.[to] || `[Translated: ${text}]`;
}

function getConversationStarters(language: string, level: string, topic?: string) {
  const starters = {
    es: {
      beginner: [
        "¿Cómo te llamas?",
        "¿De dónde eres?",
        "¿Qué te gusta hacer?",
        "¿Cuál es tu comida favorita?"
      ],
      intermediate: [
        "¿Qué planes tienes para el fin de semana?",
        "¿Cuál es tu película favorita y por qué?",
        "¿Prefieres vivir en la ciudad o en el campo?"
      ],
      advanced: [
        "¿Qué opinas sobre los cambios climáticos?",
        "¿Cómo crees que será el mundo en 20 años?",
        "¿Cuál ha sido el momento más importante de tu vida?"
      ]
    }
  };
  
  return starters[language as keyof typeof starters]?.[level as keyof typeof starters.es] || starters.es.beginner;
}

async function simulatePronunciationAnalysis(audioData: string, targetText: string, language: string) {
  // Simulate analysis delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  return {
    accuracy: Math.floor(Math.random() * 30) + 70, // 70-100%
    feedback: [
      {
        word: targetText.split(' ')[0],
        accuracy: 85,
        suggestion: "Try to emphasize the first syllable more"
      }
    ],
    overallScore: 82,
    improvements: [
      "Focus on vowel pronunciation",
      "Work on rhythm and intonation"
    ]
  };
}