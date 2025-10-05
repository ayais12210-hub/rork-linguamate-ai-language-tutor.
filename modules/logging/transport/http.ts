import type { LogEnvelope } from '../schemas';
import { createSignedBatch } from '../../security/integrity';

const INGEST_URL = process.env.EXPO_PUBLIC_LOG_INGEST_URL || 'http://localhost:8080/api/ingest/logs';
const TIMEOUT_MS = 10_000;

export async function sendBatch(logs: LogEnvelope[]): Promise<boolean> {
  if (logs.length === 0) {
    return true;
  }

  try {
    const signedBatch = createSignedBatch(logs);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const response = await fetch(INGEST_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        logs: signedBatch.items,
        sig: signedBatch.signature,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (__DEV__) {

        console.error(`[HTTP Transport] Server returned ${response.status}: ${response.statusText}`);

      }
      return false;
    }

    if (__DEV__) {


      console.log(`[HTTP Transport] Successfully sent ${logs.length} logs`);


    }
    return true;
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        if (__DEV__) {

          console.error('[HTTP Transport] Request timeout');

        }
      } else {
        if (__DEV__) {

          console.error('[HTTP Transport] Network error:', error.message);

        }
      }
    } else {
      if (__DEV__) {

        console.error('[HTTP Transport] Unknown error:', error);

      }
    }
    return false;
  }
}

export async function sendLog(log: LogEnvelope): Promise<boolean> {
  return sendBatch([log]);
}
