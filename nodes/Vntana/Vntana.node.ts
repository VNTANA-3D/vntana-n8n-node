import type {
	ICredentialDataDecryptedObject,
	ICredentialsDecrypted,
	ICredentialTestFunctions,
	IDataObject,
	IExecuteFunctions,
	INodeCredentialTestResult,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';

import {
	vntanaApiRequest,
	vntanaApiRequestAllItems,
	vntanaApiRequestBinary,
	uploadToSignedUrl,
	getClientUuid,
} from './GenericFunctions';

import {
	resourceProperty,
	productOperations,
	productSearchFields,
	productDownloadModelFields,
	renderOperations,
	renderDownloadFields,
	renderUploadFields,
	attachmentOperations,
	attachmentUploadFields,
} from './VntanaDescription';

import type {
	SearchProductsResponse,
	SearchAttachmentsResponse,
	SignedUrlResponse,
	VntanaAttachment,
} from './types';

export class Vntana implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'VNTANA',
		name: 'vntana',
		icon: 'file:vntana.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with VNTANA 3D content management platform',
		defaults: {
			name: 'VNTANA',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'vntanaApi',
				required: true,
				testedBy: 'testVntanaCredentials',
			},
		],
		properties: [
			resourceProperty,
			productOperations,
			renderOperations,
			attachmentOperations,
			...productSearchFields,
			...productDownloadModelFields,
			...renderDownloadFields,
			...renderUploadFields,
			...attachmentUploadFields,
		],
	};

	methods = {
		credentialTest: {
			async testVntanaCredentials(
				this: ICredentialTestFunctions,
				credential: ICredentialsDecrypted<ICredentialDataDecryptedObject>,
			): Promise<INodeCredentialTestResult> {
				const credentials = credential.data;
				if (!credentials) {
					return {
						status: 'Error',
						message: 'No credentials provided',
					};
				}

				const email = credentials.email as string;
				const password = credentials.password as string;
				const organizationUuid = credentials.organizationUuid as string;

				if (!email || !password || !organizationUuid) {
					return {
						status: 'Error',
						message: 'Email, password, and organization UUID are required',
					};
				}

				const BASE_URL = 'https://api-platform.vntana.com';

				try {
					// Step 1: Login to get initial token
					const loginResponse = await this.helpers.request({
						method: 'POST',
						url: `${BASE_URL}/v1/auth/login`,
						headers: {
							'Content-Type': 'application/json',
						},
						body: JSON.stringify({ email, password }),
						resolveWithFullResponse: true,
					});

					const loginToken = loginResponse.headers?.['x-auth-token'];
					if (!loginToken) {
						return {
							status: 'Error',
							message: 'Login failed: No authentication token received. Check your email and password.',
						};
					}

					// Step 2: Refresh token with organization UUID
					const refreshResponse = await this.helpers.request({
						method: 'POST',
						url: `${BASE_URL}/v1/auth/refresh-token`,
						headers: {
							'X-AUTH-TOKEN': `Bearer ${loginToken}`,
							'organizationUuid': organizationUuid,
						},
						resolveWithFullResponse: true,
					});

					const refreshToken = refreshResponse.headers?.['x-auth-token'];
					if (!refreshToken) {
						return {
							status: 'Error',
							message: 'Token refresh failed: Could not get organization token. Check your organization UUID.',
						};
					}

					// Step 3: Verify the token works by fetching organizations
					const verifyResponse = await this.helpers.request({
						method: 'GET',
						url: `${BASE_URL}/v1/organizations`,
						headers: {
							'X-AUTH-TOKEN': `Bearer ${refreshToken}`,
							'Accept': 'application/json',
						},
						json: true,
					});

					if (verifyResponse.success === true) {
						// Organizations endpoint returns { response: { grid: [...] } }
						const orgs = verifyResponse.response?.grid;
						const orgName = orgs?.[0]?.name || 'Unknown';
						return {
							status: 'OK',
							message: `Successfully connected to VNTANA organization: ${orgName}`,
						};
					}

					return {
						status: 'Error',
						message: 'Authentication succeeded but API verification failed',
					};
				} catch (error) {
					const errorMessage = (error as Error).message || 'Unknown error';
					if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
						return {
							status: 'Error',
							message: 'Invalid email or password',
						};
					}
					if (errorMessage.includes('403') || errorMessage.includes('Forbidden')) {
						return {
							status: 'Error',
							message: 'Access denied. Check your organization UUID and permissions.',
						};
					}
					return {
						status: 'Error',
						message: `Connection failed: ${errorMessage}`,
					};
				}
			},
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;

		for (let i = 0; i < items.length; i++) {
			try {
				// =================================================================
				// PRODUCT RESOURCE
				// =================================================================
				if (resource === 'product') {
					// -------------------------------------------------------------
					// Product: Search
					// -------------------------------------------------------------
					if (operation === 'search') {
						const clientUuid = await getClientUuid.call(this, i);
						const returnAll = this.getNodeParameter('returnAll', i) as boolean;
						const limit = this.getNodeParameter('limit', i, 10) as number;
						const filters = this.getNodeParameter('filters', i, {}) as IDataObject;
						const credentials = await this.getCredentials('vntanaApi');
						const organizationUuid = credentials.organizationUuid as string;

						// Query params for endpoint URL
						const qs: IDataObject = {
							clientUuid,
						};

						// Build request body (VNTANA search uses POST with body params)
						const body: IDataObject = {
							organizationUuid,
							sorts: { UPDATED: 'DESC' },
						};

						// Add filters to body
						if (filters.searchTerm) {
							body.searchTerm = filters.searchTerm;
						}
						if (filters.status && (filters.status as string[]).length > 0) {
							body.status = filters.status;
						}
						if (filters.conversionStatuses && (filters.conversionStatuses as string[]).length > 0) {
							body.conversionStatuses = filters.conversionStatuses;
						}
						if (filters.name) {
							body.name = filters.name;
						}
						if (filters.tagsUuids) {
							body.tagsUuids = (filters.tagsUuids as string).split(',').map(s => s.trim());
						}

						let products: IDataObject[];

						if (returnAll) {
							products = await vntanaApiRequestAllItems.call(
								this,
								'POST',
								'/v1/products/clients/search',
								body,
								qs,
							);
						} else {
							// VNTANA uses 1-based pagination
							body.page = 1;
							body.size = limit;
							const response = await vntanaApiRequest.call(
								this,
								'POST',
								'/v1/products/clients/search',
								body,
								qs,
							);
							const searchResponse = response.response as SearchProductsResponse;
							products = searchResponse.grid || [];
						}

						for (const product of products) {
							returnData.push({ json: product });
						}
					}

					// -------------------------------------------------------------
					// Product: Download Model
					// -------------------------------------------------------------
					if (operation === 'downloadModel') {
						const productUuid = this.getNodeParameter('productUuid', i) as string;
						const clientUuid = await getClientUuid.call(this, i);
						const conversionFormat = this.getNodeParameter('conversionFormat', i) as string;
						const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i, 'data') as string;

						const qs: IDataObject = {
							clientUuid,
							conversionFormat,
						};

						const binaryData = await vntanaApiRequestBinary.call(
							this,
							'GET',
							`/v1/products/${productUuid}/download/model`,
							qs,
						);

						const fileName = `${productUuid}.${conversionFormat.toLowerCase()}`;
						const mimeType = getMimeType(conversionFormat);

						const binary = await this.helpers.prepareBinaryData(
							binaryData,
							fileName,
							mimeType,
						);

						returnData.push({
							json: {
								productUuid,
								format: conversionFormat,
								fileName,
								fileSize: binaryData.length,
							},
							binary: {
								[binaryPropertyName]: binary,
							},
						});
					}
				}

				// =================================================================
				// RENDER RESOURCE
				// =================================================================
				if (resource === 'render') {
					// -------------------------------------------------------------
					// Render: Download
					// -------------------------------------------------------------
					if (operation === 'download') {
						const productUuid = this.getNodeParameter('productUuid', i) as string;
						const clientUuid = await getClientUuid.call(this, i);
						const entityType = this.getNodeParameter('entityType', i) as string;
						const downloadAll = this.getNodeParameter('downloadAll', i) as boolean;
						const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i, 'data') as string;

						// Step 1: Search for attachments (VNTANA uses 1-based pagination)
						const searchBody: IDataObject = {
							page: 1,
							size: downloadAll ? 100 : 1,
							productUuid,
							sortDirection: 'ASC',
						};

						const searchResponse = await vntanaApiRequest.call(
							this,
							'POST',
							'/v1/attachments/search',
							searchBody,
						);

						const attachmentsResponse = searchResponse.response as SearchAttachmentsResponse;
						const attachments = (attachmentsResponse.grid || []).filter(
							(att: VntanaAttachment) => att.entityType === entityType,
						);

						if (attachments.length === 0) {
							returnData.push({
								json: {
									success: false,
									message: `No ${entityType.toLowerCase()} found for product ${productUuid}`,
								},
							});
							continue;
						}

						// Step 2: Download each attachment
						const attachmentsToDownload = downloadAll ? attachments : [attachments[0]];

						for (let j = 0; j < attachmentsToDownload.length; j++) {
							const attachment = attachmentsToDownload[j];
							const blobId = attachment.blobId;

							const binaryData = await vntanaApiRequestBinary.call(
								this,
								'GET',
								`/v1/comments/images/${blobId}`,
								{ clientUuid },
							);

							const fileName = attachment.name || blobId;
							const mimeType = getMimeTypeFromFileName(fileName);

							const binary = await this.helpers.prepareBinaryData(
								binaryData,
								fileName,
								mimeType,
							);

							const binaryKey = downloadAll ? `${binaryPropertyName}_${j}` : binaryPropertyName;

							returnData.push({
								json: {
									attachmentUuid: attachment.uuid,
									blobId,
									name: fileName,
									entityType: attachment.entityType,
									productUuid,
									fileSize: binaryData.length,
								},
								binary: {
									[binaryKey]: binary,
								},
							});
						}
					}

					// -------------------------------------------------------------
					// Render: Upload
					// -------------------------------------------------------------
					if (operation === 'upload') {
						const productUuid = this.getNodeParameter('productUuid', i) as string;
						const clientUuid = await getClientUuid.call(this, i);
						const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i) as string;
						const options = this.getNodeParameter('options', i, {}) as IDataObject;

						// Get binary data from input
						const binaryData = this.helpers.assertBinaryData(i, binaryPropertyName);
						const buffer = await this.helpers.getBinaryDataBuffer(i, binaryPropertyName);

						const fileName = (options.fileName as string) || binaryData.fileName || 'upload';
						const contentType = (options.contentType as string) || binaryData.mimeType || 'application/octet-stream';

						// Step 1: Get signed URL
						const signUrlBody: IDataObject = {
							clientUuid,
							parentEntityUuid: productUuid,
							parentEntityType: 'PRODUCT',
							storeType: 'RENDER',
							resourceSettings: {
								contentType,
								originalName: fileName,
								originalSize: buffer.length,
							},
						};

						const signUrlResponse = await vntanaApiRequest.call(
							this,
							'POST',
							'/v1/storage/upload/clients/resource/sign-url',
							signUrlBody,
						);

						const signedUrlData = signUrlResponse.response as SignedUrlResponse;
						const signedUrl = signedUrlData.location;

						// Step 2: Upload to signed URL
						await uploadToSignedUrl.call(this, signedUrl, buffer, contentType);

						returnData.push({
							json: {
								success: true,
								productUuid,
								fileName,
								contentType,
								fileSize: buffer.length,
								blobId: signedUrlData.blobId,
								requestUuid: signedUrlData.requestUuid,
							},
						});
					}
				}

				// =================================================================
				// ATTACHMENT RESOURCE
				// =================================================================
				if (resource === 'attachment') {
					// -------------------------------------------------------------
					// Attachment: Upload
					// -------------------------------------------------------------
					if (operation === 'upload') {
						const productUuid = this.getNodeParameter('productUuid', i) as string;
						const clientUuid = await getClientUuid.call(this, i);
						const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i) as string;
						const options = this.getNodeParameter('options', i, {}) as IDataObject;

						// Get binary data from input
						const binaryData = this.helpers.assertBinaryData(i, binaryPropertyName);
						const buffer = await this.helpers.getBinaryDataBuffer(i, binaryPropertyName);

						const fileName = (options.fileName as string) || binaryData.fileName || 'upload';
						const contentType = (options.contentType as string) || binaryData.mimeType || 'application/octet-stream';

						// Step 1: Get signed URL
						const signUrlBody: IDataObject = {
							clientUuid,
							parentEntityUuid: productUuid,
							parentEntityType: 'PRODUCT',
							storeType: 'ATTACHMENT',
							resourceSettings: {
								contentType,
								originalName: fileName,
								originalSize: buffer.length,
							},
						};

						const signUrlResponse = await vntanaApiRequest.call(
							this,
							'POST',
							'/v1/storage/upload/clients/resource/sign-url',
							signUrlBody,
						);

						const signedUrlData = signUrlResponse.response as SignedUrlResponse;
						const signedUrl = signedUrlData.location;

						// Step 2: Upload to signed URL
						await uploadToSignedUrl.call(this, signedUrl, buffer, contentType);

						returnData.push({
							json: {
								success: true,
								productUuid,
								fileName,
								contentType,
								fileSize: buffer.length,
								blobId: signedUrlData.blobId,
								requestUuid: signedUrlData.requestUuid,
							},
						});
					}
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: (error as Error).message,
						},
						pairedItem: { item: i },
					});
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}

/**
 * Get MIME type for 3D model formats
 */
function getMimeType(format: string): string {
	const mimeTypes: Record<string, string> = {
		GLB: 'model/gltf-binary',
		GLTF: 'model/gltf+json',
		USDZ: 'model/vnd.usdz+zip',
		FBX: 'application/octet-stream',
		OBJ: 'text/plain',
		STEP: 'application/step',
	};
	return mimeTypes[format.toUpperCase()] || 'application/octet-stream';
}

/**
 * Get MIME type from file extension
 */
function getMimeTypeFromFileName(fileName: string): string {
	const ext = fileName.split('.').pop()?.toLowerCase() || '';
	const mimeTypes: Record<string, string> = {
		png: 'image/png',
		jpg: 'image/jpeg',
		jpeg: 'image/jpeg',
		gif: 'image/gif',
		webp: 'image/webp',
		svg: 'image/svg+xml',
		mp4: 'video/mp4',
		mov: 'video/quicktime',
		avi: 'video/x-msvideo',
		pdf: 'application/pdf',
		glb: 'model/gltf-binary',
		gltf: 'model/gltf+json',
		usdz: 'model/vnd.usdz+zip',
	};
	return mimeTypes[ext] || 'application/octet-stream';
}
