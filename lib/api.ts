// API utilities and configurations for the language learning app
import { z } from 'zod';

// API endpoints
const TOOLKIT_BASE_URL = process.env.EXPO_PUBLIC_TOOLKIT_URL || 'https://toolkit.rork.com';

export const API_ENDPOINTS = {
  // AI Services
  TEXT_LLM: `${TOOLKIT_BASE_URL}/text/llm/`,
  IMAGE_GENERATE: `${TOOLKIT_BASE_URL}/images/generate/`,
  IMAGE_EDIT: `${TOOLKIT_BASE_URL}/images/edit/`,
  // STT is proxied through our backend to ensure CORS, auth, and consistent JSON
  SPEECH_TO_TEXT_PROXY: '/api/stt/transcribe',
  
  // External APIs (examples)
  TRANSLATE: 'https://api.mymemory.translated.net/get',
  DICTIONARY: 'https://api.dictionaryapi.dev/api/v2/entries',
} as const;

// API response types
export interface LLMRequest {
  messages: CoreMessage[];
}

export interface LLMResponse {
  completion: string;
}

export interface ImageGenerateRequest {
  prompt: string;
  size?: string;
}

export interface ImageGenerateResponse {
  image: {
    base64Data: string;
    mimeType: string;
  };
  size: string;
}

const ImageGenerateResponseSchema = z.object({
  image: z.object({ base64Data: z.string(), mimeType: z.string() }),
  size: z.string(),
});

export interface ImageEditRequest {
  prompt: string;
  images: Array<{ type: 'image'; image: string }>;
}

export interface ImageEditResponse {
  image: {
    base64Data: string;
    mimeType: string;
  };
}

const ImageEditResponseSchema = z.object({
  image: z.object({ base64Data: z.string(), mimeType: z.string() }),
});

export interface STTRequest {
  audio: File;
  language?: string;
}

export interface STTResponse {
  text: string;
  language: string;
}

const STTResponseSchema = z.object({ text: z.string(), language: z.string() });

// Core message types for AI
export type ContentPart =
  | { type: 'text'; text: string }
  | { type: 'image'; image: string };

export type CoreMessage =
  | { role: 'system'; content: string }
  | { role: 'user'; content: string | Array<ContentPart> }
  | { role: 'assistant'; content: string | Array<ContentPart> };

// API client class
export class ApiClient {
  private static instance: ApiClient;
  private baseHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  private async request<T>(
    url: string,
    options: RequestInit = {},
    validate?: (data: unknown) => T,
    timeoutMs: number = 20000
  ): Promise<T> {
    try {
      const controller = typeof AbortController !== 'undefined' ? new AbortController() : undefined;
      const id = controller ? setTimeout(() => controller.abort(), timeoutMs) : undefined;

      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.baseHeaders,
          ...(options.headers ?? {}),
        },
        signal: controller?.signal,
      }).catch((e) => {
        throw new Error('NETWORK_REQUEST_FAILED');
      });

      if (id) clearTimeout(id as unknown as number);

      if (!response?.ok) {
        const status = response?.status ?? 0;
        throw new Error(`HTTP_${status}`);
      }

      const data = await response.json().catch(() => {
        throw new Error('INVALID_JSON');
      });

      if (validate) {
        return validate(data);
      }
      return data as T;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  private getBase(): string {
    if (typeof window !== 'undefined' && window.location) {
      const origin = window.location.origin.replace(/\/$/, '');
      let basePath = '';
      try {
        const match = window.location.pathname.match(/^\/p\/[^/]+/);
        if (match && match[0]) basePath = match[0];
      } catch {}
      return `${origin}${basePath}`.replace(/\/$/, '');
    }
    try {
      // @ts-expect-error Expo Constants at runtime
      const Constants = require('expo-constants').default;
      const hostUri = Constants?.expoConfig?.hostUri || Constants?.manifest2?.extra?.expoClient?.hostUri;
      if (typeof hostUri === 'string' && hostUri.length > 0) {
        let cleaned = hostUri.trim();
        cleaned = cleaned.replace(/^exp:\/\//i, '').replace(/^ws:\/\//i, '').replace(/^wss:\/\//i, '');
        if (!/^https?:\/\//i.test(cleaned)) cleaned = `http://${cleaned}`;
        return cleaned.replace(/\/$/, '');
      }
    } catch {}
    return 'http://localhost:8081';
  }

  // AI Text Generation
  async generateText(messages: CoreMessage[]): Promise<LLMResponse> {
    return this.request<LLMResponse>(API_ENDPOINTS.TEXT_LLM, {
      method: 'POST',
      body: JSON.stringify({ messages }),
    });
  }

  // AI Image Generation
  async generateImage(request: ImageGenerateRequest): Promise<ImageGenerateResponse> {
    return this.request<ImageGenerateResponse>(
      API_ENDPOINTS.IMAGE_GENERATE,
      {
        method: 'POST',
        body: JSON.stringify(request),
      },
      (data) => ImageGenerateResponseSchema.parse(data)
    );
  }

  // AI Image Editing
  async editImage(request: ImageEditRequest): Promise<ImageEditResponse> {
    return this.request<ImageEditResponse>(
      API_ENDPOINTS.IMAGE_EDIT,
      {
        method: 'POST',
        body: JSON.stringify(request),
      },
      (data) => ImageEditResponseSchema.parse(data)
    );
  }

  // Speech to Text
  async transcribeAudio(formData: FormData): Promise<STTResponse> {
    const base = this.getBase();
    const url = `${base}${API_ENDPOINTS.SPEECH_TO_TEXT_PROXY}`;
    const res = await fetch(url, { method: 'POST', body: formData });
    const ct = res.headers.get('content-type') ?? '';
    const text = await res.text();
    if (!res.ok) {
      let message = res.statusText || 'Request failed';
      try {
        const err = JSON.parse(text) as { message?: string };
        if (typeof err.message === 'string') message = err.message;
      } catch {}
      throw new Error(`HTTP_${res.status}:${message}`);
    }
    if (!ct.includes('application/json')) {
      throw new Error('INVALID_JSON');
    }
    const data = JSON.parse(text);
    return STTResponseSchema.parse(data);
  }

  // Translation service
  async translateText(
    text: string,
    fromLang: string,
    toLang: string
  ): Promise<{ translatedText: string }> {
    const url = `${API_ENDPOINTS.TRANSLATE}?q=${encodeURIComponent(text)}&langpair=${fromLang}|${toLang}`;
    
    try {
      const response = await this.request<any>(url, { method: 'GET' });
      const translated = (response?.responseData?.translatedText as string | undefined) ?? text;
      return { translatedText: translated };
    } catch (error) {
      console.error('Translation failed:', error);
      return { translatedText: text };
    }
  }

  // Dictionary lookup
  async lookupWord(word: string, language = 'en'): Promise<any> {
    const url = `${API_ENDPOINTS.DICTIONARY}/${language}/${encodeURIComponent(word)}`;
    
    try {
      return await this.request<any>(url, { method: 'GET' });
    } catch (error) {
      console.error('Dictionary lookup failed:', error);
      return null;
    }
  }
}

// Export singleton instance
export const apiClient = ApiClient.getInstance();

// Helper functions for common API operations
export const apiHelpers = {
  // Generate lesson content using AI
  async generateLessonContent(
    topic: string,
    language: string,
    level: string
  ): Promise<string> {
    const messages: CoreMessage[] = [
      {
        role: 'system',
        content: `You are a language learning assistant. Create engaging lesson content for ${language} learners at ${level} level.`,
      },
      {
        role: 'user',
        content: `Create a lesson about ${topic} for ${language} learners. Include vocabulary, examples, and practice exercises.`,
      },
    ];

    const response = await apiClient.generateText(messages);
    return response.completion;
  },

  // Generate conversation practice
  async generateConversation(
    scenario: string,
    language: string,
    level: string
  ): Promise<string> {
    const messages: CoreMessage[] = [
      {
        role: 'system',
        content: `Create realistic conversation practice for ${language} learners at ${level} level.`,
      },
      {
        role: 'user',
        content: `Generate a conversation scenario: ${scenario}. Include natural dialogue and cultural context.`,
      },
    ];

    const response = await apiClient.generateText(messages);
    return response.completion;
  },

  // Generate quiz questions
  async generateQuiz(
    topic: string,
    language: string,
    questionCount = 5
  ): Promise<string> {
    const messages: CoreMessage[] = [
      {
        role: 'system',
        content: `Create quiz questions for ${language} learners. Format as JSON with questions, options, and correct answers.`,
      },
      {
        role: 'user',
        content: `Generate ${questionCount} quiz questions about ${topic} in ${language}.`,
      },
    ];

    const response = await apiClient.generateText(messages);
    return response.completion;
  },

  // Analyze user input for feedback
  async analyzeUserInput(
    userInput: string,
    expectedAnswer: string,
    language: string
  ): Promise<string> {
    const messages: CoreMessage[] = [
      {
        role: 'system',
        content: `Analyze ${language} language input and provide constructive feedback.`,
      },
      {
        role: 'user',
        content: `User wrote: "${userInput}". Expected: "${expectedAnswer}". Provide feedback on grammar, vocabulary, and suggestions for improvement.`,
      },
    ];

    const response = await apiClient.generateText(messages);
    return response.completion;
  },
};

// Error handling for API calls
export const handleApiError = (error: unknown, context?: string): string => {
  console.error(`API Error${context ? ` in ${context}` : ''}:`, error);
  
  if (error instanceof Error) {
    if (error.message.includes('network')) {
      return 'Network error. Please check your connection.';
    }
    if (error.message.includes('401')) {
      return 'Authentication failed. Please log in again.';
    }
    if (error.message.includes('403')) {
      return 'Access denied. You may need to upgrade your account.';
    }
    if (error.message.includes('429')) {
      return 'Too many requests. Please try again later.';
    }
    if (error.message.includes('500')) {
      return 'Server error. Please try again later.';
    }
    return error.message;
  }
  
  return 'An unexpected error occurred. Please try again.';
};