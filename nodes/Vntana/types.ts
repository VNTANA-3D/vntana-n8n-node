import type { IDataObject } from 'n8n-workflow';

/**
 * VNTANA Product Status
 */
export type ProductStatus =
	| 'DRAFT'
	| 'LIVE_PUBLIC'
	| 'LIVE_INTERNAL'
	| 'APPROVED'
	| 'REJECTED'
	| 'WAITING_REVIEW';

/**
 * VNTANA Conversion Status
 */
export type ConversionStatus =
	| 'PENDING'
	| 'CONVERTING'
	| 'COMPLETED'
	| 'FAILED'
	| 'NO_ASSET'
	| 'TERMINATED'
	| 'NOT_APPLICABLE';

/**
 * VNTANA 3D Model Formats
 */
export type ConversionFormat = 'GLB' | 'USDZ' | 'FBX' | 'OBJ' | 'STEP';

/**
 * VNTANA Store Types for uploads
 */
export type StoreType = 'ASSET' | 'ATTACHMENT' | 'RENDER';

/**
 * VNTANA Parent Entity Types
 */
export type ParentEntityType = 'PRODUCT' | 'VARIANT_GROUP' | 'ANNOTATION' | 'COMMENT' | 'RENDER';

/**
 * VNTANA Attachment Entity Types (for filtering)
 */
export type AttachmentEntityType = 'RENDER' | 'TURNTABLE' | 'PRODUCT';

/**
 * VNTANA API Response wrapper
 */
export interface VntanaApiResponse<T = IDataObject> {
	success: boolean;
	errors: IDataObject[];
	response: T;
}

/**
 * Search Products Response
 */
export interface SearchProductsResponse {
	totalCount: number;
	grid: VntanaProduct[];
}

/**
 * VNTANA Product
 */
export interface VntanaProduct extends IDataObject {
	uuid: string;
	name: string;
	description?: string;
	status: ProductStatus;
	conversionStatus: ConversionStatus;
	createdAt: string;
	updatedAt: string;
	thumbnailUrl?: string;
	tags?: VntanaTag[];
	attributes?: IDataObject;
	asset?: VntanaAsset;
}

/**
 * VNTANA Asset (file/model info)
 */
export interface VntanaAsset extends IDataObject {
	assetOriginalName?: string;
	assetOriginalSize?: number;
	conversionFormats?: ConversionFormat[];
	models?: VntanaModel[];
}

/**
 * VNTANA Model (converted format)
 */
export interface VntanaModel extends IDataObject {
	uuid: string;
	conversionFormat: ConversionFormat;
	modelBlobId: string;
	conversionStatus: ConversionStatus;
	modelSize: number;
}

/**
 * VNTANA Tag
 */
export interface VntanaTag extends IDataObject {
	uuid: string;
	name: string;
}

/**
 * Search Attachments Response
 */
export interface SearchAttachmentsResponse {
	totalCount: number;
	grid: VntanaAttachment[];
}

/**
 * VNTANA Attachment
 */
export interface VntanaAttachment extends IDataObject {
	uuid: string;
	type: string;
	name: string;
	entityType: AttachmentEntityType;
	entityUuid: string;
	blobId: string;
	productUuid: string;
	created: string;
	updated: string;
}

/**
 * Signed URL Response
 */
export interface SignedUrlResponse {
	requestUuid: string;
	location: string;
	blobId: string;
}

/**
 * Resource Settings for upload
 */
export interface ResourceSettings {
	contentType: string;
	originalName: string;
	originalSize: number;
}

/**
 * Upload Request Body
 */
export interface UploadRequestBody {
	clientUuid: string;
	parentEntityUuid: string;
	parentEntityType: ParentEntityType;
	storeType: StoreType;
	resourceSettings: ResourceSettings;
}
