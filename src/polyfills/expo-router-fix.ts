/**
 * Expo Router React 19 Fix
 * 
 * This file provides a runtime fix for the expo-router React 19 compatibility issue.
 * It patches the problematic code that causes "(0, react_1.use) is not a function" error.
 */

import React from 'react';

// Store the original require function
const originalRequire = (global as any).require;

// Patch the require function to intercept expo-router module loading
if (originalRequire) {
  (global as any).require = function(id: string) {
    const module = originalRequire(id);
    
    // If this is the expo-router storeContext module, patch it
    if (id.includes('expo-router') && id.includes('storeContext')) {
      console.log('[Expo Router Fix] Patching storeContext module');
      
      // Patch the useExpoRouterStore function to use useContext instead of use
      if (module && module.useExpoRouterStore) {
        const originalUseExpoRouterStore = module.useExpoRouterStore;
        module.useExpoRouterStore = function() {
          // Use React.useContext instead of the problematic use function
          return React.useContext(module.StoreContext);
        };
        
        console.log('[Expo Router Fix] Successfully patched useExpoRouterStore');
      }
    }
    
    return module;
  };
}

// Also try to patch the module directly if it's already loaded
try {
  // This is a more direct approach - we'll try to find and patch the expo-router module
  const expoRouterModule = (global as any).__EXPO_ROUTER_MODULE__;
  if (expoRouterModule && expoRouterModule.useExpoRouterStore) {
    console.log('[Expo Router Fix] Patching already loaded expo-router module');
    
    const originalUseExpoRouterStore = expoRouterModule.useExpoRouterStore;
    expoRouterModule.useExpoRouterStore = function() {
      return React.useContext(expoRouterModule.StoreContext);
    };
    
    console.log('[Expo Router Fix] Successfully patched already loaded module');
  }
} catch (error) {
  console.log('[Expo Router Fix] Could not patch already loaded module:', error);
}

// Export a function that can be called to ensure the fix is applied
export function ensureExpoRouterFix() {
  console.log('[Expo Router Fix] Ensuring fix is applied');
  
  // Try to patch any existing expo-router instances
  const globalModules = (global as any).__webpack_require__ || (global as any).__metro_require__;
  if (globalModules) {
    console.log('[Expo Router Fix] Found module system, attempting to patch');
    // This would need to be implemented based on the specific module system
  }
}

export {};