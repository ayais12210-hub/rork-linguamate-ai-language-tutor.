/**
 * Safe State Wrapper Component
 * 
 * This component wraps other components to ensure state updates are safe
 * and prevents the "Can't perform a React state update on a component that hasn't mounted yet" warning.
 */

import React, { useEffect, useRef, useState } from 'react';

interface SafeStateWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function SafeStateWrapper({ children, fallback = null }: SafeStateWrapperProps) {
  const [isMounted, setIsMounted] = useState(false);
  const isMountedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    setIsMounted(true);
    
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Only render children after component is mounted
  if (!isMounted) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// Hook to safely update state
export function useSafeStateUpdate() {
  const isMountedRef = useRef(true);
  
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  const safeSetState = React.useCallback((setState: () => void) => {
    if (isMountedRef.current) {
      setState();
    }
  }, []);
  
  return { safeSetState, isMounted: isMountedRef.current };
}

// Enhanced useState that prevents updates on unmounted components
export function useSafeState<T>(initialValue: T) {
  const [state, setState] = useState(initialValue);
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

// Higher-order component that wraps components with safe state handling
export function withSafeState<P extends object>(Component: React.ComponentType<P>) {
  return function SafeStateComponent(props: P) {
    return (
      <SafeStateWrapper>
        <Component {...props} />
      </SafeStateWrapper>
    );
  };
}