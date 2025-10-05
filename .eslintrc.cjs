module.exports = {
  root: true,
  extends: [
    'eslint-config-expo',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'plugin:jest/recommended',
    'plugin:testing-library/react',
    // Note: Install eslint-plugin-security and eslint-plugin-unicorn
    // npm install --save-dev eslint-plugin-security eslint-plugin-unicorn
    // 'plugin:security/recommended',
    // 'plugin:unicorn/recommended',
  ],
  plugins: [
    '@typescript-eslint',
    'import',
    'jest',
    'testing-library',
    'react-native',
    // 'security',
    // 'unicorn',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: './tsconfig.json'
  },
  rules: {
    // React & JSX
    'react/no-unescaped-entities': 'off',
    'react/react-in-jsx-scope': 'off',
    'react-native/no-raw-text': ['error', { skip: ['Trans'] }],
    
    // TypeScript
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-non-null-assertion': 'warn',
    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/await-thenable': 'error',
    '@typescript-eslint/no-misused-promises': 'error',
    
    // Import ordering
    'import/order': [
      'error',
      {
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
        'newlines-between': 'always',
        alphabetize: { order: 'asc', caseInsensitive: true }
      }
    ],
    'import/no-duplicates': 'error',
    'import/no-unused-modules': 'warn',
    
    // General code quality
    'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
    'prefer-const': 'error',
    'no-var': 'error',
    'eqeqeq': ['error', 'always', { null: 'ignore' }],
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'no-return-await': 'error',
    'require-await': 'error',
    'no-throw-literal': 'error',
    
    // Security rules (uncomment after installing eslint-plugin-security)
    // 'security/detect-object-injection': 'warn',
    // 'security/detect-non-literal-regexp': 'warn',
    // 'security/detect-unsafe-regex': 'error',
    // 'security/detect-buffer-noassert': 'error',
    // 'security/detect-child-process': 'warn',
    // 'security/detect-disable-mustache-escape': 'error',
    // 'security/detect-eval-with-expression': 'error',
    // 'security/detect-no-csrf-before-method-override': 'error',
    // 'security/detect-possible-timing-attacks': 'warn',
    
    // Unicorn rules (uncomment after installing eslint-plugin-unicorn)
    // 'unicorn/prevent-abbreviations': 'off',
    // 'unicorn/filename-case': 'off',
    // 'unicorn/no-null': 'off',
    // 'unicorn/prefer-module': 'off',
    // 'unicorn/prefer-node-protocol': 'error',
    // 'unicorn/prefer-ternary': 'warn',
    // 'unicorn/no-array-for-each': 'warn',
    // 'unicorn/prefer-array-some': 'error',
    // 'unicorn/explicit-length-check': 'error',
  },
  overrides: [
    {
      files: ['**/__tests__/**', '**/*.test.ts', '**/*.test.tsx', '**/tests/**'],
      env: { jest: true },
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
        'no-console': 'off',
      }
    },
    {
      files: ['scripts/**/*.ts', 'scripts/**/*.js'],
      rules: {
        'no-console': 'off',
      }
    }
  ]
};
