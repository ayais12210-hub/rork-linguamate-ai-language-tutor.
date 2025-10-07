import { createLogger } from '../observability/logger.js';

export interface EgressConfig {
  outboundAllowlist: string[];
}

export class EgressController {
  private allowlist: string[];
  private logger: ReturnType<typeof createLogger>;

  constructor(config: EgressConfig, logger: ReturnType<typeof createLogger>) {
    this.allowlist = config.outboundAllowlist;
    this.logger = logger;
  }

  // Check if hostname is allowed for outbound connections
  isAllowed(hostname: string): boolean {
    if (this.allowlist.length === 0) {
      return true; // No restrictions if allowlist is empty
    }

    // Check exact match
    if (this.allowlist.includes(hostname)) {
      return true;
    }

    // Check wildcard patterns
    for (const pattern of this.allowlist) {
      if (pattern.startsWith('*.')) {
        const domain = pattern.substring(2);
        if (hostname.endsWith(domain)) {
          return true;
        }
      }
    }

    return false;
  }

  // Validate and log outbound connection attempt
  validateOutbound(hostname: string, context: string = 'unknown'): boolean {
    const allowed = this.isAllowed(hostname);
    
    if (!allowed) {
      this.logger.warn({
        event: 'egress_blocked',
        hostname,
        context,
        allowlist: this.allowlist,
      });
    }

    return allowed;
  }

  // Extract hostname from URL
  extractHostname(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch (error) {
      this.logger.error({
        event: 'invalid_url',
        url,
        error: error instanceof Error ? error.message : String(error),
      });
      return '';
    }
  }

  // Validate URL for outbound access
  validateUrl(url: string, context: string = 'unknown'): boolean {
    const hostname = this.extractHostname(url);
    if (!hostname) {
      return false;
    }
    
    return this.validateOutbound(hostname, context);
  }

  // Get current allowlist
  getAllowlist(): string[] {
    return [...this.allowlist];
  }

  // Update allowlist (for dynamic configuration)
  updateAllowlist(newAllowlist: string[]): void {
    this.allowlist = [...newAllowlist];
    this.logger.info({
      event: 'egress_allowlist_updated',
      newAllowlist: this.allowlist,
    });
  }
}