import type { Config } from 'jest';

const config: Config = {
  testEnvironment: 'jsdom',
  testMatch: ['**/__tests__/**/*.test.ts?(x)', '**/tests/**/*.test.ts?(x)'],
  setupFilesAfterEnv: ['<rootDir>/tests/config/jest.setup.ts'],
  moduleNameMapper: {
    '^msw/node$': '<rootDir>/node_modules/msw/lib/node/index.js',
    '^@mswjs/interceptors/(.*)$': '<rootDir>/node_modules/@mswjs/interceptors/lib/node/$1/index.js',
    '^@/(.*)$': '<rootDir>/$1',
    '^@app/(.*)$': '<rootDir>/app/$1',
    '^@modules/(.*)$': '<rootDir>/modules/$1',
    '^@components/(.*)$': '<rootDir>/components/$1',
    '^@lib/(.*)$': '<rootDir>/lib/$1',
    '^@state/(.*)$': '<rootDir>/state/$1',
    '^@schemas/(.*)$': '<rootDir>/schemas/$1',
    '^@hooks/(.*)$': '<rootDir>/hooks/$1',
    '^@constants/(.*)$': '<rootDir>/constants/$1',
    '^@backend/(.*)$': '<rootDir>/backend/$1',
    '\\.(css|less|scss)$': '<rootDir>/tests/config/styleMock.js',
    '\\.(jpg|jpeg|png|gif|svg)$': '<rootDir>/tests/config/fileMock.js'
  },
  collectCoverageFrom: [
    'app/**/*.{ts,tsx}',
    'modules/**/*.{ts,tsx}',
    'components/**/*.{ts,tsx}',
    'lib/**/*.{ts,tsx}',
    'state/**/*.{ts,tsx}',
    'schemas/**/*.{ts,tsx}',
    'backend/**/*.{ts,tsx}',
    'hooks/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/__tests__/**',
    '!**/tests/**'
  ],
  coverageThreshold: {
    global: { branches: 70, functions: 80, lines: 85, statements: 85 },
    './schemas/**': { branches: 90, functions: 95, lines: 95, statements: 95 },
    './state/**': { branches: 75, functions: 85, lines: 85, statements: 85 }
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|expo|@expo|@unimodules|@react-navigation|@tanstack|msw|@mswjs|until-async)/)'
  ],
  globals: {
    __DEV__: true
  },
  transform: {
    '^.+\\.(t|j)sx?$': 'babel-jest'
  }
};

export default config;
