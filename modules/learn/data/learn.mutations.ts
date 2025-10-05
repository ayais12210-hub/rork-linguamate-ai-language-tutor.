export const learnMutations = {
  // Mutation keys for React Query
  keys: {
    startSession: ['learn', 'start-session'] as const,
    endSession: ['learn', 'end-session'] as const,
    updateProgress: ['learn', 'update-progress'] as const,
    completeLesson: ['learn', 'complete-lesson'] as const,
  },
};