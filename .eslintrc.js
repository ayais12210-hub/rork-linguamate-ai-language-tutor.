module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
    project: './tsconfig.json',
  },
  plugins: [
    '@typescript-eslint',
    'react',
    'react-native',
    'react-hooks',
    'import',
    'jest',
    'testing-library',
    'security',
    'unicorn',
  ],
  extends: [
    'expo',
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:react-native/all',
    'plugin:jest/recommended',
    'plugin:testing-library/react',
    'plugin:security/recommended',
  ],
  env: {
    browser: true,
    es2020: true,
    node: true,
    'react-native/react-native': true,
    jest: true,
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  rules: {
    // TypeScript rules
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-non-null-assertion': 'warn',
    
    // React rules
    'react/react-in-jsx-scope': 'off', // Not needed with React 17+
    'react/prop-types': 'off', // Using TypeScript
    'react/display-name': 'off',
    
    // React Native rules
    'react-native/no-unused-styles': 'error',
    'react-native/split-platform-components': 'error',
    'react-native/no-inline-styles': 'warn',
    'react-native/no-color-literals': 'warn',
    'react-native/no-raw-text': ['error', {
      skip: ['Text'],
    }],
    
    // Custom rule for React Native text nodes
    'no-restricted-syntax': [
      'error',
      {
        selector: 'JSXElement[openingElement.name.name="View"] > JSXText[value=/[^\\s]/]',
        message: 'Text strings must be wrapped in a <Text> component. Direct text nodes are not allowed as children of <View> components.',
      },
    ],
    
    // Import rules
    'import/order': ['error', {
      groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
      'newlines-between': 'always',
      alphabetize: { order: 'asc', caseInsensitive: true },
    }],
    'import/no-duplicates': 'error',
    
    // Security rules
    'security/detect-object-injection': 'warn',
    'security/detect-non-literal-regexp': 'warn',
    
    // Unicorn rules
    'unicorn/filename-case': ['error', { case: 'kebabCase' }],
    'unicorn/no-null': 'off',
    'unicorn/prevent-abbreviations': 'off',
    'unicorn/prefer-module': 'off',
    
    // General rules
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'prefer-const': 'error',
    'no-var': 'error',
    eqeqeq: ['error', 'always', { null: 'ignore' }],
    curly: ['error', 'all'],
    'no-throw-literal': 'error',
  },
  overrides: [
    {
      files: ['*.test.ts', '*.test.tsx', '**/__tests__/**/*'],
      env: {
        jest: true,
      },
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        'security/detect-object-injection': 'off',
      },
    },
  ],
};