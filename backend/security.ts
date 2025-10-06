import crypto from 'crypto';

export const SECURITY_CONFIG = {
  ACCESS_TOKEN_EXPIRY: 15 * 60 * 1000,
  REFRESH_TOKEN_EXPIRY: 7 * 24 * 60 * 60 * 1000,
  MAX_LOGIN_ATTEMPTS: 5,
  MAX_API_REQUESTS_PER_MINUTE: 60,
  PASSWORD_HISTORY_COUNT: 5,
  MIN_PASSWORD_LENGTH: 8,
  REQUIRE_UPPERCASE: true,
  REQUIRE_LOWERCASE: true,
  REQUIRE_NUMBERS: true,
  REQUIRE_SPECIAL_CHARS: true,
};

export class SecurityAudit {
  static async logSecurityEvent(event: string, details: any = {}, severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'): Promise<void> {
    const payload = { ts: Date.now(), event, severity, details };
    // In a real environment, forward to a log sink. For now just log.
    // eslint-disable-next-line no-console
    console.log('[SecurityAudit]', JSON.stringify(payload));
  }
}

export const SecurityUtils = {
  generateSecureId(length = 32): string {
    return crypto.randomBytes(length).toString('hex').slice(0, length);
  },

  async hashPassword(password: string): Promise<string> {
    // Generate a unique, random salt for each password
    const salt = crypto.randomBytes(16);
    const derived = crypto.pbkdf2Sync(password, salt, 100_000, 32, 'sha256');
    // Store salt and hash together, separated by ':'
    return salt.toString('hex') + ':' + derived.toString('hex');
  },

  async verifyPassword(password: string, stored: string): Promise<boolean> {
    // Extract salt and hash from stored value
    const [saltHex, hashHex] = stored.split(':');
    if (!saltHex || !hashHex) return false;
    const salt = Buffer.from(saltHex, 'hex');
    const derived = crypto.pbkdf2Sync(password, salt, 100_000, 32, 'sha256');
    return crypto.timingSafeEqual(derived, Buffer.from(hashHex, 'hex'));
  },

  containsSuspiciousContent(text: string): boolean {
    const suspiciousPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /data:text\/html/gi,
      /vbscript:/gi,
    ];
    return suspiciousPatterns.some((p) => p.test(text));
  },
};

export class InputSanitizer {
  static sanitizeText(input: string): string {
    if (typeof input !== 'string') return '';
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
      .substring(0, 2000);
  }

  static sanitizeEmail(email: string): string {
    if (typeof email !== 'string') return '';
    return email.toLowerCase().trim();
  }
}

export class RateLimiter {
  private static requests: Map<string, number[]> = new Map();

  static isAllowed(identifier: string, maxRequests = SECURITY_CONFIG.MAX_API_REQUESTS_PER_MINUTE): boolean {
    const now = Date.now();
    const windowStart = now - 60_000;
    const list = this.requests.get(identifier) || [];
    const recent = list.filter((t) => t > windowStart);
    if (recent.length >= maxRequests) return false;
    recent.push(now);
    this.requests.set(identifier, recent);
    return true;
  }
}

export class AdvancedSecurity {
  private static loginAttempts: Map<string, { timestamp: number; success: boolean; ipAddress: string }[]> = new Map();
  private static passwordHistory: Map<string, string[]> = new Map();
  private static sessions: Map<string, { sessionId: string; lastActivity: number }[]> = new Map();

  static validatePasswordStrength(password: string): { isValid: boolean; score: number; feedback: string[] } {
    const feedback: string[] = [];
    let score = 0;

    if (password.length < SECURITY_CONFIG.MIN_PASSWORD_LENGTH) feedback.push(`Password must be at least ${SECURITY_CONFIG.MIN_PASSWORD_LENGTH} characters long`);
    else score += 1;

    if (SECURITY_CONFIG.REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) feedback.push('Password must contain at least one uppercase letter');
    else if (SECURITY_CONFIG.REQUIRE_UPPERCASE) score += 1;

    if (SECURITY_CONFIG.REQUIRE_LOWERCASE && !/[a-z]/.test(password)) feedback.push('Password must contain at least one lowercase letter');
    else if (SECURITY_CONFIG.REQUIRE_LOWERCASE) score += 1;

    if (SECURITY_CONFIG.REQUIRE_NUMBERS && !/\d/.test(password)) feedback.push('Password must contain at least one number');
    else if (SECURITY_CONFIG.REQUIRE_NUMBERS) score += 1;

    if (SECURITY_CONFIG.REQUIRE_SPECIAL_CHARS && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) feedback.push('Password must contain at least one special character');
    else if (SECURITY_CONFIG.REQUIRE_SPECIAL_CHARS) score += 1;

    // Deduct points for common patterns
    const commonPatterns = [/123456/, /password/i, /qwerty/i, /(.)\1{2,}/];
    if (commonPatterns.some((p) => p.test(password))) score = Math.max(0, score - 2);

    return { isValid: feedback.length === 0, score: Math.min(5, score), feedback };
  }

  static async trackLoginAttempt(email: string, success: boolean, ipAddress?: string): Promise<void> {
    const list = this.loginAttempts.get(email) || [];
    list.push({ timestamp: Date.now(), success, ipAddress: ipAddress || 'unknown' });
    this.loginAttempts.set(email, list.slice(-50));
  }

  static async getLoginAttempts(email: string): Promise<any[]> {
    return this.loginAttempts.get(email) || [];
  }

  static async checkPasswordHistory(userId: string, newPassword: string): Promise<boolean> {
    const history = this.passwordHistory.get(userId) || [];
    const newHash = await SecurityUtils.hashPassword(newPassword);
    return !history.includes(newHash);
  }

  static async addToPasswordHistory(userId: string, password: string): Promise<void> {
    const history = this.passwordHistory.get(userId) || [];
    const hash = await SecurityUtils.hashPassword(password);
    history.push(hash);
    this.passwordHistory.set(userId, history.slice(-SECURITY_CONFIG.PASSWORD_HISTORY_COUNT));
  }

  static async checkConcurrentSessions(userId: string): Promise<boolean> {
    const list = this.sessions.get(userId) || [];
    const active = list.filter((s) => Date.now() - s.lastActivity < SECURITY_CONFIG.ACCESS_TOKEN_EXPIRY);
    return active.length < 3;
  }

  static async addSession(userId: string, sessionId: string): Promise<void> {
    const list = this.sessions.get(userId) || [];
    list.push({ sessionId, lastActivity: Date.now() });
    const active = list.filter((s) => Date.now() - s.lastActivity < SECURITY_CONFIG.REFRESH_TOKEN_EXPIRY);
    this.sessions.set(userId, active);
  }
}
