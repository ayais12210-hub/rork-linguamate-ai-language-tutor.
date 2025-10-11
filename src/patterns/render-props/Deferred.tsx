import React, { useState, useEffect, useRef, ReactNode } from 'react';

// Deferred render props component for debounced rendering
interface DeferredProps {
  delay: number;
  children: (isVisible: boolean) => ReactNode;
  fallback?: ReactNode;
  onVisibilityChange?: (isVisible: boolean) => void;
}

export function Deferred({ 
  delay, 
  children, 
  fallback = null,
  onVisibilityChange 
}: DeferredProps) {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
      onVisibilityChange?.(true);
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [delay, onVisibilityChange]);

  return (
    <>
      {isVisible ? children(isVisible) : fallback}
    </>
  );
}

// Mouse/Touch tracker render props component
interface MouseTrackerProps {
  children: (mouseData: {
    x: number;
    y: number;
    isActive: boolean;
    deltaX: number;
    deltaY: number;
  }) => ReactNode;
  onMouseMove?: (x: number, y: number) => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export function MouseTracker({ 
  children, 
  onMouseMove, 
  onMouseEnter, 
  onMouseLeave 
}: MouseTrackerProps) {
  const [mouseData, setMouseData] = useState({
    x: 0,
    y: 0,
    isActive: false,
    deltaX: 0,
    deltaY: 0,
  });

  const lastPositionRef = useRef({ x: 0, y: 0 });

  const handleMouseMove = (event: any) => {
    const { clientX, clientY } = event.nativeEvent || event;
    const newX = clientX;
    const newY = clientY;

    setMouseData(prev => ({
      x: newX,
      y: newY,
      isActive: true,
      deltaX: newX - lastPositionRef.current.x,
      deltaY: newY - lastPositionRef.current.y,
    }));

    lastPositionRef.current = { x: newX, y: newY };
    onMouseMove?.(newX, newY);
  };

  const handleMouseEnter = () => {
    setMouseData(prev => ({ ...prev, isActive: true }));
    onMouseEnter?.();
  };

  const handleMouseLeave = () => {
    setMouseData(prev => ({ ...prev, isActive: false }));
    onMouseLeave?.();
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ width: '100%', height: '100%' }}
    >
      {children(mouseData)}
    </div>
  );
}

// Input tracker for touch/keyboard interactions
interface InputTrackerProps {
  children: (inputData: {
    isTyping: boolean;
    lastInputTime: number;
    inputCount: number;
    isIdle: boolean;
  }) => ReactNode;
  idleTimeout?: number;
  onIdle?: () => void;
  onInput?: () => void;
}

export function InputTracker({ 
  children, 
  idleTimeout = 2000,
  onIdle,
  onInput 
}: InputTrackerProps) {
  const [inputData, setInputData] = useState({
    isTyping: false,
    lastInputTime: 0,
    inputCount: 0,
    isIdle: true,
  });

  const idleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleInput = () => {
    const now = Date.now();
    
    setInputData(prev => ({
      isTyping: true,
      lastInputTime: now,
      inputCount: prev.inputCount + 1,
      isIdle: false,
    }));

    onInput?.();

    // Clear existing timeout
    if (idleTimeoutRef.current) {
      clearTimeout(idleTimeoutRef.current);
    }

    // Set new idle timeout
    idleTimeoutRef.current = setTimeout(() => {
      setInputData(prev => ({
        ...prev,
        isTyping: false,
        isIdle: true,
      }));
      onIdle?.();
    }, idleTimeout);
  };

  useEffect(() => {
    return () => {
      if (idleTimeoutRef.current) {
        clearTimeout(idleTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div onInput={handleInput} onKeyDown={handleInput} onTouchStart={handleInput}>
      {children(inputData)}
    </div>
  );
}

// Intersection observer render props for lazy loading
interface IntersectionObserverProps {
  children: (isIntersecting: boolean, entry: IntersectionObserverEntry | null) => ReactNode;
  threshold?: number | number[];
  rootMargin?: string;
  onIntersect?: (isIntersecting: boolean, entry: IntersectionObserverEntry) => void;
}

export function IntersectionObserver({ 
  children, 
  threshold = 0.1,
  rootMargin = '0px',
  onIntersect 
}: IntersectionObserverProps) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);
  const elementRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [firstEntry] = entries;
        setIsIntersecting(firstEntry.isIntersecting);
        setEntry(firstEntry);
        onIntersect?.(firstEntry.isIntersecting, firstEntry);
      },
      { threshold, rootMargin }
    );

    observerRef.current.observe(element);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [threshold, rootMargin, onIntersect]);

  return (
    <div ref={elementRef}>
      {children(isIntersecting, entry)}
    </div>
  );
}

// Debounced value render props
interface DebouncedValueProps<T> {
  value: T;
  delay: number;
  children: (debouncedValue: T, isDebouncing: boolean) => ReactNode;
  onDebounceComplete?: (value: T) => void;
}

export function DebouncedValue<T>({ 
  value, 
  delay, 
  children, 
  onDebounceComplete 
}: DebouncedValueProps<T>) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  const [isDebouncing, setIsDebouncing] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setIsDebouncing(true);

    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value);
      setIsDebouncing(false);
      onDebounceComplete?.(value);
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delay, onDebounceComplete]);

  return <>{children(debouncedValue, isDebouncing)}</>;
}

// Async data render props
interface AsyncDataProps<T> {
  promise: Promise<T>;
  children: (data: {
    data: T | null;
    loading: boolean;
    error: Error | null;
    retry: () => void;
  }) => ReactNode;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

export function AsyncData<T>({ 
  promise, 
  children, 
  onSuccess, 
  onError 
}: AsyncDataProps<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const executePromise = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await promise;
      setData(result);
      onSuccess?.(result);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      onError?.(error);
    } finally {
      setLoading(false);
    }
  }, [promise, onSuccess, onError]);

  useEffect(() => {
    executePromise();
  }, [executePromise]);

  const retry = useCallback(() => {
    executePromise();
  }, [executePromise]);

  return <>{children({ data, loading, error, retry })}</>;
}

// Export all render props components
export {
  Deferred as default,
  MouseTracker,
  InputTracker,
  IntersectionObserver,
  DebouncedValue,
  AsyncData,
};