import type {
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class VntanaApi implements ICredentialType {
	name = 'vntanaApi';
	displayName = 'VNTANA API';
	documentationUrl = 'https://help.vntana.com/api-documentation';

	// Test credentials by attempting login
	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://api-platform.vntana.com',
			url: '/v1/auth/login',
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: {
				email: '={{$credentials.email}}',
				password: '={{$credentials.password}}',
			},
		},
	};

	properties: INodeProperties[] = [
		{
			displayName: 'Email',
			name: 'email',
			type: 'string',
			placeholder: 'user@example.com',
			default: '',
			required: true,
			description: 'Email address for your VNTANA account',
		},
		{
			displayName: 'Password',
			name: 'password',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
			description: 'Password for your VNTANA account',
		},
		{
			displayName: 'Organization UUID',
			name: 'organizationUuid',
			type: 'string',
			default: '',
			required: true,
			description: 'UUID of your VNTANA organization',
		},
		{
			displayName: 'Default Workspace UUID',
			name: 'defaultClientUuid',
			type: 'string',
			default: '',
			required: false,
			description: 'Default workspace (client) UUID to use when not specified in operations',
		},
		{
			displayName: 'API Base URL',
			name: 'baseUrl',
			type: 'string',
			default: '',
			required: false,
			description: 'Optional custom API base URL for staging/test environments. Leave empty for production (https://api-platform.vntana.com)',
		},
	];
}
