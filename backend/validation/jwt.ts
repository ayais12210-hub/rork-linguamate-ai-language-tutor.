import crypto from 'crypto';

export type JwtAlgorithm = 'HS256';

export interface JwtPayload {
  sub: string;
  sid?: string;
  iat: number;
  exp: number;
  type?: 'access' | 'refresh';
  [k: string]: unknown;
}

const textEncoder = new TextEncoder();

function base64url(input: Buffer | string): string {
  const buf = typeof input === 'string' ? Buffer.from(input) : input;
  return buf.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function hmacSHA256(key: string, data: string): string {
  return base64url(crypto.createHmac('sha256', key).update(data).digest());
}

function getSecret(): string {
  return process.env.JWT_SECRET || process.env.SECRET || 'dev-secret-change-me';
}

export function signJwt(payload: Omit<JwtPayload, 'iat' | 'exp'> & { expInSec: number }, alg: JwtAlgorithm = 'HS256'): string {
  const header = { alg, typ: 'JWT' } as const;
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + payload.expInSec;
  const pl: JwtPayload = { ...payload, iat, exp } as unknown as JwtPayload;
  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(pl));
  const toSign = `${encodedHeader}.${encodedPayload}`;
  const signature = hmacSHA256(getSecret(), toSign);
  return `${toSign}.${signature}`;
}

export function verifyJwt<T extends JwtPayload = JwtPayload>(token: string): { valid: boolean; payload?: T; error?: string } {
  try {
    const [h, p, s] = token.split('.');
    if (!h || !p || !s) return { valid: false, error: 'MALFORMED' };
    const expected = hmacSHA256(getSecret(), `${h}.${p}`);
    if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(s))) {
      return { valid: false, error: 'BAD_SIGNATURE' };
    }
    const payload = JSON.parse(Buffer.from(p, 'base64').toString('utf8')) as T;
    if (typeof payload.exp !== 'number' || Math.floor(Date.now() / 1000) >= payload.exp) {
      return { valid: false, error: 'TOKEN_EXPIRED' };
    }
    return { valid: true, payload };
  } catch (e) {
    return { valid: false, error: e instanceof Error ? e.message : 'UNKNOWN' };
  }
}
