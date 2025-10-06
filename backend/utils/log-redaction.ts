/**
 * Log redaction utilities to prevent sensitive data leakage
 */

// Patterns for sensitive data
const SENSITIVE_PATTERNS = [
  // JWT tokens
  /Bearer\s+[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+/gi,
  /jwt["\s:=]+[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+/gi,
  
  // API keys
  /api[_\-]?key["\s:=]+[\w\-]+/gi,
  /key["\s:=]+[\w]{20,}/gi,
  
  // Passwords
  /password["\s:=]+[^",\s}]+/gi,
  /pwd["\s:=]+[^",\s}]+/gi,
  /pass["\s:=]+[^",\s}]+/gi,
  
  // Secrets
  /secret["\s:=]+[^",\s}]+/gi,
  /private[_\-]?key["\s:=]+[^",\s}]+/gi,
  
  // Credit cards
  /\b\d{4}[\s\-]?\d{4}[\s\-]?\d{4}[\s\-]?\d{4}\b/g,
  
  // SSN
  /\b\d{3}-\d{2}-\d{4}\b/g,
  
  // Email addresses (optional - uncomment if needed)
  // /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
];

// Fields to redact in objects
const SENSITIVE_FIELDS = new Set([
  'password',
  'pwd',
  'pass',
  'secret',
  'token',
  'jwt',
  'authorization',
  'auth',
  'apikey',
  'api_key',
  'apiKey',
  'private_key',
  'privateKey',
  'credit_card',
  'creditCard',
  'card_number',
  'cardNumber',
  'cvv',
  'cvc',
  'ssn',
  'social_security_number',
  'socialSecurityNumber',
]);

/**
 * Redact sensitive data from a string
 */
export function redactString(str: string): string {
  let redacted = str;
  
  for (const pattern of SENSITIVE_PATTERNS) {
    redacted = redacted.replace(pattern, '[REDACTED]');
  }
  
  return redacted;
}

/**
 * Deep redact sensitive fields from an object
 */
export function redactObject<T>(obj: T, depth = 10): T {
  if (depth <= 0) {
    return '[MAX_DEPTH_REACHED]' as any;
  }
  
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  // Handle primitives
  if (typeof obj !== 'object') {
    return typeof obj === 'string' ? redactString(obj) as any : obj;
  }
  
  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => redactObject(item, depth - 1)) as any;
  }
  
  // Handle objects
  const redacted: any = {};
  
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    
    // Check if field should be redacted
    if (SENSITIVE_FIELDS.has(lowerKey)) {
      redacted[key] = '[REDACTED]';
      continue;
    }
    
    // Check for partial matches
    const isSensitive = Array.from(SENSITIVE_FIELDS).some(field => 
      lowerKey.includes(field)
    );
    
    if (isSensitive) {
      redacted[key] = '[REDACTED]';
      continue;
    }
    
    // Recursively redact nested objects
    redacted[key] = redactObject(value, depth - 1);
  }
  
  return redacted;
}

/**
 * Redact sensitive data from error objects
 */
export function redactError(error: Error): Error {
  const redactedError = new Error(redactString(error.message));
  redactedError.name = error.name;
  redactedError.stack = error.stack ? redactString(error.stack) : undefined;
  
  // Copy other properties
  for (const key of Object.keys(error)) {
    if (key !== 'message' && key !== 'name' && key !== 'stack') {
      (redactedError as any)[key] = redactObject((error as any)[key]);
    }
  }
  
  return redactedError;
}

/**
 * Create a redacted logger that automatically redacts sensitive data
 */
export function createRedactedLogger(baseLogger: any) {
  const redactArgs = (args: any[]) => {
    return args.map(arg => {
      if (typeof arg === 'string') {
        return redactString(arg);
      }
      if (arg instanceof Error) {
        return redactError(arg);
      }
      if (typeof arg === 'object') {
        return redactObject(arg);
      }
      return arg;
    });
  };
  
  return {
    trace: (...args: any[]) => baseLogger.trace(...redactArgs(args)),
    debug: (...args: any[]) => baseLogger.debug(...redactArgs(args)),
    info: (...args: any[]) => baseLogger.info(...redactArgs(args)),
    warn: (...args: any[]) => baseLogger.warn(...redactArgs(args)),
    error: (...args: any[]) => baseLogger.error(...redactArgs(args)),
    fatal: (...args: any[]) => baseLogger.fatal(...redactArgs(args)),
    child: (bindings: any) => createRedactedLogger(baseLogger.child(redactObject(bindings))),
  };
}

/**
 * Middleware to redact sensitive headers
 */
export function redactHeaders(headers: Record<string, string>): Record<string, string> {
  const redacted = { ...headers };
  
  const sensitiveHeaders = [
    'authorization',
    'cookie',
    'x-api-key',
    'x-auth-token',
    'x-csrf-token',
  ];
  
  for (const header of sensitiveHeaders) {
    if (redacted[header]) {
      redacted[header] = '[REDACTED]';
    }
    
    // Check case-insensitive
    const key = Object.keys(redacted).find(k => k.toLowerCase() === header);
    if (key) {
      redacted[key] = '[REDACTED]';
    }
  }
  
  return redacted;
}