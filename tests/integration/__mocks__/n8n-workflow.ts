/**
 * Mock for n8n-workflow module used in integration tests
 */
import { vi } from 'vitest';
import type { IDataObject, INode, IExecuteFunctions, IHttpRequestOptions } from 'n8n-workflow';

// Mock node definition
export const mockNode: INode = {
	name: 'VNTANA',
	type: 'n8n-nodes-vntana.vntana',
	typeVersion: 1,
	position: [0, 0],
	parameters: {},
};

// Mock credentials
export const mockCredentials: IDataObject = {
	email: 'test@example.com',
	password: 'test-password',
	organizationUuid: 'test-org-uuid',
	defaultClientUuid: 'test-client-uuid',
	baseUrl: '',
};

// HTTP request mock function
export const mockHttpRequest = vi.fn();

// Create a mock execution context
export function createMockExecuteFunctions(overrides: Partial<{
	credentials: IDataObject;
	nodeParameters: Record<string, unknown>;
	httpRequestResponse: unknown;
}>): IExecuteFunctions {
	const credentials = overrides.credentials || mockCredentials;
	const nodeParameters = overrides.nodeParameters || {};

	if (overrides.httpRequestResponse !== undefined) {
		mockHttpRequest.mockResolvedValue(overrides.httpRequestResponse);
	}

	return {
		getNode: () => mockNode,
		getCredentials: vi.fn().mockResolvedValue(credentials),
		getNodeParameter: vi.fn((name: string, _itemIndex: number, defaultValue?: unknown) => {
			return nodeParameters[name] !== undefined ? nodeParameters[name] : defaultValue;
		}),
		helpers: {
			httpRequest: mockHttpRequest,
			prepareBinaryData: vi.fn().mockImplementation(async (buffer: Buffer, fileName: string, mimeType: string) => ({
				data: buffer.toString('base64'),
				mimeType,
				fileName,
			})),
			getBinaryDataBuffer: vi.fn().mockResolvedValue(Buffer.from('mock binary data')),
		},
		getInputData: vi.fn().mockReturnValue([{ json: {} }]),
	} as unknown as IExecuteFunctions;
}

// Mock NodeApiError class
export class NodeApiError extends Error {
	constructor(
		public node: INode,
		public errorResponse: IDataObject,
		public options?: { message?: string },
	) {
		super(options?.message || 'API Error');
		this.name = 'NodeApiError';
	}
}

// Reset all mocks
export function resetMocks(): void {
	mockHttpRequest.mockReset();
}

// Setup mock response for successful login flow
export function setupAuthMocks(): void {
	// First call: login
	mockHttpRequest.mockResolvedValueOnce({
		headers: { 'x-auth-token': 'initial-token' },
		body: { success: true },
	});
	// Second call: refresh token
	mockHttpRequest.mockResolvedValueOnce({
		headers: { 'x-auth-token': 'org-specific-token' },
		body: { success: true },
	});
}

// Setup mock response for API call after auth
export function setupApiMock(response: IDataObject): void {
	setupAuthMocks();
	// Third call: actual API request
	mockHttpRequest.mockResolvedValueOnce(response);
}
