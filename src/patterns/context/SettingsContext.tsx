import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';
import { z } from 'zod';

// Settings schema for validation
const SettingsSchema = z.object({
  locale: z.string().default('en'),
  theme: z.enum(['light', 'dark', 'system']).default('system'),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).default('beginner'),
  voiceId: z.string().default('default'),
  autoPlay: z.boolean().default(true),
  hapticFeedback: z.boolean().default(true),
  speechRate: z.number().min(0.5).max(2.0).default(1.0),
  speechPitch: z.number().min(0.5).max(2.0).default(1.0),
});

export type Settings = z.infer<typeof SettingsSchema>;

// Action types
type SettingsAction =
  | { type: 'SET_LOCALE'; payload: string }
  | { type: 'SET_THEME'; payload: 'light' | 'dark' | 'system' }
  | { type: 'SET_DIFFICULTY'; payload: 'beginner' | 'intermediate' | 'advanced' }
  | { type: 'SET_VOICE_ID'; payload: string }
  | { type: 'SET_AUTO_PLAY'; payload: boolean }
  | { type: 'SET_HAPTIC_FEEDBACK'; payload: boolean }
  | { type: 'SET_SPEECH_RATE'; payload: number }
  | { type: 'SET_SPEECH_PITCH'; payload: number }
  | { type: 'RESET_SETTINGS' }
  | { type: 'LOAD_SETTINGS'; payload: Partial<Settings> };

// Reducer
function settingsReducer(state: Settings, action: SettingsAction): Settings {
  switch (action.type) {
    case 'SET_LOCALE':
      return { ...state, locale: action.payload };
    case 'SET_THEME':
      return { ...state, theme: action.payload };
    case 'SET_DIFFICULTY':
      return { ...state, difficulty: action.payload };
    case 'SET_VOICE_ID':
      return { ...state, voiceId: action.payload };
    case 'SET_AUTO_PLAY':
      return { ...state, autoPlay: action.payload };
    case 'SET_HAPTIC_FEEDBACK':
      return { ...state, hapticFeedback: action.payload };
    case 'SET_SPEECH_RATE':
      return { ...state, speechRate: Math.max(0.5, Math.min(2.0, action.payload)) };
    case 'SET_SPEECH_PITCH':
      return { ...state, speechPitch: Math.max(0.5, Math.min(2.0, action.payload)) };
    case 'RESET_SETTINGS':
      return SettingsSchema.parse({});
    case 'LOAD_SETTINGS':
      return { ...state, ...action.payload };
    default:
      return state;
  }
}

// Context type
interface SettingsContextType {
  settings: Settings;
  setLocale: (locale: string) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setDifficulty: (difficulty: 'beginner' | 'intermediate' | 'advanced') => void;
  setVoiceId: (voiceId: string) => void;
  setAutoPlay: (autoPlay: boolean) => void;
  setHapticFeedback: (hapticFeedback: boolean) => void;
  setSpeechRate: (rate: number) => void;
  setSpeechPitch: (pitch: number) => void;
  resetSettings: () => void;
  loadSettings: (settings: Partial<Settings>) => void;
}

// Create context
const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// Provider component
interface SettingsProviderProps {
  children: ReactNode;
  initialSettings?: Partial<Settings>;
}

export function SettingsProvider({ children, initialSettings }: SettingsProviderProps) {
  const [settings, dispatch] = useReducer(settingsReducer, {
    ...SettingsSchema.parse({}),
    ...initialSettings,
  });

  // Memoized action creators
  const setLocale = useCallback((locale: string) => {
    dispatch({ type: 'SET_LOCALE', payload: locale });
  }, []);

  const setTheme = useCallback((theme: 'light' | 'dark' | 'system') => {
    dispatch({ type: 'SET_THEME', payload: theme });
  }, []);

  const setDifficulty = useCallback((difficulty: 'beginner' | 'intermediate' | 'advanced') => {
    dispatch({ type: 'SET_DIFFICULTY', payload: difficulty });
  }, []);

  const setVoiceId = useCallback((voiceId: string) => {
    dispatch({ type: 'SET_VOICE_ID', payload: voiceId });
  }, []);

  const setAutoPlay = useCallback((autoPlay: boolean) => {
    dispatch({ type: 'SET_AUTO_PLAY', payload: autoPlay });
  }, []);

  const setHapticFeedback = useCallback((hapticFeedback: boolean) => {
    dispatch({ type: 'SET_HAPTIC_FEEDBACK', payload: hapticFeedback });
  }, []);

  const setSpeechRate = useCallback((rate: number) => {
    dispatch({ type: 'SET_SPEECH_RATE', payload: rate });
  }, []);

  const setSpeechPitch = useCallback((pitch: number) => {
    dispatch({ type: 'SET_SPEECH_PITCH', payload: pitch });
  }, []);

  const resetSettings = useCallback(() => {
    dispatch({ type: 'RESET_SETTINGS' });
  }, []);

  const loadSettings = useCallback((newSettings: Partial<Settings>) => {
    dispatch({ type: 'LOAD_SETTINGS', payload: newSettings });
  }, []);

  const value: SettingsContextType = {
    settings,
    setLocale,
    setTheme,
    setDifficulty,
    setVoiceId,
    setAutoPlay,
    setHapticFeedback,
    setSpeechRate,
    setSpeechPitch,
    resetSettings,
    loadSettings,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

// Hook to use settings context
export function useSettings(): SettingsContextType {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}

// Hook to use specific setting
export function useSetting<K extends keyof Settings>(key: K): [Settings[K], (value: Settings[K]) => void] {
  const { settings, ...actions } = useSettings();
  
  const setter = useCallback((value: Settings[K]) => {
    const actionMap = {
      locale: actions.setLocale,
      theme: actions.setTheme,
      difficulty: actions.setDifficulty,
      voiceId: actions.setVoiceId,
      autoPlay: actions.setAutoPlay,
      hapticFeedback: actions.setHapticFeedback,
      speechRate: actions.setSpeechRate,
      speechPitch: actions.setSpeechPitch,
    } as const;
    
    actionMap[key](value as any);
  }, [actions, key]);

  return [settings[key], setter];
}

export default SettingsContext;