// Comprehensive error handling system for the language learning app

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DebugLogger } from './debugging';

// Error types and categories
export enum ErrorType {
  // Network errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  API_ERROR = 'API_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  
  // Authentication errors
  AUTH_ERROR = 'AUTH_ERROR',
  PERMISSION_ERROR = 'PERMISSION_ERROR',
  
  // Data errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  STORAGE_ERROR = 'STORAGE_ERROR',
  PARSING_ERROR = 'PARSING_ERROR',
  
  // UI errors
  RENDER_ERROR = 'RENDER_ERROR',
  NAVIGATION_ERROR = 'NAVIGATION_ERROR',
  
  // Business logic errors
  LEARNING_ERROR = 'LEARNING_ERROR',
  CHAT_ERROR = 'CHAT_ERROR',
  
  // System errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  CRITICAL_ERROR = 'CRITICAL_ERROR',
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

// Error context interface
export interface ErrorContext {
  userId?: string;
  sessionId?: string;
  screen?: string;
  action?: string;
  timestamp: number;
  platform: string;
  appVersion: string;
  deviceInfo?: any;
  additionalData?: any;
}

// Custom error class
export class AppError extends Error {
  public readonly type: ErrorType;
  public readonly severity: ErrorSeverity;
  public readonly context: ErrorContext;
  public readonly isRecoverable: boolean;
  public readonly userMessage?: string;
  public readonly errorId: string;

  constructor(
    type: ErrorType,
    message: string,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    context: Partial<ErrorContext> = {},
    isRecoverable = true,
    userMessage?: string,
    originalError?: Error
  ) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.severity = severity;
    this.isRecoverable = isRecoverable;
    this.userMessage = userMessage;
    this.errorId = this.generateErrorId();
    
    this.context = {
      timestamp: Date.now(),
      platform: Platform.OS,
      appVersion: '1.0.0',
      ...context,
    };

    // Preserve original stack trace
    if (originalError) {
      this.stack = originalError.stack;
    }

    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }

  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Convert to JSON for logging/storage
  toJSON(): any {
    return {
      errorId: this.errorId,
      name: this.name,
      type: this.type,
      severity: this.severity,
      message: this.message,
      userMessage: this.userMessage,
      isRecoverable: this.isRecoverable,
      context: this.context,
      stack: this.stack,
    };
  }

  // Get user-friendly message
  getUserMessage(): string {
    return this.userMessage || this.getDefaultUserMessage();
  }

  private getDefaultUserMessage(): string {
    switch (this.type) {
      case ErrorType.NETWORK_ERROR:
        return 'Please check your internet connection and try again.';
      case ErrorType.API_ERROR:
        return 'Something went wrong with our servers. Please try again later.';
      case ErrorType.AUTH_ERROR:
        return 'Please sign in again to continue.';
      case ErrorType.VALIDATION_ERROR:
        return 'Please check your input and try again.';
      case ErrorType.STORAGE_ERROR:
        return 'Unable to save your data. Please try again.';
      case ErrorType.LEARNING_ERROR:
        return 'There was an issue with the lesson. Please try again.';
      case ErrorType.CHAT_ERROR:
        return 'Unable to send message. Please try again.';
      default:
        return 'Something went wrong. Please try again.';
    }
  }
}

// Error handler class
export class ErrorHandler {
  private static errorQueue: AppError[] = [];
  private static isProcessing = false;
  private static maxQueueSize = 100;
  private static retryAttempts = new Map<string, number>();
  private static maxRetryAttempts = 3;

  // Handle error with comprehensive logging and recovery
  static async handleError(
    error: Error | AppError,
    context: Partial<ErrorContext> = {},
    options: {
      showToUser?: boolean;
      logToConsole?: boolean;
      logToStorage?: boolean;
      attemptRecovery?: boolean;
    } = {}
  ): Promise<void> {
    const {
      showToUser = true,
      logToConsole = true,
      logToStorage = true,
      attemptRecovery = true,
    } = options;

    let appError: AppError;

    // Convert regular Error to AppError
    if (!(error instanceof AppError)) {
      appError = this.convertToAppError(error, context);
    } else {
      appError = error;
      // Merge additional context
      Object.assign(appError.context, context);
    }

    // Log error
    if (logToConsole) {
      console.error(`[ErrorHandler] ${appError.type}: ${appError.message}`, appError.toJSON());
    }

    if (logToStorage) {
      await this.logError(appError);
    }

    // Add to processing queue
    this.addToQueue(appError);

    // Show error to user if needed
    if (showToUser && appError.isRecoverable) {
      await this.showErrorToUser(appError);
    }

    // Attempt recovery if possible
    if (attemptRecovery && appError.isRecoverable) {
      await this.attemptRecovery(appError);
    }

    // Process error queue
    this.processErrorQueue();
  }

  // Convert regular Error to AppError
  private static convertToAppError(error: Error, context: Partial<ErrorContext>): AppError {
    let errorType = ErrorType.UNKNOWN_ERROR;
    let severity = ErrorSeverity.MEDIUM;
    let isRecoverable = true;

    // Determine error type based on error message/name
    if (error.name === 'NetworkError' || error.message.includes('network')) {
      errorType = ErrorType.NETWORK_ERROR;
    } else if (error.name === 'ValidationError') {
      errorType = ErrorType.VALIDATION_ERROR;
    } else if (error.name === 'AuthenticationError') {
      errorType = ErrorType.AUTH_ERROR;
      severity = ErrorSeverity.HIGH;
    } else if (error.name === 'TypeError' || error.name === 'ReferenceError') {
      errorType = ErrorType.CRITICAL_ERROR;
      severity = ErrorSeverity.CRITICAL;
      isRecoverable = false;
    }

    return new AppError(
      errorType,
      error.message,
      severity,
      context,
      isRecoverable,
      undefined,
      error
    );
  }

  // Log error to storage and debug system
  private static async logError(error: AppError): Promise<void> {
    try {
      // Log to debug system
      await DebugLogger.error(
        'ErrorHandler',
        `${error.type}: ${error.message}`,
        error.toJSON()
      );

      // Store in error log
      const errorLog = {
        ...error.toJSON(),
        timestamp: Date.now(),
      };

      const existingErrors = await this.getStoredErrors();
      const updatedErrors = [errorLog, ...existingErrors].slice(0, 500); // Keep last 500 errors
      await AsyncStorage.setItem('app_errors', JSON.stringify(updatedErrors));

    } catch (storageError) {
      console.error('[ErrorHandler] Failed to log error:', storageError);
    }
  }

  // Get stored errors
  static async getStoredErrors(): Promise<any[]> {
    try {
      const errors = await AsyncStorage.getItem('app_errors');
      return errors ? JSON.parse(errors) : [];
    } catch (error) {
      console.error('[ErrorHandler] Failed to get stored errors:', error);
      return [];
    }
  }

  // Add error to processing queue
  private static addToQueue(error: AppError): void {
    if (this.errorQueue.length >= this.maxQueueSize) {
      this.errorQueue.shift(); // Remove oldest error
    }
    this.errorQueue.push(error);
  }

  // Process error queue
  private static async processErrorQueue(): Promise<void> {
    if (this.isProcessing || this.errorQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      while (this.errorQueue.length > 0) {
        const error = this.errorQueue.shift();
        if (error) {
          await this.processError(error);
        }
      }
    } catch (processingError) {
      console.error('[ErrorHandler] Error processing queue:', processingError);
    } finally {
      this.isProcessing = false;
    }
  }

  // Process individual error
  private static async processError(error: AppError): Promise<void> {
    try {
      // Send to analytics/crash reporting service
      await this.sendToAnalytics(error);

      // Check for patterns or recurring errors
      await this.analyzeErrorPatterns(error);

      // Cleanup if needed
      await this.performCleanup(error);

    } catch (processingError) {
      console.error('[ErrorHandler] Failed to process error:', processingError);
    }
  }

  // Send error to analytics service
  private static async sendToAnalytics(error: AppError): Promise<void> {
    try {
      // In a real app, you would send this to your analytics service
      // For now, just log it
      console.log('[ErrorHandler] Sending to analytics:', error.errorId);
      
      // Example: await analyticsService.trackError(error.toJSON());
    } catch (error) {
      console.error('[ErrorHandler] Failed to send to analytics:', error);
    }
  }

  // Analyze error patterns
  private static async analyzeErrorPatterns(error: AppError): Promise<void> {
    try {
      const recentErrors = await this.getRecentErrors(60000); // Last minute
      const sameTypeErrors = recentErrors.filter(e => e.type === error.type);

      if (sameTypeErrors.length > 5) {
        console.warn(`[ErrorHandler] High frequency of ${error.type} errors detected`);
        
        // Log pattern detection
        await DebugLogger.warn(
          'ErrorPattern',
          `High frequency error pattern detected: ${error.type}`,
          { count: sameTypeErrors.length, timeWindow: '1 minute' }
        );
      }
    } catch (error) {
      console.error('[ErrorHandler] Failed to analyze error patterns:', error);
    }
  }

  // Get recent errors
  private static async getRecentErrors(timeWindow: number): Promise<any[]> {
    const allErrors = await this.getStoredErrors();
    const cutoffTime = Date.now() - timeWindow;
    return allErrors.filter(error => error.timestamp > cutoffTime);
  }

  // Perform cleanup based on error type
  private static async performCleanup(error: AppError): Promise<void> {
    try {
      switch (error.type) {
        case ErrorType.STORAGE_ERROR:
          // Clear corrupted cache
          await this.clearCorruptedCache();
          break;
        case ErrorType.AUTH_ERROR:
          // Clear auth tokens
          await this.clearAuthTokens();
          break;
        case ErrorType.CRITICAL_ERROR:
          // Restart app or clear all data
          await this.performCriticalCleanup();
          break;
      }
    } catch (cleanupError) {
      console.error('[ErrorHandler] Failed to perform cleanup:', cleanupError);
    }
  }

  // Show error to user
  private static async showErrorToUser(error: AppError): Promise<void> {
    try {
      // In a real app, you would show a toast, modal, or other UI element
      console.log('[ErrorHandler] Showing error to user:', error.getUserMessage());
      
      // Example: ToastService.showError(error.getUserMessage());
    } catch (error) {
      console.error('[ErrorHandler] Failed to show error to user:', error);
    }
  }

  // Attempt error recovery
  private static async attemptRecovery(error: AppError): Promise<void> {
    const attemptCount = this.retryAttempts.get(error.errorId) || 0;
    
    if (attemptCount >= this.maxRetryAttempts) {
      console.log(`[ErrorHandler] Max retry attempts reached for error: ${error.errorId}`);
      return;
    }

    this.retryAttempts.set(error.errorId, attemptCount + 1);

    try {
      switch (error.type) {
        case ErrorType.NETWORK_ERROR:
          await this.retryNetworkOperation(error);
          break;
        case ErrorType.STORAGE_ERROR:
          await this.retryStorageOperation(error);
          break;
        case ErrorType.API_ERROR:
          await this.retryApiOperation(error);
          break;
        default:
          console.log(`[ErrorHandler] No recovery strategy for error type: ${error.type}`);
      }
    } catch (recoveryError) {
      console.error('[ErrorHandler] Recovery attempt failed:', recoveryError);
    }
  }

  // Recovery strategies
  private static async retryNetworkOperation(error: AppError): Promise<void> {
    // Implement network retry logic
    console.log('[ErrorHandler] Retrying network operation...');
  }

  private static async retryStorageOperation(error: AppError): Promise<void> {
    // Implement storage retry logic
    console.log('[ErrorHandler] Retrying storage operation...');
  }

  private static async retryApiOperation(error: AppError): Promise<void> {
    // Implement API retry logic
    console.log('[ErrorHandler] Retrying API operation...');
  }

  // Cleanup methods
  private static async clearCorruptedCache(): Promise<void> {
    try {
      // Clear specific cache keys that might be corrupted
      const cacheKeys = ['user_cache', 'lesson_cache', 'chat_cache'];
      await Promise.all(cacheKeys.map(key => AsyncStorage.removeItem(key)));
      console.log('[ErrorHandler] Corrupted cache cleared');
    } catch (error) {
      console.error('[ErrorHandler] Failed to clear corrupted cache:', error);
    }
  }

  private static async clearAuthTokens(): Promise<void> {
    try {
      // Clear authentication tokens
      const authKeys = ['access_token', 'refresh_token', 'user_session'];
      await Promise.all(authKeys.map(key => AsyncStorage.removeItem(key)));
      console.log('[ErrorHandler] Auth tokens cleared');
    } catch (error) {
      console.error('[ErrorHandler] Failed to clear auth tokens:', error);
    }
  }

  private static async performCriticalCleanup(): Promise<void> {
    try {
      // Clear all app data except essential user preferences
      const allKeys = await AsyncStorage.getAllKeys();
      const keysToKeep = ['user_preferences', 'language_settings'];
      const keysToRemove = allKeys.filter(key => !keysToKeep.includes(key));
      
      await AsyncStorage.multiRemove(keysToRemove);
      console.log('[ErrorHandler] Critical cleanup performed');
    } catch (error) {
      console.error('[ErrorHandler] Failed to perform critical cleanup:', error);
    }
  }

  // Clear all error data
  static async clearErrorData(): Promise<void> {
    try {
      await AsyncStorage.removeItem('app_errors');
      this.errorQueue = [];
      this.retryAttempts.clear();
      console.log('[ErrorHandler] Error data cleared');
    } catch (error) {
      console.error('[ErrorHandler] Failed to clear error data:', error);
    }
  }

  // Get error statistics
  static async getErrorStatistics(): Promise<{
    totalErrors: number;
    errorsByType: Record<string, number>;
    errorsBySeverity: Record<string, number>;
    recentErrors: number;
  }> {
    try {
      const allErrors = await this.getStoredErrors();
      const recentErrors = await this.getRecentErrors(24 * 60 * 60 * 1000); // Last 24 hours

      const errorsByType = allErrors.reduce((acc, error) => {
        acc[error.type] = (acc[error.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const errorsBySeverity = allErrors.reduce((acc, error) => {
        acc[error.severity] = (acc[error.severity] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        totalErrors: allErrors.length,
        errorsByType,
        errorsBySeverity,
        recentErrors: recentErrors.length,
      };
    } catch (error) {
      console.error('[ErrorHandler] Failed to get error statistics:', error);
      return {
        totalErrors: 0,
        errorsByType: {},
        errorsBySeverity: {},
        recentErrors: 0,
      };
    }
  }
}

// Error boundary helper
export class ErrorBoundaryHelper {
  static createErrorInfo(error: Error, errorInfo: any): AppError {
    return new AppError(
      ErrorType.RENDER_ERROR,
      error.message,
      ErrorSeverity.HIGH,
      {
        screen: 'Unknown',
        additionalData: {
          componentStack: errorInfo.componentStack,
          errorBoundary: true,
        },
      },
      true,
      'Something went wrong while loading this screen.',
      error
    );
  }

  static async handleBoundaryError(error: Error, errorInfo: any): Promise<void> {
    const appError = this.createErrorInfo(error, errorInfo);
    await ErrorHandler.handleError(appError, {}, { showToUser: true });
  }
}

// Utility functions for common error scenarios
export const ErrorUtils = {
  // Create network error
  createNetworkError(message: string, context?: Partial<ErrorContext>): AppError {
    return new AppError(
      ErrorType.NETWORK_ERROR,
      message,
      ErrorSeverity.MEDIUM,
      context,
      true,
      'Please check your internet connection and try again.'
    );
  },

  // Create validation error
  createValidationError(message: string, context?: Partial<ErrorContext>): AppError {
    return new AppError(
      ErrorType.VALIDATION_ERROR,
      message,
      ErrorSeverity.LOW,
      context,
      true,
      'Please check your input and try again.'
    );
  },

  // Create auth error
  createAuthError(message: string, context?: Partial<ErrorContext>): AppError {
    return new AppError(
      ErrorType.AUTH_ERROR,
      message,
      ErrorSeverity.HIGH,
      context,
      true,
      'Please sign in again to continue.'
    );
  },

  // Create API error
  createApiError(message: string, statusCode?: number, context?: Partial<ErrorContext>): AppError {
    const severity = statusCode && statusCode >= 500 ? ErrorSeverity.HIGH : ErrorSeverity.MEDIUM;
    return new AppError(
      ErrorType.API_ERROR,
      message,
      severity,
      { ...context, additionalData: { statusCode } },
      true,
      'Something went wrong with our servers. Please try again later.'
    );
  },

  // Wrap async function with error handling
  async withErrorHandling<T>(
    fn: () => Promise<T>,
    context: Partial<ErrorContext> = {}
  ): Promise<T | null> {
    try {
      return await fn();
    } catch (error) {
      await ErrorHandler.handleError(error as Error, context);
      return null;
    }
  },

  // Advanced error utilities
  createTimeoutError(operation: string, timeout: number, context?: Partial<ErrorContext>): AppError {
    return new AppError(
      ErrorType.TIMEOUT_ERROR,
      `Operation '${operation}' timed out after ${timeout}ms`,
      ErrorSeverity.MEDIUM,
      context,
      true,
      'The operation took too long to complete. Please try again.'
    );
  },

  createStorageError(message: string, context?: Partial<ErrorContext>): AppError {
    return new AppError(
      ErrorType.STORAGE_ERROR,
      message,
      ErrorSeverity.MEDIUM,
      context,
      true,
      'Unable to save or load data. Please try again.'
    );
  },

  createLearningError(message: string, context?: Partial<ErrorContext>): AppError {
    return new AppError(
      ErrorType.LEARNING_ERROR,
      message,
      ErrorSeverity.LOW,
      context,
      true,
      'There was an issue with the lesson. Please try again.'
    );
  },

  createChatError(message: string, context?: Partial<ErrorContext>): AppError {
    return new AppError(
      ErrorType.CHAT_ERROR,
      message,
      ErrorSeverity.MEDIUM,
      context,
      true,
      'Unable to send or receive messages. Please check your connection.'
    );
  },

  // Error recovery utilities
  async withRetry<T>(
    fn: () => Promise<T>,
    maxRetries = 3,
    delay = 1000,
    context: Partial<ErrorContext> = {}
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          await ErrorHandler.handleError(lastError, {
            ...context,
            additionalData: { attempt, maxRetries },
          });
          throw lastError;
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
    
    throw lastError!;
  },

  // Circuit breaker pattern for error handling
  createCircuitBreaker<T>(
    fn: () => Promise<T>,
    options: {
      failureThreshold?: number;
      resetTimeout?: number;
      monitoringPeriod?: number;
    } = {}
  ): () => Promise<T> {
    const {
      failureThreshold = 5,
      resetTimeout = 60000, // 1 minute
      monitoringPeriod = 10000, // 10 seconds
    } = options;
    
    let failures = 0;
    let lastFailureTime = 0;
    let state: 'closed' | 'open' | 'half-open' = 'closed';
    
    return async (): Promise<T> => {
      const now = Date.now();
      
      // Reset failures if monitoring period has passed
      if (now - lastFailureTime > monitoringPeriod) {
        failures = 0;
      }
      
      // Check if circuit should be reset
      if (state === 'open' && now - lastFailureTime > resetTimeout) {
        state = 'half-open';
      }
      
      // Reject if circuit is open
      if (state === 'open') {
        throw this.createNetworkError('Circuit breaker is open - too many failures');
      }
      
      try {
        const result = await fn();
        
        // Reset on success
        if (state === 'half-open') {
          state = 'closed';
          failures = 0;
        }
        
        return result;
      } catch (error) {
        failures++;
        lastFailureTime = now;
        
        // Open circuit if threshold reached
        if (failures >= failureThreshold) {
          state = 'open';
        }
        
        throw error;
      }
    };
  },

  // Bulk error handling
  async handleMultipleErrors(
    errors: { error: Error; context?: Partial<ErrorContext> }[],
    options: {
      showToUser?: boolean;
      logToConsole?: boolean;
      logToStorage?: boolean;
    } = {}
  ): Promise<void> {
    const promises = errors.map(({ error, context }) =>
      ErrorHandler.handleError(error, context, options)
    );
    
    await Promise.allSettled(promises);
  },

  // Error aggregation
  async getErrorSummary(timeWindow = 24 * 60 * 60 * 1000): Promise<{
    totalErrors: number;
    criticalErrors: number;
    recoverableErrors: number;
    topErrorTypes: { type: string; count: number }[];
    errorTrends: { hour: number; count: number }[];
  }> {
    try {
      const errors = await ErrorHandler.getStoredErrors();
      const cutoffTime = Date.now() - timeWindow;
      const recentErrors = errors.filter(error => error.timestamp > cutoffTime);
      
      const criticalErrors = recentErrors.filter(error => 
        error.severity === ErrorSeverity.CRITICAL
      ).length;
      
      const recoverableErrors = recentErrors.filter(error => 
        error.isRecoverable
      ).length;
      
      // Count errors by type
      const errorTypeCounts = recentErrors.reduce((acc, error) => {
        acc[error.type] = (acc[error.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const topErrorTypes = Object.entries(errorTypeCounts)
        .map(([type, count]) => ({ type, count: count as number }))
        .sort((a, b) => (b.count as number) - (a.count as number))
        .slice(0, 5);
      
      // Error trends by hour
      const errorTrends = Array.from({ length: 24 }, (_, hour) => {
        const hourStart = Date.now() - (hour + 1) * 60 * 60 * 1000;
        const hourEnd = Date.now() - hour * 60 * 60 * 1000;
        const count = recentErrors.filter(error => 
          error.timestamp >= hourStart && error.timestamp < hourEnd
        ).length;
        
        return { hour: 23 - hour, count };
      });
      
      return {
        totalErrors: recentErrors.length,
        criticalErrors,
        recoverableErrors,
        topErrorTypes,
        errorTrends,
      };
    } catch (error) {
      console.error('[ErrorUtils] Failed to get error summary:', error);
      return {
        totalErrors: 0,
        criticalErrors: 0,
        recoverableErrors: 0,
        topErrorTypes: [],
        errorTrends: [],
      };
    }
  },
};

// Advanced error recovery strategies
export class ErrorRecoveryManager {
  private static recoveryStrategies: Map<ErrorType, Function[]> = new Map();
  private static recoveryHistory: Map<string, number> = new Map();
  
  // Register recovery strategy for error type
  static registerRecoveryStrategy(errorType: ErrorType, strategy: Function): void {
    if (!this.recoveryStrategies.has(errorType)) {
      this.recoveryStrategies.set(errorType, []);
    }
    this.recoveryStrategies.get(errorType)!.push(strategy);
  }
  
  // Execute recovery strategies
  static async executeRecovery(error: AppError): Promise<boolean> {
    const strategies = this.recoveryStrategies.get(error.type);
    if (!strategies || strategies.length === 0) {
      return false;
    }
    
    const recoveryKey = `${error.type}_${error.context.screen || 'unknown'}`;
    const previousAttempts = this.recoveryHistory.get(recoveryKey) || 0;
    
    // Limit recovery attempts
    if (previousAttempts >= 3) {
      await DebugLogger.warn(
        'ErrorRecovery',
        `Max recovery attempts reached for ${error.type}`,
        { errorId: error.errorId, attempts: previousAttempts }
      );
      return false;
    }
    
    this.recoveryHistory.set(recoveryKey, previousAttempts + 1);
    
    for (const strategy of strategies) {
      try {
        const success = await strategy(error);
        if (success) {
          await DebugLogger.info(
            'ErrorRecovery',
            `Recovery successful for ${error.type}`,
            { errorId: error.errorId, strategy: strategy.name }
          );
          
          // Reset recovery count on success
          this.recoveryHistory.delete(recoveryKey);
          return true;
        }
      } catch (recoveryError) {
        await DebugLogger.error(
          'ErrorRecovery',
          `Recovery strategy failed for ${error.type}`,
          { errorId: error.errorId, strategy: strategy.name },
          recoveryError as Error
        );
      }
    }
    
    return false;
  }
  
  // Clear recovery history
  static clearRecoveryHistory(): void {
    this.recoveryHistory.clear();
  }
  
  // Get recovery statistics
  static getRecoveryStats(): {
    totalAttempts: number;
    strategiesByType: Record<string, number>;
    successRate: number;
  } {
    const totalAttempts = Array.from(this.recoveryHistory.values())
      .reduce((sum, attempts) => sum + attempts, 0);
    
    const strategiesByType = Array.from(this.recoveryStrategies.entries())
      .reduce((acc, [type, strategies]) => {
        acc[type] = strategies.length;
        return acc;
      }, {} as Record<string, number>);
    
    // Calculate success rate (simplified)
    const successfulRecoveries = Array.from(this.recoveryHistory.entries())
      .filter(([, attempts]) => attempts < 3).length;
    
    const successRate = totalAttempts > 0 ? successfulRecoveries / totalAttempts : 0;
    
    return {
      totalAttempts,
      strategiesByType,
      successRate,
    };
  }
}

// Initialize default recovery strategies
ErrorRecoveryManager.registerRecoveryStrategy(
  ErrorType.NETWORK_ERROR,
  async (error: AppError) => {
    // Retry network operation after delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    return true; // Simplified - in real app, retry the actual operation
  }
);

ErrorRecoveryManager.registerRecoveryStrategy(
  ErrorType.STORAGE_ERROR,
  async (error: AppError) => {
    // Clear corrupted storage and retry
    try {
      await AsyncStorage.clear();
      return true;
    } catch {
      return false;
    }
  }
);

ErrorRecoveryManager.registerRecoveryStrategy(
  ErrorType.AUTH_ERROR,
  async (error: AppError) => {
    // Clear auth tokens and redirect to login
    try {
      await AsyncStorage.multiRemove(['access_token', 'refresh_token']);
      return true;
    } catch {
      return false;
    }
  }
);

