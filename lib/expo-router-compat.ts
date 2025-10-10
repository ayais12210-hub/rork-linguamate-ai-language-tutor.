/**
 * Expo Router React 19 Compatibility Fix
 * 
 * This file provides a compatibility layer for expo-router when using React 19.
 * The issue is that expo-router tries to use the React 19 'use' hook, but it's
 * not being imported correctly, causing the error "(0, react_1.use) is not a function".
 * 
 * This file provides a workaround by creating a compatible version of the useExpoRouterStore
 * function that uses useContext instead of the problematic 'use' hook.
 */

import { useContext, createContext } from 'react';

// Create a compatible context that works with React 19
export const ExpoRouterStoreContext = createContext(null);

// Create a compatible hook that uses useContext instead of the problematic 'use' hook
export const useExpoRouterStore = () => {
  const context = useContext(ExpoRouterStoreContext);
  if (context === null) {
    throw new Error('useExpoRouterStore must be used within an ExpoRouterProvider');
  }
  return context;
};

// Export the context for use in the app
export { ExpoRouterStoreContext as StoreContext };