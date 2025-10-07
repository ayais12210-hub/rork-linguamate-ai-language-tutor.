export function isAllowed(hostname: string, allow: string[]): boolean { 
  const host = hostname.toLowerCase();
  return allow.some(x => host === x || host.endsWith(`.${x}`));
}

export function extractHostname(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return '';
  }
}

export function validateProbeUrl(url: string, allowlist: string[]): boolean {
  const hostname = extractHostname(url);
  if (!hostname) return false;
  return isAllowed(hostname, allowlist);
}

export class EgressController {
  private allowlist: string[];

  constructor(config: { outboundAllowlist: string[] }) {
    this.allowlist = config.outboundAllowlist;
  }

  isAllowed(hostname: string): boolean {
    return isAllowed(hostname, this.allowlist);
  }

  validateUrl(url: string): boolean {
    return validateProbeUrl(url, this.allowlist);
  }
}