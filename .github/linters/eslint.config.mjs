import eslint from '@eslint/js'
import importplugin from 'eslint-plugin-import'
import jestplugin from 'eslint-plugin-jest'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  // Ignore non-project files
  {
    name: 'ignore',
    ignores: ['.github', 'dist', 'coverage', '**/*.json', 'jest.setup.js']
  },
  // Use recommended rules from ESLint, TypeScript, and other plugins
  eslint.configs.recommended,
  tseslint.configs.recommendedTypeChecked,
  jestplugin.configs['flat/recommended'],
  importplugin.flatConfigs.recommended,
  importplugin.flatConfigs.typescript,
  // Override some rules
  {
    name: 'project-settings',
    languageOptions: {
      ecmaVersion: 2023,
      parserOptions: {
        project: ['./.github/linters/tsconfig.json', './tsconfig.json']
      }
    },
    rules: {
      // eslint rules
      eqeqeq: ['error', 'smart'],
      'func-style': ['error', 'declaration', { allowArrowFunctions: true }],
      'no-console': 'off',
      'no-implicit-globals': 'error',
      'no-inner-declarations': 'error',
      'no-invalid-this': 'error',
      'no-return-assign': 'error',
      'no-sequences': 'error',
      'no-shadow': 'error',
      'no-useless-concat': 'error',
      'object-shorthand': ['error', 'always', { avoidQuotes: true }],
      'one-var': ['error', 'never'],
      'prefer-template': 'error',

      // typescript-eslint rules
      '@typescript-eslint/array-type': 'error',
      '@typescript-eslint/consistent-type-assertions': 'error',
      '@typescript-eslint/explicit-function-return-type': [
        'error',
        { allowExpressions: true }
      ],
      '@typescript-eslint/explicit-member-accessibility': [
        'error',
        { accessibility: 'no-public' }
      ],
      '@typescript-eslint/no-extraneous-class': 'error',
      '@typescript-eslint/no-inferrable-types': 'error',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/no-unnecessary-qualifier': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-useless-constructor': 'error',
      '@typescript-eslint/prefer-for-of': 'warn',
      '@typescript-eslint/prefer-function-type': 'warn',
      '@typescript-eslint/prefer-includes': 'error',
      '@typescript-eslint/prefer-string-starts-ends-with': 'error',
      '@typescript-eslint/promise-function-async': 'error',
      '@typescript-eslint/require-array-sort-compare': 'error',
      '@typescript-eslint/restrict-template-expressions': 'off',

      // eslint-plugin-import rules
      'import/extensions': 'error',
      'import/first': 'error',
      'import/no-absolute-path': 'error',
      'import/no-commonjs': 'error',
      'import/no-deprecated': 'warn',
      'import/no-dynamic-require': 'error',
      'import/no-extraneous-dependencies': 'error',
      'import/no-mutable-exports': 'error',
      'import/no-namespace': 'off',
      'import/no-unresolved': ['error', { ignore: ['csv-parse/sync'] }],
      'import/no-anonymous-default-export': [
        'error',
        {
          allowAnonymousClass: false,
          allowAnonymousFunction: false,
          allowArray: true,
          allowArrowFunction: false,
          allowLiteral: true,
          allowObject: true
        }
      ]
    }
  }
)
