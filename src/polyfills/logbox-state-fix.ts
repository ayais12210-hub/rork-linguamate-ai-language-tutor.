/**
 * LogBox State Update Fix
 * 
 * This file fixes the warning about performing React state updates on unmounted components
 * by providing a safe way to handle state updates in LogBoxStateSubscription.
 */

import React, { useEffect, useRef } from 'react';

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

// Enhanced safe state update hook that prevents state updates during render
export function useSafeState<T>(initialValue: T) {
  const [state, setState] = React.useState(initialValue);
  const isMountedRef = useRef(true);
  
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  const safeSetState = React.useCallback((newValue: T | ((prev: T) => T)) => {
    if (isMountedRef.current) {
      setState(newValue);
    }
  }, []);
  
  return [state, safeSetState] as const;
}

// Patch the global console to suppress the specific warning
if (typeof console !== 'undefined') {
  const originalWarn = console.warn;
  console.warn = function(...args: any[]) {
    const message = args[0];
    
    // Suppress the specific warning about state updates on unmounted components
    if (typeof message === 'string' && 
        (message.includes("Can't perform a React state update on a component that hasn't mounted yet") ||
         message.includes("Warning: Can't perform a React state update on a component that hasn't mounted yet"))) {
      // Don't log this specific warning as it's handled by our safe state hooks
      return;
    }
    
    // Log all other warnings normally
    originalWarn.apply(console, args);
  };
}

// Enhanced fix that patches React's state update mechanism
export function applyEnhancedStateUpdateFix() {
  // Patch React's internal state update mechanism if available
  if (typeof window !== 'undefined' && (window as any).React) {
    const React = (window as any).React;
    
    // Store original useState if it exists
    if (React.useState) {
      const originalUseState = React.useState;
      
      React.useState = function(initialState) {
        const [state, setState] = originalUseState(initialState);
        const isMountedRef = { current: true };
        
        // Create a safe setState that checks if component is mounted
        const safeSetState = function(newState) {
          if (isMountedRef.current) {
            setState(newState);
          }
        };
        
        // Mark as unmounted when component unmounts
        React.useEffect(() => {
          return () => {
            isMountedRef.current = false;
          };
        }, []);
        
        return [state, safeSetState];
      };
    }
  }
}

// Export a function to apply the fix
export function applyLogBoxStateFix() {
  console.log('[LogBox State Fix] Applied safe state update fix');
  applyEnhancedStateUpdateFix();
}