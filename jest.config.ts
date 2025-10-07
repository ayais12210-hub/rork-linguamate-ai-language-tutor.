import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  testMatch: ['**/__tests__/**/*.test.ts?(x)', '**/tests/**/*.test.ts?(x)'],
  setupFiles: ['<rootDir>/tests/config/polyfills.js'],
  setupFilesAfterEnv: ['<rootDir>/tests/config/jest.setup.ts'],
  moduleNameMapper: {
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
    '^react-native$': '<rootDir>/tests/config/react-native-mock.js',
    '\\.(css|less|scss)$': '<rootDir>/tests/config/styleMock.js',
    '\\.(jpg|jpeg|png|gif|svg)$': '<rootDir>/tests/config/fileMock.js',
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
    global: { branches: 75, functions: 80, lines: 80, statements: 80 },
    './schemas/**': { branches: 90, functions: 95, lines: 95, statements: 95 },
    './state/**': { branches: 75, functions: 85, lines: 85, statements: 85 },
    './lib/**': { branches: 70, functions: 75, lines: 75, statements: 75 },
    './components/**': { branches: 70, functions: 75, lines: 75, statements: 75 }
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native|expo(nent)?|@expo(nent)?/.*|@testing-library|react-clone-referenced-element|@react-navigation|@tanstack|msw|@mswjs|until-async|strict-event-emitter)/)'
  ],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        jsx: 'react',
      },
      useESM: true,
    }],
  },
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
};

export default config;
