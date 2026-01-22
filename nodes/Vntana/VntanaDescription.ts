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
