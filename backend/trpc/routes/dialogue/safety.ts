const PROFANITY_PATTERNS = [
  /\b(fuck|shit|damn|bitch|asshole)\b/gi,
];

const PII_PATTERNS = [
  /\b[\w.%+-]+@[\w.-]+\.[A-Z|a-z]{2,}\b/g,
  /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
  /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
];

export type SafetyCheckResult = {
  safe: boolean;
  reason?: string;
  sanitized: string;
};

export function checkSafety(text: string): SafetyCheckResult {
  let sanitized = text;

  for (const pattern of PROFANITY_PATTERNS) {
    if (pattern.test(text)) {
      return {
        safe: false,
        reason: 'inappropriate_language',
        sanitized: text.replace(pattern, '***'),
      };
    }
  }

  for (const pattern of PII_PATTERNS) {
    if (pattern.test(text)) {
      sanitized = sanitized.replace(pattern, '[REDACTED]');
    }
  }

  return {
    safe: true,
    sanitized,
  };
}
