import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import {
  loginProcedure,
  signupProcedure,
  logoutProcedure,
  refreshTokenProcedure,
  verifyEmailProcedure,
  resetPasswordProcedure,
  requestPasswordResetProcedure,
  deleteAccountProcedure,
  getCurrentUserProcedure,
  updateProfileProcedure,
  changePasswordProcedure
} from "./routes/auth/auth";
import {
  getUserProcedure,
  updateUserProcedure,
  completeOnboardingProcedure,
  updateStatsProcedure,
  upgradeToPremiumProcedure,
  canSendMessageProcedure,
  incrementMessageCountProcedure
} from "./routes/user/user";
import {
  getLessonsProcedure,
  getLessonProcedure,
  getUserProgressProcedure,
  updateLessonProgressProcedure,
  getRecommendedLessonsProcedure,
  getDailyChallengeProcedure
} from "./routes/lessons/lessons";
import {
  getChatHistoryProcedure,
  sendMessageProcedure,
  translateTextProcedure,
  getConversationStartersProcedure,
  analyzePronunciationProcedure
} from "./routes/chat/chat";
import {
  trackEventProcedure,
  getLearningAnalyticsProcedure,
  getLeaderboardProcedure,
  getPersonalizedRecommendationsProcedure,
  generateProgressReportProcedure
} from "./routes/analytics/analytics";
import { getLearnContentProcedure } from "./routes/learn/learn";
import preferencesRouter from './routes/preferences/preferences';
import {
  getLeaderboardProcedure as getLeaderboardDataProcedure,
  searchUsersProcedure,
  getUserStatsProcedure,
  compareUsersProcedure,
  getGlobalStatsProcedure
} from "./routes/leaderboard/leaderboard";

export const appRouter = createTRPCRouter({
  // Legacy example route
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  
  // Authentication
  auth: createTRPCRouter({
    login: loginProcedure,
    signup: signupProcedure,
    logout: logoutProcedure,
    refreshToken: refreshTokenProcedure,
    verifyEmail: verifyEmailProcedure,
    resetPassword: resetPasswordProcedure,
    requestPasswordReset: requestPasswordResetProcedure,
    deleteAccount: deleteAccountProcedure,
    getCurrentUser: getCurrentUserProcedure,
    updateProfile: updateProfileProcedure,
    changePassword: changePasswordProcedure,
  }),
  
  // User management
  user: createTRPCRouter({
    get: getUserProcedure,
    update: updateUserProcedure,
    completeOnboarding: completeOnboardingProcedure,
    updateStats: updateStatsProcedure,
    upgradeToPremium: upgradeToPremiumProcedure,
    canSendMessage: canSendMessageProcedure,
    incrementMessageCount: incrementMessageCountProcedure,
  }),
  
  // Lessons and learning content
  lessons: createTRPCRouter({
    getAll: getLessonsProcedure,
    getById: getLessonProcedure,
    getUserProgress: getUserProgressProcedure,
    updateProgress: updateLessonProgressProcedure,
    getRecommended: getRecommendedLessonsProcedure,
    getDailyChallenge: getDailyChallengeProcedure,
  }),
  
  // Chat and AI features
  chat: createTRPCRouter({
    getHistory: getChatHistoryProcedure,
    sendMessage: sendMessageProcedure,
    translate: translateTextProcedure,
    getConversationStarters: getConversationStartersProcedure,
    analyzePronunciation: analyzePronunciationProcedure,
  }),
  
  // Analytics and progress tracking
  analytics: createTRPCRouter({
    trackEvent: trackEventProcedure,
    getLearningAnalytics: getLearningAnalyticsProcedure,
    getLeaderboard: getLeaderboardProcedure,
    getRecommendations: getPersonalizedRecommendationsProcedure,
    generateReport: generateProgressReportProcedure,
  }),

  // Learn page backend
  learn: createTRPCRouter({
    getContent: getLearnContentProcedure,
  }),

  // Preferences
  preferences: preferencesRouter,

  // Leaderboard
  leaderboard: createTRPCRouter({
    get: getLeaderboardDataProcedure,
    searchUsers: searchUsersProcedure,
    getUserStats: getUserStatsProcedure,
    compareUsers: compareUsersProcedure,
    getGlobalStats: getGlobalStatsProcedure,
  }),
});

export type AppRouter = typeof appRouter;