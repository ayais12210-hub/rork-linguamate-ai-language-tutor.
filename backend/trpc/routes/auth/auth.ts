import { z } from 'zod';
import { publicProcedure, protectedProcedure } from '../../create-context';
import { TRPCError } from '@trpc/server';
import { 
  SecurityUtils, 
  AdvancedSecurity, 
  SecurityAudit, 
  InputSanitizer,
  RateLimiter,
  SECURITY_CONFIG 
} from '@/lib/security';
import { signJwt } from '@/backend/validation/jwt';
import {
  SignInSchema,
  SignUpSchema,
  VerifyOtpSchema,
  ForgotPasswordSchema,
  ChangePasswordSchema,
  RefreshTokenSchema,
} from '@/schemas/auth';
import { UpdateProfileSchema, DeleteAccountSchema } from '@/schemas/profile';

// Mock database for demo - replace with real database
const users = new Map<string, any>();
const sessions = new Map<string, any>();

// Helper functions

const hashPassword = async (password: string): Promise<string> => {
  // Simple hash for demo - use bcrypt in production
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
};

const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
};

// Login procedure with enhanced security
export const loginProcedure = publicProcedure
  .input(SignInSchema.extend({
    deviceFingerprint: z.string().optional(),
    captchaToken: z.string().optional(),
  }))
  .mutation(async ({ input, ctx }) => {
    const { email, password, deviceFingerprint } = input;
    
    // Sanitize inputs
    const sanitizedEmail = InputSanitizer.sanitizeEmail(email);
    const sanitizedPassword = password.trim();
    
    // Rate limiting check
    const clientIp = (ctx.req as { ip?: string })?.ip || (ctx.req?.headers as Record<string, string>)?.['x-forwarded-for'] || 'unknown';
    if (!RateLimiter.isAllowed(sanitizedEmail, SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS)) {
      await SecurityAudit.logSecurityEvent(
        'login_rate_limit_exceeded',
        { email: sanitizedEmail, ip: clientIp },
        'high'
      );
      throw new TRPCError({
        code: 'TOO_MANY_REQUESTS',
        message: 'Too many login attempts. Please try again later.',
      });
    }
    
    // Check password strength
    const passwordStrength = AdvancedSecurity.validatePasswordStrength(sanitizedPassword);
    if (!passwordStrength.isValid) {
      await SecurityAudit.logSecurityEvent(
        'weak_password_attempt',
        { email: sanitizedEmail, feedback: passwordStrength.feedback },
        'medium'
      );
    }
    
    // Track login attempt (initially as failed)
    await AdvancedSecurity.trackLoginAttempt(sanitizedEmail, false, clientIp);
    
    // Find user by email
    const user = Array.from(users.values()).find(u => u.email === sanitizedEmail);
    
    if (!user) {
      await SecurityAudit.logSecurityEvent(
        'login_failed_user_not_found',
        { email: sanitizedEmail, ip: clientIp },
        'medium'
      );
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Invalid email or password',
      });
    }
    
    // Check for concurrent sessions
    const canCreateSession = await AdvancedSecurity.checkConcurrentSessions(user.id);
    if (!canCreateSession) {
      await SecurityAudit.logSecurityEvent(
        'concurrent_session_limit_exceeded',
        { userId: user.id, email: sanitizedEmail },
        'high'
      );
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Maximum concurrent sessions reached. Please log out from other devices.',
      });
    }
    
    // Verify password
    const isValid = await verifyPassword(sanitizedPassword, user.passwordHash);
    
    if (!isValid) {
      await SecurityAudit.logSecurityEvent(
        'login_failed_invalid_password',
        { email: sanitizedEmail, ip: clientIp },
        'medium'
      );
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Invalid email or password',
      });
    }
    
    // Generate signed JWT tokens
    const sessionId = SecurityUtils.generateSecureId(32);
    const accessToken = signJwt({ sub: user.id, sid: sessionId, type: 'access', expInSec: Math.floor(SECURITY_CONFIG.ACCESS_TOKEN_EXPIRY/1000) });
    const refreshToken = signJwt({ sub: user.id, sid: sessionId, type: 'refresh', expInSec: Math.floor(SECURITY_CONFIG.REFRESH_TOKEN_EXPIRY/1000) });
    
    // Store session with enhanced security
    sessions.set(sessionId, {
      userId: user.id,
      refreshToken,
      createdAt: Date.now(),
      expiresAt: Date.now() + SECURITY_CONFIG.REFRESH_TOKEN_EXPIRY,
      deviceFingerprint,
      ipAddress: clientIp,
      lastActivity: Date.now(),
    });
    
    await AdvancedSecurity.addSession(user.id, sessionId);
    await AdvancedSecurity.trackLoginAttempt(sanitizedEmail, true, clientIp);
    await SecurityAudit.logSecurityEvent(
      'user_authenticated_successfully',
      { userId: user.id, email: sanitizedEmail, ip: clientIp, deviceFingerprint },
      'low'
    );
    const { passwordHash, ...userData } = user;
    return { user: userData, accessToken, refreshToken, sessionId, securityLevel: 'medium' };
  });

// Signup procedure with enhanced security
export const signupProcedure = publicProcedure
  .input(SignUpSchema.extend({
    name: z.string().min(2).max(50),
    deviceFingerprint: z.string().optional(),
  }))
  .mutation(async ({ input, ctx }) => {
    const { name, email, password, deviceFingerprint } = input;
    

    
    // Sanitize inputs
    const sanitizedName = InputSanitizer.sanitizeText(name);
    const sanitizedEmail = InputSanitizer.sanitizeEmail(email);
    const sanitizedPassword = password.trim();
    
    // Validate password strength
    const passwordStrength = AdvancedSecurity.validatePasswordStrength(sanitizedPassword);
    if (!passwordStrength.isValid) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `Password requirements not met: ${passwordStrength.feedback.join(', ')}`,
      });
    }
    
    // Check for suspicious content
    if (SecurityUtils.containsSuspiciousContent(sanitizedName) || 
        SecurityUtils.containsSuspiciousContent(sanitizedEmail)) {
      await SecurityAudit.logSecurityEvent(
        'suspicious_signup_attempt',
        { name: sanitizedName, email: sanitizedEmail },
        'high'
      );
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Invalid input detected',
      });
    }
    
    // Check if user already exists
    const existingUser = Array.from(users.values()).find(u => u.email === sanitizedEmail);
    
    if (existingUser) {
      await SecurityAudit.logSecurityEvent(
        'signup_attempt_existing_email',
        { email: sanitizedEmail },
        'medium'
      );
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'An account with this email already exists',
      });
    }
    
    // Hash password with enhanced security
    const passwordHash = await SecurityUtils.hashPassword(sanitizedPassword);
    
    // Create user with enhanced security
    const userId = SecurityUtils.generateSecureId(32);
    const clientIp = (ctx.req as { ip?: string })?.ip || (ctx.req?.headers as Record<string, string>)?.['x-forwarded-for'] || 'unknown';
    
    const user = {
      id: userId,
      name: sanitizedName,
      email: sanitizedEmail,
      passwordHash,
      createdAt: Date.now(),
      isPremium: false,
      dailyMessageCount: 0,
      lastMessageReset: Date.now(),
      nativeLanguage: null,
      selectedLanguage: null,
      targetLanguage: null,
      proficiencyLevel: 'beginner' as const,
      learningGoals: [],
      interests: [],
      preferredTopics: [],
      dailyGoal: 15,
      dailyGoalMinutes: 15,
      streak: 0,
      totalXP: 0,
      achievements: [],
      completedLessons: [],
      onboardingCompleted: false,
      emailVerified: false,
      twoFactorEnabled: false,
      securityLevel: 'medium' as const,
      registrationIp: clientIp,
      deviceFingerprint,
      stats: {
        totalChats: 0,
        streakDays: 0,
        wordsLearned: 0,
        xpPoints: 0,
        lastActiveDate: '',
        messagesUsedToday: 0,
        lastMessageDate: '',
        badges: [],
      },
      settings: {
        darkMode: false,
        soundEnabled: true,
        notificationsEnabled: true,
        hapticsEnabled: true,
        autoPlayAudio: true,
        securityNotifications: true,
        biometricEnabled: false,
      },
    };
    
    // Add password to history
    await AdvancedSecurity.addToPasswordHistory(userId, sanitizedPassword);
    
    // Store user
    users.set(userId, user);
    
    // Generate signed JWT tokens
    const sessionId = SecurityUtils.generateSecureId(32);
    const accessToken = signJwt({ sub: userId, sid: sessionId, type: 'access', expInSec: Math.floor(SECURITY_CONFIG.ACCESS_TOKEN_EXPIRY/1000) });
    const refreshToken = signJwt({ sub: userId, sid: sessionId, type: 'refresh', expInSec: Math.floor(SECURITY_CONFIG.REFRESH_TOKEN_EXPIRY/1000) });
    
    // Store session with enhanced security
    sessions.set(sessionId, {
      userId,
      refreshToken,
      createdAt: Date.now(),
      expiresAt: Date.now() + SECURITY_CONFIG.REFRESH_TOKEN_EXPIRY,
      deviceFingerprint,
      ipAddress: clientIp,
      lastActivity: Date.now(),
    });
    
    // Add session to user's active sessions
    await AdvancedSecurity.addSession(userId, sessionId);
    
    // Log successful registration
    await SecurityAudit.logSecurityEvent(
      'user_registered_successfully',
      { 
        userId, 
        email: sanitizedEmail, 
        ip: clientIp,
        deviceFingerprint 
      },
      'low'
    );
    
    // Return user data and tokens
    const { passwordHash: _, ...userData } = user;
    
    return {
      user: userData,
      accessToken,
      refreshToken,
      sessionId,
      securityLevel: 'medium',
    };
  });

// Logout procedure
export const logoutProcedure = protectedProcedure
  .mutation(async ({ ctx }) => {
    const { userId } = ctx;
    
    // Find and delete user sessions
    for (const [sessionId, session] of sessions.entries()) {
      if (session.userId === userId) {
        sessions.delete(sessionId);
      }
    }
    
    return { success: true };
  });

// Refresh token procedure
export const refreshTokenProcedure = publicProcedure
  .input(RefreshTokenSchema)
  .mutation(async ({ input }) => {
    const { refreshToken } = input;
    
    // Find session by refresh token
    const session = Array.from(sessions.values()).find(s => s.refreshToken === refreshToken);
    
    if (!session || session.expiresAt < Date.now()) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Invalid or expired refresh token',
      });
    }
    
    // Generate new access token
    const newAccessToken = signJwt({ sub: session.userId, sid: undefined as any, type: 'access', expInSec: Math.floor(SECURITY_CONFIG.ACCESS_TOKEN_EXPIRY/1000) });
    return { accessToken: newAccessToken, refreshToken: session.refreshToken };
  });

// Verify email procedure
export const verifyEmailProcedure = publicProcedure
  .input(VerifyOtpSchema.extend({ code: z.string() }))
  .mutation(async ({ input }) => {
    const { email, code } = input;
    
    // Find user by email
    const user = Array.from(users.values()).find(u => u.email === email);
    
    if (!user) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found',
      });
    }
    
    // In production, verify the code against stored verification code
    // For demo, accept any 6-digit code
    if (code.length !== 6) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Invalid verification code',
      });
    }
    
    // Mark email as verified
    user.emailVerified = true;
    
    return { success: true };
  });

// Reset password procedure
export const resetPasswordProcedure = publicProcedure
  .input(z.object({
    email: z.string().email(),
    code: z.string(),
    password: z.string().min(8),
  }))
  .mutation(async ({ input }) => {
    const { email, code, password: newPassword } = input;
    
    // Find user by email
    const user = Array.from(users.values()).find(u => u.email === email);
    
    if (!user) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found',
      });
    }
    
    // In production, verify the reset code
    // For demo, accept any 6-digit code
    if (code.length !== 6) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Invalid reset code',
      });
    }
    
    // Hash new password
    user.passwordHash = await hashPassword(newPassword);
    
    return { success: true };
  });

// Request password reset procedure
export const requestPasswordResetProcedure = publicProcedure
  .input(ForgotPasswordSchema)
  .mutation(async ({ input }) => {
    const { email } = input;
    
    // Find user by email
    const user = Array.from(users.values()).find(u => u.email === email);
    
    if (!user) {
      // Don't reveal if user exists
      return { success: true };
    }
    
    // In production, send reset email with code
    // For demo, just return success
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    if (__DEV__) {

      console.log(`[Auth] Password reset code for ${email}: ${resetCode}`);

    }
    
    return { success: true };
  });

// Delete account procedure
export const deleteAccountProcedure = protectedProcedure
  .input(DeleteAccountSchema)
  .mutation(async ({ ctx, input }) => {
    const { userId } = ctx;
    const { password } = input;
    
    // Find user
    const user = users.get(userId);
    
    if (!user) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found',
      });
    }
    
    // Verify password
    const isValid = await verifyPassword(password, user.passwordHash);
    
    if (!isValid) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Invalid password',
      });
    }
    
    // Delete user and sessions
    users.delete(userId);
    for (const [sessionId, session] of sessions.entries()) {
      if (session.userId === userId) {
        sessions.delete(sessionId);
      }
    }
    
    return { success: true };
  });

// Get current user procedure
export const getCurrentUserProcedure = protectedProcedure
  .query(async ({ ctx }) => {
    const { userId } = ctx;
    
    const user = users.get(userId);
    
    if (!user) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found',
      });
    }
    
    const { passwordHash, ...userData } = user;
    return userData;
  });

// Update profile procedure
export const updateProfileProcedure = protectedProcedure
  .input(UpdateProfileSchema.extend({
    name: z.string().min(2).optional(),
    email: z.string().email().optional(),
    nativeLanguage: z.string().optional(),
    targetLanguage: z.string().optional(),
    proficiencyLevel: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
    dailyGoal: z.number().min(5).max(120).optional(),
  }))
  .mutation(async ({ ctx, input }) => {
    const { userId } = ctx;
    
    const user = users.get(userId);
    
    if (!user) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found',
      });
    }
    
    // Check if email is being changed and is already taken
    if (input.email && input.email !== user.email) {
      const existingUser = Array.from(users.values()).find(u => u.email === input.email);
      if (existingUser) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Email is already in use',
        });
      }
    }
    
    // Update user
    Object.assign(user, input);
    
    const { passwordHash, ...userData } = user;
    return userData;
  });

// Change password procedure with enhanced security
export const changePasswordProcedure = protectedProcedure
  .input(ChangePasswordSchema)
  .mutation(async ({ ctx, input }) => {
    const { userId } = ctx;
    const { currentPassword, newPassword, confirmPassword } = input;
    
    // Validate password confirmation
    if (newPassword !== confirmPassword) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Password confirmation does not match',
      });
    }
    
    // Validate new password strength
    const passwordStrength = AdvancedSecurity.validatePasswordStrength(newPassword);
    if (!passwordStrength.isValid) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `Password requirements not met: ${passwordStrength.feedback.join(', ')}`,
      });
    }
    
    const user = users.get(userId);
    
    if (!user) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found',
      });
    }
    
    // Check password history
    const isPasswordReused = !(await AdvancedSecurity.checkPasswordHistory(userId, newPassword));
    if (isPasswordReused) {
      await SecurityAudit.logSecurityEvent(
        'password_reuse_attempt',
        { userId },
        'medium'
      );
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Cannot reuse a recent password. Please choose a different password.',
      });
    }
    
    // Verify current password
    const isValid = await SecurityUtils.verifyPassword(currentPassword, user.passwordHash);
    
    if (!isValid) {
      await SecurityAudit.logSecurityEvent(
        'password_change_failed_invalid_current',
        { userId },
        'medium'
      );
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Current password is incorrect',
      });
    }
    
    // Hash and update password
    user.passwordHash = await SecurityUtils.hashPassword(newPassword);
    
    // Add new password to history
    await AdvancedSecurity.addToPasswordHistory(userId, newPassword);
    
    // Log password change
    await SecurityAudit.logSecurityEvent(
      'password_changed_successfully',
      { userId },
      'low'
    );
    
    return { 
      success: true,
      message: 'Password changed successfully',
    };
  });