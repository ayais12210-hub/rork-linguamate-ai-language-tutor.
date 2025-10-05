import { QueryClient, onlineManager } from '@tanstack/react-query';
import { useEffect } from 'react';
import { Platform } from 'react-native';

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        retry: (failureCount, error) => {
          if (Platform.OS === 'web') return failureCount < 1;
          return failureCount < 2;
        },
        refetchOnWindowFocus: Platform.OS === 'web',
        refetchOnReconnect: true,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}

export function OnlineStatusSync() {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const onOnline = () => {
      if (__DEV__) {

        console.log('[OnlineStatusSync] Browser online');

      }
      onlineManager.setOnline(true);
    };
    const onOffline = () => {
      if (__DEV__) {

        console.log('[OnlineStatusSync] Browser offline');

      }
      onlineManager.setOnline(false);
    };

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    onlineManager.setOnline(navigator.onLine);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);
  return null;
}
