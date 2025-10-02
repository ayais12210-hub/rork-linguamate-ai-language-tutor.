import React, { useEffect } from 'react';
import { initializeOfflineManager, cleanupOfflineManager } from './index';

export function OfflineProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    console.log('[OfflineProvider] Mounting - initializing offline manager');
    initializeOfflineManager();

    return () => {
      console.log('[OfflineProvider] Unmounting - cleaning up offline manager');
      cleanupOfflineManager();
    };
  }, []);

  return <>{children}</>;
}
