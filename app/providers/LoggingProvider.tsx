import { ReactNode, useEffect } from 'react';
import { LoggingContextProvider, initLogger } from '@/modules/logging';
import { getConsent } from '@/modules/security/consent';

export function LoggingProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const init = async () => {
      try {
        await getConsent();
        await initLogger();
        if (__DEV__) {

          console.log('[LoggingProvider] Logging system initialized');

        }
      } catch (error) {
        if (__DEV__) {

          console.error('[LoggingProvider] Failed to initialize logging:', error);

        }
      }
    };

    init();
  }, []);

  return <LoggingContextProvider>{children}</LoggingContextProvider>;
}
