/**
 * React 19 Patch for expo-router compatibility
 * 
 * This file patches the React object to ensure the `use` function is available
 * for expo-router, which expects it to be present but may not be due to build issues.
 */

import React from 'react';

// Check if React.use is available, if not, add our polyfill
if (typeof React !== 'undefined' && !React.use) {
  // Create a polyfill that uses useContext for context values
  const usePolyfill = (context: React.Context<any>) => {
    return React.useContext(context);
  };
  
  // Add the polyfill to React object
  (React as any).use = usePolyfill;
  
  console.log('[React Patch] Added use polyfill to React object');
}

// Also patch the global React if it exists
if (typeof global !== 'undefined' && (global as any).React && !(global as any).React.use) {
  const usePolyfill = (context: React.Context<any>) => {
    return React.useContext(context);
  };
  
  (global as any).React.use = usePolyfill;
  console.log('[React Patch] Added use polyfill to global React object');
}

export {};