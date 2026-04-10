import { config } from '@n8n/node-cli/eslint';

const n8nRulesOff = Object.fromEntries(
	config
		.flatMap((item) => Object.keys(item.rules ?? {}))
		.filter(
			(rule) =>
				rule.startsWith('n8n-nodes-base/') || rule.startsWith('@n8n/community-nodes/'),
		)
		.map((rule) => [rule, 'off']),
);

export default [
	...config,
	{
		files: ['tests/**/*.ts', 'vitest.config.ts'],
		rules: {
			...n8nRulesOff,
			'no-console': 'off',
			'prefer-const': 'off',
			'@typescript-eslint/no-explicit-any': 'off',
			'@typescript-eslint/no-unused-vars': 'off',
		},
	},
];
