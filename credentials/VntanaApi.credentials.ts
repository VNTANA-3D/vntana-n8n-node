import {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class VntanaApi implements ICredentialType {
	name = 'vntanaApi';
	displayName = 'VNTANA API';
	documentationUrl = 'https://help.vntana.com/api-documentation';

	properties: INodeProperties[] = [
		{
			displayName: 'API Token',
			name: 'apiToken',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
			description: 'Organization-specific X-AUTH-TOKEN from VNTANA. Obtain by logging in and refreshing with your organization UUID.',
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
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				'X-AUTH-TOKEN': '={"Bearer " + $credentials.apiToken}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://api-platform.vntana.com',
			url: '/v1/organizations/current',
		},
	};
}
