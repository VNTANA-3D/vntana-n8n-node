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
	getBaseUrl,
	buildModelOpsParameters,
	createProductWithAsset,
	validateBinaryData,
	sanitizeFileName,
	parseCommaSeparatedList,
	mergeAttributes,
} from './GenericFunctions';

import {
	resourceProperty,
	productOperations,
	productSearchFields,
	productDownloadModelFields,
	productUpload3DModelFields,
	productUploadAssetFields,
	productUpdateStatusFields,
	productUpdateFields,
	renderOperations,
	renderDownloadFields,
	renderUploadFields,
	attachmentOperations,
	attachmentUploadFields,
	organizationOperations,
	workspaceOperations,
	pipelineOperations,
	tagOperations,
	tagSearchFields,
	tagCreateFields,
} from './VntanaDescription';

import type {
	SearchProductsResponse,
	SearchAttachmentsResponse,
	SearchTagsResponse,
	SignedUrlResponse,
	VntanaAttachment,
	ListOrganizationsResponse,
	ListWorkspacesResponse,
	ListPipelinesResponse,
	AssetType,
	OptimizationPreset,
	CredentialTestHelpers,
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
			organizationOperations,
			workspaceOperations,
			pipelineOperations,
			tagOperations,
			...productSearchFields,
			...productDownloadModelFields,
			...productUpload3DModelFields,
			...productUploadAssetFields,
			...productUpdateStatusFields,
			...productUpdateFields,
			...renderDownloadFields,
			...renderUploadFields,
			...attachmentUploadFields,
			...tagSearchFields,
			...tagCreateFields,
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

				// Use configurable base URL or default
				const baseUrl = credentials.baseUrl as string | undefined;
				const apiBaseUrl = baseUrl && baseUrl.trim() ? baseUrl.trim().replace(/\/$/, '') : 'https://api-platform.vntana.com';

				try {
					// Use httpRequest instead of deprecated request
					// Type assertion needed as ICredentialTestFunctions typing is incomplete (fixes C-1: Promise<any>)
					const helpers = this.helpers as unknown as CredentialTestHelpers;

					// Runtime check for httpRequest availability
					if (!helpers.httpRequest || typeof helpers.httpRequest !== 'function') {
						return {
							status: 'Error',
							message: 'Unable to test credentials: httpRequest helper not available',
						};
					}

					// Step 1: Login to get initial token
					const loginResponse = await helpers.httpRequest({
						method: 'POST',
						url: `${apiBaseUrl}/v1/auth/login`,
						headers: {
							'Content-Type': 'application/json',
						},
						body: { email, password },
						returnFullResponse: true,
					});

					const loginToken = loginResponse.headers?.['x-auth-token'];
					if (!loginToken) {
						return {
							status: 'Error',
							message: 'Authentication failed. Please verify your credentials.',
						};
					}

					// Step 2: Refresh token with organization UUID
					const refreshResponse = await helpers.httpRequest({
						method: 'POST',
						url: `${apiBaseUrl}/v1/auth/refresh-token`,
						headers: {
							'X-AUTH-TOKEN': `Bearer ${loginToken}`,
							'organizationUuid': organizationUuid,
						},
						returnFullResponse: true,
					});

					const refreshToken = refreshResponse.headers?.['x-auth-token'];
					if (!refreshToken) {
						return {
							status: 'Error',
							message: 'Authentication failed. Please verify your credentials and organization UUID.',
						};
					}

					// Step 3: Verify the token works by fetching organizations
					const verifyResponse = await helpers.httpRequest({
						method: 'GET',
						url: `${apiBaseUrl}/v1/organizations`,
						headers: {
							'X-AUTH-TOKEN': `Bearer ${refreshToken}`,
							'Accept': 'application/json',
						},
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
					// Normalize error messages to prevent account enumeration
					// Don't reveal whether it's a credential issue vs permission issue
					if (errorMessage.includes('401') ||
						errorMessage.includes('403') ||
						errorMessage.includes('Unauthorized') ||
						errorMessage.includes('Forbidden')) {
						return {
							status: 'Error',
							message: 'Authentication failed. Please verify your credentials and organization UUID.',
						};
					}
					// For other errors (network, timeout, etc.), provide generic message
					return {
						status: 'Error',
						message: 'Connection failed. Please verify your credentials and network connectivity.',
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

		// Helper function for type-safe array checks (fixes H-3: unsafe casts)
		const isNonEmptyStringArray = (value: unknown): value is string[] => {
			return Array.isArray(value) && value.length > 0 &&
				value.every(item => typeof item === 'string');
		};

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
						if (isNonEmptyStringArray(filters.status)) {
							body.status = filters.status;
						}
						if (isNonEmptyStringArray(filters.conversionStatuses)) {
							body.conversionStatuses = filters.conversionStatuses;
						}
						if (filters.name) {
							body.name = filters.name;
						}
						const tagsUuids = parseCommaSeparatedList(filters.tagsUuids);
						if (tagsUuids.length > 0) {
							body.tagsUuids = tagsUuids;
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

					// -------------------------------------------------------------
					// Product: Upload 3D Model
					// -------------------------------------------------------------
					if (operation === 'upload3DModel') {
						const name = this.getNodeParameter('name', i) as string;
						const pipelineUuid = this.getNodeParameter('pipelineUuid', i) as string;
						const clientUuid = await getClientUuid.call(this, i);
						const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i) as string;
						const optimizationMode = this.getNodeParameter('optimizationMode', i) as 'preset' | 'advanced';
						const additionalOptions = this.getNodeParameter('additionalOptions', i, {}) as IDataObject;

						// Get binary data
						const binaryDataInput = this.helpers.assertBinaryData(i, binaryPropertyName);
						const buffer = await this.helpers.getBinaryDataBuffer(i, binaryPropertyName);
						const rawFileName = binaryDataInput.fileName || 'model.glb';
						const fileName = sanitizeFileName(rawFileName);
						const contentType = binaryDataInput.mimeType || 'application/octet-stream';

						// Validate binary data (M-4 security fix)
						validateBinaryData(this, buffer, fileName, contentType, 'THREE_D');

						// Build optimization parameters
						let modelOpsParameters: IDataObject;
						if (optimizationMode === 'preset') {
							const preset = this.getNodeParameter('optimizationPreset', i) as OptimizationPreset;
							modelOpsParameters = buildModelOpsParameters('preset', preset) as unknown as IDataObject;
						} else {
							const advancedSettings: IDataObject = {
								enableDracoCompression: this.getNodeParameter('enableDracoCompression', i, true),
								targetPolygonCount: this.getNodeParameter('targetPolygonCount', i, 50000),
								forcePolygonCount: this.getNodeParameter('forcePolygonCount', i, false),
								removeObstructedGeometry: this.getNodeParameter('removeObstructedGeometry', i, true),
								bakeSmallFeatures: this.getNodeParameter('bakeSmallFeatures', i, true),
								pivotPoint: this.getNodeParameter('pivotPoint', i, 'bottom-center'),
								maxTextureResolution: this.getNodeParameter('maxTextureResolution', i, 2048),
								textureCompressionAggression: this.getNodeParameter('textureCompressionAggression', i, 3),
								losslessTextureCompression: this.getNodeParameter('losslessTextureCompression', i, true),
								useKTX2Format: this.getNodeParameter('useKTX2Format', i, false),
								bakeAmbientOcclusion: this.getNodeParameter('bakeAmbientOcclusion', i, true),
								aoStrength: this.getNodeParameter('aoStrength', i, 1),
								aoRadius: this.getNodeParameter('aoRadius', i, 5),
								aoResolution: this.getNodeParameter('aoResolution', i, 1024),
							};
							modelOpsParameters = buildModelOpsParameters('advanced', undefined, advancedSettings) as unknown as IDataObject;
						}

						// Build product data
						const productData: IDataObject = {
							name,
							clientUuid,
							pipelineUuid,
							assetType: 'THREE_D' as AssetType,
							modelOpsParameters,
						};

						// Add optional fields
						if (additionalOptions.description) {
							productData.description = additionalOptions.description;
						}
						if (additionalOptions.status) {
							productData.status = additionalOptions.status;
						}
						const optTagsUuids = parseCommaSeparatedList(additionalOptions.tagsUuids);
						if (optTagsUuids.length > 0) {
							productData.tagsUuids = optTagsUuids;
						}
						const optProjectsUuids = parseCommaSeparatedList(additionalOptions.projectsUuids);
						if (optProjectsUuids.length > 0) {
							productData.projectsUuids = optProjectsUuids;
						}

						// Add attributes
						const upload3DAttributes = mergeAttributes(additionalOptions);
						if (Object.keys(upload3DAttributes).length > 0) {
							productData.attributes = upload3DAttributes;
						}

						// Create product and upload asset
						const result = await createProductWithAsset.call(
							this,
							productData,
							buffer,
							fileName,
							contentType,
						);

						returnData.push({ json: result });
					}

					// -------------------------------------------------------------
					// Product: Upload Asset
					// -------------------------------------------------------------
					if (operation === 'uploadAsset') {
						const name = this.getNodeParameter('name', i) as string;
						const assetType = this.getNodeParameter('assetType', i) as AssetType;
						const clientUuid = await getClientUuid.call(this, i);
						const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i) as string;
						const additionalOptions = this.getNodeParameter('additionalOptions', i, {}) as IDataObject;

						// Get binary data
						const binaryDataInput = this.helpers.assertBinaryData(i, binaryPropertyName);
						const buffer = await this.helpers.getBinaryDataBuffer(i, binaryPropertyName);
						const rawFileName = binaryDataInput.fileName || 'file';
						const fileName = sanitizeFileName(rawFileName);
						const contentType = binaryDataInput.mimeType || 'application/octet-stream';

						// Validate binary data (M-4 security fix)
						// Map asset type to validation category
						const validationCategory = assetType === 'THREE_D' ? 'THREE_D' :
							assetType === 'IMAGE' ? 'IMAGE' :
							assetType === 'VIDEO' ? 'VIDEO' : undefined;
						validateBinaryData(this, buffer, fileName, contentType, validationCategory);

						// Build product data
						const productData: IDataObject = {
							name,
							clientUuid,
							assetType,
						};

						// Add optional fields
						if (additionalOptions.description) {
							productData.description = additionalOptions.description;
						}
						if (additionalOptions.status) {
							productData.status = additionalOptions.status;
						}
						const assetTagsUuids = parseCommaSeparatedList(additionalOptions.tagsUuids);
						if (assetTagsUuids.length > 0) {
							productData.tagsUuids = assetTagsUuids;
						}
						const assetProjectsUuids = parseCommaSeparatedList(additionalOptions.projectsUuids);
						if (assetProjectsUuids.length > 0) {
							productData.projectsUuids = assetProjectsUuids;
						}

						// Add attributes
						const uploadAssetAttributes = mergeAttributes(additionalOptions);
						if (Object.keys(uploadAssetAttributes).length > 0) {
							productData.attributes = uploadAssetAttributes;
						}

						// Create product and upload asset
						const result = await createProductWithAsset.call(
							this,
							productData,
							buffer,
							fileName,
							contentType,
						);

						returnData.push({ json: result });
					}

					// -------------------------------------------------------------
					// Product: Update Status
					// -------------------------------------------------------------
					if (operation === 'updateStatus') {
						const productUuidsRaw = this.getNodeParameter('productUuids', i) as string;
						const status = this.getNodeParameter('status', i) as string;
						const clientUuid = await getClientUuid.call(this, i);

						// Parse UUIDs (support comma-separated for batch)
						const productUuids = productUuidsRaw
							.split(',')
							.map((uuid) => uuid.trim())
							.filter((uuid) => uuid.length > 0);

						if (productUuids.length === 0) {
							throw new Error('At least one Product UUID is required');
						}

						const body: IDataObject = {
							items: productUuids.map((uuid) => ({ uuid, status })),
						};
						const qs: IDataObject = { clientUuid };

						const response = await vntanaApiRequest.call(
							this,
							'PUT',
							'/v1/products/status',
							body,
							qs,
						);

						// Return response with updated product info
						const result = response.response as IDataObject;
						returnData.push({
							json: {
								success: true,
								updatedProducts: productUuids,
								status,
								response: result,
							},
						});
					}

					// -------------------------------------------------------------
					// Product: Update Product
					// -------------------------------------------------------------
					if (operation === 'updateProduct') {
						const productUuid = this.getNodeParameter('productUuid', i) as string;
						const clientUuid = await getClientUuid.call(this, i);
						const updateFields = this.getNodeParameter('updateFields', i, {}) as IDataObject;

						const qs: IDataObject = { clientUuid };

						// Build request body with only specified fields
						const body: IDataObject = {
							uuid: productUuid,
						};

						if (updateFields.name) {
							body.name = updateFields.name;
						}
						if (updateFields.description !== undefined) {
							body.description = updateFields.description;
						}
						if (updateFields.status) {
							body.status = updateFields.status;
						}

						// Parse tags
						const tagsUuids = parseCommaSeparatedList(updateFields.tagsUuids);
						if (tagsUuids.length > 0) {
							body.tagsUuids = tagsUuids;
						}

						// Merge attributes from key-value and JSON
						const attributes = mergeAttributes(updateFields);
						if (Object.keys(attributes).length > 0) {
							body.attributes = attributes;
						}

						const response = await vntanaApiRequest.call(
							this,
							'PUT',
							'/v1/products',
							body,
							qs,
						);

						const product = response.response as IDataObject;
						returnData.push({ json: product });
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

						// Step 1: Search for attachments (this endpoint uses 0-based pagination)
						// Always fetch all attachments, then filter by entityType
						// (the API doesn't support filtering by entityType)
						const searchBody: IDataObject = {
							page: 0,
							size: 100,
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
						const allAttachments = attachmentsResponse.grid || [];
						const attachments = allAttachments.filter(
							(att: VntanaAttachment) => att.entityType === entityType,
						);

						if (attachments.length === 0) {
							// Include debug info to help diagnose issues
							const foundTypes = [...new Set(allAttachments.map((a: VntanaAttachment) => a.entityType))];
							returnData.push({
								json: {
									success: false,
									message: `No ${entityType.toLowerCase()} found for product ${productUuid}`,
									debug: {
										totalAttachments: allAttachments.length,
										entityTypesFound: foundTypes,
										requestedEntityType: entityType,
									},
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
									[binaryPropertyName]: binary,
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

						const rawFileName = (options.fileName as string) || binaryData.fileName || 'upload';
						const fileName = sanitizeFileName(rawFileName);
						const contentType = (options.contentType as string) || binaryData.mimeType || 'application/octet-stream';

						// Validate binary data (M-4 security fix)
						validateBinaryData(this, buffer, fileName, contentType, 'IMAGE');

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

						const credentials = await this.getCredentials('vntanaApi');
						const baseUrl = getBaseUrl(credentials);

						const signUrlResponse = await vntanaApiRequest.call(
							this,
							'POST',
							'/v1/storage/upload/clients/resource/sign-url',
							signUrlBody,
							{},
							{ headers: { Origin: baseUrl } },
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

						const rawFileName = (options.fileName as string) || binaryData.fileName || 'upload';
						const fileName = sanitizeFileName(rawFileName);
						const contentType = (options.contentType as string) || binaryData.mimeType || 'application/octet-stream';

						// Validate binary data (M-4 security fix) - no specific category for generic attachments
						validateBinaryData(this, buffer, fileName, contentType);

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

						const credentials = await this.getCredentials('vntanaApi');
						const baseUrl = getBaseUrl(credentials);

						const signUrlResponse = await vntanaApiRequest.call(
							this,
							'POST',
							'/v1/storage/upload/clients/resource/sign-url',
							signUrlBody,
							{},
							{ headers: { Origin: baseUrl } },
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
				// ORGANIZATION RESOURCE
				// =================================================================
				if (resource === 'organization') {
					// -------------------------------------------------------------
					// Organization: List
					// -------------------------------------------------------------
					if (operation === 'list') {
						const response = await vntanaApiRequest.call(
							this,
							'GET',
							'/v1/organizations',
						);

						const orgResponse = response.response as ListOrganizationsResponse;
						const organizations = orgResponse.grid || [];

						for (const org of organizations) {
							returnData.push({
								json: {
									uuid: org.uuid,
									name: org.name,
									slug: org.slug,
								},
							});
						}
					}
				}

				// =================================================================
				// WORKSPACE RESOURCE
				// =================================================================
				if (resource === 'workspace') {
					// -------------------------------------------------------------
					// Workspace: List
					// -------------------------------------------------------------
					if (operation === 'list') {
						const response = await vntanaApiRequest.call(
							this,
							'GET',
							'/v1/clients/client-organizations',
						);

						const workspaceResponse = response.response as ListWorkspacesResponse;
						const workspaces = workspaceResponse.grid || [];

						for (const workspace of workspaces) {
							returnData.push({
								json: {
									uuid: workspace.uuid,
									name: workspace.name,
									slug: workspace.slug,
								},
							});
						}
					}
				}

				// =================================================================
				// PIPELINE RESOURCE
				// =================================================================
				if (resource === 'pipeline') {
					// -------------------------------------------------------------
					// Pipeline: List
					// -------------------------------------------------------------
					if (operation === 'list') {
						const response = await vntanaApiRequest.call(
							this,
							'GET',
							'/v1/pipelines',
						);

						const pipelineResponse = response.response as ListPipelinesResponse;
						const pipelines = pipelineResponse.pipelines || [];

						for (const pipeline of pipelines) {
							returnData.push({
								json: {
									uuid: pipeline.uuid,
									name: pipeline.name,
									description: pipeline.description,
								},
							});
						}
					}
				}

				// =================================================================
				// TAG RESOURCE
				// =================================================================
				if (resource === 'tag') {
					// -------------------------------------------------------------
					// Tag: Search
					// -------------------------------------------------------------
					if (operation === 'search') {
						const clientUuid = await getClientUuid.call(this, i);
						const returnAll = this.getNodeParameter('returnAll', i) as boolean;
						const limit = this.getNodeParameter('limit', i, 50) as number;
						const filters = this.getNodeParameter('filters', i, {}) as IDataObject;

						// Build request body - clientUuid goes in body, not query string (per Postman collection)
						const body: IDataObject = { clientUuid };

						if (filters.searchTerm) {
							body.searchTerm = filters.searchTerm;
						}

						let tags: IDataObject[];

						if (returnAll) {
							tags = await vntanaApiRequestAllItems.call(
								this,
								'POST',
								'/v1/tags/search',
								body,
								{},
							);
						} else {
							body.page = 1;
							body.size = limit;
							const response = await vntanaApiRequest.call(
								this,
								'POST',
								'/v1/tags/search',
								body,
								{},
							);
							const searchResponse = response.response as SearchTagsResponse;
							tags = searchResponse.grid || [];
						}

						for (const tag of tags) {
							returnData.push({ json: tag });
						}
					}

					// -------------------------------------------------------------
					// Tag: Create (with get-or-create pattern)
					// -------------------------------------------------------------
					if (operation === 'create') {
						const clientUuid = await getClientUuid.call(this, i);
						const name = this.getNodeParameter('name', i) as string;
						const options = this.getNodeParameter('options', i, {}) as IDataObject;

						// First, search for existing tag with this name to avoid duplicates
						// Note: clientUuid goes in body, not query string (per Postman collection)
						const searchResponse = await vntanaApiRequest.call(
							this,
							'POST',
							'/v1/tags/search',
							{ clientUuid, searchTerm: name, page: 1, size: 10 },
							{},
						);

						// Check if tag already exists (exact name match, case-insensitive)
						const searchResult = searchResponse.response as IDataObject;
						const existingTags = (searchResult?.grid as IDataObject[]) || [];
						const existingTag = existingTags.find(
							(t: IDataObject) => t.name?.toString().toLowerCase() === name.toLowerCase(),
						);

						if (existingTag) {
							// Return existing tag instead of creating duplicate
							returnData.push({ json: existingTag });
						} else {
							// Create new tag - clientUuid and name in body only (per Postman collection)
							const body: IDataObject = { clientUuid, name };

							if (options.tagGroupUuid) {
								body.tagGroupUuid = options.tagGroupUuid;
							}

							const response = await vntanaApiRequest.call(
								this,
								'POST',
								'/v1/tags/create',
								body,
								{},
							);

							const tag = response.response as IDataObject;
							returnData.push({ json: tag });
						}
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
