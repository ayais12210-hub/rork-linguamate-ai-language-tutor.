/**
 * Test file to verify React.use polyfill is working
 */

import React from 'react';

// Test if React.use is available
export function testReactUse() {
  console.log('[Test] Testing React.use availability...');
  
  // Check if React.use exists
  if (React.use) {
    console.log('✅ React.use is available');
    
    // Test creating a context and using it
    const TestContext = React.createContext('test-value');
    
    try {
      // This should work if our polyfill is working
      const value = React.use(TestContext);
      console.log('✅ React.use works correctly, got value:', value);
      return true;
    } catch (error) {
      console.error('❌ React.use failed:', error);
      return false;
    }
  } else {
    console.error('❌ React.use is not available');
    return false;
  }
}

// Test if the global React object has use
export function testGlobalReactUse() {
  console.log('[Test] Testing global React.use availability...');
  
  if (typeof global !== 'undefined' && (global as any).React) {
    const globalReact = (global as any).React;
    if (globalReact.use) {
      console.log('✅ Global React.use is available');
      return true;
    } else {
      console.error('❌ Global React.use is not available');
      return false;
    }
  } else {
    console.log('ℹ️ Global React object not found');
    return false;
  }
}

// Run tests
export function runTests() {
  console.log('[Test] Running React.use tests...');
  
  const reactUseWorks = testReactUse();
  const globalReactUseWorks = testGlobalReactUse();
  
  if (reactUseWorks) {
    console.log('🎉 React.use polyfill is working correctly!');
  } else {
    console.log('⚠️ React.use polyfill may not be working correctly');
  }
  
  return { reactUseWorks, globalReactUseWorks };
}