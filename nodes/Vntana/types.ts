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
 * VNTANA Asset Types
 */
export type AssetType =
	| 'THREE_D'
	| 'IMAGE'
	| 'VIDEO'
	| 'DOCUMENT'
	| 'AUDIO';

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

/**
 * Organization
 */
export interface VntanaOrganization extends IDataObject {
	uuid: string;
	name: string;
	slug: string;
}

/**
 * Workspace (Client)
 */
export interface VntanaWorkspace extends IDataObject {
	uuid: string;
	name: string;
	slug: string;
}

/**
 * Pipeline
 */
export interface VntanaPipeline extends IDataObject {
	uuid: string;
	name: string;
	description?: string;
}

/**
 * Model Operations Parameters for 3D optimization
 */
export interface ModelOpsParameters {
	DRACO_COMPRESSION?: {
		enabled?: string;
	};
	OPTIMIZATION?: {
		poly?: string;
		forcePoly?: string;
		obstructedGeometry?: string;
		bakeSmallFeatures?: string;
		desiredOutput?: string;
	};
	TEXTURE_COMPRESSION?: {
		maxDimension?: string;
		aggression?: string;
		lossless?: string;
		ktx2?: string;
	};
	AMBIENT_OCCLUSION?: {
		bake?: string;
		strength?: string;
		radius?: string;
		resolution?: string;
	};
	PIVOT_POINT?: {
		pivot?: string;
	};
}

/**
 * Create Product Request Body
 */
export interface CreateProductBody {
	name: string;
	clientUuid: string;
	pipelineUuid?: string;
	assetType: AssetType;
	description?: string;
	status?: ProductStatus;
	tagsUuids?: string[];
	projectsUuids?: string[];
	modelOpsParameters?: ModelOpsParameters;
}

/**
 * Asset Signed URL Request Body
 */
export interface AssetSignedUrlBody {
	clientUuid: string;
	productUuid: string;
	assetSettings: {
		contentType: string;
		originalName: string;
		originalSize: number;
	};
}

/**
 * Optimization Preset Names
 */
export type OptimizationPreset =
	| 'webOptimized'
	| 'highQuality'
	| 'mobile'
	| 'preserveOriginal';

/**
 * List Organizations Response
 */
export interface ListOrganizationsResponse {
	grid: VntanaOrganization[];
	totalCount: number;
}

/**
 * List Workspaces Response
 */
export interface ListWorkspacesResponse {
	grid: VntanaWorkspace[];
	totalCount: number;
}

/**
 * List Pipelines Response
 */
export interface ListPipelinesResponse {
	pipelines: VntanaPipeline[];
}

/**
 * Validated credentials interface (fixes H-1: unsafe casts)
 */
export interface VntanaCredentials {
	email: string;
	password: string;
	organizationUuid: string;
	defaultClientUuid?: string;
	baseUrl?: string;
}

/**
 * Credential test HTTP response (fixes C-1: Promise<any>)
 */
export interface CredentialTestHttpResponse {
	headers?: Record<string, string>;
	success?: boolean;
	response?: {
		grid?: Array<{ name?: string }>;
	};
}

/**
 * Credential test helpers interface (fixes C-1: Promise<any>)
 */
export interface CredentialTestHelpers {
	httpRequest?: (options: object) => Promise<CredentialTestHttpResponse>;
}

/**
 * Type guard for grid response (fixes H-2: unsafe casts)
 */
export function isGridResponse(obj: unknown): obj is { grid: IDataObject[]; totalCount?: number } {
	return typeof obj === 'object' && obj !== null &&
		'grid' in obj && Array.isArray((obj as { grid: unknown }).grid);
}

/**
 * Type guard for signed URL response validation
 */
export function isSignedUrlResponseValid(obj: unknown): obj is SignedUrlResponse {
	if (typeof obj !== 'object' || obj === null) return false;
	const o = obj as Record<string, unknown>;
	return typeof o.location === 'string' &&
		typeof o.blobId === 'string' &&
		typeof o.requestUuid === 'string';
}
