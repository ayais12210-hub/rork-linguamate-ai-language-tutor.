/**
 * Global type definitions for React Native and Expo environment
 * 
 * This file provides TypeScript definitions for global variables
 * that are available in React Native and Expo environments.
 */

declare global {
  /**
   * Development mode flag available in React Native
   * This is true in development builds and false in production
   */
  var __DEV__: boolean;

  /**
   * Metro bundler flag for development
   */
  var __METRO__: boolean | undefined;

  /**
   * Expo development flag
   */
  var __EXPO_DEV__: boolean | undefined;

  namespace NodeJS {
    interface Global {
      __DEV__: boolean;
      __METRO__: boolean | undefined;
      __EXPO_DEV__: boolean | undefined;
    }
  }
}

export {};
