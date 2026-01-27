import type { INodeProperties } from 'n8n-workflow';

// =============================================================================
// RESOURCE SELECTOR
// =============================================================================

export const resourceProperty: INodeProperties = {
	displayName: 'Resource',
	name: 'resource',
	type: 'options',
	noDataExpression: true,
	options: [
		{
			name: 'Product',
			value: 'product',
		},
		{
			name: 'Render',
			value: 'render',
		},
		{
			name: 'Attachment',
			value: 'attachment',
		},
		{
			name: 'Organization',
			value: 'organization',
		},
		{
			name: 'Workspace',
			value: 'workspace',
		},
		{
			name: 'Pipeline',
			value: 'pipeline',
		},
		{
			name: 'Tag',
			value: 'tag',
		},
	],
	default: 'product',
};

// =============================================================================
// PRODUCT OPERATIONS
// =============================================================================

export const productOperations: INodeProperties = {
	displayName: 'Operation',
	name: 'operation',
	type: 'options',
	noDataExpression: true,
	displayOptions: {
		show: {
			resource: ['product'],
		},
	},
	options: [
		{
			name: 'Search',
			value: 'search',
			description: 'Search for products in a workspace',
			action: 'Search products',
		},
		{
			name: 'Download Model',
			value: 'downloadModel',
			description: 'Download a 3D model file',
			action: 'Download a model',
		},
		{
			name: 'Upload 3D Model',
			value: 'upload3DModel',
			description: 'Upload and optimize a 3D model file',
			action: 'Upload a 3D model',
		},
		{
			name: 'Upload Asset',
			value: 'uploadAsset',
			description: 'Upload an image, video, document, or audio file',
			action: 'Upload an asset',
		},
		{
			name: 'Update Status',
			value: 'updateStatus',
			description: 'Update the status of one or more products',
			action: 'Update product status',
		},
		{
			name: 'Update Product',
			value: 'updateProduct',
			description: 'Update product name, description, status, tags, or attributes',
			action: 'Update a product',
		},
	],
	default: 'search',
};

// =============================================================================
// RENDER OPERATIONS
// =============================================================================

export const renderOperations: INodeProperties = {
	displayName: 'Operation',
	name: 'operation',
	type: 'options',
	noDataExpression: true,
	displayOptions: {
		show: {
			resource: ['render'],
		},
	},
	options: [
		{
			name: 'Download',
			value: 'download',
			description: 'Download renders for a product',
			action: 'Download renders',
		},
		{
			name: 'Upload',
			value: 'upload',
			description: 'Upload a render to a product',
			action: 'Upload a render',
		},
	],
	default: 'download',
};

// =============================================================================
// ATTACHMENT OPERATIONS
// =============================================================================

export const attachmentOperations: INodeProperties = {
	displayName: 'Operation',
	name: 'operation',
	type: 'options',
	noDataExpression: true,
	displayOptions: {
		show: {
			resource: ['attachment'],
		},
	},
	options: [
		{
			name: 'Upload',
			value: 'upload',
			description: 'Upload an attachment to a product',
			action: 'Upload an attachment',
		},
	],
	default: 'upload',
};

// =============================================================================
// ORGANIZATION OPERATIONS
// =============================================================================

export const organizationOperations: INodeProperties = {
	displayName: 'Operation',
	name: 'operation',
	type: 'options',
	noDataExpression: true,
	displayOptions: {
		show: {
			resource: ['organization'],
		},
	},
	options: [
		{
			name: 'List',
			value: 'list',
			description: 'List all organizations',
			action: 'List organizations',
		},
	],
	default: 'list',
};

// =============================================================================
// WORKSPACE OPERATIONS
// =============================================================================

export const workspaceOperations: INodeProperties = {
	displayName: 'Operation',
	name: 'operation',
	type: 'options',
	noDataExpression: true,
	displayOptions: {
		show: {
			resource: ['workspace'],
		},
	},
	options: [
		{
			name: 'List',
			value: 'list',
			description: 'List all workspaces in the organization',
			action: 'List workspaces',
		},
	],
	default: 'list',
};

// =============================================================================
// PIPELINE OPERATIONS
// =============================================================================

export const pipelineOperations: INodeProperties = {
	displayName: 'Operation',
	name: 'operation',
	type: 'options',
	noDataExpression: true,
	displayOptions: {
		show: {
			resource: ['pipeline'],
		},
	},
	options: [
		{
			name: 'List',
			value: 'list',
			description: 'List all available optimization pipelines',
			action: 'List pipelines',
		},
	],
	default: 'list',
};

// =============================================================================
// TAG OPERATIONS
// =============================================================================

export const tagOperations: INodeProperties = {
	displayName: 'Operation',
	name: 'operation',
	type: 'options',
	noDataExpression: true,
	displayOptions: {
		show: {
			resource: ['tag'],
		},
	},
	options: [
		{
			name: 'Search',
			value: 'search',
			description: 'Search for tags in a workspace',
			action: 'Search tags',
		},
		{
			name: 'Create',
			value: 'create',
			description: 'Create a new tag',
			action: 'Create a tag',
		},
	],
	default: 'search',
};

// =============================================================================
// PRODUCT: SEARCH FIELDS
// =============================================================================

export const productSearchFields: INodeProperties[] = [
	{
		displayName: 'Workspace UUID',
		name: 'clientUuid',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['product'],
				operation: ['search'],
			},
		},
		description: 'UUID of the workspace to search in. Leave empty to use the default from credentials.',
	},
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['product'],
				operation: ['search'],
			},
		},
		description: 'Whether to return all results or only up to a given limit',
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		default: 10,
		typeOptions: {
			minValue: 1,
			maxValue: 100,
		},
		displayOptions: {
			show: {
				resource: ['product'],
				operation: ['search'],
				returnAll: [false],
			},
		},
		description: 'Max number of results to return',
	},
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: {
			show: {
				resource: ['product'],
				operation: ['search'],
			},
		},
		options: [
			{
				displayName: 'Search Term',
				name: 'searchTerm',
				type: 'string',
				default: '',
				description: 'Text to search for in product names and descriptions',
			},
			{
				displayName: 'Status',
				name: 'status',
				type: 'multiOptions',
				options: [
					{ name: 'Draft', value: 'DRAFT' },
					{ name: 'Live Public', value: 'LIVE_PUBLIC' },
					{ name: 'Live Internal', value: 'LIVE_INTERNAL' },
					{ name: 'Approved', value: 'APPROVED' },
					{ name: 'Rejected', value: 'REJECTED' },
					{ name: 'Waiting Review', value: 'WAITING_REVIEW' },
				],
				default: [],
				description: 'Filter by product status',
			},
			{
				displayName: 'Conversion Status',
				name: 'conversionStatuses',
				type: 'multiOptions',
				options: [
					{ name: 'Pending', value: 'PENDING' },
					{ name: 'Converting', value: 'CONVERTING' },
					{ name: 'Completed', value: 'COMPLETED' },
					{ name: 'Failed', value: 'FAILED' },
					{ name: 'No Asset', value: 'NO_ASSET' },
				],
				default: [],
				description: 'Filter by conversion status',
			},
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				default: '',
				description: 'Filter by exact product name',
			},
			{
				displayName: 'Tag UUIDs',
				name: 'tagsUuids',
				type: 'string',
				default: '',
				description: 'Comma-separated list of tag UUIDs to filter by',
			},
		],
	},
];

// =============================================================================
// PRODUCT: DOWNLOAD MODEL FIELDS
// =============================================================================

export const productDownloadModelFields: INodeProperties[] = [
	{
		displayName: 'Product UUID',
		name: 'productUuid',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['product'],
				operation: ['downloadModel'],
			},
		},
		description: 'UUID of the product to download',
	},
	{
		displayName: 'Workspace UUID',
		name: 'clientUuid',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['product'],
				operation: ['downloadModel'],
			},
		},
		description: 'UUID of the workspace. Leave empty to use the default from credentials.',
	},
	{
		displayName: 'Format',
		name: 'conversionFormat',
		type: 'options',
		required: true,
		options: [
			{ name: 'GLB', value: 'GLB' },
			{ name: 'USDZ', value: 'USDZ' },
			{ name: 'FBX', value: 'FBX' },
			{ name: 'OBJ', value: 'OBJ' },
			{ name: 'STEP', value: 'STEP' },
		],
		default: 'GLB',
		displayOptions: {
			show: {
				resource: ['product'],
				operation: ['downloadModel'],
			},
		},
		description: 'Format to download the model in',
	},
	{
		displayName: 'Binary Property',
		name: 'binaryPropertyName',
		type: 'string',
		default: 'data',
		displayOptions: {
			show: {
				resource: ['product'],
				operation: ['downloadModel'],
			},
		},
		description: 'Name of the binary property to store the downloaded file in',
	},
];

// =============================================================================
// RENDER: DOWNLOAD FIELDS
// =============================================================================

export const renderDownloadFields: INodeProperties[] = [
	{
		displayName: 'Product UUID',
		name: 'productUuid',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['render'],
				operation: ['download'],
			},
		},
		description: 'UUID of the product to download renders from',
	},
	{
		displayName: 'Workspace UUID',
		name: 'clientUuid',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['render'],
				operation: ['download'],
			},
		},
		description: 'UUID of the workspace. Leave empty to use the default from credentials.',
	},
	{
		displayName: 'Entity Type',
		name: 'entityType',
		type: 'options',
		options: [
			{ name: 'Render (Still Image)', value: 'RENDER' },
			{ name: 'Turntable (Video)', value: 'TURNTABLE' },
		],
		default: 'RENDER',
		displayOptions: {
			show: {
				resource: ['render'],
				operation: ['download'],
			},
		},
		description: 'Type of render to download',
	},
	{
		displayName: 'Download All',
		name: 'downloadAll',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['render'],
				operation: ['download'],
			},
		},
		description: 'Whether to download all renders or just the first one',
	},
	{
		displayName: 'Binary Property',
		name: 'binaryPropertyName',
		type: 'string',
		default: 'data',
		displayOptions: {
			show: {
				resource: ['render'],
				operation: ['download'],
			},
		},
		description: 'Name of the binary property to store the downloaded file(s) in',
	},
];

// =============================================================================
// RENDER: UPLOAD FIELDS
// =============================================================================

export const renderUploadFields: INodeProperties[] = [
	{
		displayName: 'Product UUID',
		name: 'productUuid',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['render'],
				operation: ['upload'],
			},
		},
		description: 'UUID of the product to upload the render to',
	},
	{
		displayName: 'Workspace UUID',
		name: 'clientUuid',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['render'],
				operation: ['upload'],
			},
		},
		description: 'UUID of the workspace. Leave empty to use the default from credentials.',
	},
	{
		displayName: 'Binary Property',
		name: 'binaryPropertyName',
		type: 'string',
		required: true,
		default: 'data',
		displayOptions: {
			show: {
				resource: ['render'],
				operation: ['upload'],
			},
		},
		description: 'Name of the binary property containing the file to upload',
	},
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				resource: ['render'],
				operation: ['upload'],
			},
		},
		options: [
			{
				displayName: 'File Name',
				name: 'fileName',
				type: 'string',
				default: '',
				description: 'Override the file name (uses original binary name if not specified)',
			},
			{
				displayName: 'Content Type',
				name: 'contentType',
				type: 'string',
				default: '',
				description: 'Override the content type (uses original binary MIME type if not specified)',
			},
		],
	},
];

// =============================================================================
// ATTACHMENT: UPLOAD FIELDS
// =============================================================================

export const attachmentUploadFields: INodeProperties[] = [
	{
		displayName: 'Product UUID',
		name: 'productUuid',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['attachment'],
				operation: ['upload'],
			},
		},
		description: 'UUID of the product to upload the attachment to',
	},
	{
		displayName: 'Workspace UUID',
		name: 'clientUuid',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['attachment'],
				operation: ['upload'],
			},
		},
		description: 'UUID of the workspace. Leave empty to use the default from credentials.',
	},
	{
		displayName: 'Binary Property',
		name: 'binaryPropertyName',
		type: 'string',
		required: true,
		default: 'data',
		displayOptions: {
			show: {
				resource: ['attachment'],
				operation: ['upload'],
			},
		},
		description: 'Name of the binary property containing the file to upload',
	},
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				resource: ['attachment'],
				operation: ['upload'],
			},
		},
		options: [
			{
				displayName: 'File Name',
				name: 'fileName',
				type: 'string',
				default: '',
				description: 'Override the file name (uses original binary name if not specified)',
			},
			{
				displayName: 'Content Type',
				name: 'contentType',
				type: 'string',
				default: '',
				description: 'Override the content type (uses original binary MIME type if not specified)',
			},
		],
	},
];

// =============================================================================
// PRODUCT: UPLOAD 3D MODEL FIELDS
// =============================================================================

export const productUpload3DModelFields: INodeProperties[] = [
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['product'],
				operation: ['upload3DModel'],
			},
		},
		description: 'Name for the product',
	},
	{
		displayName: 'Pipeline UUID',
		name: 'pipelineUuid',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['product'],
				operation: ['upload3DModel'],
			},
		},
		description: 'UUID of the optimization pipeline to use. Use Pipeline → List to get available pipelines.',
	},
	{
		displayName: 'Workspace UUID',
		name: 'clientUuid',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['product'],
				operation: ['upload3DModel'],
			},
		},
		description: 'UUID of the workspace. Leave empty to use the default from credentials.',
	},
	{
		displayName: 'Binary Property',
		name: 'binaryPropertyName',
		type: 'string',
		required: true,
		default: 'data',
		displayOptions: {
			show: {
				resource: ['product'],
				operation: ['upload3DModel'],
			},
		},
		description: 'Name of the binary property containing the 3D model file',
	},
	{
		displayName: 'Optimization Mode',
		name: 'optimizationMode',
		type: 'options',
		options: [
			{
				name: 'Preset',
				value: 'preset',
				description: 'Use a predefined optimization preset',
			},
			{
				name: 'Advanced',
				value: 'advanced',
				description: 'Configure optimization settings manually',
			},
		],
		default: 'preset',
		displayOptions: {
			show: {
				resource: ['product'],
				operation: ['upload3DModel'],
			},
		},
		description: 'How to configure the 3D optimization settings',
	},
	{
		displayName: 'Optimization Preset',
		name: 'optimizationPreset',
		type: 'options',
		options: [
			{
				name: 'Web Optimized (Recommended)',
				value: 'webOptimized',
				description: 'Balanced for web viewing - 50K polys, 2048 textures, Draco enabled',
			},
			{
				name: 'High Quality',
				value: 'highQuality',
				description: 'Preserve detail - 100K polys, 4096 textures, no Draco',
			},
			{
				name: 'Mobile',
				value: 'mobile',
				description: 'Aggressive optimization - 25K polys, 1024 textures',
			},
			{
				name: 'Preserve Original',
				value: 'preserveOriginal',
				description: 'Minimal changes - convert format only',
			},
		],
		default: 'webOptimized',
		displayOptions: {
			show: {
				resource: ['product'],
				operation: ['upload3DModel'],
				optimizationMode: ['preset'],
			},
		},
		description: 'Predefined optimization configuration',
	},
	{
		displayName: 'Enable Draco Compression',
		name: 'enableDracoCompression',
		type: 'boolean',
		default: true,
		displayOptions: {
			show: {
				resource: ['product'],
				operation: ['upload3DModel'],
				optimizationMode: ['advanced'],
			},
		},
		description: 'Whether to enable Draco mesh compression for smaller file sizes',
	},
	{
		displayName: 'Target Polygon Count',
		name: 'targetPolygonCount',
		type: 'number',
		default: 50000,
		typeOptions: {
			minValue: 1000,
			maxValue: 1000000,
		},
		displayOptions: {
			show: {
				resource: ['product'],
				operation: ['upload3DModel'],
				optimizationMode: ['advanced'],
			},
		},
		description: 'Target number of polygons for the optimized model',
	},
	{
		displayName: 'Force Polygon Count',
		name: 'forcePolygonCount',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['product'],
				operation: ['upload3DModel'],
				optimizationMode: ['advanced'],
			},
		},
		description: 'Whether to force the exact polygon count (may reduce quality)',
	},
	{
		displayName: 'Remove Obstructed Geometry',
		name: 'removeObstructedGeometry',
		type: 'boolean',
		default: true,
		displayOptions: {
			show: {
				resource: ['product'],
				operation: ['upload3DModel'],
				optimizationMode: ['advanced'],
			},
		},
		description: 'Whether to remove geometry that is not visible from the outside',
	},
	{
		displayName: 'Bake Small Features',
		name: 'bakeSmallFeatures',
		type: 'boolean',
		default: true,
		displayOptions: {
			show: {
				resource: ['product'],
				operation: ['upload3DModel'],
				optimizationMode: ['advanced'],
			},
		},
		description: 'Whether to bake small geometric features into normal maps',
	},
	{
		displayName: 'Pivot Point',
		name: 'pivotPoint',
		type: 'options',
		options: [
			{ name: 'Bottom Center', value: 'bottom-center' },
			{ name: 'Center', value: 'center' },
		],
		default: 'bottom-center',
		displayOptions: {
			show: {
				resource: ['product'],
				operation: ['upload3DModel'],
				optimizationMode: ['advanced'],
			},
		},
		description: 'Where to position the model pivot point',
	},
	{
		displayName: 'Max Texture Resolution',
		name: 'maxTextureResolution',
		type: 'options',
		options: [
			{ name: '512', value: 512 },
			{ name: '1024', value: 1024 },
			{ name: '2048', value: 2048 },
			{ name: '4096', value: 4096 },
		],
		default: 2048,
		displayOptions: {
			show: {
				resource: ['product'],
				operation: ['upload3DModel'],
				optimizationMode: ['advanced'],
			},
		},
		description: 'Maximum resolution for textures',
	},
	{
		displayName: 'Texture Compression Aggression',
		name: 'textureCompressionAggression',
		type: 'number',
		default: 3,
		typeOptions: {
			minValue: 1,
			maxValue: 10,
		},
		displayOptions: {
			show: {
				resource: ['product'],
				operation: ['upload3DModel'],
				optimizationMode: ['advanced'],
			},
		},
		description: 'How aggressively to compress textures (1=minimal, 10=maximum)',
	},
	{
		displayName: 'Lossless Texture Compression',
		name: 'losslessTextureCompression',
		type: 'boolean',
		default: true,
		displayOptions: {
			show: {
				resource: ['product'],
				operation: ['upload3DModel'],
				optimizationMode: ['advanced'],
			},
		},
		description: 'Whether to use lossless texture compression',
	},
	{
		displayName: 'Use KTX2 Format',
		name: 'useKTX2Format',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['product'],
				operation: ['upload3DModel'],
				optimizationMode: ['advanced'],
			},
		},
		description: 'Whether to use KTX2 texture format for better GPU performance',
	},
	{
		displayName: 'Bake Ambient Occlusion',
		name: 'bakeAmbientOcclusion',
		type: 'boolean',
		default: true,
		displayOptions: {
			show: {
				resource: ['product'],
				operation: ['upload3DModel'],
				optimizationMode: ['advanced'],
			},
		},
		description: 'Whether to bake ambient occlusion into the model',
	},
	{
		displayName: 'AO Strength',
		name: 'aoStrength',
		type: 'number',
		default: 1,
		typeOptions: {
			minValue: 0,
			maxValue: 2,
			numberPrecision: 1,
		},
		displayOptions: {
			show: {
				resource: ['product'],
				operation: ['upload3DModel'],
				optimizationMode: ['advanced'],
				bakeAmbientOcclusion: [true],
			},
		},
		description: 'Strength of the ambient occlusion effect',
	},
	{
		displayName: 'AO Radius',
		name: 'aoRadius',
		type: 'number',
		default: 5,
		typeOptions: {
			minValue: 1,
			maxValue: 20,
		},
		displayOptions: {
			show: {
				resource: ['product'],
				operation: ['upload3DModel'],
				optimizationMode: ['advanced'],
				bakeAmbientOcclusion: [true],
			},
		},
		description: 'Radius of the ambient occlusion sampling',
	},
	{
		displayName: 'AO Resolution',
		name: 'aoResolution',
		type: 'options',
		options: [
			{ name: '512', value: 512 },
			{ name: '1024', value: 1024 },
			{ name: '2048', value: 2048 },
		],
		default: 1024,
		displayOptions: {
			show: {
				resource: ['product'],
				operation: ['upload3DModel'],
				optimizationMode: ['advanced'],
				bakeAmbientOcclusion: [true],
			},
		},
		description: 'Resolution of the ambient occlusion texture',
	},
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				resource: ['product'],
				operation: ['upload3DModel'],
			},
		},
		options: [
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				default: '',
				description: 'Description for the product',
			},
			{
				displayName: 'Status',
				name: 'status',
				type: 'options',
				options: [
					{ name: 'Draft', value: 'DRAFT' },
					{ name: 'Live Internal', value: 'LIVE_INTERNAL' },
					{ name: 'Live Public', value: 'LIVE_PUBLIC' },
				],
				default: 'DRAFT',
				description: 'Initial status of the product',
			},
			{
				displayName: 'Tag UUIDs',
				name: 'tagsUuids',
				type: 'string',
				default: '',
				description: 'Comma-separated list of tag UUIDs to apply',
			},
			{
				displayName: 'Project UUIDs',
				name: 'projectsUuids',
				type: 'string',
				default: '',
				description: 'Comma-separated list of project UUIDs to link',
			},
			{
				displayName: 'Attributes (Key-Value)',
				name: 'attributesKeyValue',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
				},
				default: {},
				description: 'Product attributes as key-value pairs',
				options: [
					{
						name: 'values',
						displayName: 'Attribute',
						values: [
							{
								displayName: 'Key',
								name: 'key',
								type: 'string',
								default: '',
								description: 'Attribute key (e.g., SKU, Color)',
							},
							{
								displayName: 'Value',
								name: 'value',
								type: 'string',
								default: '',
								description: 'Attribute value',
							},
						],
					},
				],
			},
			{
				displayName: 'Attributes (JSON)',
				name: 'attributesJson',
				type: 'json',
				default: '',
				description: 'Product attributes as JSON object. Supports expressions. Values override Key-Value attributes for the same keys.',
			},
		],
	},
];

// =============================================================================
// PRODUCT: UPLOAD ASSET FIELDS
// =============================================================================

export const productUploadAssetFields: INodeProperties[] = [
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['product'],
				operation: ['uploadAsset'],
			},
		},
		description: 'Name for the product',
	},
	{
		displayName: 'Asset Type',
		name: 'assetType',
		type: 'options',
		required: true,
		options: [
			{
				name: 'Image',
				value: 'IMAGE',
				description: 'JPG, PNG, GIF, WebP, SVG, etc.',
			},
			{
				name: 'Video',
				value: 'VIDEO',
				description: 'MP4, MOV, WebM, AVI, etc.',
			},
			{
				name: 'Document',
				value: 'DOCUMENT',
				description: 'PDF, DOCX, XLSX, CSV, etc.',
			},
			{
				name: 'Audio',
				value: 'AUDIO',
				description: 'MP3, WAV, AAC, FLAC, etc.',
			},
		],
		default: 'IMAGE',
		displayOptions: {
			show: {
				resource: ['product'],
				operation: ['uploadAsset'],
			},
		},
		description: 'Type of asset being uploaded',
	},
	{
		displayName: 'Workspace UUID',
		name: 'clientUuid',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['product'],
				operation: ['uploadAsset'],
			},
		},
		description: 'UUID of the workspace. Leave empty to use the default from credentials.',
	},
	{
		displayName: 'Binary Property',
		name: 'binaryPropertyName',
		type: 'string',
		required: true,
		default: 'data',
		displayOptions: {
			show: {
				resource: ['product'],
				operation: ['uploadAsset'],
			},
		},
		description: 'Name of the binary property containing the file to upload',
	},
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				resource: ['product'],
				operation: ['uploadAsset'],
			},
		},
		options: [
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				default: '',
				description: 'Description for the product',
			},
			{
				displayName: 'Status',
				name: 'status',
				type: 'options',
				options: [
					{ name: 'Draft', value: 'DRAFT' },
					{ name: 'Live Internal', value: 'LIVE_INTERNAL' },
					{ name: 'Live Public', value: 'LIVE_PUBLIC' },
				],
				default: 'DRAFT',
				description: 'Initial status of the product',
			},
			{
				displayName: 'Tag UUIDs',
				name: 'tagsUuids',
				type: 'string',
				default: '',
				description: 'Comma-separated list of tag UUIDs to apply',
			},
			{
				displayName: 'Project UUIDs',
				name: 'projectsUuids',
				type: 'string',
				default: '',
				description: 'Comma-separated list of project UUIDs to link',
			},
			{
				displayName: 'Attributes (Key-Value)',
				name: 'attributesKeyValue',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
				},
				default: {},
				description: 'Product attributes as key-value pairs',
				options: [
					{
						name: 'values',
						displayName: 'Attribute',
						values: [
							{
								displayName: 'Key',
								name: 'key',
								type: 'string',
								default: '',
								description: 'Attribute key (e.g., SKU, Color)',
							},
							{
								displayName: 'Value',
								name: 'value',
								type: 'string',
								default: '',
								description: 'Attribute value',
							},
						],
					},
				],
			},
			{
				displayName: 'Attributes (JSON)',
				name: 'attributesJson',
				type: 'json',
				default: '',
				description: 'Product attributes as JSON object. Supports expressions. Values override Key-Value attributes for the same keys.',
			},
		],
	},
];

// =============================================================================
// ORGANIZATION: LIST FIELDS (no additional fields needed)
// =============================================================================

export const organizationListFields: INodeProperties[] = [];

// =============================================================================
// WORKSPACE: LIST FIELDS (no additional fields needed)
// =============================================================================

export const workspaceListFields: INodeProperties[] = [];

// =============================================================================
// PIPELINE: LIST FIELDS (no additional fields needed)
// =============================================================================

export const pipelineListFields: INodeProperties[] = [];

// =============================================================================
// TAG: SEARCH FIELDS
// =============================================================================

export const tagSearchFields: INodeProperties[] = [
	{
		displayName: 'Workspace UUID',
		name: 'clientUuid',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['tag'],
				operation: ['search'],
			},
		},
		description: 'UUID of the workspace to search in. Leave empty to use the default from credentials.',
	},
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['tag'],
				operation: ['search'],
			},
		},
		description: 'Whether to return all results or only up to a given limit',
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		default: 50,
		typeOptions: {
			minValue: 1,
			maxValue: 100,
		},
		displayOptions: {
			show: {
				resource: ['tag'],
				operation: ['search'],
				returnAll: [false],
			},
		},
		description: 'Max number of results to return',
	},
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: {
			show: {
				resource: ['tag'],
				operation: ['search'],
			},
		},
		options: [
			{
				displayName: 'Search Term',
				name: 'searchTerm',
				type: 'string',
				default: '',
				description: 'Text to search for in tag names',
			},
		],
	},
];

// =============================================================================
// TAG: CREATE FIELDS
// =============================================================================

export const tagCreateFields: INodeProperties[] = [
	{
		displayName: 'Workspace UUID',
		name: 'clientUuid',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['tag'],
				operation: ['create'],
			},
		},
		description: 'UUID of the workspace to create the tag in. Leave empty to use the default from credentials.',
	},
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['tag'],
				operation: ['create'],
			},
		},
		description: 'Name for the new tag',
	},
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				resource: ['tag'],
				operation: ['create'],
			},
		},
		options: [
			{
				displayName: 'Tag Group UUID',
				name: 'tagGroupUuid',
				type: 'string',
				default: '',
				description: 'UUID of the tag group to add this tag to',
			},
		],
	},
];

// =============================================================================
// PRODUCT: UPDATE PRODUCT FIELDS
// =============================================================================

export const productUpdateFields: INodeProperties[] = [
	{
		displayName: 'Product UUID',
		name: 'productUuid',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['product'],
				operation: ['updateProduct'],
			},
		},
		description: 'UUID of the product to update',
	},
	{
		displayName: 'Workspace UUID',
		name: 'clientUuid',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['product'],
				operation: ['updateProduct'],
			},
		},
		description: 'UUID of the workspace. Leave empty to use the default from credentials.',
	},
	{
		displayName: 'Fields to Update',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['product'],
				operation: ['updateProduct'],
			},
		},
		options: [
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				default: '',
				description: 'New name for the product',
			},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				default: '',
				description: 'New description for the product',
			},
			{
				displayName: 'Status',
				name: 'status',
				type: 'options',
				options: [
					{ name: 'Draft', value: 'DRAFT' },
					{ name: 'Live Internal', value: 'LIVE_INTERNAL' },
					{ name: 'Live Public', value: 'LIVE_PUBLIC' },
				],
				default: 'DRAFT',
				description: 'New status for the product',
			},
			{
				displayName: 'Tag UUIDs',
				name: 'tagsUuids',
				type: 'string',
				default: '',
				description: 'Comma-separated list of tag UUIDs to apply to the product',
			},
			{
				displayName: 'Attributes (Key-Value)',
				name: 'attributesKeyValue',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
				},
				default: {},
				description: 'Product attributes as key-value pairs',
				options: [
					{
						name: 'values',
						displayName: 'Attribute',
						values: [
							{
								displayName: 'Key',
								name: 'key',
								type: 'string',
								default: '',
								description: 'Attribute key (e.g., SKU, Color)',
							},
							{
								displayName: 'Value',
								name: 'value',
								type: 'string',
								default: '',
								description: 'Attribute value',
							},
						],
					},
				],
			},
			{
				displayName: 'Attributes (JSON)',
				name: 'attributesJson',
				type: 'json',
				default: '',
				description: 'Product attributes as JSON object. Supports expressions. Values override Key-Value attributes for the same keys.',
			},
		],
	},
];

// =============================================================================
// PRODUCT: UPDATE STATUS FIELDS
// =============================================================================

export const productUpdateStatusFields: INodeProperties[] = [
	{
		displayName: 'Product UUID(s)',
		name: 'productUuids',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['product'],
				operation: ['updateStatus'],
			},
		},
		description: 'UUID of the product to update. For multiple products, use comma-separated UUIDs.',
	},
	{
		displayName: 'Status',
		name: 'status',
		type: 'options',
		required: true,
		options: [
			{ name: 'Draft', value: 'DRAFT' },
			{ name: 'Live Internal', value: 'LIVE_INTERNAL' },
			{ name: 'Live Public', value: 'LIVE_PUBLIC' },
		],
		default: 'DRAFT',
		displayOptions: {
			show: {
				resource: ['product'],
				operation: ['updateStatus'],
			},
		},
		description: 'Target status for the product(s)',
	},
	{
		displayName: 'Workspace UUID',
		name: 'clientUuid',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['product'],
				operation: ['updateStatus'],
			},
		},
		description: 'UUID of the workspace. Leave empty to use the default from credentials.',
	},
];
