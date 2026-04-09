import tseslintPlugin from '@typescript-eslint/eslint-plugin';
import tseslintParser from '@typescript-eslint/parser';
import n8nNodesBase from 'eslint-plugin-n8n-nodes-base';
import { fixupPluginRules } from '@eslint/compat';

const n8nPlugin = fixupPluginRules(n8nNodesBase);

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
	{
		files: ['nodes/**/*.ts'],
		plugins: {
			'n8n-nodes-base': n8nPlugin,
		},
		rules: {
			...n8nNodesBase.configs.nodes.rules,
		},
	},
	{
		files: ['credentials/**/*.ts'],
		plugins: {
			'n8n-nodes-base': n8nPlugin,
		},
		rules: {
			...n8nNodesBase.configs.credentials.rules,
			'n8n-nodes-base/cred-class-field-documentation-url-miscased': 'off',
		},
	},
];
