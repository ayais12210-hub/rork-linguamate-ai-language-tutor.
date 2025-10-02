import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Session } from '@/schemas/dialogue.schema';

type QueuedAction =
  | { type: 'submitTurn'; sessionId: string; text: string; meta: Record<string, unknown> }
  | { type: 'endSession'; sessionId: string };

type DialogueQueueState = {
  sessions: Record<string, Session>;
  reviewQueue: string[];
  offlineQueue: QueuedAction[];
};

type DialogueQueueActions = {
  addSession: (session: Session) => void;
  updateSession: (sessionId: string, updates: Partial<Session>) => void;
  getSession: (sessionId: string) => Session | undefined;
  addToReviewQueue: (sessionId: string) => void;
  removeFromReviewQueue: (sessionId: string) => void;
  getDueReviews: () => Session[];
  queueAction: (action: QueuedAction) => void;
  dequeueAction: () => QueuedAction | undefined;
  clearOfflineQueue: () => void;
};

const initial: DialogueQueueState = {
  sessions: {},
  reviewQueue: [],
  offlineQueue: [],
};

export const useDialogueQueue = create<DialogueQueueState & DialogueQueueActions>()(
  persist(
    (set, get) => ({
      ...initial,

      addSession: (session) =>
        set((state) => ({
          sessions: { ...state.sessions, [session.id]: session },
        })),

      updateSession: (sessionId, updates) =>
        set((state) => {
          const existing = state.sessions[sessionId];
          if (!existing) return state;
          return {
            sessions: {
              ...state.sessions,
              [sessionId]: { ...existing, ...updates },
            },
          };
        }),

      getSession: (sessionId) => get().sessions[sessionId],

      addToReviewQueue: (sessionId) =>
        set((state) => {
          if (state.reviewQueue.includes(sessionId)) return state;
          return { reviewQueue: [...state.reviewQueue, sessionId] };
        }),

      removeFromReviewQueue: (sessionId) =>
        set((state) => ({
          reviewQueue: state.reviewQueue.filter((id) => id !== sessionId),
        })),

      getDueReviews: () => {
        const state = get();
        const now = Date.now();
        return state.reviewQueue
          .map((id) => state.sessions[id])
          .filter((s): s is Session => !!s && !!s.srsDueAt && s.srsDueAt <= now);
      },

      queueAction: (action) =>
        set((state) => ({
          offlineQueue: [...state.offlineQueue, action],
        })),

      dequeueAction: () => {
        const state = get();
        const [first, ...rest] = state.offlineQueue;
        if (first) {
          set({ offlineQueue: rest });
        }
        return first;
      },

      clearOfflineQueue: () => set({ offlineQueue: [] }),
    }),
    {
      name: 'dialogue-queue.v1',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
    }
  )
);
