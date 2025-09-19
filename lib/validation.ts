// Comprehensive validation utilities for the language learning app

// Validation result type
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

// Field validation rules
export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean | string;
}

// Form validation schema
export type ValidationSchema<T> = {
  [K in keyof T]?: ValidationRule;
};

// Base validator class
export class Validator {
  static validate<T extends Record<string, any>>(
    data: T,
    schema: ValidationSchema<T>
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const [field, rule] of Object.entries(schema)) {
      const value = data[field];
      const fieldErrors = this.validateField(field, value, rule as ValidationRule);
      errors.push(...fieldErrors);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  private static validateField(
    fieldName: string,
    value: any,
    rule: ValidationRule
  ): string[] {
    const errors: string[] = [];

    // Required validation
    if (rule.required && (value === null || value === undefined || value === '')) {
      errors.push(`${fieldName} is required`);
      return errors; // Skip other validations if required field is empty
    }

    // Skip other validations if field is empty and not required
    if (!rule.required && (value === null || value === undefined || value === '')) {
      return errors;
    }

    // String validations
    if (typeof value === 'string') {
      if (rule.minLength && value.length < rule.minLength) {
        errors.push(`${fieldName} must be at least ${rule.minLength} characters`);
      }

      if (rule.maxLength && value.length > rule.maxLength) {
        errors.push(`${fieldName} must not exceed ${rule.maxLength} characters`);
      }

      if (rule.pattern && !rule.pattern.test(value)) {
        errors.push(`${fieldName} format is invalid`);
      }
    }

    // Custom validation
    if (rule.custom) {
      const customResult = rule.custom(value);
      if (typeof customResult === 'string') {
        errors.push(customResult);
      } else if (!customResult) {
        errors.push(`${fieldName} is invalid`);
      }
    }

    return errors;
  }
}

// User registration validation
export const userValidation = {
  validateEmail(email: string): ValidationResult {
    const errors: string[] = [];
    
    if (!email) {
      errors.push('Email is required');
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        errors.push('Please enter a valid email address');
      }
    }

    return { isValid: errors.length === 0, errors };
  },

  validatePassword(password: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!password) {
      errors.push('Password is required');
    } else {
      if (password.length < 8) {
        errors.push('Password must be at least 8 characters long');
      }
      
      if (password.length > 128) {
        errors.push('Password must not exceed 128 characters');
      }

      if (!/(?=.*[a-z])/.test(password)) {
        warnings.push('Password should contain at least one lowercase letter');
      }

      if (!/(?=.*[A-Z])/.test(password)) {
        warnings.push('Password should contain at least one uppercase letter');
      }

      if (!/(?=.*\d)/.test(password)) {
        warnings.push('Password should contain at least one number');
      }

      if (!/(?=.*[!@#$%^&*])/.test(password)) {
        warnings.push('Password should contain at least one special character');
      }
    }

    return { isValid: errors.length === 0, errors, warnings };
  },

  validateUsername(username: string): ValidationResult {
    const errors: string[] = [];

    if (!username) {
      errors.push('Username is required');
    } else {
      if (username.length < 3) {
        errors.push('Username must be at least 3 characters long');
      }
      
      if (username.length > 30) {
        errors.push('Username must not exceed 30 characters');
      }

      if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
        errors.push('Username can only contain letters, numbers, underscores, and hyphens');
      }

      if (/^[_-]|[_-]$/.test(username)) {
        errors.push('Username cannot start or end with underscore or hyphen');
      }
    }

    return { isValid: errors.length === 0, errors };
  },

  validateName(name: string, fieldName = 'Name'): ValidationResult {
    const errors: string[] = [];

    if (!name) {
      errors.push(`${fieldName} is required`);
    } else {
      if (name.length < 2) {
        errors.push(`${fieldName} must be at least 2 characters long`);
      }
      
      if (name.length > 50) {
        errors.push(`${fieldName} must not exceed 50 characters`);
      }

      if (!/^[a-zA-Z\s'-]+$/.test(name)) {
        errors.push(`${fieldName} can only contain letters, spaces, apostrophes, and hyphens`);
      }
    }

    return { isValid: errors.length === 0, errors };
  },
};

// Learning content validation
export const learningValidation = {
  validateLanguageCode(code: string): ValidationResult {
    const errors: string[] = [];
    const validCodes = [
      'en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh',
      'ar', 'hi', 'th', 'vi', 'tr', 'pl', 'nl', 'sv', 'da', 'no'
    ];

    if (!code) {
      errors.push('Language code is required');
    } else if (!validCodes.includes(code)) {
      errors.push('Invalid language code');
    }

    return { isValid: errors.length === 0, errors };
  },

  validateDifficultyLevel(level: string): ValidationResult {
    const errors: string[] = [];
    const validLevels = ['beginner', 'intermediate', 'advanced'];

    if (!level) {
      errors.push('Difficulty level is required');
    } else if (!validLevels.includes(level)) {
      errors.push('Invalid difficulty level');
    }

    return { isValid: errors.length === 0, errors };
  },

  validateLessonContent(content: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!content) {
      errors.push('Lesson content is required');
    } else {
      if (content.length < 50) {
        warnings.push('Lesson content seems too short');
      }
      
      if (content.length > 10000) {
        errors.push('Lesson content is too long (max 10,000 characters)');
      }

      // Check for basic structure
      if (!content.includes('\n') && content.length > 200) {
        warnings.push('Consider adding line breaks for better readability');
      }
    }

    return { isValid: errors.length === 0, errors, warnings };
  },

  validateVocabularyWord(word: string, translation: string): ValidationResult {
    const errors: string[] = [];

    if (!word) {
      errors.push('Word is required');
    } else {
      if (word.length > 100) {
        errors.push('Word is too long (max 100 characters)');
      }
    }

    if (!translation) {
      errors.push('Translation is required');
    } else {
      if (translation.length > 200) {
        errors.push('Translation is too long (max 200 characters)');
      }
    }

    return { isValid: errors.length === 0, errors };
  },
};

// Chat and messaging validation
export const chatValidation = {
  validateMessage(message: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!message || message.trim().length === 0) {
      errors.push('Message cannot be empty');
    } else {
      const trimmedMessage = message.trim();
      
      if (trimmedMessage.length > 2000) {
        errors.push('Message is too long (max 2,000 characters)');
      }

      // Check for spam patterns
      if (/(..)\\1{4,}/.test(trimmedMessage)) {
        warnings.push('Message contains repetitive characters');
      }

      if (trimmedMessage.toUpperCase() === trimmedMessage && trimmedMessage.length > 20) {
        warnings.push('Avoid using all caps');
      }
    }

    return { isValid: errors.length === 0, errors, warnings };
  },

  validateChatTitle(title: string): ValidationResult {
    const errors: string[] = [];

    if (!title) {
      errors.push('Chat title is required');
    } else {
      if (title.length < 3) {
        errors.push('Chat title must be at least 3 characters long');
      }
      
      if (title.length > 100) {
        errors.push('Chat title must not exceed 100 characters');
      }
    }

    return { isValid: errors.length === 0, errors };
  },
};

// Settings validation
export const settingsValidation = {
  validateDailyGoal(goal: number): ValidationResult {
    const errors: string[] = [];

    if (goal === null || goal === undefined) {
      errors.push('Daily goal is required');
    } else {
      if (goal < 5) {
        errors.push('Daily goal must be at least 5 minutes');
      }
      
      if (goal > 480) {
        errors.push('Daily goal cannot exceed 8 hours (480 minutes)');
      }
    }

    return { isValid: errors.length === 0, errors };
  },

  validateNotificationTime(time: string): ValidationResult {
    const errors: string[] = [];
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;

    if (!time) {
      errors.push('Notification time is required');
    } else if (!timeRegex.test(time)) {
      errors.push('Invalid time format (use HH:MM)');
    }

    return { isValid: errors.length === 0, errors };
  },
};

// File validation
export const fileValidation = {
  validateImageFile(file: File | { size: number; type: string }): ValidationResult {
    const errors: string[] = [];
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

    if (!file) {
      errors.push('File is required');
    } else {
      if (file.size > maxSize) {
        errors.push('File size must not exceed 5MB');
      }

      if (!allowedTypes.includes(file.type)) {
        errors.push('File must be a valid image (JPEG, PNG, GIF, or WebP)');
      }
    }

    return { isValid: errors.length === 0, errors };
  },

  validateAudioFile(file: File | { size: number; type: string }): ValidationResult {
    const errors: string[] = [];
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      'audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/mp4',
      'audio/m4a', 'audio/webm', 'audio/ogg'
    ];

    if (!file) {
      errors.push('Audio file is required');
    } else {
      if (file.size > maxSize) {
        errors.push('Audio file size must not exceed 10MB');
      }

      if (!allowedTypes.includes(file.type)) {
        errors.push('File must be a valid audio format');
      }
    }

    return { isValid: errors.length === 0, errors };
  },
};

// Utility functions
export const validationUtils = {
  // Combine multiple validation results
  combineResults(...results: ValidationResult[]): ValidationResult {
    const allErrors: string[] = [];
    const allWarnings: string[] = [];

    for (const result of results) {
      allErrors.push(...result.errors);
      if (result.warnings) {
        allWarnings.push(...result.warnings);
      }
    }

    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings.length > 0 ? allWarnings : undefined,
    };
  },

  // Format validation errors for display
  formatErrors(errors: string[]): string {
    if (errors.length === 0) return '';
    if (errors.length === 1) return errors[0];
    return errors.map((error, index) => `${index + 1}. ${error}`).join('\n');
  },

  // Check if value is empty
  isEmpty(value: any): boolean {
    return value === null || value === undefined || value === '' || 
           (Array.isArray(value) && value.length === 0) ||
           (typeof value === 'object' && Object.keys(value).length === 0);
  },
};