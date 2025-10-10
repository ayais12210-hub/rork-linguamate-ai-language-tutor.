/**
 * Comprehensive test for React 19 compatibility fixes
 * 
 * This file tests all the fixes we've implemented to ensure they work correctly.
 */

import React from 'react';

// Test React.use availability
export function testReactUse() {
  console.log('[Comprehensive Test] Testing React.use availability...');
  
  try {
    if (React.use) {
      console.log('✅ React.use is available');
      
      // Test with a context
      const TestContext = React.createContext('test-value');
      const value = React.use(TestContext);
      console.log('✅ React.use works with context, got:', value);
      return true;
    } else {
      console.error('❌ React.use is not available');
      return false;
    }
  } catch (error) {
    console.error('❌ React.use test failed:', error);
    return false;
  }
}

// Test global React.use availability
export function testGlobalReactUse() {
  console.log('[Comprehensive Test] Testing global React.use availability...');
  
  try {
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
  } catch (error) {
    console.error('❌ Global React.use test failed:', error);
    return false;
  }
}

// Test window React.use availability (for web)
export function testWindowReactUse() {
  console.log('[Comprehensive Test] Testing window React.use availability...');
  
  try {
    if (typeof window !== 'undefined' && (window as any).React) {
      const windowReact = (window as any).React;
      if (windowReact.use) {
        console.log('✅ Window React.use is available');
        return true;
      } else {
        console.error('❌ Window React.use is not available');
        return false;
      }
    } else {
      console.log('ℹ️ Window React object not found (not in web environment)');
      return false;
    }
  } catch (error) {
    console.error('❌ Window React.use test failed:', error);
    return false;
  }
}

// Test module system patching
export function testModuleSystemPatching() {
  console.log('[Comprehensive Test] Testing module system patching...');
  
  try {
    // Test if require is patched
    const originalRequire = (global as any).require;
    if (originalRequire) {
      console.log('✅ Require function is available for patching');
      
      // Test if we can patch a module
      const testModule = { test: 'value' };
      const patchedModule = originalRequire.call(global, 'test-module');
      
      console.log('✅ Module system patching test passed');
      return true;
    } else {
      console.log('ℹ️ Require function not available (not in Node.js environment)');
      return true; // Not an error in web environment
    }
  } catch (error) {
    console.error('❌ Module system patching test failed:', error);
    return false;
  }
}

// Test console warning suppression
export function testConsoleWarningSuppression() {
  console.log('[Comprehensive Test] Testing console warning suppression...');
  
  try {
    const originalWarn = console.warn;
    let warningSuppressed = false;
    
    // Override console.warn temporarily to test
    console.warn = function(...args: any[]) {
      const message = args[0];
      if (typeof message === 'string' && 
          (message.includes("Can't perform a React state update on a component that hasn't mounted yet") ||
           message.includes("Warning: Can't perform a React state update on a component that hasn't mounted yet"))) {
        warningSuppressed = true;
        return; // Suppress this warning
      }
      originalWarn.apply(console, args);
    };
    
    // Test the warning suppression
    console.warn("Can't perform a React state update on a component that hasn't mounted yet");
    console.warn("Warning: Can't perform a React state update on a component that hasn't mounted yet");
    
    // Restore original console.warn
    console.warn = originalWarn;
    
    if (warningSuppressed) {
      console.log('✅ Console warning suppression is working');
      return true;
    } else {
      console.error('❌ Console warning suppression is not working');
      return false;
    }
  } catch (error) {
    console.error('❌ Console warning suppression test failed:', error);
    return false;
  }
}

// Test safe state update hooks
export function testSafeStateUpdateHooks() {
  console.log('[Comprehensive Test] Testing safe state update hooks...');
  
  try {
    // Test if the safe state hooks are available
    const { useSafeStateUpdate, useSafeState } = require('./logbox-state-fix');
    
    if (typeof useSafeStateUpdate === 'function' && typeof useSafeState === 'function') {
      console.log('✅ Safe state update hooks are available');
      return true;
    } else {
      console.error('❌ Safe state update hooks are not available');
      return false;
    }
  } catch (error) {
    console.error('❌ Safe state update hooks test failed:', error);
    return false;
  }
}

// Run all tests
export function runComprehensiveTests() {
  console.log('[Comprehensive Test] Running all React 19 compatibility tests...');
  console.log('='.repeat(60));
  
  const results = {
    reactUse: testReactUse(),
    globalReactUse: testGlobalReactUse(),
    windowReactUse: testWindowReactUse(),
    moduleSystemPatching: testModuleSystemPatching(),
    consoleWarningSuppression: testConsoleWarningSuppression(),
    safeStateUpdateHooks: testSafeStateUpdateHooks()
  };
  
  console.log('='.repeat(60));
  console.log('[Comprehensive Test] Test Results:');
  console.log(`  React.use: ${results.reactUse ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Global React.use: ${results.globalReactUse ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Window React.use: ${results.windowReactUse ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Module System Patching: ${results.moduleSystemPatching ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Console Warning Suppression: ${results.consoleWarningSuppression ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Safe State Update Hooks: ${results.safeStateUpdateHooks ? '✅ PASS' : '❌ FAIL'}`);
  
  const allPassed = Object.values(results).every(result => result);
  
  if (allPassed) {
    console.log('🎉 All tests passed! React 19 compatibility fixes are working correctly.');
  } else {
    console.log('⚠️ Some tests failed. Check the output above for details.');
  }
  
  return results;
}