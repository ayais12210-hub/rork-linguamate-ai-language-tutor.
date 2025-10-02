import CryptoJS from 'crypto-js';

type RedactorFn = (value: unknown) => unknown;

const redactors: Map<string, RedactorFn> = new Map();

const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
const PHONE_REGEX = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
const JWT_REGEX = /eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g;
const BEARER_REGEX = /Bearer\s+[A-Za-z0-9_-]+/gi;
const API_KEY_REGEX = /\b(sk|pk)_[a-zA-Z0-9]{20,}\b/g;
const CREDIT_CARD_REGEX = /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g;
const GPS_REGEX = /\b-?\d{1,3}\.\d+,\s*-?\d{1,3}\.\d+\b/g;

const SALT = process.env.EXPO_PUBLIC_LOG_SALT || 'default-salt-change-me';

export function hashValue(value: string): string {
  return CryptoJS.SHA256(value + SALT).toString();
}

export function redactEmail(value: unknown): unknown {
  if (typeof value === 'string') {
    return value.replace(EMAIL_REGEX, '[REDACTED_EMAIL]');
  }
  return value;
}

export function redactPhone(value: unknown): unknown {
  if (typeof value === 'string') {
    return value.replace(PHONE_REGEX, '[REDACTED_PHONE]');
  }
  return value;
}

export function redactToken(value: unknown): unknown {
  if (typeof value === 'string') {
    let redacted = value.replace(JWT_REGEX, '[REDACTED_TOKEN]');
    redacted = redacted.replace(BEARER_REGEX, 'Bearer [REDACTED_TOKEN]');
    redacted = redacted.replace(API_KEY_REGEX, '[REDACTED_API_KEY]');
    return redacted;
  }
  return value;
}

export function redactCreditCard(value: unknown): unknown {
  if (typeof value === 'string') {
    return value.replace(CREDIT_CARD_REGEX, '[REDACTED_PAN]');
  }
  return value;
}

export function redactGPS(value: unknown): unknown {
  if (typeof value === 'string') {
    return value.replace(GPS_REGEX, '[REDACTED_GPS]');
  }
  if (
    typeof value === 'object' &&
    value !== null &&
    ('lat' in value || 'latitude' in value || 'lon' in value || 'longitude' in value)
  ) {
    return '[REDACTED_GPS]';
  }
  return value;
}

export function redactIP(value: unknown): unknown {
  if (typeof value === 'string') {
    const ipv4Regex = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/;
    const ipv6Regex = /\b([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}\b/;
    
    if (ipv4Regex.test(value) || ipv6Regex.test(value)) {
      return hashValue(value);
    }
  }
  return value;
}

export function redactSensitiveKeys(obj: unknown): unknown {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(redactSensitiveKeys);
  }

  const sensitiveKeys = [
    'password',
    'passwd',
    'pwd',
    'secret',
    'token',
    'apiKey',
    'api_key',
    'accessToken',
    'access_token',
    'refreshToken',
    'refresh_token',
    'sessionId',
    'session_id',
    'cookie',
    'authorization',
    'auth',
    'creditCard',
    'credit_card',
    'cardNumber',
    'card_number',
    'cvv',
    'ssn',
    'socialSecurity',
    'social_security',
  ];

  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    
    if (sensitiveKeys.some(sk => lowerKey.includes(sk))) {
      result[key] = '[REDACTED]';
    } else {
      result[key] = redactSensitiveKeys(value);
    }
  }

  return result;
}

export function applyAllRedactors(value: unknown): unknown {
  let redacted = value;
  
  redacted = redactEmail(redacted);
  redacted = redactPhone(redacted);
  redacted = redactToken(redacted);
  redacted = redactCreditCard(redacted);
  redacted = redactGPS(redacted);
  redacted = redactIP(redacted);
  redacted = redactSensitiveKeys(redacted);
  
  for (const redactor of redactors.values()) {
    redacted = redactor(redacted);
  }
  
  return redacted;
}

export function addRedactor(name: string, fn: RedactorFn): void {
  redactors.set(name, fn);
}

export function removeRedactor(name: string): void {
  redactors.delete(name);
}

export function redactLogData(data: Record<string, unknown>): Record<string, unknown> {
  const redacted: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(data)) {
    redacted[key] = applyAllRedactors(value);
  }
  
  return redacted;
}
