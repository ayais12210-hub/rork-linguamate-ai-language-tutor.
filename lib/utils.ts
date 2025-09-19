import { Platform } from 'react-native';

// Utility functions for the language learning app

// Text utilities
export const textUtils = {
  capitalize: (str: string): string => {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  },

  truncate: (str: string, maxLength: number): string => {
    if (str.length <= maxLength) return str;
    return str.slice(0, maxLength - 3) + '...';
  },

  removeAccents: (str: string): string => {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  },

  isValidEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  formatPhoneNumber: (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    return phone;
  },
};

// Date utilities
export const dateUtils = {
  formatDate: (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  },

  formatTime: (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  },

  formatDateTime: (date: Date): string => {
    return `${dateUtils.formatDate(date)} at ${dateUtils.formatTime(date)}`;
  },

  isToday: (date: Date): boolean => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  },

  isYesterday: (date: Date): boolean => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return date.toDateString() === yesterday.toDateString();
  },

  daysBetween: (date1: Date, date2: Date): number => {
    const oneDay = 24 * 60 * 60 * 1000;
    return Math.round(Math.abs((date1.getTime() - date2.getTime()) / oneDay));
  },

  addDays: (date: Date, days: number): Date => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  },
};

// Number utilities
export const numberUtils = {
  formatNumber: (num: number): string => {
    return new Intl.NumberFormat('en-US').format(num);
  },

  formatCurrency: (amount: number, currency = 'USD'): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  },

  formatPercentage: (value: number, decimals = 1): string => {
    return `${(value * 100).toFixed(decimals)}%`;
  },

  clamp: (value: number, min: number, max: number): number => {
    return Math.min(Math.max(value, min), max);
  },

  randomBetween: (min: number, max: number): number => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },
};

// Array utilities
export const arrayUtils = {
  shuffle: <T>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  },

  chunk: <T>(array: T[], size: number): T[][] => {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  },

  unique: <T>(array: T[]): T[] => {
    return [...new Set(array)];
  },

  groupBy: <T, K extends keyof any>(
    array: T[],
    key: (item: T) => K
  ): Record<K, T[]> => {
    return array.reduce((groups, item) => {
      const group = key(item);
      groups[group] = groups[group] || [];
      groups[group].push(item);
      return groups;
    }, {} as Record<K, T[]>);
  },

  sample: <T>(array: T[]): T | undefined => {
    return array[Math.floor(Math.random() * array.length)];
  },
};

// Platform utilities
export const platformUtils = {
  isWeb: Platform.OS === 'web',
  isIOS: Platform.OS === 'ios',
  isAndroid: Platform.OS === 'android',
  isMobile: Platform.OS !== 'web',

  getStatusBarHeight: (): number => {
    if (Platform.OS === 'ios') {
      return 44; // Default iOS status bar height
    }
    if (Platform.OS === 'android') {
      return 24; // Default Android status bar height
    }
    return 0; // Web doesn't have status bar
  },
};

// Validation utilities
export const validationUtils = {
  isRequired: (value: any): boolean => {
    return value !== null && value !== undefined && value !== '';
  },

  minLength: (value: string, min: number): boolean => {
    return value.length >= min;
  },

  maxLength: (value: string, max: number): boolean => {
    return value.length <= max;
  },

  isNumeric: (value: string): boolean => {
    return /^\d+$/.test(value);
  },

  isAlphabetic: (value: string): boolean => {
    return /^[a-zA-Z]+$/.test(value);
  },

  isAlphanumeric: (value: string): boolean => {
    return /^[a-zA-Z0-9]+$/.test(value);
  },
};

// Debounce utility
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => func(...args), wait) as any;
  };
};

// Throttle utility
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// Deep clone utility
export const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as unknown as T;
  }
  
  if (obj instanceof Array) {
    return obj.map(item => deepClone(item)) as unknown as T;
  }
  
  if (typeof obj === 'object') {
    const cloned = {} as { [key: string]: any };
    Object.keys(obj).forEach(key => {
      cloned[key] = deepClone((obj as { [key: string]: any })[key]);
    });
    return cloned as T;
  }
  
  return obj;
};

// Generate unique ID
export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

// Sleep utility
export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Error handling utility
export const handleError = (error: unknown, context?: string): string => {
  console.error(`Error${context ? ` in ${context}` : ''}:`, error);
  
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return 'An unexpected error occurred';
};