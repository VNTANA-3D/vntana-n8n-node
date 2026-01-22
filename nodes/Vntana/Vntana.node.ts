import type {
	IDataObject,
	IExecuteFunctions,
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

						const qs: IDataObject = {
							clientUuid,
						};

						// Add filters to query string
						if (filters.searchTerm) {
							qs.searchTerm = filters.searchTerm;
						}
						if (filters.status && (filters.status as string[]).length > 0) {
							qs.status = (filters.status as string[]).join(',');
						}
						if (filters.conversionStatuses && (filters.conversionStatuses as string[]).length > 0) {
							qs.conversionStatuses = (filters.conversionStatuses as string[]).join(',');
						}
						if (filters.name) {
							qs.name = filters.name;
						}
						if (filters.tagsUuids) {
							qs.tagsUuids = filters.tagsUuids;
						}

						let products: IDataObject[];

						if (returnAll) {
							products = await vntanaApiRequestAllItems.call(
								this,
								'POST',
								'/v1/products/clients/search',
								{},
								qs,
							);
						} else {
							qs.page = 0;
							qs.size = limit;
							const response = await vntanaApiRequest.call(
								this,
								'POST',
								'/v1/products/clients/search',
								{},
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

						// Step 1: Search for attachments
						const searchBody: IDataObject = {
							page: 0,
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
