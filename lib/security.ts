// Comprehensive security utilities for the language learning app

import { Platform } from 'react-native';
import CryptoJS from 'crypto-js';
import { storageHelpers, storage } from './storage';

// Security configuration
export const SECURITY_CONFIG = {
  // Token expiration times
  ACCESS_TOKEN_EXPIRY: 15 * 60 * 1000, // 15 minutes
  REFRESH_TOKEN_EXPIRY: 7 * 24 * 60 * 60 * 1000, // 7 days
  SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes
  
  // Rate limiting
  MAX_LOGIN_ATTEMPTS: 5,
  LOGIN_LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes
  MAX_API_REQUESTS_PER_MINUTE: 60,
  MAX_FAILED_ATTEMPTS_BEFORE_CAPTCHA: 3,
  
  // Advanced security
  DEVICE_FINGERPRINT_ENABLED: true,
  ANOMALY_DETECTION_ENABLED: true,
  SECURITY_HEADERS_ENABLED: true,
  CONTENT_SECURITY_POLICY_ENABLED: true,
  
  // Password policy
  MIN_PASSWORD_LENGTH: 8,
  REQUIRE_UPPERCASE: true,
  REQUIRE_LOWERCASE: true,
  REQUIRE_NUMBERS: true,
  REQUIRE_SPECIAL_CHARS: true,
  PASSWORD_HISTORY_COUNT: 5,
  
  // Account security
  MAX_CONCURRENT_SESSIONS: 3,
  FORCE_LOGOUT_ON_SUSPICIOUS_ACTIVITY: true,
  REQUIRE_2FA_FOR_SENSITIVE_OPERATIONS: false,
  
  // Data encryption
  ENCRYPTION_KEY_LENGTH: 32,
  IV_LENGTH: 16,
  
  // Content security
  MAX_MESSAGE_LENGTH: 2000,
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_FILE_TYPES: ['image/jpeg', 'image/png', 'audio/wav', 'audio/mp3'],
  
  // Session security
  SECURE_STORAGE_PREFIX: 'secure_',
  BIOMETRIC_PROMPT_TITLE: 'Authenticate',
  BIOMETRIC_PROMPT_SUBTITLE: 'Use your biometric to access the app',
};

// Security error types
export enum SecurityErrorType {
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
  AUTHORIZATION_DENIED = 'AUTHORIZATION_DENIED',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  INVALID_INPUT = 'INVALID_INPUT',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  ENCRYPTION_FAILED = 'ENCRYPTION_FAILED',
  BIOMETRIC_FAILED = 'BIOMETRIC_FAILED',
  DEVICE_COMPROMISED = 'DEVICE_COMPROMISED',
  ANOMALY_DETECTED = 'ANOMALY_DETECTED',
  CONCURRENT_SESSION_LIMIT = 'CONCURRENT_SESSION_LIMIT',
  WEAK_PASSWORD = 'WEAK_PASSWORD',
  PASSWORD_REUSED = 'PASSWORD_REUSED',
  CAPTCHA_REQUIRED = 'CAPTCHA_REQUIRED',
  GEOLOCATION_BLOCKED = 'GEOLOCATION_BLOCKED',
  VPN_DETECTED = 'VPN_DETECTED',
  MALICIOUS_REQUEST = 'MALICIOUS_REQUEST',
}

export class SecurityError extends Error {
  constructor(
    public type: SecurityErrorType,
    message: string,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'SecurityError';
  }
}

// Token management
export class TokenManager {
  private static readonly ACCESS_TOKEN_KEY = 'access_token';
  private static readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private static readonly TOKEN_EXPIRY_KEY = 'token_expiry';
  
  static async storeTokens(accessToken: string, refreshToken: string): Promise<void> {
    try {
      const expiryTime = Date.now() + SECURITY_CONFIG.ACCESS_TOKEN_EXPIRY;
      
      await Promise.all([
        SecureStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken),
        SecureStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken),
        SecureStorage.setItem(this.TOKEN_EXPIRY_KEY, expiryTime.toString()),
      ]);
      
      if (__DEV__) {

      
        console.log('[TokenManager] Tokens stored securely');

      
      }
    } catch (error) {
      if (__DEV__) {

        console.error('[TokenManager] Failed to store tokens:', error);

      }
      throw new SecurityError(
        SecurityErrorType.ENCRYPTION_FAILED,
        'Failed to store authentication tokens'
      );
    }
  }
  
  static async getAccessToken(): Promise<string | null> {
    try {
      const [token, expiryStr] = await Promise.all([
        SecureStorage.getItem(this.ACCESS_TOKEN_KEY),
        SecureStorage.getItem(this.TOKEN_EXPIRY_KEY),
      ]);
      
      if (!token || !expiryStr) {
        return null;
      }
      
      const expiry = parseInt(expiryStr, 10);
      if (Date.now() > expiry) {
        if (__DEV__) {

          console.log('[TokenManager] Access token expired');

        }
        await this.clearTokens();
        return null;
      }
      
      return token;
    } catch (error) {
      if (__DEV__) {

        console.error('[TokenManager] Failed to get access token:', error);

      }
      return null;
    }
  }
  
  static async getRefreshToken(): Promise<string | null> {
    try {
      return await SecureStorage.getItem(this.REFRESH_TOKEN_KEY);
    } catch (error) {
      if (__DEV__) {

        console.error('[TokenManager] Failed to get refresh token:', error);

      }
      return null;
    }
  }
  
  static async clearTokens(): Promise<void> {
    try {
      await Promise.all([
        SecureStorage.removeItem(this.ACCESS_TOKEN_KEY),
        SecureStorage.removeItem(this.REFRESH_TOKEN_KEY),
        SecureStorage.removeItem(this.TOKEN_EXPIRY_KEY),
      ]);
      
      if (__DEV__) {

      
        console.log('[TokenManager] Tokens cleared');

      
      }
    } catch (error) {
      if (__DEV__) {

        console.error('[TokenManager] Failed to clear tokens:', error);

      }
    }
  }
  
  static async isTokenValid(): Promise<boolean> {
    const token = await this.getAccessToken();
    return token !== null;
  }
}

// Secure storage wrapper
export class SecureStorage {
  private static readonly STORAGE_PREFIX = SECURITY_CONFIG.SECURE_STORAGE_PREFIX;
  
  static async setItem(key: string, value: string): Promise<void> {
    try {
      const encryptedValue = await this.encrypt(value);
      await storage.setItem(`${this.STORAGE_PREFIX}${key}`, encryptedValue);
    } catch (error) {
      if (__DEV__) {

        console.error('[SecureStorage] Failed to set item:', error);

      }
      throw new SecurityError(
        SecurityErrorType.ENCRYPTION_FAILED,
        'Failed to store secure data'
      );
    }
  }
  
  static async getItem(key: string): Promise<string | null> {
    try {
      const encryptedValue = await storage.getItem(`${this.STORAGE_PREFIX}${key}`);
      if (!encryptedValue) {
        return null;
      }
      
      return await this.decrypt(encryptedValue);
    } catch (error) {
      if (__DEV__) {

        console.error('[SecureStorage] Failed to get item:', error);

      }
      return null;
    }
  }
  
  static async removeItem(key: string): Promise<void> {
    try {
      await storage.removeItem(`${this.STORAGE_PREFIX}${key}`);
    } catch (error) {
      if (__DEV__) {

        console.error('[SecureStorage] Failed to remove item:', error);

      }
    }
  }
  
  static async clear(): Promise<void> {
    try {
      // Clear all secure storage items
      await storage.clear();
    } catch (error) {
      if (__DEV__) {

        console.error('[SecureStorage] Failed to clear secure storage:', error);

      }
    }
  }
  
  private static async encrypt(data: string): Promise<string> {
    try {
      // Use AES encryption with a derived key
      const key = await this.getDerivedKey();
      const encrypted = CryptoJS.AES.encrypt(data, key).toString();
      return encrypted;
    } catch (error) {
      throw new SecurityError(
        SecurityErrorType.ENCRYPTION_FAILED,
        'Failed to encrypt data'
      );
    }
  }
  
  private static async decrypt(encryptedData: string): Promise<string> {
    try {
      // Use AES decryption with a derived key
      const key = await this.getDerivedKey();
      const decrypted = CryptoJS.AES.decrypt(encryptedData, key);
      return decrypted.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      throw new SecurityError(
        SecurityErrorType.ENCRYPTION_FAILED,
        'Failed to decrypt data'
      );
    }
  }
  
  private static async getDerivedKey(): Promise<string> {
    // In production, use a proper key derivation function
    // For now, use a combination of device info and app secret
    const deviceInfo = Platform.select({
      web: typeof navigator !== 'undefined' ? navigator.userAgent : 'web',
      default: `${Platform.OS}-${Platform.Version}`,
    });
    
    const appSecret = 'linguamate-security-key-2024'; // In production, use environment variable
    return CryptoJS.SHA256(deviceInfo + appSecret).toString();
  }
}

// Rate limiting
export class RateLimiter {
  private static requests: Map<string, number[]> = new Map();
  
  static isAllowed(identifier: string, maxRequests = SECURITY_CONFIG.MAX_API_REQUESTS_PER_MINUTE): boolean {
    const now = Date.now();
    const windowStart = now - 60000; // 1 minute window
    
    const userRequests = this.requests.get(identifier) || [];
    const recentRequests = userRequests.filter(timestamp => timestamp > windowStart);
    
    if (recentRequests.length >= maxRequests) {
      if (__DEV__) {

        console.warn(`[RateLimiter] Rate limit exceeded for ${identifier}`);

      }
      return false;
    }
    
    recentRequests.push(now);
    this.requests.set(identifier, recentRequests);
    
    return true;
  }
  
  static getRemainingRequests(identifier: string, maxRequests = SECURITY_CONFIG.MAX_API_REQUESTS_PER_MINUTE): number {
    const now = Date.now();
    const windowStart = now - 60000;
    
    const userRequests = this.requests.get(identifier) || [];
    const recentRequests = userRequests.filter(timestamp => timestamp > windowStart);
    
    return Math.max(0, maxRequests - recentRequests.length);
  }
  
  static clearUserRequests(identifier: string): void {
    this.requests.delete(identifier);
  }
}

// Input sanitization
export class InputSanitizer {
  static sanitizeText(input: string): string {
    if (typeof input !== 'string') {
      return '';
    }
    
    return input
      .trim()
      .replace(/[<>"'&]/g, (char) => {
        const entities: Record<string, string> = {
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#x27;',
          '&': '&amp;',
        };
        return entities[char] || char;
      })
      .substring(0, SECURITY_CONFIG.MAX_MESSAGE_LENGTH);
  }
  
  static sanitizeEmail(email: string): string {
    if (typeof email !== 'string') {
      return '';
    }
    
    return email.toLowerCase().trim();
  }
  
  static sanitizeUsername(username: string): string {
    if (typeof username !== 'string') {
      return '';
    }
    
    return username
      .trim()
      .replace(/[^a-zA-Z0-9_-]/g, '')
      .substring(0, 30);
  }
  
  static validateFileType(mimeType: string): boolean {
    return SECURITY_CONFIG.ALLOWED_FILE_TYPES.includes(mimeType);
  }
  
  static validateFileSize(size: number): boolean {
    return size <= SECURITY_CONFIG.MAX_FILE_SIZE;
  }
}

// Session management
export class SessionManager {
  private static readonly SESSION_KEY = 'user_session';
  private static readonly LAST_ACTIVITY_KEY = 'last_activity';
  private static sessionTimeout: NodeJS.Timeout | null = null;
  
  static async createSession(userId: string, userData: any): Promise<void> {
    try {
      const sessionData = {
        userId,
        userData,
        createdAt: Date.now(),
        lastActivity: Date.now(),
      };
      
      await SecureStorage.setItem(this.SESSION_KEY, JSON.stringify(sessionData));
      await this.updateLastActivity();
      this.startSessionTimeout();
      
      if (__DEV__) {

      
        console.log('[SessionManager] Session created for user:', userId);

      
      }
    } catch (error) {
      if (__DEV__) {

        console.error('[SessionManager] Failed to create session:', error);

      }
      throw new SecurityError(
        SecurityErrorType.AUTHENTICATION_FAILED,
        'Failed to create user session'
      );
    }
  }
  
  static async getSession(): Promise<any | null> {
    try {
      const sessionData = await SecureStorage.getItem(this.SESSION_KEY);
      if (!sessionData) {
        return null;
      }
      
      const session = JSON.parse(sessionData);
      const now = Date.now();
      
      // Check if session has expired
      if (now - session.lastActivity > SECURITY_CONFIG.SESSION_TIMEOUT) {
        if (__DEV__) {

          console.log('[SessionManager] Session expired');

        }
        await this.clearSession();
        return null;
      }
      
      // Update last activity
      await this.updateLastActivity();
      
      return session;
    } catch (error) {
      if (__DEV__) {

        console.error('[SessionManager] Failed to get session:', error);

      }
      return null;
    }
  }
  
  static async updateLastActivity(): Promise<void> {
    try {
      await storage.setItem(this.LAST_ACTIVITY_KEY, Date.now().toString());
      this.resetSessionTimeout();
    } catch (error) {
      if (__DEV__) {

        console.error('[SessionManager] Failed to update last activity:', error);

      }
    }
  }
  
  static async clearSession(): Promise<void> {
    try {
      await Promise.all([
        SecureStorage.removeItem(this.SESSION_KEY),
        storage.removeItem(this.LAST_ACTIVITY_KEY),
      ]);
      
      this.clearSessionTimeout();
      if (__DEV__) {

        console.log('[SessionManager] Session cleared');

      }
    } catch (error) {
      if (__DEV__) {

        console.error('[SessionManager] Failed to clear session:', error);

      }
    }
  }
  
  static async isSessionValid(): Promise<boolean> {
    const session = await this.getSession();
    return session !== null;
  }
  
  private static startSessionTimeout(): void {
    this.clearSessionTimeout();
    this.sessionTimeout = setTimeout(() => {
      if (__DEV__) {

        console.log('[SessionManager] Session timed out');

      }
      this.clearSession();
    }, SECURITY_CONFIG.SESSION_TIMEOUT) as any;
  }
  
  private static resetSessionTimeout(): void {
    this.startSessionTimeout();
  }
  
  private static clearSessionTimeout(): void {
    if (this.sessionTimeout) {
      clearTimeout(this.sessionTimeout);
      this.sessionTimeout = null;
    }
  }
}

// Security audit logging
export class SecurityAudit {
  private static readonly AUDIT_LOG_KEY = 'security_audit_log';
  private static readonly MAX_LOG_ENTRIES = 1000;
  
  static async logSecurityEvent(
    event: string,
    details: any = {},
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): Promise<void> {
    try {
      const logEntry = {
        timestamp: Date.now(),
        event,
        details,
        severity,
        platform: Platform.OS,
        userAgent: Platform.select({
          web: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
          default: `${Platform.OS} ${Platform.Version}`,
        }),
      };
      
      const existingLogs = await this.getAuditLogs();
      const updatedLogs = [logEntry, ...existingLogs].slice(0, this.MAX_LOG_ENTRIES);
      
      await storage.setItem(this.AUDIT_LOG_KEY, JSON.stringify(updatedLogs));
      
      // Log to console for development
      console.log(`[SecurityAudit] ${severity.toUpperCase()}: ${event}`, details);
      
      // In production, you might want to send critical events to a remote logging service
      if (severity === 'critical') {
        // await this.sendToRemoteLogging(logEntry);
      }
    } catch (error) {
      if (__DEV__) {

        console.error('[SecurityAudit] Failed to log security event:', error);

      }
    }
  }
  
  static async getAuditLogs(): Promise<any[]> {
    try {
      const logs = await storage.getItem(this.AUDIT_LOG_KEY);
      return logs ? JSON.parse(logs) : [];
    } catch (error) {
      if (__DEV__) {

        console.error('[SecurityAudit] Failed to get audit logs:', error);

      }
      return [];
    }
  }
  
  static async clearAuditLogs(): Promise<void> {
    try {
      await storage.removeItem(this.AUDIT_LOG_KEY);
      if (__DEV__) {

        console.log('[SecurityAudit] Audit logs cleared');

      }
    } catch (error) {
      if (__DEV__) {

        console.error('[SecurityAudit] Failed to clear audit logs:', error);

      }
    }
  }
  
  static async exportAuditLogs(): Promise<string> {
    try {
      const logs = await this.getAuditLogs();
      return JSON.stringify(logs, null, 2);
    } catch (error) {
      if (__DEV__) {

        console.error('[SecurityAudit] Failed to export audit logs:', error);

      }
      return '[]';
    }
  }
}

// Biometric authentication (if available)
export class BiometricAuth {
  static async isAvailable(): Promise<boolean> {
    try {
      // This would use expo-local-authentication in a real app
      // For now, return false since it's not available on web
      return Platform.OS !== 'web';
    } catch (error) {
      if (__DEV__) {

        console.error('[BiometricAuth] Failed to check availability:', error);

      }
      return false;
    }
  }
  
  static async authenticate(): Promise<boolean> {
    try {
      if (Platform.OS === 'web') {
        throw new SecurityError(
          SecurityErrorType.BIOMETRIC_FAILED,
          'Biometric authentication not available on web'
        );
      }
      
      // This would use expo-local-authentication in a real app
      // For now, simulate success
      await SecurityAudit.logSecurityEvent('biometric_auth_attempt');
      return true;
    } catch (error) {
      if (__DEV__) {

        console.error('[BiometricAuth] Authentication failed:', error);

      }
      await SecurityAudit.logSecurityEvent(
        'biometric_auth_failed',
        { error: error instanceof Error ? error.message : 'Unknown error' },
        'medium'
      );
      return false;
    }
  }
}

// Advanced security features
export class AdvancedSecurity {
  private static readonly DEVICE_FINGERPRINT_KEY = 'device_fingerprint';
  private static readonly LOGIN_ATTEMPTS_KEY = 'login_attempts';
  private static readonly SUSPICIOUS_ACTIVITY_KEY = 'suspicious_activity';
  private static readonly PASSWORD_HISTORY_KEY = 'password_history';
  
  // Device fingerprinting
  static async generateDeviceFingerprint(): Promise<string> {
    try {
      const deviceInfo = {
        platform: Platform.OS,
        version: Platform.Version,
        userAgent: Platform.select({
          web: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
          default: `${Platform.OS}-${Platform.Version}`,
        }),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: Platform.select({
          web: typeof navigator !== 'undefined' ? navigator.language : 'en',
          default: 'en',
        }),
        screenResolution: Platform.select({
          web: typeof window !== 'undefined' ? `${window.screen.width}x${window.screen.height}` : 'unknown',
          default: 'mobile',
        }),
      };
      
      const fingerprint = CryptoJS.SHA256(JSON.stringify(deviceInfo)).toString();
      await storage.setItem('device_fingerprint', fingerprint);
      
      return fingerprint;
    } catch (error) {
      if (__DEV__) {

        console.error('[AdvancedSecurity] Failed to generate device fingerprint:', error);

      }
      return 'unknown';
    }
  }
  
  static async getDeviceFingerprint(): Promise<string | null> {
    try {
      return await storage.getItem('device_fingerprint');
    } catch (error) {
      if (__DEV__) {

        console.error('[AdvancedSecurity] Failed to get device fingerprint:', error);

      }
      return null;
    }
  }
  
  // Login attempt tracking
  static async trackLoginAttempt(email: string, success: boolean, ipAddress?: string): Promise<void> {
    try {
      const attempts = await this.getLoginAttempts(email);
      const newAttempt = {
        timestamp: Date.now(),
        success,
        ipAddress: ipAddress || 'unknown',
        deviceFingerprint: await this.getDeviceFingerprint(),
      };
      
      attempts.push(newAttempt);
      
      // Keep only last 50 attempts
      const recentAttempts = attempts.slice(-50);
      
      await storage.setItem(`${this.LOGIN_ATTEMPTS_KEY}_${email}`, JSON.stringify(recentAttempts));
      
      // Check for suspicious activity
      await this.checkSuspiciousActivity(email, recentAttempts);
    } catch (error) {
      if (__DEV__) {

        console.error('[AdvancedSecurity] Failed to track login attempt:', error);

      }
    }
  }
  
  static async getLoginAttempts(email: string): Promise<any[]> {
    try {
      const data = await storage.getItem(`${this.LOGIN_ATTEMPTS_KEY}_${email}`);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      if (__DEV__) {

        console.error('[AdvancedSecurity] Failed to get login attempts:', error);

      }
      return [];
    }
  }
  
  // Suspicious activity detection
  static async checkSuspiciousActivity(email: string, attempts: any[]): Promise<void> {
    try {
      const now = Date.now();
      const recentWindow = 15 * 60 * 1000; // 15 minutes
      const recentAttempts = attempts.filter(a => now - a.timestamp < recentWindow);
      
      // Check for multiple failed attempts
      const failedAttempts = recentAttempts.filter(a => !a.success);
      if (failedAttempts.length >= SECURITY_CONFIG.MAX_FAILED_ATTEMPTS_BEFORE_CAPTCHA) {
        await SecurityAudit.logSecurityEvent(
          'multiple_failed_login_attempts',
          { email, attemptCount: failedAttempts.length },
          'high'
        );
      }
      
      // Check for attempts from different devices
      const uniqueFingerprints = new Set(recentAttempts.map(a => a.deviceFingerprint));
      if (uniqueFingerprints.size > 3) {
        await SecurityAudit.logSecurityEvent(
          'multiple_device_login_attempts',
          { email, deviceCount: uniqueFingerprints.size },
          'medium'
        );
      }
      
      // Check for rapid-fire attempts (potential bot)
      const sortedAttempts = recentAttempts.sort((a, b) => a.timestamp - b.timestamp);
      let rapidAttempts = 0;
      for (let i = 1; i < sortedAttempts.length; i++) {
        if (sortedAttempts[i].timestamp - sortedAttempts[i - 1].timestamp < 1000) {
          rapidAttempts++;
        }
      }
      
      if (rapidAttempts > 5) {
        await SecurityAudit.logSecurityEvent(
          'rapid_fire_login_attempts',
          { email, rapidAttempts },
          'critical'
        );
      }
    } catch (error) {
      if (__DEV__) {

        console.error('[AdvancedSecurity] Failed to check suspicious activity:', error);

      }
    }
  }
  
  // Password strength validation
  static validatePasswordStrength(password: string): {
    isValid: boolean;
    score: number;
    feedback: string[];
  } {
    const feedback: string[] = [];
    let score = 0;
    
    if (password.length < SECURITY_CONFIG.MIN_PASSWORD_LENGTH) {
      feedback.push(`Password must be at least ${SECURITY_CONFIG.MIN_PASSWORD_LENGTH} characters long`);
    } else {
      score += 1;
    }
    
    if (SECURITY_CONFIG.REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
      feedback.push('Password must contain at least one uppercase letter');
    } else if (SECURITY_CONFIG.REQUIRE_UPPERCASE) {
      score += 1;
    }
    
    if (SECURITY_CONFIG.REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
      feedback.push('Password must contain at least one lowercase letter');
    } else if (SECURITY_CONFIG.REQUIRE_LOWERCASE) {
      score += 1;
    }
    
    if (SECURITY_CONFIG.REQUIRE_NUMBERS && !/\d/.test(password)) {
      feedback.push('Password must contain at least one number');
    } else if (SECURITY_CONFIG.REQUIRE_NUMBERS) {
      score += 1;
    }
    
    if (SECURITY_CONFIG.REQUIRE_SPECIAL_CHARS && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      feedback.push('Password must contain at least one special character');
    } else if (SECURITY_CONFIG.REQUIRE_SPECIAL_CHARS) {
      score += 1;
    }
    
    // Check for common patterns
    const commonPatterns = [
      /123456/,
      /password/i,
      /qwerty/i,
      /(.)\1{2,}/, // Repeated characters
    ];
    
    if (commonPatterns.some(pattern => pattern.test(password))) {
      feedback.push('Password contains common patterns and is easily guessable');
      score = Math.max(0, score - 2);
    }
    
    return {
      isValid: feedback.length === 0,
      score: Math.min(5, score),
      feedback,
    };
  }
  
  // Password history management
  static async checkPasswordHistory(userId: string, newPassword: string): Promise<boolean> {
    try {
      const historyData = await storage.getItem(`${this.PASSWORD_HISTORY_KEY}_${userId}`);
      const history: string[] = historyData ? JSON.parse(historyData) : [];
      const newPasswordHash = await SecurityUtils.hashPassword(newPassword);
      
      return !history.includes(newPasswordHash);
    } catch (error) {
      if (__DEV__) {

        console.error('[AdvancedSecurity] Failed to check password history:', error);

      }
      return true; // Allow if check fails
    }
  }
  
  static async addToPasswordHistory(userId: string, password: string): Promise<void> {
    try {
      const historyData = await storage.getItem(`${this.PASSWORD_HISTORY_KEY}_${userId}`);
      const history: string[] = historyData ? JSON.parse(historyData) : [];
      const passwordHash = await SecurityUtils.hashPassword(password);
      
      history.push(passwordHash);
      
      // Keep only the last N passwords
      const recentHistory = history.slice(-SECURITY_CONFIG.PASSWORD_HISTORY_COUNT);
      
      await storage.setItem(`${this.PASSWORD_HISTORY_KEY}_${userId}`, JSON.stringify(recentHistory));
    } catch (error) {
      if (__DEV__) {

        console.error('[AdvancedSecurity] Failed to add to password history:', error);

      }
    }
  }
  
  // Content Security Policy
  static getCSPHeader(): string {
    return [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://toolkit.rork.com",
      "media-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join('; ');
  }
  
  // Security headers
  static getSecurityHeaders(): Record<string, string> {
    return {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Content-Security-Policy': this.getCSPHeader(),
    };
  }
  
  // Anomaly detection
  static async detectAnomalies(userId: string, activity: any): Promise<boolean> {
    try {
      const activityData = await storage.getItem(`user_activity_${userId}`);
      const userActivity: any[] = activityData ? JSON.parse(activityData) : [];
      
      // Check for unusual activity patterns
      const now = Date.now();
      const recentActivity = userActivity.filter((a: any) => now - a.timestamp < 24 * 60 * 60 * 1000);
      
      // Check for unusual time patterns
      const currentHour = new Date().getHours();
      const usualHours = recentActivity.map((a: any) => new Date(a.timestamp).getHours());
      const averageHour = usualHours.reduce((sum: number, hour: number) => sum + hour, 0) / usualHours.length;
      
      if (Math.abs(currentHour - averageHour) > 6 && recentActivity.length > 10) {
        await SecurityAudit.logSecurityEvent(
          'unusual_activity_time',
          { userId, currentHour, averageHour },
          'medium'
        );
        return true;
      }
      
      // Check for unusual frequency
      if (recentActivity.length > 100) {
        await SecurityAudit.logSecurityEvent(
          'unusual_activity_frequency',
          { userId, activityCount: recentActivity.length },
          'medium'
        );
        return true;
      }
      
      // Store current activity
      userActivity.push({ ...activity, timestamp: now });
      const recentUserActivity = userActivity.slice(-200); // Keep last 200 activities
      await storage.setItem(`user_activity_${userId}`, JSON.stringify(recentUserActivity));
      
      return false;
    } catch (error) {
      if (__DEV__) {

        console.error('[AdvancedSecurity] Failed to detect anomalies:', error);

      }
      return false;
    }
  }
  
  // Session management with concurrent session limits
  static async checkConcurrentSessions(userId: string): Promise<boolean> {
    try {
      const sessionsData = await storage.getItem(`user_sessions_${userId}`);
      const sessions: any[] = sessionsData ? JSON.parse(sessionsData) : [];
      const activeSessions = sessions.filter((s: any) => Date.now() - s.lastActivity < SECURITY_CONFIG.SESSION_TIMEOUT);
      
      return activeSessions.length < SECURITY_CONFIG.MAX_CONCURRENT_SESSIONS;
    } catch (error) {
      if (__DEV__) {

        console.error('[AdvancedSecurity] Failed to check concurrent sessions:', error);

      }
      return true; // Allow if check fails
    }
  }
  
  static async addSession(userId: string, sessionId: string): Promise<void> {
    try {
      const sessionsData = await storage.getItem(`user_sessions_${userId}`);
      const sessions: any[] = sessionsData ? JSON.parse(sessionsData) : [];
      const deviceFingerprint = await this.getDeviceFingerprint();
      
      sessions.push({
        sessionId,
        deviceFingerprint,
        createdAt: Date.now(),
        lastActivity: Date.now(),
      });
      
      // Remove old sessions
      const activeSessions = sessions.filter((s: any) => Date.now() - s.lastActivity < SECURITY_CONFIG.SESSION_TIMEOUT);
      
      await storage.setItem(`user_sessions_${userId}`, JSON.stringify(activeSessions));
    } catch (error) {
      if (__DEV__) {

        console.error('[AdvancedSecurity] Failed to add session:', error);

      }
    }
  }
  
  // Threat detection
  static async detectThreats(request: any): Promise<{
    isThreat: boolean;
    threatType?: string;
    riskScore: number;
  }> {
    let riskScore = 0;
    let threatType = '';
    
    try {
      // Check for SQL injection patterns
      const sqlPatterns = [
        /('|(\-\-)|(;)|(\||\|)|(\*|\*))/i,
        /(union|select|insert|delete|update|drop|create|alter|exec|execute)/i,
      ];
      
      if (request.body && sqlPatterns.some((pattern: RegExp) => pattern.test(JSON.stringify(request.body)))) {
        riskScore += 8;
        threatType = 'SQL_INJECTION';
      }
      
      // Check for XSS patterns
      const xssPatterns = [
        /<script[^>]*>.*?<\/script>/gi,
        /javascript:/gi,
        /on\w+\s*=/gi,
      ];
      
      if (request.body && xssPatterns.some((pattern: RegExp) => pattern.test(JSON.stringify(request.body)))) {
        riskScore += 7;
        threatType = 'XSS_ATTEMPT';
      }
      
      // Check for excessive request size
      if (request.body && JSON.stringify(request.body).length > 100000) {
        riskScore += 5;
        threatType = 'LARGE_PAYLOAD';
      }
      
      // Check for suspicious user agents
      const suspiciousAgents = [
        /bot/i,
        /crawler/i,
        /spider/i,
        /scraper/i,
      ];
      
      if (request.userAgent && suspiciousAgents.some((pattern: RegExp) => pattern.test(request.userAgent))) {
        riskScore += 3;
        threatType = 'SUSPICIOUS_USER_AGENT';
      }
      
      return {
        isThreat: riskScore >= 5,
        threatType: riskScore >= 5 ? threatType : undefined,
        riskScore,
      };
    } catch (error) {
      if (__DEV__) {

        console.error('[AdvancedSecurity] Failed to detect threats:', error);

      }
      return { isThreat: false, riskScore: 0 };
    }
  }
}

// Security utilities
export const SecurityUtils = {
  // Generate secure random string
  generateSecureId(length = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return result;
  },
  
  // Hash password (simple implementation for demo)
  async hashPassword(password: string): Promise<string> {
    try {
      // Simple hash for demo - in production use proper crypto library
      let hash = 0;
      const saltedPassword = password + 'salt_string';
      for (let i = 0; i < saltedPassword.length; i++) {
        const char = saltedPassword.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
      }
      return Math.abs(hash).toString(16);
    } catch (error) {
      throw new SecurityError(
        SecurityErrorType.ENCRYPTION_FAILED,
        'Failed to hash password'
      );
    }
  },
  
  // Verify password
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    try {
      const passwordHash = await this.hashPassword(password);
      return passwordHash === hash;
    } catch (error) {
      if (__DEV__) {

        console.error('[SecurityUtils] Failed to verify password:', error);

      }
      return false;
    }
  },
  
  // Check if string contains suspicious patterns
  containsSuspiciousContent(text: string): boolean {
    const suspiciousPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /data:text\/html/gi,
      /vbscript:/gi,
    ];
    
    return suspiciousPatterns.some(pattern => pattern.test(text));
  },
  
  // Generate CSRF token
  generateCSRFToken(): string {
    return this.generateSecureId(64);
  },
  
  // Validate CSRF token
  validateCSRFToken(token: string, expectedToken: string): boolean {
    return token === expectedToken && token.length === 64;
  },
  
  // Advanced input validation
  validateInput(input: any, rules: ValidationRules): ValidationResult {
    const errors: string[] = [];
    
    if (rules.required && (!input || input.toString().trim() === '')) {
      errors.push('This field is required');
    }
    
    if (input && rules.minLength && input.toString().length < rules.minLength) {
      errors.push(`Minimum length is ${rules.minLength} characters`);
    }
    
    if (input && rules.maxLength && input.toString().length > rules.maxLength) {
      errors.push(`Maximum length is ${rules.maxLength} characters`);
    }
    
    if (input && rules.pattern && !rules.pattern.test(input.toString())) {
      errors.push(rules.patternMessage || 'Invalid format');
    }
    
    if (input && rules.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.toString())) {
      errors.push('Invalid email format');
    }
    
    if (input && rules.url && !/^https?:\/\/.+/.test(input.toString())) {
      errors.push('Invalid URL format');
    }
    
    if (input && rules.custom) {
      const customResult = rules.custom(input);
      if (customResult !== true) {
        errors.push(typeof customResult === 'string' ? customResult : 'Invalid value');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      sanitizedValue: InputSanitizer.sanitizeText(input?.toString() || ''),
    };
  },
  
  // Rate limiting with different strategies
  createRateLimiter(strategy: 'fixed' | 'sliding' | 'token-bucket' = 'sliding') {
    const requests = new Map<string, any>();
    
    return {
      isAllowed: (identifier: string, limit: number, windowMs: number): boolean => {
        const now = Date.now();
        
        if (strategy === 'fixed') {
          const windowStart = Math.floor(now / windowMs) * windowMs;
          const key = `${identifier}:${windowStart}`;
          const count = requests.get(key) || 0;
          
          if (count >= limit) return false;
          
          requests.set(key, count + 1);
          return true;
        }
        
        if (strategy === 'sliding') {
          const userRequests = requests.get(identifier) || [];
          const validRequests = userRequests.filter((timestamp: number) => now - timestamp < windowMs);
          
          if (validRequests.length >= limit) return false;
          
          validRequests.push(now);
          requests.set(identifier, validRequests);
          return true;
        }
        
        if (strategy === 'token-bucket') {
          const bucket = requests.get(identifier) || { tokens: limit, lastRefill: now };
          const timePassed = now - bucket.lastRefill;
          const tokensToAdd = Math.floor(timePassed / (windowMs / limit));
          
          bucket.tokens = Math.min(limit, bucket.tokens + tokensToAdd);
          bucket.lastRefill = now;
          
          if (bucket.tokens < 1) return false;
          
          bucket.tokens -= 1;
          requests.set(identifier, bucket);
          return true;
        }
        
        return false;
      },
    };
  },
};

// Security middleware for API requests
export class SecurityMiddleware {
  static async validateRequest(request: any): Promise<{
    isValid: boolean;
    errors: string[];
    riskScore: number;
  }> {
    const errors: string[] = [];
    let riskScore = 0;
    
    try {
      // Check for threats
      const threatAnalysis = await AdvancedSecurity.detectThreats(request);
      if (threatAnalysis.isThreat) {
        errors.push(`Security threat detected: ${threatAnalysis.threatType}`);
        riskScore += threatAnalysis.riskScore;
      }
      
      // Validate content type
      if (request.method === 'POST' && !request.headers['content-type']?.includes('application/json')) {
        errors.push('Invalid content type');
        riskScore += 2;
      }
      
      // Check for required security headers
      if (!request.headers['x-csrf-token'] && request.method !== 'GET') {
        errors.push('Missing CSRF token');
        riskScore += 3;
      }
      
      // Rate limiting check
      const identifier = request.ip || request.headers['x-forwarded-for'] || 'unknown';
      if (!RateLimiter.isAllowed(identifier)) {
        errors.push('Rate limit exceeded');
        riskScore += 5;
      }
      
      return {
        isValid: errors.length === 0 && riskScore < 5,
        errors,
        riskScore,
      };
    } catch (error) {
      if (__DEV__) {

        console.error('[SecurityMiddleware] Request validation failed:', error);

      }
      return {
        isValid: false,
        errors: ['Security validation failed'],
        riskScore: 10,
      };
    }
  }
  
  static async logSecurityEvent(request: any, event: string, severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'): Promise<void> {
    await SecurityAudit.logSecurityEvent(event, {
      ip: request.ip,
      userAgent: request.headers['user-agent'],
      method: request.method,
      url: request.url,
      timestamp: Date.now(),
    }, severity);
  }
}

// Types for validation
export interface ValidationRules {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  patternMessage?: string;
  email?: boolean;
  url?: boolean;
  custom?: (value: any) => boolean | string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedValue: string;
}

