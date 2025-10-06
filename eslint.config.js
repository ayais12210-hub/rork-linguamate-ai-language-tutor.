import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import reactHooks from 'eslint-plugin-react-hooks';
import jest from 'eslint-plugin-jest';
import testingLibrary from 'eslint-plugin-testing-library';
import reactNative from 'eslint-plugin-react-native';
import importPlugin from 'eslint-plugin-import';

export default [
  js.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        project: './tsconfig.json',
      },
      globals: {
        global: true,
        process: true,
        console: true,
        Buffer: true,
        __dirname: true,
        __filename: true,
        module: true,
        require: true,
        exports: true,
        fetch: true,
        setTimeout: true,
        clearTimeout: true,
        setInterval: true,
        clearInterval: true,
        crypto: true,
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
      'react-hooks': reactHooks,
      'react-native': reactNative,
      'import': importPlugin,
    },
    rules: {
      'react/no-unescaped-entities': 'off',
      'react/react-in-jsx-scope': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-misused-promises': 'warn',
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-call': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'warn',
      '@typescript-eslint/no-unsafe-return': 'warn',
      '@typescript-eslint/prefer-nullish-coalescing': 'warn',
      '@typescript-eslint/prefer-optional-chain': 'warn',
      'import/order': 'off',
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
      'prefer-const': 'error',
      'no-var': 'error',
      'react-native/no-raw-text': ['error', { skip: ['Trans'] }]
    },
    settings: {
      'import/resolver': {
        typescript: { project: ['tsconfig.json'] },
        node: { extensions: ['.ts', '.tsx', '.js', '.jsx'] }
      }
    },
  },
  {
    files: ['**/__tests__/**', '**/*.test.ts', '**/*.test.tsx'],
    languageOptions: {
      globals: {
        ...jest.configs.recommended.globals,
        describe: true,
        test: true,
        it: true,
        expect: true,
        beforeEach: true,
        afterEach: true,
        beforeAll: true,
        afterAll: true,
        jest: true,
        global: true,
        process: true,
        console: true,
        Buffer: true,
        __dirname: true,
        __filename: true,
        module: true,
        require: true,
        exports: true,
        fetch: true,
        setTimeout: true,
        clearTimeout: true,
        setInterval: true,
        clearInterval: true,
        crypto: true,
      },
    },
    plugins: {
      'jest': jest,
      'testing-library': testingLibrary,
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'jest/expect-expect': 'off',
      'jest/no-disabled-tests': 'warn',
      'jest/no-focused-tests': 'error',
      'jest/no-identical-title': 'error',
      'jest/prefer-to-have-length': 'warn',
      'jest/valid-expect': 'error',
    }
  },
  {
    ignores: [
      'dist/',
      '.expo/',
      'coverage/',
      'android/',
      'ios/',
      '**/*.png',
      '**/*.mp3',
      '**/*.svg',
      'node_modules/',
      '*.d.ts',
      '.lighthouserc.js',
      '*.config.js',
      '*.config.ts'
    ]
  }
];