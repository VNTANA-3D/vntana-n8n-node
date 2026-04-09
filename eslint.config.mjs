import tseslintPlugin from '@typescript-eslint/eslint-plugin';
import tseslintParser from '@typescript-eslint/parser';

export default [
	{ ignores: ['dist/**', 'node_modules/**', 'gulpfile.js'] },
	{
		files: ['**/*.ts'],
		languageOptions: {
			parser: tseslintParser,
			parserOptions: {
				projectService: true,
				tsconfigRootDir: import.meta.dirname,
			},
		},
		plugins: {
			'@typescript-eslint': tseslintPlugin,
		},
		rules: {
			...tseslintPlugin.configs['recommended'].rules,
			'@typescript-eslint/no-explicit-any': 'warn',
			'@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
			'no-console': 'warn',
			'prefer-const': 'error',
		},
	},
];
