/**
 * Global React.use polyfill
 * 
 * This file ensures that React.use is available globally, which is required
 * for expo-router to work properly with React 19.
 */

import React from 'react';

// Ensure React.use is available globally
if (typeof React !== 'undefined') {
  // Add use function to React if it doesn't exist
  if (!React.use) {
    (React as any).use = React.useContext;
    console.log('[React Use Global] Added use function to React object');
  }
  
  // Also ensure it's available on the global React object
  if (typeof global !== 'undefined') {
    if (!(global as any).React) {
      (global as any).React = React;
    } else if (!(global as any).React.use) {
      (global as any).React.use = React.useContext;
    }
    console.log('[React Use Global] Ensured React.use is available globally');
  }
}

// Patch the module system to ensure expo-router gets the correct React
const originalRequire = (global as any).require;
if (originalRequire) {
  (global as any).require = function(id: string) {
    const module = originalRequire(id);
    
    // If this is a React module, ensure it has the use function
    if (id === 'react' || id.includes('react/')) {
      if (module && !module.use) {
        module.use = module.useContext;
        console.log('[React Use Global] Patched React module to include use function');
      }
    }
    
    return module;
  };
}

export {};