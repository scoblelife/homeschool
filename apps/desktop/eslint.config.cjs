/**
 * ESLint Configuration (Flat Config Format)
 *
 * Includes design system rules to enforce consistent component usage.
 */

const js = require('@eslint/js')
const globals = require('globals')
const tseslint = require('typescript-eslint')
const react = require('eslint-plugin-react')
const reactHooks = require('eslint-plugin-react-hooks')
const designSystem = require('./tools/eslint-plugin-design-system')

module.exports = [
  {
    ignores: [
      '**/node_modules/**',
      '**/out/**',
      '**/dist/**',
      '**/.electron-vite/**',
      '**/storybook-static/**',
      '**/*.config.js',
      '**/*.config.ts',
      'eslint.config.cjs',
      'tools/**',
      'mobile/plugins/**',
      'mobile/src/errorReporting/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: {
      react,
      'react-hooks': reactHooks,
      'design-system': designSystem,
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      // React
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',

      // TypeScript
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],

      // Design System Rules
      'design-system/no-hardcoded-colors': 'error',
      'design-system/require-design-system-components': 'error',
      'design-system/no-legacy-classes': 'error',
      'design-system/pages-use-components-only': 'error',
    },
  },
  {
    // Stricter rules in UI component library
    files: ['src/renderer/src/components/ui/**/*.{ts,tsx}'],
    rules: {
      'design-system/no-hardcoded-colors': 'error',
      'design-system/no-legacy-classes': 'error',
    },
  },
]
