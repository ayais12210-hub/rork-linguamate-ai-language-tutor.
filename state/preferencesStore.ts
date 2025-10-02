import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Difficulty,
  DIFFICULTY_PRESETS,
  DifficultyParams,
} from '@/schemas/difficulty.schema';

type PrefState = {
  difficulty: Difficulty;
  params: DifficultyParams;
  autoAdapt: boolean;
};

type PrefActions = {
  setDifficulty: (d: Difficulty) => void;
  getParam: <K extends keyof DifficultyParams>(k: K) => DifficultyParams[K];
  setAutoAdapt: (enabled: boolean) => void;
};

const initial: PrefState = {
  difficulty: 'beginner',
  params: DIFFICULTY_PRESETS.beginner,
  autoAdapt: false,
};

export const usePreferences = create<PrefState & PrefActions>()(
  persist(
    (set, get) => ({
      ...initial,
      setDifficulty: (d) =>
        set({ difficulty: d, params: DIFFICULTY_PRESETS[d] }),
      getParam: (k) => get().params[k],
      setAutoAdapt: (enabled) => set({ autoAdapt: enabled }),
    }),
    {
      name: 'preferences.v1',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
    }
  )
);
