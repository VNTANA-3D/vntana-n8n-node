/**
 * E2E Tests for VNTANA Render Operations
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getTestConfig, shouldSkipE2E, TestConfig } from './setup';
import { VntanaTestClient, createTestClient } from './helpers/testClient';
import { getTestPng } from '../fixtures/binary';

describe('Render E2E', () => {
	let config: TestConfig;
	let client: VntanaTestClient;
	let testProduct: { uuid: string; clientUuid: string } | null = null;
	let createdProductUuids: string[] = [];

	beforeAll(async () => {
		if (shouldSkipE2E()) {
			return;
		}
		config = getTestConfig();
		client = createTestClient(config);

		// Try to create a test product, fall back to existing
		const response = await client.createProduct({
			name: `Render Test Product ${Date.now()}`,
			assetType: 'IMAGE',
			description: 'Product for render E2E tests',
		});

		if (response.success) {
			testProduct = { uuid: response.response.uuid, clientUuid: config.workspaceUuid };
			createdProductUuids.push(testProduct.uuid);
		} else {
			// Fall back to existing product or find one
			if (config.existingProductUuid) {
				testProduct = { uuid: config.existingProductUuid, clientUuid: config.workspaceUuid };
			} else {
				testProduct = await client.findExistingProduct();
			}
			if (testProduct) {
				console.log('Using existing product for render tests:', testProduct.uuid);
			}
		}
	});

	afterAll(async () => {
		// Cleanup created products
		if (client && createdProductUuids.length > 0) {
			for (const uuid of createdProductUuids) {
				try {
					await client.deleteProduct(uuid);
				} catch (error) {
					console.warn(`Failed to cleanup product ${uuid}:`, error);
				}
			}
		}
		if (client) {
			client.clearTokenCache();
		}
	});

	describe('Upload Render', () => {
		it.skipIf(shouldSkipE2E())('should upload a render image to a product', async () => {
			if (!testProduct) {
				console.log('Render upload test skipped - test product not created (API may not support create)');
				return;
			}

			// Step 1: Get signed URL for render upload
			const pngBuffer = getTestPng();
			const signedUrlResponse = await client.getResourceUploadSignedUrl(
				testProduct.uuid,
				'test-render.png',
				pngBuffer.length,
				'image/png',
				'RENDER',
				testProduct.clientUuid,
			);

			if (!signedUrlResponse.success) {
				const errorMsg = signedUrlResponse.errors?.[0];
				console.log('Signed URL request failed:', typeof errorMsg === 'string' ? errorMsg : errorMsg?.message || JSON.stringify(signedUrlResponse.errors));
				console.log('Write operations may not be available for this account');
				return;
			}

			expect(signedUrlResponse.response.location).toBeDefined();
			expect(signedUrlResponse.response.blobId).toBeDefined();
			expect(signedUrlResponse.response.requestUuid).toBeDefined();

			// Step 2: Upload to signed URL
			await client.uploadToSignedUrl(
				signedUrlResponse.response.location,
				pngBuffer,
				'image/png',
			);

			// Verify upload completed (no error thrown)
		});
	});

	describe('Download Render', () => {
		it.skipIf(shouldSkipE2E())('should search for attachments on a product', async () => {
			if (!testProduct) {
				console.log('Attachment search test skipped - test product not created');
				return;
			}

			// First, upload a render so we have something to find
			const pngBuffer = getTestPng();
			const signedUrlResponse = await client.getResourceUploadSignedUrl(
				testProduct.uuid,
				'download-test-render.png',
				pngBuffer.length,
				'image/png',
				'RENDER',
				testProduct.clientUuid,
			);

			if (signedUrlResponse.success) {
				await client.uploadToSignedUrl(
					signedUrlResponse.response.location,
					pngBuffer,
					'image/png',
				);
			}

			// Now search for attachments
			const searchResponse = await client.searchAttachments(testProduct.uuid);

			expect(searchResponse.success).toBe(true);
			expect(searchResponse.response).toBeDefined();
			expect(searchResponse.response.grid).toBeInstanceOf(Array);
		});

		it.skipIf(shouldSkipE2E())('should download a render if one exists', async () => {
			if (!testProduct) {
				console.log('Render download test skipped - test product not created');
				return;
			}

			// Search for renders on the product
			const searchResponse = await client.searchAttachments(testProduct.uuid);

			if (!searchResponse.success) {
				return;
			}

			// Find a RENDER attachment
			const renderAttachment = searchResponse.response.grid.find(
				(att: any) => att.entityType === 'RENDER',
			);

			if (renderAttachment) {
				// Try to download
				const buffer = await client.downloadAttachment(renderAttachment.blobId);
				expect(buffer).toBeInstanceOf(Buffer);
				expect(buffer.length).toBeGreaterThan(0);
			} else {
				console.warn('No render attachment found to download');
			}
		});
	});
});
