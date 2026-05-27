/**
 * E2E Test: "Upload 3D Model" driven through the node's own code
 *
 * Unlike product.e2e.test.ts (which builds requests by hand via VntanaTestClient),
 * this test invokes the real `Vntana.execute()` for the `upload3DModel` operation so
 * the actual request-building path is exercised end-to-end against the live API.
 *
 * The only thing faked is the n8n runtime container (the `IExecuteFunctions` "this"),
 * because n8n is the workflow engine, not a library we can instantiate here. Everything
 * else is real:
 *   - the real `VntanaApi` credential `preAuthentication` (slug -> org UUID -> org token),
 *   - the real generic `authenticate` header injection,
 *   - real HTTP (login, refresh-token, POST /v1/products, sign-url, PUT to storage),
 *   - the real GLB fixture bytes,
 *   - independent verification via a fresh GET /v1/products/{uuid}.
 *
 * This is the test that reproduces MISSING_PRODUCT_AUTO_PUBLISH_OPTION on the unfixed
 * node: `execute()` never sends `publishToStatus`, so the real product create is rejected.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type {
	IExecuteFunctions,
	IHttpRequestHelper,
	IHttpRequestOptions,
	ICredentialDataDecryptedObject,
	INodeExecutionData,
} from 'n8n-workflow';

import { getTestConfig, shouldSkipE2E } from './setup';
import { getTestGlb } from '../fixtures/binary';
import { Vntana } from '../../nodes/Vntana/Vntana.node';
import { VntanaApi } from '../../credentials/VntanaApi.credentials';

// Skip unless we have full e2e config AND a slug (required to drive the real credential).
const config = shouldSkipE2E() ? null : getTestConfig();
const skip = config === null || !config.organizationSlug;

/**
 * Faithful stand-in for n8n's HTTP helper. Mirrors the parts of
 * `IHttpRequestOptions` the node and credential actually use:
 * qs merging, JSON body encoding, Buffer passthrough, returnFullResponse,
 * and throw-on-non-2xx (which is how n8n's helper behaves).
 */
async function doHttp(options: IHttpRequestOptions): Promise<any> {
	const url = new URL(options.url as string);
	if (options.qs) {
		for (const [key, value] of Object.entries(options.qs)) {
			if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
		}
	}

	const headers: Record<string, string> = {};
	for (const [key, value] of Object.entries(options.headers ?? {})) {
		if (value !== undefined && value !== null) headers[key] = String(value);
	}

	let body: BodyInit | undefined;
	const rawBody = options.body;
	if (Buffer.isBuffer(rawBody)) {
		body = rawBody as unknown as BodyInit;
	} else if (rawBody !== undefined && options.json !== false && typeof rawBody === 'object') {
		body = JSON.stringify(rawBody);
		if (!Object.keys(headers).some((h) => h.toLowerCase() === 'content-type')) {
			headers['Content-Type'] = 'application/json';
		}
	} else if (rawBody !== undefined) {
		body = rawBody as BodyInit;
	}

	const res = await fetch(url, {
		method: (options.method as string) ?? 'GET',
		headers,
		body,
	});

	const text = await res.text();
	const contentType = res.headers.get('content-type') ?? '';
	let parsed: any = text;
	if (text && (contentType.includes('json') || text[0] === '{' || text[0] === '[')) {
		try {
			parsed = JSON.parse(text);
		} catch {
			/* keep raw text */
		}
	}

	if (options.returnFullResponse) {
		const responseHeaders: Record<string, string> = {};
		res.headers.forEach((value, key) => {
			responseHeaders[key] = value;
		});
		return { body: parsed, headers: responseHeaders, statusCode: res.status };
	}

	if (!res.ok) {
		const error: any = new Error(`Request failed with status ${res.status}: ${text}`);
		error.statusCode = res.status;
		error.response = { body: parsed, statusCode: res.status };
		throw error;
	}

	return parsed;
}

describe('Upload 3D Model (via node execute)', () => {
	// Credential data as a user would enter it: slug, not UUID. preAuthentication fills
	// in organizationUuid + orgToken (mutated in place, exactly like n8n's expirable token).
	const credentialData: ICredentialDataDecryptedObject = {
		email: config?.email ?? '',
		password: config?.password ?? '',
		organizationSlug: config?.organizationSlug ?? '',
		baseUrl: config?.baseUrl ?? '',
		organizationUuid: '',
		defaultClientUuid: '',
		orgToken: '',
	};

	let authPrepared = false;
	const createdProductUuids: string[] = [];

	/** Run the real credential preAuthentication once and cache the org token. */
	async function ensureAuth(): Promise<void> {
		if (authPrepared) return;
		const credential = new VntanaApi();
		const result = await credential.preAuthentication.call(
			{ helpers: { httpRequest: doHttp } } as unknown as IHttpRequestHelper,
			credentialData,
		);
		Object.assign(credentialData, result);
		authPrepared = true;
	}

	/** Authenticated request used for test setup/verification (not the code under test). */
	async function authedRequest(options: IHttpRequestOptions): Promise<any> {
		await ensureAuth();
		return doHttp({
			...options,
			headers: {
				Accept: 'application/json',
				...(options.headers ?? {}),
				'X-AUTH-TOKEN': `Bearer ${credentialData.orgToken as string}`,
			},
		});
	}

	let pipelineUuid = '';

	beforeAll(async () => {
		if (skip) return;
		await ensureAuth();

		// Resolve a pipeline UUID (upload3DModel requires one). Prefer the configured
		// pipeline; otherwise pick the first one the org exposes.
		if (config!.pipelineUuid) {
			pipelineUuid = config!.pipelineUuid;
		} else {
			const pipelines = await authedRequest({
				method: 'GET',
				url: `${config!.baseUrl}/v1/pipelines`,
				json: true,
			} as IHttpRequestOptions);
			pipelineUuid = pipelines?.response?.pipelines?.[0]?.uuid ?? '';
		}
	});

	afterAll(async () => {
		if (skip) return;
		for (const uuid of createdProductUuids) {
			try {
				await authedRequest({
					method: 'DELETE',
					url: `${config!.baseUrl}/v1/products/delete`,
					body: { uuid, clientUuid: config!.workspaceUuid },
					json: true,
				} as IHttpRequestOptions);
			} catch (error) {
				console.warn(`Failed to clean up product ${uuid}:`, (error as Error).message);
			}
		}
	});

	/** Build a faithful IExecuteFunctions for the upload3DModel operation. */
	function buildExecuteContext(productName: string): IExecuteFunctions {
		const glb = getTestGlb();
		const binaryMeta = {
			fileName: 'test-model.glb',
			mimeType: 'model/gltf-binary',
			fileExtension: 'glb',
			data: glb.toString('base64'),
		};

		const params: Record<string, unknown> = {
			resource: 'product',
			operation: 'upload3DModel',
			name: productName,
			pipelineUuid,
			clientUuid: config!.workspaceUuid,
			binaryPropertyName: 'data',
			optimizationMode: 'preset',
			optimizationPreset: 'webOptimized',
			additionalOptions: { status: 'DRAFT', description: 'n8n node e2e upload test' },
		};

		const ctx = {
			getInputData: () => [{ json: {}, binary: { data: binaryMeta } }],
			getNodeParameter: (name: string, _itemIndex: number, fallback?: unknown) =>
				name in params ? params[name] : fallback,
			getCredentials: async () => credentialData,
			getNode: () => ({
				name: 'VNTANA',
				type: 'n8n-nodes-vntana.vntana',
				typeVersion: 1,
				position: [0, 0],
				parameters: {},
			}),
			continueOnFail: () => false,
			helpers: {
				assertBinaryData: () => binaryMeta,
				getBinaryDataBuffer: async () => glb,
				httpRequest: doHttp,
				// Mirrors n8n: ensure the credential is authenticated, then apply the
				// credential's generic `authenticate` header (X-AUTH-TOKEN: Bearer <orgToken>).
				httpRequestWithAuthentication: async (
					_credentialType: string,
					options: IHttpRequestOptions,
				) => {
					await ensureAuth();
					return doHttp({
						...options,
						headers: {
							...(options.headers ?? {}),
							'X-AUTH-TOKEN': `Bearer ${credentialData.orgToken as string}`,
						},
					});
				},
			},
		};

		return ctx as unknown as IExecuteFunctions;
	}

	it.skipIf(skip)('uploads a GLB through the node and the product is created', async () => {
		expect(pipelineUuid, 'no pipeline available for upload').toBeTruthy();

		const productName = `n8n node e2e upload ${Date.now()}`;
		const node = new Vntana();

		const result = (await node.execute.call(
			buildExecuteContext(productName),
		)) as INodeExecutionData[][];

		const output = result[0][0].json as {
			success: boolean;
			product: { uuid: string; name: string };
			upload: { fileName: string; fileSize: number };
		};

		expect(output.success).toBe(true);
		expect(output.product.uuid).toBeTruthy();
		expect(output.upload.fileSize).toBeGreaterThan(0);

		createdProductUuids.push(output.product.uuid);

		// Independently confirm the product really exists on the platform.
		const verify = await authedRequest({
			method: 'GET',
			url: `${config!.baseUrl}/v1/products/${output.product.uuid}`,
			qs: { clientUuid: config!.workspaceUuid },
			json: true,
		} as IHttpRequestOptions);

		expect(verify.success).toBe(true);
		expect(verify.response.uuid).toBe(output.product.uuid);
		expect(verify.response.name).toBe(productName);
	});
});
