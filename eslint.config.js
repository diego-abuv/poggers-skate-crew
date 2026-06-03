import globals from 'globals';
import js from '@eslint/js';
import prettier from 'eslint-config-prettier';

export default [
  js.configs.recommended,
  prettier,
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.es2021 },
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    rules: {
      'no-var': 'warn',
      'prefer-const': 'warn',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
];
