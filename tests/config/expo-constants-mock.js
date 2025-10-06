// Mock Expo Constants for Jest tests
module.exports = {
  default: {
    appOwnership: 'expo',
    debugMode: false,
    deviceName: 'Test Device',
    deviceYearClass: 2020,
    executionEnvironment: 'standalone',
    expoVersion: '53.0.0',
    isDevice: true,
    linkingUri: 'exp://192.168.1.100:8081',
    manifest: {
      id: '@test/app',
      name: 'Test App',
      slug: 'test-app',
      version: '1.0.0',
      platform: ['ios', 'android', 'web'],
    },
    nativeAppVersion: '1.0.0',
    nativeBuildVersion: '1',
    platform: {
      ios: {
        buildNumber: '1',
        platform: 'ios',
        userInterfaceIdiom: 'handset',
        systemVersion: '17.0',
      },
      android: {
        versionCode: 1,
        platform: 'android',
      },
    },
    sessionId: 'test-session-id',
    statusBarHeight: 44,
    systemVersion: '17.0',
  },
};