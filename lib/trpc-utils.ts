import { TRPCClientError } from '@trpc/client';

/**
 * Checks if a message indicates a network/connectivity issue.
 */
function isNetworkErrorMessage(message: string, includeBackendNotAvailable: boolean = false): boolean {
  const msg = message.toLowerCase();
  return (
    msg.includes('failed to fetch') ||
    msg.includes('network error') ||
    (includeBackendNotAvailable && msg.includes('backend not available')) ||
    msg.includes('connection refused') ||
    msg.includes('timeout')
  );
}

/**
 * Checks if a tRPC error is a network/connectivity issue
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof TRPCClientError) {
    return isNetworkErrorMessage(error.message, true);
  }

  if (error instanceof Error) {
    return isNetworkErrorMessage(error.message, false);
  }
  return false;
}

/**
 * Safely executes a tRPC query with fallback handling
 */
export async function safeTrpcQuery<T>(
  queryFn: () => Promise<T>,
  fallbackFn: () => T,
  options?: {
    logError?: boolean;
    errorMessage?: string;
  }
): Promise<T> {
  try {
    return await queryFn();
  } catch (error) {
    const shouldLog = options?.logError !== false;
    const message = options?.errorMessage || 'tRPC query failed';
    
    if (isNetworkError(error)) {
      if (shouldLog) {
        console.warn(`[tRPC] ${message}, using fallback:`, error instanceof Error ? error.message : 'Unknown error');
      }
    } else {
      if (shouldLog) {
        console.error(`[tRPC] ${message}:`, error);
      }
    }
    
    return fallbackFn();
  }
}