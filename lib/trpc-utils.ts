import { TRPCClientError } from '@trpc/client';

/**
 * Checks if a tRPC error is a network/connectivity issue
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof TRPCClientError) {
    const message = error.message.toLowerCase();
    return (
      message.includes('failed to fetch') ||
      message.includes('network error') ||
      message.includes('backend not available') ||
      message.includes('connection refused') ||
      message.includes('timeout')
    );
  }
  
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('failed to fetch') ||
      message.includes('network error') ||
      message.includes('connection refused') ||
      message.includes('timeout')
    );
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