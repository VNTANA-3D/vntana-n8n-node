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
		const { email, password, organizationSlug, baseUrl } = credentials;

		const slug = typeof organizationSlug === 'string' ? organizationSlug.trim().toLowerCase() : '';
		if (!slug) {
			throw new Error('Organization Slug is required. Enter the slug from your VNTANA platform URL (e.g. "acme-corp").');
		}

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

		// Step 2: Resolve organization UUID from slug by listing orgs with the login token
		const orgsListOptions: IHttpRequestOptions = {
			method: 'GET',
			url: `${baseUrl}/v1/organizations`,
			headers: {
				'X-AUTH-TOKEN': `Bearer ${loginToken}`,
				Accept: 'application/json',
			},
			json: true,
		};

		const orgsResponse = await this.helpers.httpRequest(orgsListOptions) as {
			response?: { grid?: Array<{ uuid?: string; slug?: string; name?: string }> };
		};
		const grid = orgsResponse?.response?.grid ?? [];
		const match = grid.find(o => typeof o.slug === 'string' && o.slug.trim().toLowerCase() === slug);

		if (!match?.uuid) {
			const availableSlugs = grid
				.map(o => o.slug)
				.filter((s): s is string => typeof s === 'string' && s.length > 0);
			const availableList = availableSlugs.length > 0
				? availableSlugs.join(', ')
				: '(no organizations returned for this account)';
			throw new Error(`Organization slug "${organizationSlug}" not found. Available slugs: ${availableList}`);
		}

		const organizationUuid = match.uuid;

		// Step 3: Refresh token with resolved organization UUID to get org-specific token
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

		return { orgToken, organizationUuid };
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
			displayName: 'Organization Slug',
			name: 'organizationSlug',
			type: 'string',
			default: '',
			required: true,
			placeholder: 'acme-corp',
			description: 'The slug for your VNTANA organization. Find it in your platform URL — e.g. the "acme-corp" in app.vntana.com/acme-corp/... . The node will look up the Organization UUID automatically.',
		},
		{
			displayName: 'Organization UUID',
			name: 'organizationUuid',
			type: 'hidden',
			default: '',
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
