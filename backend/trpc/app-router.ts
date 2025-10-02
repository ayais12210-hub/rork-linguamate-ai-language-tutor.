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
  getDailyChallengeProcedure,
  generateLessonProcedure,
  submitLessonProcedure,
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
import dialogueRouter from './routes/dialogue/dialogue';
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
    // aliases for external clients
    signin: loginProcedure,
    signup: signupProcedure,
    signout: logoutProcedure,
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
    getProfile: getUserProcedure,
    update: updateUserProcedure,
    updateSettings: updateUserProcedure,
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
    // new endpoints
    generate: generateLessonProcedure,
    submit: submitLessonProcedure,
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
    track: trackEventProcedure,
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
    getRankings: getLeaderboardDataProcedure,
    searchUsers: searchUsersProcedure,
    getUserStats: getUserStatsProcedure,
    compareUsers: compareUsersProcedure,
    getGlobalStats: getGlobalStatsProcedure,
  }),

  // Dialogue
  dialogue: dialogueRouter,
});

export type AppRouter = typeof appRouter;