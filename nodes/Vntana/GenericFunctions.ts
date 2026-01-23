import type {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestMethods,
	IHttpRequestOptions,
	INodeExecutionData,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';

import type { ModelOpsParameters, OptimizationPreset } from './types';

const DEFAULT_BASE_URL = 'https://api-platform.vntana.com';

// Token cache keyed by credential hash to ensure credential changes invalidate cache
// Using a Map instead of module-level variable for better isolation
interface TokenCacheEntry {
	token: string;
	timestamp: number;
}
const tokenCache = new Map<string, TokenCacheEntry>();
const TOKEN_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Generate a cache key from credentials to ensure credential changes invalidate cache
 */
function getCredentialCacheKey(email: string, organizationUuid: string): string {
	// Use a simple hash to create a unique key per credential set
	return `${email}:${organizationUuid}`;
}

/**
 * Get the base URL from credentials or use default
 */
function getBaseUrl(credentials: IDataObject): string {
	const baseUrl = credentials.baseUrl as string | undefined;
	return baseUrl && baseUrl.trim() ? baseUrl.trim().replace(/\/$/, '') : DEFAULT_BASE_URL;
}

/**
 * Authenticate with VNTANA using email/password, then refresh with organization UUID
 * Returns a Bearer token string ready to use in headers
 */
async function getAuthToken(
	executeFunctions: IExecuteFunctions,
): Promise<string> {
	const credentials = await executeFunctions.getCredentials('vntanaApi');
	const email = credentials.email as string;
	const password = credentials.password as string;
	const organizationUuid = credentials.organizationUuid as string;
	const baseUrl = getBaseUrl(credentials);

	// Check cache using credential-based key
	const cacheKey = getCredentialCacheKey(email, organizationUuid);
	const cachedEntry = tokenCache.get(cacheKey);
	if (cachedEntry && Date.now() - cachedEntry.timestamp < TOKEN_CACHE_TTL) {
		return cachedEntry.token;
	}

	// Step 1: Login to get initial token
	const loginOptions: IHttpRequestOptions = {
		method: 'POST',
		url: `${baseUrl}/v1/auth/login`,
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
			message: 'VNTANA authentication failed',
		});
	}

	const loginToken = loginResponse.headers?.['x-auth-token'];
	if (!loginToken) {
		throw new NodeApiError(executeFunctions.getNode(), {} as JsonObject, {
			message: 'VNTANA authentication failed',
		});
	}

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

	let refreshResponse;
	try {
		refreshResponse = await executeFunctions.helpers.httpRequest(refreshOptions);
	} catch (error) {
		throw new NodeApiError(executeFunctions.getNode(), error as JsonObject, {
			message: 'VNTANA authentication failed',
		});
	}

	const refreshToken = refreshResponse.headers?.['x-auth-token'];
	if (!refreshToken) {
		throw new NodeApiError(executeFunctions.getNode(), {} as JsonObject, {
			message: 'VNTANA authentication failed',
		});
	}

	// Cache the token using credential-based key
	const bearerToken = `Bearer ${refreshToken}`;
	tokenCache.set(cacheKey, {
		token: bearerToken,
		timestamp: Date.now(),
	});

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
	const credentials = await this.getCredentials('vntanaApi');
	const baseUrl = getBaseUrl(credentials);

	const requestOptions: IHttpRequestOptions = {
		method,
		url: `${baseUrl}${endpoint}`,
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
	const credentials = await this.getCredentials('vntanaApi');
	const baseUrl = getBaseUrl(credentials);

	const requestOptions: IHttpRequestOptions = {
		method,
		url: `${baseUrl}${endpoint}`,
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
	const credentials = await this.getCredentials('vntanaApi');
	const baseUrl = getBaseUrl(credentials);

	const requestOptions: IHttpRequestOptions = {
		method: 'POST',
		url: signedUrl,
		headers: {
			'Origin': baseUrl,
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
 * Clear the cached token for specific credentials or all tokens
 * Call this when credentials are updated or on authentication failure
 */
export function clearTokenCache(email?: string, organizationUuid?: string): void {
	if (email && organizationUuid) {
		// Clear specific credential's cache
		const cacheKey = getCredentialCacheKey(email, organizationUuid);
		tokenCache.delete(cacheKey);
	} else {
		// Clear all cached tokens
		tokenCache.clear();
	}
}

/**
 * Optimization presets for 3D model processing
 */
export const OPTIMIZATION_PRESETS: Record<OptimizationPreset, ModelOpsParameters> = {
	webOptimized: {
		DRACO_COMPRESSION: { enabled: 'true' },
		OPTIMIZATION: {
			poly: '50000',
			obstructedGeometry: 'true',
			bakeSmallFeatures: 'true',
		},
		TEXTURE_COMPRESSION: {
			maxDimension: '2048',
			aggression: '3',
			lossless: 'true',
		},
		AMBIENT_OCCLUSION: {
			bake: 'true',
			strength: '1',
			radius: '5',
			resolution: '1024',
		},
		PIVOT_POINT: {
			pivot: 'bottom-center',
		},
	},
	highQuality: {
		DRACO_COMPRESSION: { enabled: 'false' },
		OPTIMIZATION: {
			poly: '100000',
			obstructedGeometry: 'false',
			bakeSmallFeatures: 'false',
		},
		TEXTURE_COMPRESSION: {
			maxDimension: '4096',
			aggression: '1',
			lossless: 'true',
		},
		AMBIENT_OCCLUSION: {
			bake: 'false',
		},
		PIVOT_POINT: {
			pivot: 'bottom-center',
		},
	},
	mobile: {
		DRACO_COMPRESSION: { enabled: 'true' },
		OPTIMIZATION: {
			poly: '25000',
			obstructedGeometry: 'true',
			bakeSmallFeatures: 'true',
		},
		TEXTURE_COMPRESSION: {
			maxDimension: '1024',
			aggression: '7',
			lossless: 'false',
		},
		AMBIENT_OCCLUSION: {
			bake: 'true',
			strength: '1',
			radius: '5',
			resolution: '512',
		},
		PIVOT_POINT: {
			pivot: 'bottom-center',
		},
	},
	preserveOriginal: {
		OPTIMIZATION: {
			desiredOutput: 'AUTO',
		},
	},
};

/**
 * Build modelOpsParameters from preset or advanced settings
 */
export function buildModelOpsParameters(
	mode: 'preset' | 'advanced',
	preset?: OptimizationPreset,
	advancedSettings?: IDataObject,
): ModelOpsParameters {
	if (mode === 'preset' && preset) {
		return OPTIMIZATION_PRESETS[preset] || OPTIMIZATION_PRESETS.webOptimized;
	}

	// Build from advanced settings
	if (!advancedSettings) {
		return OPTIMIZATION_PRESETS.webOptimized;
	}

	const params: ModelOpsParameters = {};

	// Draco compression
	params.DRACO_COMPRESSION = {
		enabled: advancedSettings.enableDracoCompression ? 'true' : 'false',
	};

	// Optimization settings
	params.OPTIMIZATION = {
		poly: String(advancedSettings.targetPolygonCount || 50000),
		forcePoly: advancedSettings.forcePolygonCount ? 'true' : 'false',
		obstructedGeometry: advancedSettings.removeObstructedGeometry ? 'true' : 'false',
		bakeSmallFeatures: advancedSettings.bakeSmallFeatures ? 'true' : 'false',
	};

	// Texture compression
	params.TEXTURE_COMPRESSION = {
		maxDimension: String(advancedSettings.maxTextureResolution || 2048),
		aggression: String(advancedSettings.textureCompressionAggression || 3),
		lossless: advancedSettings.losslessTextureCompression ? 'true' : 'false',
		ktx2: advancedSettings.useKTX2Format ? 'true' : 'false',
	};

	// Ambient occlusion
	if (advancedSettings.bakeAmbientOcclusion) {
		params.AMBIENT_OCCLUSION = {
			bake: 'true',
			strength: String(advancedSettings.aoStrength || 1),
			radius: String(advancedSettings.aoRadius || 5),
			resolution: String(advancedSettings.aoResolution || 1024),
		};
	} else {
		params.AMBIENT_OCCLUSION = {
			bake: 'false',
		};
	}

	// Pivot point
	params.PIVOT_POINT = {
		pivot: (advancedSettings.pivotPoint as string) || 'bottom-center',
	};

	return params;
}

// =============================================================================
// Binary Data Validation (Security M-4)
// =============================================================================

// Maximum file size: 500MB for 3D models (VNTANA may accept larger, but this is a reasonable limit)
const MAX_FILE_SIZE_BYTES = 500 * 1024 * 1024;

// Allowed MIME types for different asset types
const ALLOWED_MIME_TYPES: Record<string, string[]> = {
	// 3D model formats
	THREE_D: [
		'model/gltf-binary',
		'model/gltf+json',
		'model/vnd.usdz+zip',
		'application/octet-stream', // Common for binary 3D files
		'application/zip', // For zipped models
	],
	// Image formats (for renders, textures)
	IMAGE: [
		'image/png',
		'image/jpeg',
		'image/webp',
		'image/gif',
	],
	// Video formats
	VIDEO: [
		'video/mp4',
		'video/quicktime',
		'video/webm',
	],
	// Document formats (for attachments)
	DOCUMENT: [
		'application/pdf',
		'application/msword',
		'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
	],
};

// Dangerous filename patterns to reject
const DANGEROUS_FILENAME_PATTERNS = [
	/\.\./,           // Path traversal
	/^\.+$/,          // Hidden/dot files
	/[<>:"|?*]/,      // Invalid characters on Windows
	/\x00/,           // Null bytes
	/^\/|^\\/,        // Absolute paths
];

/**
 * Validate binary data before upload
 * @throws NodeApiError if validation fails
 */
export function validateBinaryData(
	executeFunctions: IExecuteFunctions,
	buffer: Buffer,
	fileName: string,
	contentType: string,
	assetType?: string,
): void {
	// Validate file size
	if (buffer.length > MAX_FILE_SIZE_BYTES) {
		throw new NodeApiError(executeFunctions.getNode(), {} as JsonObject, {
			message: `File size ${(buffer.length / 1024 / 1024).toFixed(2)}MB exceeds maximum allowed size of ${MAX_FILE_SIZE_BYTES / 1024 / 1024}MB`,
		});
	}

	if (buffer.length === 0) {
		throw new NodeApiError(executeFunctions.getNode(), {} as JsonObject, {
			message: 'File is empty',
		});
	}

	// Validate filename for path traversal and dangerous patterns
	for (const pattern of DANGEROUS_FILENAME_PATTERNS) {
		if (pattern.test(fileName)) {
			throw new NodeApiError(executeFunctions.getNode(), {} as JsonObject, {
				message: 'Invalid filename: contains disallowed characters or patterns',
			});
		}
	}

	// Validate MIME type if asset type is specified
	if (assetType && ALLOWED_MIME_TYPES[assetType]) {
		const allowedTypes = ALLOWED_MIME_TYPES[assetType];
		if (!allowedTypes.includes(contentType)) {
			throw new NodeApiError(executeFunctions.getNode(), {} as JsonObject, {
				message: `Invalid content type '${contentType}' for asset type '${assetType}'. Allowed types: ${allowedTypes.join(', ')}`,
			});
		}
	}
}

/**
 * Sanitize a filename to remove potentially dangerous characters
 * Returns a safe filename that can be used for uploads
 */
export function sanitizeFileName(fileName: string): string {
	// Remove path components (keep only the filename)
	let sanitized = fileName.replace(/^.*[\\/]/, '');

	// Remove null bytes
	sanitized = sanitized.replace(/\x00/g, '');

	// Remove path traversal sequences
	sanitized = sanitized.replace(/\.\./g, '');

	// Remove characters that are invalid on Windows
	sanitized = sanitized.replace(/[<>:"|?*]/g, '_');

	// Remove leading dots (hidden files)
	sanitized = sanitized.replace(/^\.+/, '');

	// Ensure we have a valid filename
	if (!sanitized || sanitized.length === 0) {
		sanitized = 'unnamed_file';
	}

	// Truncate overly long filenames (max 255 characters)
	if (sanitized.length > 255) {
		const ext = sanitized.substring(sanitized.lastIndexOf('.'));
		const baseName = sanitized.substring(0, sanitized.lastIndexOf('.'));
		const maxBaseLength = 255 - ext.length;
		sanitized = baseName.substring(0, maxBaseLength) + ext;
	}

	return sanitized;
}

// =============================================================================
// API Request Functions
// =============================================================================

/**
 * Get signed URL for product asset upload
 */
export async function getAssetUploadSignedUrl(
	this: IExecuteFunctions,
	clientUuid: string,
	productUuid: string,
	fileName: string,
	fileSize: number,
	contentType: string,
): Promise<{ signedUrl: string; blobId: string; requestUuid: string }> {
	const body: IDataObject = {
		clientUuid,
		productUuid,
		assetSettings: {
			contentType,
			originalName: fileName,
			originalSize: fileSize,
		},
	};

	const response = await vntanaApiRequest.call(
		this,
		'POST',
		'/v1/storage/upload/clients/products/asset/sign-url',
		body,
	);

	const signedUrlData = response.response as IDataObject;
	return {
		signedUrl: signedUrlData.location as string,
		blobId: signedUrlData.blobId as string,
		requestUuid: signedUrlData.requestUuid as string,
	};
}

/**
 * Create a product with an asset file (complete upload flow)
 * 1. Create product container via POST /v1/products
 * 2. Get signed upload URL
 * 3. Upload file to signed URL
 * 4. Return product details
 */
export async function createProductWithAsset(
	this: IExecuteFunctions,
	productData: IDataObject,
	binaryData: Buffer,
	fileName: string,
	contentType: string,
): Promise<IDataObject> {
	// Step 1: Create product container
	const createResponse = await vntanaApiRequest.call(
		this,
		'POST',
		'/v1/products',
		productData,
	);

	const product = createResponse.response as IDataObject;
	const productUuid = product.uuid as string;
	const clientUuid = productData.clientUuid as string;

	// Step 2: Get signed URL for asset upload
	const { signedUrl, blobId, requestUuid } = await getAssetUploadSignedUrl.call(
		this,
		clientUuid,
		productUuid,
		fileName,
		binaryData.length,
		contentType,
	);

	// Step 3: Upload file to signed URL
	await uploadToSignedUrl.call(this, signedUrl, binaryData, contentType);

	// Return combined result
	return {
		success: true,
		product: {
			uuid: productUuid,
			name: productData.name,
			assetType: productData.assetType,
			status: productData.status || 'DRAFT',
			conversionStatus: 'PENDING',
		},
		upload: {
			fileName,
			fileSize: binaryData.length,
			contentType,
			blobId,
			requestUuid,
		},
	};
}
