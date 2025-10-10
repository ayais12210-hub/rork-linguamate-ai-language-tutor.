/**
 * Robust React.use polyfill for React 19 compatibility
 * 
 * This file provides a comprehensive fix for the "use is not a function" error
 * by ensuring React.use is available in all contexts where expo-router might need it.
 */

import React from 'react';

// Store original React object
const originalReact = React;

// Create a robust use polyfill
const usePolyfill = (context: React.Context<any>) => {
  if (!context) {
    throw new Error('use() requires a context');
  }
  return React.useContext(context);
};

// Function to patch React object
function patchReactObject(reactObj: any) {
  if (reactObj && !reactObj.use) {
    reactObj.use = usePolyfill;
    console.log('[React Use Robust] Patched React object with use polyfill');
  }
}

// Function to patch module system
function patchModuleSystem() {
  // Patch require function
  const originalRequire = (global as any).require;
  if (originalRequire) {
    (global as any).require = function(id: string) {
      const module = originalRequire(id);
      
      // If this is React, ensure it has the use function
      if (id === 'react' || id.includes('react/')) {
        patchReactObject(module);
      }
      
      // If this is expo-router storeContext, patch it directly
      if (id.includes('expo-router') && id.includes('storeContext')) {
        console.log('[React Use Robust] Patching expo-router storeContext module');
        
        if (module && module.useExpoRouterStore) {
          const originalUseExpoRouterStore = module.useExpoRouterStore;
          module.useExpoRouterStore = function() {
            // Use React.useContext instead of the problematic use function
            return React.useContext(module.StoreContext);
          };
          console.log('[React Use Robust] Successfully patched useExpoRouterStore');
        }
      }
      
      return module;
    };
  }
}

// Function to patch webpack/metro module system
function patchWebpackMetro() {
  // Try to patch webpack require
  const webpackRequire = (global as any).__webpack_require__;
  if (webpackRequire) {
    const originalWebpackRequire = webpackRequire;
    (global as any).__webpack_require__ = function(id: string) {
      const module = originalWebpackRequire(id);
      
      if (id === 'react' || id.includes('react/')) {
        patchReactObject(module);
      }
      
      return module;
    };
    console.log('[React Use Robust] Patched webpack require');
  }
  
  // Try to patch metro require
  const metroRequire = (global as any).__metro_require__;
  if (metroRequire) {
    const originalMetroRequire = metroRequire;
    (global as any).__metro_require__ = function(id: string) {
      const module = originalMetroRequire(id);
      
      if (id === 'react' || id.includes('react/')) {
        patchReactObject(module);
      }
      
      return module;
    };
    console.log('[React Use Robust] Patched metro require');
  }
}

// Function to patch global objects
function patchGlobalObjects() {
  // Patch global React
  if (typeof global !== 'undefined') {
    if (!(global as any).React) {
      (global as any).React = React;
    }
    patchReactObject((global as any).React);
  }
  
  // Patch window React (for web)
  if (typeof window !== 'undefined') {
    if (!(window as any).React) {
      (window as any).React = React;
    }
    patchReactObject((window as any).React);
  }
}

// Apply all patches
function applyPatches() {
  console.log('[React Use Robust] Applying comprehensive React.use patches...');
  
  // Patch the main React object
  patchReactObject(React);
  
  // Patch global objects
  patchGlobalObjects();
  
  // Patch module systems
  patchModuleSystem();
  patchWebpackMetro();
  
  console.log('[React Use Robust] All patches applied successfully');
}

// Apply patches immediately
applyPatches();

// Export functions for manual application if needed
export { applyPatches, patchReactObject, usePolyfill };