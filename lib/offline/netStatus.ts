import { useEffect, useState, useCallback } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { AppError, createAppError } from '@/lib/errors/AppError';

export interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: string | null;
  isOffline: boolean;
}

export interface NetworkStatusCallbacks {
  onOnline?: () => void;
  onOffline?: () => void;
  onStatusChange?: (status: NetworkStatus) => void;
}

let networkStatus: NetworkStatus = {
  isConnected: false,
  isInternetReachable: null,
  type: null,
  isOffline: true,
};

let callbacks: NetworkStatusCallbacks = {};
let isInitialized = false;

// Debounce utility
function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Debounced status change handler
const debouncedStatusChange = debounce((status: NetworkStatus) => {
  if (callbacks.onStatusChange) {
    callbacks.onStatusChange(status);
  }
}, 500);

function updateNetworkStatus(state: NetInfoState) {
  const newStatus: NetworkStatus = {
    isConnected: state.isConnected ?? false,
    isInternetReachable: state.isInternetReachable,
    type: state.type,
    isOffline: !state.isConnected || state.isInternetReachable === false,
  };

  const wasOffline = networkStatus.isOffline;
  const isNowOffline = newStatus.isOffline;

  networkStatus = newStatus;

  // Only trigger callbacks on state changes
  if (wasOffline !== isNowOffline) {
    if (isNowOffline && callbacks.onOffline) {
      callbacks.onOffline();
    } else if (!isNowOffline && callbacks.onOnline) {
      callbacks.onOnline();
    }
  }

  debouncedStatusChange(newStatus);
}

export function initializeNetworkStatus(): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const unsubscribe = NetInfo.addEventListener(updateNetworkStatus);
      
      // Get initial state
      NetInfo.fetch().then((state) => {
        updateNetworkStatus(state);
        isInitialized = true;
        resolve();
      }).catch((error) => {
        reject(createAppError(
          'NetworkError',
          'Failed to initialize network status',
          { cause: error }
        ));
      });

      // Store unsubscribe function for cleanup
      (global as any).__networkUnsubscribe = unsubscribe;
    } catch (error) {
      reject(createAppError(
        'NetworkError',
        'Failed to initialize network status',
        { cause: error }
      ));
    }
  });
}

export function cleanupNetworkStatus(): void {
  if ((global as any).__networkUnsubscribe) {
    (global as any).__networkUnsubscribe();
    (global as any).__networkUnsubscribe = null;
  }
  isInitialized = false;
}

export function setNetworkCallbacks(callbacks: NetworkStatusCallbacks): void {
  callbacks = callbacks;
}

export function getNetworkStatus(): NetworkStatus {
  return { ...networkStatus };
}

export function isNetworkAvailable(): boolean {
  return !networkStatus.isOffline;
}

// React hook for network status
export function useNetworkStatus() {
  const [status, setStatus] = useState<NetworkStatus>(networkStatus);
  const [isLoading, setIsLoading] = useState(!isInitialized);

  useEffect(() => {
    if (!isInitialized) {
      initializeNetworkStatus()
        .then(() => {
          setIsLoading(false);
          setStatus(networkStatus);
        })
        .catch((error) => {
          console.error('Failed to initialize network status:', error);
          setIsLoading(false);
        });
    }

    const unsubscribe = NetInfo.addEventListener((state) => {
      updateNetworkStatus(state);
      setStatus(networkStatus);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const checkConnection = useCallback(async (): Promise<boolean> => {
    try {
      const state = await NetInfo.fetch();
      updateNetworkStatus(state);
      setStatus(networkStatus);
      return !networkStatus.isOffline;
    } catch (error) {
      console.error('Failed to check network connection:', error);
      return false;
    }
  }, []);

  return {
    ...status,
    isLoading,
    checkConnection,
  };
}

// Utility to wait for network connection
export function waitForNetwork(timeout: number = 30000): Promise<boolean> {
  return new Promise((resolve) => {
    if (!networkStatus.isOffline) {
      resolve(true);
      return;
    }

    const timeoutId = setTimeout(() => {
      resolve(false);
    }, timeout);

    const unsubscribe = NetInfo.addEventListener((state) => {
      updateNetworkStatus(state);
      if (!networkStatus.isOffline) {
        clearTimeout(timeoutId);
        unsubscribe();
        resolve(true);
      }
    });
  });
}