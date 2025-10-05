import { useState, useEffect, useCallback } from 'react';
import { Platform, Alert } from 'react-native';
import {
  SECURITY_CONFIG,
  SecurityError,
  SecurityErrorType,
  TokenManager,
  SessionManager,
  SecurityAudit,
  AdvancedSecurity,
  SecurityUtils,
  InputSanitizer,
  RateLimiter,
  BiometricAuth,
  ValidationRules,
  ValidationResult,
} from '@/lib/security';

export interface SecurityState {
  isAuthenticated: boolean;
  sessionValid: boolean;
  deviceFingerprint: string | null;
  securityLevel: 'low' | 'medium' | 'high';
  threatDetected: boolean;
  biometricAvailable: boolean;
  rateLimitExceeded: boolean;
}

export interface SecurityActions {
  // Authentication
  authenticate: (credentials: { email: string; password: string }) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
  
  // Security validation
  validateInput: (input: any, rules: ValidationRules) => ValidationResult;
  sanitizeText: (text: string) => string;
  checkPasswordStrength: (password: string) => { isValid: boolean; score: number; feedback: string[] };
  
  // Device security
  generateDeviceFingerprint: () => Promise<string>;
  checkDeviceSecurity: () => Promise<boolean>;
  
  // Biometric authentication
  authenticateWithBiometrics: () => Promise<boolean>;
  
  // Threat detection
  detectThreats: (data: any) => Promise<{ isThreat: boolean; threatType?: string; riskScore: number }>;
  
  // Rate limiting
  checkRateLimit: (identifier: string) => boolean;
  
  // Security logging
  logSecurityEvent: (event: string, details?: any, severity?: 'low' | 'medium' | 'high' | 'critical') => Promise<void>;
  
  // Password management
  checkPasswordHistory: (userId: string, password: string) => Promise<boolean>;
  addToPasswordHistory: (userId: string, password: string) => Promise<void>;
  
  // Session management
  checkConcurrentSessions: (userId: string) => Promise<boolean>;
  addSession: (userId: string, sessionId: string) => Promise<void>;
  
  // Anomaly detection
  detectAnomalies: (userId: string, activity: any) => Promise<boolean>;
}

export const useSecurity = (): SecurityState & SecurityActions => {
  const [securityState, setSecurityState] = useState<SecurityState>({
    isAuthenticated: false,
    sessionValid: false,
    deviceFingerprint: null,
    securityLevel: 'medium',
    threatDetected: false,
    biometricAvailable: false,
    rateLimitExceeded: false,
  });

  // Initialize security state
  useEffect(() => {
    initializeSecurity();
  }, []);

  const initializeSecurity = useCallback(async () => {
    try {
      if (__DEV__) {

        console.log('[useSecurity] Initializing security...');

      }
      
      // Check session validity
      const sessionValid = await SessionManager.isSessionValid();
      
      // Generate device fingerprint
      const deviceFingerprint = await AdvancedSecurity.generateDeviceFingerprint();
      
      // Check biometric availability
      const biometricAvailable = await BiometricAuth.isAvailable();
      
      // Determine security level based on device and session
      const securityLevel = determineSecurityLevel(sessionValid, biometricAvailable);
      
      setSecurityState(prev => ({
        ...prev,
        sessionValid,
        deviceFingerprint,
        biometricAvailable,
        securityLevel,
        isAuthenticated: sessionValid,
      }));
      
      // Log security initialization
      await SecurityAudit.logSecurityEvent('security_initialized', {
        deviceFingerprint,
        biometricAvailable,
        securityLevel,
        platform: Platform.OS,
      });
      
      if (__DEV__) {

      
        console.log('[useSecurity] Security initialized successfully');

      
      }
    } catch (error) {
      if (__DEV__) {

        console.error('[useSecurity] Failed to initialize security:', error);

      }
      await SecurityAudit.logSecurityEvent(
        'security_initialization_failed',
        { error: error instanceof Error ? error.message : 'Unknown error' },
        'high'
      );
    }
  }, []);

  const determineSecurityLevel = (sessionValid: boolean, biometricAvailable: boolean): 'low' | 'medium' | 'high' => {
    if (sessionValid && biometricAvailable && Platform.OS !== 'web') {
      return 'high';
    } else if (sessionValid || biometricAvailable) {
      return 'medium';
    }
    return 'low';
  };

  const authenticate = useCallback(async (credentials: { email: string; password: string }): Promise<boolean> => {
    try {
      if (__DEV__) {

        console.log('[useSecurity] Authenticating user...');

      }
      
      // Sanitize inputs
      const sanitizedEmail = InputSanitizer.sanitizeEmail(credentials.email);
      const sanitizedPassword = credentials.password.trim();
      
      // Validate inputs
      if (!sanitizedEmail || !sanitizedPassword) {
        throw new SecurityError(SecurityErrorType.INVALID_INPUT, 'Invalid credentials provided');
      }
      
      // Check rate limiting
      if (!RateLimiter.isAllowed(sanitizedEmail, SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS)) {
        setSecurityState(prev => ({ ...prev, rateLimitExceeded: true }));
        throw new SecurityError(SecurityErrorType.RATE_LIMIT_EXCEEDED, 'Too many login attempts');
      }
      
      // Track login attempt
      await AdvancedSecurity.trackLoginAttempt(sanitizedEmail, false);
      
      // Simulate authentication (replace with actual auth logic)
      const authSuccess = await simulateAuthentication(sanitizedEmail, sanitizedPassword);
      
      if (authSuccess) {
        // Create session
        await SessionManager.createSession('user_id', { email: sanitizedEmail });
        
        // Track successful login
        await AdvancedSecurity.trackLoginAttempt(sanitizedEmail, true);
        
        // Update state
        setSecurityState(prev => ({
          ...prev,
          isAuthenticated: true,
          sessionValid: true,
          rateLimitExceeded: false,
        }));
        
        // Log successful authentication
        await SecurityAudit.logSecurityEvent('user_authenticated', { email: sanitizedEmail });
        
        if (__DEV__) {

        
          console.log('[useSecurity] Authentication successful');

        
        }
        return true;
      } else {
        throw new SecurityError(SecurityErrorType.AUTHENTICATION_FAILED, 'Invalid credentials');
      }
    } catch (error) {
      if (__DEV__) {

        console.error('[useSecurity] Authentication failed:', error);

      }
      
      if (error instanceof SecurityError) {
        await SecurityAudit.logSecurityEvent(
          'authentication_failed',
          { 
            email: credentials.email,
            errorType: error.type,
            message: error.message 
          },
          'medium'
        );
        
        // Show user-friendly error
        if (Platform.OS !== 'web') {
          Alert.alert('Authentication Failed', error.message);
        }
      }
      
      return false;
    }
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    try {
      if (__DEV__) {

        console.log('[useSecurity] Logging out user...');

      }
      
      // Clear session
      await SessionManager.clearSession();
      
      // Clear tokens
      await TokenManager.clearTokens();
      
      // Update state
      setSecurityState(prev => ({
        ...prev,
        isAuthenticated: false,
        sessionValid: false,
        rateLimitExceeded: false,
      }));
      
      // Log logout
      await SecurityAudit.logSecurityEvent('user_logged_out');
      
      if (__DEV__) {

      
        console.log('[useSecurity] Logout successful');

      
      }
    } catch (error) {
      if (__DEV__) {

        console.error('[useSecurity] Logout failed:', error);

      }
      await SecurityAudit.logSecurityEvent(
        'logout_failed',
        { error: error instanceof Error ? error.message : 'Unknown error' },
        'medium'
      );
    }
  }, []);

  const refreshSession = useCallback(async (): Promise<boolean> => {
    try {
      const sessionValid = await SessionManager.isSessionValid();
      
      setSecurityState(prev => ({
        ...prev,
        sessionValid,
        isAuthenticated: sessionValid,
      }));
      
      return sessionValid;
    } catch (error) {
      if (__DEV__) {

        console.error('[useSecurity] Session refresh failed:', error);

      }
      return false;
    }
  }, []);

  const validateInput = useCallback((input: any, rules: ValidationRules): ValidationResult => {
    return SecurityUtils.validateInput(input, rules);
  }, []);

  const sanitizeText = useCallback((text: string): string => {
    return InputSanitizer.sanitizeText(text);
  }, []);

  const checkPasswordStrength = useCallback((password: string) => {
    return AdvancedSecurity.validatePasswordStrength(password);
  }, []);

  const generateDeviceFingerprint = useCallback(async (): Promise<string> => {
    const fingerprint = await AdvancedSecurity.generateDeviceFingerprint();
    setSecurityState(prev => ({ ...prev, deviceFingerprint: fingerprint }));
    return fingerprint;
  }, []);

  const checkDeviceSecurity = useCallback(async (): Promise<boolean> => {
    try {
      // Check for rooted/jailbroken device (simplified check)
      const isSecure = Platform.select({
        web: true, // Web is considered secure for this demo
        default: true, // In production, implement proper device security checks
      });
      
      if (!isSecure) {
        await SecurityAudit.logSecurityEvent(
          'device_compromised',
          { platform: Platform.OS },
          'critical'
        );
        
        setSecurityState(prev => ({ ...prev, securityLevel: 'low' }));
      }
      
      return isSecure;
    } catch (error) {
      if (__DEV__) {

        console.error('[useSecurity] Device security check failed:', error);

      }
      return false;
    }
  }, []);

  const authenticateWithBiometrics = useCallback(async (): Promise<boolean> => {
    try {
      if (!securityState.biometricAvailable) {
        throw new SecurityError(SecurityErrorType.BIOMETRIC_FAILED, 'Biometric authentication not available');
      }
      
      const success = await BiometricAuth.authenticate();
      
      if (success) {
        await SecurityAudit.logSecurityEvent('biometric_auth_success');
        setSecurityState(prev => ({ ...prev, securityLevel: 'high' }));
      }
      
      return success;
    } catch (error) {
      if (__DEV__) {

        console.error('[useSecurity] Biometric authentication failed:', error);

      }
      return false;
    }
  }, [securityState.biometricAvailable]);

  const detectThreats = useCallback(async (data: any) => {
    const result = await AdvancedSecurity.detectThreats(data);
    
    if (result.isThreat) {
      setSecurityState(prev => ({ ...prev, threatDetected: true }));
      await SecurityAudit.logSecurityEvent(
        'threat_detected',
        { threatType: result.threatType, riskScore: result.riskScore },
        'high'
      );
    }
    
    return result;
  }, []);

  const checkRateLimit = useCallback((identifier: string): boolean => {
    const allowed = RateLimiter.isAllowed(identifier);
    
    if (!allowed) {
      setSecurityState(prev => ({ ...prev, rateLimitExceeded: true }));
    }
    
    return allowed;
  }, []);

  const logSecurityEvent = useCallback(async (
    event: string,
    details: any = {},
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): Promise<void> => {
    await SecurityAudit.logSecurityEvent(event, details, severity);
  }, []);

  const checkPasswordHistory = useCallback(async (userId: string, password: string): Promise<boolean> => {
    return await AdvancedSecurity.checkPasswordHistory(userId, password);
  }, []);

  const addToPasswordHistory = useCallback(async (userId: string, password: string): Promise<void> => {
    await AdvancedSecurity.addToPasswordHistory(userId, password);
  }, []);

  const checkConcurrentSessions = useCallback(async (userId: string): Promise<boolean> => {
    return await AdvancedSecurity.checkConcurrentSessions(userId);
  }, []);

  const addSession = useCallback(async (userId: string, sessionId: string): Promise<void> => {
    await AdvancedSecurity.addSession(userId, sessionId);
  }, []);

  const detectAnomalies = useCallback(async (userId: string, activity: any): Promise<boolean> => {
    const anomalyDetected = await AdvancedSecurity.detectAnomalies(userId, activity);
    
    if (anomalyDetected) {
      setSecurityState(prev => ({ ...prev, securityLevel: 'low' }));
      
      if (SECURITY_CONFIG.FORCE_LOGOUT_ON_SUSPICIOUS_ACTIVITY) {
        await logout();
      }
    }
    
    return anomalyDetected;
  }, [logout]);

  // Simulate authentication for demo purposes
  const simulateAuthentication = async (email: string, password: string): Promise<boolean> => {
    // In a real app, this would make an API call to your authentication service
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
    
    // For demo, accept any email with password length >= 8
    return password.length >= 8;
  };

  return {
    // State
    ...securityState,
    
    // Actions
    authenticate,
    logout,
    refreshSession,
    validateInput,
    sanitizeText,
    checkPasswordStrength,
    generateDeviceFingerprint,
    checkDeviceSecurity,
    authenticateWithBiometrics,
    detectThreats,
    checkRateLimit,
    logSecurityEvent,
    checkPasswordHistory,
    addToPasswordHistory,
    checkConcurrentSessions,
    addSession,
    detectAnomalies,
  };
};

export default useSecurity;