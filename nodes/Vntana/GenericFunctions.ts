import type {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestMethods,
	IHttpRequestOptions,
	INodeExecutionData,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';

const BASE_URL = 'https://api-platform.vntana.com';

// Token cache to avoid re-authenticating on every request within the same execution
let cachedToken: { token: string; timestamp: number } | null = null;
const TOKEN_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Authenticate with VNTANA using email/password, then refresh with organization UUID
 * Returns a Bearer token string ready to use in headers
 */
async function getAuthToken(
	executeFunctions: IExecuteFunctions,
): Promise<string> {
	// Check cache first
	if (cachedToken && Date.now() - cachedToken.timestamp < TOKEN_CACHE_TTL) {
		return cachedToken.token;
	}

	const credentials = await executeFunctions.getCredentials('vntanaApi');
	const email = credentials.email as string;
	const password = credentials.password as string;
	const organizationUuid = credentials.organizationUuid as string;

	// Step 1: Login to get initial token
	const loginOptions: IHttpRequestOptions = {
		method: 'POST',
		url: `${BASE_URL}/v1/auth/login`,
		headers: {
			'Content-Type': 'application/json',
		},
		body: {
			email,
			password,
		},
		json: true,
		returnFullResponse: true,
	};

	let loginResponse;
	try {
		loginResponse = await executeFunctions.helpers.httpRequest(loginOptions);
	} catch (error) {
		throw new NodeApiError(executeFunctions.getNode(), error as JsonObject, {
			message: 'VNTANA login failed - check your email and password',
		});
	}

	const loginToken = loginResponse.headers?.['x-auth-token'];
	if (!loginToken) {
		throw new NodeApiError(executeFunctions.getNode(), {} as JsonObject, {
			message: 'No auth token received from VNTANA login',
		});
	}

	// Step 2: Refresh token with organization UUID to get org-specific token
	const refreshOptions: IHttpRequestOptions = {
		method: 'POST',
		url: `${BASE_URL}/v1/auth/refresh-token`,
		headers: {
			'X-AUTH-TOKEN': `Bearer ${loginToken}`,
			'organizationUuid': organizationUuid,
		},
		json: true,
		returnFullResponse: true,
	};

	let refreshResponse;
	try {
		refreshResponse = await executeFunctions.helpers.httpRequest(refreshOptions);
	} catch (error) {
		throw new NodeApiError(executeFunctions.getNode(), error as JsonObject, {
			message: 'VNTANA token refresh failed - check your organization UUID',
		});
	}

	const refreshToken = refreshResponse.headers?.['x-auth-token'];
	if (!refreshToken) {
		throw new NodeApiError(executeFunctions.getNode(), {} as JsonObject, {
			message: 'No refresh token received from VNTANA',
		});
	}

	// Cache the token
	const bearerToken = `Bearer ${refreshToken}`;
	cachedToken = {
		token: bearerToken,
		timestamp: Date.now(),
	};

	return bearerToken;
}

/**
 * Make an authenticated request to the VNTANA API
 */
export async function vntanaApiRequest(
	this: IExecuteFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	body: IDataObject = {},
	qs: IDataObject = {},
	options: Partial<IHttpRequestOptions> = {},
): Promise<IDataObject> {
	// Get auth token (handles login flow automatically)
	const authToken = await getAuthToken(this);

	const requestOptions: IHttpRequestOptions = {
		method,
		url: `${BASE_URL}${endpoint}`,
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			'X-AUTH-TOKEN': authToken,
		},
		qs,
		body,
		json: true,
		...options,
	};

	// Remove empty body for GET requests
	if (method === 'GET') {
		delete requestOptions.body;
	}

	// Remove empty qs
	if (Object.keys(qs).length === 0) {
		delete requestOptions.qs;
	}

	// Remove empty body
	if (Object.keys(body).length === 0 && method !== 'GET') {
		delete requestOptions.body;
	}

	try {
		const response = await this.helpers.httpRequest(requestOptions);

		// VNTANA wraps responses in { success, errors, response }
		if (response.success === false) {
			const errorMessage = Array.isArray(response.errors) && response.errors.length > 0
				? response.errors.map((e: IDataObject) => e.message || JSON.stringify(e)).join(', ')
				: 'Unknown VNTANA API error';
			throw new NodeApiError(this.getNode(), response as JsonObject, { message: errorMessage });
		}

		return response as IDataObject;
	} catch (error) {
		throw new NodeApiError(this.getNode(), error as JsonObject);
	}
}

/**
 * Make a request to download binary data from VNTANA API
 */
export async function vntanaApiRequestBinary(
	this: IExecuteFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	qs: IDataObject = {},
): Promise<Buffer> {
	// Get auth token (handles login flow automatically)
	const authToken = await getAuthToken(this);

	const requestOptions: IHttpRequestOptions = {
		method,
		url: `${BASE_URL}${endpoint}`,
		headers: {
			Accept: '*/*',
			'X-AUTH-TOKEN': authToken,
		},
		qs,
		encoding: 'arraybuffer',
		returnFullResponse: false,
	};

	if (Object.keys(qs).length === 0) {
		delete requestOptions.qs;
	}

	try {
		const response = await this.helpers.httpRequest(requestOptions);
		return response as Buffer;
	} catch (error) {
		throw new NodeApiError(this.getNode(), error as JsonObject);
	}
}

/**
 * Make an authenticated request with pagination support
 */
export async function vntanaApiRequestAllItems(
	this: IExecuteFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	body: IDataObject = {},
	qs: IDataObject = {},
): Promise<IDataObject[]> {
	const returnData: IDataObject[] = [];
	// VNTANA uses 1-based pagination
	let page = 1;
	const size = 50;
	let hasMore = true;

	while (hasMore) {
		// For POST endpoints, pagination params go in body
		const requestBody = { ...body, page, size };
		const response = await vntanaApiRequest.call(this, method, endpoint, requestBody, qs);

		const items = (response.response as IDataObject)?.grid as IDataObject[];
		if (items && items.length > 0) {
			returnData.push(...items);
			const totalCount = (response.response as IDataObject)?.totalCount as number;
			hasMore = returnData.length < totalCount;
			page++;
		} else {
			hasMore = false;
		}
	}

	return returnData;
}

/**
 * Upload binary data to a signed URL (Google Cloud Storage)
 * Note: This does NOT use VNTANA auth - the signed URL includes authentication
 */
export async function uploadToSignedUrl(
	this: IExecuteFunctions,
	signedUrl: string,
	binaryData: Buffer,
	contentType: string,
): Promise<void> {
	const requestOptions: IHttpRequestOptions = {
		method: 'POST',
		url: signedUrl,
		headers: {
			'Origin': 'https://api-platform.vntana.com',
			'Content-Type': contentType,
			'Content-Length': binaryData.length.toString(),
		},
		body: binaryData,
		returnFullResponse: true,
	};

	try {
		await this.helpers.httpRequest(requestOptions);
		// Google Cloud Storage signed URLs return empty response on success
	} catch (error) {
		throw new NodeApiError(this.getNode(), error as JsonObject, {
			message: 'Failed to upload file to signed URL',
		});
	}
}

/**
 * Download binary data from a URL (e.g., attachment download)
 */
export async function downloadFromUrl(
	this: IExecuteFunctions,
	url: string,
): Promise<Buffer> {
	const requestOptions: IHttpRequestOptions = {
		method: 'GET',
		url,
		encoding: 'arraybuffer',
		returnFullResponse: false,
	};

	try {
		const response = await this.helpers.httpRequest(requestOptions);
		return response as Buffer;
	} catch (error) {
		throw new NodeApiError(this.getNode(), error as JsonObject);
	}
}

/**
 * Convert VNTANA API response items to n8n execution data format
 */
export function prepareOutputItems(items: IDataObject[]): INodeExecutionData[] {
	return items.map((item) => ({
		json: item,
	}));
}

/**
 * Get the workspace UUID, either from the parameter or from credentials default
 */
export async function getClientUuid(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<string> {
	const clientUuid = this.getNodeParameter('clientUuid', itemIndex, '') as string;

	if (clientUuid) {
		return clientUuid;
	}

	// Fall back to default from credentials
	const credentials = await this.getCredentials('vntanaApi');
	const defaultClientUuid = credentials.defaultClientUuid as string;

	if (!defaultClientUuid) {
		throw new NodeApiError(this.getNode(), {
			message: 'No workspace UUID provided and no default workspace configured in credentials',
		} as JsonObject);
	}

	return defaultClientUuid;
}

/**
 * Clear the cached token (useful for testing or forced re-authentication)
 */
export function clearTokenCache(): void {
	cachedToken = null;
}
