import type {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestMethods,
	IHttpRequestOptions,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError, NodeOperationError } from 'n8n-workflow';

import type { ModelOpsParameters, OptimizationPreset } from './types';
import { isGridResponse } from './types';

const DEFAULT_BASE_URL = 'https://api-platform.vntana.com';

/**
 * Get the base URL from credentials or use default
 */
export function getBaseUrl(credentials: IDataObject): string {
	const baseUrl = credentials.baseUrl as string | undefined;
	return baseUrl && baseUrl.trim() ? baseUrl.trim().replace(/\/$/, '') : DEFAULT_BASE_URL;
}

/**
 * Parse comma-separated string into array of trimmed, non-empty strings (fixes H-4: duplicated parsing)
 */
export function parseCommaSeparatedList(value: unknown): string[] {
	if (typeof value === 'string') {
		return value.split(',').map(s => s.trim()).filter(s => s.length > 0);
	}
	if (Array.isArray(value)) {
		return value
			.filter(s => typeof s === 'string' && s.trim().length > 0)
			.map(s => (s as string).trim());
	}
	return [];
}

/**
 * Merge attributes from key-value pairs and JSON input
 * JSON values override key-value pairs for the same keys
 */
export function mergeAttributes(this: IExecuteFunctions, options: IDataObject): IDataObject {
	const attributes: IDataObject = {};

	// Extract from key-value fixedCollection
	const attributesKeyValue = options.attributesKeyValue as IDataObject | undefined;
	if (attributesKeyValue?.values && Array.isArray(attributesKeyValue.values)) {
		for (const item of attributesKeyValue.values as Array<{ key: string; value: string }>) {
			if (item.key && typeof item.key === 'string') {
				attributes[item.key] = item.value || '';
			}
		}
	}

	// Parse and merge JSON attributes (overrides key-value pairs)
	const attributesJson = options.attributesJson as string | undefined;
	if (attributesJson && typeof attributesJson === 'string' && attributesJson.trim()) {
		try {
			const jsonAttributes = JSON.parse(attributesJson);
			if (typeof jsonAttributes === 'object' && jsonAttributes !== null && !Array.isArray(jsonAttributes)) {
				Object.assign(attributes, jsonAttributes);
			}
		} catch (error) {
			throw new NodeOperationError(this.getNode(), `Invalid JSON in "Attributes (JSON)" field: ${(error as Error).message}`);
		}
	}

	return attributes;
}

/**
 * Format the VNTANA error envelope's `errors` array into a readable message.
 * Entries may be plain strings (error codes like "MISSING_PRODUCT_AUTO_PUBLISH_OPTION")
 * or objects with a `message` / `errorCode`.
 */
function formatVntanaErrors(errors: unknown): string {
	if (!Array.isArray(errors) || errors.length === 0) {
		return 'Unknown VNTANA API error';
	}
	return errors
		.map((e) => {
			if (typeof e === 'string') return e;
			if (e && typeof e === 'object') {
				const obj = e as IDataObject;
				return (obj.message as string) || (obj.errorCode as string) || JSON.stringify(e);
			}
			return String(e);
		})
		.join(', ');
}

/**
 * Pull the VNTANA response envelope out of a thrown HTTP error. n8n surfaces the
 * response body in different shapes depending on the HTTP client, so check the common
 * locations.
 */
function extractResponseBody(error: unknown): IDataObject | undefined {
	const response = (error as { response?: { body?: unknown; data?: unknown } })?.response;
	const body = response?.body ?? response?.data;
	return body && typeof body === 'object' ? (body as IDataObject) : undefined;
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
	const credentials = await this.getCredentials('vntanaApi');
	const baseUrl = getBaseUrl(credentials);

	// Extract headers from options to merge properly (don't let spread overwrite auth headers)
	const { headers: extraHeaders, ...restOptions } = options;

	const requestOptions: IHttpRequestOptions = {
		method,
		url: `${baseUrl}${endpoint}`,
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			...extraHeaders, // Merge additional headers without losing auth
		},
		qs,
		body,
		json: true,
		...restOptions, // Spread remaining options (excluding headers)
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
		const response = await this.helpers.httpRequestWithAuthentication.call(this, 'vntanaApi', requestOptions);

		// VNTANA wraps responses in { success, errors, response }. Note that business
		// errors can be returned with HTTP 200 and success:false, so inspect the body.
		if (response.success === false) {
			throw new NodeApiError(this.getNode(), response as JsonObject, {
				message: formatVntanaErrors(response.errors),
			});
		}

		return response as IDataObject;
	} catch (error) {
		// Preserve our own already-formatted error. Re-wrapping a NodeApiError would
		// discard the specific VNTANA error code and replace it with a generic
		// "Bad request - please check your parameters" message.
		if (error instanceof NodeApiError) {
			throw error;
		}

		// VNTANA business errors can also arrive as a non-2xx response (which n8n throws)
		// whose body still carries the { success:false, errors:[...] } envelope. Surface
		// those error codes instead of the generic HTTP status text.
		const errorBody = extractResponseBody(error);
		if (errorBody && Array.isArray(errorBody.errors) && errorBody.errors.length > 0) {
			throw new NodeApiError(this.getNode(), errorBody as JsonObject, {
				message: formatVntanaErrors(errorBody.errors),
			});
		}

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
	const credentials = await this.getCredentials('vntanaApi');
	const baseUrl = getBaseUrl(credentials);

	const requestOptions: IHttpRequestOptions = {
		method,
		url: `${baseUrl}${endpoint}`,
		headers: {
			Accept: '*/*',
		},
		qs,
		encoding: 'arraybuffer',
		returnFullResponse: false,
	};

	if (Object.keys(qs).length === 0) {
		delete requestOptions.qs;
	}

	try {
		const response = await this.helpers.httpRequestWithAuthentication.call(this, 'vntanaApi', requestOptions);
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

		const responseData = response.response as IDataObject;
		if (isGridResponse(responseData)) {
			const items = responseData.grid;
			if (items.length > 0) {
				returnData.push(...items);
				const totalCount = responseData.totalCount ?? 0;
				// Fix M-5: Exit early when items < size (no more pages)
				hasMore = items.length === size && returnData.length < totalCount;
				page++;
			} else {
				hasMore = false;
			}
		} else {
			hasMore = false;
		}
	}

	return returnData;
}

/**
 * Upload binary data to a signed URL (Google Cloud Storage)
 * Note: This does NOT use VNTANA auth - the signed URL includes authentication.
 * baseUrl is passed in by the caller so this function avoids touching credentials.
 */
export async function uploadToSignedUrl(
	this: IExecuteFunctions,
	signedUrl: string,
	binaryData: Buffer,
	contentType: string,
	baseUrl: string,
): Promise<void> {
	const requestOptions: IHttpRequestOptions = {
		method: 'PUT',
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
	} catch (error) {
		throw new NodeApiError(this.getNode(), error as JsonObject, {
			message: 'Failed to upload file to signed URL',
		});
	}
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
			bakeAmbientOcclusion: 'true',
			ambientOcclusionStrength: '1',
			ambientOcclusionRadius: '5',
			ambientOcclusionResolution: '1024',
		},
		PIVOT_POINT_ALIGNMENT: {
			pivotPoint: 'bottom-center',
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
			bakeAmbientOcclusion: 'false',
		},
		PIVOT_POINT_ALIGNMENT: {
			pivotPoint: 'bottom-center',
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
			bakeAmbientOcclusion: 'true',
			ambientOcclusionStrength: '1',
			ambientOcclusionRadius: '5',
			ambientOcclusionResolution: '512',
		},
		PIVOT_POINT_ALIGNMENT: {
			pivotPoint: 'bottom-center',
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
		forcePolygonCount: advancedSettings.forcePolygonCount ? 'true' : 'false',
		obstructedGeometry: advancedSettings.removeObstructedGeometry ? 'true' : 'false',
		bakeSmallFeatures: advancedSettings.bakeSmallFeatures ? 'true' : 'false',
	};

	// Texture compression — ambient occlusion is configured here, not as its own block.
	params.TEXTURE_COMPRESSION = {
		maxDimension: String(advancedSettings.maxTextureResolution || 2048),
		aggression: String(advancedSettings.textureCompressionAggression || 3),
		lossless: advancedSettings.losslessTextureCompression ? 'true' : 'false',
		useKTX: advancedSettings.useKTX2Format ? 'true' : 'false',
	};

	if (advancedSettings.bakeAmbientOcclusion) {
		params.TEXTURE_COMPRESSION.bakeAmbientOcclusion = 'true';
		params.TEXTURE_COMPRESSION.ambientOcclusionStrength = String(advancedSettings.aoStrength || 1);
		params.TEXTURE_COMPRESSION.ambientOcclusionRadius = String(advancedSettings.aoRadius || 5);
		params.TEXTURE_COMPRESSION.ambientOcclusionResolution = String(advancedSettings.aoResolution || 1024);
	} else {
		params.TEXTURE_COMPRESSION.bakeAmbientOcclusion = 'false';
	}

	// Pivot point
	params.PIVOT_POINT_ALIGNMENT = {
		pivotPoint: (advancedSettings.pivotPoint as string) || 'bottom-center',
	};

	return params;
}

// =============================================================================
// Binary Data Validation (Security M-4)
// =============================================================================

// Maximum file size: 30GB (VNTANA platform limit)
const MAX_FILE_SIZE_BYTES = 30 * 1024 * 1024 * 1024;

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
	// eslint-disable-next-line no-control-regex
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
	// eslint-disable-next-line no-control-regex
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

// MIME type to file extension mapping (used as fallback when fileExtension is not available)
const MIME_TYPE_TO_EXTENSION: Record<string, string> = {
	'video/mp4': 'mp4',
	'video/quicktime': 'mov',
	'video/webm': 'webm',
	'video/avi': 'avi',
	'image/png': 'png',
	'image/jpeg': 'jpg',
	'image/webp': 'webp',
	'image/gif': 'gif',
	'image/tiff': 'tiff',
	'image/bmp': 'bmp',
	'image/svg+xml': 'svg',
	'application/pdf': 'pdf',
	'model/gltf-binary': 'glb',
	'model/gltf+json': 'gltf',
	'model/vnd.usdz+zip': 'usdz',
	'application/zip': 'zip',
	'application/octet-stream': 'bin',
};

/**
 * Ensure a filename has a valid extension.
 * If the filename already has an extension, return it unchanged.
 * Otherwise, use fileExtension (from n8n binary metadata) or derive from mimeType.
 * This prevents INVALID_RESOURCE_EXTENSION errors from the VNTANA API when binary
 * sources (e.g. HTTP nodes) provide a filename without an extension.
 */
export function ensureFileExtension(fileName: string, fileExtension?: string, mimeType?: string): string {
	const lastDot = fileName.lastIndexOf('.');
	if (lastDot > 0 && lastDot < fileName.length - 1) {
		return fileName;
	}
	if (fileExtension) {
		return `${fileName}.${fileExtension}`;
	}
	const ext = mimeType ? MIME_TYPE_TO_EXTENSION[mimeType] : undefined;
	if (ext) {
		return `${fileName}.${ext}`;
	}
	return fileName;
}

// =============================================================================
// API Request Functions
// =============================================================================

/**
 * Get signed URL for product asset upload
 * Note: Requires Origin header per VNTANA API documentation
 */
export async function getAssetUploadSignedUrl(
	this: IExecuteFunctions,
	clientUuid: string,
	productUuid: string,
	fileName: string,
	fileSize: number,
	contentType: string,
): Promise<{ signedUrl: string; blobId: string; requestUuid: string }> {
	const credentials = await this.getCredentials('vntanaApi');
	const baseUrl = getBaseUrl(credentials);

	const body: IDataObject = {
		clientUuid,
		productUuid,
		resourceSettings: {
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
		{},
		{
			headers: {
				Origin: baseUrl,
			},
		},
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
	baseUrl: string,
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
	await uploadToSignedUrl.call(this, signedUrl, binaryData, contentType, baseUrl);

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
