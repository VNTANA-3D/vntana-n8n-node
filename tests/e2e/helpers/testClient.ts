/**
 * Standalone API Client for E2E Tests
 *
 * This client mimics the authentication and API request patterns
 * used by the n8n node, but runs outside the n8n context.
 */

import { TestConfig } from '../setup';

interface ApiResponse<T = any> {
	success: boolean;
	errors: Array<{ message: string }>;
	response: T;
}

interface TokenCache {
	token: string;
	timestamp: number;
}

const TOKEN_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export class VntanaTestClient {
	private config: TestConfig;
	private tokenCache: TokenCache | null = null;

	constructor(config: TestConfig) {
		this.config = config;
	}

	/**
	 * Authenticate and get org-specific token
	 */
	async getAuthToken(): Promise<string> {
		// Check cache
		if (this.tokenCache && Date.now() - this.tokenCache.timestamp < TOKEN_CACHE_TTL) {
			return this.tokenCache.token;
		}

		// Step 1: Login
		const loginResponse = await fetch(`${this.config.baseUrl}/v1/auth/login`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				email: this.config.email,
				password: this.config.password,
			}),
		});

		if (!loginResponse.ok) {
			throw new Error(`Login failed: ${loginResponse.status} ${loginResponse.statusText}`);
		}

		const loginToken = loginResponse.headers.get('x-auth-token');
		if (!loginToken) {
			throw new Error('Login succeeded but no token returned');
		}

		// Step 2: Refresh with organization UUID
		const refreshResponse = await fetch(`${this.config.baseUrl}/v1/auth/refresh-token`, {
			method: 'POST',
			headers: {
				'X-AUTH-TOKEN': `Bearer ${loginToken}`,
				'organizationUuid': this.config.organizationUuid,
			},
		});

		if (!refreshResponse.ok) {
			throw new Error(`Token refresh failed: ${refreshResponse.status} ${refreshResponse.statusText}`);
		}

		const refreshToken = refreshResponse.headers.get('x-auth-token');
		if (!refreshToken) {
			throw new Error('Token refresh succeeded but no token returned');
		}

		// Cache the token
		this.tokenCache = {
			token: `Bearer ${refreshToken}`,
			timestamp: Date.now(),
		};

		return this.tokenCache.token;
	}

	/**
	 * Clear cached authentication token
	 */
	clearTokenCache(): void {
		this.tokenCache = null;
	}

	/**
	 * Make authenticated API request
	 */
	async request<T = any>(
		method: string,
		endpoint: string,
		options: {
			body?: object;
			queryParams?: Record<string, string>;
		} = {},
	): Promise<ApiResponse<T>> {
		const token = await this.getAuthToken();

		let url = `${this.config.baseUrl}${endpoint}`;
		if (options.queryParams) {
			const params = new URLSearchParams(options.queryParams);
			url += `?${params.toString()}`;
		}

		const fetchOptions: RequestInit = {
			method,
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json',
				'X-AUTH-TOKEN': token,
			},
		};

		if (options.body && method !== 'GET') {
			fetchOptions.body = JSON.stringify(options.body);
		}

		const response = await fetch(url, fetchOptions);
		const text = await response.text();

		// Try to parse as JSON, handle non-JSON error responses
		let data: ApiResponse<T>;
		try {
			data = JSON.parse(text) as ApiResponse<T>;
		} catch {
			// Non-JSON response, wrap in error format
			data = {
				success: false,
				errors: [{ message: text || `HTTP ${response.status}: ${response.statusText}` }],
				response: null as T,
			};
		}

		return data;
	}

	/**
	 * Make authenticated request for binary download
	 */
	async downloadBinary(
		endpoint: string,
		queryParams?: Record<string, string>,
	): Promise<Buffer> {
		const token = await this.getAuthToken();

		let url = `${this.config.baseUrl}${endpoint}`;
		if (queryParams) {
			const params = new URLSearchParams(queryParams);
			url += `?${params.toString()}`;
		}

		const response = await fetch(url, {
			method: 'GET',
			headers: {
				'Accept': '*/*',
				'X-AUTH-TOKEN': token,
			},
		});

		if (!response.ok) {
			throw new Error(`Download failed: ${response.status} ${response.statusText}`);
		}

		const arrayBuffer = await response.arrayBuffer();
		return Buffer.from(arrayBuffer);
	}

	/**
	 * Upload binary to signed URL
	 */
	async uploadToSignedUrl(
		signedUrl: string,
		buffer: Buffer,
		contentType: string,
	): Promise<void> {
		const response = await fetch(signedUrl, {
			method: 'POST',
			headers: {
				'Origin': this.config.baseUrl,
				'Content-Type': contentType,
				'Content-Length': buffer.length.toString(),
			},
			body: buffer,
		});

		if (!response.ok) {
			throw new Error(`Upload to signed URL failed: ${response.status} ${response.statusText}`);
		}
	}

	// =========================================================================
	// Convenience Methods for Common Operations
	// =========================================================================

	/**
	 * List organizations
	 */
	async listOrganizations(): Promise<ApiResponse> {
		return this.request('GET', '/v1/organizations');
	}

	/**
	 * List workspaces
	 */
	async listWorkspaces(): Promise<ApiResponse> {
		return this.request('GET', '/v1/clients/client-organizations');
	}

	/**
	 * List pipelines
	 */
	async listPipelines(): Promise<ApiResponse> {
		return this.request('GET', '/v1/pipelines');
	}

	/**
	 * Search products
	 */
	async searchProducts(options: {
		page?: number;
		size?: number;
		searchTerm?: string;
		status?: string[];
	} = {}): Promise<ApiResponse> {
		const body: any = {
			organizationUuid: this.config.organizationUuid,
			page: options.page || 1,
			size: options.size || 10,
			sorts: { UPDATED: 'DESC' },
		};

		if (options.searchTerm) {
			body.searchTerm = options.searchTerm;
		}
		if (options.status) {
			body.status = options.status;
		}

		return this.request('POST', '/v1/products/clients/search', {
			body,
			queryParams: {
				clientUuid: this.config.workspaceUuid,
			},
		});
	}

	/**
	 * Create a product
	 */
	async createProduct(productData: {
		name: string;
		assetType: string;
		description?: string;
		status?: string;
	}): Promise<ApiResponse> {
		const body: any = {
			name: productData.name,
			clientUuid: this.config.workspaceUuid,
			assetType: productData.assetType,
		};

		if (productData.description) {
			body.description = productData.description;
		}
		if (productData.status) {
			body.status = productData.status;
		}
		if (this.config.pipelineUuid && productData.assetType === 'THREE_D') {
			body.pipelineUuid = this.config.pipelineUuid;
		}

		return this.request('POST', '/v1/products', { body });
	}

	/**
	 * Get signed URL for asset upload
	 */
	async getAssetUploadSignedUrl(
		productUuid: string,
		fileName: string,
		fileSize: number,
		contentType: string,
	): Promise<ApiResponse> {
		return this.request('POST', '/v1/storage/upload/clients/products/asset/sign-url', {
			body: {
				clientUuid: this.config.workspaceUuid,
				productUuid,
				assetSettings: {
					contentType,
					originalName: fileName,
					originalSize: fileSize,
				},
			},
		});
	}

	/**
	 * Get signed URL for render/attachment upload
	 */
	async getResourceUploadSignedUrl(
		productUuid: string,
		fileName: string,
		fileSize: number,
		contentType: string,
		storeType: 'RENDER' | 'ATTACHMENT',
	): Promise<ApiResponse> {
		return this.request('POST', '/v1/storage/upload/clients/resource/sign-url', {
			body: {
				clientUuid: this.config.workspaceUuid,
				parentEntityUuid: productUuid,
				parentEntityType: 'PRODUCT',
				storeType,
				resourceSettings: {
					contentType,
					originalName: fileName,
					originalSize: fileSize,
				},
			},
		});
	}

	/**
	 * Search attachments
	 */
	async searchAttachments(productUuid: string): Promise<ApiResponse> {
		return this.request('POST', '/v1/attachments/search', {
			body: {
				page: 1,
				size: 100,
				productUuid,
				sortDirection: 'ASC',
			},
		});
	}

	/**
	 * Delete a product (for cleanup)
	 */
	async deleteProduct(productUuid: string): Promise<ApiResponse> {
		return this.request('DELETE', '/v1/products/delete', {
			body: {
				uuid: productUuid,
				clientUuid: this.config.workspaceUuid,
			},
		});
	}

	/**
	 * Download a model file
	 */
	async downloadModel(productUuid: string, conversionFormat: string): Promise<Buffer> {
		return this.downloadBinary(`/v1/products/${productUuid}/download/model`, {
			clientUuid: this.config.workspaceUuid,
			conversionFormat,
		});
	}

	/**
	 * Download an attachment by blob ID
	 */
	async downloadAttachment(blobId: string): Promise<Buffer> {
		return this.downloadBinary(`/v1/comments/images/${blobId}`, {
			clientUuid: this.config.workspaceUuid,
		});
	}
}

/**
 * Create a test client instance
 */
export function createTestClient(config: TestConfig): VntanaTestClient {
	return new VntanaTestClient(config);
}
