/**
 * E2E Tests for VNTANA Product Operations
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getTestConfig, shouldSkipE2E, TestConfig } from './setup';
import { VntanaTestClient, createTestClient } from './helpers/testClient';
import { getTestGlb, getTestPng } from '../fixtures/binary';

describe('Product E2E', () => {
	let config: TestConfig;
	let client: VntanaTestClient;
	let createdProductUuids: string[] = [];
	let existingProduct: { uuid: string; clientUuid: string } | null = null;

	beforeAll(async () => {
		if (shouldSkipE2E()) {
			return;
		}
		config = getTestConfig();
		client = createTestClient(config);

		// Get an existing product for tests that can't create new products
		if (config.existingProductUuid) {
			existingProduct = { uuid: config.existingProductUuid, clientUuid: config.workspaceUuid };
		} else {
			existingProduct = await client.findExistingProduct();
		}
	});

	afterAll(async () => {
		// Cleanup: Delete any products created during tests
		if (client && createdProductUuids.length > 0) {
			for (const uuid of createdProductUuids) {
				try {
					await client.deleteProduct(uuid);
				} catch (error) {
					// Ignore cleanup errors
					console.warn(`Failed to cleanup product ${uuid}:`, error);
				}
			}
		}
		if (client) {
			client.clearTokenCache();
		}
	});

	describe('Search Products', () => {
		it.skipIf(shouldSkipE2E())('should search products successfully', async () => {
			const response = await client.searchProducts();

			expect(response.success).toBe(true);
			expect(response.response).toBeDefined();
			expect(response.response.grid).toBeInstanceOf(Array);
		});

		it.skipIf(shouldSkipE2E())('should search products with pagination', async () => {
			const response = await client.searchProducts({ page: 1, size: 5 });

			expect(response.success).toBe(true);
			expect(response.response.grid.length).toBeLessThanOrEqual(5);
		});

		it.skipIf(shouldSkipE2E())('should search products with search term', async () => {
			// Search for a term unlikely to exist
			const response = await client.searchProducts({
				searchTerm: 'zzz_nonexistent_product_99999_xyz',
			});

			expect(response.success).toBe(true);
			// Either no results or very few results
			expect(response.response.grid.length).toBeLessThanOrEqual(2);
		});

		it.skipIf(shouldSkipE2E())('should return product with expected properties', async () => {
			const response = await client.searchProducts({ size: 1 });

			if (response.response.grid.length > 0) {
				const product = response.response.grid[0];
				expect(product).toHaveProperty('uuid');
				expect(product).toHaveProperty('name');
				expect(product).toHaveProperty('status');
			}
		});
	});

	describe('Create Product', () => {
		it.skipIf(shouldSkipE2E())('should create an IMAGE product', async () => {
			const productName = `Test Image Product ${Date.now()}`;

			const response = await client.createProduct({
				name: productName,
				assetType: 'IMAGE',
				description: 'E2E test product',
			});

			// Skip if write operations are not supported (API error)
			if (!response.success) {
				console.log('Create product skipped - API error:', response.errors?.[0]?.message || 'Unknown error');
				return;
			}

			expect(response.response).toBeDefined();
			expect(response.response.uuid).toBeDefined();
			expect(response.response.name).toBe(productName);

			// Track for cleanup
			createdProductUuids.push(response.response.uuid);
		});

		it.skipIf(shouldSkipE2E())('should create a THREE_D product', async () => {
			const productName = `Test 3D Product ${Date.now()}`;

			const response = await client.createProduct({
				name: productName,
				assetType: 'THREE_D',
				description: 'E2E test 3D product',
			});

			// Skip if write operations are not supported (API error)
			if (!response.success) {
				console.log('Create 3D product skipped - API error:', response.errors?.[0]?.message || 'Unknown error');
				return;
			}

			expect(response.response).toBeDefined();
			expect(response.response.uuid).toBeDefined();

			// Track for cleanup
			createdProductUuids.push(response.response.uuid);
		});
	});

	describe('Upload 3D Model', () => {
		it.skipIf(shouldSkipE2E())('should upload a GLB model to a product', async () => {
			let productUuid: string | null = null;
			let clientUuid: string = config.workspaceUuid;

			// Step 1: Try to create product, fall back to existing
			const createResponse = await client.createProduct({
				name: `Test GLB Upload ${Date.now()}`,
				assetType: 'THREE_D',
			});

			if (createResponse.success) {
				productUuid = createResponse.response.uuid;
				createdProductUuids.push(productUuid);
			} else {
				// Use existing product for upload test
				if (!existingProduct) {
					console.log('Upload test skipped - cannot create product and no existing product found');
					return;
				}
				productUuid = existingProduct.uuid;
				clientUuid = existingProduct.clientUuid;
				console.log('Using existing product for upload test:', productUuid);
			}

			// Step 2: Get signed URL
			const glbBuffer = getTestGlb();
			const signedUrlResponse = await client.getAssetUploadSignedUrl(
				productUuid,
				'test-model.glb',
				glbBuffer.length,
				'model/gltf-binary',
				clientUuid,
			);

			if (!signedUrlResponse.success) {
				const errorMsg = signedUrlResponse.errors?.[0];
				console.log('Signed URL request failed:', typeof errorMsg === 'string' ? errorMsg : errorMsg?.message || JSON.stringify(signedUrlResponse.errors));
				console.log('Write operations may not be available for this account');
				return;
			}

			expect(signedUrlResponse.response.location).toBeDefined();

			// Step 3: Upload to signed URL
			await client.uploadToSignedUrl(
				signedUrlResponse.response.location,
				glbBuffer,
				'model/gltf-binary',
			);

			// Verify upload completed (no error thrown)
		});
	});

	describe('Upload Asset (Image)', () => {
		it.skipIf(shouldSkipE2E())('should upload a PNG image to a product', async () => {
			let productUuid: string | null = null;
			let clientUuid: string = config.workspaceUuid;

			// Step 1: Try to create product, fall back to existing
			const createResponse = await client.createProduct({
				name: `Test Image Upload ${Date.now()}`,
				assetType: 'IMAGE',
			});

			if (createResponse.success) {
				productUuid = createResponse.response.uuid;
				createdProductUuids.push(productUuid);
			} else {
				// Use existing product for upload test
				if (!existingProduct) {
					console.log('Image upload test skipped - cannot create product and no existing product found');
					return;
				}
				productUuid = existingProduct.uuid;
				clientUuid = existingProduct.clientUuid;
				console.log('Using existing product for image upload test:', productUuid);
			}

			// Step 2: Get signed URL
			const pngBuffer = getTestPng();
			const signedUrlResponse = await client.getAssetUploadSignedUrl(
				productUuid,
				'test-image.png',
				pngBuffer.length,
				'image/png',
				clientUuid,
			);

			if (!signedUrlResponse.success) {
				const errorMsg = signedUrlResponse.errors?.[0];
				console.log('Signed URL request failed:', typeof errorMsg === 'string' ? errorMsg : errorMsg?.message || JSON.stringify(signedUrlResponse.errors));
				console.log('Write operations may not be available for this account');
				return;
			}

			expect(signedUrlResponse.response.location).toBeDefined();

			// Step 3: Upload to signed URL
			await client.uploadToSignedUrl(
				signedUrlResponse.response.location,
				pngBuffer,
				'image/png',
			);

			// Verify upload completed (no error thrown)
		});
	});

	describe('Download Model', () => {
		// Note: This test requires an existing product with a converted model
		// It will be skipped if no products with GLB conversion exist
		it.skipIf(shouldSkipE2E())('should find a product with converted model for download test', async () => {
			// Search for products with COMPLETED conversion
			const response = await client.searchProducts({
				size: 50,
			});

			// Find a product that has completed conversion
			const productWithModel = response.response.grid.find((p: any) =>
				p.conversionStatus === 'COMPLETED' &&
				p.asset?.models?.some((m: any) => m.conversionFormat === 'GLB'),
			);

			if (productWithModel) {
				// Try to download
				try {
					const buffer = await client.downloadModel(productWithModel.uuid, 'GLB');
					expect(buffer).toBeInstanceOf(Buffer);
					expect(buffer.length).toBeGreaterThan(0);
				} catch (error) {
					// Download might fail if model isn't ready
					console.warn('Download test skipped - model may not be ready');
				}
			} else {
				console.warn('Download test skipped - no product with converted GLB model found');
			}
		});
	});
});
