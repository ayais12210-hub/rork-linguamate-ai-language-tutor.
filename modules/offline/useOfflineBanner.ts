import { useState, useEffect } from 'react';
import { useOfflineStatus } from './index';

export function useOfflineBanner() {
  const { isOffline } = useOfflineStatus();
  const [showBanner, setShowBanner] = useState<boolean>(false);
  const [wasOffline, setWasOffline] = useState<boolean>(false);

  useEffect(() => {
    if (isOffline && !wasOffline) {
      console.log('[OfflineBanner] Going offline - showing banner');
      setShowBanner(true);
      setWasOffline(true);
    } else if (!isOffline && wasOffline) {
      console.log('[OfflineBanner] Back online - hiding banner after delay');
      setTimeout(() => {
        setShowBanner(false);
        setWasOffline(false);
      }, 2000);
    }
  }, [isOffline, wasOffline]);

  return { showBanner, isOffline };
}
