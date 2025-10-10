/**
 * React 19 polyfill for the `use` hook
 * This provides compatibility for libraries that use React 19's `use` hook
 * but may not have it properly available due to build issues
 */

import { useContext } from 'react';

// For React 19, we'll create a polyfill that uses useContext
// The `use` hook in React 19 can read from contexts and promises
// For contexts, it's essentially the same as useContext
export function usePolyfill<T>(context: React.Context<T>): T {
  const value = useContext(context);
  return value;
}

// Export the polyfill as the `use` function for compatibility
export { usePolyfill as use };

// Also add it to the React object for compatibility with expo-router
if (typeof React !== 'undefined' && !React.use) {
  (React as any).use = usePolyfill;
}