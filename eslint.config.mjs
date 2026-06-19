import js from '@eslint/js';
import parser from '@typescript-eslint/parser';
import plugin from '@typescript-eslint/eslint-plugin';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default [
  {
    ignores: ['dist/**', 'coverage/**', 'node_modules/**']
  },
  js.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser,
      globals: {
        ...globals.node
      }
    },
    plugins: {
      '@typescript-eslint': plugin
    },
    rules: {
      'no-undef': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_'
        }
      ],
      'comma-dangle': ['error', 'never'],
      'padding-line-between-statements': [
        'error',
        { blankLine: 'always', prev: 'const', next: 'if' },
        { blankLine: 'never', prev: 'if', next: 'return' },
        { blankLine: 'always', prev: '*', next: 'return' },
        { blankLine: 'any', prev: 'function', next: '*' }
      ],
      'no-trailing-spaces': 'error',
      semi: ['error', 'always'],
      quotes: ['error', 'single'],
      indent: ['error', 2]
    }
  },
  {
    files: ['tests/**/*.ts', '**/*.test.ts', 'jest.config.ts'],
    languageOptions: {
      globals: {
        ...globals.jest
      }
    }
  },
  prettier
];
