/**
 * Utility for redacting sensitive information from logs and error messages
 */

const SENSITIVE_PATTERNS = [
  // Tokens and API keys
  /bearer\s+[a-zA-Z0-9._-]+/gi,
  /api[_-]?key[:\s=]+[a-zA-Z0-9._-]+/gi,
  /token[:\s=]+[a-zA-Z0-9._-]+/gi,
  /secret[:\s=]+[a-zA-Z0-9._-]+/gi,
  
  // JWT tokens
  /eyJ[a-zA-Z0-9._-]+/g,
  
  // Passwords
  /password[:\s=]+[^\s&]+/gi,
  /passwd[:\s=]+[^\s&]+/gi,
  /pwd[:\s=]+[^\s&]+/gi,
  
  // Email addresses (partial redaction)
  /([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
  
  // Phone numbers
  /\+?1?[-.\s]?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/g,
  
  // Credit card numbers
  /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
  
  // Social security numbers
  /\b\d{3}-?\d{2}-?\d{4}\b/g,
  
  // IP addresses (partial redaction)
  /\b(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})\b/g
];

const SENSITIVE_FIELD_NAMES = [
  'password',
  'passwd',
  'pwd',
  'secret',
  'token',
  'apikey',
  'api_key',
  'authorization',
  'auth',
  'bearer',
  'jwt',
  'refresh_token',
  'access_token',
  'session_id',
  'cookie',
  'x-api-key',
  'x-auth-token'
];

/**
 * Redact sensitive information from a string
 */
export function redactString(input: string): string {
  let result = input;
  
  // Apply pattern-based redaction
  SENSITIVE_PATTERNS.forEach(pattern => {
    if (pattern.source.includes('email')) {
      // Partial email redaction: user@domain.com -> u***@domain.com
      result = result.replace(pattern, (match, user, domain) => {
        const redactedUser = user.length > 1 ? user[0] + '*'.repeat(user.length - 1) : '*';
        return `${redactedUser}@${domain}`;
      });
    } else if (pattern.source.includes('ip')) {
      // Partial IP redaction: 192.168.1.1 -> 192.168.*.1
      result = result.replace(pattern, (match, a, b, c, d) => {
        return `${a}.${b}.*.${d}`;
      });
    } else {
      // Full redaction for other patterns
      result = result.replace(pattern, '[REDACTED]');
    }
  });
  
  return result;
}

/**
 * Redact sensitive fields from an object
 */
export function redactObject(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj === 'string') {
    return redactString(obj);
  }
  
  if (typeof obj !== 'object') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => redactObject(item));
  }
  
  const result: any = {};
  
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    
    if (SENSITIVE_FIELD_NAMES.some(sensitive => lowerKey.includes(sensitive))) {
      result[key] = '[REDACTED]';
    } else if (typeof value === 'object') {
      result[key] = redactObject(value);
    } else if (typeof value === 'string') {
      result[key] = redactString(value);
    } else {
      result[key] = value;
    }
  }
  
  return result;
}

/**
 * Redact sensitive information from error objects
 */
export function redactError(error: Error): any {
  const redacted: any = {
    name: error.name,
    message: redactString(error.message)
  };
  
  // Don't include stack traces in production logs
  if (process.env.NODE_ENV !== 'production') {
    redacted.stack = error.stack ? redactString(error.stack) : undefined;
  }
  
  // Handle additional properties
  Object.keys(error).forEach(key => {
    if (key !== 'name' && key !== 'message' && key !== 'stack') {
      redacted[key] = redactObject((error as any)[key]);
    }
  });
  
  return redacted;
}

/**
 * Redact sensitive information from HTTP headers
 */
export function redactHeaders(headers: Record<string, string>): Record<string, string> {
  const result: Record<string, string> = {};
  
  for (const [key, value] of Object.entries(headers)) {
    const lowerKey = key.toLowerCase();
    
    if (SENSITIVE_FIELD_NAMES.some(sensitive => lowerKey.includes(sensitive))) {
      result[key] = '[REDACTED]';
    } else if (lowerKey === 'cookie') {
      // Redact cookie values but keep names
      result[key] = value.replace(/=([^;]+)/g, '=[REDACTED]');
    } else {
      result[key] = redactString(value);
    }
  }
  
  return result;
}

/**
 * Redact sensitive information from URL query parameters
 */
export function redactUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    
    // Redact sensitive query parameters
    SENSITIVE_FIELD_NAMES.forEach(param => {
      if (urlObj.searchParams.has(param)) {
        urlObj.searchParams.set(param, '[REDACTED]');
      }
    });
    
    return urlObj.toString();
  } catch {
    // If URL parsing fails, apply string redaction
    return redactString(url);
  }
}

/**
 * Create a safe logger function that automatically redacts sensitive data
 */
export function createSafeLogger(logger: any) {
  return {
    info: (data: any, message?: string) => {
      logger.info(redactObject(data), message ? redactString(message) : undefined);
    },
    warn: (data: any, message?: string) => {
      logger.warn(redactObject(data), message ? redactString(message) : undefined);
    },
    error: (data: any, message?: string) => {
      const redactedData = data instanceof Error ? redactError(data) : redactObject(data);
      logger.error(redactedData, message ? redactString(message) : undefined);
    },
    debug: (data: any, message?: string) => {
      logger.debug(redactObject(data), message ? redactString(message) : undefined);
    }
  };
}