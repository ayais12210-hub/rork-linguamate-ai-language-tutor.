/**
 * React 18 polyfill for the `use` hook
 * This provides compatibility for libraries that use React 19's `use` hook
 */

import { useContext } from 'react';

// For React 18, we'll create a polyfill that uses useContext
// The `use` hook in React 19 can read from contexts and promises
// For contexts, it's essentially the same as useContext
export function usePolyfill<T>(context: React.Context<T>): T {
  const value = useContext(context);
  if (value === null || value === undefined) {
    throw new Error('usePolyfill: context value is null or undefined');
  }
  return value;
}

// Export the polyfill as the `use` function for compatibility
export { usePolyfill as use };