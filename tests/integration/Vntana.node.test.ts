import { describe, it, expect } from 'vitest';
import { Vntana } from '../../nodes/Vntana/Vntana.node';

describe('Vntana Node', () => {
	// Create a single instance for all tests since the node is stateless
	const vntanaNode = new Vntana();

	describe('node description', () => {
		it('should have correct display name', () => {
			expect(vntanaNode.description.displayName).toBe('VNTANA');
		});

		it('should have correct internal name', () => {
			expect(vntanaNode.description.name).toBe('vntana');
		});

		it('should have correct version', () => {
			expect(vntanaNode.description.version).toBe(1);
		});

		it('should be in transform group', () => {
			expect(vntanaNode.description.group).toContain('transform');
		});

		it('should have SVG icon', () => {
			expect(vntanaNode.description.icon).toBe('file:vntana.svg');
		});

		it('should have default name', () => {
			expect(vntanaNode.description.defaults.name).toBe('VNTANA');
		});
	});

	describe('inputs and outputs', () => {
		it('should have one main input', () => {
			expect(vntanaNode.description.inputs).toEqual(['main']);
		});

		it('should have one main output', () => {
			expect(vntanaNode.description.outputs).toEqual(['main']);
		});
	});

	describe('credentials', () => {
		it('should require vntanaApi credentials', () => {
			const credentialConfig = vntanaNode.description.credentials?.[0];
			expect(credentialConfig).toBeDefined();
			expect(credentialConfig?.name).toBe('vntanaApi');
			expect(credentialConfig?.required).toBe(true);
		});

		it('should have credential test method configured', () => {
			const credentialConfig = vntanaNode.description.credentials?.[0];
			expect(credentialConfig?.testedBy).toBe('testVntanaCredentials');
		});

		it('should have credential test implementation', () => {
			expect(vntanaNode.methods).toBeDefined();
			expect(vntanaNode.methods.credentialTest).toBeDefined();
			expect(vntanaNode.methods.credentialTest.testVntanaCredentials).toBeDefined();
			expect(typeof vntanaNode.methods.credentialTest.testVntanaCredentials).toBe('function');
		});
	});

	describe('resources', () => {
		const resourceProperty = vntanaNode.description.properties.find(
			(p) => p.name === 'resource',
		);

		it('should have resource property', () => {
			expect(resourceProperty).toBeDefined();
			expect(resourceProperty?.type).toBe('options');
		});

		it('should have product resource', () => {
			const options = resourceProperty?.options as Array<{ name: string; value: string }>;
			const productOption = options?.find((o) => o.value === 'product');
			expect(productOption).toBeDefined();
			expect(productOption?.name).toBe('Product');
		});

		it('should have render resource', () => {
			const options = resourceProperty?.options as Array<{ name: string; value: string }>;
			const renderOption = options?.find((o) => o.value === 'render');
			expect(renderOption).toBeDefined();
			expect(renderOption?.name).toBe('Render');
		});

		it('should have attachment resource', () => {
			const options = resourceProperty?.options as Array<{ name: string; value: string }>;
			const attachmentOption = options?.find((o) => o.value === 'attachment');
			expect(attachmentOption).toBeDefined();
			expect(attachmentOption?.name).toBe('Attachment');
		});

		it('should have organization resource', () => {
			const options = resourceProperty?.options as Array<{ name: string; value: string }>;
			const orgOption = options?.find((o) => o.value === 'organization');
			expect(orgOption).toBeDefined();
			expect(orgOption?.name).toBe('Organization');
		});

		it('should have workspace resource', () => {
			const options = resourceProperty?.options as Array<{ name: string; value: string }>;
			const workspaceOption = options?.find((o) => o.value === 'workspace');
			expect(workspaceOption).toBeDefined();
			expect(workspaceOption?.name).toBe('Workspace');
		});

		it('should have pipeline resource', () => {
			const options = resourceProperty?.options as Array<{ name: string; value: string }>;
			const pipelineOption = options?.find((o) => o.value === 'pipeline');
			expect(pipelineOption).toBeDefined();
			expect(pipelineOption?.name).toBe('Pipeline');
		});
	});

	describe('product operations', () => {
		const operationProperty = vntanaNode.description.properties.find(
			(p) => p.name === 'operation' && p.displayOptions?.show?.resource?.includes('product'),
		);

		it('should have operation property for products', () => {
			expect(operationProperty).toBeDefined();
			expect(operationProperty?.type).toBe('options');
		});

		it('should have search operation', () => {
			const options = operationProperty?.options as Array<{ name: string; value: string }>;
			const searchOption = options?.find((o) => o.value === 'search');
			expect(searchOption).toBeDefined();
			expect(searchOption?.name).toBe('Search');
		});

		it('should have download model operation', () => {
			const options = operationProperty?.options as Array<{ name: string; value: string }>;
			const downloadOption = options?.find((o) => o.value === 'downloadModel');
			expect(downloadOption).toBeDefined();
			expect(downloadOption?.name).toBe('Download Model');
		});

		it('should have upload 3D model operation', () => {
			const options = operationProperty?.options as Array<{ name: string; value: string }>;
			const uploadOption = options?.find((o) => o.value === 'upload3DModel');
			expect(uploadOption).toBeDefined();
			expect(uploadOption?.name).toBe('Upload 3D Model');
		});

		it('should have upload asset operation', () => {
			const options = operationProperty?.options as Array<{ name: string; value: string }>;
			const uploadAssetOption = options?.find((o) => o.value === 'uploadAsset');
			expect(uploadAssetOption).toBeDefined();
			expect(uploadAssetOption?.name).toBe('Upload Asset');
		});

		it('should have update status operation', () => {
			const options = operationProperty?.options as Array<{ name: string; value: string }>;
			const updateStatusOption = options?.find((o) => o.value === 'updateStatus');
			expect(updateStatusOption).toBeDefined();
			expect(updateStatusOption?.name).toBe('Update Status');
		});
	});

	describe('render operations', () => {
		const operationProperty = vntanaNode.description.properties.find(
			(p) => p.name === 'operation' && p.displayOptions?.show?.resource?.includes('render'),
		);

		it('should have operation property for renders', () => {
			expect(operationProperty).toBeDefined();
			expect(operationProperty?.type).toBe('options');
		});

		it('should have download operation', () => {
			const options = operationProperty?.options as Array<{ name: string; value: string }>;
			const downloadOption = options?.find((o) => o.value === 'download');
			expect(downloadOption).toBeDefined();
		});

		it('should have upload operation', () => {
			const options = operationProperty?.options as Array<{ name: string; value: string }>;
			const uploadOption = options?.find((o) => o.value === 'upload');
			expect(uploadOption).toBeDefined();
		});
	});

	describe('attachment operations', () => {
		const operationProperty = vntanaNode.description.properties.find(
			(p) => p.name === 'operation' && p.displayOptions?.show?.resource?.includes('attachment'),
		);

		it('should have operation property for attachments', () => {
			expect(operationProperty).toBeDefined();
			expect(operationProperty?.type).toBe('options');
		});

		it('should have upload operation', () => {
			const options = operationProperty?.options as Array<{ name: string; value: string }>;
			const uploadOption = options?.find((o) => o.value === 'upload');
			expect(uploadOption).toBeDefined();
		});
	});

	describe('organization operations', () => {
		const operationProperty = vntanaNode.description.properties.find(
			(p) => p.name === 'operation' && p.displayOptions?.show?.resource?.includes('organization'),
		);

		it('should have operation property for organizations', () => {
			expect(operationProperty).toBeDefined();
			expect(operationProperty?.type).toBe('options');
		});

		it('should have list operation', () => {
			const options = operationProperty?.options as Array<{ name: string; value: string }>;
			const listOption = options?.find((o) => o.value === 'list');
			expect(listOption).toBeDefined();
		});
	});

	describe('workspace operations', () => {
		const operationProperty = vntanaNode.description.properties.find(
			(p) => p.name === 'operation' && p.displayOptions?.show?.resource?.includes('workspace'),
		);

		it('should have operation property for workspaces', () => {
			expect(operationProperty).toBeDefined();
			expect(operationProperty?.type).toBe('options');
		});

		it('should have list operation', () => {
			const options = operationProperty?.options as Array<{ name: string; value: string }>;
			const listOption = options?.find((o) => o.value === 'list');
			expect(listOption).toBeDefined();
		});
	});

	describe('pipeline operations', () => {
		const operationProperty = vntanaNode.description.properties.find(
			(p) => p.name === 'operation' && p.displayOptions?.show?.resource?.includes('pipeline'),
		);

		it('should have operation property for pipelines', () => {
			expect(operationProperty).toBeDefined();
			expect(operationProperty?.type).toBe('options');
		});

		it('should have list operation', () => {
			const options = operationProperty?.options as Array<{ name: string; value: string }>;
			const listOption = options?.find((o) => o.value === 'list');
			expect(listOption).toBeDefined();
		});
	});

	describe('execute method', () => {
		it('should have execute method', () => {
			expect(vntanaNode.execute).toBeDefined();
			expect(typeof vntanaNode.execute).toBe('function');
		});
	});

	describe('subtitle configuration', () => {
		it('should have dynamic subtitle based on operation and resource', () => {
			expect(vntanaNode.description.subtitle).toBe('={{$parameter["operation"] + ": " + $parameter["resource"]}}');
		});
	});
});
