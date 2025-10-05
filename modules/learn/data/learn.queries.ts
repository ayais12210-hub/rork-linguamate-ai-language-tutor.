export const learnQueries = {
  // Query keys for React Query
  keys: {
    all: ['learn'] as const,
    sessions: () => [...learnQueries.keys.all, 'sessions'] as const,
    session: (id: string) => [...learnQueries.keys.all, 'session', id] as const,
    progress: () => [...learnQueries.keys.all, 'progress'] as const,
    stats: () => [...learnQueries.keys.all, 'stats'] as const,
  },
};