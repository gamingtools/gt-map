/* eslint-env node */
module.exports = {
	root: true,
	env: { browser: true, es2022: true, node: true },
	extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'plugin:import/recommended', 'plugin:import/typescript', 'prettier'],
	parserOptions: {
		ecmaVersion: 'latest',
		sourceType: 'module',
	},
	settings: {
		'import/resolver': {
			typescript: {
				project: ['./tsconfig.json', './packages/gtmap/tsconfig.json'],
			},
		},
	},
	overrides: [
		{
			files: ['**/*.ts', '**/*.tsx'],
			parser: '@typescript-eslint/parser',
			parserOptions: {
				ecmaVersion: 'latest',
				sourceType: 'module',
			},
			rules: {
				'@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
				'@typescript-eslint/no-explicit-any': 'warn',
				// disallow unknown same as any, but still allow casting to it
				'@typescript-eslint/no-unsafe-assignment': 'warn',
				'@typescript-eslint/no-unsafe-member-access': 'warn',
				'@typescript-eslint/no-unsafe-return': 'warn',
				'@typescript-eslint/no-unsafe-call': 'warn',
			},
		},
	],
	rules: {
		'import/order': [
			'warn',
			{
				groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
				'newlines-between': 'always',
			},
		],
		'no-console': 'warn',
	},
};
