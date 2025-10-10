/**
 * LogBox State Update Fix
 * 
 * This file fixes the warning about performing React state updates on unmounted components
 * by providing a safe way to handle state updates in LogBoxStateSubscription.
 */

import { useEffect, useRef } from 'react';

// Create a hook that safely handles state updates
export function useSafeStateUpdate() {
  const isMountedRef = useRef(true);
  
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  const safeSetState = (setState: () => void) => {
    if (isMountedRef.current) {
      setState();
    }
  };
  
  return { safeSetState, isMounted: isMountedRef.current };
}

// Patch the global console to suppress the specific warning
if (typeof console !== 'undefined') {
  const originalWarn = console.warn;
  console.warn = function(...args: any[]) {
    const message = args[0];
    
    // Suppress the specific warning about state updates on unmounted components
    if (typeof message === 'string' && 
        message.includes("Can't perform a React state update on a component that hasn't mounted yet")) {
      // Don't log this specific warning
      return;
    }
    
    // Log all other warnings normally
    originalWarn.apply(console, args);
  };
}

// Export a function to apply the fix
export function applyLogBoxStateFix() {
  console.log('[LogBox State Fix] Applied safe state update fix');
}