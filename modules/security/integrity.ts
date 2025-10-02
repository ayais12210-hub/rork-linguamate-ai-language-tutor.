import CryptoJS from 'crypto-js';

const SIGNING_KEY = process.env.EXPO_PUBLIC_LOG_SIGNING_KEY || 'change-me-in-production';

export function signPayload(payload: unknown): string {
  const payloadString = JSON.stringify(payload);
  return CryptoJS.HmacSHA256(payloadString, SIGNING_KEY).toString();
}

export function verifySignature(payload: unknown, signature: string): boolean {
  const expected = signPayload(payload);
  return expected === signature;
}

export function createSignedBatch<T>(items: T[]): {
  items: T[];
  signature: {
    hmac: string;
    algo: 'HMAC-SHA256';
    ts: string;
  };
} {
  const ts = new Date().toISOString();
  const payload = { items, ts };
  const hmac = signPayload(payload);

  return {
    items,
    signature: {
      hmac,
      algo: 'HMAC-SHA256' as const,
      ts,
    },
  };
}

export function verifySignedBatch<T>(batch: {
  items: T[];
  signature: {
    hmac: string;
    algo: string;
    ts: string;
  };
}): boolean {
  const { items, signature } = batch;
  const payload = { items, ts: signature.ts };
  return verifySignature(payload, signature.hmac);
}

export function checkClockSkew(signatureTs: string, maxSkewMs: number = 300_000): boolean {
  const now = Date.now();
  const sigTime = new Date(signatureTs).getTime();
  const skew = Math.abs(now - sigTime);
  return skew <= maxSkewMs;
}
