// Flat config for ESLint v9+
import globals from 'globals'
import tseslint from 'typescript-eslint'
import importPlugin from 'eslint-plugin-import'
import prettier from 'eslint-config-prettier'

export default [
  // Ignore JS and build artifacts (TS-first repo)
  { ignores: ['**/*.js', 'node_modules/**', 'packages/**/dist/**', 'build/**', 'coverage/**'] },

  // TS files (non-project, e.g., app vite config, demo)
  {
    files: ['**/*.ts', '**/*.tsx'],
    ignores: ['packages/gtmap/**'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parser: tseslint.parser,
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: { import: importPlugin, '@typescript-eslint': tseslint.plugin },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'import/no-unused-modules': ['warn', { unusedExports: true }],
      'import/order': [
        'warn',
        { groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'], 'newlines-between': 'always' },
      ],
    },
  },

  // TS files (project-aware for library)
  {
    files: ['packages/gtmap/**/*.ts'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parser: tseslint.parser,
      parserOptions: {
        projectService: true,
        project: ['./packages/gtmap/tsconfig.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: { import: importPlugin, '@typescript-eslint': tseslint.plugin },
    settings: {
      'import/resolver': {
        typescript: {
          project: ['./tsconfig.json', './packages/gtmap/tsconfig.json'],
        },
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'import/no-unused-modules': ['warn', { unusedExports: true }],
      'import/order': [
        'warn',
        { groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'], 'newlines-between': 'always' },
      ],
    },
  },

  // Disable stylistic conflicts in favor of Prettier
  prettier,
]
