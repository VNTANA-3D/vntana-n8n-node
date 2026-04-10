import {
	IAuthenticateGeneric,
	type ICredentialDataDecryptedObject,
	type ICredentialTestRequest,
	type ICredentialType,
	type IHttpRequestHelper,
	type IHttpRequestOptions,
	type INodeProperties,
} from 'n8n-workflow';

export class VntanaApi implements ICredentialType {
	name = 'vntanaApi';
	displayName = 'VNTANA API';
	documentationUrl = 'https://www.vntana.com/resource/api-documentation/';
	icon = 'file:vntana.svg' as const;
	
	// Test credentials by fetching organizations
	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.baseUrl}}',
			url: '/v1/organizations',
			method: 'GET',
			headers: {
				'X-AUTH-TOKEN': '=Bearer {{$credentials.orgToken}}',
				'Accept': 'application/json',
			},
		},
	};

	async preAuthentication(this: IHttpRequestHelper, credentials: ICredentialDataDecryptedObject) {
		const { email, password, organizationUuid, baseUrl } = credentials;

		// Step 1: Login to get initial token
		const loginOptions: IHttpRequestOptions = {
			method: 'POST',
			url: `${baseUrl}/v1/auth/login`,
			json: true,
			returnFullResponse: true,
			headers: {
				'Content-Type': 'application/json',
			},
			body: { email, password },
		};
	
		const loginResponse = await this.helpers.httpRequest(loginOptions);
	
		const loginToken = loginResponse.headers?.['x-auth-token'];
	
		// Step 2: Refresh token with organization UUID to get org-specific token
		const refreshOptions: IHttpRequestOptions = {
			method: 'POST',
			url: `${baseUrl}/v1/auth/refresh-token`,
			headers: {
				'X-AUTH-TOKEN': `Bearer ${loginToken}`,
				'organizationUuid': organizationUuid,
			},
			json: true,
			returnFullResponse: true,
		};
	
		const orgResponse = await this.helpers.httpRequest(refreshOptions);
	
		const orgToken = orgResponse.headers?.['x-auth-token'];

		return { orgToken };
	}

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				'X-AUTH-TOKEN': '=Bearer {{$credentials.orgToken}}',
			}
		}
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
			default: 'https://api-platform.vntana.com',
			required: false,
			description: 'API base URL (optionally used for staging/test environments).',
		},
		{
			displayName: 'Organization Token',
			name: 'orgToken',
			type: 'hidden',
			typeOptions: {
				expirable: true,
				password: true,
			},
			default: '',
		},
	];
}
