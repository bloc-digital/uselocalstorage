import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import prettier from 'eslint-plugin-prettier'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'prettier': prettier
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      'padding-line-between-statements': 'warn', // require a new line between statements/functions
      'newline-before-return': 'warn', // there should be a new line before calling return
      'prefer-const': 'warn', // where possible const should be used
      'no-empty': 'warn', // no block (function/if statement) should be empty
      'no-else-return': 'warn', // else returns are not required
      'prettier/prettier': 'warn', // code should be formatted to match the prettier spec
      'no-async-promise-executor': 'off', // allow async in promise
      '@typescript-eslint/no-unused-expressions': 'off', // allow unused expressions
    },
  },
)
