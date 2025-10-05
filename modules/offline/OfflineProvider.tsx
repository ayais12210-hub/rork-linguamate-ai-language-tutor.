import React, { useEffect } from 'react';
import { initializeOfflineManager, cleanupOfflineManager } from './index';

export function OfflineProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (__DEV__) {

      console.log('[OfflineProvider] Mounting - initializing offline manager');

    }
    initializeOfflineManager();

    return () => {
      if (__DEV__) {

        console.log('[OfflineProvider] Unmounting - cleaning up offline manager');

      }
      cleanupOfflineManager();
    };
  }, []);

  return <>{children}</>;
}
